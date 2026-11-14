const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 1111;
const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'data');
const UPLOAD_DIR = path.join(BASE_DIR, 'assets', 'uploads');
const CMS_FILE = path.join(DATA_DIR, 'cms.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > maxBytes) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const payload = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // API Routes for CMS & Bookings
  if (urlPath === '/api/cms' && req.method === 'GET') {
    if (fs.existsSync(CMS_FILE)) {
      try {
        const raw = fs.readFileSync(CMS_FILE, 'utf-8');
        sendJson(res, 200, JSON.parse(raw));
        return;
      } catch (e) {
        sendJson(res, 500, { error: 'Failed to read CMS data' });
        return;
      }
    } else {
      sendJson(res, 404, { initialized: false });
      return;
    }
  }

  if (urlPath === '/api/cms' && (req.method === 'POST' || req.method === 'PUT')) {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      fs.writeFileSync(CMS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return;
  }

  if (urlPath === '/api/enquiries' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const enquiry = JSON.parse(body);
      let cms = {};
      if (fs.existsSync(CMS_FILE)) {
        cms = JSON.parse(fs.readFileSync(CMS_FILE, 'utf-8'));
      }
      if (!Array.isArray(cms.enquiries)) {
        cms.enquiries = [];
      }
      cms.enquiries.unshift(enquiry);
      fs.writeFileSync(CMS_FILE, JSON.stringify(cms, null, 2), 'utf-8');
      sendJson(res, 201, { ok: true, enquiry });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return;
  }

  if (urlPath === '/api/cms/reset' && req.method === 'POST') {
    try {
      if (fs.existsSync(CMS_FILE)) {
        fs.unlinkSync(CMS_FILE);
      }
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  if (urlPath === '/api/upload' && req.method === 'POST') {
    try {
      const body = await readBody(req, 15 * 1024 * 1024);
      const parsed = JSON.parse(body || '{}');
      const rawName = String(parsed.filename || 'upload.jpg');
      const ext = path.extname(rawName).toLowerCase();
      const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4', '.webm']);
      if (!allowed.has(ext)) {
        sendJson(res, 400, { error: 'Unsupported media file type' });
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
      const targetPath = path.join(UPLOAD_DIR, safeName);
      fs.writeFileSync(targetPath, Buffer.from(base64Payload, 'base64'));
      sendJson(res, 201, { ok: true, url: `assets/uploads/${safeName}` });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return;
  }

  // Static Files
  let decodedPath = urlPath;
  if (decodedPath === '/' || decodedPath === '') {
    decodedPath = '/index.html';
  }

  const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(BASE_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NileTrails Atelier CMS & Server running at http://localhost:${PORT}/`);
});
