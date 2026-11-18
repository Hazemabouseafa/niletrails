window.NileTrailsAdmin = (() => {
  'use strict';

  const CMS = window.NileTrailsCMS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let activeTab = 'bookings';
  let selectedVesselId = null;
  let editingPageId = null;
  let searchQuery = '';
  let bookingStatusFilter = 'all';
  let sightLocationFilter = 'all';
  let faqScopeFilter = 'all';
  let collectionSubTab = 'journeys';
  let lastSavedTime = '';
  let toastTimer = null;

  const PRESET_IMAGES = [
    ['Nile Sailing (Dahabiya)', 'assets/nile-sailing.webp'],
    ['Ancient Egyptian Temple', 'assets/egypt-temple.webp'],
    ['Luxury Nile Cruise Ship', 'assets/nile-cruise.webp'],
    ['Karnak Temple Complex', 'assets/sight-karnak.jpg'],
    ['Temple of Hatshepsut', 'assets/sight-hatshepsut.jpg'],
    ['Valley of the Queens', 'assets/sight-queens.jpg']
  ];

  const MAX_HISTORY = 25;
  let undoStack = [];
  let redoStack = [];
  const captureSnapshot = () => JSON.stringify(CMS.getState());
  const pushUndoSnapshot = (snap) => {
    if (!snap) return;
    undoStack.push(snap);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
  };
  const canUndo = () => undoStack.length > 0;
  const canRedo = () => redoStack.length > 0;

  async function undo(onDone) {
    if (!undoStack.length) {
      showToast('لا توجد خطوات للتراجع', 'error');
      return false;
    }
    redoStack.push(captureSnapshot());
    const prev = undoStack.pop();
    await CMS.setState(JSON.parse(prev));
    showToast('↩ تم التراجع عن آخر تعديل');
    if (typeof onDone === 'function') onDone();
    return true;
  }

  async function redo(onDone) {
    if (!redoStack.length) {
      showToast('لا توجد خطوات للإعادة', 'error');
      return false;
    }
    undoStack.push(captureSnapshot());
    const next = redoStack.pop();
    await CMS.setState(JSON.parse(next));
    showToast('↪ تم إعادة التعديل');
    if (typeof onDone === 'function') onDone();
    return true;
  }

  const LUXURY_THEME_PRESETS = {
    'royal-navy': { label: 'Royal Nile Navy', navy: '#0d2a3a', gold: '#c7a36a', cream: '#fcfaf6', fontScale: 1, radius: 2 },
    'desert-sand': { label: 'Desert Terracotta', navy: '#2c221e', gold: '#c48f56', cream: '#faf5ed', fontScale: 1, radius: 4 },
    'emerald-nile': { label: 'Emerald Sanctuary', navy: '#0d332d', gold: '#c8a45d', cream: '#f6faf7', fontScale: 1.02, radius: 6 },
    'obsidian-gold': { label: 'Obsidian Night', navy: '#141923', gold: '#d4af6a', cream: '#f8f7f4', fontScale: 1, radius: 2 }
  };

  function resolvePathContainer(root, rawPath) {
    const parts = [];
    const re = /([^.[\]]+)|\[([^\]]+)\]/g;
    let m;
    while ((m = re.exec(rawPath)) !== null) {
      parts.push(m[1] !== undefined ? m[1] : { filter: m[2] });
    }
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur == null) return null;
      const seg = parts[i];
      if (typeof seg === 'string') {
        cur = cur[seg];
      } else if (Array.isArray(cur)) {
        const [fk, fv] = seg.filter.split('=');
        cur = cur.find(item => item && String(item[fk]) === String(fv));
      } else {
        return null;
      }
    }
    return cur ? { container: cur, key: parts[parts.length - 1] } : null;
  }

  function getPathValue(root, rawPath) {
    const res = resolvePathContainer(root, rawPath);
    if (!res || typeof res.key !== 'string') return undefined;
    return res.container[res.key];
  }

  function setPathValue(root, rawPath, value) {
    const res = resolvePathContainer(root, rawPath);
    if (!res || typeof res.key !== 'string') return false;
    res.container[res.key] = value;
    return true;
  }

  async function saveInlinePath(rawPath, newValue, onDone) {
    const st = CMS.getState();
    const curVal = getPathValue(st, rawPath);
    if (String(curVal ?? '') === String(newValue ?? '')) return false;
    const beforeSnap = captureSnapshot();
    if (!setPathValue(st, rawPath, newValue)) return false;
    await finishSave(typeof onDone === 'function' ? onDone : null, 'تم حفظ النص مباشرة ✓', beforeSnap);
    return true;
  }

  function getTextOverride(key) {
    const ov = CMS.getState().textOverrides;
    return ov && typeof ov === 'object' ? ov[key] : undefined;
  }

  async function saveTextOverride(key, newValue, onDone) {
    if (!key) return false;
    const st = CMS.getState();
    if (!st.textOverrides || typeof st.textOverrides !== 'object') st.textOverrides = {};
    const curVal = st.textOverrides[key];
    if (String(curVal ?? '') === String(newValue ?? '')) return false;
    const beforeSnap = captureSnapshot();
    st.textOverrides[key] = newValue;
    await finishSave(typeof onDone === 'function' ? onDone : null, 'تم حفظ النص مباشرة ✓', beforeSnap);
    return true;
  }

  function extractItemPreview(val) {
    if (typeof val === 'string') return val.replace(/\s+/g, ' ').trim().slice(0, 56);
    if (val && typeof val === 'object') {
      return String(val.title || val.name || val.question || val.stop || val.heading || val.day || '').replace(/\s+/g, ' ').trim().slice(0, 56);
    }
    return '';
  }

  function cloneSampleForList(sample, listPath, existingArr) {
    const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (typeof sample === 'string') {
      const cleanBase = sample.replace(/\s*\(جديد.*?\)\s*$|\s*\(New(?:\s+\d+)?\)\s*$/i, '').trim() || 'New Item';
      return `${cleanBase} (New)`;
    }
    if (!sample || typeof sample !== 'object') return sample;
    const copy = JSON.parse(JSON.stringify(sample));
    if (Object.prototype.hasOwnProperty.call(copy, 'id')) {
      const prefix = String(copy.id || 'item').split('-')[0].slice(0, 10) || 'item';
      copy.id = `${prefix}-${uid}`;
    }
    if (Object.prototype.hasOwnProperty.call(copy, 'slug')) {
      const cleanSlug = String(copy.slug || 'item').replace(/-[a-z0-9]{4,8}$/i, '').slice(0, 32);
      copy.slug = `${cleanSlug}-${uid.slice(-4)}`;
    }
    if (String(listPath).endsWith('.itinerary')) {
      const nextNum = (Array.isArray(existingArr) ? existingArr.length : 0) + 1;
      const baseTitle = String(copy.title || 'Sailing & Excursions').replace(/^Day\s*\d+\s*[—:-]?\s*/i, '').replace(/\s*\(New\)\s*$/i, '').trim();
      copy.day = `Day ${nextNum}`;
      copy.title = `Day ${nextNum} — ${baseTitle || 'New Day'}`;
    } else if (typeof copy.title === 'string') {
      copy.title = copy.title.replace(/\s*\(New\)\s*$/i, '') + ' (New)';
    } else if (typeof copy.name === 'string') {
      copy.name = copy.name.replace(/\s*\(New\)\s*$/i, '') + ' (New)';
    } else if (typeof copy.question === 'string') {
      copy.question = copy.question.replace(/\s*\(New\)\s*$/i, '') + ' (New)';
    } else if (typeof copy.stop === 'string') {
      copy.stop = copy.stop.replace(/\s*\(New\)\s*$/i, '') + ' (New)';
    }
    if (String(listPath).endsWith('.programs')) {
      copy.tabLabel = (copy.tabLabel || copy.duration || 'Custom').replace(/\s*\(New\)\s*$/i, '') + ' (New)';
    }
    if (Array.isArray(copy.programs)) {
      copy.programs = copy.programs.map((pr, i) => ({
        ...pr,
        id: `${copy.id || 'v'}-p${i}-${uid.slice(-4)}`,
        slug: `${String(pr.slug || 'program').slice(0, 28)}-${uid.slice(-4)}-${i}`
      }));
    }
    return copy;
  }

  function resolveOrInitList(st, listPath, fallbackData) {
    let arr = getPathValue(st, listPath);
    if (!Array.isArray(arr) && Array.isArray(fallbackData)) {
      setPathValue(st, listPath, JSON.parse(JSON.stringify(fallbackData)));
      arr = getPathValue(st, listPath);
    }
    return Array.isArray(arr) ? arr : null;
  }

  function findListItemIndex(arr, itemKey) {
    if (!Array.isArray(arr)) return -1;
    const key = String(itemKey ?? '');
    if (key.startsWith('idx:')) {
      const n = Number(key.slice(4));
      return Number.isInteger(n) && n >= 0 && n < arr.length ? n : -1;
    }
    if (key.startsWith('id:')) {
      const targetId = key.slice(3);
      return arr.findIndex(x => x && (String(x.id) === targetId || String(x.slug) === targetId));
    }
    const n = Number(key);
    return Number.isInteger(n) && n >= 0 && n < arr.length ? n : arr.findIndex(x => x && (String(x.id) === key || String(x.slug) === key));
  }

  function pushDeletedTypeEntry(st, entry) {
    if (!Array.isArray(st.deletedElementTypes)) st.deletedElementTypes = [];
    st.deletedElementTypes.unshift(entry);
    if (st.deletedElementTypes.length > 40) st.deletedElementTypes.length = 40;
  }

  async function deleteListItem(listPath, itemKey, meta = {}, onDone = null) {
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const arr = resolveOrInitList(st, listPath, meta.fallbackData);
    if (!arr) return null;
    const idx = findListItemIndex(arr, itemKey);
    if (idx < 0) return null;
    const [removed] = arr.splice(idx, 1);
    const tplEntry = {
      id: 'dt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      mode: 'list',
      scope: meta.scope || 'all',
      listPath,
      insertIndex: idx,
      kindLabel: meta.kindLabel || 'عنصر قائمة',
      previewText: meta.previewText || extractItemPreview(removed),
      sampleItem: JSON.parse(JSON.stringify(removed)),
      deletedAt: Date.now()
    };
    pushDeletedTypeEntry(st, tplEntry);
    await finishSave(typeof onDone === 'function' ? onDone : null, `تم حذف "${tplEntry.kindLabel}"`, beforeSnap);
    return tplEntry;
  }

  async function addListItemOfType(listPath, itemKey, meta = {}, onDone = null) {
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const arr = resolveOrInitList(st, listPath, meta.fallbackData);
    if (!arr) return false;
    const idx = itemKey !== null && itemKey !== undefined ? findListItemIndex(arr, itemKey) : -1;
    const sample = idx >= 0 ? arr[idx] : (meta.sampleItem !== undefined ? meta.sampleItem : arr[arr.length - 1]);
    if (sample === undefined) return false;
    const newItem = cloneSampleForList(sample, listPath, arr);
    const insertAt = idx >= 0 ? idx + 1 : arr.length;
    arr.splice(insertAt, 0, newItem);
    await finishSave(typeof onDone === 'function' ? onDone : null, `تم إضافة "${meta.kindLabel || 'عنصر جديد'}" من نفس النوع ✓`, beforeSnap);
    return newItem;
  }

  function ensureDomRegionOps(st, regionKey) {
    if (!st.domEdits || typeof st.domEdits !== 'object') st.domEdits = {};
    if (!Array.isArray(st.domEdits[regionKey])) st.domEdits[regionKey] = [];
    return st.domEdits[regionKey];
  }

  function makeDomOpUid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  async function moveListItem(listPath, itemKey, delta, meta = {}, onDone = null) {
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const arr = resolveOrInitList(st, listPath, meta.fallbackData);
    if (!arr) return false;
    const idx = findListItemIndex(arr, itemKey);
    const nextIdx = idx + Number(delta || 0);
    if (idx < 0 || nextIdx < 0 || nextIdx >= arr.length || idx === nextIdx) return false;
    const [moved] = arr.splice(idx, 1);
    arr.splice(nextIdx, 0, moved);
    await finishSave(typeof onDone === 'function' ? () => onDone(nextIdx) : null, `تم تغيير ترتيب "${meta.kindLabel || 'العنصر'}" ✓`, beforeSnap);
    return true;
  }

  async function recordDomDelete(payload, onDone = null) {
    if (!payload || !payload.targetSel || !payload.regionKey) return null;
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const ops = ensureDomRegionOps(st, payload.regionKey);
    const uid = makeDomOpUid();
    ops.push({
      id: 'de-' + uid,
      op: 'delete',
      targetSel: payload.targetSel,
      ts: Date.now()
    });
    const tplEntry = {
      id: 'dt-' + uid,
      mode: 'dom',
      scope: payload.scope || payload.regionKey,
      regionKey: payload.regionKey,
      targetSel: payload.targetSel,
      parentSel: payload.parentSel || '',
      kindLabel: payload.kindLabel || 'عنصر صفحة',
      tagName: payload.tagName || 'DIV',
      previewText: String(payload.previewText || '').slice(0, 56),
      cleanHtml: payload.cleanHtml || '',
      deletedAt: Date.now()
    };
    pushDeletedTypeEntry(st, tplEntry);
    await finishSave(typeof onDone === 'function' ? onDone : null, `تم حذف "${tplEntry.kindLabel}"`, beforeSnap);
    return tplEntry;
  }

  async function recordDomDuplicate(payload, onDone = null) {
    if (!payload || !payload.regionKey || !payload.cleanHtml) return null;
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const ops = ensureDomRegionOps(st, payload.regionKey);
    const uid = makeDomOpUid();
    const edit = {
      id: 'de-' + uid,
      op: payload.position === 'before' ? 'insert_before' : 'insert_after',
      targetSel: payload.targetSel || '',
      parentSel: payload.parentSel || '',
      html: payload.cleanHtml,
      newId: 'nt-el-' + uid,
      label: payload.kindLabel || '',
      ts: Date.now()
    };
    ops.push(edit);
    await finishSave(typeof onDone === 'function' ? () => onDone(edit) : null, `تم إضافة "${payload.kindLabel || 'عنصر'}" ✓`, beforeSnap);
    return edit;
  }

  async function recordDomStyle(payload, onDone = null) {
    if (!payload || !payload.regionKey || !payload.targetSel) return null;
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const ops = ensureDomRegionOps(st, payload.regionKey);
    if (payload.reset) {
      st.domEdits[payload.regionKey] = ops.filter(o => !(o.op === 'set_style' && o.targetSel === payload.targetSel));
      await finishSave(typeof onDone === 'function' ? onDone : null, 'تمت استعادة التنسيق الأصلي للعنصر ✓', beforeSnap);
      return true;
    }
    const cleanStyles = {};
    for (const [k, v] of Object.entries(payload.styles || {})) {
      if (v !== undefined && v !== null) cleanStyles[k] = String(v);
    }
    let existing = null;
    for (let i = ops.length - 1; i >= 0; i--) {
      if (ops[i].op !== 'set_style' && ops[i].op !== 'set_attr') break;
      if (ops[i].op === 'set_style' && ops[i].targetSel === payload.targetSel) { existing = ops[i]; break; }
    }
    if (existing) {
      existing.styles = { ...(existing.styles || {}), ...cleanStyles };
      existing.ts = Date.now();
    } else {
      ops.push({
        id: 'de-' + makeDomOpUid(),
        op: 'set_style',
        targetSel: payload.targetSel,
        styles: cleanStyles,
        ts: Date.now()
      });
    }
    await finishSave(typeof onDone === 'function' ? onDone : null, payload.toastMsg || 'تم حفظ تنسيق العنصر ✓', beforeSnap);
    return true;
  }

  async function recordDomAttr(payload, onDone = null) {
    if (!payload || !payload.regionKey || !payload.targetSel) return null;
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    if (payload.livePath && payload.liveVal !== undefined) {
      setPathValue(st, payload.livePath, payload.liveVal);
    } else {
      const ops = ensureDomRegionOps(st, payload.regionKey);
      const safeAttrs = {};
      for (const [k, v] of Object.entries(payload.attrs || {})) {
        if (/^on/i.test(k)) continue;
        if ((k === 'href' || k === 'src') && /^\s*javascript:/i.test(String(v || ''))) continue;
        safeAttrs[k] = String(v ?? '');
      }
      let existing = null;
      for (let i = ops.length - 1; i >= 0; i--) {
        if (ops[i].op !== 'set_style' && ops[i].op !== 'set_attr') break;
        if (ops[i].op === 'set_attr' && ops[i].targetSel === payload.targetSel) { existing = ops[i]; break; }
      }
      if (existing) {
        existing.attrs = { ...(existing.attrs || {}), ...safeAttrs };
        existing.ts = Date.now();
      } else {
        ops.push({
          id: 'de-' + makeDomOpUid(),
          op: 'set_attr',
          targetSel: payload.targetSel,
          attrs: safeAttrs,
          ts: Date.now()
        });
      }
    }
    await finishSave(typeof onDone === 'function' ? onDone : null, payload.toastMsg || 'تم تحديث خصائص العنصر ✓', beforeSnap);
    return true;
  }

  async function recordDomMove(payload, onDone = null) {
    if (!payload || !payload.regionKey || !payload.targetSel || !payload.delta) return null;
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    const ops = ensureDomRegionOps(st, payload.regionKey);
    ops.push({
      id: 'de-' + makeDomOpUid(),
      op: 'move_sibling',
      targetSel: payload.targetSel,
      delta: Number(payload.delta) > 0 ? 1 : -1,
      ts: Date.now()
    });
    await finishSave(typeof onDone === 'function' ? onDone : null, 'تم تغيير ترتيب العنصر ✓', beforeSnap);
    return true;
  }

  async function addElementFromDeletedType(typeId, onDone = null) {
    const st = CMS.getState();
    const tpl = (st.deletedElementTypes || []).find(t => t.id === typeId);
    if (!tpl) return false;
    const beforeSnap = captureSnapshot();
    if (tpl.mode === 'list') {
      let arr = getPathValue(st, tpl.listPath);
      if (!Array.isArray(arr)) {
        setPathValue(st, tpl.listPath, []);
        arr = getPathValue(st, tpl.listPath);
      }
      if (!Array.isArray(arr)) return false;
      const newItem = cloneSampleForList(tpl.sampleItem, tpl.listPath, arr);
      const pos = Math.max(0, Math.min(Number.isFinite(tpl.insertIndex) ? tpl.insertIndex : arr.length, arr.length));
      arr.splice(pos, 0, newItem);
      await finishSave(typeof onDone === 'function' ? () => onDone(tpl) : null, `تم إضافة "${tpl.kindLabel}" من نفس النوع ✓`, beforeSnap);
      return true;
    }
    if (tpl.mode === 'dom') {
      if (!st.domEdits || typeof st.domEdits !== 'object') st.domEdits = {};
      if (!Array.isArray(st.domEdits[tpl.regionKey])) st.domEdits[tpl.regionKey] = [];
      const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      st.domEdits[tpl.regionKey].push({
        id: 'de-' + uid,
        op: 'insert_template',
        targetSel: tpl.targetSel || '',
        parentSel: tpl.parentSel || '',
        html: tpl.cleanHtml || '',
        newId: 'nt-el-' + uid,
        label: tpl.kindLabel || '',
        ts: Date.now()
      });
      await finishSave(typeof onDone === 'function' ? () => onDone(tpl) : null, `تم إضافة "${tpl.kindLabel}" من نفس النوع ✓`, beforeSnap);
      return true;
    }
    return false;
  }

  async function clearDeletedElementTypes(onDone = null) {
    const st = CMS.getState();
    const beforeSnap = captureSnapshot();
    st.deletedElementTypes = [];
    await finishSave(typeof onDone === 'function' ? onDone : null, 'تم مسح سجل القوالب المحذوفة', beforeSnap);
  }

  const PRESET_VIDEOS = [
    ['فيديو 1 — النيل الرئيسي (Hero Main MP4)', 'assets/videos/hero-main.mp4'],
    ['فيديو 2 — كروز النيل 1 (Cruise Segment 1)', 'assets/videos/hero-cruise-1.mp4'],
    ['فيديو 3 — كروز النيل 2 (Cruise Segment 2)', 'assets/videos/hero-cruise-2.mp4'],
    ['فيديو 4 — كروز النيل 3 (Cruise Segment 3)', 'assets/videos/hero-cruise-3.mp4'],
    ['فيديو 5 — الدهبية الشراعية 1 (Dahabiya 1)', 'assets/videos/hero-dahabiya-1.mp4'],
    ['فيديو 6 — الدهبية والنوبة 2 (Dahabiya 2)', 'assets/videos/hero-dahabiya-2.mp4'],
    ['رابط يوتيوب (YouTube Autoplay)', 'https://www.youtube.com/watch?v=otvczRRDdRI']
  ];

  const FAQ_SCOPES = [
    ['all', 'كل الصفحات (عام)'],
    ['home', 'الصفحة الرئيسية (Home)'],
    ['nile-cruises', 'الكروزات النيلية (Nile Cruises)'],
    ['dahabiyas', 'الذهبيات الشراعية (Dahabiyas)'],
    ['sightseeing', 'المزارات والـ Nubian & Nile'],
    ['journeys', 'البرامج المتكاملة (Journeys)'],
    ['about', 'عن الشركة / التواصل']
  ];

  function slugify(str) {
    return String(str || '').toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || ('item-' + Date.now());
  }

  function showToast(msg, tone = 'success') {
    let el = $('#cms-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cms-toast';
      el.className = 'adm-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.dataset.tone = tone;
    el.innerHTML = `<span class="adm-toast-ic">${tone === 'error' ? '!' : '✓'}</span><span>${esc(msg)}</span>`;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function showActionToast(msg, actionLabel, onAction, tone = 'success') {
    let el = $('#cms-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cms-toast';
      el.className = 'adm-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.dataset.tone = tone;
    el.innerHTML = `<span class="adm-toast-ic">${tone === 'error' ? '!' : '✓'}</span><span>${esc(msg)}</span>${actionLabel ? `<button type="button" class="adm-toast-act">${esc(actionLabel)}</button>` : ''}`;
    const actBtn = $('.adm-toast-act', el);
    if (actBtn && typeof onAction === 'function') {
      actBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('show');
        onAction();
      }, { once: true });
    }
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 6500);
  }

  async function finishSave(target, msg = 'تم الحفظ والمزامنة مع الموقع', beforeSnap = null) {
    try {
      await CMS.save();
    } catch (err) {
      if (beforeSnap) {
        try {
          const restored = JSON.parse(beforeSnap);
          Object.assign(CMS.getState(), restored);
        } catch {}
      }
      showToast(err?.message || 'تعذر الحفظ — تأكد من تسجيل الدخول', 'error');
      return false;
    }
    if (beforeSnap && beforeSnap !== captureSnapshot()) {
      pushUndoSnapshot(beforeSnap);
    }
    lastSavedTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    showToast(msg);
    const pill = $('#adm-sync-status');
    if (pill) {
      pill.textContent = `متزامن ✓ (${lastSavedTime})`;
      pill.classList.add('synced');
    }
    if (typeof target === 'function') {
      target();
    } else if (target) {
      renderAdmin(target, { preserveScroll: true });
    }
    return true;
  }

  async function saveAndRefresh(containerSelector, msg = 'تم الحفظ والمزامنة مع الموقع', beforeSnap = null) {
    return finishSave(containerSelector, msg, beforeSnap);
  }

  async function uploadMediaFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, dataBase64: reader.result })
          });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || 'فشل رفع الملف');
          resolve(data.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
      reader.readAsDataURL(file);
    });
  }

  function openConfirmDialog({ title, message, confirmLabel = 'تأكيد الحذف', cancelLabel = 'إلغاء' }) {
    return new Promise(resolve => {
      let dlg = $('#adm-confirm-dialog');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'adm-confirm-dialog';
        dlg.className = 'adm-confirm-dialog';
        dlg.setAttribute('aria-labelledby', 'adm-confirm-title');
        document.body.appendChild(dlg);
      }
      dlg.innerHTML = `
        <div class="adm-confirm-box">
          <h3 id="adm-confirm-title">${esc(title)}</h3>
          <p>${esc(message)}</p>
          <form method="dialog" class="adm-confirm-actions">
            <button type="submit" value="cancel" class="adm-btn-outline" autofocus>${esc(cancelLabel)}</button>
            <button type="submit" value="confirm" class="adm-btn-danger">${esc(confirmLabel)}</button>
          </form>
        </div>
      `;
      const onClose = () => {
        const confirmed = dlg.returnValue === 'confirm';
        dlg.returnValue = '';
        dlg.removeEventListener('close', onClose);
        resolve(confirmed);
      };
      dlg.addEventListener('close', onClose);
      dlg.showModal();
    });
  }

  function openSlideDrawer({ title, subtitle = '', bodyHtml, footerHtml = '', onOpen }) {
    let dlg = $('#adm-drawer-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'adm-drawer-dialog';
      dlg.className = 'adm-drawer-dialog';
      dlg.setAttribute('closedby', 'any');
      dlg.setAttribute('aria-labelledby', 'adm-drawer-title');
      document.body.appendChild(dlg);

      // Progressive light-dismiss fallback when closedby isn't supported natively
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        let pressedOutside = false;
        dlg.addEventListener('pointerdown', (e) => {
          const r = dlg.getBoundingClientRect();
          pressedOutside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        });
        dlg.addEventListener('pointerup', (e) => {
          const r = dlg.getBoundingClientRect();
          const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
          if (pressedOutside && outside) dlg.close();
        });
      }
    }

    dlg.innerHTML = `
      <div class="adm-drawer-shell">
        <header class="adm-drawer-head">
          <div>
            <h3 id="adm-drawer-title">${esc(title)}</h3>
            ${subtitle ? `<p class="adm-drawer-sub">${esc(subtitle)}</p>` : ''}
          </div>
          <button type="button" class="adm-drawer-close" id="adm-drawer-close-btn" aria-label="إغلاق النافذة">✕</button>
        </header>
        <div class="adm-drawer-body" id="adm-drawer-body">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<footer class="adm-drawer-foot">${footerHtml}</footer>` : ''}
      </div>
    `;

    $('#adm-drawer-close-btn', dlg)?.addEventListener('click', () => {
      dlg.returnValue = '';
      dlg.close();
    });

    bindMediaUploadFields(dlg);
    if (typeof onOpen === 'function') onOpen(dlg);
    dlg.showModal();
    return dlg;
  }

  function mediaFieldHtml(name, labelText, currentVal = '', isVideo = false) {
    const val = currentVal || '';
    const presets = isVideo ? PRESET_VIDEOS : PRESET_IMAGES;
    const thumbHtml = isVideo
      ? `<div class="adm-media-thumb is-vid" title="${esc(val)}">🎬<span>MP4</span></div>`
      : `<img src="${esc(val || 'assets/nile-sailing.webp')}" alt="" class="adm-media-thumb">`;

    return `
      <div class="adm-media-field">
        <span class="adm-field-lbl">${esc(labelText)}</span>
        <div class="adm-media-control-row">
          ${thumbHtml}
          <div class="adm-media-inputs">
            <input type="text" name="${esc(name)}" value="${esc(val)}" placeholder="${isVideo ? 'assets/videos/... أو رابط يوتيوب' : 'assets/... أو رابط صورة'}" class="adm-media-url-input" dir="ltr">
            <div class="adm-media-tools">
              <select class="adm-media-preset-select" aria-label="اختيار ملف جاهز">
                <option value="">-- اختيار سريع من المكتبة --</option>
                ${presets.map(([lbl, path]) => `<option value="${esc(path)}" ${val === path ? 'selected' : ''}>${esc(lbl)}</option>`).join('')}
              </select>
              <label class="adm-upload-btn">
                <input type="file" accept="${isVideo ? 'video/mp4,video/webm' : 'image/*'}" class="adm-file-upload-input" hidden>
                <span>⬆ رفع من الجهاز</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindMediaUploadFields(rootEl) {
    $$('.adm-media-field', rootEl).forEach(wrap => {
      const urlInput = $('.adm-media-url-input', wrap);
      const presetSel = $('.adm-media-preset-select', wrap);
      const fileInp = $('.adm-file-upload-input', wrap);
      const thumbImg = $('img.adm-media-thumb', wrap);

      const syncThumb = (url) => {
        if (thumbImg && url) thumbImg.src = url;
      };

      urlInput?.addEventListener('input', () => syncThumb(urlInput.value.trim()));

      presetSel?.addEventListener('change', () => {
        if (presetSel.value && urlInput) {
          urlInput.value = presetSel.value;
          syncThumb(presetSel.value);
          showToast('تم تحديد الملف من المكتبة');
        }
      });

      fileInp?.addEventListener('change', async () => {
        const file = fileInp.files?.[0];
        if (!file) return;
        try {
          showToast('جاري رفع الملف...');
          const uploadedUrl = await uploadMediaFile(file);
          if (urlInput) urlInput.value = uploadedUrl;
          syncThumb(uploadedUrl);
          showToast('تم رفع الملف وحفظ مساره بنجاح');
        } catch (err) {
          showToast(err.message || 'تعذر رفع الملف', 'error');
        }
      });
    });
  }

  // ==================== BOOKINGS TAB ====================
  function renderBookingsTab(st) {
    const cur = st.settings?.currencySymbol || '$';
    const allEnq = st.enquiries || [];
    const newCount = allEnq.filter(e => e.status === 'New').length;
    const confirmedCount = allEnq.filter(e => e.status === 'Confirmed').length;

    const q = searchQuery.trim().toLowerCase();
    const filtered = allEnq.filter(enq => {
      if (bookingStatusFilter !== 'all' && enq.status !== bookingStatusFilter) return false;
      if (!q) return true;
      const hay = `${enq.id} ${enq.clientName} ${enq.clientEmail} ${enq.nationality} ${enq.vesselTitle} ${enq.programTitle}`.toLowerCase();
      return hay.includes(q);
    });

    return `
      <div class="adm-kpi-strip">
        <div class="adm-kpi-card">
          <small>إجمالي الحجوزات</small>
          <strong>${allEnq.length}</strong>
        </div>
        <div class="adm-kpi-card is-gold">
          <small>طلبات جديدة بانتظار الرد</small>
          <strong>${newCount}</strong>
        </div>
        <div class="adm-kpi-card is-green">
          <small>حجوزات مؤكدة</small>
          <strong>${confirmedCount}</strong>
        </div>
        <div class="adm-kpi-card">
          <small>إجمالي الفعاليات المضافة</small>
          <strong>${(st.sightseeingPlaces || []).length + (st.addons || []).length}</strong>
        </div>
      </div>

      <div class="adm-toolbar">
        <div class="adm-filter-chips" role="tablist" aria-label="تصفية حالة الحجز">
          ${[
            ['all', `الكل (${allEnq.length})`],
            ['New', `جديد (${newCount})`],
            ['Confirmed', `مؤكد (${confirmedCount})`],
            ['Completed', 'مكتمل'],
            ['Cancelled', 'ملغى']
          ].map(([k, lbl]) => `
            <button type="button" class="adm-chip ${bookingStatusFilter === k ? 'active' : ''}" data-book-filter="${k}">${lbl}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <div class="adm-search-box">
            <input type="search" id="adm-global-search" value="${esc(searchQuery)}" placeholder="🔍 ابحث باسم العميل، الإيميل، الجنسية، أو الرحلة..." aria-label="بحث في الحجوزات">
          </div>
          ${allEnq.length ? '<button type="button" class="adm-btn-outline-sm" id="btn-export-bookings-csv">⬇ تصدير CSV</button>' : ''}
        </div>
      </div>

      ${!filtered.length ? '<div class="adm-empty">لا توجد حجوزات حتى الآن — ستظهر هنا كل طلبات العملاء الحقيقيين تلقائياً.</div>' : `
        <div class="adm-bookings-list">
          ${filtered.map(enq => {
            const totalNum = typeof enq.estimatedTotal === 'number' ? enq.estimatedTotal : Number(enq.estimatedTotal);
            const totalText = Number.isFinite(totalNum) && enq.estimatedTotal !== '' && enq.estimatedTotal !== null
              ? `${cur}${totalNum.toLocaleString()}`
              : esc(enq.estimatedTotal || 'طلب تسعير');
            const cleanWa = String(enq.clientPhone || '').replace(/[^\d]/g, '');
            const waMsg = encodeURIComponent(`Hello ${enq.clientName || ''}, thank you for contacting NileTrails regarding your booking request #${enq.id} (${enq.programTitle || enq.vesselTitle}).`);
            const mailSub = encodeURIComponent(`NileTrails Booking Request #${enq.id} — ${enq.vesselTitle || 'Your Egypt Journey'}`);
            return `
            <article class="adm-booking-card status-${esc((enq.status || 'New').toLowerCase())}">
              <div class="adm-bk-top">
                <div>
                  <span class="adm-bk-id">#${esc(enq.id)}</span>
                  <span class="adm-bk-date">${esc(enq.createdAt)}</span>
                  <span class="adm-badge-status st-${esc((enq.status || 'New').toLowerCase())}">${esc(enq.status || 'New')}</span>
                </div>
                <div class="adm-bk-controls">
                  ${cleanWa.length >= 7 ? `<a href="https://wa.me/${cleanWa}?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="adm-btn-outline-sm" style="text-decoration:none">💬 واتساب</a>` : ''}
                  ${enq.clientEmail ? `<a href="mailto:${esc(enq.clientEmail)}?subject=${mailSub}" class="adm-btn-outline-sm" style="text-decoration:none">✉ إيميل</a>` : ''}
                  <select class="adm-status-select" data-enq-status="${esc(enq.id)}" aria-label="تغيير حالة الطلب">
                    <option value="New" ${enq.status === 'New' ? 'selected' : ''}>New / طلب جديد</option>
                    <option value="Confirmed" ${enq.status === 'Confirmed' ? 'selected' : ''}>Confirmed / مؤكد</option>
                    <option value="Completed" ${enq.status === 'Completed' ? 'selected' : ''}>Completed / مكتمل</option>
                    <option value="Cancelled" ${enq.status === 'Cancelled' ? 'selected' : ''}>Cancelled / ملغى</option>
                  </select>
                  <button type="button" class="adm-btn-danger-sm" data-delete-enq="${esc(enq.id)}">حذف</button>
                </div>
              </div>

              <div class="adm-bk-grid">
                <div class="adm-bk-col">
                  <h4>بيانات العميل</h4>
                  <p><strong>${esc(enq.clientName)}</strong> <small>(${esc(enq.nationality || '—')})</small></p>
                  <p dir="ltr" style="text-align:right">${esc(enq.clientEmail)} · ${esc(enq.clientPhone || '—')}</p>
                  <p><small>الجواز:</small> ${esc(enq.passportReady || '—')} · <small>الطعام:</small> ${esc(enq.dietary || '—')}</p>
                </div>
                <div class="adm-bk-col">
                  <h4>البرنامج والتفاصيل</h4>
                  <p><strong>${esc(enq.vesselTitle)}</strong> — ${esc(enq.programTitle)}</p>
                  <p>الوصول: <strong>${esc(enq.checkInDate || 'Flexible')}</strong>${enq.season ? ` (${esc(enq.season)})` : ''} · ${esc(enq.cabinName || '—')} (${esc(enq.adults)} بالغ${enq.children ? `, ${enq.children} طفل` : ''})</p>
                  <p><small>الاستقبال:</small> ${esc(enq.flightTransfer || '—')}</p>
                </div>
                <div class="adm-bk-col adm-bk-addons">
                  <h4>المزارات والإضافات (${(enq.selectedAddons || []).length})</h4>
                  ${enq.selectedAddons?.length ? `
                    <ul>${enq.selectedAddons.map(a => `<li>✓ ${esc(a.title)}${Number(a.price) > 0 ? ` (${cur}${a.price})` : ''}</li>`).join('')}</ul>
                  ` : '<p class="muted">البرنامج القياسي فقط</p>'}
                  <div class="adm-bk-total">الإجمالي التقديري: <strong>${totalText}</strong></div>
                </div>
              </div>
              ${enq.notes ? `<div class="adm-bk-notes">📝 ${esc(enq.notes)}</div>` : ''}
            </article>
          `;
          }).join('')}
        </div>
      `}
    `;
  }

  // ==================== CRUISES & DAHABIYAS + STRUCTURED PROGRAM BUILDER ====================
  function renderVesselsTab(st) {
    const allVessels = [...(st.cruises || []), ...(st.dahabiyas || [])];
    if (!selectedVesselId || !allVessels.some(v => v.id === selectedVesselId)) {
      selectedVesselId = allVessels[0]?.id;
    }
    const v = allVessels.find(x => x.id === selectedVesselId);
    const cur = st.settings?.currencySymbol || '$';

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة المراكب والذهبيات والبرامج</h2>
          <p>عدّل بيانات أي مركب، فعّل ظهوره على الموقع، وأدر البرامج السياحية بجدول الأيام والكبائن التفاعلي (بدون أكواد معقدة).</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="adm-btn-primary" id="btn-add-cruise">+ إضافة نايل كروز</button>
          <button type="button" class="adm-btn-gold" id="btn-add-dahabiya">+ إضافة ذهبية</button>
        </div>
      </div>

      <div class="adm-split-workspace">
        <aside class="adm-vessel-list">
          <div class="adm-list-header">الأسطول (${allVessels.length})</div>
          ${allVessels.map(item => `
            <div class="adm-vessel-item ${item.id === v?.id ? 'active' : ''}" data-select-vessel="${esc(item.id)}">
              <img src="${esc(item.image || 'assets/nile-cruise.webp')}" alt="">
              <div style="min-width:0;flex:1">
                <strong>${esc(item.title)}</strong>
                <span>${item.kind === 'dahabiya' ? 'ذهبية' : 'كروز'} · ${esc(item.tier)} · ${(item.programs || []).length} برامج</span>
                <div class="adm-item-badges">
                  <em class="pill ${item.enabled !== false ? 'on' : 'off'}">${item.enabled !== false ? 'مفعّل' : 'مخفي'}</em>
                  <em class="pill price">من ${cur}${Number(item.basePrice) || Number(item.programs?.[0]?.basePrice) || 890} بدون إضافات</em>
                  ${item.showOnHome ? '<em class="pill home">بالرئيسية</em>' : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </aside>

        <div class="adm-vessel-editor">
          ${v ? `
            <form id="adm-vessel-form" data-vessel-id="${esc(v.id)}" class="adm-card">
              <div class="adm-card-head">
                <div>
                  <h3>${esc(v.title)}</h3>
                  <small dir="ltr" style="color:#6c7d87">#/${v.kind === 'dahabiya' ? 'dahabiyas' : 'nile-cruises'}/${esc(v.slug)}</small>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <a href="#/${v.kind === 'dahabiya' ? 'dahabiyas' : 'nile-cruises'}/${esc(v.slug)}" target="_blank" class="adm-btn-outline-sm">معاينة الصفحة ↗</a>
                  <button type="submit" class="adm-btn-gold">حفظ التعديلات</button>
                </div>
              </div>

              <div class="adm-form-grid">
                <label>اسم المركب / الذهبية *
                  <input type="text" name="title" value="${esc(v.title)}" required>
                </label>
                <label>الفئة (Tier)
                  <select name="tier">
                    <option value="Luxury" ${v.tier === 'Luxury' ? 'selected' : ''}>Luxury / فاخرة</option>
                    <option value="Deluxe" ${v.tier === 'Deluxe' ? 'selected' : ''}>Deluxe / ديلوكس</option>
                    <option value="Superior" ${v.tier === 'Superior' ? 'selected' : ''}>Superior / متميزة</option>
                    <option value="Private" ${v.tier === 'Private' ? 'selected' : ''}>Private / خاصة</option>
                  </select>
                </label>
                <label>خط الإبحار الرئيسي
                  <input type="text" name="route" value="${esc(v.route)}">
                </label>
                <label>عدد الليالي المعروض
                  <input type="number" name="nights" value="${v.nights || 4}" min="1">
                </label>
                <div class="full-col adm-standalone-price-box">
                  <div class="adm-spb-head">
                    <label style="flex:1;min-width:220px">
                      سعر ${v.kind === 'dahabiya' ? 'الذهبية' : 'الكروز'} لوحدها بدون أي إضافات (Add-ons) (${cur}) *
                      <input type="number" name="basePrice" value="${Number(v.basePrice) || Number(v.programs?.[0]?.basePrice) || 890}" min="0" step="1" required>
                    </label>
                    <label class="adm-switch" style="align-self:flex-end;padding-bottom:6px">
                      <input type="checkbox" name="syncPrimaryProgram" checked>
                      <span>تحديث سعر البرنامج الأساسي الأول (${esc(v.programs?.[0]?.tabLabel || 'Program 1')}) تلقائياً</span>
                    </label>
                  </div>
                  <small>هذا هو السعر الصافي للكروز / الذهبية فقط بدون أي Add-ons، ويظهر في الكروت وبداية الحجز.</small>
                </div>
                <div class="full-col">
                  ${mediaFieldHtml('image', 'صورة المركب / الذهبية', v.image, false)}
                </div>
                <div class="full-col">
                  ${mediaFieldHtml('heroVideo', 'فيديو البداية الصامت (Hero Autoplay)', v.heroVideo || '', true)}
                </div>
                <label class="full-col">وصف مختصر تحت العنوان
                  <textarea name="sub" rows="2">${esc(v.sub)}</textarea>
                </label>
              </div>

              <div class="adm-toggles-row">
                <label class="adm-switch">
                  <input type="checkbox" name="enabled" ${v.enabled !== false ? 'checked' : ''}>
                  <span>مفعّل ويظهر للعملاء</span>
                </label>
                <label class="adm-switch">
                  <input type="checkbox" name="showOnHome" ${v.showOnHome ? 'checked' : ''}>
                  <span>إظهار في القسم المميز بالصفحة الرئيسية</span>
                </label>
                <button type="button" class="adm-btn-danger-sm" data-delete-vessel="${esc(v.id)}">حذف المركب</button>
              </div>
            </form>

            <div class="adm-card" style="margin-top:20px">
              <div class="adm-card-head">
                <div>
                  <h3>البرامج داخل "${esc(v.title)}" (${(v.programs || []).length})</h3>
                  <p class="adm-card-sub">كل برنامج يحتوي على جدول أيام، كبائن، أسعار موسمية، مزارات وإضافات</p>
                </div>
                <button type="button" class="adm-btn-primary" id="btn-add-program" data-vessel-id="${esc(v.id)}">+ إضافة برنامج جديد</button>
              </div>
              <div class="adm-programs-list">
                ${(v.programs || []).map(pr => `
                  <div class="adm-prog-row">
                    <div>
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <h4>${esc(pr.title)}</h4>
                        ${pr.tabLabel ? `<span class="pill home">${esc(pr.tabLabel)}</span>` : ''}
                        ${pr.canBeAddonForOthers ? '<span class="pill on">يظهر كإضافة للبرامج</span>' : ''}
                      </div>
                      <p>${esc(pr.duration)} · ${esc(pr.route)}</p>
                      <small>${(pr.itinerary || []).length} أيام · ${(pr.cabins || []).length} أنواع كبائن</small>
                    </div>
                    <div class="adm-prog-actions">
                      <label class="adm-inline-price">
                        <span>سعر البرنامج بدون إضافات (${cur})</span>
                        <input type="number" min="0" step="1" value="${Number(pr.basePrice) || Number(v.basePrice) || 890}" data-quick-prog-price="${esc(v.id)}::${esc(pr.id)}">
                      </label>
                      <button type="button" class="adm-btn-gold-sm" data-open-prog-drawer="${esc(v.id)}::${esc(pr.id)}">تعديل البرنامج</button>
                      <button type="button" class="adm-btn-danger-sm" data-delete-prog="${esc(v.id)}::${esc(pr.id)}">حذف</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<div class="adm-empty">اختر مركباً من القائمة لتعديله.</div>'}
        </div>
      </div>
    `;
  }

  function openProgramDrawer(st, vesselId, programId, containerSelector) {
    const allVessels = [...(st.cruises || []), ...(st.dahabiyas || [])];
    const v = allVessels.find(x => x.id === vesselId);
    const pr = v?.programs?.find(p => p.id === programId);
    if (!v || !pr) return;
    const beforeSnap = captureSnapshot();

    const allFacilities = CMS.DEFAULT_FACILITIES || [];
    const curFacilities = Array.isArray(pr.facilities) && pr.facilities.length ? pr.facilities : allFacilities;
    const allAddonChoices = [
      ...(st.addons || []).map(a => ({ id: a.id, title: a.title, tag: 'إضافة عامة' })),
      ...allVessels.flatMap(xv => (xv.programs || []).filter(xp => xp.id !== pr.id && xp.canBeAddonForOthers).map(xp => ({
        id: xp.id, title: `${xp.title} (${xv.title})`, tag: 'برنامج كروز'
      })))
    ];
    const allowedAll = !pr.allowedAddonIds || pr.allowedAddonIds.includes('ALL');

    // Mutable working copies for structured repeaters inside Drawer
    let draftItinerary = JSON.parse(JSON.stringify(pr.itinerary || []));
    let draftCabins = JSON.parse(JSON.stringify(pr.cabins || []));

    const summer = pr.pricingSeasons?.summer || {};
    const winter = pr.pricingSeasons?.winter || {};
    const base = Number(pr.basePrice) || 750;

    const renderDayRows = (listEl) => {
      listEl.innerHTML = draftItinerary.map((d, i) => `
        <div class="adm-repeater-card" data-day-idx="${i}">
          <div class="adm-repeater-head">
            <strong>اليوم ${i + 1}: ${esc(d.day || `Day ${i + 1}`)}</strong>
            <div style="display:flex;gap:6px">
              <button type="button" class="adm-btn-outline-sm" data-day-move="${i}:-1">↑</button>
              <button type="button" class="adm-btn-outline-sm" data-day-move="${i}:1">↓</button>
              <button type="button" class="adm-btn-danger-sm" data-day-del="${i}">حذف</button>
            </div>
          </div>
          <div class="adm-repeater-grid">
            <label>رقم اليوم <input type="text" data-day-field="day" value="${esc(d.day || '')}" placeholder="Day 1"></label>
            <label>المحطة (Route Stop) <input type="text" data-day-field="stop" value="${esc(d.stop || '')}" placeholder="Luxor"></label>
            <label class="full-col">عنوان اليوم <input type="text" data-day-field="title" value="${esc(d.title || '')}"></label>
            <label class="full-col">تفاصيل الزيارات <textarea rows="2" data-day-field="desc">${esc(d.desc || '')}</textarea></label>
            <label class="full-col">الوجبات المشمولة <input type="text" data-day-field="meals" value="${esc(d.meals || '')}" placeholder="Lunch & Dinner on board"></label>
          </div>
        </div>
      `).join('') || '<div class="adm-empty">لا توجد أيام مضافة بعد. اضغط "+ إضافة يوم" للبدء.</div>';
    };

    const renderCabinRows = (listEl) => {
      listEl.innerHTML = draftCabins.map((c, i) => `
        <div class="adm-cabin-row" data-cabin-idx="${i}">
          <input type="text" data-cabin-field="name" value="${esc(c.name || '')}" placeholder="اسم الكابينة (مثال: Double Cabin)">
          <input type="number" data-cabin-field="priceDelta" value="${Number(c.priceDelta) || 0}" placeholder="فرق السعر (+/-)">
          <input type="text" data-cabin-field="desc" value="${esc(c.desc || '')}" placeholder="وصف مختصر">
          <button type="button" class="adm-btn-danger-sm" data-cabin-del="${i}">✕</button>
        </div>
      `).join('');
    };

    const bodyHtml = `
      <form id="adm-prog-drawer-form" class="adm-drawer-form">
        <div class="adm-drawer-section">
          <h4>1. المعلومات الأساسية والتبويب</h4>
          <div class="adm-form-grid">
            <label class="full-col">عنوان البرنامج *
              <input type="text" name="title" value="${esc(pr.title)}" required autofocus>
            </label>
            <label>اسم التبويب القصير (Tab Label)
              <input type="text" name="tabLabel" value="${esc(pr.tabLabel || (pr.nights + ' Nights'))}" placeholder="3 Nights">
            </label>
            <label>السطر الفرعي للتبويب (Tab Sub)
              <input type="text" name="tabSub" value="${esc(pr.tabSub || pr.route || '')}" placeholder="Aswan → Luxor">
            </label>
            <label>المدة المعروضة
              <input type="text" name="duration" value="${esc(pr.duration)}" placeholder="4 Days / 3 Nights">
            </label>
            <label>خط الرحلة
              <input type="text" name="route" value="${esc(pr.route)}">
            </label>
            <label>عدد الليالي
              <input type="number" name="nights" value="${pr.nights || 3}" min="1">
            </label>
            <label>السعر الأساسي المرجعي (USD)
              <input type="number" name="basePrice" id="drawer-base-price" value="${base}" min="50">
            </label>
            <div class="full-col">
              ${mediaFieldHtml('heroVideo', 'فيديو الهيدر للبرنامج (Autoplay MP4)', pr.heroVideo || '', true)}
            </div>
            <label class="full-col">ملخص البرنامج
              <textarea name="summary" rows="2">${esc(pr.summary)}</textarea>
            </label>
          </div>
          <label class="adm-switch adm-highlight-switch" style="margin-top:12px">
            <input type="checkbox" name="canBeAddonForOthers" ${pr.canBeAddonForOthers ? 'checked' : ''}>
            <span>السماح بظهور هذا البرنامج كـ Add-on إضافي داخل البرامج الأخرى</span>
          </label>
        </div>

        <div class="adm-drawer-section">
          <div class="adm-drawer-sec-head">
            <h4>2. الأسعار الموسمية (Seasonal Rates)</h4>
            <button type="button" class="adm-btn-outline-sm" id="btn-auto-seasons">توليد تلقائي من السعر الأساسي</button>
          </div>
          <div class="adm-season-grid">
            <div class="adm-season-box">
              <strong>الصيف (May – Aug)</strong>
              <label>Triple Cabin <input type="number" name="sTriple" value="${summer.triple || Math.round(base * 0.96)}"></label>
              <label>Double Cabin <input type="number" name="sDouble" value="${summer.double || base}"></label>
              <label>Single Cabin <input type="number" name="sSingle" value="${summer.single || Math.round(base * 1.65)}"></label>
            </div>
            <div class="adm-season-box">
              <strong>الذروة (Sep – Apr)</strong>
              <label>Triple Cabin <input type="number" name="wTriple" value="${winter.triple || Math.round(base * 1.15)}"></label>
              <label>Double Cabin <input type="number" name="wDouble" value="${winter.double || Math.round(base * 1.18)}"></label>
              <label>Single Cabin <input type="number" name="wSingle" value="${winter.single || Math.round(base * 1.9)}"></label>
            </div>
          </div>
        </div>

        <div class="adm-drawer-section">
          <div class="adm-drawer-sec-head">
            <h4>3. جدول الأيام التفاعلي (Itinerary Builder)</h4>
            <button type="button" class="adm-btn-primary-sm" id="btn-drawer-add-day">+ إضافة يوم</button>
          </div>
          <div id="drawer-itinerary-list" class="adm-repeater-list"></div>
        </div>

        <div class="adm-drawer-section">
          <div class="adm-drawer-sec-head">
            <h4>4. فئات الكبائن وفرق السعر (Cabins)</h4>
            <button type="button" class="adm-btn-primary-sm" id="btn-drawer-add-cabin">+ إضافة كابينة</button>
          </div>
          <div id="drawer-cabins-list" class="adm-cabins-builder"></div>
        </div>

        <div class="adm-drawer-section">
          <h4>5. مرافق المركب (Cruise Facilities)</h4>
          <div class="adm-checkbox-grid">
            ${allFacilities.map(f => `
              <label class="adm-chk-item">
                <input type="checkbox" name="facilities" value="${esc(f)}" ${curFacilities.includes(f) ? 'checked' : ''}>
                <span>${esc(f)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="adm-drawer-section">
          <h4>6. الإضافات والبرامج المتاحة داخل فورم الحجز</h4>
          <label class="adm-switch" style="margin-bottom:10px">
            <input type="checkbox" name="allowAllAddons" ${allowedAll ? 'checked' : ''}>
            <span>إظهار كافة الإضافات والبرامج المفعلة تلقائياً (مستحسن)</span>
          </label>
          <div class="adm-checkbox-grid">
            ${allAddonChoices.map(ch => `
              <label class="adm-chk-item">
                <input type="checkbox" name="allowedAddonId" value="${esc(ch.id)}" ${allowedAll || pr.allowedAddonIds?.includes(ch.id) ? 'checked' : ''}>
                <span><strong>${esc(ch.title)}</strong> <small>(${esc(ch.tag)})</small></span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="adm-drawer-section">
          <h4>7. ما يشمله وما لا يشمله البرنامج</h4>
          <div class="adm-form-grid">
            <label>يشمل السعر (سطر لكل بند)
              <textarea name="includedText" rows="4">${esc((pr.included || []).join('\n'))}</textarea>
            </label>
            <label>لا يشمل السعر (سطر لكل بند)
              <textarea name="excludedText" rows="4">${esc((pr.excluded || []).join('\n'))}</textarea>
            </label>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button>
      <button type="submit" form="adm-prog-drawer-form" class="adm-btn-gold">حفظ وتطبيق على البرنامج ✓</button>
    `;

    const dlg = openSlideDrawer({
      title: `تعديل برنامج: ${pr.title}`,
      subtitle: `تابع لمركب: ${v.title}`,
      bodyHtml,
      footerHtml,
      onOpen: (dialogEl) => {
        const dayContainer = $('#drawer-itinerary-list', dialogEl);
        const cabinContainer = $('#drawer-cabins-list', dialogEl);
        renderDayRows(dayContainer);
        renderCabinRows(cabinContainer);

        const syncDayDraftFromDom = () => {
          $$('.adm-repeater-card', dayContainer).forEach((card, i) => {
            if (!draftItinerary[i]) return;
            draftItinerary[i].day = $('[data-day-field="day"]', card)?.value || `Day ${i + 1}`;
            draftItinerary[i].stop = $('[data-day-field="stop"]', card)?.value || '';
            draftItinerary[i].title = $('[data-day-field="title"]', card)?.value || '';
            draftItinerary[i].desc = $('[data-day-field="desc"]', card)?.value || '';
            draftItinerary[i].meals = $('[data-day-field="meals"]', card)?.value || '';
          });
        };

        const syncCabinDraftFromDom = () => {
          $$('.adm-cabin-row', cabinContainer).forEach((row, i) => {
            if (!draftCabins[i]) return;
            draftCabins[i].name = $('[data-cabin-field="name"]', row)?.value || 'Cabin';
            draftCabins[i].priceDelta = Number($('[data-cabin-field="priceDelta"]', row)?.value) || 0;
            draftCabins[i].desc = $('[data-cabin-field="desc"]', row)?.value || '';
            draftCabins[i].id = slugify(draftCabins[i].name);
          });
        };

        $('#btn-drawer-add-day', dialogEl)?.addEventListener('click', () => {
          syncDayDraftFromDom();
          const n = draftItinerary.length + 1;
          draftItinerary.push({ day: `Day ${n}`, stop: 'Nile Sailing', title: `Day ${n} — Guided Sightseeing & Sailing`, desc: 'Visit ancient landmarks with your licensed Egyptologist and enjoy full-board sailing.', meals: 'Breakfast, Lunch & Dinner' });
          renderDayRows(dayContainer);
        });

        dayContainer.addEventListener('click', (e) => {
          const delBtn = e.target.closest('[data-day-del]');
          if (delBtn) {
            syncDayDraftFromDom();
            draftItinerary.splice(Number(delBtn.dataset.dayDel), 1);
            renderDayRows(dayContainer);
            return;
          }
          const mvBtn = e.target.closest('[data-day-move]');
          if (mvBtn) {
            syncDayDraftFromDom();
            const [idxStr, dirStr] = mvBtn.dataset.dayMove.split(':');
            const idx = Number(idxStr), dir = Number(dirStr);
            const target = idx + dir;
            if (target >= 0 && target < draftItinerary.length) {
              [draftItinerary[idx], draftItinerary[target]] = [draftItinerary[target], draftItinerary[idx]];
              renderDayRows(dayContainer);
            }
          }
        });

        $('#btn-drawer-add-cabin', dialogEl)?.addEventListener('click', () => {
          syncCabinDraftFromDom();
          draftCabins.push({ id: 'cabin-' + Date.now(), name: 'Deluxe Suite', priceDelta: 220, desc: 'Upper deck panoramic suite' });
          renderCabinRows(cabinContainer);
        });

        cabinContainer.addEventListener('click', (e) => {
          const delBtn = e.target.closest('[data-cabin-del]');
          if (delBtn) {
            syncCabinDraftFromDom();
            draftCabins.splice(Number(delBtn.dataset.cabinDel), 1);
            renderCabinRows(cabinContainer);
          }
        });

        $('#btn-auto-seasons', dialogEl)?.addEventListener('click', () => {
          const b = Number($('#drawer-base-price', dialogEl)?.value) || 750;
          $('[name="sTriple"]', dialogEl).value = Math.round(b * 0.96);
          $('[name="sDouble"]', dialogEl).value = b;
          $('[name="sSingle"]', dialogEl).value = Math.round(b * 1.65);
          $('[name="wTriple"]', dialogEl).value = Math.round(b * 1.15);
          $('[name="wDouble"]', dialogEl).value = Math.round(b * 1.18);
          $('[name="wSingle"]', dialogEl).value = Math.round(b * 1.9);
          showToast('تم حساب أسعار الصيف والذروة تلقائياً');
        });

        $('#btn-drawer-cancel', dialogEl)?.addEventListener('click', () => dialogEl.close());

        $('#adm-prog-drawer-form', dialogEl)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          syncDayDraftFromDom();
          syncCabinDraftFromDom();
          const fd = new FormData(e.target);

          pr.title = fd.get('title');
          pr.slug = pr.slug || slugify(pr.title);
          pr.tabLabel = fd.get('tabLabel');
          pr.tabSub = fd.get('tabSub');
          pr.duration = fd.get('duration');
          pr.route = fd.get('route');
          pr.nights = Number(fd.get('nights')) || 3;
          pr.basePrice = Number(fd.get('basePrice')) || 750;
          pr.heroVideo = fd.get('heroVideo');
          pr.summary = fd.get('summary');
          pr.canBeAddonForOthers = fd.get('canBeAddonForOthers') === 'on';
          pr.pricingSeasons = {
            summer: {
              triple: Number(fd.get('sTriple')) || pr.basePrice,
              double: Number(fd.get('sDouble')) || pr.basePrice,
              single: Number(fd.get('sSingle')) || Math.round(pr.basePrice * 1.65)
            },
            winter: {
              triple: Number(fd.get('wTriple')) || Math.round(pr.basePrice * 1.15),
              double: Number(fd.get('wDouble')) || Math.round(pr.basePrice * 1.18),
              single: Number(fd.get('wSingle')) || Math.round(pr.basePrice * 1.9)
            }
          };
          pr.itinerary = draftItinerary;
          pr.routeStops = draftItinerary.map((it, idx) => ({ stop: it.stop || `Stop ${idx + 1}`, day: it.day || `Day ${idx + 1}` }));
          pr.cabins = draftCabins;
          pr.facilities = fd.getAll('facilities');
          pr.allowedAddonIds = fd.get('allowAllAddons') === 'on' ? ['ALL'] : fd.getAll('allowedAddonId');
          pr.included = String(fd.get('includedText') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          pr.excluded = String(fd.get('excludedText') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

          dialogEl.close();
          await saveAndRefresh(containerSelector, `تم تحديث برنامج "${pr.title}" بنجاح`, beforeSnap);
        });
      }
    });
    return dlg;
  }

  // ==================== SIGHTSEEING PLACES (COMPACT + SEARCH + DRAWER) ====================
  function renderSightseeingTab(st) {
    const cur = st.settings?.currencySymbol || '$';
    const places = st.sightseeingPlaces || [];
    const locations = [...new Set(places.map(p => p.location).filter(Boolean))];
    const q = searchQuery.trim().toLowerCase();

    const filtered = places.map((pl, idx) => ({ pl, idx })).filter(({ pl }) => {
      if (sightLocationFilter !== 'all' && pl.location !== sightLocationFilter) return false;
      if (!q) return true;
      return `${pl.title} ${pl.location} ${pl.highlights}`.toLowerCase().includes(q);
    });

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة المزارات السياحية (${places.length} مزار)</h2>
          <p>تظهر تلقائياً في قسم "Nubian and the Nile" وداخل كل برنامج باسم "Sightseeing with Tour Guide". استخدم التعديل السريع أو افتح بطاقة المزار للتفاصيل.</p>
        </div>
        <button type="button" class="adm-btn-gold" id="btn-add-sightseeing">+ إضافة مزار جديد</button>
      </div>

      <div class="adm-toolbar">
        <div class="adm-filter-chips">
          <button type="button" class="adm-chip ${sightLocationFilter === 'all' ? 'active' : ''}" data-sight-loc-filter="all">الكل (${places.length})</button>
          ${locations.map(loc => `
            <button type="button" class="adm-chip ${sightLocationFilter === loc ? 'active' : ''}" data-sight-loc-filter="${esc(loc)}">${esc(loc)}</button>
          `).join('')}
        </div>
        <div class="adm-search-box">
          <input type="search" id="adm-global-search" value="${esc(searchQuery)}" placeholder="🔍 ابحث عن معبد أو مزار..." aria-label="بحث في المزارات">
        </div>
      </div>

      <div class="adm-compact-grid">
        ${filtered.map(({ pl, idx }) => `
          <article class="adm-compact-card ${pl.enabled === false ? 'is-off' : ''}">
            <div class="adm-cc-head">
              <img src="${esc(pl.image || 'assets/egypt-temple.webp')}" alt="" class="adm-cc-thumb">
              <div class="adm-cc-info">
                <span class="pill home">${esc(pl.location)}</span>
                <h4>${esc(pl.title)}</h4>
                <small>⏱ ${esc(pl.duration || '3 Hours')} · ${esc((pl.shortDesc || pl.highlights || '').slice(0, 75))}...</small>
              </div>
            </div>
            <div class="adm-cc-quickbar">
              <label class="adm-inline-price">
                <span>السعر (${cur}):</span>
                <input type="number" value="${Number(pl.price) || 0}" data-quick-sight-price="${idx}" min="0" aria-label="سعر ${esc(pl.title)}">
              </label>
              <label class="adm-switch-mini">
                <input type="checkbox" data-quick-sight-toggle="${idx}" ${pl.enabled !== false ? 'checked' : ''}>
                <span>${pl.enabled !== false ? 'مفعّل' : 'مخفي'}</span>
              </label>
              <div class="adm-cc-btns">
                <button type="button" class="adm-btn-primary-sm" data-open-sight-drawer="${idx}">تعديل</button>
                <button type="button" class="adm-btn-danger-sm" data-delete-sight="${idx}">حذف</button>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function openSightDrawer(st, idx, containerSelector) {
    const pl = st.sightseeingPlaces?.[idx];
    if (!pl) return;
    const beforeSnap = captureSnapshot();
    openSlideDrawer({
      title: `تعديل مزار: ${pl.title}`,
      subtitle: `الموقع: ${pl.location}`,
      bodyHtml: `
        <form id="adm-sight-drawer-form" class="adm-drawer-form">
          <div class="adm-form-grid">
            <label>اسم المزار * <input type="text" name="title" value="${esc(pl.title)}" required autofocus></label>
            <label>المنطقة (Location) <input type="text" name="location" value="${esc(pl.location)}" required></label>
            <label>السعر (USD) <input type="number" name="price" value="${Number(pl.price) || 0}" min="0" required></label>
            <label>المدة <input type="text" name="duration" value="${esc(pl.duration || '3 Hours')}"></label>
            <div class="full-col">${mediaFieldHtml('image', 'صورة المزار', pl.image || 'assets/egypt-temple.webp', false)}</div>
            <label class="full-col">أبرز المعالم (تظهر أسفل البطاقة) <textarea name="highlights" rows="2">${esc(pl.highlights || pl.shortDesc || '')}</textarea></label>
            <label class="full-col">الوصف الكامل في صفحة See More <textarea name="fullOverview" rows="4">${esc(pl.fullOverview || '')}</textarea></label>
          </div>
          <label class="adm-switch" style="margin-top:12px">
            <input type="checkbox" name="enabled" ${pl.enabled !== false ? 'checked' : ''}>
            <span>مفعّل في "Nubian and the Nile" وداخل البرامج</span>
          </label>
        </form>
      `,
      footerHtml: `
        <button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button>
        <button type="submit" form="adm-sight-drawer-form" class="adm-btn-gold">حفظ التعديلات ✓</button>
      `,
      onOpen: (dlg) => {
        $('#btn-drawer-cancel', dlg)?.addEventListener('click', () => dlg.close());
        $('#adm-sight-drawer-form', dlg)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          st.sightseeingPlaces[idx] = {
            ...pl,
            title: fd.get('title'),
            slug: slugify(fd.get('title')),
            location: fd.get('location'),
            price: Number(fd.get('price')) || 0,
            duration: fd.get('duration'),
            image: fd.get('image'),
            highlights: fd.get('highlights'),
            shortDesc: fd.get('highlights'),
            fullOverview: fd.get('fullOverview'),
            enabled: fd.get('enabled') === 'on'
          };
          dlg.close();
          await saveAndRefresh(containerSelector, `تم تحديث "${st.sightseeingPlaces[idx].title}"`, beforeSnap);
        });
      }
    });
  }

  // ==================== ADD-ONS TAB (COMPACT + DRAWER) ====================
  function renderAddonsTab(st) {
    const cur = st.settings?.currencySymbol || '$';
    const addons = st.addons || [];
    const linkedProgs = [];
    [...(st.cruises || []), ...(st.dahabiyas || [])].forEach(v => {
      (v.programs || []).forEach(p => {
        if (p.canBeAddonForOthers) linkedProgs.push({ v, p });
      });
    });

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة الإضافات والبرامج الاختيارية (${addons.length})</h2>
          <p>تحكم في خدمات VIP، المنطاد، وبرامج القاهرة والبحر الأحمر التي تظهر للعميل عند الحجز.</p>
        </div>
        <button type="button" class="adm-btn-gold" id="btn-add-addon">+ إضافة Add-on جديد</button>
      </div>

      <div class="adm-compact-grid">
        ${addons.map((ad, idx) => `
          <article class="adm-compact-card ${ad.enabled === false ? 'is-off' : ''}">
            <div class="adm-cc-head">
              <img src="${esc(ad.image || 'assets/egypt-temple.webp')}" alt="" class="adm-cc-thumb">
              <div class="adm-cc-info">
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <span class="pill home">${esc(ad.category)}</span>
                  ${ad.showOnHome ? '<span class="pill on">بالرئيسية</span>' : ''}
                </div>
                <h4>${esc(ad.title)}</h4>
                <small>⏱ ${esc(ad.duration)} · ${esc(ad.priceUnit)}</small>
              </div>
            </div>
            <div class="adm-cc-quickbar">
              <label class="adm-inline-price">
                <span>السعر (${cur}):</span>
                <input type="number" value="${Number(ad.price) || 0}" data-quick-addon-price="${idx}" min="0" aria-label="سعر ${esc(ad.title)}">
              </label>
              <label class="adm-switch-mini">
                <input type="checkbox" data-quick-addon-toggle="${idx}" ${ad.enabled !== false ? 'checked' : ''}>
                <span>${ad.enabled !== false ? 'مفعّل' : 'مخفي'}</span>
              </label>
              <div class="adm-cc-btns">
                <button type="button" class="adm-btn-primary-sm" data-open-addon-drawer="${idx}">تعديل</button>
                <button type="button" class="adm-btn-danger-sm" data-delete-addon="${idx}">حذف</button>
              </div>
            </div>
          </article>
        `).join('')}
      </div>

      ${linkedProgs.length ? `
        <div class="adm-card" style="margin-top:22px">
          <h3>برامج الكروزات والذهبيات المفعّلة تلقائياً كـ Add-on (${linkedProgs.length})</h3>
          <div class="adm-linked-list">
            ${linkedProgs.map(lp => `<div>✦ <strong>${esc(lp.p.title)}</strong> (${esc(lp.v.title)}) — ${cur}${lp.p.basePrice}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function openAddonDrawer(st, idx, containerSelector) {
    const ad = st.addons?.[idx];
    if (!ad) return;
    const beforeSnap = captureSnapshot();
    openSlideDrawer({
      title: `تعديل إضافة: ${ad.title}`,
      subtitle: ad.category || 'Program Extension',
      bodyHtml: `
        <form id="adm-addon-drawer-form" class="adm-drawer-form">
          <div class="adm-form-grid">
            <label>الاسم * <input type="text" name="title" value="${esc(ad.title)}" required autofocus></label>
            <label>النوع
              <select name="type">
                <option value="program-extension" ${ad.type === 'program-extension' ? 'selected' : ''}>برنامج إضافي (Extension)</option>
                <option value="excursion" ${ad.type === 'excursion' ? 'selected' : ''}>رحلة سياحية (Excursion)</option>
                <option value="service" ${ad.type === 'service' ? 'selected' : ''}>خدمة VIP / انتقال</option>
              </select>
            </label>
            <label>التصنيف <input type="text" name="category" value="${esc(ad.category)}"></label>
            <label>المدة <input type="text" name="duration" value="${esc(ad.duration)}"></label>
            <label>السعر (USD) <input type="number" name="price" value="${ad.price}" min="0" required></label>
            <label>طريقة الحساب
              <select name="priceUnit">
                <option value="per person" ${ad.priceUnit === 'per person' ? 'selected' : ''}>لكل فرد (per person)</option>
                <option value="per booking" ${ad.priceUnit === 'per booking' ? 'selected' : ''}>لكل حجز (per booking)</option>
              </select>
            </label>
            <div class="full-col">${mediaFieldHtml('image', 'صورة الإضافة', ad.image, false)}</div>
            <label class="full-col">الوصف <textarea name="summary" rows="3">${esc(ad.summary)}</textarea></label>
          </div>
          <div class="adm-toggles-row" style="margin-top:14px">
            <label class="adm-switch"><input type="checkbox" name="enabled" ${ad.enabled !== false ? 'checked' : ''}><span>مفعّل داخل نماذج البرامج</span></label>
            <label class="adm-switch"><input type="checkbox" name="showOnHome" ${ad.showOnHome ? 'checked' : ''}><span>إظهار في الصفحة الرئيسية</span></label>
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button>
        <button type="submit" form="adm-addon-drawer-form" class="adm-btn-gold">حفظ الإضافة ✓</button>
      `,
      onOpen: (dlg) => {
        $('#btn-drawer-cancel', dlg)?.addEventListener('click', () => dlg.close());
        $('#adm-addon-drawer-form', dlg)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          st.addons[idx] = {
            ...ad,
            title: fd.get('title'),
            type: fd.get('type'),
            category: fd.get('category'),
            duration: fd.get('duration'),
            price: Number(fd.get('price')) || 0,
            priceUnit: fd.get('priceUnit'),
            image: fd.get('image'),
            summary: fd.get('summary'),
            enabled: fd.get('enabled') === 'on',
            showOnHome: fd.get('showOnHome') === 'on'
          };
          dlg.close();
          await saveAndRefresh(containerSelector, `تم تحديث "${st.addons[idx].title}"`, beforeSnap);
        });
      }
    });
  }

  // ==================== FAQS MANAGER TAB (NEW!) ====================
  function renderFaqsTab(st) {
    const faqs = st.faqs || [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = faqs.map((f, idx) => ({ f, idx })).filter(({ f }) => {
      if (faqScopeFilter !== 'all-filter' && faqScopeFilter !== 'all') {
        if (f.scope !== faqScopeFilter) return false;
      }
      if (!q) return true;
      return `${f.question} ${f.answer} ${f.scope}`.toLowerCase().includes(q);
    });

    const scopeName = (code) => (FAQ_SCOPES.find(s => s[0] === code)?.[1]) || code || 'عام';

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة الأسئلة الشائعة — FAQ (${faqs.length})</h2>
          <p>تظهر هذه الأسئلة تلقائياً أسفل كل صفحة في الموقع حسب النطاق المحدد (صفحة محددة أو كل الصفحات).</p>
        </div>
        <button type="button" class="adm-btn-gold" id="btn-add-faq">+ إضافة سؤال جديد</button>
      </div>

      <div class="adm-toolbar">
        <div class="adm-filter-chips">
          <button type="button" class="adm-chip ${faqScopeFilter === 'all' ? 'active' : ''}" data-faq-scope-filter="all">الكل (${faqs.length})</button>
          ${FAQ_SCOPES.map(([code, lbl]) => `
            <button type="button" class="adm-chip ${faqScopeFilter === code && faqScopeFilter !== 'all' ? 'active' : ''}" data-faq-scope-filter="${code}">${esc(lbl.split('(')[0].trim())}</button>
          `).join('')}
        </div>
        <div class="adm-search-box">
          <input type="search" id="adm-global-search" value="${esc(searchQuery)}" placeholder="🔍 ابحث في الأسئلة أو الإجابات..." aria-label="بحث في الأسئلة الشائعة">
        </div>
      </div>

      <div class="adm-faq-admin-list">
        ${!filtered.length ? '<div class="adm-empty">لا توجد أسئلة مطابقة. اضغط "+ إضافة سؤال جديد" للبدء.</div>' : filtered.map(({ f, idx }) => `
          <article class="adm-faq-row ${f.enabled === false ? 'is-off' : ''}">
            <div class="adm-faq-row-main">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                <span class="pill home">${esc(scopeName(f.scope))}</span>
                <em class="pill ${f.enabled !== false ? 'on' : 'off'}">${f.enabled !== false ? 'ظاهر بالموقع' : 'مخفي'}</em>
              </div>
              <h4>${esc(f.question)}</h4>
              <p>${esc(f.answer)}</p>
            </div>
            <div class="adm-faq-row-actions">
              <button type="button" class="adm-btn-outline-sm" data-move-faq="${idx}:-1" title="تحريك لأعلى">↑</button>
              <button type="button" class="adm-btn-outline-sm" data-move-faq="${idx}:1" title="تحريك لأسفل">↓</button>
              <label class="adm-switch-mini">
                <input type="checkbox" data-quick-faq-toggle="${idx}" ${f.enabled !== false ? 'checked' : ''}>
                <span>مفعّل</span>
              </label>
              <button type="button" class="adm-btn-primary-sm" data-open-faq-drawer="${idx}">تعديل</button>
              <button type="button" class="adm-btn-danger-sm" data-delete-faq="${idx}">حذف</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function openFaqDrawer(st, idx, containerSelector, defaultScope = 'all') {
    const isNew = idx === null || idx === undefined;
    const beforeSnap = captureSnapshot();
    const item = isNew
      ? { id: 'faq-' + Date.now(), scope: defaultScope || 'all', question: '', answer: '', enabled: true }
      : st.faqs[idx];
    if (!item) return;

    openSlideDrawer({
      title: isNew ? 'إضافة سؤال شائع جديد' : 'تعديل السؤال والإجابة',
      subtitle: 'يظهر تلقائياً في أسفل صفحات الموقع',
      bodyHtml: `
        <form id="adm-faq-drawer-form" class="adm-drawer-form">
          <div class="adm-form-grid">
            <label class="full-col">نطاق الظهور (الصفحة المستهدفة)
              <select name="scope">
                ${FAQ_SCOPES.map(([code, lbl]) => `<option value="${code}" ${item.scope === code ? 'selected' : ''}>${esc(lbl)}</option>`).join('')}
              </select>
            </label>
            <label class="full-col">نص السؤال (English or Arabic) *
              <input type="text" name="question" value="${esc(item.question)}" required autofocus placeholder="e.g. What is included in my Nile Cruise?">
            </label>
            <label class="full-col">الإجابة التفصيلية *
              <textarea name="answer" rows="5" required placeholder="اكتب إجابة واضحة ومفيدة للعميل الأجنبي...">${esc(item.answer)}</textarea>
            </label>
          </div>
          <label class="adm-switch" style="margin-top:12px">
            <input type="checkbox" name="enabled" ${item.enabled !== false ? 'checked' : ''}>
            <span>إظهار السؤال للزوار على الموقع</span>
          </label>
        </form>
      `,
      footerHtml: `
        <button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button>
        <button type="submit" form="adm-faq-drawer-form" class="adm-btn-gold">${isNew ? 'إضافة السؤال ✓' : 'حفظ التعديلات ✓'}</button>
      `,
      onOpen: (dlg) => {
        $('#btn-drawer-cancel', dlg)?.addEventListener('click', () => dlg.close());
        $('#adm-faq-drawer-form', dlg)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const updated = {
            id: item.id,
            scope: fd.get('scope') || 'all',
            question: fd.get('question'),
            answer: fd.get('answer'),
            enabled: fd.get('enabled') === 'on'
          };
          if (!Array.isArray(st.faqs)) st.faqs = [];
          if (isNew) st.faqs.unshift(updated);
          else st.faqs[idx] = updated;
          dlg.close();
          await saveAndRefresh(containerSelector, isNew ? 'تم إضافة السؤال بنجاح' : 'تم حفظ تعديل السؤال', beforeSnap);
        });
      }
    });
  }

  // ==================== CUSTOM PAGES BUILDER TAB ====================
  function renderPagesTab(st) {
    const pages = st.customPages || [];
    if (!editingPageId || !pages.some(pg => pg.id === editingPageId)) {
      editingPageId = pages[0]?.id;
    }
    const pg = pages.find(x => x.id === editingPageId);

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة وبناء الصفحات المخصصة</h2>
          <p>أضف صفحات جديدة بالكامل وتحكم في ظهورها بالقائمة العلوية أو الصفحة الرئيسية ومحتواها الداخلي.</p>
        </div>
        <button type="button" class="adm-btn-gold" id="btn-add-custom-page">+ إنشاء صفحة جديدة</button>
      </div>

      <div class="adm-split-workspace">
        <aside class="adm-vessel-list">
          <div class="adm-list-header">الصفحات (${pages.length})</div>
          ${!pages.length ? '<p class="muted" style="padding:16px">لا توجد صفحات بعد.</p>' : pages.map(item => `
            <div class="adm-vessel-item ${item.id === pg?.id ? 'active' : ''}" data-select-page="${esc(item.id)}">
              <img src="${esc(item.heroImage || 'assets/egypt-temple.webp')}" alt="">
              <div style="min-width:0;flex:1">
                <strong>${esc(item.title)}</strong>
                <span dir="ltr">/page/${esc(item.slug)}</span>
                <div class="adm-item-badges">
                  <em class="pill ${item.enabled !== false ? 'on' : 'off'}">${item.enabled !== false ? 'مفعّلة' : 'مخفية'}</em>
                  ${item.showOnHome ? '<em class="pill home">بالرئيسية</em>' : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </aside>

        <div>
          ${pg ? `
            <form id="adm-page-form" data-page-id="${esc(pg.id)}" class="adm-card">
              <div class="adm-card-head">
                <h3>تحرير: ${esc(pg.title)}</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <a href="#/page/${esc(pg.slug)}" target="_blank" class="adm-btn-outline-sm">معاينة ↗</a>
                  <button type="submit" class="adm-btn-gold">حفظ الصفحة</button>
                </div>
              </div>

              <div class="adm-form-grid">
                <label>عنوان الصفحة * <input type="text" name="title" value="${esc(pg.title)}" required></label>
                <label>الرابط المختصر (Slug) <input type="text" name="slug" value="${esc(pg.slug)}" required dir="ltr"></label>
                <label>العنوان الصغير (Eyebrow) <input type="text" name="heroEyebrow" value="${esc(pg.heroEyebrow)}"></label>
                <label>مكان القائمة العلوية
                  <select name="navParent">
                    <option value="beyond-the-nile" ${pg.navParent === 'beyond-the-nile' ? 'selected' : ''}>ضمن Beyond the Nile</option>
                    <option value="journeys" ${pg.navParent === 'journeys' ? 'selected' : ''}>ضمن Journeys</option>
                    <option value="nile-cruises" ${pg.navParent === 'nile-cruises' ? 'selected' : ''}>ضمن Nile Cruises</option>
                    <option value="dahabiyas" ${pg.navParent === 'dahabiyas' ? 'selected' : ''}>ضمن Dahabiyas</option>
                    <option value="about" ${pg.navParent === 'about' ? 'selected' : ''}>ضمن About</option>
                    <option value="top" ${pg.navParent === 'top' ? 'selected' : ''}>رابط رئيسي بالهيدر</option>
                  </select>
                </label>
                <div class="full-col">${mediaFieldHtml('heroImage', 'صورة الخلفية للصفحة', pg.heroImage, false)}</div>
                <label class="full-col">وصف الصفحة الرئيسي <textarea name="heroSub" rows="2">${esc(pg.heroSub)}</textarea></label>
              </div>

              <div class="adm-toggles-row">
                <label class="adm-switch"><input type="checkbox" name="enabled" ${pg.enabled !== false ? 'checked' : ''}><span>نشر الصفحة</span></label>
                <label class="adm-switch"><input type="checkbox" name="showInNavbar" ${pg.showInNavbar ? 'checked' : ''}><span>إظهار في القائمة</span></label>
                <label class="adm-switch"><input type="checkbox" name="showOnHome" ${pg.showOnHome ? 'checked' : ''}><span>إظهار في الرئيسية</span></label>
                <button type="button" class="adm-btn-danger-sm" data-delete-page="${esc(pg.id)}">حذف الصفحة</button>
              </div>

              <hr class="adm-sep">
              <div class="adm-card-head" style="border:0;padding-bottom:8px">
                <h3>البلوكات الداخلية (${(pg.blocks || []).length})</h3>
                <div class="adm-add-block-bar">
                  <select id="new-block-type">
                    <option value="text-image">نص + صورة</option>
                    <option value="cards-grid">شبكة كروت</option>
                    <option value="cta-banner">بنر دعوة للحجز (CTA)</option>
                  </select>
                  <button type="button" class="adm-btn-primary" id="btn-add-page-block" data-page-id="${esc(pg.id)}">+ إضافة بلوك</button>
                </div>
              </div>

              <div class="adm-blocks-list">
                ${(pg.blocks || []).map((blk, bIdx) => `
                  <div class="adm-block-card" data-block-index="${bIdx}">
                    <div class="adm-block-head">
                      <strong>بلوك #${bIdx + 1} (${esc(blk.type)})</strong>
                      <div style="display:flex;gap:6px">
                        <button type="button" class="adm-btn-outline-sm" data-move-block="${bIdx}:-1">↑</button>
                        <button type="button" class="adm-btn-outline-sm" data-move-block="${bIdx}:1">↓</button>
                        <button type="button" class="adm-btn-danger-sm" data-delete-block="${bIdx}">حذف</button>
                      </div>
                    </div>
                    <input type="hidden" name="blk_type_${bIdx}" value="${esc(blk.type)}">
                    <div class="adm-form-grid">
                      <label>العنوان <input type="text" name="blk_heading_${bIdx}" value="${esc(blk.heading)}"></label>
                      ${blk.type === 'text-image' ? `<label>العنوان الفرعي <input type="text" name="blk_eyebrow_${bIdx}" value="${esc(blk.eyebrow || '')}"></label>` : ''}
                      ${blk.type === 'text-image' ? `<div class="full-col">${mediaFieldHtml(`blk_image_${bIdx}`, 'صورة البلوك', blk.image || '', false)}</div>` : ''}
                      ${blk.type !== 'cards-grid' ? `<label class="full-col">المحتوى <textarea name="blk_body_${bIdx}" rows="3">${esc(blk.body || '')}</textarea></label>` : ''}
                      ${blk.type === 'cta-banner' ? `
                        <label>نص الزر <input type="text" name="blk_btnText_${bIdx}" value="${esc(blk.btnText || '')}"></label>
                        <label>الرابط <input type="text" name="blk_btnUrl_${bIdx}" value="${esc(blk.btnUrl || '')}" dir="ltr"></label>
                      ` : ''}
                      ${blk.type === 'cards-grid' ? `
                        <label class="full-col">بيانات الكروت (عنوان | وصف مختصر لكل سطر)
                          <textarea name="blk_items_${bIdx}" rows="4">${esc((blk.items || []).map(it => `${it.title || ''} | ${it.desc || ''}`).join('\n'))}</textarea>
                        </label>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </form>
          ` : '<div class="adm-empty">أنشئ صفحة جديدة للبدء.</div>'}
        </div>
      </div>
    `;
  }

  const EDIT_MODE_KEY = 'nt_live_edit_mode';
  const EDIT_SUBMODE_KEY = 'nt_live_submode';
  const PREVIEW_DEVICE_KEY = 'nt_live_preview_device';
  const STATIC_PAGE_LABELS = {
    'our-story': 'قصتنا (Our Story)',
    'why-niletrails': 'لماذا NileTrails',
    'our-team': 'فريق العمل (Our Team)',
    'why-dahabiya': 'لماذا الإبحار بالذهبية (Why Dahabiya)',
    'travel-information': 'معلومات السفر (Travel Information)',
    'contact': 'صفحة اتصل بنا (Contact Us)',
    'privacy-policy': 'سياسة الخصوصية (Privacy Policy)',
    'terms-and-conditions': 'الشروط والأحكام (Terms & Conditions)'
  };

  function isEditMode() {
    if (!CMS.isAuthenticated()) return false;
    try { return sessionStorage.getItem(EDIT_MODE_KEY) === '1'; } catch { return false; }
  }

  function setEditMode(enabled) {
    const val = Boolean(enabled) && CMS.isAuthenticated();
    try { sessionStorage.setItem(EDIT_MODE_KEY, val ? '1' : '0'); } catch {}
  }

  function getSubMode() {
    try {
      const m = sessionStorage.getItem(EDIT_SUBMODE_KEY);
      return m === 'browse' || m === 'elements' ? m : 'select';
    } catch { return 'select'; }
  }

  function setSubMode(mode) {
    try {
      const next = mode === 'browse' || mode === 'elements' ? mode : 'select';
      sessionStorage.setItem(EDIT_SUBMODE_KEY, next);
    } catch {}
  }

  function getPreviewDevice() {
    try {
      const v = sessionStorage.getItem(PREVIEW_DEVICE_KEY);
      return v === 'mobile' || v === 'tablet' ? v : 'desktop';
    } catch { return 'desktop'; }
  }

  function setPreviewDevice(dev) {
    try { sessionStorage.setItem(PREVIEW_DEVICE_KEY, dev === 'mobile' || dev === 'tablet' ? dev : 'desktop'); } catch {}
  }

  function buildDefaultProgram(target, overrides = {}) {
    const isDah = target?.kind === 'dahabiya';
    const pid = (target?.id || 'vessel') + '-prog-' + Date.now();
    return {
      id: pid,
      slug: 'custom-program-' + Math.floor(100 + Math.random() * 900),
      tabLabel: '4 Nights',
      tabSub: 'Luxor → Aswan',
      title: '5 Days / 4 Nights — Luxor to Aswan Program',
      nights: 4,
      duration: '5 Days / 4 Nights',
      route: 'Luxor → Esna → Edfu → Kom Ombo → Aswan',
      basePrice: Number(target?.basePrice) || 890,
      canBeAddonForOthers: true,
      heroVideo: target?.heroVideo || (isDah ? 'assets/videos/hero-dahabiya-1.mp4' : 'assets/videos/hero-cruise-1.mp4'),
      summary: 'Full-board sailing program with private Egyptologist tour guide.',
      facilities: [...(CMS.DEFAULT_FACILITIES || [])],
      allowedAddonIds: ['ALL'],
      pricingSeasons: { summer: { triple: 850, double: 890, single: 1470 }, winter: { triple: 1020, double: 1050, single: 1690 } },
      itinerary: [
        { day: 'Day 1', stop: 'Luxor', title: 'Embarkation & Karnak Temple', desc: 'Check-in & East Bank guided tour.', meals: 'Lunch & Dinner' },
        { day: 'Day 2', stop: 'West Bank', title: 'Valley of the Kings & Sail to Edfu', desc: 'Royal tombs & Hatshepsut Temple.', meals: 'Breakfast, Lunch & Dinner' },
        { day: 'Day 3', stop: 'Kom Ombo', title: 'Edfu & Kom Ombo Temples', desc: 'Sail south toward Aswan.', meals: 'Breakfast, Lunch & Dinner' },
        { day: 'Day 4', stop: 'Aswan', title: 'Philae Temple & Disembarkation', desc: 'Island temple visit & farewell.', meals: 'Breakfast' }
      ],
      cabins: [
        { id: 'triple-cabin', name: 'Triple Cabin', priceDelta: -40, desc: '3 persons sharing' },
        { id: 'double-cabin', name: 'Double Cabin', priceDelta: 0, desc: '2 persons sharing' },
        { id: 'single-cabin', name: 'Single Cabin', priceDelta: 580, desc: 'Private sole use' }
      ],
      included: ['Full-board onboard', 'Licensed Egyptologist guide'],
      excluded: ['International flights', 'Optional sightseeing tours'],
      ...overrides
    };
  }

  function buildDefaultVessel(isDahabiya) {
    const id = (isDahabiya ? 'dahabiya-' : 'cruise-') + Date.now();
    const vessel = {
      id,
      slug: (isDahabiya ? 'new-dahabiya-' : 'new-cruise-') + Math.floor(100 + Math.random() * 900),
      title: isDahabiya ? 'New Boutique Dahabiya' : 'New 5-Star Nile Cruise',
      tier: 'Luxury',
      nights: 4,
      basePrice: 890,
      route: 'Luxor – Aswan',
      image: isDahabiya ? 'assets/nile-sailing.webp' : 'assets/nile-cruise.webp',
      heroVideo: isDahabiya ? 'assets/videos/hero-dahabiya-1.mp4' : 'assets/videos/hero-cruise-1.mp4',
      kind: isDahabiya ? 'dahabiya' : 'cruise',
      sub: 'Newly added Nile vessel ready for customization.',
      facilities: [...(CMS.DEFAULT_FACILITIES || [])],
      enabled: true,
      showOnHome: true,
      programs: []
    };
    vessel.programs.push(buildDefaultProgram(vessel));
    return vessel;
  }

  function buildDefaultSightseeing() {
    return {
      id: 'sight-' + Date.now(),
      slug: 'custom-sightseeing-' + Math.floor(100 + Math.random() * 900),
      location: 'Aswan Nuba',
      title: 'New Guided Sightseeing Excursion',
      highlights: 'Guided visit with licensed private Egyptologist, entry tickets and private transfers.',
      shortDesc: 'Guided visit with licensed private Egyptologist, entry tickets and private transfers.',
      fullOverview: 'Experience this historic Nile monument with your personal licensed Egyptologist guide.',
      duration: '3 Hours',
      price: 55,
      priceUnit: 'per person',
      image: 'assets/egypt-temple.webp',
      enabled: true,
      canAddToJourney: true
    };
  }

  function buildDefaultAddon() {
    return {
      id: 'addon-' + Date.now(),
      title: 'New Program Extension / Add-on',
      type: 'program-extension',
      category: 'Other Program Extension',
      duration: '+2 Days / 1 Night',
      price: 290,
      priceUnit: 'per person',
      summary: 'Extend your Nile cruise seamlessly.',
      image: 'assets/egypt-temple.webp',
      enabled: true,
      showOnHome: false
    };
  }

  function buildDefaultCustomPage() {
    return {
      id: 'page-' + Date.now(),
      slug: 'custom-experience-' + Math.floor(100 + Math.random() * 900),
      title: 'New Custom Egypt Experience',
      heroEyebrow: 'TAILOR-MADE COLLECTION',
      heroSub: 'Describe your new destination, package, or special seasonal offer here.',
      heroImage: 'assets/egypt-temple.webp',
      enabled: true,
      showOnHome: true,
      showInNavbar: true,
      navParent: 'beyond-the-nile',
      blocks: [{
        type: 'text-image',
        eyebrow: 'FEATURED EXPERIENCE',
        heading: 'Crafted around your curiosity.',
        body: 'Add custom paragraphs, photos, and call-to-action buttons from the page builder.',
        image: 'assets/nile-sailing.webp'
      }]
    };
  }

  function openVesselDrawer(st, vesselId, targetOrCb) {
    const v = [...(st.cruises || []), ...(st.dahabiyas || [])].find(x => x.id === vesselId);
    if (!v) return;
    const beforeSnap = captureSnapshot();
    const cur = st.settings?.currencySymbol || '$';

    openSlideDrawer({
      title: `تعديل ${v.kind === 'dahabiya' ? 'الذهبية' : 'الكروز'}: ${v.title}`,
      subtitle: `#/${v.kind === 'dahabiya' ? 'dahabiyas' : 'nile-cruises'}/${v.slug}`,
      bodyHtml: `
        <form id="adm-vessel-drawer-form" class="adm-drawer-form">
          <div class="adm-form-grid">
            <label>اسم المركب / الذهبية * <input type="text" name="title" value="${esc(v.title)}" required autofocus></label>
            <label>الفئة (Tier)
              <select name="tier">
                <option value="Luxury" ${v.tier === 'Luxury' ? 'selected' : ''}>Luxury / فاخرة</option>
                <option value="Deluxe" ${v.tier === 'Deluxe' ? 'selected' : ''}>Deluxe / ديلوكس</option>
                <option value="Superior" ${v.tier === 'Superior' ? 'selected' : ''}>Superior / متميزة</option>
                <option value="Private" ${v.tier === 'Private' ? 'selected' : ''}>Private / خاصة</option>
              </select>
            </label>
            <label>خط الإبحار الرئيسي <input type="text" name="route" value="${esc(v.route)}"></label>
            <label>عدد الليالي المعروض <input type="number" name="nights" value="${v.nights || 4}" min="1"></label>
            <div class="full-col adm-standalone-price-box">
              <div class="adm-spb-head">
                <label style="flex:1;min-width:200px">
                  سعر ${v.kind === 'dahabiya' ? 'الذهبية' : 'الكروز'} الأساسي بدون أي إضافات (${cur}) *
                  <input type="number" name="basePrice" value="${Number(v.basePrice) || Number(v.programs?.[0]?.basePrice) || 890}" min="0" step="1" required>
                </label>
                <label class="adm-switch" style="align-self:flex-end;padding-bottom:6px">
                  <input type="checkbox" name="syncPrimaryProgram" checked>
                  <span>تحديث سعر البرنامج الأساسي الأول تلقائياً</span>
                </label>
              </div>
            </div>
            <div class="full-col">${mediaFieldHtml('image', 'صورة المركب / الذهبية', v.image || 'assets/nile-cruise.webp', false)}</div>
            <div class="full-col">${mediaFieldHtml('heroVideo', 'فيديو البداية الصامت (Hero Autoplay)', v.heroVideo || '', true)}</div>
            <label class="full-col">الوصف المختصر <textarea name="sub" rows="3">${esc(v.sub || '')}</textarea></label>
          </div>
          <div class="adm-toggles-row" style="margin-top:12px">
            <label class="adm-switch"><input type="checkbox" name="enabled" ${v.enabled !== false ? 'checked' : ''}><span>مفعّل على الموقع</span></label>
            <label class="adm-switch"><input type="checkbox" name="showOnHome" ${v.showOnHome ? 'checked' : ''}><span>إظهار بالرئيسية</span></label>
          </div>
          ${(v.programs || []).length ? `
            <hr class="adm-sep">
            <h4 style="margin:0 0 8px">تحرير سريع لأي برنامج داخل "${esc(v.title)}"</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${(v.programs || []).map(pr => `
                <button type="button" class="adm-btn-outline-sm" data-jump-prog="${esc(pr.id)}">✏ ${esc(pr.tabLabel || pr.duration)} (${cur}${Number(pr.basePrice) || 890})</button>
              `).join('')}
            </div>
          ` : ''}
        </form>
      `,
      footerHtml: `<button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button><button type="submit" form="adm-vessel-drawer-form" class="adm-btn-gold">حفظ وتحديث فوراً ✓</button>`,
      onOpen: (dlg) => {
        $('#btn-drawer-cancel', dlg)?.addEventListener('click', () => dlg.close());
        $$('[data-jump-prog]', dlg).forEach(btn => {
          btn.addEventListener('click', () => {
            const pid = btn.dataset.jumpProg;
            dlg.close();
            openProgramDrawer(st, vesselId, pid, targetOrCb);
          });
        });
        $('#adm-vessel-drawer-form', dlg)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          v.title = fd.get('title');
          v.tier = fd.get('tier');
          v.route = fd.get('route');
          v.nights = Number(fd.get('nights')) || 4;
          const cleanBase = Number(fd.get('basePrice')) || 0;
          if (cleanBase > 0) v.basePrice = cleanBase;
          if (fd.get('syncPrimaryProgram') === 'on' && v.programs?.[0] && cleanBase > 0) {
            v.programs[0].basePrice = cleanBase;
            if (!v.programs[0].pricingSeasons) v.programs[0].pricingSeasons = {};
            if (!v.programs[0].pricingSeasons.summer) v.programs[0].pricingSeasons.summer = {};
            v.programs[0].pricingSeasons.summer.double = cleanBase;
          }
          v.image = fd.get('image');
          v.heroVideo = fd.get('heroVideo');
          v.sub = fd.get('sub');
          v.enabled = fd.get('enabled') === 'on';
          v.showOnHome = fd.get('showOnHome') === 'on';
          dlg.close();
          await finishSave(targetOrCb, `تم تحديث "${v.title}" بنجاح`, beforeSnap);
        });
      }
    });
  }

  function openCustomPageDrawer(st, pageId, targetOrCb) {
    const pg = (st.customPages || []).find(p => p.id === pageId);
    if (!pg) return;
    const beforeSnap = captureSnapshot();
    let draftBlocks = JSON.parse(JSON.stringify(pg.blocks || []));

    const renderBlocks = (wrap) => {
      wrap.innerHTML = draftBlocks.map((blk, i) => `
        <div class="adm-repeater-card" data-blk-idx="${i}">
          <div class="adm-repeater-head">
            <strong>بلوك #${i + 1} (${esc(blk.type || 'text-image')})</strong>
            <button type="button" class="adm-btn-danger-sm" data-del-blk="${i}">حذف</button>
          </div>
          <div class="adm-form-grid">
            <label class="full-col">العنوان <input type="text" data-blk-f="heading" value="${esc(blk.heading || '')}"></label>
            <label class="full-col">المحتوى <textarea rows="2" data-blk-f="body">${esc(blk.body || '')}</textarea></label>
            ${blk.type === 'text-image' ? `<div class="full-col">${mediaFieldHtml('blk_img_' + i, 'صورة البلوك', blk.image || '', false)}</div>` : ''}
            ${blk.type === 'cta-banner' ? `
              <label>نص الزر <input type="text" data-blk-f="btnText" value="${esc(blk.btnText || '')}"></label>
              <label>رابط الزر <input type="text" data-blk-f="btnUrl" value="${esc(blk.btnUrl || '')}" dir="ltr"></label>
            ` : ''}
          </div>
        </div>
      `).join('') || '<div class="adm-empty">لا توجد بلوكات بعد.</div>';
      bindMediaUploadFields(wrap);
    };

    openSlideDrawer({
      title: `تحرير صفحة: ${pg.title}`,
      subtitle: `/#/page/${pg.slug}`,
      bodyHtml: `
        <form id="adm-live-page-form" class="adm-drawer-form">
          <div class="adm-form-grid">
            <label>عنوان الصفحة * <input type="text" name="title" value="${esc(pg.title)}" required autofocus></label>
            <label>الوسم العلوي (Eyebrow) <input type="text" name="heroEyebrow" value="${esc(pg.heroEyebrow || pg.eyebrow || '')}"></label>
            <div class="full-col">${mediaFieldHtml('heroImage', 'صورة الخلفية', pg.heroImage || 'assets/egypt-temple.webp', false)}</div>
            <label class="full-col">الوصف الرئيسي <textarea name="heroSub" rows="2">${esc(pg.heroSub || pg.subtitle || '')}</textarea></label>
          </div>
          <div class="adm-toggles-row" style="margin-top:10px">
            <label class="adm-switch"><input type="checkbox" name="enabled" ${pg.enabled !== false ? 'checked' : ''}><span>منشورة</span></label>
            <label class="adm-switch"><input type="checkbox" name="showInNavbar" ${pg.showInNavbar ? 'checked' : ''}><span>بالقائمة العلوية</span></label>
            <label class="adm-switch"><input type="checkbox" name="showOnHome" ${pg.showOnHome ? 'checked' : ''}><span>بالرئيسية</span></label>
            <label class="adm-switch"><input type="checkbox" name="showInFooter" ${pg.showInFooter ? 'checked' : ''}><span>بالفوتر</span></label>
          </div>
          <hr class="adm-sep">
          <div class="adm-drawer-sec-head">
            <h4>بلوكات المحتوى (${draftBlocks.length})</h4>
            <div style="display:flex;gap:6px">
              <button type="button" class="adm-btn-outline-sm" data-add-live-blk="text-image">+ نص وصورة</button>
              <button type="button" class="adm-btn-outline-sm" data-add-live-blk="cta-banner">+ بانر CTA</button>
            </div>
          </div>
          <div id="live-page-blocks" style="display:grid;gap:10px"></div>
        </form>
      `,
      footerHtml: `<button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button><button type="submit" form="adm-live-page-form" class="adm-btn-gold">حفظ الصفحة ✓</button>`,
      onOpen: (dlg) => {
        const blkWrap = $('#live-page-blocks', dlg);
        renderBlocks(blkWrap);

        const syncBlocksFromDom = () => {
          $$('.adm-repeater-card', blkWrap).forEach((card, i) => {
            if (!draftBlocks[i]) return;
            const h = card.querySelector('[data-blk-f="heading"]');
            const b = card.querySelector('[data-blk-f="body"]');
            const im = card.querySelector(`[name="blk_img_${i}"]`);
            const bt = card.querySelector('[data-blk-f="btnText"]');
            const bu = card.querySelector('[data-blk-f="btnUrl"]');
            if (h) draftBlocks[i].heading = h.value;
            if (b) draftBlocks[i].body = b.value;
            if (im) draftBlocks[i].image = im.value;
            if (bt) draftBlocks[i].btnText = bt.value;
            if (bu) draftBlocks[i].btnUrl = bu.value;
          });
        };

        $$('[data-add-live-blk]', dlg).forEach(btn => {
          btn.addEventListener('click', () => {
            syncBlocksFromDom();
            const type = btn.dataset.addLiveBlk;
            draftBlocks.push(type === 'cta-banner'
              ? { type: 'cta-banner', heading: 'Ready to Sail With Us?', body: 'Customise this journey with our Nile Specialists.', btnText: 'Plan Your Journey', btnUrl: 'plan-your-journey' }
              : { type: 'text-image', eyebrow: 'DISCOVERY', heading: 'Thoughtful Details', body: 'Describe this highlight or itinerary extension here.', image: 'assets/nile-sailing.webp' });
            renderBlocks(blkWrap);
          });
        });

        blkWrap.addEventListener('click', (e) => {
          const del = e.target.closest('[data-del-blk]');
          if (!del) return;
          syncBlocksFromDom();
          draftBlocks.splice(Number(del.dataset.delBlk), 1);
          renderBlocks(blkWrap);
        });

        $('#btn-drawer-cancel', dlg)?.addEventListener('click', () => dlg.close());
        $('#adm-live-page-form', dlg)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          syncBlocksFromDom();
          const fd = new FormData(e.target);
          pg.title = fd.get('title');
          pg.heroEyebrow = fd.get('heroEyebrow');
          pg.eyebrow = pg.heroEyebrow;
          pg.heroImage = fd.get('heroImage');
          pg.heroSub = fd.get('heroSub');
          pg.subtitle = pg.heroSub;
          pg.enabled = fd.get('enabled') === 'on';
          pg.showInNavbar = fd.get('showInNavbar') === 'on';
          pg.showOnHome = fd.get('showOnHome') === 'on';
          pg.showInFooter = fd.get('showInFooter') === 'on';
          pg.blocks = draftBlocks;
          dlg.close();
          await finishSave(targetOrCb, `تم حفظ صفحة "${pg.title}"`, beforeSnap);
        });
      }
    });
  }

  const HOME_SECTION_EDITORS = {
    hero: {
      title: 'تحرير واجهة البداية والفيديو (Hero & Video)',
      fields: [
        { key: 'heroEyebrow', label: 'النص التمهيدي العلوي (Eyebrow)', type: 'text', full: true },
        { key: 'heroTitle', label: 'العنوان الرئيسي (يدعم <em> و <br>)', type: 'text', full: true },
        { key: 'heroSub', label: 'الوصف التحتي', type: 'textarea', full: true },
        { key: 'heroVideo', label: 'فيديو الواجهة التلقائي الصامت (MP4 / يوتيوب)', type: 'video', full: true },
        { key: 'heroImage', label: 'صورة الغلاف البديلة (Poster)', type: 'image', full: true },
        { key: 'primaryBtnText', label: 'نص الزر الأساسي', type: 'text' },
        { key: 'primaryBtnUrl', label: 'رابط الزر الأساسي', type: 'text', dir: 'ltr' },
        { key: 'secondaryBtnText', label: 'نص الزر الثانوي', type: 'text' },
        { key: 'secondaryBtnUrl', label: 'رابط الزر الثانوي', type: 'text', dir: 'ltr' }
      ]
    },
    search: {
      title: 'تحرير شريط البحث السريع',
      fields: [
        { key: 'searchCaption', label: 'العنوان الصغير', type: 'text' },
        { key: 'searchQuestion', label: 'سؤال شريط البحث', type: 'text' },
        { key: 'searchBtnText', label: 'نص زر البحث', type: 'text' }
      ]
    },
    intro: {
      title: 'تحرير قسم فلسفة الموقع (Philosophy Intro)',
      fields: [
        { key: 'introEyebrow', label: 'العنوان الصغير (Eyebrow)', type: 'text', full: true },
        { key: 'introTitle', label: 'العنوان الرئيسي (يدعم <em> و <br>)', type: 'text', full: true },
        { key: 'introBody', label: 'النص الوصفي', type: 'textarea', full: true },
        { key: 'introLinkText', label: 'نص الرابط', type: 'text' },
        { key: 'introLinkUrl', label: 'مسار الرابط', type: 'text', dir: 'ltr' }
      ]
    },
    featuredCruises: {
      title: 'تحرير عنوان قسم الكروز والذهبيات',
      fields: [
        { key: 'cruisesEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'cruisesTitle', label: 'العنوان الرئيسي (يدعم <em>)', type: 'text', full: true },
        { key: 'cruisesSub', label: 'الوصف', type: 'textarea', full: true }
      ]
    },
    sightseeingHome: {
      title: 'تحرير عنوان قسم المزارات السياحية',
      fields: [
        { key: 'sightEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'sightTitle', label: 'العنوان الرئيسي (يدعم <em>)', type: 'text', full: true },
        { key: 'sightSub', label: 'الوصف', type: 'textarea', full: true },
        { key: 'sightBtnText', label: 'نص زر استكشاف كل المزارات', type: 'text', full: true }
      ]
    },
    signature: {
      title: 'تحرير قسم الدهبية والرحلات الهادئة (Signature)',
      fields: [
        { key: 'signatureEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'signatureTitle', label: 'العنوان الرئيسي (يدعم <em> و <br>)', type: 'text', full: true },
        { key: 'signatureBody', label: 'النص الوصفي', type: 'textarea', full: true },
        { key: 'signatureImage', label: 'الصورة الجانبية', type: 'image', full: true },
        { key: 'signaturePoint1', label: 'نقطة 01', type: 'text', full: true },
        { key: 'signaturePoint2', label: 'نقطة 02', type: 'text', full: true },
        { key: 'signaturePoint3', label: 'نقطة 03', type: 'text', full: true },
        { key: 'signatureBtnText', label: 'نص الزر', type: 'text' },
        { key: 'signatureBtnUrl', label: 'رابط الزر', type: 'text', dir: 'ltr' }
      ]
    },
    featuredAddons: {
      title: 'تحرير عنوان قسم الإضافات والبرامج الملحقة',
      fields: [
        { key: 'addonsEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'addonsTitle', label: 'العنوان الرئيسي (يدعم <em>)', type: 'text', full: true },
        { key: 'addonsSub', label: 'الوصف', type: 'textarea', full: true }
      ]
    },
    journeysFeature: {
      title: 'تحرير قسم الرحلات المتكاملة (Journeys Banner)',
      fields: [
        { key: 'journeysEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'journeysTitle', label: 'العنوان الرئيسي (يدعم <em> و <br>)', type: 'text', full: true },
        { key: 'journeysBody', label: 'الوصف', type: 'textarea', full: true },
        { key: 'journeysBtnText', label: 'نص الزر', type: 'text' },
        { key: 'journeysBtnUrl', label: 'رابط الزر', type: 'text', dir: 'ltr' },
        { key: 'journeysCard1Sub', label: 'وسم الكارت الأول', type: 'text' },
        { key: 'journeysCard1Title', label: 'عنوان الكارت الأول', type: 'text' },
        { key: 'journeysCard1Image', label: 'صورة الكارت الأول', type: 'image', full: true },
        { key: 'journeysCard2Sub', label: 'وسم الكارت الثاني', type: 'text' },
        { key: 'journeysCard2Title', label: 'عنوان الكارت الثاني', type: 'text' },
        { key: 'journeysCard2Image', label: 'صورة الكارت الثاني', type: 'image', full: true }
      ]
    },
    storiesSection: {
      title: 'تحرير عنوان قسم مقالات وقصص النيل',
      fields: [
        { key: 'storiesEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'storiesTitle', label: 'العنوان الرئيسي (يدعم <em>)', type: 'text', full: true },
        { key: 'storiesSub', label: 'الوصف', type: 'textarea', full: true }
      ]
    },
    closingBanner: {
      title: 'تحرير البانر الختامي (Closing Call-to-Action)',
      fields: [
        { key: 'closingEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'closingTitle', label: 'العنوان الرئيسي (يدعم <em> و <br>)', type: 'text', full: true },
        { key: 'closingBody', label: 'النص الوصفي', type: 'textarea', full: true },
        { key: 'closingImage', label: 'صورة الخلفية', type: 'image', full: true },
        { key: 'closingBtnText', label: 'نص الزر', type: 'text' },
        { key: 'closingBtnUrl', label: 'رابط الزر', type: 'text', dir: 'ltr' }
      ]
    },
    customPagesHome: {
      title: 'تحرير عنوان قسم الصفحات المضافة للرئيسية',
      fields: [
        { key: 'customPagesEyebrow', label: 'العنوان الصغير', type: 'text', full: true },
        { key: 'customPagesTitle', label: 'العنوان الرئيسي (يدعم <em>)', type: 'text', full: true }
      ]
    }
  };

  function renderSchemaFieldHtml(f, val) {
    const cls = f.full ? 'class="full-col"' : '';
    const dirAttr = f.dir ? `dir="${f.dir}"` : '';
    if (f.type === 'image' || f.type === 'video') {
      return `<div ${cls}>${mediaFieldHtml(f.key, f.label, val || '', f.type === 'video')}</div>`;
    }
    if (f.type === 'textarea') {
      return `<label ${cls}>${esc(f.label)}<textarea name="${esc(f.key)}" rows="3" ${dirAttr}>${esc(val || '')}</textarea></label>`;
    }
    if (f.type === 'color') {
      return `<label ${cls}>${esc(f.label)}<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="color" name="${esc(f.key)}" value="${esc(val || '#0d2a3a')}" style="width:52px;height:40px;padding:2px;margin:0"><code dir="ltr">${esc(val || '')}</code></div></label>`;
    }
    return `<label ${cls}>${esc(f.label)}<input type="text" name="${esc(f.key)}" value="${esc(val || '')}" ${dirAttr}></label>`;
  }

  async function openLiveSectionEditor(targetId, onSaved = null) {
    const st = CMS.getState();
    const hc = st.homeConfig || {};
    const s = st.settings || {};
    const beforeSnap = captureSnapshot();
    const targetCb = typeof onSaved === 'function' ? onSaved : '#app';

    const commitAndFinish = async (msg) => {
      await finishSave(targetCb, msg, beforeSnap);
    };

    // Everywhere Entity & Quick-Create Routing
    if (targetId.startsWith('vessel:')) {
      return openVesselDrawer(st, targetId.slice(7), targetCb);
    }
    if (targetId.startsWith('program:')) {
      const [, vid, pid] = targetId.split(':');
      return openProgramDrawer(st, vid, pid, targetCb);
    }
    if (targetId.startsWith('sight:')) {
      const key = targetId.slice(6);
      const idx = (st.sightseeingPlaces || []).findIndex(x => x.id === key || x.slug === key);
      if (idx >= 0) return openSightDrawer(st, idx, targetCb);
    }
    if (targetId.startsWith('addon:')) {
      const key = targetId.slice(6);
      const idx = (st.addons || []).findIndex(x => x.id === key);
      if (idx >= 0) return openAddonDrawer(st, idx, targetCb);
    }
    if (targetId.startsWith('faq:')) {
      const [, idOrNew, scope = 'all'] = targetId.split(':');
      if (idOrNew === 'new') return openFaqDrawer(st, null, targetCb, scope);
      const idx = (st.faqs || []).findIndex(x => x.id === idOrNew);
      return openFaqDrawer(st, idx >= 0 ? idx : null, targetCb, scope);
    }
    if (targetId.startsWith('collection:')) {
      const [, collKey, idOrSlug] = targetId.split(':');
      const idx = (st[collKey] || []).findIndex(x => x.id === idOrSlug || x.slug === idOrSlug);
      if (idx >= 0) return openCollectionDrawer(st, collKey, idx, targetCb);
    }
    if (targetId.startsWith('page:')) {
      return openCustomPageDrawer(st, targetId.slice(5), targetCb);
    }
    if (targetId.startsWith('create:')) {
      const [, kind, arg = ''] = targetId.split(':');
      if (kind === 'cruise' || kind === 'dahabiya') {
        const obj = buildDefaultVessel(kind === 'dahabiya');
        const list = kind === 'dahabiya' ? (st.dahabiyas = st.dahabiyas || []) : (st.cruises = st.cruises || []);
        list.unshift(obj);
        await commitAndFinish(`تم إضافة "${obj.title}"`);
        return openVesselDrawer(st, obj.id, targetCb);
      }
      if (kind === 'program' && arg) {
        const vessel = [...(st.cruises || []), ...(st.dahabiyas || [])].find(x => x.id === arg);
        if (vessel) {
          const np = buildDefaultProgram(vessel);
          vessel.programs = vessel.programs || [];
          vessel.programs.push(np);
          await commitAndFinish('تم إضافة البرنامج الجديد');
          return openProgramDrawer(st, vessel.id, np.id, targetCb);
        }
      }
      if (kind === 'sight') {
        st.sightseeingPlaces = st.sightseeingPlaces || [];
        st.sightseeingPlaces.unshift(buildDefaultSightseeing());
        await commitAndFinish('تم إضافة مزار جديد');
        return openSightDrawer(st, 0, targetCb);
      }
      if (kind === 'addon') {
        st.addons = st.addons || [];
        st.addons.unshift(buildDefaultAddon());
        await commitAndFinish('تم إضافة Add-on جديد');
        return openAddonDrawer(st, 0, targetCb);
      }
      if (kind === 'faq') {
        return openFaqDrawer(st, null, targetCb, arg || 'all');
      }
      if (kind === 'page') {
        st.customPages = st.customPages || [];
        const pg = buildDefaultCustomPage();
        st.customPages.push(pg);
        await commitAndFinish('تم إنشاء صفحة مخصصة جديدة');
        return openCustomPageDrawer(st, pg.id, targetCb);
      }
    }

    // Static core pages editor
    if (targetId.startsWith('static:')) {
      const slug = targetId.slice(7);
      if (!st.staticPages) st.staticPages = {};
      const pg = st.staticPages[slug] || { title: slug, eyebrow: 'NILETRAILS', subtitle: '', heroImage: 'assets/nile-sailing.webp', sectionEyebrow: '', heading: '', body1: '', body2: '', sideImage: 'assets/egypt-temple.webp', ctaText: '', ctaUrl: '' };
      const fields = [
        { key: 'title', label: 'عنوان الصفحة', type: 'text' },
        { key: 'eyebrow', label: 'العنوان الفرعي العلوي (Eyebrow)', type: 'text' },
        { key: 'subtitle', label: 'وصف الغلاف العلوي', type: 'textarea', full: true },
        { key: 'heroImage', label: 'صورة غلاف الصفحة', type: 'image', full: true },
        { key: 'heroVideo', label: 'فيديو غلاف الصفحة (اختياري)', type: 'video', full: true },
        { key: 'sectionEyebrow', label: 'وسم القسم الداخلي', type: 'text' },
        { key: 'heading', label: 'العنوان الداخلي (يدعم <em> و <br>)', type: 'text' },
        { key: 'body1', label: 'الفقرة الأولى', type: 'textarea', full: true },
        { key: 'body2', label: 'الفقرة الثانية', type: 'textarea', full: true },
        { key: 'sideImage', label: 'الصورة الجانبية (إن وجدت)', type: 'image', full: true },
        { key: 'ctaText', label: 'نص الزر', type: 'text' },
        { key: 'ctaUrl', label: 'رابط الزر', type: 'text', dir: 'ltr' }
      ];
      openSlideDrawer({
        title: `تحرير صفحة: ${STATIC_PAGE_LABELS[slug] || pg.title}`,
        subtitle: `/${slug}`,
        bodyHtml: `<form id="live-sec-form" class="adm-drawer-form"><div class="adm-form-grid">${fields.map(f => renderSchemaFieldHtml(f, pg[f.key])).join('')}</div></form>`,
        footerHtml: `<button type="button" class="adm-btn-outline" id="btn-live-cancel">إلغاء</button><button type="submit" form="live-sec-form" class="adm-btn-gold">حفظ وتحديث الصفحة ✓</button>`,
        onOpen: (dlg) => {
          $('#btn-live-cancel', dlg)?.addEventListener('click', () => dlg.close());
          $('#live-sec-form', dlg)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const updated = { ...pg };
            fields.forEach(f => { updated[f.key] = fd.get(f.key) ?? ''; });
            st.staticPages[slug] = updated;
            dlg.close();
            await commitAndFinish(`تم تحديث صفحة "${updated.title}"`);
          });
        }
      });
      return;
    }

    // Experience 4-card mosaic editor
    if (targetId === 'experiences') {
      const exps = Array.isArray(hc.experiences) ? hc.experiences : [];
      openSlideDrawer({
        title: 'تحرير شبكة التجارب الـ 4 (Discover Your Way)',
        subtitle: 'تحكم في العناوين والصور والروابط لكل كارت في الصفحة الرئيسية',
        bodyHtml: `
          <form id="live-sec-form" class="adm-drawer-form">
            <div class="adm-form-grid">
              <label class="full-col">العنوان الصغير <input type="text" name="expEyebrow" value="${esc(hc.expEyebrow)}"></label>
              <label class="full-col">العنوان الرئيسي (يدعم &lt;em&gt;) <input type="text" name="expTitle" value="${esc(hc.expTitle)}"></label>
              <label class="full-col">الوصف <textarea name="expSub" rows="2">${esc(hc.expSub)}</textarea></label>
            </div>
            <hr class="adm-sep">
            ${exps.map((ex, i) => `
              <div class="adm-repeater-card" style="margin-bottom:12px">
                <div class="adm-repeater-head"><strong>كارت 0${i + 1}: ${esc(ex.title)}</strong></div>
                <div class="adm-form-grid">
                  <label>العنوان <input type="text" name="expTitle_${i}" value="${esc(ex.title)}"></label>
                  <label>الرابط <input type="text" name="expUrl_${i}" value="${esc(ex.url)}" dir="ltr"></label>
                  <label class="full-col">الوصف المختصر <textarea name="expDesc_${i}" rows="2">${esc(ex.desc)}</textarea></label>
                  <div class="full-col">${mediaFieldHtml(`expImg_${i}`, 'الصورة', ex.image || 'assets/nile-sailing.webp', false)}</div>
                </div>
              </div>
            `).join('')}
          </form>
        `,
        footerHtml: `<button type="button" class="adm-btn-outline" id="btn-live-cancel">إلغاء</button><button type="submit" form="live-sec-form" class="adm-btn-gold">حفظ وتحديث الصفحة ✓</button>`,
        onOpen: (dlg) => {
          $('#btn-live-cancel', dlg)?.addEventListener('click', () => dlg.close());
          $('#live-sec-form', dlg)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            hc.expEyebrow = fd.get('expEyebrow');
            hc.expTitle = fd.get('expTitle');
            hc.expSub = fd.get('expSub');
            hc.experiences = exps.map((ex, i) => ({
              ...ex,
              title: fd.get(`expTitle_${i}`),
              url: fd.get(`expUrl_${i}`),
              desc: fd.get(`expDesc_${i}`),
              image: fd.get(`expImg_${i}`)
            }));
            dlg.close();
            await commitAndFinish('تم حفظ شبكة التجارب وتحديثها');
          });
        }
      });
      return;
    }

    // Header, Logo & Top Navigation Menus Editor
    if (targetId === 'header') {
      const navKeys = [
        ['nile-cruises', 'Nile Cruises'],
        ['dahabiyas', 'Dahabiyas'],
        ['journeys', 'Journeys'],
        ['beyond-the-nile', 'Beyond the Nile'],
        ['nile-stories', 'Nile Stories'],
        ['about', 'About']
      ];
      const hiddenKeys = new Set(s.hiddenNavKeys || []);
      const customNav = Array.isArray(s.customNavItems) ? s.customNavItems : [];

      openSlideDrawer({
        title: 'تحرير الهيدر والشعار والقائمة العلوية',
        subtitle: 'تغيير اللوجو، مسميات الأزرار، إخفاء أو إظهار القوائم، وإضافة روابط علوية مخصصة',
        bodyHtml: `
          <form id="live-sec-form" class="adm-drawer-form">
            <div class="adm-form-grid">
              <label>اسم الموقع <input type="text" name="brandName" value="${esc(s.brandName)}"></label>
              <label>الشعار المختصر <input type="text" name="tagline" value="${esc(s.tagline)}"></label>
              <div class="full-col">${mediaFieldHtml('brandLogo', 'صورة الشعار (Logo)', s.brandLogo || 'assets/niletrails-logo.png', false)}</div>
              <label>نص الزر الثاني بالهيدر <input type="text" name="headerSecondaryText" value="${esc(s.headerSecondaryText || 'Nubian & Nile')}"></label>
              <label>رابط الزر الثاني <input type="text" name="headerSecondaryUrl" value="${esc(s.headerSecondaryUrl || 'beyond-the-nile/nubian-and-the-nile')}" dir="ltr"></label>
              <label>نص الزر الأساسي بالهيدر <input type="text" name="headerPrimaryText" value="${esc(s.headerPrimaryText || 'Plan your journey')}"></label>
              <label>رابط الزر الأساسي <input type="text" name="headerPrimaryUrl" value="${esc(s.headerPrimaryUrl || 'plan-your-journey')}" dir="ltr"></label>
            </div>
            <hr class="adm-sep">
            <h4 style="margin:0 0 10px">تعديل وإخفاء القوائم الرئيسية بالهيدر</h4>
            <div style="display:grid;gap:8px;margin-bottom:16px">
              ${navKeys.map(([k, defLbl]) => `
                <div style="display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #dce3e9;padding:8px 12px;border-radius:6px">
                  <label class="adm-switch" style="min-width:85px"><input type="checkbox" name="showNav_${k}" ${!hiddenKeys.has(k) ? 'checked' : ''}><span>إظهار</span></label>
                  <input type="text" name="lblNav_${k}" value="${esc(s.navLabels?.[k] || defLbl)}" style="flex:1;padding:7px 10px;border:1px solid #cbd3da;border-radius:4px">
                </div>
              `).join('')}
            </div>
            <div class="adm-drawer-sec-head">
              <h4>روابط إضافية مخصصة بالهيدر (${customNav.length})</h4>
              <button type="button" class="adm-btn-primary-sm" id="btn-add-custom-nav">+ إضافة رابط</button>
            </div>
            <div id="custom-nav-list" style="display:grid;gap:8px">
              ${customNav.map(ci => `
                <div class="adm-custom-nav-row" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px">
                  <input type="text" class="cn-label" value="${esc(ci.label)}" placeholder="عنوان الرابط" style="padding:7px;border:1px solid #cbd3da;border-radius:4px">
                  <input type="text" class="cn-url" value="${esc(ci.url)}" placeholder="nile-cruises" dir="ltr" style="padding:7px;border:1px solid #cbd3da;border-radius:4px">
                  <button type="button" class="adm-btn-danger-sm btn-del-cn">×</button>
                </div>
              `).join('')}
            </div>
          </form>
        `,
        footerHtml: `<button type="button" class="adm-btn-outline" id="btn-live-cancel">إلغاء</button><button type="submit" form="live-sec-form" class="adm-btn-gold">حفظ وتحديث الهيدر ✓</button>`,
        onOpen: (dlg) => {
          $('#btn-live-cancel', dlg)?.addEventListener('click', () => dlg.close());
          const bindDel = (root) => $$('.btn-del-cn', root).forEach(b => b.addEventListener('click', () => b.closest('.adm-custom-nav-row')?.remove()));
          bindDel(dlg);
          $('#btn-add-custom-nav', dlg)?.addEventListener('click', () => {
            const box = $('#custom-nav-list', dlg);
            const row = document.createElement('div');
            row.className = 'adm-custom-nav-row';
            row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px';
            row.innerHTML = `<input type="text" class="cn-label" value="Special Offers" placeholder="عنوان الرابط" style="padding:7px;border:1px solid #cbd3da;border-radius:4px"><input type="text" class="cn-url" value="journeys" placeholder="المسار" dir="ltr" style="padding:7px;border:1px solid #cbd3da;border-radius:4px"><button type="button" class="adm-btn-danger-sm btn-del-cn">×</button>`;
            box.appendChild(row);
            bindDel(row);
          });
          $('#live-sec-form', dlg)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            s.brandName = fd.get('brandName');
            s.tagline = fd.get('tagline');
            s.brandLogo = fd.get('brandLogo');
            s.headerSecondaryText = fd.get('headerSecondaryText');
            s.headerSecondaryUrl = fd.get('headerSecondaryUrl');
            s.headerPrimaryText = fd.get('headerPrimaryText');
            s.headerPrimaryUrl = fd.get('headerPrimaryUrl');
            s.navLabels = s.navLabels || {};
            const nextHidden = [];
            navKeys.forEach(([k]) => {
              s.navLabels[k] = fd.get(`lblNav_${k}`);
              if (fd.get(`showNav_${k}`) !== 'on') nextHidden.push(k);
            });
            s.hiddenNavKeys = nextHidden;
            s.customNavItems = $$('.adm-custom-nav-row', dlg).map((row, idx) => ({
              id: 'cn-' + idx,
              label: row.querySelector('.cn-label')?.value?.trim(),
              url: row.querySelector('.cn-url')?.value?.trim() || ''
            })).filter(x => x.label);
            st.settings = s;
            dlg.close();
            await commitAndFinish('تم حفظ وتحديث الهيدر والقوائم');
          });
        }
      });
      return;
    }

    // Footer & Social Links Editor
    if (targetId === 'footer') {
      const fields = [
        { key: 'footerCtaEyebrow', label: 'الوسم العلوي قبل الفوتر', type: 'text', full: true },
        { key: 'footerCtaTitle', label: 'عنوان الدعوة قبل الفوتر (يدعم <em>)', type: 'text', full: true },
        { key: 'footerCtaBtnText', label: 'نص زر الفوتر العلوي', type: 'text' },
        { key: 'footerCtaBtnUrl', label: 'رابط زر الفوتر العلوي', type: 'text', dir: 'ltr' },
        { key: 'footerAbout', label: 'نبذة العلامة التجارية بالفوتر', type: 'textarea', full: true },
        { key: 'footerConvText', label: 'نص التواصل في عمود الفوتر', type: 'textarea', full: true },
        { key: 'contactEmail', label: 'البريد الإلكتروني', type: 'text', dir: 'ltr' },
        { key: 'contactPhone', label: 'الهاتف / واتساب', type: 'text', dir: 'ltr' },
        { key: 'socialInstagram', label: 'رابط Instagram (اختياري)', type: 'text', dir: 'ltr' },
        { key: 'socialFacebook', label: 'رابط Facebook (اختياري)', type: 'text', dir: 'ltr' }
      ];
      openSlideDrawer({
        title: 'تحرير الفوتر ومعلومات التواصل (Footer & Social)',
        subtitle: 'كل تغييرات الفوتر تنعكس فوراً في كل صفحات الموقع',
        bodyHtml: `<form id="live-sec-form" class="adm-drawer-form"><div class="adm-form-grid">${fields.map(f => renderSchemaFieldHtml(f, s[f.key])).join('')}</div></form>`,
        footerHtml: `<button type="button" class="adm-btn-outline" id="btn-live-cancel">إلغاء</button><button type="submit" form="live-sec-form" class="adm-btn-gold">حفظ وتحديث الفوتر ✓</button>`,
        onOpen: (dlg) => {
          $('#btn-live-cancel', dlg)?.addEventListener('click', () => dlg.close());
          $('#live-sec-form', dlg)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            fields.forEach(f => { s[f.key] = fd.get(f.key) ?? ''; });
            st.settings = s;
            dlg.close();
            await commitAndFinish('تم حفظ وتحديث الفوتر ومعلومات التواصل');
          });
        }
      });
      return;
    }

    // Design System Studio (Colors, Presets, Font Scale, Radius with instant live preview)
    if (targetId === 'theme') {
      const th = { navy: '#0d2a3a', gold: '#c7a36a', cream: '#fcfaf6', fontScale: 1, radius: 2, preset: 'royal-navy', ...(s.theme || {}) };
      const applyPreviewCss = (next) => {
        const root = document.documentElement;
        if (next.navy) { root.style.setProperty('--navy', next.navy); root.style.setProperty('--deep', next.navy); }
        if (next.gold) root.style.setProperty('--gold', next.gold);
        if (next.cream) root.style.setProperty('--cream', next.cream);
        root.style.setProperty('--font-scale', String(next.fontScale || 1));
        root.style.setProperty('--radius-base', `${Number(next.radius ?? 2)}px`);
      };
      let committed = false;

      openSlideDrawer({
        title: 'استوديو التصميم والألوان والخطوط (Design System)',
        subtitle: 'معاينة فورية حية على الموقع قبل الحفظ — أو اختر طابعاً جاهزاً بضغطة واحدة',
        bodyHtml: `
          <form id="live-sec-form" class="adm-drawer-form">
            <div class="adm-theme-presets">
              <span class="adm-field-lbl" style="grid-column:1/-1">قوالب ألوان فاخرة بضغطة واحدة (Presets)</span>
              ${Object.entries(LUXURY_THEME_PRESETS).map(([k, p]) => `
                <button type="button" class="adm-preset-chip ${th.preset === k ? 'is-selected' : ''}" data-theme-preset="${k}">
                  <span class="adm-preset-dots">
                    <i style="background:${p.navy}"></i>
                    <i style="background:${p.gold}"></i>
                    <i style="background:${p.cream};border:1px solid #ccc"></i>
                  </span>
                  <span>${esc(p.label)}</span>
                </button>
              `).join('')}
            </div>
            <hr class="adm-sep">
            <div class="adm-form-grid">
              ${renderSchemaFieldHtml({ key: 'navy', label: 'اللون الأساسي الكحلي (Primary)', type: 'color', full: true }, th.navy)}
              ${renderSchemaFieldHtml({ key: 'gold', label: 'اللون الذهبي المميز (Accent)', type: 'color', full: true }, th.gold)}
              ${renderSchemaFieldHtml({ key: 'cream', label: 'خلفية الصفحات الفاتحة (Surface)', type: 'color', full: true }, th.cream)}
              <label class="full-col">حجم الخط العام للموقع (<span id="lbl-font-scale">${Math.round((Number(th.fontScale) || 1) * 100)}%</span>)
                <input type="range" name="fontScale" min="0.90" max="1.14" step="0.02" value="${Number(th.fontScale) || 1}">
              </label>
              <label class="full-col">استدارة الأزرار والكروت (<span id="lbl-radius-val">${Number(th.radius ?? 2)}px</span>)
                <input type="range" name="radius" min="0" max="16" step="2" value="${Number(th.radius ?? 2)}">
              </label>
            </div>
            <input type="hidden" name="preset" value="${esc(th.preset || 'royal-navy')}">
            <button type="button" id="btn-reset-theme" class="adm-btn-outline-sm" style="margin-top:14px">↺ استعادة ألوان NileTrails الأصلية</button>
          </form>
        `,
        footerHtml: `<button type="button" class="adm-btn-outline" id="btn-live-cancel">إلغاء</button><button type="submit" form="live-sec-form" class="adm-btn-gold">حفظ وتطبيق الهوية ✓</button>`,
        onOpen: (dlg) => {
          const readForm = () => ({
            navy: dlg.querySelector('[name="navy"]').value,
            gold: dlg.querySelector('[name="gold"]').value,
            cream: dlg.querySelector('[name="cream"]').value,
            fontScale: Number(dlg.querySelector('[name="fontScale"]').value) || 1,
            radius: Number(dlg.querySelector('[name="radius"]').value) || 0,
            preset: dlg.querySelector('[name="preset"]').value || 'custom'
          });
          const syncLivePreview = () => {
            const cur = readForm();
            const fsEl = $('#lbl-font-scale', dlg);
            const rdEl = $('#lbl-radius-val', dlg);
            if (fsEl) fsEl.textContent = `${Math.round(cur.fontScale * 100)}%`;
            if (rdEl) rdEl.textContent = `${cur.radius}px`;
            dlg.querySelectorAll('input[type="color"]').forEach(c => {
              const code = c.parentElement?.querySelector('code');
              if (code) code.textContent = c.value;
            });
            applyPreviewCss(cur);
          };

          $$('input[type="color"], input[type="range"]', dlg).forEach(inp => {
            inp.addEventListener('input', () => {
              dlg.querySelector('[name="preset"]').value = 'custom';
              $$('[data-theme-preset]', dlg).forEach(b => b.classList.remove('is-selected'));
              syncLivePreview();
            });
          });

          $$('[data-theme-preset]', dlg).forEach(btn => {
            btn.addEventListener('click', () => {
              const p = LUXURY_THEME_PRESETS[btn.dataset.themePreset];
              if (!p) return;
              dlg.querySelector('[name="navy"]').value = p.navy;
              dlg.querySelector('[name="gold"]').value = p.gold;
              dlg.querySelector('[name="cream"]').value = p.cream;
              dlg.querySelector('[name="fontScale"]').value = p.fontScale;
              dlg.querySelector('[name="radius"]').value = p.radius;
              dlg.querySelector('[name="preset"]').value = btn.dataset.themePreset;
              $$('[data-theme-preset]', dlg).forEach(b => b.classList.toggle('is-selected', b === btn));
              syncLivePreview();
            });
          });

          $('#btn-reset-theme', dlg)?.addEventListener('click', () => {
            dlg.querySelector('[data-theme-preset="royal-navy"]')?.click();
          });

          dlg.addEventListener('close', () => {
            if (!committed) applyPreviewCss(th);
          });

          $('#btn-live-cancel', dlg)?.addEventListener('click', () => dlg.close());
          $('#live-sec-form', dlg)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            s.theme = readForm();
            st.settings = s;
            committed = true;
            dlg.close();
            await commitAndFinish('تم حفظ وتطبيق هوية التصميم الجديدة ✓');
          });
        }
      });
      return;
    }

    // Schema-based Homepage Section Editor (hero, search, intro, featuredCruises, sightseeingHome, signature, etc.)
    const schema = HOME_SECTION_EDITORS[targetId];
    if (schema) {
      const pts = Array.isArray(hc.signaturePoints) ? hc.signaturePoints : ['', '', ''];
      const vals = {
        ...hc,
        signaturePoint1: pts[0] || '',
        signaturePoint2: pts[1] || '',
        signaturePoint3: pts[2] || ''
      };
      openSlideDrawer({
        title: schema.title,
        subtitle: 'كل التعديلات تظهر فوراً على الموقع للعملاء',
        bodyHtml: `<form id="live-sec-form" class="adm-drawer-form"><div class="adm-form-grid">${schema.fields.map(f => renderSchemaFieldHtml(f, vals[f.key])).join('')}</div></form>`,
        footerHtml: `<button type="button" class="adm-btn-outline" id="btn-live-cancel">إلغاء</button><button type="submit" form="live-sec-form" class="adm-btn-gold">حفظ وتحديث فوراً ✓</button>`,
        onOpen: (dlg) => {
          $('#btn-live-cancel', dlg)?.addEventListener('click', () => dlg.close());
          $('#live-sec-form', dlg)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            schema.fields.forEach(f => {
              if (!f.key.startsWith('signaturePoint')) {
                hc[f.key] = fd.get(f.key) ?? '';
              }
            });
            if (targetId === 'signature') {
              hc.signaturePoints = [fd.get('signaturePoint1'), fd.get('signaturePoint2'), fd.get('signaturePoint3')].filter(Boolean);
            }
            st.homeConfig = hc;
            dlg.close();
            await commitAndFinish(`تم حفظ تعديلات "${schema.title}"`);
          });
        }
      });
    }
  }

  function renderSiteBuilderTab(st) {
    const s = st.settings || {};
    const th = s.theme || { navy: '#0d2a3a', gold: '#c7a36a', cream: '#fcfaf6' };
    const staticKeys = Object.keys(STATIC_PAGE_LABELS);

    return `
      <div class="adm-section-head">
        <div>
          <h2>التحكم الشامل بالهوية والقوائم والفوتر والصفحات</h2>
          <p>تحكم بالكامل في اللوجو، ألوان الموقع، قوائم الهيدر، الفوتر، وتعديل كل نصوص وصور الصفحات الثابتة — أو شغّل وضع التحرير المباشر فوق الموقع الحي!</p>
        </div>
        <button type="button" class="adm-btn-gold" data-enable-live-edit="true">✏ فتح الموقع بوضع التحرير المباشر ↗</button>
      </div>

      <div class="adm-grid-2">
        <div class="adm-card">
          <div class="adm-card-head">
            <div>
              <h3>الهيدر واللوجو والقائمة العلوية</h3>
              <p class="adm-card-sub">${esc(s.brandName)} · ${(s.hiddenNavKeys || []).length} قوائم مخفية · ${(s.customNavItems || []).length} روابط إضافية</p>
            </div>
            <button type="button" class="adm-btn-gold-sm" data-edit-live-sec="header">✏ تعديل الهيدر والقوائم</button>
          </div>
          <div style="display:flex;align-items:center;gap:14px">
            <img src="${esc(s.brandLogo || 'assets/niletrails-logo.png')}" alt="Logo" style="height:44px;width:auto;background:#fcfaf6;padding:6px 10px;border-radius:4px;border:1px solid #dce2e8">
            <small style="color:#5c727e">يمكنك تغيير صورة اللوجو، الأزرار العلوية، وإخفاء/تعديل أسماء القوائم.</small>
          </div>
        </div>

        <div class="adm-card">
          <div class="adm-card-head">
            <div>
              <h3>الفوتر ومعلومات التواصل والسوشيال</h3>
              <p class="adm-card-sub">${esc(s.contactEmail)} · ${esc(s.contactPhone)}</p>
            </div>
            <button type="button" class="adm-btn-gold-sm" data-edit-live-sec="footer">✏ تعديل الفوتر</button>
          </div>
          <p style="margin:0;font-size:13px;color:#5c727e">${esc(s.footerAbout || '')}</p>
        </div>

        <div class="adm-card">
          <div class="adm-card-head">
            <div>
              <h3>ألوان وهوية الموقع (Theme Palette)</h3>
              <p class="adm-card-sub">تنعكس الألوان فوراً على الأزرار والعناوين والخلفيات</p>
            </div>
            <button type="button" class="adm-btn-gold-sm" data-edit-live-sec="theme">🎨 تعديل الألوان</button>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <span class="pill" style="background:${esc(th.navy)};color:#fff">Navy: ${esc(th.navy)}</span>
            <span class="pill" style="background:${esc(th.gold)};color:#092434">Gold: ${esc(th.gold)}</span>
            <span class="pill" style="background:${esc(th.cream)};color:#092434;border:1px solid #ccc">Cream: ${esc(th.cream)}</span>
          </div>
        </div>

        <div class="adm-card">
          <div class="adm-card-head">
            <div>
              <h3>الصفحات الأساسية الثابتة (${staticKeys.length})</h3>
              <p class="adm-card-sub">تحرير نصوص وصور وفيديوهات صفحات: عن الشركة، الذهبية، السفر، التواصل، والسياسات</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${staticKeys.map(k => `
              <button type="button" class="adm-btn-outline-sm" style="justify-content:space-between;display:flex;padding:9px 12px" data-edit-live-sec="static:${k}">
                <span>${STATIC_PAGE_LABELS[k]}</span>
                <span>✏</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==================== HOMEPAGE TAB (WITH WORKING heroVideo & FULL SECTION EDITOR) ====================
  function renderHomepageTab(st) {
    const hc = st.homeConfig || {};
    const sections = hc.sections || hc.sectionsOrder || [];

    return `
      <div class="adm-section-head">
        <div>
          <h2>تخطيط الصفحة الرئيسية (Home Appearance)</h2>
          <p>تحكم في الفيديو الافتتاحي الصامت، كل نصوص وصور الأقسام، وإظهار أو إخفاء أو إعادة ترتيب أي قسم.</p>
        </div>
        <button type="button" class="adm-btn-gold" data-enable-live-edit="true">✏ فتح الموقع بوضع التحرير المباشر ↗</button>
      </div>

      <div class="adm-grid-2">
        <form id="adm-home-hero-form" class="adm-card">
          <div class="adm-card-head">
            <h3>واجهة البداية (Hero Banner & Video)</h3>
            <button type="submit" class="adm-btn-gold">حفظ التغييرات</button>
          </div>
          <div class="adm-form-grid">
            <label class="full-col">النص التمهيدي (Eyebrow) <input type="text" name="heroEyebrow" value="${esc(hc.heroEyebrow)}"></label>
            <label class="full-col">العنوان الرئيسي (يدعم &lt;em&gt; و &lt;br&gt;) <input type="text" name="heroTitle" value="${esc(hc.heroTitle)}"></label>
            <label class="full-col">الوصف السفلي <textarea name="heroSub" rows="2">${esc(hc.heroSub)}</textarea></label>
            <div class="full-col">${mediaFieldHtml('heroVideo', 'فيديو الواجهة التلقائي الصامت (Hero Video)', hc.heroVideo || '', true)}</div>
            <div class="full-col">${mediaFieldHtml('heroImage', 'صورة الغلاف البديلة (Poster Image)', hc.heroImage || '', false)}</div>
            <label>زر أساسي <input type="text" name="primaryBtnText" value="${esc(hc.primaryBtnText)}"></label>
            <label>رابط الزر الأساسي <input type="text" name="primaryBtnUrl" value="${esc(hc.primaryBtnUrl)}" dir="ltr"></label>
            <label>زر ثانوي <input type="text" name="secondaryBtnText" value="${esc(hc.secondaryBtnText)}"></label>
            <label>رابط الزر الثانوي <input type="text" name="secondaryBtnUrl" value="${esc(hc.secondaryBtnUrl)}" dir="ltr"></label>
          </div>
        </form>

        <div class="adm-card">
          <h3>أقسام الصفحة الرئيسية (${sections.length} أقسام — تحكم كامل)</h3>
          <p class="adm-card-sub" style="margin-bottom:14px">فعّل أو أخفِ أو رتّب أي قسم، واضغط ✏ لتعديل نصوصه وصوره بالكامل.</p>
          <div class="adm-sections-sorter">
            ${sections.map((sec, idx) => `
              <div class="adm-sec-item ${sec.enabled === false ? 'off' : ''}">
                <label class="adm-switch">
                  <input type="checkbox" data-toggle-section="${idx}" ${sec.enabled !== false ? 'checked' : ''}>
                  <span><strong>${esc(sec.label)}</strong> <small dir="ltr">(${esc(sec.id)})</small></span>
                </label>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${sec.id !== 'customPagesHome' ? `<button type="button" class="adm-btn-gold-sm" data-edit-live-sec="${esc(sec.id)}">✏ تعديل</button>` : ''}
                  <button type="button" class="adm-btn-outline-sm" data-move-section="${idx}:-1">↑</button>
                  <button type="button" class="adm-btn-outline-sm" data-move-section="${idx}:1">↓</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==================== COLLECTIONS TAB (CLEAN WITH SLIDE-OVER DRAWER) ====================
  function renderCollectionsTab(st) {
    const map = {
      journeys: { label: 'البرامج المتكاملة (Journeys)', list: st.journeys || [], key: 'journeys' },
      destinations: { label: 'Beyond the Nile Destinations', list: st.destinations || [], key: 'destinations' },
      stories: { label: 'المقالات (Nile Stories)', list: st.stories || [], key: 'stories' }
    };
    const active = map[collectionSubTab] || map.journeys;

    return `
      <div class="adm-section-head">
        <div>
          <h2>المحتوى المتنوع (Journeys · Destinations · Stories)</h2>
          <p>اختر القسم وعدّل أي بطاقة في نافذة تحرير جانبية نظيفة.</p>
        </div>
        <button type="button" class="adm-btn-gold" id="btn-add-collection-item">+ إضافة عنصر جديد</button>
      </div>

      <div class="adm-toolbar">
        <div class="adm-filter-chips">
          ${Object.entries(map).map(([k, v]) => `
            <button type="button" class="adm-chip ${collectionSubTab === k ? 'active' : ''}" data-coll-subtab="${k}">${v.label} (${v.list.length})</button>
          `).join('')}
        </div>
      </div>

      <div class="adm-compact-grid">
        ${active.list.map((item, idx) => `
          <article class="adm-compact-card ${item.enabled === false ? 'is-off' : ''}">
            <div class="adm-cc-head">
              <img src="${esc(item.image || 'assets/egypt-temple.webp')}" alt="" class="adm-cc-thumb">
              <div class="adm-cc-info">
                <span class="pill home">${esc(item.category || item.duration || item.route || active.key)}</span>
                <h4>${esc(item.name || item.title)}</h4>
                <small>${esc((item.sub || item.desc || item.excerpt || '').slice(0, 80))}...</small>
              </div>
            </div>
            <div class="adm-cc-quickbar">
              <label class="adm-switch-mini">
                <input type="checkbox" data-quick-coll-toggle="${active.key}:${idx}" ${item.enabled !== false ? 'checked' : ''}>
                <span>${item.enabled !== false ? 'مفعّل' : 'مخفي'}</span>
              </label>
              <div class="adm-cc-btns">
                <button type="button" class="adm-btn-primary-sm" data-open-coll-drawer="${active.key}:${idx}">تعديل</button>
                <button type="button" class="adm-btn-danger-sm" data-delete-coll="${active.key}:${idx}">حذف</button>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function openCollectionDrawer(st, collKey, idx, containerSelector) {
    const item = st[collKey]?.[idx];
    if (!item) return;
    const beforeSnap = captureSnapshot();
    const isStory = collKey === 'stories';
    const titleVal = isStory ? item.title : item.name;
    const subVal = isStory ? item.excerpt : (collKey === 'destinations' ? item.desc : item.sub);

    openSlideDrawer({
      title: `تعديل: ${titleVal}`,
      subtitle: collKey,
      bodyHtml: `
        <form id="adm-coll-drawer-form" class="adm-drawer-form">
          <div class="adm-form-grid">
            <label class="full-col">الاسم / العنوان * <input type="text" name="title" value="${esc(titleVal)}" required autofocus></label>
            <label>${isStory ? 'التصنيف' : (collKey === 'destinations' ? 'الدور / الموقع' : 'المدة')}
              <input type="text" name="meta1" value="${esc(isStory ? item.category : (collKey === 'destinations' ? item.role : item.duration))}">
            </label>
            <label>${isStory ? 'تاريخ النشر' : (collKey === 'destinations' ? 'الرابط' : 'خط السير')}
              <input type="text" name="meta2" value="${esc(isStory ? item.date : (collKey === 'destinations' ? item.slug : item.route))}">
            </label>
            <div class="full-col">${mediaFieldHtml('image', 'الصورة', item.image || 'assets/egypt-temple.webp', false)}</div>
            <label class="full-col">الوصف / المحتوى <textarea name="summary" rows="4">${esc(subVal || '')}</textarea></label>
          </div>
          <div class="adm-toggles-row" style="margin-top:12px">
            <label class="adm-switch"><input type="checkbox" name="enabled" ${item.enabled !== false ? 'checked' : ''}><span>مفعّل</span></label>
            <label class="adm-switch"><input type="checkbox" name="showOnHome" ${item.showOnHome !== false ? 'checked' : ''}><span>إظهار بالرئيسية</span></label>
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="adm-btn-outline" id="btn-drawer-cancel">إلغاء</button>
        <button type="submit" form="adm-coll-drawer-form" class="adm-btn-gold">حفظ التعديل ✓</button>
      `,
      onOpen: (dlg) => {
        $('#btn-drawer-cancel', dlg)?.addEventListener('click', () => dlg.close());
        $('#adm-coll-drawer-form', dlg)?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          if (isStory) {
            item.title = fd.get('title');
            item.slug = item.slug || slugify(item.title);
            item.category = fd.get('meta1');
            item.date = fd.get('meta2');
            item.excerpt = fd.get('summary');
            item.summary = fd.get('summary');
          } else if (collKey === 'destinations') {
            item.name = fd.get('title');
            item.role = fd.get('meta1');
            item.subtitle = fd.get('meta1');
            item.desc = fd.get('summary');
          } else {
            item.name = fd.get('title');
            item.slug = item.slug || slugify(item.name);
            item.duration = fd.get('meta1');
            item.tag = fd.get('meta1');
            item.route = fd.get('meta2');
            item.sub = fd.get('summary');
            item.summary = fd.get('summary');
          }
          item.image = fd.get('image');
          item.enabled = fd.get('enabled') === 'on';
          item.showOnHome = fd.get('showOnHome') === 'on';
          dlg.close();
          await saveAndRefresh(containerSelector, 'تم حفظ التعديلات بنجاح', beforeSnap);
        });
      }
    });
  }

  // ==================== SETTINGS TAB ====================
  function renderSettingsTab(st) {
    const s = st.settings || {};
    return `
      <div class="adm-section-head">
        <div>
          <h2>إعدادات الموقع والأمان والنسخ الاحتياطي</h2>
          <p>إدارة اسم العلامة التجارية، العملة، أرقام التواصل وواتساب، كلمة مرور لوحة التحكم، والنسخ الاحتياطي.</p>
        </div>
      </div>

      <div class="adm-grid-2">
        <form id="adm-settings-form" class="adm-card">
          <div class="adm-card-head">
            <h3>الإعدادات العامة</h3>
            <button type="submit" class="adm-btn-gold">حفظ الإعدادات</button>
          </div>
          <div class="adm-form-grid">
            <label>اسم الموقع <input type="text" name="brandName" value="${esc(s.brandName)}"></label>
            <label>الشعار <input type="text" name="tagline" value="${esc(s.tagline)}"></label>
            <label>العملة (Code) <input type="text" name="currency" value="${esc(s.currency || 'USD')}" dir="ltr"></label>
            <label>رمز العملة <input type="text" name="currencySymbol" value="${esc(s.currencySymbol || '$')}" dir="ltr"></label>
            <label>البريد الإلكتروني <input type="email" name="contactEmail" value="${esc(s.contactEmail)}" dir="ltr"></label>
            <label>رقم الهاتف <input type="text" name="contactPhone" value="${esc(s.contactPhone)}" dir="ltr"></label>
            <label>رقم واتساب الرسمي (بالمفتاح الدولي) <input type="text" name="whatsapp" value="${esc(s.whatsapp || s.contactPhone || '')}" placeholder="+201005558899" dir="ltr"></label>
            <label>رابط فيديو يوتيوب (مصدر البرامج) <input type="text" name="youtubeHeroUrl" value="${esc(s.youtubeHeroUrl || '')}" dir="ltr"></label>
          </div>
          <label class="adm-switch" style="margin-top:16px">
            <input type="checkbox" name="showAdminBar" ${s.showAdminBar !== false ? 'checked' : ''}>
            <span>إظهار شريط المدير السريع بالأسفل (يظهر للمدير فقط بعد تسجيل الدخول)</span>
          </label>
        </form>

        <div style="display:flex;flex-direction:column;gap:16px">
          <form id="adm-pw-form" class="adm-card">
            <div class="adm-card-head">
              <h3>🔐 أمان لوحة التحكم (تغيير كلمة المرور)</h3>
              <button type="submit" class="adm-btn-primary">تحديث كلمة المرور</button>
            </div>
            <div class="adm-form-grid">
              <label class="full-col">كلمة المرور الحالية * <input type="password" name="currentPassword" required autocomplete="current-password" dir="ltr"></label>
              <label>كلمة المرور الجديدة (6 أحرف على الأقل) * <input type="password" name="newPassword" required minlength="6" autocomplete="new-password" dir="ltr"></label>
              <label>تأكيد كلمة المرور الجديدة * <input type="password" name="confirmPassword" required minlength="6" autocomplete="new-password" dir="ltr"></label>
            </div>
          </form>

          <div class="adm-card">
            <h3>النسخ الاحتياطي واستعادة النظام</h3>
            <p class="adm-card-sub">احفظ ملف نسخة احتياطية من كافة البرامج والمزارات والحجوزات أو استرجع النظام لحالته الأصلية.</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
              <button type="button" class="adm-btn-primary" id="btn-export-cms">⬇ تصدير نسخة احتياطية (JSON)</button>
              <label class="adm-btn-outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                <input type="file" id="inp-import-cms" accept="application/json,.json" hidden>
                <span>⬆ استيراد نسخة (JSON)</span>
              </label>
              <button type="button" class="adm-btn-danger-sm" id="btn-reset-cms" style="padding:10px 18px">↺ استعادة الضبط الافتراضي للموقع</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminLogin(containerSelector) {
    const container = $(containerSelector);
    if (!container) return;
    const brand = CMS.getState()?.settings?.brandName || 'NileTrails';
    container.innerHTML = `
      <div class="adm-login-screen" dir="rtl" lang="ar">
        <div class="adm-login-card">
          <div class="adm-login-brand">
            <span class="adm-logo-badge">NT</span>
            <div>
              <h1>لوحة تحكم ${esc(brand)}</h1>
              <p>تسجيل دخول الإدارة لإدارة الحجوزات والمحتوى المباشر</p>
            </div>
          </div>
          <form id="adm-login-form" class="adm-login-form">
            <label for="adm-password">كلمة مرور الإدارة</label>
            <input type="password" id="adm-password" name="password" required autofocus autocomplete="current-password" placeholder="أدخل كلمة المرور..." dir="ltr">
            <div id="adm-login-err" class="adm-login-err" role="alert" hidden></div>
            <button type="submit" class="adm-btn-gold" id="adm-login-btn" style="width:100%;padding:12px;font-size:15px">تسجيل الدخول ↗</button>
          </form>
          <div class="adm-login-foot">
            <a href="#/" class="adm-btn-outline-sm" style="text-decoration:none">← العودة إلى الموقع العام</a>
          </div>
        </div>
      </div>
    `;
    const form = $('#adm-login-form', container);
    const errEl = $('#adm-login-err', container);
    const btn = $('#adm-login-btn', container);
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errEl) errEl.hidden = true;
      if (btn) btn.disabled = true;
      const pw = $('#adm-password', form)?.value || '';
      const res = await CMS.login(pw);
      if (btn) btn.disabled = false;
      if (!res.ok) {
        if (errEl) {
          errEl.textContent = res.error || 'كلمة المرور غير صحيحة';
          errEl.hidden = false;
        }
        return;
      }
      showToast('مرحباً بك في لوحة التحكم ✓');
      renderAdmin(containerSelector);
    });
  }

  // ==================== MAIN ADMIN RENDER SHELL ====================
  function renderAdmin(containerSelector = '#app', opts = {}) {
    if (!CMS.isAuthenticated()) {
      renderAdminLogin(containerSelector);
      return;
    }
    const st = CMS.getState();
    const container = $(containerSelector);
    if (!container) return;

    const prevScroll = opts.preserveScroll ? ($('.adm-main-scroll')?.scrollTop || window.scrollY) : 0;
    const newEnqCount = (st.enquiries || []).filter(e => e.status === 'New').length;

    const navGroups = [
      { id: 'bookings', icon: '📥', label: 'الحجوزات والطلبات', badge: newEnqCount },
      { id: 'homepage', icon: '🎨', label: 'الصفحة الرئيسية والأقسام' },
      { id: 'sitebuilder', icon: '🧩', label: 'الهوية والقوائم والفوتر والصفحات' },
      { id: 'cruises', icon: '🚢', label: 'الكروزات والذهبيات والبرامج', badge: (st.cruises?.length || 0) + (st.dahabiyas?.length || 0) },
      { id: 'sightseeing', icon: '🏛', label: 'المزارات السياحية', badge: st.sightseeingPlaces?.length || 0 },
      { id: 'addons', icon: '✦', label: 'الإضافات (Add-ons)', badge: st.addons?.length || 0 },
      { id: 'faqs', icon: '❓', label: 'الأسئلة الشائعة (FAQ)', badge: st.faqs?.length || 0 },
      { id: 'pages', icon: '📄', label: 'بناء الصفحات المخصصة', badge: st.customPages?.length || 0 },
      { id: 'collections', icon: '🗺', label: 'الرحلات والوجهات والمقالات' },
      { id: 'settings', icon: '⚙', label: 'الإعدادات والأمان' }
    ];

    const currentNav = navGroups.find(n => n.id === activeTab) || navGroups[0];

    let bodyContent = '';
    if (activeTab === 'bookings') bodyContent = renderBookingsTab(st);
    else if (activeTab === 'cruises') bodyContent = renderVesselsTab(st);
    else if (activeTab === 'sightseeing') bodyContent = renderSightseeingTab(st);
    else if (activeTab === 'addons') bodyContent = renderAddonsTab(st);
    else if (activeTab === 'faqs') bodyContent = renderFaqsTab(st);
    else if (activeTab === 'pages') bodyContent = renderPagesTab(st);
    else if (activeTab === 'homepage') bodyContent = renderHomepageTab(st);
    else if (activeTab === 'sitebuilder') bodyContent = renderSiteBuilderTab(st);
    else if (activeTab === 'collections') bodyContent = renderCollectionsTab(st);
    else if (activeTab === 'settings') bodyContent = renderSettingsTab(st);

    container.innerHTML = `
      <div class="adm-shell-v2" dir="rtl" lang="ar">
        <aside class="adm-sidebar" aria-label="قائمة لوحة التحكم">
          <div class="adm-sidebar-brand">
            <span class="adm-logo-badge">NT</span>
            <div>
              <strong>لوحة تحكم NileTrails</strong>
              <small>Atelier CMS · بوابة الإدارة الآمنة</small>
            </div>
          </div>

          <nav class="adm-sidebar-nav">
            ${navGroups.map(t => `
              <button type="button" class="adm-nav-btn ${activeTab === t.id ? 'active' : ''}" data-adm-tab="${t.id}">
                <span class="adm-nav-ic">${t.icon}</span>
                <span class="adm-nav-lbl">${t.label}</span>
                ${typeof t.badge === 'number' ? `<span class="adm-nav-badge ${t.id === 'bookings' && newEnqCount > 0 ? 'hot' : ''}">${t.badge}</span>` : ''}
              </button>
            `).join('')}
          </nav>

          <div class="adm-sidebar-foot" style="display:flex;flex-direction:column;gap:8px">
            <a href="#/" class="adm-btn-gold" style="width:100%;text-align:center;text-decoration:none;display:block">العودة للموقع الحي ↗</a>
            <button type="button" id="btn-adm-logout" class="adm-btn-outline-sm" style="width:100%;color:#fecaca;border-color:rgba(248,113,113,0.4)">🚪 تسجيل الخروج</button>
          </div>
        </aside>

        <div class="adm-workspace-col">
          <header class="adm-topbar-v2">
            <div class="adm-topbar-title">
              <span>${currentNav.icon}</span>
              <h1>${currentNav.label}</h1>
            </div>
            <div class="adm-topbar-actions">
              <span class="adm-sync-pill ${lastSavedTime ? 'synced' : ''}" id="adm-sync-status">
                ${lastSavedTime ? `متزامن ✓ (${lastSavedTime})` : 'متزامن مع الخادم ✓'}
              </span>
              <a href="#/" class="adm-btn-outline-sm" target="_blank">فتح الموقع في تبويب ↗</a>
            </div>
          </header>

          <main class="adm-main-scroll">
            ${CMS.isDefaultPassword() ? `
              <div class="adm-security-notice">
                <span>⚠️ تنبيه أمان: أنت تستخدم كلمة المرور الافتراضية حالياً. يُنصح بتغييرها قبل الإطلاق للعملاء.</span>
                <button type="button" class="adm-btn-gold-sm" data-adm-tab="settings">تغيير كلمة المرور الآن</button>
              </div>
            ` : ''}
            ${bodyContent}
          </main>
        </div>
      </div>
    `;

    bindAdminEvents(containerSelector, st);
    bindMediaUploadFields(container);

    if (opts.preserveScroll) {
      const scrollBox = $('.adm-main-scroll');
      if (scrollBox) scrollBox.scrollTop = prevScroll;
      else window.scrollTo(0, prevScroll);
    }
  }

  // ==================== EVENT BINDING ====================
  function bindAdminEvents(containerSelector, st) {
    // Sidebar tab switch
    $$('[data-adm-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.admTab;
        searchQuery = '';
        renderAdmin(containerSelector);
      });
    });

    // Global Search input (keeps focus cleanly without full re-render typing drop? Let's re-render on 'input' and refocus!)
    const searchEl = $('#adm-global-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        const pos = searchEl.selectionStart;
        searchQuery = searchEl.value;
        renderAdmin(containerSelector, { preserveScroll: true });
        const nextInp = $('#adm-global-search');
        if (nextInp) {
          nextInp.focus();
          nextInp.setSelectionRange(pos, pos);
        }
      });
    }

    $('#btn-adm-logout')?.addEventListener('click', async () => {
      setEditMode(false);
      await CMS.logout();
      showToast('تم تسجيل الخروج بنجاح');
      renderAdmin(containerSelector);
    });

    // Bookings filters & status updates (dedicated server endpoints -> never collides with CMS saves)
    $$('[data-book-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        bookingStatusFilter = btn.dataset.bookFilter;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-export-bookings-csv')?.addEventListener('click', () => {
      const rows = (st.enquiries || []).map(e => [
        e.id, e.createdAt, e.status, e.clientName, e.clientEmail, e.clientPhone, e.nationality,
        e.vesselTitle, e.programTitle, e.checkInDate, e.season || '', e.cabinName, e.adults, e.children || 0,
        e.estimatedTotal, (e.selectedAddons || []).map(a => a.title).join('; '), e.notes || ''
      ]);
      const header = ['Ref ID', 'Created', 'Status', 'Client Name', 'Email', 'Phone', 'Nationality', 'Vessel', 'Program', 'Check-in', 'Season', 'Cabin', 'Adults', 'Children', 'Total', 'Add-ons', 'Notes'];
      const csvEsc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = '\uFEFF' + [header, ...rows].map(r => r.map(csvEsc).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `niletrails-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      showToast('تم تصدير ملف الحجوزات (CSV) ✓');
    });

    $$('[data-enq-status]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = sel.dataset.enqStatus;
        try {
          await CMS.updateEnquiryStatus(id, sel.value);
          showToast(`تم تحديث حالة الطلب #${id}`);
          renderAdmin(containerSelector, { preserveScroll: true });
        } catch (err) {
          showToast(err.message || 'تعذر تحديث حالة الطلب', 'error');
        }
      });
    });

    $$('[data-delete-enq]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.deleteEnq;
        const ok = await openConfirmDialog({
          title: 'حذف طلب الحجز',
          message: `هل تريد حذف الحجز #${id} نهائياً؟ لا يمكن التراجع بعد الحذف.`
        });
        if (!ok) return;
        try {
          await CMS.deleteEnquiry(id);
          showToast('تم حذف الطلب بنجاح');
          renderAdmin(containerSelector, { preserveScroll: true });
        } catch (err) {
          showToast(err.message || 'تعذر حذف الطلب', 'error');
        }
      });
    });

    // Vessel selection & edits
    $$('[data-select-vessel]').forEach(el => {
      el.addEventListener('click', () => {
        selectedVesselId = el.dataset.selectVessel;
        renderAdmin(containerSelector);
      });
    });

    $('#adm-vessel-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vid = e.target.dataset.vesselId;
      const fd = new FormData(e.target);
      const target = [...(st.cruises || []), ...(st.dahabiyas || [])].find(x => x.id === vid);
      if (target) {
        const parsedBase = Number(fd.get('basePrice'));
        const cleanBase = Number.isFinite(parsedBase) && parsedBase >= 0 ? parsedBase : (Number(target.basePrice) || 890);
        target.title = fd.get('title');
        target.slug = target.slug || slugify(fd.get('title'));
        target.tier = fd.get('tier');
        target.route = fd.get('route');
        target.nights = Number(fd.get('nights')) || 4;
        target.basePrice = cleanBase;
        if (fd.get('syncPrimaryProgram') === 'on' && target.programs?.[0]) {
          target.programs[0].basePrice = cleanBase;
          if (!target.programs[0].pricingSeasons) target.programs[0].pricingSeasons = {};
          if (!target.programs[0].pricingSeasons.summer) target.programs[0].pricingSeasons.summer = {};
          target.programs[0].pricingSeasons.summer.double = cleanBase;
        }
        target.image = fd.get('image');
        target.heroVideo = fd.get('heroVideo');
        target.sub = fd.get('sub');
        target.enabled = fd.get('enabled') === 'on';
        target.showOnHome = fd.get('showOnHome') === 'on';
        await saveAndRefresh(containerSelector, `تم حفظ تعديلات "${target.title}"`);
      }
    });

    const addVessel = async (isDahabiya) => {
      const newObj = buildDefaultVessel(isDahabiya);
      if (isDahabiya) st.dahabiyas.unshift(newObj);
      else st.cruises.unshift(newObj);
      selectedVesselId = newObj.id;
      await saveAndRefresh(containerSelector, `تم إضافة "${newObj.title}"`);
    };

    $('#btn-add-cruise')?.addEventListener('click', () => addVessel(false));
    $('#btn-add-dahabiya')?.addEventListener('click', () => addVessel(true));

    $$('[data-delete-vessel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vid = btn.dataset.deleteVessel;
        const ok = await openConfirmDialog({
          title: 'حذف المركب',
          message: 'سيتم حذف المركب وكافة البرامج المرتبطة به نهائياً.'
        });
        if (!ok) return;
        st.cruises = (st.cruises || []).filter(c => c.id !== vid);
        st.dahabiyas = (st.dahabiyas || []).filter(d => d.id !== vid);
        selectedVesselId = null;
        await saveAndRefresh(containerSelector, 'تم حذف المركب');
      });
    });

    $('#btn-add-program')?.addEventListener('click', async () => {
      const vid = $('#btn-add-program').dataset.vesselId;
      const target = [...(st.cruises || []), ...(st.dahabiyas || [])].find(x => x.id === vid);
      if (!target) return;
      const newProg = buildDefaultProgram(target, {
        tabLabel: '3 Nights',
        tabSub: 'Aswan → Luxor',
        title: 'Custom Nile Program (Aswan to Luxor)',
        nights: 3,
        duration: '4 Days / 3 Nights',
        route: 'Aswan → Kom Ombo → Edfu → Luxor'
      });
      target.programs.push(newProg);
      await saveAndRefresh(containerSelector, 'تم إضافة البرنامج — اضغط تعديل لفتح المحرر');
      openProgramDrawer(st, vid, newProg.id, containerSelector);
    });

    $$('[data-quick-prog-price]').forEach(inp => {
      inp.addEventListener('change', async () => {
        const [vid, pid] = inp.dataset.quickProgPrice.split('::');
        const target = [...(st.cruises || []), ...(st.dahabiyas || [])].find(x => x.id === vid);
        const prog = target?.programs?.find(p => p.id === pid);
        const nextPrice = Number(inp.value);
        if (!target || !prog || !Number.isFinite(nextPrice) || nextPrice < 0) {
          showToast('أدخل سعراً صحيحاً بدون إضافات', 'error');
          return;
        }
        prog.basePrice = nextPrice;
        if (prog.pricingSeasons?.summer) {
          prog.pricingSeasons.summer.double = nextPrice;
        }
        if (target.programs?.[0]?.id === prog.id) {
          target.basePrice = nextPrice;
        }
        await saveAndRefresh(containerSelector, `تم تحديث سعر "${prog.tabLabel || prog.title}" إلى ${st.settings?.currencySymbol || '$'}${nextPrice}`);
      });
    });

    $$('[data-open-prog-drawer]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [vid, pid] = btn.dataset.openProgDrawer.split('::');
        openProgramDrawer(st, vid, pid, containerSelector);
      });
    });

    $$('[data-delete-prog]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [vid, pid] = btn.dataset.deleteProg.split('::');
        const target = [...(st.cruises || []), ...(st.dahabiyas || [])].find(x => x.id === vid);
        if (!target || target.programs.length <= 1) {
          showToast('يجب أن يحتوي المركب على برنامج واحد على الأقل', 'error');
          return;
        }
        const ok = await openConfirmDialog({ title: 'حذف البرنامج', message: 'هل تريد حذف هذا البرنامج؟' });
        if (!ok) return;
        target.programs = target.programs.filter(p => p.id !== pid);
        await saveAndRefresh(containerSelector, 'تم حذف البرنامج');
      });
    });

    // Sightseeing quick actions + drawer
    $$('[data-sight-loc-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        sightLocationFilter = btn.dataset.sightLocFilter;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-add-sightseeing')?.addEventListener('click', async () => {
      if (!Array.isArray(st.sightseeingPlaces)) st.sightseeingPlaces = [];
      st.sightseeingPlaces.unshift(buildDefaultSightseeing());
      await saveAndRefresh(containerSelector, 'تم إضافة مزار جديد');
      openSightDrawer(st, 0, containerSelector);
    });

    $$('[data-quick-sight-price]').forEach(inp => {
      inp.addEventListener('change', async () => {
        const idx = Number(inp.dataset.quickSightPrice);
        if (st.sightseeingPlaces?.[idx]) {
          st.sightseeingPlaces[idx].price = Number(inp.value) || 0;
          await saveAndRefresh(containerSelector, 'تم تحديث السعر فوراً');
        }
      });
    });

    $$('[data-quick-sight-toggle]').forEach(chk => {
      chk.addEventListener('change', async () => {
        const idx = Number(chk.dataset.quickSightToggle);
        if (st.sightseeingPlaces?.[idx]) {
          st.sightseeingPlaces[idx].enabled = chk.checked;
          await saveAndRefresh(containerSelector, chk.checked ? 'تم تفعيل المزار' : 'تم إخفاء المزار');
        }
      });
    });

    $$('[data-open-sight-drawer]').forEach(btn => {
      btn.addEventListener('click', () => openSightDrawer(st, Number(btn.dataset.openSightDrawer), containerSelector));
    });

    $$('[data-delete-sight]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.deleteSight);
        const ok = await openConfirmDialog({ title: 'حذف المزار', message: `حذف "${st.sightseeingPlaces?.[idx]?.title}" من الموقع؟` });
        if (!ok) return;
        st.sightseeingPlaces.splice(idx, 1);
        await saveAndRefresh(containerSelector, 'تم حذف المزار');
      });
    });

    // Add-ons quick actions + drawer
    $('#btn-add-addon')?.addEventListener('click', async () => {
      st.addons.unshift(buildDefaultAddon());
      await saveAndRefresh(containerSelector, 'تم إضافة Add-on جديد');
      openAddonDrawer(st, 0, containerSelector);
    });

    $$('[data-quick-addon-price]').forEach(inp => {
      inp.addEventListener('change', async () => {
        const idx = Number(inp.dataset.quickAddonPrice);
        if (st.addons?.[idx]) {
          st.addons[idx].price = Number(inp.value) || 0;
          await saveAndRefresh(containerSelector, 'تم تحديث سعر الإضافة');
        }
      });
    });

    $$('[data-quick-addon-toggle]').forEach(chk => {
      chk.addEventListener('change', async () => {
        const idx = Number(chk.dataset.quickAddonToggle);
        if (st.addons?.[idx]) {
          st.addons[idx].enabled = chk.checked;
          await saveAndRefresh(containerSelector, chk.checked ? 'تم تفعيل الإضافة' : 'تم إخفاء الإضافة');
        }
      });
    });

    $$('[data-open-addon-drawer]').forEach(btn => {
      btn.addEventListener('click', () => openAddonDrawer(st, Number(btn.dataset.openAddonDrawer), containerSelector));
    });

    $$('[data-delete-addon]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.deleteAddon);
        const ok = await openConfirmDialog({ title: 'حذف الإضافة', message: `حذف "${st.addons?.[idx]?.title}"؟` });
        if (!ok) return;
        st.addons.splice(idx, 1);
        await saveAndRefresh(containerSelector, 'تم حذف الإضافة');
      });
    });

    // FAQs Manager actions
    $$('[data-faq-scope-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        faqScopeFilter = btn.dataset.faqScopeFilter;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-add-faq')?.addEventListener('click', () => openFaqDrawer(st, null, containerSelector));

    $$('[data-open-faq-drawer]').forEach(btn => {
      btn.addEventListener('click', () => openFaqDrawer(st, Number(btn.dataset.openFaqDrawer), containerSelector));
    });

    $$('[data-quick-faq-toggle]').forEach(chk => {
      chk.addEventListener('change', async () => {
        const idx = Number(chk.dataset.quickFaqToggle);
        if (st.faqs?.[idx]) {
          st.faqs[idx].enabled = chk.checked;
          await saveAndRefresh(containerSelector, chk.checked ? 'تم إظهار السؤال بالموقع' : 'تم إخفاء السؤال');
        }
      });
    });

    $$('[data-move-faq]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [idxStr, dirStr] = btn.dataset.moveFaq.split(':');
        const idx = Number(idxStr), dir = Number(dirStr);
        const target = idx + dir;
        if (target >= 0 && target < (st.faqs || []).length) {
          [st.faqs[idx], st.faqs[target]] = [st.faqs[target], st.faqs[idx]];
          await saveAndRefresh(containerSelector, 'تم تعديل ترتيب السؤال');
        }
      });
    });

    $$('[data-delete-faq]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.deleteFaq);
        const ok = await openConfirmDialog({ title: 'حذف السؤال', message: 'هل تريد حذف هذا السؤال من قائمة FAQ؟' });
        if (!ok) return;
        st.faqs.splice(idx, 1);
        await saveAndRefresh(containerSelector, 'تم حذف السؤال');
      });
    });

    // Custom Pages Builder
    $$('[data-select-page]').forEach(el => {
      el.addEventListener('click', () => {
        editingPageId = el.dataset.selectPage;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-add-custom-page')?.addEventListener('click', async () => {
      const newPage = buildDefaultCustomPage();
      st.customPages.push(newPage);
      editingPageId = newPage.id;
      await saveAndRefresh(containerSelector, 'تم إنشاء صفحة جديدة');
    });

    $('#adm-page-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pid = e.target.dataset.pageId;
      const fd = new FormData(e.target);
      const pg = st.customPages.find(x => x.id === pid);
      if (!pg) return;
      pg.title = fd.get('title');
      pg.slug = slugify(fd.get('slug'));
      pg.heroEyebrow = fd.get('heroEyebrow');
      pg.navParent = fd.get('navParent');
      pg.heroImage = fd.get('heroImage');
      pg.heroSub = fd.get('heroSub');
      pg.enabled = fd.get('enabled') === 'on';
      pg.showInNavbar = fd.get('showInNavbar') === 'on';
      pg.showOnHome = fd.get('showOnHome') === 'on';

      pg.blocks = (pg.blocks || []).map((_, bIdx) => {
        const type = fd.get(`blk_type_${bIdx}`) || 'text-image';
        const heading = fd.get(`blk_heading_${bIdx}`) || '';
        if (type === 'cards-grid') {
          const items = String(fd.get(`blk_items_${bIdx}`) || '').split(/\r?\n/).filter(Boolean).map(line => {
            const p = line.split('|');
            return { title: (p[0] || '').trim(), desc: (p[1] || '').trim() };
          });
          return { type, heading, items };
        }
        if (type === 'cta-banner') {
          return { type, heading, body: fd.get(`blk_body_${bIdx}`) || '', btnText: fd.get(`blk_btnText_${bIdx}`) || 'Explore', btnUrl: fd.get(`blk_btnUrl_${bIdx}`) || 'plan-your-journey' };
        }
        return { type, eyebrow: fd.get(`blk_eyebrow_${bIdx}`) || '', heading, image: fd.get(`blk_image_${bIdx}`) || '', body: fd.get(`blk_body_${bIdx}`) || '' };
      });
      await saveAndRefresh(containerSelector, `تم حفظ صفحة "${pg.title}"`);
    });

    $$('[data-delete-page]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await openConfirmDialog({ title: 'حذف الصفحة', message: 'هل تريد حذف هذه الصفحة المخصصة؟' });
        if (!ok) return;
        st.customPages = st.customPages.filter(x => x.id !== btn.dataset.deletePage);
        editingPageId = null;
        await saveAndRefresh(containerSelector, 'تم حذف الصفحة');
      });
    });

    $('#btn-add-page-block')?.addEventListener('click', async () => {
      const pg = st.customPages.find(x => x.id === $('#btn-add-page-block').dataset.pageId);
      const t = $('#new-block-type')?.value || 'text-image';
      if (!pg) return;
      if (t === 'cards-grid') pg.blocks.push({ type: 'cards-grid', heading: 'Highlights', items: [{ title: 'Feature One', desc: 'Details...' }] });
      else if (t === 'cta-banner') pg.blocks.push({ type: 'cta-banner', heading: 'Ready to book?', body: 'Speak with our designers.', btnText: 'Plan Journey', btnUrl: 'plan-your-journey' });
      else pg.blocks.push({ type: 'text-image', eyebrow: 'SECTION', heading: 'New Content Section', body: 'Write details here.', image: 'assets/egypt-temple.webp' });
      await saveAndRefresh(containerSelector, 'تم إضافة البلوك');
    });

    $$('[data-delete-block]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pg = st.customPages.find(x => x.id === editingPageId);
        if (pg) {
          pg.blocks.splice(Number(btn.dataset.deleteBlock), 1);
          await saveAndRefresh(containerSelector, 'تم حذف البلوك');
        }
      });
    });

    $$('[data-move-block]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pg = st.customPages.find(x => x.id === editingPageId);
        const [idxStr, dirStr] = btn.dataset.moveBlock.split(':');
        const idx = Number(idxStr), dir = Number(dirStr);
        const target = idx + dir;
        if (pg && target >= 0 && target < pg.blocks.length) {
          [pg.blocks[idx], pg.blocks[target]] = [pg.blocks[target], pg.blocks[idx]];
          await saveAndRefresh(containerSelector, 'تم تحديث ترتيب البلوك');
        }
      });
    });

    // Homepage Hero + Sections (heroVideo fixed!)
    $('#adm-home-hero-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      st.homeConfig = {
        ...st.homeConfig,
        heroEyebrow: fd.get('heroEyebrow'),
        heroTitle: fd.get('heroTitle'),
        heroSub: fd.get('heroSub'),
        primaryBtnText: fd.get('primaryBtnText'),
        primaryBtnUrl: fd.get('primaryBtnUrl'),
        secondaryBtnText: fd.get('secondaryBtnText'),
        secondaryBtnUrl: fd.get('secondaryBtnUrl'),
        heroImage: fd.get('heroImage'),
        heroVideo: fd.get('heroVideo')
      };
      await saveAndRefresh(containerSelector, 'تم حفظ واجهة وفيديو الصفحة الرئيسية');
    });

    $$('[data-edit-live-sec]').forEach(btn => {
      btn.addEventListener('click', () => openLiveSectionEditor(btn.dataset.editLiveSec));
    });

    $$('[data-enable-live-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        setEditMode(true);
        location.hash = '#/';
      });
    });

    $$('[data-toggle-section]').forEach(chk => {
      chk.addEventListener('change', async () => {
        const idx = Number(chk.dataset.toggleSection);
        const list = st.homeConfig.sections || st.homeConfig.sectionsOrder || [];
        st.homeConfig.sections = list;
        if (list[idx]) list[idx].enabled = chk.checked;
        await saveAndRefresh(containerSelector, 'تم تحديث ظهور القسم');
      });
    });

    $$('[data-move-section]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [idxStr, dirStr] = btn.dataset.moveSection.split(':');
        const idx = Number(idxStr), dir = Number(dirStr);
        const list = st.homeConfig.sections || st.homeConfig.sectionsOrder || [];
        st.homeConfig.sections = list;
        const target = idx + dir;
        if (target >= 0 && target < list.length) {
          [list[idx], list[target]] = [list[target], list[idx]];
          await saveAndRefresh(containerSelector, 'تم تحديث ترتيب الصفحة الرئيسية');
        }
      });
    });

    // Collections subtab + actions
    $$('[data-coll-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        collectionSubTab = btn.dataset.collSubtab;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-add-collection-item')?.addEventListener('click', async () => {
      const k = collectionSubTab;
      const uid = Date.now();
      if (k === 'stories') st.stories.unshift({ id: 'story-' + uid, slug: 'story-' + uid, title: 'New Nile Journal Story', category: 'Nile Cruise Guide', date: String(new Date().getFullYear()), image: 'assets/egypt-temple.webp', excerpt: 'Discover timeless Egypt...', summary: 'Discover timeless Egypt...', enabled: true, showOnHome: true });
      else if (k === 'destinations') st.destinations.unshift({ id: 'dest-' + uid, slug: 'dest-' + uid, name: 'New Region', role: 'EGYPTIAN HERITAGE', subtitle: 'EGYPTIAN HERITAGE', desc: 'Explore beyond the Nile...', image: 'assets/egypt-temple.webp', enabled: true, showOnHome: true });
      else st.journeys.unshift({ id: 'journey-' + uid, slug: 'journey-' + uid, name: 'New Egypt Package', duration: '8 Nights', tag: '8 Nights', route: 'Cairo · Luxor · Aswan', image: 'assets/nile-sailing.webp', sub: 'Signature tailored itinerary', summary: 'Signature tailored itinerary', enabled: true, showOnHome: true });
      await saveAndRefresh(containerSelector, 'تم إضافة العنصر بنجاح');
      openCollectionDrawer(st, k, 0, containerSelector);
    });

    $$('[data-quick-coll-toggle]').forEach(chk => {
      chk.addEventListener('change', async () => {
        const [k, idxStr] = chk.dataset.quickCollToggle.split(':');
        const item = st[k]?.[Number(idxStr)];
        if (item) {
          item.enabled = chk.checked;
          await saveAndRefresh(containerSelector, chk.checked ? 'تم التفعيل' : 'تم الإخفاء');
        }
      });
    });

    $$('[data-open-coll-drawer]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [k, idxStr] = btn.dataset.openCollDrawer.split(':');
        openCollectionDrawer(st, k, Number(idxStr), containerSelector);
      });
    });

    $$('[data-delete-coll]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [k, idxStr] = btn.dataset.deleteColl.split(':');
        const ok = await openConfirmDialog({ title: 'حذف العنصر', message: 'هل تريد حذف هذا العنصر؟' });
        if (!ok) return;
        st[k].splice(Number(idxStr), 1);
        await saveAndRefresh(containerSelector, 'تم الحذف');
      });
    });

    // Global Settings + Password Security + Import/Export/Reset
    $('#adm-settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      st.settings = {
        ...st.settings,
        brandName: fd.get('brandName'),
        tagline: fd.get('tagline'),
        currency: fd.get('currency') || 'USD',
        currencySymbol: fd.get('currencySymbol') || '$',
        contactEmail: fd.get('contactEmail'),
        contactPhone: fd.get('contactPhone'),
        whatsapp: fd.get('whatsapp') || fd.get('contactPhone'),
        youtubeHeroUrl: fd.get('youtubeHeroUrl'),
        showAdminBar: fd.get('showAdminBar') === 'on'
      };
      await saveAndRefresh(containerSelector, 'تم حفظ الإعدادات العامة');
    });

    $('#adm-pw-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const cur = String(fd.get('currentPassword') || '');
      const next = String(fd.get('newPassword') || '');
      const conf = String(fd.get('confirmPassword') || '');
      if (next !== conf) {
        showToast('كلمتا المرور الجديدتان غير متطابقتين', 'error');
        return;
      }
      const res = await CMS.changePassword(cur, next);
      if (!res.ok) {
        showToast(res.error || 'تعذر تغيير كلمة المرور', 'error');
        return;
      }
      showToast('تم تحديث كلمة مرور الإدارة بنجاح 🔐');
      renderAdmin(containerSelector);
    });

    $('#btn-export-cms')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `niletrails-cms-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      showToast('تم تحميل النسخة الاحتياطية');
    });

    $('#inp-import-cms')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const txt = await file.text();
        const parsed = JSON.parse(txt);
        if (!parsed || typeof parsed !== 'object') throw new Error('ملف JSON غير صالح');
        await CMS.setState({ ...CMS.DEFAULT_DATA, ...parsed }, { syncEnquiries: true });
        showToast('تم استيراد النسخة الاحتياطية وتطبيقها');
        renderAdmin(containerSelector);
      } catch (err) {
        showToast(err.message || 'فشل قراءة الملف', 'error');
      }
    });

    $('#btn-reset-cms')?.addEventListener('click', async () => {
      const ok = await openConfirmDialog({
        title: 'استعادة الإعدادات الافتراضية',
        message: 'تحذير: سيؤدي هذا إلى إعادة كافة البرامج والأسعار والمزارات إلى ضبط المصنع الأصلي.',
        confirmLabel: 'نعم، استعادة الافتراضي',
        cancelLabel: 'إلغاء'
      });
      if (!ok) return;
      await CMS.resetToDefaults();
      showToast('تم استعادة الضبط الافتراضي');
      renderAdmin(containerSelector);
    });
  }

  return {
    renderAdmin,
    isAuthed: () => CMS.isAuthenticated(),
    isEditMode,
    setEditMode,
    getSubMode,
    setSubMode,
    getPreviewDevice,
    setPreviewDevice,
    undo,
    redo,
    canUndo,
    canRedo,
    saveInlinePath,
    getTextOverride,
    saveTextOverride,
    deleteListItem,
    addListItemOfType,
    moveListItem,
    recordDomDelete,
    recordDomDuplicate,
    recordDomStyle,
    recordDomAttr,
    recordDomMove,
    uploadMediaFile,
    addElementFromDeletedType,
    clearDeletedElementTypes,
    showActionToast,
    openLiveEditor: openLiveSectionEditor,
    openTab: (tabId) => { activeTab = tabId; },
    toggleHomeSectionVisibility: async (secId, onDone) => {
      const st = CMS.getState();
      const beforeSnap = captureSnapshot();
      const list = st.homeConfig?.sections || [];
      const item = list.find(x => x.id === secId);
      if (item) {
        item.enabled = item.enabled === false;
        await finishSave(typeof onDone === 'function' ? onDone : null, item.enabled ? `تم إظهار "${secId}"` : `تم إخفاء "${secId}"`, beforeSnap);
      }
    },
    moveHomeSection: async (secId, dir, onDone) => {
      const st = CMS.getState();
      const beforeSnap = captureSnapshot();
      const list = st.homeConfig?.sections || [];
      const idx = list.findIndex(x => x.id === secId);
      const target = idx + dir;
      if (idx >= 0 && target >= 0 && target < list.length) {
        [list[idx], list[target]] = [list[target], list[idx]];
        await finishSave(typeof onDone === 'function' ? onDone : null, 'تم تغيير ترتيب القسم في الصفحة الرئيسية', beforeSnap);
      }
    }
  };
})();
