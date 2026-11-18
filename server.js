const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 1111;
const BASE_DIR = path.resolve(__dirname);
const DATA_DIR = path.join(BASE_DIR, 'data');
const UPLOAD_DIR = path.join(BASE_DIR, 'assets', 'uploads');
const CMS_FILE = path.join(DATA_DIR, 'cms.json');
const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');

const SESSION_COOKIE = 'nt_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NileTrails@2026';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const BLOCKED_TOP_ENTRIES = new Set([
  'data', 'docs', 'previews', 'node_modules',
  'server.js', 'package.json', 'package-lock.json', 'dockerfile', 'readme_ar.md'
]);

// --- Atomic File Utilities & Auth ---
function atomicWriteJson(filePath, obj) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(obj, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash: derived };
}

function loadOrInitAuth() {
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      if (parsed && parsed.salt && parsed.hash) return parsed;
    } catch {}
  }
  const { salt, hash } = hashPassword(DEFAULT_ADMIN_PASSWORD);
  const record = {
    salt,
    hash,
    isDefault: !process.env.ADMIN_PASSWORD,
    updatedAt: new Date().toISOString()
  };
  atomicWriteJson(AUTH_FILE, record);
  return record;
}

function verifyPassword(plain, record) {
  if (!plain || !record?.salt || !record?.hash) return false;
  try {
    const candidate = crypto.scryptSync(String(plain), record.salt, 64);
    const stored = Buffer.from(record.hash, 'hex');
    return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
  } catch {
    return false;
  }
}

let authRecord = loadOrInitAuth();
const activeSessions = new Map(); // token -> { expiresAt }
const loginAttempts = new Map();  // ip -> { count, resetAt }
const enquiryRate = new Map();    // ip -> { count, resetAt }

function getClientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(bucketMap, key, maxHits, windowMs) {
  const now = Date.now();
  const entry = bucketMap.get(key);
  if (!entry || now > entry.resetAt) {
    bucketMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxHits) return false;
  entry.count += 1;
  return true;
}

function parseCookies(req) {
  const out = {};
  const raw = String(req.headers.cookie || '');
  raw.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      out[k] = v;
    }
  });
  return out;
}

function isAdminRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;
  const sess = activeSessions.get(token);
  if (!sess) return false;
  if (Date.now() > sess.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function buildCookieHeader(req, token, maxAgeSec) {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || Boolean(req.socket?.encrypted);
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSec}`
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

function readCmsFromDisk() {
  if (!fs.existsSync(CMS_FILE)) return null;
  return JSON.parse(fs.readFileSync(CMS_FILE, 'utf-8'));
}

function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      total += chunk.length;
      if (total > maxBytes) {
        aborted = true;
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!aborted) resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    req.on('error', err => {
      if (!aborted) reject(err);
    });
  });
}

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...extra
  };
}

function sendJson(res, status, data, extraHeaders = {}) {
  const payload = Buffer.from(JSON.stringify(data), 'utf-8');
  res.writeHead(status, securityHeaders({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
    ...extraHeaders
  }));
  res.end(payload);
}

function sanitizeText(val, maxLen = 500) {
  return String(val ?? '').trim().slice(0, maxLen);
}

function validateEnquiry(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'Invalid booking payload' };
  const clientName = sanitizeText(raw.clientName, 140);
  const clientEmail = sanitizeText(raw.clientEmail, 160);
  if (clientName.length < 2) return { error: 'Please provide your full name' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clientEmail)) return { error: 'Please provide a valid email address' };

  const selectedAddons = Array.isArray(raw.selectedAddons)
    ? raw.selectedAddons.slice(0, 40).map(a => ({
        id: sanitizeText(a?.id, 80),
        title: sanitizeText(a?.title, 180),
        price: Number(a?.price) || 0
      }))
    : [];

  const refId = sanitizeText(raw.id, 40) || ('NT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
  return {
    enquiry: {
      id: refId,
      createdAt: sanitizeText(raw.createdAt, 40) || new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'New',
      vesselSlug: sanitizeText(raw.vesselSlug, 100),
      vesselTitle: sanitizeText(raw.vesselTitle, 180) || 'NileTrails Enquiry',
      programId: sanitizeText(raw.programId, 100),
      programSlug: sanitizeText(raw.programSlug, 100),
      programTitle: sanitizeText(raw.programTitle, 200),
      season: sanitizeText(raw.season, 60),
      cabinName: sanitizeText(raw.cabinName, 140),
      bedConfig: sanitizeText(raw.bedConfig, 100),
      checkInDate: sanitizeText(raw.checkInDate, 40),
      dateFlexibility: sanitizeText(raw.dateFlexibility, 80),
      adults: sanitizeText(raw.adults ?? 2, 20),
      children: Number(raw.children) || 0,
      selectedAddons,
      estimatedTotal: typeof raw.estimatedTotal === 'number' ? raw.estimatedTotal : sanitizeText(raw.estimatedTotal, 60),
      clientName,
      clientEmail,
      clientPhone: sanitizeText(raw.clientPhone, 60),
      nationality: sanitizeText(raw.nationality, 80),
      passportReady: sanitizeText(raw.passportReady, 100),
      dietary: sanitizeText(raw.dietary, 100),
      occasion: sanitizeText(raw.occasion, 120),
      flightTransfer: sanitizeText(raw.flightTransfer, 160),
      notes: sanitizeText(raw.notes, 2000)
    }
  };
}

let diskWriteQueue = Promise.resolve();
function enqueueDiskWrite(fn) {
  const next = diskWriteQueue.then(fn, fn);
  diskWriteQueue = next.catch(() => {});
  return next;
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch {
      res.writeHead(400, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('400 Bad Request');
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, securityHeaders());
      res.end();
      return;
    }

    // ==================== AUTH API ====================
    if (urlPath === '/api/auth/me' && req.method === 'GET') {
      const authed = isAdminRequest(req);
      sendJson(res, 200, {
        authenticated: authed,
        isDefaultPassword: authed ? Boolean(authRecord.isDefault) : false
      });
      return;
    }

    if (urlPath === '/api/auth/login' && req.method === 'POST') {
      const ip = getClientIp(req);
      if (!checkRateLimit(loginAttempts, ip, 12, 15 * 60 * 1000)) {
        sendJson(res, 429, { error: 'محاولات دخول كثيرة، يرجى الانتظار 15 دقيقة.' });
        return;
      }
      try {
        const body = await readBody(req, 16 * 1024);
        const parsed = JSON.parse(body || '{}');
        if (!verifyPassword(parsed.password, authRecord)) {
          sendJson(res, 401, { error: 'كلمة المرور غير صحيحة' });
          return;
        }
        loginAttempts.delete(ip);
        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
        sendJson(res, 200, {
          ok: true,
          authenticated: true,
          isDefaultPassword: Boolean(authRecord.isDefault)
        }, {
          'Set-Cookie': buildCookieHeader(req, token, Math.floor(SESSION_TTL_MS / 1000))
        });
      } catch (e) {
        sendJson(res, 400, { error: 'طلب غير صالح' });
      }
      return;
    }

    if (urlPath === '/api/auth/logout' && req.method === 'POST') {
      const cookies = parseCookies(req);
      if (cookies[SESSION_COOKIE]) activeSessions.delete(cookies[SESSION_COOKIE]);
      sendJson(res, 200, { ok: true, authenticated: false }, {
        'Set-Cookie': buildCookieHeader(req, '', 0)
      });
      return;
    }

    if (urlPath === '/api/auth/password' && req.method === 'POST') {
      if (!isAdminRequest(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }
      try {
        const body = await readBody(req, 16 * 1024);
        const parsed = JSON.parse(body || '{}');
        if (!verifyPassword(parsed.currentPassword, authRecord)) {
          sendJson(res, 400, { error: 'كلمة المرور الحالية غير صحيحة' });
          return;
        }
        const nextPw = String(parsed.newPassword || '');
        if (nextPw.length < 6 || nextPw.length > 128) {
          sendJson(res, 400, { error: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل' });
          return;
        }
        const { salt, hash } = hashPassword(nextPw);
        authRecord = { salt, hash, isDefault: false, updatedAt: new Date().toISOString() };
        await enqueueDiskWrite(() => atomicWriteJson(AUTH_FILE, authRecord));
        sendJson(res, 200, { ok: true, isDefaultPassword: false });
      } catch (e) {
        sendJson(res, 400, { error: e.message });
      }
      return;
    }

    // ==================== CMS & BOOKINGS API ====================
    if (urlPath === '/api/cms' && req.method === 'GET') {
      try {
        const data = readCmsFromDisk();
        if (!data) {
          sendJson(res, 404, { initialized: false });
          return;
        }
        if (isAdminRequest(req)) {
          sendJson(res, 200, data);
        } else {
          // Strip private customer PII before returning to public visitors
          const publicPayload = { ...data, enquiries: [] };
          sendJson(res, 200, publicPayload);
        }
      } catch (e) {
        sendJson(res, 500, { error: 'Failed to read CMS data' });
      }
      return;
    }

    if (urlPath === '/api/cms' && (req.method === 'POST' || req.method === 'PUT')) {
      if (!isAdminRequest(req)) {
        sendJson(res, 401, { error: 'Unauthorized — admin login required' });
        return;
      }
      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          sendJson(res, 400, { error: 'Invalid CMS JSON payload' });
          return;
        }
        const allowEnquirySync = req.headers['x-nt-sync-enquiries'] === '1';
        await enqueueDiskWrite(() => {
          const existing = readCmsFromDisk();
          if (existing && Array.isArray(existing.enquiries) && !allowEnquirySync) {
            // Preserve live customer bookings so CMS edits never overwrite concurrent enquiries
            parsed.enquiries = existing.enquiries;
          }
          atomicWriteJson(CMS_FILE, parsed);
        });
        sendJson(res, 200, { ok: true });
      } catch (e) {
        sendJson(res, 400, { error: e.message });
      }
      return;
    }

    if (urlPath === '/api/enquiries' && req.method === 'POST') {
      const ip = getClientIp(req);
      if (!checkRateLimit(enquiryRate, ip, 20, 15 * 60 * 1000)) {
        sendJson(res, 429, { error: 'Too many requests. Please try again in a few minutes or contact us via WhatsApp.' });
        return;
      }
      try {
        const body = await readBody(req, 256 * 1024);
        const raw = JSON.parse(body || '{}');
        const validated = validateEnquiry(raw);
        if (validated.error) {
          sendJson(res, 400, { error: validated.error });
          return;
        }
        const enquiry = validated.enquiry;
        await enqueueDiskWrite(() => {
          const cms = readCmsFromDisk() || { version: 3, enquiries: [] };
          if (!Array.isArray(cms.enquiries)) cms.enquiries = [];
          cms.enquiries.unshift(enquiry);
          atomicWriteJson(CMS_FILE, cms);
        });
        sendJson(res, 201, { ok: true, enquiry });
      } catch (e) {
        sendJson(res, 400, { error: e.message });
      }
      return;
    }

    if (urlPath.startsWith('/api/enquiries/') && (req.method === 'PATCH' || req.method === 'DELETE')) {
      if (!isAdminRequest(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }
      const targetId = decodeURIComponent(urlPath.slice('/api/enquiries/'.length));
      if (!targetId) {
        sendJson(res, 400, { error: 'Missing enquiry ID' });
        return;
      }
      try {
        let patchData = {};
        if (req.method === 'PATCH') {
          const body = await readBody(req, 32 * 1024);
          patchData = JSON.parse(body || '{}');
        }
        let found = false;
        await enqueueDiskWrite(() => {
          const cms = readCmsFromDisk();
          if (!cms || !Array.isArray(cms.enquiries)) return;
          const idx = cms.enquiries.findIndex(e => String(e.id) === targetId);
          if (idx < 0) return;
          found = true;
          if (req.method === 'DELETE') {
            cms.enquiries.splice(idx, 1);
          } else {
            const allowedStatuses = new Set(['New', 'Confirmed', 'Completed', 'Cancelled']);
            if (allowedStatuses.has(patchData.status)) {
              cms.enquiries[idx].status = patchData.status;
            }
          }
          atomicWriteJson(CMS_FILE, cms);
        });
        if (!found) {
          sendJson(res, 404, { error: 'Enquiry not found' });
          return;
        }
        sendJson(res, 200, { ok: true });
      } catch (e) {
        sendJson(res, 400, { error: e.message });
      }
      return;
    }

    if (urlPath === '/api/cms/reset' && req.method === 'POST') {
      if (!isAdminRequest(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }
      try {
        await enqueueDiskWrite(() => {
          if (fs.existsSync(CMS_FILE)) fs.unlinkSync(CMS_FILE);
        });
        sendJson(res, 200, { ok: true });
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
      return;
    }

    if (urlPath === '/api/upload' && req.method === 'POST') {
      if (!isAdminRequest(req)) {
        sendJson(res, 401, { error: 'Unauthorized — admin login required' });
        return;
      }
      try {
        const body = await readBody(req, 15 * 1024 * 1024);
        const parsed = JSON.parse(body || '{}');
        const rawName = String(parsed.filename || 'upload.jpg');
        const ext = path.extname(rawName).toLowerCase();
        // Exclude .svg to prevent stored XSS on same origin
        const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm']);
        if (!allowed.has(ext)) {
          sendJson(res, 400, { error: 'Unsupported media file type (allowed: PNG, JPG, WEBP, GIF, MP4, WEBM)' });
          return;
        }
        const cleanBase = path.basename(rawName, ext).toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 48) || 'media';
        const safeName = `${Date.now()}-${cleanBase}${ext}`;
        const rawData = String(parsed.dataBase64 || '');
        const base64Payload = rawData.includes(',') ? rawData.split(',')[1] : rawData;
        if (!base64Payload) {
          sendJson(res, 400, { error: 'Missing file payload' });
          return;
        }
        const fileBuf = Buffer.from(base64Payload, 'base64');
        if (!fileBuf.length) {
          sendJson(res, 400, { error: 'Empty file payload' });
          return;
        }
        const targetPath = path.join(UPLOAD_DIR, safeName);
        fs.writeFileSync(targetPath, fileBuf);
        sendJson(res, 201, { ok: true, url: `assets/uploads/${safeName}` });
      } catch (e) {
        sendJson(res, 400, { error: e.message });
      }
      return;
    }

    if (urlPath.startsWith('/api/')) {
      sendJson(res, 404, { error: 'API route not found' });
      return;
    }

    // ==================== STATIC FILES (HARDENED + RANGE STREAMING) ====================
    let reqRel = urlPath === '/' || urlPath === '' ? '/index.html' : urlPath;
    const segments = reqRel.split(/[\/\\]+/).filter(Boolean);
    if (
      segments.some(seg => seg.startsWith('.') || seg === '..') ||
      (segments.length > 0 && BLOCKED_TOP_ENTRIES.has(segments[0].toLowerCase()))
    ) {
      res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('404 Not Found');
      return;
    }

    let filePath = path.resolve(BASE_DIR, '.' + reqRel);
    if (!filePath.startsWith(BASE_DIR + path.sep) && filePath !== path.join(BASE_DIR, 'index.html')) {
      res.writeHead(403, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
        res.end('404 Not Found');
        return;
      }

      const serveFile = (resolvedPath, fileStats) => {
        const ext = path.extname(resolvedPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const isMedia = ext === '.mp4' || ext === '.webm' || ext === '.webp' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif';
        const cacheHeader = isMedia ? 'public, max-age=86400' : 'no-cache';
        const fileSize = fileStats.size;

        const rangeHeader = req.headers.range;
        if (rangeHeader && (ext === '.mp4' || ext === '.webm')) {
          const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
          if (match) {
            const start = match[1] ? parseInt(match[1], 10) : 0;
            const end = match[2] ? Math.min(parseInt(match[2], 10), fileSize - 1) : fileSize - 1;
            if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
              res.writeHead(416, securityHeaders({ 'Content-Range': `bytes */${fileSize}` }));
              res.end();
              return;
            }
            res.writeHead(206, securityHeaders({
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': (end - start) + 1,
              'Content-Type': contentType,
              'Cache-Control': cacheHeader
            }));
            fs.createReadStream(resolvedPath, { start, end }).pipe(res);
            return;
          }
        }

        res.writeHead(200, securityHeaders({
          'Content-Type': contentType,
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Cache-Control': cacheHeader
        }));
        fs.createReadStream(resolvedPath).pipe(res);
      };

      if (stats.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        fs.stat(indexPath, (idxErr, idxStats) => {
          if (idxErr || !idxStats.isFile()) {
            res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
            res.end('404 Not Found');
            return;
          }
          serveFile(indexPath, idxStats);
        });
        return;
      }

      serveFile(filePath, stats);
    });
  } catch (err) {
    console.error('Unhandled request error:', err);
    if (!res.headersSent) {
      res.writeHead(500, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
    }
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`NileTrails Atelier CMS & Server running at http://localhost:${PORT}/`);
});
