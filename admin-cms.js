window.NileTrailsAdmin = (() => {
  'use strict';

  const CMS = window.NileTrailsCMS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let activeTab = 'bookings'; // bookings | cruises | addons | pages | homepage | collections | settings
  let selectedVesselId = null;
  let editingProgramContext = null; // { vesselId, programId }
  let editingPageId = null;
  let toastTimer = null;

  const PRESET_IMAGES = [
    ['Nile Sailing (Dahabiya)', 'assets/nile-sailing.webp'],
    ['Ancient Egyptian Temple', 'assets/egypt-temple.webp'],
    ['Luxury Nile Cruise Ship', 'assets/nile-cruise.webp']
  ];

  const PRESET_VIDEOS = [
    ['مقطع 1 — النيل الرئيسي (Hero Main MP4)', 'assets/videos/hero-main.mp4'],
    ['مقطع 2 — كروز النيل (Cruise Segment 1)', 'assets/videos/hero-cruise-1.mp4'],
    ['مقطع 3 — كروز النيل (Cruise Segment 2)', 'assets/videos/hero-cruise-2.mp4'],
    ['مقطع 4 — كروز النيل (Cruise Segment 3)', 'assets/videos/hero-cruise-3.mp4'],
    ['مقطع 5 — الدهبية الشراعية (Dahabiya Segment 1)', 'assets/videos/hero-dahabiya-1.mp4'],
    ['مقطع 6 — الدهبية والنوبة (Dahabiya Segment 2)', 'assets/videos/hero-dahabiya-2.mp4'],
    ['رابط يوتيوب كامل (YouTube Autoplay)', 'https://www.youtube.com/watch?v=otvczRRDdRI']
  ];

  function showToast(msg) {
    let el = $('#cms-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cms-toast';
      el.className = 'cms-toast';
      document.body.appendChild(el);
    }
    el.textContent = '✓ ' + msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ('item-' + Date.now());
  }

  // ==================== 1. BOOKINGS & ENQUIRIES TAB ====================
  function renderBookingsTab(st) {
    const enquiries = st.enquiries || [];
    const cur = st.settings?.currencySymbol || '$';
    const newCount = enquiries.filter(e => e.status === 'New').length;

    return `
      <div class="adm-section-head">
        <div>
          <h2>حجوزات وطلبات العملاء الأجانب · Foreign Guest Bookings (${enquiries.length})</h2>
          <p>جميع الحجوزات الواردة من فورم البرامج داخل كل كروز مع البرامج الإضافية (Add-ons) التي اختارها العميل.</p>
        </div>
        <div class="adm-stats-pills">
          <span class="stat-pill gold">إجمالي الطلبات: ${enquiries.length}</span>
          <span class="stat-pill green">طلبات جديدة: ${newCount}</span>
        </div>
      </div>

      ${enquiries.length === 0 ? `<div class="adm-empty">لا توجد حجوزات حتى الآن. جرب فتح أي Cruise واختيار برنامج وتعبئة الفورم.</div>` : `
        <div class="adm-bookings-list">
          ${enquiries.map((eq, idx) => `
            <article class="adm-booking-card status-${esc((eq.status || 'New').toLowerCase())}">
              <div class="abk-header">
                <div>
                  <span class="abk-ref">#${esc(eq.id || ('NT-' + (idx + 1)))}</span>
                  <span class="abk-date">🗓 ${esc(eq.createdAt || '')}</span>
                  <span class="abk-nat">🌍 ${esc(eq.nationality || 'International')}</span>
                </div>
                <div class="abk-actions">
                  <label class="abk-status-label">الحالة:
                    <select data-eq-status="${idx}">
                      ${['New', 'Confirmed', 'In Progress', 'Archived'].map(s => `<option value="${s}" ${(eq.status || 'New') === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                  </label>
                  <button type="button" class="adm-btn-danger-sm" data-eq-delete="${idx}">حذف ✕</button>
                </div>
              </div>

              <div class="abk-grid">
                <div class="abk-col">
                  <small>العميل الأجنبي (FOREIGN GUEST)</small>
                  <strong>${esc(eq.clientName)}</strong>
                  <div>✉ <a href="mailto:${esc(eq.clientEmail)}">${esc(eq.clientEmail)}</a></div>
                  <div>📞 ${esc(eq.clientPhone)}</div>
                  <div>🛂 Passport/Visa: ${esc(eq.passportReady || 'Standard')}</div>
                </div>

                <div class="abk-col">
                  <small>الكروز والبرنامج المختار (CRUISE & PROGRAM)</small>
                  <strong style="color:#0d2a3a">${esc(eq.vesselTitle)}</strong>
                  <div style="color:#a57a47;font-weight:700">◈ ${esc(eq.programTitle)}</div>
                  <div>🛏 الكابينة: ${esc(eq.cabinName)} ${eq.bedConfig ? `(${esc(eq.bedConfig)})` : ''}</div>
                  <div>📅 الوصول: ${esc(eq.checkInDate)} (${esc(eq.dateFlexibility || 'Flexible')}) · 👥 ${esc(eq.adults)} Adults${eq.children ? `, ${esc(eq.children)} Children` : ''}</div>
                </div>

                <div class="abk-col">
                  <small>البرامج الإضافية والـ ADD-ONS المختارة</small>
                  ${(eq.selectedAddons && eq.selectedAddons.length) ? `
                    <ul class="abk-addons-ul">
                      ${eq.selectedAddons.map(a => `<li>✓ ${esc(a.title)} ${a.price ? `(+${cur}${a.price})` : ''}</li>`).join('')}
                    </ul>
                  ` : `<div style="color:#7c8b92">بدون إضافات (البرنامج الأساسي فقط)</div>`}
                  <div class="abk-total">الإجمالي التقديري: <strong>${typeof eq.estimatedTotal === 'number' ? cur + eq.estimatedTotal.toLocaleString() : esc(eq.estimatedTotal)}</strong></div>
                </div>
              </div>

              <div class="abk-footer">
                <span>🥗 نظام غذائي: <strong>${esc(eq.dietary || 'None')}</strong></span>
                <span>🎉 المناسبة/اللغة: <strong>${esc(eq.occasion || 'Standard')}</strong></span>
                <span>✈ الاستقبال: <strong>${esc(eq.flightTransfer || 'Standard')}</strong></span>
                ${eq.notes ? `<div class="abk-notes">💬 ملاحظات العميل: "${esc(eq.notes)}"</div>` : ''}
              </div>
            </article>
          `).join('')}
        </div>
      `}
    `;
  }

  // ==================== 2. CRUISES, DAHABIYAS & PROGRAMS TAB ====================
  function renderCruisesAndProgramsTab(st) {
    const allVessels = [
      ...(st.cruises || []).map(c => ({ ...c, _listKey: 'cruises' })),
      ...(st.dahabiyas || []).map(d => ({ ...d, _listKey: 'dahabiyas' }))
    ];
    if (!selectedVesselId && allVessels.length) {
      selectedVesselId = allVessels[0].id || allVessels[0].slug;
    }
    const activeVessel = allVessels.find(v => (v.id || v.slug) === selectedVesselId) || allVessels[0];

    // If editing a specific Program inside the selected vessel
    if (editingProgramContext && activeVessel) {
      const prog = (activeVessel.programs || []).find(p => p.id === editingProgramContext.programId);
      if (prog) {
        return renderProgramEditorModalView(st, activeVessel, prog);
      }
    }

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة الكروز والدهبيات والبرامج بداخلها · Cruises & Programs</h2>
          <p>أضف أو عدّل أي Cruise أو Dahabiya، وتحكم في البرامج (Programs) الموجودة بداخل كل كروز، وأسعارها، وتفاصيل الأيام والـ Add-ons.</p>
        </div>
        <button type="button" class="adm-btn-primary" id="btn-add-vessel">+ إضافة Cruise / Dahabiya جديد</button>
      </div>

      <div class="adm-split-workspace">
        <!-- Left Sidebar: List of Vessels -->
        <div class="adm-vessel-list">
          <div class="adm-list-header">اختر الكروز لإدارة برامجه (${allVessels.length})</div>
          ${allVessels.map(v => {
            const vid = v.id || v.slug;
            const isSel = activeVessel && (activeVessel.id || activeVessel.slug) === vid;
            const progCount = (v.programs || []).length;
            return `
              <div class="adm-vessel-item ${isSel ? 'active' : ''}" data-select-vessel="${esc(vid)}">
                <img src="${esc(v.image)}" alt="">
                <div class="avi-info">
                  <strong>${esc(v.title)}</strong>
                  <small>${esc(v.kind === 'dahabiya' ? 'Dahabiya' : 'Nile Cruise')} · ${esc(v.tier)} · ${v.nights}N</small>
                  <div class="avi-badges">
                    <span class="badge-prog">${progCount} Programs</span>
                    ${v.showOnHome ? `<span class="badge-home">في الرئيسية ✓</span>` : ''}
                    ${v.enabled === false ? `<span class="badge-off">مخفي</span>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Right Panel: Vessel Settings + Its Programs -->
        <div class="adm-vessel-detail">
          ${activeVessel ? `
            <div class="adm-card">
              <div class="adm-card-head">
                <h3>بيانات الكروز: ${esc(activeVessel.title)}</h3>
                <div style="display:flex;gap:10px">
                  <a href="#/${activeVessel.kind === 'dahabiya' ? 'dahabiyas' : 'nile-cruises'}/${esc(activeVessel.slug)}" target="_blank" class="adm-btn-outline-sm">معاينة الصفحة في الموقع ↗</a>
                  <button type="button" class="adm-btn-danger-sm" data-delete-vessel="${esc(activeVessel.id || activeVessel.slug)}" data-vessel-key="${esc(activeVessel._listKey)}">حذف الكروز</button>
                </div>
              </div>

              <form id="form-save-vessel" class="adm-form-grid">
                <input type="hidden" name="vesselId" value="${esc(activeVessel.id || activeVessel.slug)}">
                <input type="hidden" name="listKey" value="${esc(activeVessel._listKey)}">

                <label>اسم الكروز / الدهبية (Title)
                  <input type="text" name="title" value="${esc(activeVessel.title)}" required>
                </label>
                <label>الرابط المختصر (URL Slug)
                  <input type="text" name="slug" value="${esc(activeVessel.slug)}" required>
                </label>
                <label>النوع (Type)
                  <select name="kind">
                    <option value="cruise" ${activeVessel.kind !== 'dahabiya' ? 'selected' : ''}>Nile Cruise (باخرة كروز)</option>
                    <option value="dahabiya" ${activeVessel.kind === 'dahabiya' ? 'selected' : ''}>Dahabiya (دهبية شراعية)</option>
                  </select>
                </label>
                <label>المستوى (Tier)
                  <select name="tier">
                    ${['Luxury', 'Deluxe', 'Superior', 'Private'].map(t => `<option value="${t}" ${activeVessel.tier === t ? 'selected' : ''}>${t}</option>`).join('')}
                  </select>
                </label>
                <label>عدد الليالي الافتراضي (Nights)
                  <input type="number" name="nights" value="${Number(activeVessel.nights) || 4}" min="1" max="21">
                </label>
                <label>خط السير (Route)
                  <input type="text" name="route" value="${esc(activeVessel.route)}">
                </label>
                <label>وسم مميز (Tag)
                  <input type="text" name="tag" value="${esc(activeVessel.tag)}">
                </label>
                <label>الصورة (Image URL)
                  <select name="imagePreset" onchange="if(this.value) this.form.image.value=this.value">
                    <option value="">-- اختر صورة جاهزة أو اكتب الرابط --</option>
                    ${PRESET_IMAGES.map(([lbl, url]) => `<option value="${url}" ${activeVessel.image === url ? 'selected' : ''}>${lbl}</option>`).join('')}
                  </select>
                  <input type="text" name="image" value="${esc(activeVessel.image)}" style="margin-top:6px">
                </label>
                <label>فيديو الـ Hero بدون صوت (Autoplay Hero Video)
                  <select name="videoPreset" onchange="if(this.value) this.form.heroVideo.value=this.value">
                    <option value="">-- اختر مقطع فيديو جاهز أو ضع رابط يوتيوب --</option>
                    ${PRESET_VIDEOS.map(([lbl, url]) => `<option value="${url}" ${activeVessel.heroVideo === url ? 'selected' : ''}>${lbl}</option>`).join('')}
                  </select>
                  <input type="text" name="heroVideo" value="${esc(activeVessel.heroVideo || 'assets/videos/hero-cruise-1.mp4')}" style="margin-top:6px" placeholder="assets/videos/hero-cruise-1.mp4 أو رابط YouTube">
                </label>
                <label class="full-col">وصف مختصر (Subtitle)
                  <input type="text" name="sub" value="${esc(activeVessel.sub)}">
                </label>
                <label class="full-col">مرافق وتجهيزات الكروز (CRUISE FACILITIES — سطر لكل مرفق)
                  <textarea name="facilities" rows="4">${esc((activeVessel.facilities && activeVessel.facilities.length ? activeVessel.facilities : (CMS.DEFAULT_FACILITIES || [])).join('\n'))}</textarea>
                </label>

                <div class="full-col adm-toggles-row">
                  <label class="adm-switch">
                    <input type="checkbox" name="enabled" ${activeVessel.enabled !== false ? 'checked' : ''}>
                    <span>مفعّل ويظهر في الموقع (Published)</span>
                  </label>
                  <label class="adm-switch">
                    <input type="checkbox" name="showOnHome" ${activeVessel.showOnHome ? 'checked' : ''}>
                    <span>يظهر في الصفحة الرئيسية (Show on Homepage)</span>
                  </label>
                  <button type="submit" class="adm-btn-gold">حفظ تعديلات الكروز ✓</button>
                </div>
              </form>
            </div>

            <!-- PROGRAMS INSIDE THIS VESSEL -->
            <div class="adm-card" style="margin-top:24px">
              <div class="adm-card-head">
                <div>
                  <h3>البرامج داخل "${esc(activeVessel.title)}" (${(activeVessel.programs || []).length} Programs)</h3>
                  <p style="margin:4px 0 0;font-size:13px;color:#647882">كل برنامج له خط سير، تفاصيل أيام، مرافق الكروز، المزارات السياحية بالمرشد، وفورم حجز للعميل الأجنبي.</p>
                </div>
                <button type="button" class="adm-btn-primary" id="btn-add-program" data-vessel-id="${esc(activeVessel.id || activeVessel.slug)}" data-list-key="${esc(activeVessel._listKey)}">
                  + إضافة برنامج جديد داخل هذا الكروز
                </button>
              </div>

              <div class="adm-programs-list">
                ${(activeVessel.programs || []).map((prog, pIdx) => `
                  <div class="adm-prog-row">
                    <div class="apr-main">
                      <div class="apr-badges">
                        <span class="apr-num">PROGRAM 0${pIdx + 1}</span>
                        <span class="apr-badge">${esc(prog.tabLabel || prog.badge || 'Standard')}</span>
                        <span class="apr-price">$${prog.basePrice} / person</span>
                        ${prog.canBeAddonForOthers ? `<span class="badge-home">متاح كـ Add-on للبرامج التانية ✓</span>` : ''}
                      </div>
                      <h4>${esc(prog.title)}</h4>
                      <p>${esc(prog.duration)} · ${esc(prog.route)}</p>
                      <small>${(prog.itinerary || []).length} أيام في البرنامج · ${(prog.cabins || []).length} فئات كبائن</small>
                    </div>
                    <div class="apr-actions">
                      <button type="button" class="adm-btn-gold-sm" data-edit-prog="${esc(prog.id)}" data-vessel-id="${esc(activeVessel.id || activeVessel.slug)}">
                        ✎ تعديل البرنامج والـ Facilities والـ Add-ons
                      </button>
                      <button type="button" class="adm-btn-danger-sm" data-delete-prog="${esc(prog.id)}" data-vessel-id="${esc(activeVessel.id || activeVessel.slug)}" data-list-key="${esc(activeVessel._listKey)}">
                        حذف
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderProgramEditorModalView(st, vessel, prog) {
    const allAddons = st.addons || [];
    const allowAll = !prog.allowedAddonIds || prog.allowedAddonIds.includes('ALL');

    return `
      <div class="adm-section-head">
        <div>
          <button type="button" class="adm-btn-outline-sm" id="btn-back-to-vessel">← الرجوع إلى ${esc(vessel.title)}</button>
          <h2 style="margin-top:10px">تعديل البرنامج: ${esc(prog.title)}</h2>
          <p>تحكم في كل تفاصيل البرنامج، فيديو الـ Hero الصامت، مرافق الكروز (Cruise Facilities)، جدول الأيام، أسعار الكبائن، والـ Add-ons.</p>
        </div>
      </div>

      <form id="form-save-program" class="adm-card">
        <div class="adm-form-grid">
          <label class="full-col">اسم البرنامج (Program Title) *
            <input type="text" name="title" value="${esc(prog.title)}" required>
          </label>
          <label>عنوان التبويب المختصر (Tab Label — مثل 3 Nights)
            <input type="text" name="tabLabel" value="${esc(prog.tabLabel || prog.nights + ' Nights')}" placeholder="3 Nights">
          </label>
          <label>وصف التبويب المختصر (Tab Route — مثل Aswan → Luxor)
            <input type="text" name="tabSub" value="${esc(prog.tabSub || prog.route)}" placeholder="Aswan → Luxor">
          </label>
          <label>الرابط المختصر للبرنامج (Slug)
            <input type="text" name="slug" value="${esc(prog.slug)}" required>
          </label>
          <label>وسم البرنامج (Badge)
            <input type="text" name="badge" value="${esc(prog.badge || 'Most Popular')}" placeholder="Most Popular / All-Inclusive VIP">
          </label>
          <label>المدة النصية (Duration Label)
            <input type="text" name="duration" value="${esc(prog.duration)}" placeholder="5 Days / 4 Nights">
          </label>
          <label>عدد الليالي (Nights)
            <input type="number" name="nights" value="${Number(prog.nights) || 4}">
          </label>
          <label>خط سير البرنامج (Route)
            <input type="text" name="route" value="${esc(prog.route)}">
          </label>
          <label>أيام الإبحار (Departure Days)
            <input type="text" name="departureDays" value="${esc(prog.departureDays || 'Every Monday & Saturday')}">
          </label>
          <label>السعر الأساسي للفرد بالدولار (Base Price USD)
            <input type="number" name="basePrice" value="${Number(prog.basePrice) || 890}">
          </label>
          <label>فيديو الـ Hero الخاص بالبرنامج (Silent Autoplay Video)
            <select name="progVideoPreset" onchange="if(this.value) this.form.heroVideo.value=this.value">
              <option value="">-- اختر مقطع فيديو مجزأ جاهز --</option>
              ${PRESET_VIDEOS.map(([lbl, url]) => `<option value="${url}" ${prog.heroVideo === url ? 'selected' : ''}>${lbl}</option>`).join('')}
            </select>
            <input type="text" name="heroVideo" value="${esc(prog.heroVideo || vessel.heroVideo || 'assets/videos/hero-cruise-1.mp4')}" style="margin-top:6px">
          </label>

          <label class="full-col">وصف البرنامج (Program Summary)
            <textarea name="summary" rows="3">${esc(prog.summary)}</textarea>
          </label>

          <label class="full-col">مرافق وتجهيزات الكروز في هذا البرنامج (CRUISE FACILITIES — سطر لكل مرفق)
            <textarea name="facilities" rows="5">${esc((prog.facilities && prog.facilities.length ? prog.facilities : (vessel.facilities || CMS.DEFAULT_FACILITIES || [])).join('\n'))}</textarea>
          </label>

          <label class="full-col">مميزات البرنامج (Highlights — سطر لكل ميزة)
            <textarea name="highlights" rows="4">${esc((prog.highlights || []).join('\n'))}</textarea>
          </label>

          <label>ما يشمله البرنامج (Included — سطر لكل عنصر)
            <textarea name="included" rows="5">${esc((prog.included || []).join('\n'))}</textarea>
          </label>

          <label>ما لا يشمله البرنامج (Excluded — سطر لكل عنصر)
            <textarea name="excluded" rows="5">${esc((prog.excluded || []).join('\n'))}</textarea>
          </label>

          <div class="full-col">
            <h4 style="margin:12px 0 8px;color:#0d2a3a">جدول الأيام (Day-by-Day Itinerary — صيغة: اليوم | العنوان | الوصف | الوجبات في كل سطر)</h4>
            <textarea name="itineraryText" rows="6" style="font-family:monospace;font-size:12px">${esc((prog.itinerary || []).map(it => `${it.day} | ${it.title} | ${it.desc} | ${it.meals || 'Breakfast · Lunch · Dinner'}`).join('\n'))}</textarea>
          </div>

          <div class="full-col">
            <h4 style="margin:12px 0 8px;color:#0d2a3a">فئات الكبائن وأسعار الترقية (Cabins — صيغة: اسم الكابينة | فرق السعر بالدولار | الوصف)</h4>
            <textarea name="cabinsText" rows="4" style="font-family:monospace;font-size:12px">${esc((prog.cabins || []).map(c => `${c.name} | ${c.priceDelta} | ${c.desc}`).join('\n'))}</textarea>
          </div>

          <div class="full-col adm-addon-config-box">
            <h4>خيارات الـ Add-ons والبرامج الإضافية لهذا البرنامج</h4>
            <label class="adm-switch" style="margin-bottom:14px">
              <input type="checkbox" name="canBeAddonForOthers" ${prog.canBeAddonForOthers ? 'checked' : ''}>
              <span><strong>إتاحة هذا البرنامج نفسه كـ Add-on يظهر للعملاء داخل البرامج التانية!</strong> (Cross-Program Add-on)</span>
            </label>

            <label class="adm-switch" style="margin-bottom:14px">
              <input type="checkbox" name="allowAllAddons" id="chk-allow-all-addons" ${allowAll ? 'checked' : ''}>
              <span>إظهار جميع الـ Add-ons والبرامج الملحقة المفعّلة للعميل في فورم الحجز</span>
            </label>

            <div id="specific-addons-list" style="${allowAll ? 'opacity:.55' : ''}">
              <small style="display:block;margin-bottom:8px">أو حدد الـ Add-ons المسموحة في هذا البرنامج:</small>
              <div class="adm-checkbox-grid">
                ${allAddons.map(ad => `
                  <label class="adm-chk-item">
                    <input type="checkbox" name="allowedAddonIds" value="${esc(ad.id)}" ${allowAll || (prog.allowedAddonIds || []).includes(ad.id) ? 'checked' : ''}>
                    <span>${esc(ad.title)} (+$${ad.price})</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="full-col" style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
            <button type="button" class="adm-btn-outline" id="btn-cancel-prog">إلغاء</button>
            <button type="submit" class="adm-btn-gold">حفظ البرنامج بالكامل ✓</button>
          </div>
        </div>
      </form>
    `;
  }

  // ==================== 3. ADD-ONS & EXTENSIONS TAB ====================
  function renderAddonsTab(st) {
    const addons = st.addons || [];
    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة الـ Add-ons والبرامج الإضافية الملحقة (${addons.length})</h2>
          <p>تحكم في البرامج الإضافية (مثل برنامج القاهرة والأهرامات، الغردقة والبحر الأحمر، أبو سمبل، البالون الطائر، استقبال VIP) التي يختارها العميل الأجنبي كـ Add-on داخل أي برنامج كروز.</p>
        </div>
        <button type="button" class="adm-btn-primary" id="btn-add-addon">+ إضافة Add-on أو برنامج ملحق جديد</button>
      </div>

      <div class="adm-addons-grid">
        ${addons.map((ad, idx) => `
          <form class="adm-card adm-addon-form" data-addon-idx="${idx}">
            <div class="adm-card-head">
              <span class="prog-pill-gold">${esc(ad.type === 'program-extension' ? 'برنامج ملحق (Program Extension)' : ad.type === 'vip' ? 'خدمة VIP' : 'مزار / رحلة إضافية')}</span>
              <button type="button" class="adm-btn-danger-sm" data-delete-addon="${idx}">حذف ✕</button>
            </div>
            <div class="adm-form-grid">
              <label class="full-col">اسم الـ Add-on / البرنامج الإضافي
                <input type="text" name="title" value="${esc(ad.title)}" required>
              </label>
              <label>النوع (Type)
                <select name="type">
                  <option value="program-extension" ${ad.type === 'program-extension' ? 'selected' : ''}>Multi-Day Program Extension (برنامج كامل لبرامج أخرى)</option>
                  <option value="excursion" ${ad.type === 'excursion' ? 'selected' : ''}>Iconic Excursion (مزار أو رحلة إضافية)</option>
                  <option value="vip" ${ad.type === 'vip' ? 'selected' : ''}>VIP Service (خدمة كبار الزوار / المطار)</option>
                </select>
              </label>
              <label>التصنيف الظاهر (Category Label)
                <input type="text" name="category" value="${esc(ad.category)}">
              </label>
              <label>المدة الزمنية (Duration Badge)
                <input type="text" name="duration" value="${esc(ad.duration)}" placeholder="+3 Days / 2 Nights">
              </label>
              <label>السعر بالدولار (Price USD)
                <input type="number" name="price" value="${Number(ad.price) || 0}">
              </label>
              <label>وحدة السعر (Price Unit)
                <select name="priceUnit">
                  <option value="per person" ${ad.priceUnit !== 'per booking' ? 'selected' : ''}>per person (لكل فرد)</option>
                  <option value="per booking" ${ad.priceUnit === 'per booking' ? 'selected' : ''}>per booking (للحجز بالكامل)</option>
                </select>
              </label>
              <label>الصورة (Image)
                <select name="image">
                  ${PRESET_IMAGES.map(([lbl, url]) => `<option value="${url}" ${ad.image === url ? 'selected' : ''}>${lbl}</option>`).join('')}
                </select>
              </label>
              <label class="full-col">الوصف (Summary)
                <textarea name="summary" rows="2">${esc(ad.summary)}</textarea>
              </label>
              <div class="full-col adm-toggles-row">
                <label class="adm-switch">
                  <input type="checkbox" name="enabled" ${ad.enabled !== false ? 'checked' : ''}>
                  <span>مفعّل في فورم البرامج</span>
                </label>
                <label class="adm-switch">
                  <input type="checkbox" name="showOnHome" ${ad.showOnHome ? 'checked' : ''}>
                  <span>يظهر في الصفحة الرئيسية</span>
                </label>
                <button type="submit" class="adm-btn-gold-sm">حفظ التعديل ✓</button>
              </div>
            </div>
          </form>
        `).join('')}
      </div>
    `;
  }

  // ==================== 4. CUSTOM PAGES & PAGE BUILDER TAB ====================
  function renderPagesBuilderTab(st) {
    const pages = st.customPages || [];
    if (!editingPageId && pages.length) {
      editingPageId = pages[0].id;
    }
    const activePage = pages.find(p => p.id === editingPageId) || pages[0];
    const allVessels = [...(st.cruises || []), ...(st.dahabiyas || [])];

    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة الصفحات وبناء صفحات جديدة · Custom Page Builder</h2>
          <p>أضف أي عدد من الصفحات الجديدة، وحدد هل تظهر في الصفحة الرئيسية أو القائمة العلوية أو الفوتر، وصمم الأقسام التي تظهر بداخلها بسهولة.</p>
        </div>
        <button type="button" class="adm-btn-primary" id="btn-create-new-page">+ إنشاء صفحة جديدة</button>
      </div>

      <div class="adm-split-workspace">
        <!-- Left Sidebar: Pages List -->
        <div class="adm-vessel-list">
          <div class="adm-list-header">صفحات الموقع المخصصة (${pages.length})</div>
          ${pages.map(pg => `
            <div class="adm-vessel-item ${activePage && activePage.id === pg.id ? 'active' : ''}" data-select-page="${esc(pg.id)}">
              <div class="avi-info">
                <strong>${esc(pg.title)}</strong>
                <small>#/page/${esc(pg.slug)}</small>
                <div class="avi-badges">
                  ${pg.showOnHome ? `<span class="badge-home">في الرئيسية ✓</span>` : ''}
                  ${pg.showInNavbar ? `<span class="badge-prog">في القائمة ✓</span>` : ''}
                  ${pg.enabled === false ? `<span class="badge-off">مخفي</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Right Workspace: Page Settings & Content Blocks Builder -->
        <div class="adm-vessel-detail">
          ${activePage ? `
            <div class="adm-card">
              <div class="adm-card-head">
                <h3>إعدادات الصفحة ومكان ظهورها: ${esc(activePage.title)}</h3>
                <div style="display:flex;gap:10px">
                  <a href="#/page/${esc(activePage.slug)}" target="_blank" class="adm-btn-outline-sm">معاينة الصفحة الآن ↗</a>
                  <button type="button" class="adm-btn-danger-sm" data-delete-page="${esc(activePage.id)}">حذف الصفحة</button>
                </div>
              </div>

              <form id="form-save-custom-page" class="adm-form-grid">
                <input type="hidden" name="pageId" value="${esc(activePage.id)}">
                <label>عنوان الصفحة (Page Title) *
                  <input type="text" name="title" value="${esc(activePage.title)}" required>
                </label>
                <label>رابط الصفحة (URL Slug: #/page/...) *
                  <input type="text" name="slug" value="${esc(activePage.slug)}" required>
                </label>
                <label>عنوان فرعي علوي (Eyebrow)
                  <input type="text" name="eyebrow" value="${esc(activePage.eyebrow || 'SPECIAL COLLECTION')}">
                </label>
                <label>صورة الغلاف (Hero Image)
                  <select name="heroImage">
                    ${PRESET_IMAGES.map(([lbl, url]) => `<option value="${url}" ${activePage.heroImage === url ? 'selected' : ''}>${lbl}</option>`).join('')}
                  </select>
                </label>
                <label class="full-col">وصف الغلاف (Hero Subtitle)
                  <textarea name="subtitle" rows="2">${esc(activePage.subtitle)}</textarea>
                </label>

                <div class="full-col adm-addon-config-box">
                  <h4>أين تريد أن تظهر هذه الصفحة؟ (أماكن الظهور في الموقع)</h4>
                  <div class="adm-toggles-row" style="margin-top:10px">
                    <label class="adm-switch">
                      <input type="checkbox" name="enabled" ${activePage.enabled !== false ? 'checked' : ''}>
                      <span>تفعيل الصفحة (Published)</span>
                    </label>
                    <label class="adm-switch">
                      <input type="checkbox" name="showOnHome" ${activePage.showOnHome ? 'checked' : ''}>
                      <span><strong>إظهار في الصفحة الرئيسية (Show on Homepage)</strong></span>
                    </label>
                    <label class="adm-switch">
                      <input type="checkbox" name="showInNavbar" ${activePage.showInNavbar ? 'checked' : ''}>
                      <span>إظهار في القائمة العلوية (Main Navbar)</span>
                    </label>
                    <label class="adm-switch">
                      <input type="checkbox" name="showInFooter" ${activePage.showInFooter ? 'checked' : ''}>
                      <span>إظهار في الفوتر (Footer)</span>
                    </label>
                  </div>
                  <div class="two-fields" style="margin-top:14px">
                    <label>موقع الرابط في القائمة العلوية (Navbar Location)
                      <select name="navParent">
                        <option value="top" ${activePage.navParent === 'top' ? 'selected' : ''}>رابط رئيسي مستقل في الهيدر (Top-Level Header Link)</option>
                        <option value="nile-cruises" ${activePage.navParent === 'nile-cruises' ? 'selected' : ''}>داخل قائمة Nile Cruises</option>
                        <option value="dahabiyas" ${activePage.navParent === 'dahabiyas' ? 'selected' : ''}>داخل قائمة Dahabiyas</option>
                        <option value="journeys" ${activePage.navParent === 'journeys' ? 'selected' : ''}>داخل قائمة Journeys</option>
                        <option value="beyond-the-nile" ${activePage.navParent === 'beyond-the-nile' ? 'selected' : ''}>داخل قائمة Beyond the Nile</option>
                        <option value="about" ${activePage.navParent === 'about' ? 'selected' : ''}>داخل قائمة About</option>
                      </select>
                    </label>
                    <label>وسم البطاقة في الصفحة الرئيسية (Home Card Tag)
                      <input type="text" name="homeCardTag" value="${esc(activePage.homeCardTag || 'Special Experience')}">
                    </label>
                  </div>
                </div>

                <div class="full-col" style="display:flex;justify-content:flex-end">
                  <button type="submit" class="adm-btn-gold">حفظ إعدادات الصفحة ✓</button>
                </div>
              </form>
            </div>

            <!-- PAGE CONTENT BLOCKS BUILDER -->
            <div class="adm-card" style="margin-top:24px">
              <div class="adm-card-head">
                <div>
                  <h3>محتوى الصفحة: ماذا يظهر داخل "${esc(activePage.title)}"؟ (${(activePage.blocks || []).length} أقسام)</h3>
                  <p style="margin:4px 0 0;font-size:13px;color:#647882">أضف أقسام نصية، أو شبكة برامج وكروز، أو عروض Add-ons، أو أسئلة شائعة، أو فورم حجز مباشر داخل هذه الصفحة.</p>
                </div>
                <div class="adm-add-block-bar">
                  <select id="sel-new-block-type">
                    <option value="editorial">📝 قسم نصي تعريفي + زر (Editorial Section)</option>
                    <option value="programs-showcase">🚢 عرض كروز وبرامج مختارة (Cruises & Programs Grid)</option>
                    <option value="addons-showcase">➕ عرض جميع الـ Add-ons والبرامج الإضافية</option>
                    <option value="highlights">✨ 3 نقاط مميزة مرقمة (Numbered Highlights)</option>
                    <option value="faq">❓ أسئلة شائعة وأجوبة (FAQ Accordion)</option>
                    <option value="booking-form">📋 فورم حجز العميل الأجنبي + Add-ons مباشر</option>
                  </select>
                  <button type="button" class="adm-btn-primary" id="btn-add-page-block" data-page-id="${esc(activePage.id)}">+ إضافة القسم للصفحة</button>
                </div>
              </div>

              <div class="adm-blocks-list">
                ${(activePage.blocks || []).map((blk, bIdx) => `
                  <form class="adm-block-card" data-save-block="${bIdx}" data-page-id="${esc(activePage.id)}">
                    <div class="abc-head">
                      <strong>القسم 0${bIdx + 1}: ${esc(blk.type.toUpperCase())}</strong>
                      <div style="display:flex;gap:8px">
                        <button type="button" class="adm-btn-outline-sm" data-move-block="${bIdx}" data-dir="-1" data-page-id="${esc(activePage.id)}">⬆ للأعلى</button>
                        <button type="button" class="adm-btn-outline-sm" data-move-block="${bIdx}" data-dir="1" data-page-id="${esc(activePage.id)}">⬇ للأسفل</button>
                        <button type="button" class="adm-btn-danger-sm" data-del-block="${bIdx}" data-page-id="${esc(activePage.id)}">حذف القسم ✕</button>
                      </div>
                    </div>

                    ${blk.type === 'editorial' ? `
                      <div class="adm-form-grid">
                        <label>عنوان علوي (Eyebrow)<input type="text" name="eyebrow" value="${esc(blk.eyebrow || '')}"></label>
                        <label>العنوان الرئيسي (Heading)<input type="text" name="heading" value="${esc(blk.heading || '')}"></label>
                        <label class="full-col">النص التفصيلي (Body Text)<textarea name="body" rows="3">${esc(blk.body || '')}</textarea></label>
                        <label>نص الزر (CTA Button Text)<input type="text" name="ctaText" value="${esc(blk.ctaText || '')}"></label>
                        <label>رابط الزر (CTA URL)<input type="text" name="ctaUrl" value="${esc(blk.ctaUrl || 'nile-cruises')}"></label>
                      </div>
                    ` : blk.type === 'programs-showcase' ? `
                      <div class="adm-form-grid">
                        <label>عنوان علوي (Eyebrow)<input type="text" name="eyebrow" value="${esc(blk.eyebrow || 'FEATURED PROGRAMS')}"></label>
                        <label>العنوان الرئيسي (Heading)<input type="text" name="heading" value="${esc(blk.heading || '')}"></label>
                        <label class="full-col">وصف فرعي<input type="text" name="sub" value="${esc(blk.sub || '')}"></label>
                        <div class="full-col">
                          <small style="display:block;margin-bottom:6px;font-weight:700">اختر الكروز والدهبيات التي تظهر في هذا القسم:</small>
                          <div class="adm-checkbox-grid">
                            ${allVessels.map(v => `
                              <label class="adm-chk-item">
                                <input type="checkbox" name="cruiseSlugs" value="${esc(v.slug)}" ${(blk.cruiseSlugs || []).includes(v.slug) ? 'checked' : ''}>
                                <span>${esc(v.title)} (${v.nights}N)</span>
                              </label>
                            `).join('')}
                          </div>
                        </div>
                      </div>
                    ` : blk.type === 'highlights' ? `
                      <div class="adm-form-grid">
                        <label>عنوان علوي<input type="text" name="eyebrow" value="${esc(blk.eyebrow || 'HIGHLIGHTS')}"></label>
                        <label>العنوان الرئيسي<input type="text" name="heading" value="${esc(blk.heading || '')}"></label>
                        <label class="full-col">النقاط المميزة (كل سطر بصيغة: الرقم | العنوان | الوصف)
                          <textarea name="itemsText" rows="4">${esc((blk.items || []).map(i => `${i.num} | ${i.title} | ${i.text}`).join('\n'))}</textarea>
                        </label>
                      </div>
                    ` : blk.type === 'faq' ? `
                      <div class="adm-form-grid">
                        <label>عنوان علوي<input type="text" name="eyebrow" value="${esc(blk.eyebrow || 'FAQ')}"></label>
                        <label>العنوان الرئيسي<input type="text" name="heading" value="${esc(blk.heading || 'Good to know.')}"></label>
                        <label class="full-col">الأسئلة والأجوبة (كل سطر بصيغة: السؤال | الإجابة)
                          <textarea name="faqText" rows="4">${esc((blk.items || []).map(i => `${i.q} | ${i.a}`).join('\n'))}</textarea>
                        </label>
                      </div>
                    ` : `
                      <p style="margin:8px 0;color:#5a707a">هذا القسم يعرض <strong>${blk.type === 'addons-showcase' ? 'شبكة جميع الـ Add-ons والبرامج الإضافية' : 'نموذج حجز البرامج والـ Add-ons الكامل للعميل الأجنبي'}</strong> تلقائياً.</p>
                    `}
                    <div style="display:flex;justify-content:flex-end;margin-top:10px">
                      <button type="submit" class="adm-btn-gold-sm">حفظ القسم ✓</button>
                    </div>
                  </form>
                `).join('')}
              </div>
            </div>
          ` : `<div class="adm-empty">اضغط "+ إنشاء صفحة جديدة" لإضافة أول صفحة مخصصة.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 5. HOMEPAGE & LAYOUT CONTROLLER TAB ====================
  function renderHomepageControllerTab(st) {
    const hc = st.homeConfig || {};
    const sections = hc.sections || [];

    return `
      <div class="adm-section-head">
        <div>
          <h2>التحكم الكامل في الصفحة الرئيسية وأقسامها · Homepage Controller</h2>
          <p>تحكم في نصوص وصورة الهيرو الرئيسي، وحدد أي الأقسام تظهر أو تختفي في الصفحة الرئيسية، ورتبها بالأعلى أو الأسفل.</p>
        </div>
        <a href="#/" target="_blank" class="adm-btn-outline">معاينة الصفحة الرئيسية ↗</a>
      </div>

      <div class="adm-split-workspace" style="grid-template-columns:1fr 1fr">
        <form id="form-save-home-hero" class="adm-card">
          <h3>بانر الصفحة الرئيسية (Homepage Hero)</h3>
          <div class="adm-form-grid">
            <label class="full-col">العنوان العلوي الصغير (Eyebrow)
              <input type="text" name="heroEyebrow" value="${esc(hc.heroEyebrow || '')}">
            </label>
            <label class="full-col">العنوان الرئيسي الكبير (يدعم HTML مثل &lt;em&gt;)
              <input type="text" name="heroTitle" value="${esc(hc.heroTitle || '')}">
            </label>
            <label class="full-col">الوصف الفرعي (Hero Subtitle)
              <textarea name="heroSub" rows="3">${esc(hc.heroSub || '')}</textarea>
            </label>
            <label>نص الزر الأول
              <input type="text" name="primaryBtnText" value="${esc(hc.primaryBtnText || 'Explore the Nile')}">
            </label>
            <label>رابط الزر الأول
              <input type="text" name="primaryBtnUrl" value="${esc(hc.primaryBtnUrl || 'nile-cruises')}">
            </label>
            <label>نص الزر الثاني
              <input type="text" name="secondaryBtnText" value="${esc(hc.secondaryBtnText || 'Make it personal')}">
            </label>
            <label>رابط الزر الثاني
              <input type="text" name="secondaryBtnUrl" value="${esc(hc.secondaryBtnUrl || 'plan-your-journey')}">
            </label>
            <label class="full-col">صورة خلفية الهيرو
              <select name="heroImage">
                ${PRESET_IMAGES.map(([lbl, url]) => `<option value="${url}" ${hc.heroImage === url ? 'selected' : ''}>${lbl}</option>`).join('')}
              </select>
            </label>
            <div class="full-col" style="display:flex;justify-content:flex-end">
              <button type="submit" class="adm-btn-gold">حفظ تعديلات الهيرو ✓</button>
            </div>
          </div>
        </form>

        <div class="adm-card">
          <h3>ترتيب وإظهار/إخفاء أقسام الصفحة الرئيسية</h3>
          <p style="font-size:13px;color:#647882;margin-bottom:16px">رتّب الأقسام أو أخفِ أي قسم لا تريده في الصفحة الرئيسية بضغطة زر:</p>
          <div class="adm-sections-sorter">
            ${sections.map((sec, idx) => `
              <div class="adm-sec-item ${sec.enabled !== false ? 'on' : 'off'}">
                <label class="adm-switch">
                  <input type="checkbox" data-toggle-homesec="${idx}" ${sec.enabled !== false ? 'checked' : ''}>
                  <strong>0${idx + 1}. ${esc(sec.label)}</strong>
                </label>
                <div class="asi-btns">
                  <button type="button" class="adm-btn-outline-sm" data-move-homesec="${idx}" data-dir="-1">⬆</button>
                  <button type="button" class="adm-btn-outline-sm" data-move-homesec="${idx}" data-dir="1">⬇</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==================== 6. SETTINGS & BACKUP TAB ====================
  function renderSettingsTab(st) {
    const s = st.settings || {};
    return `
      <div class="adm-section-head">
        <div>
          <h2>إعدادات الموقع العامة والنسخ الاحتياطي · Site Settings</h2>
          <p>تحكم في اسم العلامة التجارية، العملة، بيانات التواصل، واستعادة الإعدادات الافتراضية.</p>
        </div>
      </div>

      <div class="adm-split-workspace" style="grid-template-columns:1fr 1fr">
        <form id="form-save-settings" class="adm-card">
          <h3>بيانات الهوية والتواصل</h3>
          <div class="adm-form-grid">
            <label>اسم الموقع (Brand Name)
              <input type="text" name="brandName" value="${esc(s.brandName || 'NileTrails')}">
            </label>
            <label>الشعار النصي (Tagline)
              <input type="text" name="tagline" value="${esc(s.tagline || '')}">
            </label>
            <label>رمز العملة (Currency Symbol)
              <select name="currencySymbol">
                <option value="$" ${s.currencySymbol === '$' ? 'selected' : ''}>$ (USD)</option>
                <option value="€" ${s.currencySymbol === '€' ? 'selected' : ''}>€ (EUR)</option>
                <option value="£" ${s.currencySymbol === '£' ? 'selected' : ''}>£ (GBP)</option>
              </select>
            </label>
            <label>البريد الإلكتروني للتواصل
              <input type="email" name="contactEmail" value="${esc(s.contactEmail || '')}">
            </label>
            <label>رقم الهاتف / واتساب
              <input type="text" name="contactPhone" value="${esc(s.contactPhone || '')}">
            </label>
            <label class="full-col adm-switch" style="margin-top:12px">
              <input type="checkbox" name="showAdminBar" ${s.showAdminBar !== false ? 'checked' : ''}>
              <span>إظهار زر الوصول السريع للوحة التحكم أسفل الموقع</span>
            </label>
            <div class="full-col" style="display:flex;justify-content:flex-end">
              <button type="submit" class="adm-btn-gold">حفظ الإعدادات ✓</button>
            </div>
          </div>
        </form>

        <div class="adm-card">
          <h3>النسخ الاحتياطي واستعادة الضبط</h3>
          <p style="font-size:13px;color:#647882">جميع التعديلات والصفحات والبرامج والحجوزات محفوظة تلقائياً على السيرفر (<code>data/cms.json</code>) وفي المتصفح.</p>
          <div style="display:flex;flex-direction:column;gap:14px;margin-top:20px">
            <button type="button" class="adm-btn-outline" id="btn-export-cms">⬇ تحميل نسخة احتياطية كاملة (Export JSON)</button>
            <button type="button" class="adm-btn-danger-sm" id="btn-reset-cms" style="padding:14px">↺ استعادة البيانات الافتراضية للموقع (Reset to Default)</button>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== 7. SIGHTSEEING & NUBIAN AND THE NILE TAB ====================
  function renderSightseeingTab(st) {
    const places = st.sightseeingPlaces || [];
    return `
      <div class="adm-section-head">
        <div>
          <h2>إدارة المزارات السياحية وقسم Nubian and the Nile (${places.length} مزار)</h2>
          <p>تحكم في الـ 15 مزاراً سياحياً (Main places to visit during a Nile cruise) التي تظهر داخل كل برنامج كروز تحت قسم <strong>Sightseeing with Tour Guide</strong> وفي صفحة <strong>Beyond the Nile → Nubian and the Nile</strong>.</p>
        </div>
        <div style="display:flex;gap:10px">
          <a href="#/beyond-the-nile/nubian-and-the-nile" class="adm-btn-outline-sm" target="_blank">معاينة صفحة Nubian & the Nile ↗</a>
          <button type="button" class="adm-btn-primary" id="btn-add-sight">+ إضافة مزار سياحي جديد</button>
        </div>
      </div>

      <div class="adm-addons-grid">
        ${places.map((pl, idx) => `
          <form class="adm-card adm-sight-form" data-sight-idx="${idx}">
            <div class="adm-card-head">
              <span class="prog-pill-gold">📍 ${esc(pl.location)}</span>
              <div style="display:flex;gap:8px;align-items:center">
                <a href="#/beyond-the-nile/nubian-and-the-nile/${esc(pl.slug)}" class="adm-btn-outline-sm" target="_blank">معاينة الصفحة ↗</a>
                <button type="button" class="adm-btn-danger-sm" data-delete-sight="${idx}">حذف ✕</button>
              </div>
            </div>
            <div class="adm-form-grid">
              <label>اسم المزار / الرحلة (Place to Visit) *
                <input type="text" name="title" value="${esc(pl.title)}" required>
              </label>
              <label>المنطقة / الموقع (Location) *
                <input type="text" name="location" value="${esc(pl.location)}" placeholder="Luxor – East Bank / Aswan / Esna..." required>
              </label>
              <label>السعر مع المرشد السياحي بالدولار (Price USD)
                <input type="number" name="price" value="${Number(pl.price) || 55}">
              </label>
              <label>مدة الزيارة (Duration)
                <input type="text" name="duration" value="${esc(pl.duration || '2.5 Hours')}">
              </label>
              <label class="full-col">رابط صورة المزار (Image URL)
                <input type="text" name="image" value="${esc(pl.image)}">
              </label>
              <label class="full-col">تعريف صغير / Highlights (يظهر في الكارت والجدول)
                <input type="text" name="highlights" value="${esc(pl.highlights)}">
              </label>
              <label class="full-col">الشرح الكامل للمزار والرحلة (يظهر عند الضغط على See More)
                <textarea name="fullOverview" rows="3">${esc(pl.fullOverview || pl.shortDesc || pl.highlights)}</textarea>
              </label>
              <div class="full-col adm-toggles-row">
                <label class="adm-switch">
                  <input type="checkbox" name="enabled" ${pl.enabled !== false ? 'checked' : ''}>
                  <span>مفعّل ويظهر في البرامج وفي قسم Nubian and the Nile</span>
                </label>
                <button type="submit" class="adm-btn-gold-sm">حفظ تعديل المزار ✓</button>
              </div>
            </div>
          </form>
        `).join('')}
      </div>
    `;
  }

  function renderAdmin(containerSelector = '#app') {
    const container = $(containerSelector);
    if (!container) return;
    const st = CMS.getState();
    const newBookings = (st.enquiries || []).filter(e => e.status === 'New').length;

    container.innerHTML = `
      <div class="admin-shell" dir="rtl">
        <header class="admin-topbar">
          <div class="atb-brand">
            <span class="atb-badge">NILETRAILS CMS</span>
            <h1>لوحة التحكم الكاملة للموقع · Admin Control Panel</h1>
          </div>
          <div class="atb-actions">
            <a href="#/beyond-the-nile/nubian-and-the-nile" class="adm-btn-outline-sm" style="color:#fff;border-color:rgba(255,255,255,.3)">🏛 صفحة Nubian & the Nile</a>
            <a href="#/" class="adm-btn-gold-sm">🌐 عرض الموقع الحي (View Live Site) ↗</a>
          </div>
        </header>

        <nav class="admin-tabs-nav" aria-label="أقسام لوحة التحكم">
          <button type="button" class="adm-tab-btn ${activeTab === 'bookings' ? 'active' : ''}" data-adm-tab="bookings">
            📋 حجوزات العملاء (${(st.enquiries || []).length}) ${newBookings ? `<span class="adm-notif">${newBookings}</span>` : ''}
          </button>
          <button type="button" class="adm-tab-btn ${activeTab === 'cruises' ? 'active' : ''}" data-adm-tab="cruises">
            🚢 الكروز والدهبيات والبرامج (${(st.cruises || []).length + (st.dahabiyas || []).length})
          </button>
          <button type="button" class="adm-tab-btn ${activeTab === 'sightseeing' ? 'active' : ''}" data-adm-tab="sightseeing">
            🏛 المزارات و Nubian & Nile (${(st.sightseeingPlaces || []).length})
          </button>
          <button type="button" class="adm-tab-btn ${activeTab === 'addons' ? 'active' : ''}" data-adm-tab="addons">
            ➕ الـ Add-ons والبرامج الملحقة (${(st.addons || []).length})
          </button>
          <button type="button" class="adm-tab-btn ${activeTab === 'pages' ? 'active' : ''}" data-adm-tab="pages">
            📄 إدارة وبناء الصفحات (${(st.customPages || []).length})
          </button>
          <button type="button" class="adm-tab-btn ${activeTab === 'homepage' ? 'active' : ''}" data-adm-tab="homepage">
            🏠 التحكم في الصفحة الرئيسية
          </button>
          <button type="button" class="adm-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-adm-tab="settings">
            ⚙ الإعدادات والنسخ الاحتياطي
          </button>
        </nav>

        <main class="admin-main-body">
          ${activeTab === 'bookings' ? renderBookingsTab(st) : ''}
          ${activeTab === 'cruises' ? renderCruisesAndProgramsTab(st) : ''}
          ${activeTab === 'sightseeing' ? renderSightseeingTab(st) : ''}
          ${activeTab === 'addons' ? renderAddonsTab(st) : ''}
          ${activeTab === 'pages' ? renderPagesBuilderTab(st) : ''}
          ${activeTab === 'homepage' ? renderHomepageControllerTab(st) : ''}
          ${activeTab === 'settings' ? renderSettingsTab(st) : ''}
        </main>
      </div>
    `;

    bindAdminEvents(containerSelector);
  }

  function bindAdminEvents(containerSelector) {
    const st = CMS.getState();

    // Tab switching
    $$('[data-adm-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.admTab;
        editingProgramContext = null;
        renderAdmin(containerSelector);
      });
    });

    // 1. Bookings events
    $$('[data-eq-status]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const idx = Number(sel.dataset.eqStatus);
        if (st.enquiries[idx]) {
          st.enquiries[idx].status = sel.value;
          await CMS.save();
          showToast('تم تحديث حالة الحجز');
          renderAdmin(containerSelector);
        }
      });
    });

    $$('[data-eq-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.eqDelete);
        st.enquiries.splice(idx, 1);
        await CMS.save();
        showToast('تم حذف الطلب');
        renderAdmin(containerSelector);
      });
    });

    // 2. Cruises & Programs events
    $$('[data-select-vessel]').forEach(item => {
      item.addEventListener('click', () => {
        selectedVesselId = item.dataset.selectVessel;
        editingProgramContext = null;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-add-vessel')?.addEventListener('click', async () => {
      const newSlug = 'custom-nile-cruise-' + Math.floor(100 + Math.random() * 900);
      const newVessel = {
        id: 'vessel-' + Date.now(),
        slug: newSlug,
        title: 'New Luxury Nile Cruise',
        tier: 'Luxury',
        route: 'Luxor → Aswan',
        nights: 4,
        image: 'assets/nile-cruise.webp',
        tag: 'Bespoke Voyage',
        kind: 'cruise',
        sub: 'Tailored Nile sailing with curated programs and private guided excursions.',
        enabled: true,
        showOnHome: true,
        programs: [
          {
            id: newSlug + '-prog-1',
            slug: 'classic-program',
            title: '4-Night Classic Luxor to Aswan Program',
            badge: 'Featured Program',
            duration: '5 Days / 4 Nights',
            nights: 4,
            route: 'Luxor → Edfu → Kom Ombo → Aswan',
            departureDays: 'Every Monday & Saturday',
            basePrice: 950,
            summary: 'Full-board luxury cruise program with private Egyptologist guide and temple visits.',
            canBeAddonForOthers: false,
            allowedAddonIds: ['ALL'],
            highlights: ['Private airport transfers', 'Full-board gourmet dining', 'Guided temple excursions'],
            included: ['4 nights accommodation onboard', 'All temple entry tickets', 'Private Egyptologist guide'],
            excluded: ['International flights', 'Personal expenses'],
            cabins: [
              { id: 'deluxe', name: 'Deluxe River-View Cabin', priceDelta: 0, desc: 'Panoramic window' },
              { id: 'suite', name: 'Royal Suite', priceDelta: 400, desc: 'Private balcony & lounge' }
            ],
            itinerary: [
              { day: 'Day 01', title: 'Embarkation in Luxor & Karnak Temple', desc: 'Transfer to vessel, welcome lunch and afternoon tour of Karnak and Luxor Temples.' },
              { day: 'Day 02', title: 'Valley of the Kings & Sailing to Edfu', desc: 'Explore the West Bank royal tombs before sailing south.' },
              { day: 'Day 03', title: 'Edfu & Kom Ombo Temples', desc: 'Visit Horus Temple at Edfu and sunset at Kom Ombo.' },
              { day: 'Day 04', title: 'Aswan, Philae Island & Felucca Sail', desc: 'Visit Philae Temple and sail by felucca around Elephantine Island.' },
              { day: 'Day 05', title: 'Disembarkation in Aswan', desc: 'Breakfast onboard and private transfer to airport or your chosen Add-on Program.' }
            ]
          }
        ]
      };
      st.cruises.unshift(newVessel);
      selectedVesselId = newVessel.id;
      await CMS.save();
      showToast('تم إضافة كروز جديد مع برنامج افتراضي');
      renderAdmin(containerSelector);
    });

    $('#form-save-vessel')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const vid = fd.get('vesselId');
      const oldKey = fd.get('listKey');
      const newKind = fd.get('kind');
      const newKey = newKind === 'dahabiya' ? 'dahabiyas' : 'cruises';

      let list = st[oldKey] || [];
      let idx = list.findIndex(v => (v.id || v.slug) === vid);
      if (idx === -1) return;

      const updated = {
        ...list[idx],
        title: fd.get('title'),
        slug: slugify(fd.get('slug')),
        kind: newKind,
        tier: fd.get('tier'),
        nights: Number(fd.get('nights')) || 4,
        route: fd.get('route'),
        tag: fd.get('tag'),
        image: fd.get('image') || 'assets/nile-cruise.webp',
        heroVideo: fd.get('heroVideo') || 'assets/videos/hero-cruise-1.mp4',
        facilities: String(fd.get('facilities') || '').split('\n').map(s => s.trim()).filter(Boolean),
        sub: fd.get('sub'),
        enabled: fd.get('enabled') === 'on',
        showOnHome: fd.get('showOnHome') === 'on'
      };

      if (oldKey !== newKey) {
        list.splice(idx, 1);
        st[newKey].unshift(updated);
      } else {
        list[idx] = updated;
      }

      await CMS.save();
      showToast('تم حفظ بيانات الكروز بنجاح');
      renderAdmin(containerSelector);
    });

    $$('[data-delete-vessel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vid = btn.dataset.deleteVessel;
        const key = btn.dataset.vesselKey;
        st[key] = (st[key] || []).filter(v => (v.id || v.slug) !== vid);
        selectedVesselId = null;
        await CMS.save();
        showToast('تم حذف الكروز');
        renderAdmin(containerSelector);
      });
    });

    // Add Program inside Vessel
    $('#btn-add-program')?.addEventListener('click', async (e) => {
      const vid = e.currentTarget.dataset.vesselId;
      const key = e.currentTarget.dataset.listKey;
      const vessel = (st[key] || []).find(v => (v.id || v.slug) === vid);
      if (!vessel) return;
      if (!Array.isArray(vessel.programs)) vessel.programs = [];

      const newProg = {
        id: 'prog-' + Date.now(),
        slug: 'custom-program-' + (vessel.programs.length + 1),
        title: `New ${vessel.nights}-Night Tailored Sailing Program`,
        badge: 'New Program',
        duration: `${vessel.nights + 1} Days / ${vessel.nights} Nights`,
        nights: vessel.nights,
        route: vessel.route,
        departureDays: 'Flexible Departures',
        basePrice: 890,
        summary: 'Complete sailing program with private guided excursions, temple entry tickets and airport transfers.',
        canBeAddonForOthers: false,
        allowedAddonIds: ['ALL'],
        highlights: ['Private airport transfers', 'Full-board dining', 'Certified Egyptologist guide'],
        included: ['Full-board cabin accommodation', 'All listed temple visits & tickets', 'Private transfers'],
        excluded: ['International flights', 'Gratuities'],
        cabins: [
          { id: 'deluxe', name: 'Deluxe River-View Cabin', priceDelta: 0, desc: 'Panoramic window' },
          { id: 'suite', name: 'Royal Suite', priceDelta: 380, desc: 'Spacious suite' }
        ],
        itinerary: [
          { day: 'Day 01', title: 'Embarkation & Welcome Temple Visit', desc: 'Airport pickup, embarkation and guided afternoon temple visit.' },
          { day: 'Day 02', title: 'Sailing the Nile & Ancient Monuments', desc: 'Guided visit to the royal tombs and scenic river sailing.' },
          { day: 'Day 03', title: 'Riverside Temples & Disembarkation', desc: 'Final temple visit and private transfer to your next destination.' }
        ]
      };

      vessel.programs.push(newProg);
      editingProgramContext = { vesselId: vid, programId: newProg.id };
      await CMS.save();
      showToast('تم إنشاء برنامج جديد — يمكنك تعديل تفاصيله الآن');
      renderAdmin(containerSelector);
    });

    $$('[data-edit-prog]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingProgramContext = {
          vesselId: btn.dataset.vesselId,
          programId: btn.dataset.editProg
        };
        renderAdmin(containerSelector);
      });
    });

    $$('[data-delete-prog]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vid = btn.dataset.vesselId;
        const pid = btn.dataset.deleteProg;
        const key = btn.dataset.listKey;
        const vessel = (st[key] || []).find(v => (v.id || v.slug) === vid);
        if (vessel && Array.isArray(vessel.programs)) {
          vessel.programs = vessel.programs.filter(p => p.id !== pid);
          await CMS.save();
          showToast('تم حذف البرنامج');
          renderAdmin(containerSelector);
        }
      });
    });

    $('#btn-back-to-vessel')?.addEventListener('click', () => {
      editingProgramContext = null;
      renderAdmin(containerSelector);
    });
    $('#btn-cancel-prog')?.addEventListener('click', () => {
      editingProgramContext = null;
      renderAdmin(containerSelector);
    });

    $('#chk-allow-all-addons')?.addEventListener('change', (e) => {
      const box = $('#specific-addons-list');
      if (box) box.style.opacity = e.target.checked ? '0.55' : '1';
    });

    $('#form-save-program')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!editingProgramContext) return;
      const allVessels = [...(st.cruises || []), ...(st.dahabiyas || [])];
      const vessel = allVessels.find(v => (v.id || v.slug) === editingProgramContext.vesselId);
      const prog = (vessel?.programs || []).find(p => p.id === editingProgramContext.programId);
      if (!prog) return;

      const fd = new FormData(e.target);
      prog.title = fd.get('title');
      prog.tabLabel = fd.get('tabLabel') || (fd.get('nights') + ' Nights');
      prog.tabSub = fd.get('tabSub') || fd.get('route');
      prog.slug = slugify(fd.get('slug'));
      prog.badge = fd.get('badge');
      prog.duration = fd.get('duration');
      prog.nights = Number(fd.get('nights')) || 4;
      prog.route = fd.get('route');
      prog.departureDays = fd.get('departureDays');
      prog.basePrice = Number(fd.get('basePrice')) || 890;
      prog.heroVideo = fd.get('heroVideo') || vessel.heroVideo || 'assets/videos/hero-cruise-1.mp4';
      prog.summary = fd.get('summary');
      prog.facilities = String(fd.get('facilities') || '').split('\n').map(s => s.trim()).filter(Boolean);
      prog.highlights = String(fd.get('highlights') || '').split('\n').map(s => s.trim()).filter(Boolean);
      prog.included = String(fd.get('included') || '').split('\n').map(s => s.trim()).filter(Boolean);
      prog.excluded = String(fd.get('excluded') || '').split('\n').map(s => s.trim()).filter(Boolean);

      prog.itinerary = String(fd.get('itineraryText') || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, i) => {
          const parts = line.split('|').map(s => s.trim());
          return {
            day: parts[0] || `Day ${i + 1}`,
            title: parts[1] || 'Nile Experience',
            desc: parts[2] || parts[1] || '',
            meals: parts[3] || 'Breakfast · Lunch · Dinner'
          };
        });

      prog.cabins = String(fd.get('cabinsText') || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, i) => {
          const parts = line.split('|').map(s => s.trim());
          return {
            id: 'cabin-' + (i + 1),
            name: parts[0] || 'Deluxe Cabin',
            priceDelta: Number(parts[1]) || 0,
            desc: parts[2] || ''
          };
        });

      prog.canBeAddonForOthers = fd.get('canBeAddonForOthers') === 'on';
      if (fd.get('allowAllAddons') === 'on') {
        prog.allowedAddonIds = ['ALL'];
      } else {
        prog.allowedAddonIds = fd.getAll('allowedAddonIds');
      }

      editingProgramContext = null;
      await CMS.save();
      showToast('تم حفظ البرنامج بنجاح');
      renderAdmin(containerSelector);
    });

    // 2.5 Sightseeing & Nubian and the Nile events
    $('#btn-add-sight')?.addEventListener('click', async () => {
      if (!Array.isArray(st.sightseeingPlaces)) st.sightseeingPlaces = [];
      st.sightseeingPlaces.unshift({
        id: 'sight-' + Date.now(),
        slug: 'custom-sightseeing-' + Math.floor(100 + Math.random() * 900),
        location: 'Aswan Nuba',
        title: 'New Guided Sightseeing Excursion',
        highlights: 'Guided visit with licensed private Egyptologist, entry tickets and private transfers.',
        shortDesc: 'Guided visit with licensed private Egyptologist, entry tickets and private transfers.',
        fullOverview: 'Experience this historic Nile monument with your personal licensed Egyptologist guide, private air-conditioned transfers and official entrance tickets included.',
        duration: '3 Hours',
        price: 55,
        priceUnit: 'per person',
        image: 'assets/egypt-temple.webp',
        enabled: true,
        canAddToJourney: true
      });
      await CMS.save();
      showToast('تم إضافة مزار سياحي جديد');
      renderAdmin(containerSelector);
    });

    $$('.adm-sight-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idx = Number(form.dataset.sightIdx);
        const fd = new FormData(form);
        if (st.sightseeingPlaces && st.sightseeingPlaces[idx]) {
          st.sightseeingPlaces[idx] = {
            ...st.sightseeingPlaces[idx],
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
          await CMS.save();
          showToast('تم حفظ تعديل المزار السياحي');
          renderAdmin(containerSelector);
        }
      });
    });

    $$('[data-delete-sight]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.deleteSight);
        if (st.sightseeingPlaces) {
          st.sightseeingPlaces.splice(idx, 1);
          await CMS.save();
          showToast('تم حذف المزار السياحي');
          renderAdmin(containerSelector);
        }
      });
    });

    // 3. Add-ons events
    $('#btn-add-addon')?.addEventListener('click', async () => {
      st.addons.unshift({
        id: 'addon-' + Date.now(),
        title: 'New Program Extension / Add-on',
        type: 'program-extension',
        category: 'Other Program Extension',
        duration: '+2 Days / 1 Night',
        price: 290,
        priceUnit: 'per person',
        image: 'assets/egypt-temple.webp',
        summary: 'Private guided extension program with transfers and accommodation included.',
        enabled: true,
        showOnHome: true
      });
      await CMS.save();
      showToast('تم إضافة Add-on جديد');
      renderAdmin(containerSelector);
    });

    $$('.adm-addon-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idx = Number(form.dataset.addonIdx);
        const fd = new FormData(form);
        if (st.addons[idx]) {
          st.addons[idx] = {
            ...st.addons[idx],
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
          await CMS.save();
          showToast('تم حفظ تعديلات الـ Add-on');
          renderAdmin(containerSelector);
        }
      });
    });

    $$('[data-delete-addon]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.deleteAddon);
        st.addons.splice(idx, 1);
        await CMS.save();
        showToast('تم حذف الـ Add-on');
        renderAdmin(containerSelector);
      });
    });

    // 4. Custom Pages Builder events
    $$('[data-select-page]').forEach(item => {
      item.addEventListener('click', () => {
        editingPageId = item.dataset.selectPage;
        renderAdmin(containerSelector);
      });
    });

    $('#btn-create-new-page')?.addEventListener('click', async () => {
      const slug = 'special-egypt-collection-' + Math.floor(10 + Math.random() * 89);
      const newPage = {
        id: 'page-' + Date.now(),
        slug: slug,
        title: 'New Custom Experience Page',
        eyebrow: 'BESPOKE COLLECTION',
        subtitle: 'A custom page created from the Admin Dashboard with curated programs and booking options.',
        heroImage: 'assets/nile-sailing.webp',
        enabled: true,
        showOnHome: true,
        homeCardTag: 'Featured Page',
        showInNavbar: true,
        navParent: 'top',
        showInFooter: true,
        blocks: [
          {
            id: 'blk-' + Date.now() + '-1',
            type: 'editorial',
            eyebrow: 'WELCOME',
            heading: 'Crafted around <em>your vision.</em>',
            body: 'You can edit this text, add cruise programs, showcase add-ons, or embed a booking form directly from the Admin Control Panel.',
            ctaText: 'Explore Nile Cruises',
            ctaUrl: 'nile-cruises'
          },
          {
            id: 'blk-' + Date.now() + '-2',
            type: 'programs-showcase',
            eyebrow: 'CURATED CRUISES & PROGRAMS',
            heading: 'Select your <em>sailing program.</em>',
            sub: 'Each cruise features customizable programs and add-on extensions.',
            cruiseSlugs: ['luxury-nile-cruise-4-nights', 'luxury-dahabiya-sailing']
          },
          {
            id: 'blk-' + Date.now() + '-3',
            type: 'booking-form'
          }
        ]
      };
      if (!Array.isArray(st.customPages)) st.customPages = [];
      st.customPages.unshift(newPage);
      editingPageId = newPage.id;
      await CMS.save();
      showToast('تم إنشاء صفحة جديدة وتفعيلها في الرئيسية والقائمة العلوية!');
      renderAdmin(containerSelector);
    });

    $('#form-save-custom-page')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pid = fd.get('pageId');
      const pg = (st.customPages || []).find(p => p.id === pid);
      if (!pg) return;

      pg.title = fd.get('title');
      pg.slug = slugify(fd.get('slug'));
      pg.eyebrow = fd.get('eyebrow');
      pg.heroImage = fd.get('heroImage');
      pg.subtitle = fd.get('subtitle');
      pg.enabled = fd.get('enabled') === 'on';
      pg.showOnHome = fd.get('showOnHome') === 'on';
      pg.showInNavbar = fd.get('showInNavbar') === 'on';
      pg.showInFooter = fd.get('showInFooter') === 'on';
      pg.navParent = fd.get('navParent') || 'top';
      pg.homeCardTag = fd.get('homeCardTag') || 'Special Collection';

      await CMS.save();
      showToast('تم حفظ إعدادات الصفحة ومكان ظهورها');
      renderAdmin(containerSelector);
    });

    $$('[data-delete-page]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pid = btn.dataset.deletePage;
        st.customPages = (st.customPages || []).filter(p => p.id !== pid);
        editingPageId = st.customPages[0]?.id || null;
        await CMS.save();
        showToast('تم حذف الصفحة');
        renderAdmin(containerSelector);
      });
    });

    $('#btn-add-page-block')?.addEventListener('click', async (e) => {
      const pid = e.currentTarget.dataset.pageId;
      const pg = (st.customPages || []).find(p => p.id === pid);
      if (!pg) return;
      const type = $('#sel-new-block-type')?.value || 'editorial';
      if (!Array.isArray(pg.blocks)) pg.blocks = [];

      const defaultsByType = {
        editorial: { id: 'blk-' + Date.now(), type: 'editorial', eyebrow: 'SECTION', heading: 'Discover more <em>along the Nile.</em>', body: 'Write your custom editorial content here.', ctaText: 'Explore Cruises', ctaUrl: 'nile-cruises' },
        'programs-showcase': { id: 'blk-' + Date.now(), type: 'programs-showcase', eyebrow: 'CRUISES & PROGRAMS', heading: 'Featured <em>Sailing Programs.</em>', sub: 'Click any vessel to view its programs and add-ons.', cruiseSlugs: ['luxury-nile-cruise-4-nights', 'deluxe-nile-cruise-3-nights', 'luxury-dahabiya-sailing'] },
        'addons-showcase': { id: 'blk-' + Date.now(), type: 'addons-showcase', eyebrow: 'ENHANCE YOUR TRIP', heading: 'Optional Add-ons & <em>Extensions.</em>', sub: 'Available when booking any program.' },
        highlights: { id: 'blk-' + Date.now(), type: 'highlights', eyebrow: 'KEY FEATURES', heading: 'Why travellers <em>choose this.</em>', items: [{ num: '01', title: 'Private Egyptologist', text: 'Dedicated guide throughout your trip.' }, { num: '02', title: 'Flexible Add-ons', text: 'Combine Cairo, Abu Simbel and Red Sea.' }, { num: '03', title: 'VIP Transfers', text: 'Seamless airport meet-and-assist.' }] },
        faq: { id: 'blk-' + Date.now(), type: 'faq', eyebrow: 'QUESTIONS', heading: 'Frequently Asked <em>Questions.</em>', items: [{ q: 'Can I add Cairo or Abu Simbel to this program?', a: 'Yes, you can select any extension add-on directly in the booking form.' }, { q: 'How do I confirm my cabin?', a: 'Submit the reservation form and our concierge confirms availability within 2 hours.' }] },
        'booking-form': { id: 'blk-' + Date.now(), type: 'booking-form' }
      };

      pg.blocks.push(defaultsByType[type]);
      await CMS.save();
      showToast('تم إضافة قسم جديد داخل الصفحة');
      renderAdmin(containerSelector);
    });

    $$('[data-save-block]').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bIdx = Number(form.dataset.saveBlock);
        const pid = form.dataset.pageId;
        const pg = (st.customPages || []).find(p => p.id === pid);
        const blk = pg?.blocks?.[bIdx];
        if (!blk) return;

        const fd = new FormData(form);
        if (blk.type === 'editorial') {
          blk.eyebrow = fd.get('eyebrow');
          blk.heading = fd.get('heading');
          blk.body = fd.get('body');
          blk.ctaText = fd.get('ctaText');
          blk.ctaUrl = fd.get('ctaUrl');
        } else if (blk.type === 'programs-showcase') {
          blk.eyebrow = fd.get('eyebrow');
          blk.heading = fd.get('heading');
          blk.sub = fd.get('sub');
          blk.cruiseSlugs = fd.getAll('cruiseSlugs');
        } else if (blk.type === 'highlights') {
          blk.eyebrow = fd.get('eyebrow');
          blk.heading = fd.get('heading');
          blk.items = String(fd.get('itemsText') || '').split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
            const p = l.split('|').map(s => s.trim());
            return { num: p[0] || `0${i + 1}`, title: p[1] || 'Highlight', text: p[2] || '' };
          });
        } else if (blk.type === 'faq') {
          blk.eyebrow = fd.get('eyebrow');
          blk.heading = fd.get('heading');
          blk.items = String(fd.get('faqText') || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
            const p = l.split('|').map(s => s.trim());
            return { q: p[0] || 'Question', a: p[1] || '' };
          });
        }

        await CMS.save();
        showToast('تم حفظ محتوى القسم');
        renderAdmin(containerSelector);
      });
    });

    $$('[data-move-block]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.moveBlock);
        const dir = Number(btn.dataset.dir);
        const pid = btn.dataset.pageId;
        const pg = (st.customPages || []).find(p => p.id === pid);
        if (!pg || !pg.blocks) return;
        const target = idx + dir;
        if (target < 0 || target >= pg.blocks.length) return;
        const temp = pg.blocks[idx];
        pg.blocks[idx] = pg.blocks[target];
        pg.blocks[target] = temp;
        await CMS.save();
        renderAdmin(containerSelector);
      });
    });

    $$('[data-del-block]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.delBlock);
        const pid = btn.dataset.pageId;
        const pg = (st.customPages || []).find(p => p.id === pid);
        if (!pg || !pg.blocks) return;
        pg.blocks.splice(idx, 1);
        await CMS.save();
        showToast('تم حذف القسم من الصفحة');
        renderAdmin(containerSelector);
      });
    });

    // 5. Homepage Controller events
    $('#form-save-home-hero')?.addEventListener('submit', async (e) => {
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
        heroImage: fd.get('heroImage')
      };
      await CMS.save();
      showToast('تم حفظ بانر الصفحة الرئيسية');
    });

    $$('[data-toggle-homesec]').forEach(chk => {
      chk.addEventListener('change', async () => {
        const idx = Number(chk.dataset.toggleHomesec);
        if (st.homeConfig?.sections?.[idx]) {
          st.homeConfig.sections[idx].enabled = chk.checked;
          await CMS.save();
          showToast('تم تحديث أقسام الصفحة الرئيسية');
          renderAdmin(containerSelector);
        }
      });
    });

    $$('[data-move-homesec]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.moveHomesec);
        const dir = Number(btn.dataset.dir);
        const secs = st.homeConfig?.sections;
        if (!secs) return;
        const target = idx + dir;
        if (target < 0 || target >= secs.length) return;
        const temp = secs[idx];
        secs[idx] = secs[target];
        secs[target] = temp;
        await CMS.save();
        showToast('تم تغيير ترتيب القسم في الصفحة الرئيسية');
        renderAdmin(containerSelector);
      });
    });

    // 6. Settings events
    $('#form-save-settings')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      st.settings = {
        ...st.settings,
        brandName: fd.get('brandName'),
        tagline: fd.get('tagline'),
        currencySymbol: fd.get('currencySymbol'),
        contactEmail: fd.get('contactEmail'),
        contactPhone: fd.get('contactPhone'),
        showAdminBar: fd.get('showAdminBar') === 'on'
      };
      await CMS.save();
      showToast('تم حفظ الإعدادات العامة');
    });

    $('#btn-export-cms')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'niletrails-cms-backup.json';
      a.click();
    });

    $('#btn-reset-cms')?.addEventListener('click', async () => {
      if (confirm('هل أنت متأكد من استعادة البيانات الافتراضية للموقع؟')) {
        await CMS.resetToDefaults();
        showToast('تم استعادة الضبط الافتراضي');
        renderAdmin(containerSelector);
      }
    });
  }

  return { renderAdmin };
})();
