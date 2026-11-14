(() => {
  'use strict';

  const CMS = window.NileTrailsCMS;
  const A = 'assets/';
  const V = 'assets/videos/';
  const IMG = {
    sailing: A + 'nile-sailing.webp',
    temple: A + 'egypt-temple.webp',
    cruise: A + 'nile-cruise.webp'
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const p = s => '#/' + (s || '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const photo = (src, alt, cls = '') => `<img class="${cls}" src="${esc(src || IMG.sailing)}" alt="${esc(alt)}" loading="lazy">`;
  const button = (text, url, cls = 'btn-primary') => `<a href="${p(url)}" class="button ${cls}">${text}<span aria-hidden="true">↗</span></a>`;
  const arrow = (text, url) => `<a class="text-link" href="${p(url)}">${text}<span aria-hidden="true">↗</span></a>`;
  const label = (txt) => `<span class="eyebrow"><span class="eyebrow-mark"></span>${txt}</span>`;
  const bookmark = (slug) => `<button class="save-button" data-save="${esc(slug)}" title="Save to shortlist" aria-label="Save to shortlist"><span aria-hidden="true">♡</span></button>`;

  const WORLD_COUNTRIES = [
    'United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia', 'Italy', 'Spain',
    'Switzerland', 'Netherlands', 'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Ireland',
    'Japan', 'Singapore', 'South Korea', 'Brazil', 'Mexico', 'Argentina', 'India', 'China',
    'New Zealand', 'Portugal', 'Poland', 'Czech Republic', 'Greece', 'United Arab Emirates', 'Saudi Arabia', 'South Africa'
  ];

  const DIAL_CODES = [
    ['+1', 'US/CA +1'], ['+44', 'UK +44'], ['+49', 'DE +49'], ['+33', 'FR +33'],
    ['+39', 'IT +39'], ['+34', 'ES +34'], ['+61', 'AU +61'], ['+41', 'CH +41'],
    ['+31', 'NL +31'], ['+32', 'BE +32'], ['+43', 'AT +43'], ['+46', 'SE +46'],
    ['+47', 'NO +47'], ['+45', 'DK +45'], ['+353', 'IE +353'], ['+81', 'JP +81'],
    ['+65', 'SG +65'], ['+82', 'KR +82'], ['+55', 'BR +55'], ['+52', 'MX +52'],
    ['+91', 'IN +91'], ['+86', 'CN +86'], ['+64', 'NZ +64'], ['+351', 'PT +351'],
    ['+971', 'UAE +971'], ['+966', 'SA +966'], ['+20', 'EG +20'], ['+27', 'ZA +27']
  ];

  // Helper to render silent autoplay looping video background (supports local MP4 or YouTube URL fallback)
  function renderHeroVideoBg(videoSrc, posterImg = IMG.sailing) {
    if (!videoSrc) return '';
    const ytMatch = String(videoSrc).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) {
      const vidId = ytMatch[1];
      return `
        <div class="hero-video-wrap" aria-hidden="true">
          <iframe class="hero-yt-iframe" src="https://www.youtube.com/embed/${vidId}?autoplay=1&mute=1&loop=1&playlist=${vidId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1" frameborder="0" allow="autoplay; encrypted-media" tabindex="-1"></iframe>
        </div>`;
    }
    return `
      <div class="hero-video-wrap" aria-hidden="true">
        <video class="hero-bg-video" autoplay muted loop playsinline preload="auto" poster="${esc(posterImg)}">
          <source src="${esc(videoSrc)}" type="video/mp4">
        </video>
      </div>`;
  }

  function getMenus() {
    const st = CMS.getState();
    const activeCruises = (st.cruises || []).filter(c => c.enabled !== false);
    const activeDahabiyas = (st.dahabiyas || []).filter(d => d.enabled !== false);
    const activeJourneys = (st.journeys || []).filter(j => j.enabled !== false);
    const activeDestinations = (st.destinations || []).filter(d => d.enabled !== false);
    const customPages = (st.customPages || []).filter(cp => cp.enabled !== false && cp.showInNavbar);

    // Ensure "Nubian and the Nile" is prominently first under Beyond the Nile
    const beyondChildren = [
      ['Nubian and the Nile (Sightseeing & Tours)', 'beyond-the-nile/nubian-and-the-nile'],
      ...activeDestinations.filter(d => d.slug !== 'nubian-and-the-nile').map(d => [d.name, 'beyond-the-nile/' + d.slug])
    ];

    const customByParent = {};
    const topCustomMenus = [];
    customPages.forEach(cp => {
      const pageUrl = `page/${cp.slug}`;
      if (cp.navParent === 'top') {
        topCustomMenus.push({
          key: cp.slug,
          name: cp.title,
          url: pageUrl,
          children: [[cp.title, pageUrl]]
        });
      } else {
        const parentKey = cp.navParent || 'about';
        if (!customByParent[parentKey]) customByParent[parentKey] = [];
        customByParent[parentKey].push([cp.title, pageUrl]);
      }
    });

    const baseMenus = [
      {
        key: 'nile-cruises',
        name: 'Nile Cruises',
        url: 'nile-cruises',
        children: [
          ['All Nile Cruises', 'nile-cruises'],
          ['Luxury Cruises', 'nile-cruises?category=luxury'],
          ['Deluxe Cruises', 'nile-cruises?category=deluxe'],
          ...activeCruises.slice(0, 4).map(c => [`${c.title} (${c.nights}N)`, `nile-cruises/${c.slug}`]),
          ...(customByParent['nile-cruises'] || []),
          // Superior Cruises is ALWAYS the last option in Nile Cruises dropdown
          ['Superior Cruises', 'nile-cruises?category=superior']
        ]
      },
      {
        key: 'dahabiyas',
        name: 'Dahabiyas',
        url: 'dahabiyas',
        children: [
          ['Explore Dahabiyas', 'dahabiyas'],
          ['Luxury Sailing', 'dahabiyas?category=luxury'],
          ['Deluxe Traditional', 'dahabiyas?category=deluxe'],
          ['Private Dahabiyas', 'dahabiyas?category=private'],
          ...activeDahabiyas.map(d => [d.title, `dahabiyas/${d.slug}`]),
          ...(customByParent['dahabiyas'] || []),
          // Why Dahabiyas is ALWAYS the last option in Dahabiyas dropdown
          ['Why Dahabiyas', 'dahabiyas/why-sail-by-dahabiya']
        ]
      },
      {
        key: 'journeys',
        name: 'Journeys',
        url: 'journeys',
        children: [
          ...activeJourneys.map(j => [j.name, 'journeys/' + j.slug]),
          ...(customByParent['journeys'] || [])
        ]
      },
      {
        key: 'beyond-the-nile',
        name: 'Beyond the Nile',
        url: 'beyond-the-nile',
        children: [
          ...beyondChildren,
          ...(customByParent['beyond-the-nile'] || [])
        ]
      },
      {
        key: 'nile-stories',
        name: 'Nile Stories',
        url: 'nile-stories',
        children: [
          ['All stories', 'nile-stories'],
          ['Nile Cruise Guide', 'nile-stories?category=nile-cruise-guide'],
          ['Dahabiya Life', 'nile-stories?category=dahabiya-life'],
          ['Travel Tips', 'nile-stories'],
          ...(customByParent['nile-stories'] || [])
        ]
      },
      {
        key: 'about',
        name: 'About',
        url: 'about',
        children: [
          ['Our Story', 'about/our-story'],
          ['Why NileTrails', 'about/why-niletrails'],
          ['Our Team', 'about/our-team'],
          ['Travel Information', 'travel-information'],
          ['Contact', 'contact'],
          ...(customByParent['about'] || [])
        ]
      },
      ...topCustomMenus
    ];

    return baseMenus;
  }

  function header() {
    const st = CMS.getState();
    const menus = getMenus();
    return `<header class="site-header">
      <div class="header-inner wrap">
        <a class="logo" href="${p('')}" aria-label="${esc(st.settings?.brandName || 'NileTrails')} homepage">
          ${photo(A + 'niletrails-logo.png', (st.settings?.brandName || 'NileTrails') + ' — Sailing the Nile')}
        </a>
        <nav class="desktop-nav" aria-label="Main navigation">
          ${menus.map(m => `
            <div class="nav-group">
              <a class="nav-link" href="${p(m.url)}">${esc(m.name)}<span class="chevron">⌄</span></a>
              <div class="mega-menu">
                <div class="menu-overline">Explore ${esc(m.name)}</div>
                ${m.children.map(([title, url]) => `<a href="${p(url)}">${esc(title)}<span>↗</span></a>`).join('')}
              </div>
            </div>
          `).join('')}
        </nav>
        <div class="nav-actions">
          <a href="${p('admin')}" class="nav-admin-pill" title="Open Admin Control Panel">⚙ Admin CMS</a>
          <a href="${p('beyond-the-nile/nubian-and-the-nile')}" class="nav-contact" aria-label="Nubian and the Nile">Nubian & Nile</a>
          <a href="${p('plan-your-journey')}" class="nav-plan">Plan your journey <span>↗</span></a>
          <button type="button" id="menu-toggle" class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>
        </div>
      </div>
      <div class="mobile-panel" id="mobile-panel" hidden>
        <nav aria-label="Mobile navigation">
          ${menus.map(m => `
            <details>
              <summary>${esc(m.name)}<span>+</span></summary>
              <div class="mobile-links">
                <a href="${p(m.url)}">Overview ↗</a>
                ${m.children.map(([n, u]) => `<a href="${p(u)}">${esc(n)}</a>`).join('')}
              </div>
            </details>
          `).join('')}
          <a class="mobile-contact" href="${p('admin')}" style="background:#bd9867;color:#092434">⚙ لوحة التحكم (Admin Dashboard)</a>
          <a class="mobile-contact" href="${p('plan-your-journey')}">Plan Your Journey ↗</a>
        </nav>
      </div>
    </header>`;
  }

  function footer() {
    const st = CMS.getState();
    const footerCustomPages = (st.customPages || []).filter(cp => cp.enabled !== false && cp.showInFooter);
    const bookingsCount = (st.enquiries || []).length;

    return `<footer class="site-footer">
      <div class="wrap">
        <div class="footer-pre">
          <span>THE NEXT CHAPTER IS YOURS</span>
          <h2>Let the river lead <em>the way.</em></h2>
          ${button('Design your journey', 'plan-your-journey', 'btn-light')}
        </div>
        <div class="footer-grid">
          <div class="footer-intro">
            <div class="footer-logo">${photo(A + 'niletrails-logo.png', st.settings?.brandName || 'NileTrails')}</div>
            <p>Thoughtful Nile cruises, curated sailing programs, traditional dahabiya vessels and guided sightseeing through Egypt.</p>
            <small>${esc(st.settings?.tagline || 'SAILING THE NILE · DISCOVERING EGYPT')}</small>
          </div>
          <div>
            <h4>DISCOVER</h4>
            <a href="${p('nile-cruises')}">Nile Cruises & Programs</a>
            <a href="${p('dahabiyas')}">Dahabiyas</a>
            <a href="${p('beyond-the-nile/nubian-and-the-nile')}">Nubian & the Nile (15 Places)</a>
            <a href="${p('journeys')}">Journeys</a>
            <a href="${p('beyond-the-nile')}">Beyond the Nile</a>
            ${footerCustomPages.map(cp => `<a href="${p('page/' + cp.slug)}">${esc(cp.title)}</a>`).join('')}
          </div>
          <div>
            <h4>EXPLORE MORE</h4>
            <a href="${p('nile-stories')}">Nile Stories</a>
            <a href="${p('about')}">About Us</a>
            <a href="${p('travel-information')}">Travel Information</a>
            <a href="${p('contact')}">Contact</a>
            <a href="${p('admin')}" style="color:#e2bd84;font-weight:700">⚙ Admin Control Panel (${bookingsCount})</a>
          </div>
          <div>
            <h4>START A CONVERSATION</h4>
            <p>No journey is exactly the same. Select a cruise program, add guided sightseeing & extensions, or tell us what you have in mind.</p>
            ${st.settings?.contactEmail ? `<p style="font-size:12px;color:#dfbc87;margin-bottom:6px">✉ ${esc(st.settings.contactEmail)}</p>` : ''}
            ${arrow('Send an enquiry', 'contact')}
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${esc(st.settings?.brandName || 'NileTrails')}. All rights reserved.</span>
          <span>
            <a href="${p('privacy-policy')}">Privacy</a>
            <a href="${p('terms-and-conditions')}">Terms</a>
            <a href="${p('admin')}">Admin CMS</a>
            <span class="footer-mark">MADE TO EXPLORE</span>
          </span>
        </div>
      </div>
    </footer>
    ${st.settings?.showAdminBar !== false ? `
      <div class="floating-admin-bar" role="region" aria-label="Admin Quick Access">
        <a href="${p('admin')}" class="fab-admin-btn">
          <span class="fab-dot"></span>
          <span>لوحة التحكم · Admin CMS</span>
          <small>${bookingsCount} Bookings</small>
        </a>
      </div>
    ` : ''}`;
  }

  function sectionTitle(over, title, sub, action = '') {
    return `<div class="section-header"><div>${label(over)}<h2>${title}</h2>${sub ? `<p class="section-desc">${sub}</p>` : ''}</div>${action}</div>`;
  }

  function pageHero(title, eyebrow, sub, image = IMG.sailing, videoSrc = '') {
    return `<section class="page-hero ${videoSrc ? 'has-video' : ''}" style="--page-img:url('${image}')">
      ${videoSrc ? renderHeroVideoBg(videoSrc, image) : ''}
      <div class="page-hero-shade"></div>
      <div class="wrap page-hero-inner">
        <div class="breadcrumb"><a href="${p('')}">Home</a><span>/</span>${esc(eyebrow)}</div>
        ${label(eyebrow)}
        <h1>${title}</h1>
        <p>${sub}</p>
      </div>
      <span class="hero-index">NILETRAILS / EGYPT</span>
    </section>`;
  }

  // Render a Sightseeing Place Card (Photo + Short Description + Price Box + See More button + Optional Add-to-Journey toggle)
  function renderSightseeingCard(place, opts = {}) {
    const st = CMS.getState();
    const cur = st.settings?.currencySymbol || '$';
    const showAddToggle = Boolean(opts.showAddToggle);
    const seeMoreUrl = `beyond-the-nile/nubian-and-the-nile/${place.slug}`;

    return `
      <article class="sight-place-card" data-location="${esc(place.location)}">
        <div class="spc-photo">
          <a href="${p(seeMoreUrl)}">
            ${photo(place.image, place.title)}
          </a>
          <span class="spc-loc-badge">📍 ${esc(place.location)}</span>
          ${place.duration ? `<span class="spc-dur-badge">⏱ ${esc(place.duration)}</span>` : ''}
        </div>
        <div class="spc-body">
          <div class="spc-guide-tag">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>
            <span>Sightseeing with Private Egyptologist Tour Guide</span>
          </div>
          <h3><a href="${p(seeMoreUrl)}">${esc(place.title)}</a></h3>
          <p class="spc-desc">${esc(place.shortDesc || place.highlights)}</p>
          <div class="spc-price-row">
            <div class="spc-price-box">
              <small>GUIDED TOUR PRICE</small>
              <strong>${cur}${place.price} <span>/ ${esc(place.priceUnit || 'person')}</span></strong>
            </div>
            <div class="spc-actions">
              <a href="${p(seeMoreUrl)}" class="spc-see-more-btn">See More <span>↗</span></a>
              ${showAddToggle ? `
                <label class="spc-add-journey-lbl" for="sight-chk-${esc(place.id)}">
                  <input type="checkbox" id="sight-chk-${esc(place.id)}" class="sight-journey-checkbox" value="${esc(place.id)}" data-sight-title="Sightseeing: ${esc(place.title)} (with Tour Guide)" data-sight-price="${Number(place.price) || 0}" data-sight-unit="${esc(place.priceUnit || 'per person')}">
                  <span class="spc-add-btn-text">+ Add to Journey</span>
                </label>
              ` : `
                <a href="${p(seeMoreUrl + '#book-sightseeing')}" class="spc-book-mini-btn">Book Tour</a>
              `}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function miniCard(item, kind) {
    const st = CMS.getState();
    const cur = st.settings?.currencySymbol || '$';
    const isJ = kind === 'journey';
    const isPage = kind === 'custom-page';
    const slug = isPage ? 'page/' + item.slug : isJ ? 'journeys/' + item.slug : kind === 'destination' ? 'beyond-the-nile/' + item.slug : kind === 'story' ? 'nile-stories/' + item.slug : kind === 'dahabiya' ? 'dahabiyas/' + item.slug : 'nile-cruises/' + item.slug;
    const name = isPage ? item.title : isJ || kind === 'destination' ? item.name : item.title;
    const meta = isPage ? (item.eyebrow || 'Special Collection') : isJ ? item.route : kind === 'destination' ? item.subtitle : kind === 'story' ? item.category : `${item.nights} nights · ${item.route}`;
    const progsCount = Array.isArray(item.programs) ? item.programs.length : 0;
    const progMin = progsCount > 0 ? Math.min(...item.programs.map(pr => Number(pr.basePrice) || 9999)) : null;
    const minPrice = (Number(item.basePrice) > 0) ? Number(item.basePrice) : progMin;

    return `<article class="collection-card">
      <a class="card-photo" href="${p(slug)}">
        ${photo(item.image || item.heroImage, name)}
        ${progsCount > 0 ? `<span class="card-prog-badge">${progsCount} Programs (3N · 4N · 7N)</span>` : ''}
        <span class="card-hover">View itinerary, facilities & book ↗</span>
      </a>
      <div class="card-content">
        <div class="card-topline">
          <span>${esc(item.tag || item.homeCardTag || meta)}</span>
          ${!isJ && kind !== 'destination' && kind !== 'story' && !isPage ? bookmark(item.slug) : ''}
        </div>
        <a href="${p(slug)}"><h3>${esc(name)}</h3></a>
        <p class="card-meta">${esc(meta)}</p>
        ${kind === 'cruise' || kind === 'dahabiya' ? `<p class="card-excerpt">${esc(item.sub)}</p>` : ''}
        ${isPage ? `<p class="card-excerpt">${esc(item.subtitle)}</p>` : ''}
        ${progsCount > 0 ? `
          <div class="card-programs-preview">
            <small>AVAILABLE SAILING PROGRAMS:</small>
            <ul>
              ${item.programs.slice(0, 3).map(pr => `<li><a href="${p(slug + '?program=' + pr.slug)}">◈ ${esc(pr.tabLabel || pr.duration)} — ${esc(pr.tabSub || pr.route)}</a></li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="card-footer">
          <span>${minPrice ? `From <strong>${cur}${minPrice}</strong> / person` : (kind === 'cruise' || kind === 'dahabiya' ? 'Tailored quotation' : kind === 'journey' ? 'Designed around you' : 'Discover more')}</span>
          <a href="${p(slug)}" aria-label="Explore ${esc(name)}">↗</a>
        </div>
      </div>
    </article>`;
  }

  function experienceCard(image, n, name, text, href, classname = '') {
    return `<a class="experience-tile ${classname}" href="${p(href)}"><div class="tile-image">${photo(image, name)}</div><div class="tile-shade"></div><div class="tile-top">0${n}<span>EXPERIENCE</span></div><div class="tile-bottom"><h3>${name}</h3><p>${text}</p><span>Explore this way <b>↗</b></span></div></a>`;
  }

  function home() {
    const st = CMS.getState();
    const hc = st.homeConfig || {};
    const cur = st.settings?.currencySymbol || '$';
    const featuredCruises = [
      ...(st.cruises || []).filter(c => c.enabled !== false && c.showOnHome),
      ...(st.dahabiyas || []).filter(d => d.enabled !== false && d.showOnHome)
    ];
    const homeCustomPages = (st.customPages || []).filter(cp => cp.enabled !== false && cp.showOnHome);
    const homeAddons = (st.addons || []).filter(a => a.enabled !== false && a.showOnHome);
    const activeStories = (st.stories || []).filter(s => s.enabled !== false);
    const sightseeing = (st.sightseeingPlaces || []).filter(s => s.enabled !== false);
    const heroVideoSrc = hc.heroVideo || V + 'hero-main.mp4';

    const sectionRenderers = {
      search: () => `
        <div class="search-wrap wrap">
          <form id="quick-search" class="search-bar" aria-label="Find an experience">
            <div class="search-caption">DISCOVER YOUR WAY<span>Where shall we take you?</span></div>
            <label for="quick-type">EXPERIENCE
              <select id="quick-type" name="type">
                <option value="nile-cruises">Nile Cruises & Programs</option>
                <option value="dahabiyas">Dahabiyas</option>
                <option value="beyond-the-nile/nubian-and-the-nile">Nubian & the Nile Sightseeing</option>
                <option value="journeys">Tailor-Made Journeys</option>
              </select>
            </label>
            <label for="quick-style">TRAVEL STYLE
              <select id="quick-style" name="style">
                <option value="">All styles</option>
                <option value="luxury">Luxury</option>
                <option value="deluxe">Deluxe</option>
                <option value="superior">Superior</option>
              </select>
            </label>
            <label for="quick-nights">TIME ON THE NILE
              <select id="quick-nights" name="nights">
                <option value="">Any duration</option>
                <option value="3">3 nights (Aswan → Luxor)</option>
                <option value="4">4 nights (Luxor → Aswan)</option>
                <option value="7">7 nights (Round Trip)</option>
              </select>
            </label>
            <button class="search-button" type="submit">Discover <span>↗</span></button>
          </form>
        </div>`,
      intro: () => `
        <section class="intro-band">
          <div class="wrap intro-band-inner">
            <div>${label('THE NILETRAILS PHILOSOPHY')}<h2>More than seeing Egypt.<br><em>Feeling its rhythm.</em></h2></div>
            <div><p>Every Nile cruise and dahabiya features curated 3, 4 & 7-night programs, full onboard facilities, private Egyptologist sightseeing tours, and seamless add-on extensions across Egypt.</p>${arrow('Explore Nubian & the Nile Sightseeing', 'beyond-the-nile/nubian-and-the-nile')}</div>
          </div>
        </section>`,
      experiences: () => `
        <section class="experience-section wrap section-space">
          ${sectionTitle('DISCOVER YOUR WAY', 'One river. <em>Many ways to wonder.</em>', 'Choose how you want to experience Egypt — then select your sailing program, guided sightseeing and custom add-ons.')}
          <div class="experience-layout">
            ${experienceCard(IMG.cruise, 1, 'Nile Cruises', 'Curated 3, 4 & 7-night programs with onboard facilities & private Egyptologist.', 'nile-cruises', 'tile-large')}
            ${experienceCard(IMG.sailing, 2, 'Dahabiyas', 'Tradition, intimacy and the unhurried art of wind-powered sailing.', 'dahabiyas')}
            ${experienceCard(IMG.temple, 3, 'Nubian & the Nile', '15 iconic temples, tombs & Nubian villages with private tour guide.', 'beyond-the-nile/nubian-and-the-nile')}
            ${experienceCard(IMG.temple, 4, 'Beyond the Nile', 'Cairo, Red Sea, White Desert, Oases and extraordinary stories.', 'beyond-the-nile')}
          </div>
        </section>`,
      featuredCruises: () => featuredCruises.length ? `
        <section class="featured-section section-space">
          <div class="wrap">
            ${sectionTitle('THE NILE COLLECTION & PROGRAMS', 'The journey begins <em>on the water.</em>', 'Select any vessel below to view its 3, 4 & 7-night programs, route map, cruise facilities, guided sightseeing add-ons and booking form.', arrow('View all Nile Cruises', 'nile-cruises'))}
            <div class="card-grid three">
              ${featuredCruises.slice(0, 6).map(x => miniCard(x, x.kind || 'cruise')).join('')}
            </div>
          </div>
        </section>` : '',
      sightseeingHome: () => sightseeing.length ? `
        <section class="wrap section-space">
          ${sectionTitle('BEYOND THE NILE · NUBIAN AND THE NILE', 'Main Places to Visit <em>During a Nile Cruise.</em>', 'Explore the iconic temples, royal tombs and Nubian heritage sites between Luxor and Aswan — each can be added to your journey with a private Egyptologist tour guide.', arrow('View All 15 Places in Nubian & the Nile', 'beyond-the-nile/nubian-and-the-nile'))}
          <div class="sight-cards-grid">
            ${sightseeing.slice(0, 6).map(pl => renderSightseeingCard(pl, { showAddToggle: false })).join('')}
          </div>
          <div style="text-align:center;margin-top:32px">
            ${button('Explore All 15 Sightseeing Places & Prices', 'beyond-the-nile/nubian-and-the-nile', 'btn-gold')}
          </div>
        </section>` : '',
      customPagesHome: () => homeCustomPages.length ? `
        <section class="wrap section-space">
          ${sectionTitle('CURATED COLLECTIONS', 'Special <em>experiences.</em>', 'Explore dedicated pages and custom collections created for your journey.')}
          <div class="card-grid ${homeCustomPages.length === 1 ? 'two' : 'three'}">
            ${homeCustomPages.map(cp => miniCard(cp, 'custom-page')).join('')}
          </div>
        </section>` : '',
      signature: () => `
        <section class="signature-section">
          <div class="signature-image">${photo(IMG.sailing, 'Traditional dahabiya sailing on the Nile')}</div>
          <div class="signature-copy">
            ${label('A DIFFERENT WAY TO TRAVEL')}
            <h2>Let the days<br><em>unfold naturally.</em></h2>
            <p>There is something transformative about travelling at the pace of the river. Wake to quiet mornings, linger over the landscape and customize your voyage with guided sightseeing and seamless extensions.</p>
            <div class="signature-points">
              <span>01 / 3, 4 & 7-Night programs with interactive route maps</span>
              <span>02 / 15 guided sightseeing places you can add to your journey</span>
              <span>03 / Full onboard cruise facilities & private Egyptologist guides</span>
            </div>
            ${button('Discover Dahabiya Sailing', 'dahabiyas', 'btn-outline')}
          </div>
        </section>`,
      featuredAddons: () => homeAddons.length ? `
        <section class="wrap section-space">
          ${sectionTitle('ENHANCE YOUR VOYAGE', 'Popular Add-ons & <em>Program Extensions.</em>', 'When booking any cruise program, you can effortlessly attach these multi-day extensions and signature experiences.')}
          <div class="card-grid three">
            ${homeAddons.map(ad => `
              <article class="collection-card addon-home-card">
                <div class="card-photo">
                  ${photo(ad.image, ad.title)}
                  <span class="card-prog-badge">${esc(ad.duration)}</span>
                </div>
                <div class="card-content">
                  <div class="card-topline"><span>${esc(ad.category)}</span><strong>+${cur}${ad.price} <small>${esc(ad.priceUnit)}</small></strong></div>
                  <h3>${esc(ad.title)}</h3>
                  <p class="card-excerpt">${esc(ad.summary)}</p>
                  <div class="card-footer">
                    <span>Available as Add-on in Cruise Programs</span>
                    <a href="${p('nile-cruises')}" aria-label="Choose a cruise to add ${esc(ad.title)}">↗</a>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </section>` : '',
      journeysFeature: () => `
        <section class="journey-feature">
          <div class="wrap journey-feature-inner">
            <div class="journey-feature-intro">
              ${label('GO BEYOND THE ORDINARY')}
              <h2>Egypt is a story.<br><em>Make it yours.</em></h2>
              <p>Our Journeys are not rigid packages. They are thoughtful starting points for the experiences, landscapes and connections you want to make.</p>
              ${button('Explore Journeys', 'journeys', 'btn-gold')}
            </div>
            <div class="journey-feature-tiles">
              <a href="${p('journeys/classic-nile-journey')}" class="journey-feature-card">${photo(IMG.temple, 'Ancient Egyptian temple')}<div><small>01 / THE ESSENTIALS</small><h3>Classic Nile Journey</h3><span>Discover the route ↗</span></div></a>
              <a href="${p('beyond-the-nile/nubian-and-the-nile')}" class="journey-feature-card lower">${photo(IMG.sailing, 'Sailing on the Nile')}<div><small>02 / BEYOND THE NILE</small><h3>Nubian & the Nile Sightseeing</h3><span>Explore 15 iconic places ↗</span></div></a>
            </div>
          </div>
        </section>`,
      storiesSection: () => activeStories.length ? `
        <section class="stories-section wrap section-space">
          ${sectionTitle('FROM THE JOURNAL', 'Stories worth <em>taking with you.</em>', 'Guides, ideas and inspiration for seeing Egypt with fresh eyes.', arrow('Visit Nile Stories', 'nile-stories'))}
          <div class="story-row">
            ${activeStories.slice(0, 3).map(s => `<a href="${p('nile-stories/' + s.slug)}" class="story-tile">${photo(s.image, s.title)}<div><span>${esc(s.category)}</span><h3>${esc(s.title)}</h3><small>Read the story ↗</small></div></a>`).join('')}
          </div>
        </section>` : '',
      closingBanner: () => `
        <section class="closing-banner" style="--closing-img:url('${IMG.temple}')">
          <div class="wrap">
            <div>
              ${label('MADE FOR YOUR MOMENTS')}
              <h2>Where will your<br><em>story take you?</em></h2>
              <p>Tell us the places you dream about. We will help design the journey that feels right for you.</p>
              ${button('Plan Your Journey', 'plan-your-journey', 'btn-gold')}
            </div>
          </div>
        </section>`
    };

    const orderedSections = (hc.sections || []).filter(s => s.enabled !== false);

    return `<section class="hero-home has-video" style="--hero-img:url('${hc.heroImage || IMG.sailing}')">
      ${renderHeroVideoBg(heroVideoSrc, hc.heroImage || IMG.sailing)}
      <div class="hero-gradient"></div>
      <div class="wrap hero-home-inner">
        <div class="hero-copy">
          ${label(esc(hc.heroEyebrow || 'TRAVEL DEEPER. SAIL SLOWER.'))}
          <h1>${hc.heroTitle || 'Find your <em>Egypt</em><br>along the Nile.'}</h1>
          <p>${esc(hc.heroSub || 'From timeless river cruises to intimate dahabiyas and journeys shaped entirely around you.')}</p>
          <div class="hero-buttons">
            ${button(esc(hc.primaryBtnText || 'Explore the Nile'), hc.primaryBtnUrl || 'nile-cruises', 'btn-gold')}
            ${button(esc(hc.secondaryBtnText || 'Nubian & the Nile Sightseeing'), hc.secondaryBtnUrl || 'beyond-the-nile/nubian-and-the-nile', 'btn-glass')}
          </div>
        </div>
        <div class="hero-vertical">NILETRAILS — SAILING THE NILE</div>
        <div class="hero-foot">
          <div class="hero-down">↓ <span>SCROLL TO EXPLORE</span></div>
          <div class="hero-foot-text">SILENT AUTOPLAY CINEMA · LUXOR TO ASWAN</div>
        </div>
      </div>
    </section>
    ${orderedSections.map(sec => sectionRenderers[sec.id] ? sectionRenderers[sec.id]() : '').join('')}`;
  }

  function filterBar(type, selected = '') {
    const qs = new URLSearchParams(location.hash.split('?')[1] || '');
    const cat = selected || qs.get('category') || '';
    let opts = type === 'cruise' ? ['Luxury', 'Deluxe', 'Superior'] : ['Luxury', 'Deluxe', 'Private'];
    return `<div class="filters-wrap">
      <div class="filters-top">
        <div><span class="filter-title">FIND YOUR ${type === 'cruise' ? 'CRUISE & PROGRAM' : 'DAHABIYA & PROGRAM'}</span><p>Choose the experience that feels right for you.</p></div>
        <button type="button" id="reset-filters">Reset filters ↺</button>
      </div>
      <div class="filters-fields">
        <label for="filter-category">TRAVEL STYLE
          <select id="filter-category">
            <option value="">All styles</option>
            ${opts.map(x => `<option value="${x.toLowerCase()}" ${cat === x.toLowerCase() ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
        </label>
        <label for="filter-route">ROUTE
          <select id="filter-route">
            <option value="">All routes</option>
            <option value="Luxor → Aswan">Luxor → Aswan</option>
            <option value="Aswan → Luxor">Aswan → Luxor</option>
            <option value="Tailor-made">Tailor-made</option>
          </select>
        </label>
        <label for="filter-duration">DURATION
          <select id="filter-duration">
            <option value="">Any duration</option>
            ${[3, 4, 5, 7].map(n => `<option value="${n}">${n} nights</option>`).join('')}
          </select>
        </label>
        <label for="filter-sort">SORT BY
          <select id="filter-sort">
            <option value="default">Recommended</option>
            <option value="duration-asc">Shortest first</option>
            <option value="duration-desc">Longest first</option>
          </select>
        </label>
      </div>
    </div>`;
  }

  function listings(type) {
    const st = CMS.getState();
    let cruise = type === 'cruise';
    let arr = (cruise ? st.cruises : st.dahabiyas).filter(x => x.enabled !== false);
    let title = cruise ? 'Nile Cruises' : 'Dahabiyas';
    let subtitle = cruise ? 'Each cruise offers 3, 4 & 7-night sailing programs, onboard facilities, guided sightseeing add-ons and flexible cabin tiers.' : 'The quieter, more intimate way to discover the Nile — complete with tailored sailing programs and private Egyptologist guides.';
    let vid = cruise ? V + 'hero-cruise-1.mp4' : V + 'hero-dahabiya-1.mp4';

    return `${pageHero(title, cruise ? 'NILE CRUISES & PROGRAMS' : 'DAHABIYAS & PROGRAMS', subtitle, cruise ? IMG.cruise : IMG.sailing, vid)}
      <section class="list-intro wrap">
        <div>${label(cruise ? 'THE NILE CRUISE COLLECTION' : 'THE DAHABIYA COLLECTION')}<h2>${cruise ? 'Find the sailing that <em>suits you.</em>' : 'A slower rhythm. <em>A deeper connection.</em>'}</h2></div>
        <p>${cruise ? 'Select any cruise below to inspect its 3, 4 & 7-night itineraries, onboard facilities, guided sightseeing places you can add to your journey, and our international guest booking form.' : 'More than a boat, a dahabiya is a different way of seeing Egypt: smaller in scale, connected to tradition and beautifully close to the river.'}</p>
      </section>
      <section class="wrap listing-section">
        ${filterBar(type)}
        <div class="results-head">
          <p id="results-count">${arr.length} experiences to explore</p>
          <p>Select a vessel to view its detailed sailing programs, facilities & sightseeing add-ons.</p>
        </div>
        <div class="card-grid three" id="results-grid">${arr.map(x => miniCard(x, type)).join('')}</div>
        <div class="help-banner">
          <div>${label('NEED A SECOND OPINION?')}<h3>Not sure which ${cruise ? 'cruise program' : 'dahabiya program'} is right for you?</h3><p>Tell us a little about your plans. We will help you compare the possibilities.</p></div>
          ${button('Ask a Travel Designer', 'plan-your-journey', 'btn-outline')}
        </div>
      </section>`;
  }

  // Render Cruise / Dahabiya Detail Page styled after https://nilecruisetrips.com/to_book/a-sara-nile-cruise/#itinerary
  function detail(type, slug) {
    const st = CMS.getState();
    const cur = st.settings?.currencySymbol || '$';
    const isCruise = type === 'cruise';
    const list = isCruise ? (st.cruises || []) : (st.dahabiyas || []);
    const vessel = list.find(v => v.slug === slug);
    if (!vessel) return notfound();

    const back = isCruise ? 'nile-cruises' : 'dahabiyas';
    const programs = Array.isArray(vessel.programs) && vessel.programs.length ? vessel.programs : [];
    const qs = new URLSearchParams(location.hash.split('?')[1] || '');
    const requestedProgSlug = qs.get('program') || '';
    const activeProg = programs.find(pr => pr.slug === requestedProgSlug || pr.id === requestedProgSlug) || programs[0];
    if (!activeProg) return '<section class="wrap section-space"><p>No programs configured for this vessel yet.</p></section>';

    const heroVideo = activeProg.heroVideo || vessel.heroVideo || (isCruise ? V + 'hero-cruise-1.mp4' : V + 'hero-dahabiya-1.mp4');
    const facilities = (activeProg.facilities && activeProg.facilities.length) ? activeProg.facilities : (vessel.facilities && vessel.facilities.length ? vessel.facilities : CMS.DEFAULT_FACILITIES);
    const sightseeingPlaces = (st.sightseeingPlaces || []).filter(s => s.enabled !== false);
    const availableAddons = CMS.getAvailableAddonsForProgram(activeProg.id, activeProg.allowedAddonIds);
    const programExtensions = availableAddons.filter(a => a.type === 'program-extension');
    const excursionsAndVip = availableAddons.filter(a => a.type !== 'program-extension');

    const cabins = activeProg.cabins && activeProg.cabins.length ? activeProg.cabins : [
      { id: 'triple-cabin', name: 'Triple Cabin', priceDelta: -20, desc: '3 persons sharing' },
      { id: 'double-cabin', name: 'Double Cabin', priceDelta: 0, desc: '2 persons sharing (Most chosen)' },
      { id: 'single-cabin', name: 'Single Cabin', priceDelta: Math.round(activeProg.basePrice * 0.65), desc: 'Private sole occupancy' },
      { id: 'royal-suite', name: 'Royal Panoramic Suite', priceDelta: 420, desc: 'Upper deck suite with lounge' }
    ];

    const routeStops = (activeProg.routeStops && activeProg.routeStops.length)
      ? activeProg.routeStops
      : (activeProg.itinerary || []).map((it, idx) => ({
          stop: it.stop || (it.title ? it.title.split('—')[0].replace(/Arrival at|Arrival in/i, '').trim().slice(0, 18) : `Stop ${idx + 1}`),
          day: it.day || `Day ${idx + 1}`
        }));

    const basePrice = Number(activeProg.basePrice) || 750;
    const summerTriple = activeProg.pricingSeasons?.summer?.triple || Math.round(basePrice * 0.96);
    const summerDouble = activeProg.pricingSeasons?.summer?.double || basePrice;
    const summerSingle = activeProg.pricingSeasons?.summer?.single || Math.round(basePrice * 1.65);
    const winterTriple = activeProg.pricingSeasons?.winter?.triple || Math.round(basePrice * 1.15);
    const winterDouble = activeProg.pricingSeasons?.winter?.double || Math.round(basePrice * 1.18);
    const winterSingle = activeProg.pricingSeasons?.winter?.single || Math.round(basePrice * 1.9);

    return `
      <!-- CINEMATIC SILENT AUTOPLAY VIDEO HERO FOR THIS CRUISE & PROGRAM -->
      <section class="nct-hero has-video" style="--page-img:url('${vessel.image || IMG.cruise}')">
        ${renderHeroVideoBg(heroVideo, vessel.image || IMG.cruise)}
        <div class="nct-hero-shade"></div>
        <div class="wrap nct-hero-inner">
          <div class="breadcrumb">
            <a href="${p('')}">Home</a><span>/</span>
            <a href="${p(back)}">${isCruise ? 'Nile Cruises' : 'Dahabiyas'}</a><span>/</span>
            ${esc(vessel.title)}
          </div>
          <div class="nct-hero-badges">
            <span class="nct-badge-gold">★★★★★ 5-Star ${esc(vessel.tier)} ${isCruise ? 'Nile Cruise' : 'Dahabiya'}</span>
            <span class="nct-badge-glass">⏱ ${esc(activeProg.duration)}</span>
            <span class="nct-badge-glass">📍 ${esc(activeProg.route)}</span>
            <span class="nct-badge-glass">🔇 Autoplay HD Cruise Preview</span>
          </div>
          <h1>${esc(vessel.title)}</h1>
          <p class="nct-hero-sub">${esc(activeProg.title)} — ${esc(vessel.sub)}</p>
        </div>
      </section>

      <!-- STICKY SECTION JUMP BAR (like nilecruisetrips.com) -->
      <nav class="nct-subnav" aria-label="Cruise sections">
        <div class="wrap nct-subnav-inner">
          <a href="#overview" class="nct-sublink" data-scroll-to="overview">Overview</a>
          <a href="#itinerary" class="nct-sublink active" data-scroll-to="itinerary">The Journey (Itinerary)</a>
          <a href="#facilities" class="nct-sublink" data-scroll-to="facilities">Cruise Facilities</a>
          <a href="#sightseeing" class="nct-sublink" data-scroll-to="sightseeing">Sightseeing with Tour Guide</a>
          <a href="#pricing" class="nct-sublink" data-scroll-to="pricing">Pricing & Cabins</a>
          <a href="#included" class="nct-sublink" data-scroll-to="included">What's Included</a>
          <a href="#booking-form-anchor" class="nct-sublink nct-sublink-cta" data-scroll-to="booking-form-anchor">Customize & Book Now ↗</a>
        </div>
      </nav>

      <!-- MAIN TWO-COLUMN NCT LAYOUT -->
      <section class="wrap nct-layout" id="program-workspace"
        data-base-price="${basePrice}"
        data-summer-double="${summerDouble}"
        data-winter-double="${winterDouble}"
        data-summer-triple="${summerTriple}"
        data-winter-triple="${winterTriple}"
        data-summer-single="${summerSingle}"
        data-winter-single="${winterSingle}"
        data-active-season="summer"
        data-currency="${esc(cur)}">
        <!-- LEFT MAIN ARTICLE -->
        <article class="nct-main">

          <!-- 1. ABOUT & 4 ICON HIGHLIGHTS -->
          <section class="nct-sect" id="overview">
            <h2 class="nct-sect-h"><span class="nct-bar"></span>About ${esc(vessel.title)}</h2>
            <div class="nct-prose">
              <p>${esc(activeProg.summary)}</p>
              <p>Onboard <strong>${esc(vessel.title)}</strong>, panoramic river-view cabins, a sun deck and swimming pool, a panoramic lounge bar, spa & massage services, and a full-board restaurant serving Egyptian and international cuisine create a seamless setting between Luxor and Aswan. Every program includes a licensed Egyptologist tour guide and private air-conditioned shore transfers.</p>
            </div>

            <div class="nct-highlights">
              <div class="nct-hl">
                <div class="nct-hl-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg></div>
                <b>Egyptologist</b>
                <small>Guide on board</small>
              </div>
              <div class="nct-hl">
                <div class="nct-hl-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h18M5 13 7 5h10l2 8M7 18h.01M17 18h.01"/></svg></div>
                <b>Full Board</b>
                <small>All meals included</small>
              </div>
              <div class="nct-hl">
                <div class="nct-hl-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg></div>
                <b>Luxor ↔ Aswan</b>
                <small>Scenic sailing</small>
              </div>
              <div class="nct-hl">
                <div class="nct-hl-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 3 7v6c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7z"/><path d="m9 12 2 2 4-4"/></svg></div>
                <b>Free WiFi</b>
                <small>On board</small>
              </div>
            </div>
          </section>

          <!-- 2. THE JOURNEY / ITINERARY (with nilecruisetrips.com Tabs + Route Map + Day Cards) -->
          <section class="nct-sect" id="itinerary">
            <div class="nct-sect-head-row">
              <h2 class="nct-sect-h"><span class="nct-bar"></span>The Journey — Choose Your Program</h2>
              <span class="nct-dep-pill">🗓 ${esc(activeProg.departureDays || 'Weekly & Private Departures')}</span>
            </div>

            <!-- Journey Program Tabs (3 Nights / 4 Nights / 7 Nights / Custom) -->
            <div class="nct-jtabs" role="tablist" aria-label="Choose Sailing Program">
              ${programs.map((prog, idx) => {
                const isAct = prog.id === activeProg.id;
                const tabTitle = prog.tabLabel || `${prog.nights} Nights`;
                const tabSub = prog.tabSub || prog.route;
                return `
                  <button type="button" class="nct-jtab ${isAct ? 'active' : ''}" data-prog-switch="${esc(prog.slug)}" role="tab" aria-selected="${isAct}">
                    <span>${esc(tabTitle)}</span>
                    <small>${esc(tabSub)}</small>
                    <em class="nct-jtab-price">From ${cur}${prog.basePrice} pp</em>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Interactive Route Map Stops -->
            <div class="nct-route-map">
              <div class="nct-route-stops">
                <div class="nct-route-line"></div>
                ${routeStops.map((rs, idx) => `
                  <button type="button" class="nct-rstop ${idx === 0 ? 'on' : ''}" data-day-jump="${idx}">
                    <span class="nct-rs-dot"></span>
                    <span class="nct-rs-name">${esc(rs.stop)}</span>
                    <span class="nct-rs-day">${esc(rs.day)}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Day-by-Day Cards -->
            <div class="nct-days">
              ${(activeProg.itinerary || []).map((item, idx) => {
                const dayNum = String(item.day || '').replace(/[^0-9]/g, '') || (idx + 1);
                const meals = item.meals || (idx === 0 ? 'Lunch · Dinner' : idx === (activeProg.itinerary.length - 1) ? 'Breakfast' : 'Breakfast · Lunch · Dinner');
                return `
                  <article class="nct-daycard ${idx === 0 ? 'hot' : ''}" id="nct-day-${idx}">
                    <div class="nct-dc-num">
                      <small>Day</small>
                      <b>${esc(dayNum)}</b>
                    </div>
                    <div class="nct-dc-body">
                      <h4>${esc(item.title)}</h4>
                      <div class="nct-dc-text">
                        <p>${esc(item.desc)}</p>
                      </div>
                      <div class="nct-dc-meals-row">
                        <span class="nct-dc-meals">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2M5 2v9m6-9v20m4-12c0-3 1-5 3-5v17"/></svg>
                          ${esc(meals)}
                        </span>
                      </div>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          </section>

          <!-- 3. CRUISE FACILITIES (Mandatory in every program) -->
          <section class="nct-sect" id="facilities">
            <h2 class="nct-sect-h"><span class="nct-bar"></span>Cruise Facilities & Onboard Amenities</h2>
            <p class="nct-sect-sub">Every program aboard <strong>${esc(vessel.title)}</strong> includes full access to our 5-star onboard facilities and cabin amenities:</p>
            <ul class="nct-facs">
              ${facilities.map(fac => `
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5L20 7"/></svg>
                  <span>${esc(fac)}</span>
                </li>
              `).join('')}
            </ul>
          </section>

          <!-- 4. SIGHTSEEING WITH TOUR GUIDE — CAN ADD TO YOUR JOURNEY (Mandatory in every program) -->
          <section class="nct-sect" id="sightseeing">
            <div class="nct-sect-head-row">
              <div>
                <h2 class="nct-sect-h"><span class="nct-bar"></span>Sightseeing with Tour Guide — Can Add to Your Journey</h2>
                <p class="nct-sect-sub">Main places to visit during your Nile cruise between Luxor, Esna, Edfu, Kom Ombo, Aswan, Abu Simbel and Nubia. Click <strong>"+ Add to Journey"</strong> to attach any guided tour to your reservation, or click <strong>"See More"</strong> to view the full monument & excursion page in <em>Beyond the Nile → Nubian and the Nile</em>.</p>
              </div>
              <a href="${p('beyond-the-nile/nubian-and-the-nile')}" class="button btn-outline" style="white-space:nowrap">Open Nubian & the Nile Hub ↗</a>
            </div>

            <!-- Filter Pills by Location -->
            <div class="sight-filter-pills" id="prog-sight-filters">
              <button type="button" class="sight-pill active" data-sight-loc="all">All 15 Places (${sightseeingPlaces.length})</button>
              <button type="button" class="sight-pill" data-sight-loc="Luxor – East Bank">Luxor – East Bank</button>
              <button type="button" class="sight-pill" data-sight-loc="Luxor – West Bank">Luxor – West Bank</button>
              <button type="button" class="sight-pill" data-sight-loc="Luxor – North">Dendera & Abydos</button>
              <button type="button" class="sight-pill" data-sight-loc="Esna,Edfu,Kom Ombo">Esna · Edfu · Kom Ombo</button>
              <button type="button" class="sight-pill" data-sight-loc="Aswan,Aswan – Abu Simbel,Aswan Nuba">Aswan · Abu Simbel · Nubia</button>
            </div>

            <div class="sight-cards-grid prog-sight-grid" id="prog-sight-grid">
              ${sightseeingPlaces.map(pl => renderSightseeingCard(pl, { showAddToggle: true })).join('')}
            </div>
          </section>

          <!-- 5. PRICING & SEASONAL CABIN CARDS (like nilecruisetrips.com) -->
          <section class="nct-sect" id="pricing">
            <h2 class="nct-sect-h"><span class="nct-bar"></span>Pricing — ${esc(activeProg.title)}</h2>
            <div class="nct-price-ctrl">
              <span class="nct-seg-label">Season</span>
              <div class="nct-seg" id="nct-seg-season">
                <button type="button" class="on" data-season="summer">May – Aug (Summer)</button>
                <button type="button" class="" data-season="winter">Sep – Apr (Peak Season)</button>
              </div>
              <span class="nct-seg-label" style="margin-left:auto">Program Duration</span>
              <div class="nct-seg">
                ${programs.map(pr => `
                  <button type="button" class="${pr.id === activeProg.id ? 'on' : ''}" data-prog-switch="${esc(pr.slug)}">${esc(pr.tabLabel || pr.nights + ' Nights')}</button>
                `).join('')}
              </div>
            </div>

            <div class="nct-pcards">
              <div class="nct-pcard" data-select-cabin="Triple Cabin" role="button" tabindex="0" aria-label="Select Triple Cabin">
                <div class="nct-pc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18v10H3zM3 11h18M7 7V5h10v2"/></svg></div>
                <h4>Triple Cabin</h4>
                <div class="nct-pc-sub">3 persons sharing</div>
                <div class="nct-pc-price">${cur}<span class="nct-pv" data-summer="${summerTriple}" data-winter="${winterTriple}">${summerTriple}</span><span> /pp</span></div>
                <div class="nct-pc-note">per person, full board</div>
              </div>
              <div class="nct-pcard pop is-selected" data-select-cabin="Double Cabin" role="button" tabindex="0" aria-label="Select Double Cabin">
                <span class="nct-pop-tag">MOST POPULAR</span>
                <div class="nct-pc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18v10H3zM3 11h18"/></svg></div>
                <h4>Double Cabin</h4>
                <div class="nct-pc-sub">2 persons sharing</div>
                <div class="nct-pc-price">${cur}<span class="nct-pv" data-summer="${summerDouble}" data-winter="${winterDouble}">${summerDouble}</span><span> /pp</span></div>
                <div class="nct-pc-note">most chosen by couples</div>
              </div>
              <div class="nct-pcard" data-select-cabin="Single Cabin" role="button" tabindex="0" aria-label="Select Single Cabin">
                <div class="nct-pc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16v10H4zM4 11h16"/></svg></div>
                <h4>Single Cabin</h4>
                <div class="nct-pc-sub">Private occupancy</div>
                <div class="nct-pc-price">${cur}<span class="nct-pv" data-summer="${summerSingle}" data-winter="${winterSingle}">${summerSingle}</span><span> /pp</span></div>
                <div class="nct-pc-note">sole-use supplement included</div>
              </div>
            </div>
          </section>

          <!-- 6. WHAT'S INCLUDED / NOT INCLUDED & PRICE POLICY -->
          <section class="nct-sect" id="included">
            <h2 class="nct-sect-h"><span class="nct-bar"></span>What’s Included</h2>
            <div class="nct-ie-grid">
              <div class="nct-ie-card inc">
                <h3>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-5"/></svg>
                  Included in Program
                </h3>
                <ul>
                  ${(activeProg.included || []).map(inc => `
                    <li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5L20 7"/></svg>${esc(inc)}</li>
                  `).join('')}
                </ul>
              </div>
              <div class="nct-ie-card exc">
                <h3>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                  Not Included (Can Add Above)
                </h3>
                <ul>
                  ${(activeProg.excluded || []).map(exc => `
                    <li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>${esc(exc)}</li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </section>

          <section class="nct-sect" id="policy">
            <h2 class="nct-sect-h"><span class="nct-bar"></span>Price & Children Policy</h2>
            <details class="nct-pol" open>
              <summary>Rates, Children Discounts & Peak Periods</summary>
              <div class="nct-pol-body">
                <ul>
                  <li>Prices are quoted in <strong>${esc(st.settings?.currency || 'USD')}</strong> per person and valid through 2026 / 2027 (except Christmas, New Year & Easter peak supplements).</li>
                  <li><strong>Children Policy:</strong> Ages 0–5.99 Free of charge · Ages 6–11.99 enjoy 50% of the adult rate when sharing parents' cabin · 12+ years charged as adult.</li>
                  <li><strong>Flexible Cancellation:</strong> Full refund if an official travel warning is issued; flexible date changes up to 30 days prior to sailing.</li>
                </ul>
              </div>
            </details>
          </section>

          <!-- 7. FULL INTERNATIONAL GUEST BOOKING & ADD-ONS CUSTOMIZER FORM -->
          <section class="nct-sect foreign-booking-section" id="booking-form-anchor">
            <div class="fb-header">
              ${label('INTERNATIONAL GUEST RESERVATION & ADD-ONS')}
              <h3>Book <em>${esc(activeProg.title)}</em> & Customize Your Journey</h3>
              <p>Complete your foreign traveller details below. Any <strong>Sightseeing with Tour Guide</strong> tours you ticked above, plus any <strong>Other Program Extensions</strong> selected below, are automatically calculated into your package.</p>
            </div>

            <form id="program-booking-form" method="POST" action="#/submit-booking" novalidate>
              <input type="hidden" name="vesselSlug" value="${esc(vessel.slug)}">
              <input type="hidden" name="vesselTitle" value="${esc(vessel.title)}">
              <input type="hidden" name="programId" value="${esc(activeProg.id)}">
              <input type="hidden" name="programSlug" value="${esc(activeProg.slug)}">
              <input type="hidden" name="programTitle" value="${esc(activeProg.title)}">

              <!-- STEP 01: CABIN & DATES -->
              <fieldset class="fb-fieldset">
                <legend><span>01</span> Select Cabin Category, Sailing Date & Travellers</legend>
                <div class="cabin-selector-grid">
                  ${cabins.map((cb, idx) => `
                    <label class="cabin-radio-card" for="cabin-${esc(cb.id || idx)}">
                      <input type="radio" id="cabin-${esc(cb.id || idx)}" name="cabinName" value="${esc(cb.name)}" data-cabin-delta="${Number(cb.priceDelta) || 0}" ${idx === 1 || (idx === 0 && cabins.length === 1) ? 'checked' : ''}>
                      <div class="cabin-card-top">
                        <strong>${esc(cb.name)}</strong>
                        <span class="cabin-price-tag">${Number(cb.priceDelta) > 0 ? `+${cur}${cb.priceDelta} pp` : Number(cb.priceDelta) < 0 ? `${cur}${cb.priceDelta} pp` : `Standard (${cur}${basePrice} pp)`}</span>
                      </div>
                      <small>${esc(cb.desc || '')}</small>
                    </label>
                  `).join('')}
                </div>

                <div class="three-fields" style="margin-top:20px">
                  <div class="field-group">
                    <label for="bf-checkin">Preferred Check-in Date *</label>
                    <input type="date" id="bf-checkin" name="checkInDate" required>
                  </div>
                  <div class="field-group">
                    <label for="bf-flex">Date Flexibility</label>
                    <select id="bf-flex" name="dateFlexibility">
                      <option value="Exact dates">Exact dates required</option>
                      <option value="Flexible (±3 days)" selected>Flexible (±3 days)</option>
                      <option value="Flexible within month">Flexible within month</option>
                    </select>
                  </div>
                  <div class="field-group">
                    <label for="bf-bed">Cabin Bed Arrangement</label>
                    <select id="bf-bed" name="bedConfig">
                      <option value="King / Double Bed">King / Large Double Bed</option>
                      <option value="Twin Beds (2 Separate Beds)">Twin Beds (2 Separate Beds)</option>
                      <option value="Triple Cabin">Triple Cabin (3 Beds)</option>
                      <option value="Connecting / Multiple Cabins">Multiple Cabins</option>
                    </select>
                  </div>
                </div>

                <div class="two-fields">
                  <div class="field-group">
                    <label for="bf-adults">Adults (12+ yrs) *</label>
                    <select id="bf-adults" name="adults">
                      ${[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} Adult${n > 1 ? 's' : ''}</option>`).join('')}
                    </select>
                  </div>
                  <div class="field-group">
                    <label for="bf-children">Children (6–11 yrs · 50% rate)</label>
                    <select id="bf-children" name="children">
                      ${[0, 1, 2, 3, 4, 5, 6].map(n => `<option value="${n}">${n} ${n === 1 ? 'Child' : 'Children'}</option>`).join('')}
                    </select>
                  </div>
                </div>
              </fieldset>

              <!-- STEP 02: ADD-ONS & OTHER PROGRAMS -->
              <fieldset class="fb-fieldset">
                <legend><span>02</span> Add Other Programs & VIP Extensions</legend>
                <p class="fieldset-intro">Attach pre/post-cruise programs (Cairo & Pyramids, Red Sea, White Desert, Linked Cruise Programs) or VIP services to your journey:</p>

                ${programExtensions.length ? `
                  <div class="addon-group-heading">
                    <span>✦ OTHER PROGRAMS (PRE / POST-CRUISE EXTENSIONS)</span>
                    <small>Combine your cruise with Cairo, Red Sea, Desert or another program</small>
                  </div>
                  <div class="addons-checkbox-grid">
                    ${programExtensions.map(ad => `
                      <label class="addon-select-card" for="addon-chk-${esc(ad.id)}">
                        <input type="checkbox" id="addon-chk-${esc(ad.id)}" name="addons" value="${esc(ad.id)}" data-addon-title="${esc(ad.title)}" data-addon-price="${ad.price}" data-addon-unit="${esc(ad.priceUnit)}">
                        <div class="addon-card-photo">${photo(ad.image, ad.title)}<span class="addon-dur-badge">${esc(ad.duration)}</span></div>
                        <div class="addon-card-info">
                          <div class="addon-card-top">
                            <span class="addon-cat">${esc(ad.category)}</span>
                            <strong class="addon-price">+${cur}${ad.price} <small>${esc(ad.priceUnit)}</small></strong>
                          </div>
                          <h4>${esc(ad.title)}</h4>
                          <p>${esc(ad.summary)}</p>
                          <span class="addon-check-indicator"><i class="chk-box"></i> Add this program to my journey</span>
                        </div>
                      </label>
                    `).join('')}
                  </div>
                ` : ''}

                ${excursionsAndVip.length ? `
                  <div class="addon-group-heading" style="margin-top:24px">
                    <span>✦ VIP SERVICES & SIGNATURE UPGRADES</span>
                    <small>Flights, balloons & fast-track airport concierge</small>
                  </div>
                  <div class="addons-checkbox-grid">
                    ${excursionsAndVip.map(ad => `
                      <label class="addon-select-card" for="addon-chk-${esc(ad.id)}">
                        <input type="checkbox" id="addon-chk-${esc(ad.id)}" name="addons" value="${esc(ad.id)}" data-addon-title="${esc(ad.title)}" data-addon-price="${ad.price}" data-addon-unit="${esc(ad.priceUnit)}">
                        <div class="addon-card-photo">${photo(ad.image, ad.title)}<span class="addon-dur-badge">${esc(ad.duration)}</span></div>
                        <div class="addon-card-info">
                          <div class="addon-card-top">
                            <span class="addon-cat">${esc(ad.category)}</span>
                            <strong class="addon-price">+${cur}${ad.price} <small>${esc(ad.priceUnit)}</small></strong>
                          </div>
                          <h4>${esc(ad.title)}</h4>
                          <p>${esc(ad.summary)}</p>
                          <span class="addon-check-indicator"><i class="chk-box"></i> Add to my booking</span>
                        </div>
                      </label>
                    `).join('')}
                  </div>
                ` : ''}
              </fieldset>

              <!-- STEP 03: FOREIGN GUEST DETAILS -->
              <fieldset class="fb-fieldset">
                <legend><span>03</span> International Traveller Details (بيانات العميل الأجنبي)</legend>
                <div class="two-fields">
                  <div class="field-group">
                    <label for="bf-name">Full Name (as on Passport) *</label>
                    <input type="text" id="bf-name" name="clientName" autocomplete="name" required placeholder="e.g. Charlotte Vance">
                  </div>
                  <div class="field-group">
                    <label for="bf-email">Email Address *</label>
                    <input type="email" id="bf-email" name="clientEmail" autocomplete="email" required placeholder="you@example.com">
                  </div>
                </div>

                <div class="two-fields">
                  <div class="field-group">
                    <label for="bf-phone">WhatsApp / Phone Number (with Country Code) *</label>
                    <div class="nct-phone-combo">
                      <select id="bf-dial-code" name="dialCode" aria-label="Country Dialing Code">
                        ${DIAL_CODES.map(([code, lbl]) => `<option value="${code}">${lbl}</option>`).join('')}
                      </select>
                      <input type="tel" id="bf-phone" name="clientPhone" autocomplete="tel" required placeholder="7700 900077">
                    </div>
                  </div>
                  <div class="field-group">
                    <label for="bf-country">Nationality / Country of Residence *</label>
                    <input type="text" id="bf-country" name="nationality" list="world-countries-list" autocomplete="country-name" required placeholder="Select or type your country...">
                    <datalist id="world-countries-list">
                      ${WORLD_COUNTRIES.map(c => `<option value="${c}"></option>`).join('')}
                    </datalist>
                  </div>
                </div>

                <div class="three-fields">
                  <div class="field-group">
                    <label for="bf-passport">Passport & Egypt Entry Visa</label>
                    <select id="bf-passport" name="passportReady">
                      <option value="Valid Passport (>6 months)">Passport valid (>6 months)</option>
                      <option value="Need Egypt Visa on Arrival Assist">Need Visa on Arrival assistance</option>
                      <option value="Applying for Egypt e-Visa">Applying for Egypt e-Visa</option>
                      <option value="Passport renewal in progress">Passport renewal in progress</option>
                    </select>
                  </div>
                  <div class="field-group">
                    <label for="bf-dietary">Dietary Requirements</label>
                    <select id="bf-dietary" name="dietary">
                      <option value="No restrictions">No dietary restrictions</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Gluten-Free / Celiac">Gluten-Free / Celiac</option>
                      <option value="Dairy-Free">Dairy-Free</option>
                      <option value="Nut / Shellfish Allergy">Nut / Shellfish Allergy</option>
                      <option value="Halal">Halal</option>
                      <option value="Kosher">Kosher</option>
                    </select>
                  </div>
                  <div class="field-group">
                    <label for="bf-occasion">Tour Guide Language & Occasion</label>
                    <select id="bf-occasion" name="occasion">
                      <option value="English-Speaking Egyptologist Guide">English-Speaking Egyptologist Guide</option>
                      <option value="German-Speaking Egyptologist Guide">German-Speaking Egyptologist Guide</option>
                      <option value="French-Speaking Egyptologist Guide">French-Speaking Egyptologist Guide</option>
                      <option value="Spanish-Speaking Egyptologist Guide">Spanish-Speaking Egyptologist Guide</option>
                      <option value="Italian-Speaking Egyptologist Guide">Italian-Speaking Egyptologist Guide</option>
                      <option value="Honeymoon / Anniversary Celebration">Honeymoon / Anniversary Celebration</option>
                    </select>
                  </div>
                </div>

                <div class="field-group">
                  <label for="bf-transfer">Arrival & Airport Pickup Preference</label>
                  <select id="bf-transfer" name="flightTransfer">
                    <option value="Yes — Arrange complimentary private airport pickup">Yes — Arrange private airport / station pickup upon arrival</option>
                    <option value="Already in Egypt — Pickup from my hotel in Luxor/Aswan">Already in Egypt — Pick me up from my hotel</option>
                    <option value="Need Domestic Flights from Cairo included">Include Domestic Flights from/to Cairo</option>
                  </select>
                </div>

                <div class="field-group">
                  <label for="bf-notes">Special Requests or Questions for Your Travel Designer</label>
                  <textarea id="bf-notes" name="notes" rows="3" placeholder="Share flight details, children's ages, mobility preferences or custom sightseeing wishes..."></textarea>
                </div>

                <label class="check-field" for="bf-consent">
                  <input type="checkbox" id="bf-consent" name="consent" required checked>
                  <span>I agree to receive my tailored itinerary and booking confirmation via Email & WhatsApp. No immediate online payment is charged. *</span>
                </label>

                <div id="bf-error-msg" class="planner-error" role="alert" aria-live="polite"></div>

                <div class="bf-submit-bar">
                  <div class="bf-submit-total">
                    <span>ESTIMATED TOTAL PACKAGE</span>
                    <strong id="bf-inline-total">${cur}${(basePrice * 2).toLocaleString()}</strong>
                    <small id="bf-inline-sub">For 2 Adults · All taxes & transfers included</small>
                  </div>
                  <button type="submit" id="bf-submit-btn" class="button btn-gold">
                    Send Booking Inquiry <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </fieldset>
            </form>
            <div id="bf-success-box" hidden></div>
          </section>

        </article>

        <!-- RIGHT STICKY BOOKING & LIVE SUMMARY SIDEBAR (like nilecruisetrips.com) -->
        <aside class="nct-aside-sticky">
          <div class="nct-bookcard" id="live-price-card" aria-live="polite">
            <div class="nct-bc-top">
              <div class="nct-bc-top-row">
                <div class="nct-bc-from" id="bc-top-label">LIVE PACKAGE PRICE</div>
                <span class="nct-bc-season-pill" id="bc-season-pill">May – Aug</span>
              </div>
              <div class="nct-bc-price" id="bc-top-price">${cur}${(basePrice * 2).toLocaleString()} <span>total · ${cur}${basePrice}/pp</span></div>
              <div class="nct-bc-breakdown-mini" id="bc-top-breakdown" data-vessel-label="${isCruise ? 'Cruise' : 'Dahabiya'}">${isCruise ? 'Cruise' : 'Dahabiya'} ${cur}${(basePrice * 2).toLocaleString()} · 0 Extras Added</div>
              <div class="nct-bc-rate"><span class="stars">★★★★★</span> Rated 5.0 · Private Egyptologist Included</div>
            </div>

            <div class="nct-bc-body">
              <div class="nct-bc-prog-box">
                <small>ACTIVE PROGRAM</small>
                <strong id="sum-prog-title">${esc(activeProg.title)}</strong>
                <span>${esc(activeProg.duration)} · ${esc(activeProg.route)}</span>
              </div>

              <!-- Quick Program Switcher in Sidebar -->
              <div class="nct-bc-prog-pills">
                ${programs.map(pr => `
                  <button type="button" class="${pr.id === activeProg.id ? 'active' : ''}" data-prog-switch="${esc(pr.slug)}">
                    ${esc(pr.tabLabel || pr.nights + 'N')}
                  </button>
                `).join('')}
              </div>

              <dl class="live-summary-dl">
                <div><dt>Season</dt><dd id="sum-season-name">May – Aug (Summer)</dd></div>
                <div><dt>Cabin</dt><dd id="sum-cabin-name">Double Cabin</dd></div>
                <div><dt>Travellers</dt><dd id="sum-guests">2 Adults</dd></div>
                <div><dt>${isCruise ? 'Cruise' : 'Dahabiya'} Only</dt><dd id="sum-base-calc">${cur}${basePrice} × 2 = ${cur}${(basePrice * 2).toLocaleString()}</dd></div>
              </dl>

              <div class="sum-addons-box">
                <div class="sum-addons-head">
                  <span class="sum-addons-label">ADDED SIGHTSEEING & EXTENSIONS (<strong id="sum-extras-count">0</strong>):</span>
                  <strong class="sum-extras-sub" id="sum-extras-subtotal">${cur}0</strong>
                </div>
                <ul id="sum-addons-list">
                  <li class="empty-addon-note">Tick any Sightseeing Tour or Program Add-on on the left to add it to your journey.</li>
                </ul>
              </div>

              <div class="sum-total-band">
                <span>ESTIMATED TOTAL</span>
                <strong id="sum-grand-total">${cur}${(basePrice * 2).toLocaleString()}</strong>
              </div>

              <a href="#booking-form-anchor" class="button btn-gold nct-bc-btn" data-scroll-to="booking-form-anchor">
                Complete Booking Form <span>↓</span>
              </a>
              <a href="#sightseeing" class="button btn-outline nct-bc-btn-sec" data-scroll-to="sightseeing">
                + Add Guided Sightseeing
              </a>

              <div class="nct-bc-trust">
                <span>✓ Free cancellation up to 45 days</span>
                <span>✓ Licensed private Egyptologist</span>
                <span>✓ 24/7 WhatsApp concierge support</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section class="wrap related-section">
        ${sectionTitle('CONTINUE EXPLORING', 'Other ways to <em>sail the Nile.</em>')}
        <div class="card-grid three">
          ${list.filter(i => i.slug !== slug && i.enabled !== false).slice(0, 3).map(i => miniCard(i, type)).join('')}
        </div>
      </section>
    `;
  }

  // Dedicated Page: Beyond the Nile -> "Nubian and the Nile" Hub + Individual Sightseeing Excursion Detail Page
  function nubianAndTheNilePage(placeSlug = '') {
    const st = CMS.getState();
    const cur = st.settings?.currencySymbol || '$';
    const places = (st.sightseeingPlaces || []).filter(p => p.enabled !== false);

    // If a specific sightseeing place slug is requested (when customer clicks "See More")
    if (placeSlug) {
      const place = places.find(pl => pl.slug === placeSlug || pl.id === placeSlug);
      if (!place) return notfound();

      const otherPlaces = places.filter(pl => pl.slug !== place.slug);
      const allCruises = (st.cruises || []).filter(c => c.enabled !== false).slice(0, 3);

      return `
        <section class="nct-hero has-video" style="--page-img:url('${place.image}')">
          ${renderHeroVideoBg(V + 'hero-dahabiya-2.mp4', place.image)}
          <div class="nct-hero-shade"></div>
          <div class="wrap nct-hero-inner">
            <div class="breadcrumb">
              <a href="${p('')}">Home</a><span>/</span>
              <a href="${p('beyond-the-nile')}">Beyond the Nile</a><span>/</span>
              <a href="${p('beyond-the-nile/nubian-and-the-nile')}">Nubian and the Nile</a><span>/</span>
              ${esc(place.title)}
            </div>
            <div class="nct-hero-badges">
              <span class="nct-badge-gold">📍 ${esc(place.location)}</span>
              <span class="nct-badge-glass">⏱ ${esc(place.duration || 'Half Day Guided Tour')}</span>
              <span class="nct-badge-glass">🏛 Private Egyptologist Included</span>
            </div>
            <h1>${esc(place.title)}</h1>
            <p class="nct-hero-sub">${esc(place.highlights)}</p>
          </div>
        </section>

        <section class="wrap nct-layout" style="padding-top:48px">
          <article class="nct-main">
            <div class="sight-detail-cover">
              ${photo(place.image, place.title)}
              <div class="sight-detail-price-pill">
                <small>GUIDED EXCURSION PRICE</small>
                <strong>${cur}${place.price} <span>/ ${esc(place.priceUnit || 'per person')}</span></strong>
              </div>
            </div>

            <section class="nct-sect">
              <h2 class="nct-sect-h"><span class="nct-bar"></span>About This Sightseeing Excursion & Monument</h2>
              <div class="nct-prose">
                <p class="lead" style="font-size:18px;color:#173241;font-weight:500">${esc(place.highlights)}</p>
                <p>${esc(place.fullOverview || place.shortDesc || place.highlights)}</p>
              </div>
            </section>

            <section class="nct-sect">
              <h2 class="nct-sect-h"><span class="nct-bar"></span>Guided Tour Itinerary & What You Will See</h2>
              <div class="nct-days">
                ${(place.itinerarySteps || [
                  `Pickup from your Nile cruise or hotel in ${place.location} by private air-conditioned vehicle.`,
                  `Guided exploration of ${place.title} with your licensed Egyptologist tour guide.`,
                  `Free time for photography and questions before returning comfortably to your cruise.`
                ]).map((step, i) => `
                  <article class="nct-daycard ${i === 0 ? 'hot' : ''}">
                    <div class="nct-dc-num"><small>Step</small><b>0${i + 1}</b></div>
                    <div class="nct-dc-body">
                      <div class="nct-dc-text"><p>${esc(step)}</p></div>
                    </div>
                  </article>
                `).join('')}
              </div>
            </section>

            <section class="nct-sect">
              <h2 class="nct-sect-h"><span class="nct-bar"></span>What’s Included in This Guided Visit</h2>
              <ul class="nct-facs">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5L20 7"/></svg><span>Private licensed Egyptologist tour guide in your chosen language</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5L20 7"/></svg><span>Official monument & temple entrance ticket to ${esc(place.title)}</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5L20 7"/></svg><span>Private air-conditioned transfer (and motorboat where applicable) from/to your Nile cruise</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5L20 7"/></svg><span>Complimentary chilled bottled mineral water & all local taxes</span></li>
              </ul>
            </section>

            <!-- Direct Booking / Add to Journey Form for this Sightseeing Excursion -->
            <section class="nct-sect foreign-booking-section" id="book-sightseeing">
              <div class="fb-header">
                ${label('BOOK THIS SIGHTSEEING TOUR OR ADD TO YOUR CRUISE')}
                <h3>Reserve <em>${esc(place.title)}</em> with Private Tour Guide</h3>
                <p>Book this guided sightseeing tour as a standalone excursion or attach it to your Nile Cruise program. You can also tick additional monuments below.</p>
              </div>

              <form id="sightseeing-booking-form" class="contact-form" style="padding:0;border:0;background:transparent">
                <input type="hidden" name="primaryPlaceTitle" value="${esc(place.title)}">
                <input type="hidden" name="primaryPlacePrice" value="${Number(place.price) || 55}">

                <div class="two-fields">
                  <label>Full Name (as on Passport) *<input type="text" name="clientName" required placeholder="Your full name"></label>
                  <label>Email Address *<input type="email" name="clientEmail" required placeholder="you@example.com"></label>
                </div>
                <div class="two-fields">
                  <label>WhatsApp / Phone (with Country Code) *<input type="tel" name="clientPhone" required placeholder="e.g. +44 7700 900077"></label>
                  <label>Nationality / Country *<input type="text" name="nationality" list="sight-countries" required placeholder="Your country"><datalist id="sight-countries">${WORLD_COUNTRIES.map(c => `<option value="${c}"></option>`).join('')}</datalist></label>
                </div>
                <div class="three-fields">
                  <label>Preferred Tour Date *<input type="date" name="checkInDate" required></label>
                  <label>Number of Guests<select name="adults" id="sight-guests">${[1,2,3,4,5,6,8,10].map(n => `<option value="${n}" ${n===2?'selected':''}>${n} Guest${n>1?'s':''}</option>`).join('')}</select></label>
                  <label>Preferred Guide Language<select name="guideLang"><option>English</option><option>German</option><option>French</option><option>Spanish</option><option>Italian</option></select></label>
                </div>
                <label>Combine with a Nile Cruise Program (Optional)
                  <select name="linkedCruise">
                    <option value="Standalone Sightseeing Excursion">Book as Standalone Guided Excursion (or add to existing booking)</option>
                    ${(st.cruises || []).map(c => `<option value="${esc(c.title)}">Add to ${esc(c.title)} (${c.nights} Nights)</option>`).join('')}
                    ${(st.dahabiyas || []).map(d => `<option value="${esc(d.title)}">Add to ${esc(d.title)} (${d.nights} Nights)</option>`).join('')}
                  </select>
                </label>

                <div style="margin:18px 0">
                  <strong style="display:block;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8c6839;margin-bottom:10px">+ ADD MORE SIGHTSEEING PLACES along the Nile:</strong>
                  <div class="planner-addons-mini">
                    ${otherPlaces.map(op => `
                      <label class="check-field">
                        <input type="checkbox" name="extraSightseeing" value="${esc(op.title)}" data-extra-price="${Number(op.price) || 0}">
                        <span><strong>${esc(op.title)}</strong> (${esc(op.location)} · +${cur}${op.price} pp)</span>
                      </label>
                    `).join('')}
                  </div>
                </div>

                <label>Notes / Hotel or Cruise Ship Name<textarea name="notes" rows="3" placeholder="Tell us your hotel or cruise ship name, or any special requests..."></textarea></label>

                <div class="bf-submit-bar" style="margin-top:18px">
                  <div class="bf-submit-total">
                    <span>GUIDED TOUR TOTAL</span>
                    <strong id="sight-form-total">${cur}${(Number(place.price) || 55) * 2}</strong>
                    <small id="sight-form-sub">For 2 Guests · Private Egyptologist & Tickets Included</small>
                  </div>
                  <button type="submit" class="button btn-gold">Confirm Sightseeing Reservation <span>↗</span></button>
                </div>
              </form>
              <div id="sight-booking-success" hidden></div>
            </section>
          </article>

          <aside class="nct-aside-sticky">
            <div class="nct-bookcard">
              <div class="nct-bc-top">
                <div class="nct-bc-from">Guided Sightseeing Rate</div>
                <div class="nct-bc-price">${cur}${place.price} <span>/ ${esc(place.priceUnit || 'person')}</span></div>
                <div class="nct-bc-rate"><span class="stars">★★★★★</span> Private Egyptologist & Tickets</div>
              </div>
              <div class="nct-bc-body">
                <dl class="live-summary-dl">
                  <div><dt>Location</dt><dd>${esc(place.location)}</dd></div>
                  <div><dt>Monument</dt><dd>${esc(place.title)}</dd></div>
                  <div><dt>Duration</dt><dd>${esc(place.duration || 'Half Day')}</dd></div>
                  <div><dt>Tour Guide</dt><dd>Licensed Private Egyptologist</dd></div>
                </dl>
                <a href="#book-sightseeing" class="button btn-gold nct-bc-btn" data-scroll-to="book-sightseeing">Book This Excursion <span>↓</span></a>
                <a href="${p('nile-cruises')}" class="button btn-outline nct-bc-btn-sec">Add to a Nile Cruise Program ↗</a>
                <a href="${p('beyond-the-nile/nubian-and-the-nile')}" class="text-link" style="display:block;text-align:center;margin-top:14px">← Back to All 15 Places in Nubian & the Nile</a>
              </div>
            </div>
          </aside>
        </section>

        <section class="wrap section-space">
          ${sectionTitle('MORE PLACES IN NUBIAN & THE NILE', 'Explore other <em>guided monuments.</em>')}
          <div class="sight-cards-grid">
            ${otherPlaces.slice(0, 6).map(pl => renderSightseeingCard(pl, { showAddToggle: false })).join('')}
          </div>
        </section>
      `;
    }

    // Main Hub Page: #/beyond-the-nile/nubian-and-the-nile
    return `
      <section class="nct-hero has-video" style="--page-img:url('${IMG.sailing}')">
        ${renderHeroVideoBg(V + 'hero-dahabiya-1.mp4', IMG.sailing)}
        <div class="nct-hero-shade"></div>
        <div class="wrap nct-hero-inner">
          <div class="breadcrumb">
            <a href="${p('')}">Home</a><span>/</span>
            <a href="${p('beyond-the-nile')}">Beyond the Nile</a><span>/</span>
            Nubian and the Nile
          </div>
          <div class="nct-hero-badges">
            <span class="nct-badge-gold">BEYOND THE NILE · NUBIAN AND THE NILE</span>
            <span class="nct-badge-glass">15 Iconic Monuments & Nubian Villages</span>
            <span class="nct-badge-glass">Private Egyptologist Tour Guides</span>
          </div>
          <h1>Nubian and the Nile — Main Places to Visit</h1>
          <p class="nct-hero-sub">Discover the monumental temples, royal tombs and vibrant Nubian communities between Luxor, Esna, Edfu, Kom Ombo, Aswan and Abu Simbel. Browse each place below, view its guided price, and click <strong>"See More"</strong> for full trip details and booking.</p>
        </div>
      </section>

      <section class="wrap section-space">
        ${sectionTitle('SIGHTSEEING WITH TOUR GUIDE', 'Main Places to Visit <em>During a Nile Cruise.</em>', 'Filter by region along the Nile or click "See More" on any monument card to read the full excursion itinerary, inclusions and book.')}

        <!-- Filter Pills -->
        <div class="sight-filter-pills" id="hub-sight-filters">
          <button type="button" class="sight-pill active" data-sight-loc="all">All 15 Places (${places.length})</button>
          <button type="button" class="sight-pill" data-sight-loc="Luxor – East Bank">Luxor – East Bank</button>
          <button type="button" class="sight-pill" data-sight-loc="Luxor – West Bank">Luxor – West Bank</button>
          <button type="button" class="sight-pill" data-sight-loc="Luxor – North">Luxor – Dendera & Abydos</button>
          <button type="button" class="sight-pill" data-sight-loc="Esna,Edfu,Kom Ombo">Esna · Edfu · Kom Ombo</button>
          <button type="button" class="sight-pill" data-sight-loc="Aswan,Aswan – Abu Simbel,Aswan Nuba">Aswan · Abu Simbel · Nubia</button>
        </div>

        <!-- Visual Cards Grid (Photo + Short Definition + Price Box + See More Button) -->
        <div class="sight-cards-grid" id="hub-sight-grid">
          ${places.map(pl => renderSightseeingCard(pl, { showAddToggle: false })).join('')}
        </div>
      </section>

      <!-- Complete Reference Table of Main Places to Visit During a Nile Cruise -->
      <section class="wrap section-space" style="padding-top:0">
        <div class="nct-table-card">
          <div class="nct-table-head">
            ${label('QUICK REFERENCE GUIDE')}
            <h2>Main Places to Visit During a Nile Cruise <em>At a Glance</em></h2>
            <p>All 15 historic locations from Luxor to Aswan, Abu Simbel and Nubia with private Egyptologist tour guide pricing.</p>
          </div>
          <div class="nct-table-scroll">
            <table class="nct-places-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Places to Visit</th>
                  <th>Highlights</th>
                  <th>Guided Price</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                ${places.map(pl => `
                  <tr>
                    <td><span class="tbl-loc-badge">📍 ${esc(pl.location)}</span></td>
                    <td><strong>${esc(pl.title)}</strong></td>
                    <td>${esc(pl.highlights)}</td>
                    <td><strong class="tbl-price">${cur}${pl.price}</strong> <small>/ ${esc(pl.priceUnit || 'pp')}</small></td>
                    <td><a href="${p('beyond-the-nile/nubian-and-the-nile/' + pl.slug)}" class="tbl-seemore-link">See More ↗</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function customPageView(slug) {
    const st = CMS.getState();
    const page = (st.customPages || []).find(cp => cp.slug === slug && cp.enabled !== false);
    if (!page) return notfound();

    const allVessels = [...(st.cruises || []), ...(st.dahabiyas || [])].filter(v => v.enabled !== false);

    const renderBlock = (blk) => {
      switch (blk.type) {
        case 'editorial':
          return `<section class="wrap section-space">
            <div class="editorial-lede">
              ${label(esc(blk.eyebrow || page.eyebrow || 'NILETRAILS'))}
              <h2>${blk.heading || esc(page.title)}</h2>
              <p>${esc(blk.body || '')}</p>
              ${blk.ctaText ? `<div style="margin-top:28px">${button(esc(blk.ctaText), blk.ctaUrl || 'nile-cruises', 'btn-gold')}</div>` : ''}
            </div>
          </section>`;
        case 'highlights':
          return `<section class="wrap section-space" style="padding-top:20px">
            ${sectionTitle(esc(blk.eyebrow || 'HIGHLIGHTS'), blk.heading || 'What makes this <em>special.</em>')}
            <div class="three-notes">
              ${(blk.items || []).map((it, idx) => `
                <div>
                  <b>${esc(it.num || '0' + (idx + 1))}</b>
                  <h3>${esc(it.title)}</h3>
                  <p>${esc(it.text)}</p>
                </div>
              `).join('')}
            </div>
          </section>`;
        case 'programs-showcase': {
          const picked = (blk.cruiseSlugs && blk.cruiseSlugs.length)
            ? allVessels.filter(v => blk.cruiseSlugs.includes(v.slug))
            : allVessels.slice(0, 3);
          return `<section class="featured-section section-space">
            <div class="wrap">
              ${sectionTitle(esc(blk.eyebrow || 'FEATURED CRUISES & PROGRAMS'), blk.heading || 'Curated <em>Sailing Programs.</em>', esc(blk.sub || ''))}
              <div class="card-grid three">
                ${picked.map(v => miniCard(v, v.kind || 'cruise')).join('')}
              </div>
            </div>
          </section>`;
        }
        case 'addons-showcase': {
          const places = (st.sightseeingPlaces || []).filter(a => a.enabled !== false);
          return `<section class="wrap section-space">
            ${sectionTitle(esc(blk.eyebrow || 'SIGHTSEEING & ADD-ONS'), blk.heading || 'Customize with <em>Guided Tours.</em>', esc(blk.sub || ''))}
            <div class="sight-cards-grid">
              ${places.slice(0, 6).map(pl => renderSightseeingCard(pl, { showAddToggle: false })).join('')}
            </div>
          </section>`;
        }
        case 'faq':
          return `<section class="wrap section-space">
            ${sectionTitle(esc(blk.eyebrow || 'FREQUENTLY ASKED QUESTIONS'), blk.heading || 'Good to <em>know.</em>')}
            <div class="accordion travel-accordion">
              ${(blk.items || []).map((it, idx) => `
                <details ${idx === 0 ? 'open' : ''}>
                  <summary>${esc(it.q)}<span>+</span></summary>
                  <p>${esc(it.a)}</p>
                </details>
              `).join('')}
            </div>
          </section>`;
        case 'booking-form':
          return `<section class="wrap section-space" style="text-align:center">
            ${sectionTitle('READY TO SAIL?', blk.heading || 'Reserve Your Program', esc(blk.sub || ''))}
            ${button('Explore Nile Cruises & Book Program', 'nile-cruises', 'btn-gold')}
          </section>`;
        default:
          return '';
      }
    };

    return `${pageHero(esc(page.title), esc(page.eyebrow || 'EXPLORE'), esc(page.subtitle || ''), page.heroImage || IMG.sailing, V + 'hero-cruise-2.mp4')}
      ${(page.blocks || []).map(renderBlock).join('')}`;
  }

  function journeyListing() {
    const st = CMS.getState();
    const journeys = (st.journeys || []).filter(j => j.enabled !== false);
    return `${pageHero('Journeys', 'JOURNEYS', 'Not a fixed package. A more meaningful way to experience Egypt.', IMG.temple, V + 'hero-cruise-3.mp4')}<section class="wrap section-space"><div class="editorial-lede">${label('HOW WE TRAVEL')}<h2>Begin with an idea.<br><em>Make the journey yours.</em></h2><p>Our Journeys bring together Egypt’s most compelling places with the Nile at the centre. Each concept is a starting point to be adjusted to your time, interests and travel style.</p></div><div class="journeys-list">${journeys.map((j, i) => `<a class="journey-row" href="${p('journeys/' + j.slug)}"><span class="row-num">0${i + 1}</span><div class="journey-thumb">${photo(j.image, j.name)}</div><div><span class="overline">${esc(j.tag)}</span><h3>${esc(j.name)}</h3><p>${esc(j.route)}</p></div><span class="row-arrow">↗</span></a>`).join('')}</div></section>`;
  }

  function journeyDetail(j) {
    const st = CMS.getState();
    const journeys = (st.journeys || []).filter(x => x.enabled !== false);
    return `${pageHero(esc(j.name), 'TAILOR-MADE JOURNEY', esc(j.route), j.image, V + 'hero-cruise-2.mp4')}<section class="wrap journey-detail section-space"><div class="editorial-lede">${label('A JOURNEY TO MAKE YOUR OWN')}<h2>Explore more, <em>your way.</em></h2><p>${esc(j.summary)} We can adapt the pace, accommodation, Nile sailing experience and extensions to suit you.</p></div><div class="journey-details-grid"><div><h3>The journey at a glance</h3><div class="route-steps">${j.route.split(' · ').map((r, i) => `<div><span>0${i + 1}</span><strong>${esc(r)}</strong></div>`).join('')}</div><h3>Shape this experience around you</h3><p>Prefer longer on the river? Want time for a different part of Egypt? Each route is a suggested direction — not a rigid departure or fixed tour.</p></div><aside class="journey-aside"><h3>Your route. Your rhythm.</h3><p>Our travel designer will help turn this journey concept into a personalised itinerary.</p>${button('Customise This Journey', `plan-your-journey?interest=journey&experience=${j.slug}`, 'btn-gold')}</aside></div></section><section class="wrap related-section">${sectionTitle('KEEP DISCOVERING', 'More ideas, <em>more possibilities.</em>')}<div class="card-grid three">${journeys.filter(x => x.slug !== j.slug).slice(0, 3).map(x => miniCard(x, 'journey')).join('')}</div></section>`;
  }

  function destinationsPage() {
    const st = CMS.getState();
    const destinations = (st.destinations || []).filter(d => d.enabled !== false);
    const places = (st.sightseeingPlaces || []).filter(p => p.enabled !== false);
    return `${pageHero('Beyond the Nile', 'DESTINATIONS & NUBIAN HERITAGE', 'Explore Nubian and the Nile sightseeing, Cairo, the Red Sea and Egypt’s Western Desert.', IMG.temple, V + 'hero-dahabiya-2.mp4')}
      <section class="wrap section-space">
        ${sectionTitle('FEATURED SECTION · NUBIAN AND THE NILE', 'Main Places to Visit <em>During a Nile Cruise.</em>', 'Discover the 15 iconic temples, tombs and Nubian villages along the Nile with private Egyptologist tour guides and transparent pricing.', button('Open Nubian & the Nile (All 15 Places)', 'beyond-the-nile/nubian-and-the-nile', 'btn-gold'))}
        <div class="sight-cards-grid">
          ${places.slice(0, 6).map(pl => renderSightseeingCard(pl, { showAddToggle: false })).join('')}
        </div>
      </section>
      <section class="wrap section-space" style="padding-top:0">
        ${sectionTitle('DISCOVER EGYPT', 'Where will curiosity <em>take you?</em>', 'From Nubia and the Nile to Cairo, Alexandria, the Red Sea and the quiet beauty of the desert.')}
        <div class="destination-grid">
          ${destinations.map((d, i) => `<a href="${p('beyond-the-nile/' + d.slug)}" class="destination-tile ${i === 0 ? 'destination-feature' : ''}">${photo(d.image, d.name)}<div><small>0${i + 1} / BEYOND THE NILE</small><h3>${esc(d.name)}</h3><span>${esc(d.subtitle)} ↗</span></div></a>`).join('')}
        </div>
      </section>`;
  }

  function destinationDetail(d) {
    if (d.slug === 'nubian-and-the-nile' || d.isNubianHub) {
      return nubianAndTheNilePage('');
    }
    const st = CMS.getState();
    const journeys = (st.journeys || []).filter(j => j.enabled !== false);
    const selected = journeys.filter(j => j.route.toLowerCase().includes(d.name.split(' ')[0].toLowerCase())).slice(0, 2);
    return `${pageHero(esc(d.name), 'BEYOND THE NILE', esc(d.subtitle), d.image, V + 'hero-cruise-3.mp4')}<section class="wrap section-space"><div class="editorial-lede">${label('DISCOVER THIS DESTINATION')}<h2>Every place has <em>a story.</em></h2><p>${esc(d.desc)} Let NileTrails help connect this destination with the experiences that matter most to you.</p></div><div class="destination-detail-columns"><article><h3>Discover</h3><p>Explore the landscape, local culture and experiences that make ${esc(d.name)} distinctive. Travel details can be adjusted to your pace and interests.</p><h3>Experiences</h3><p>History, nature, food and local encounters can all add a richer perspective to your journey.</p><h3>Stay & travel</h3><p>Accommodation and transport recommendations will be matched to your travel dates and preferences.</p><h3>Suggested Journeys</h3><div class="related-journey-list">${(selected.length ? selected : journeys.slice(0, 2)).map(j => `<a href="${p('journeys/' + j.slug)}">${esc(j.name)}<span>↗</span></a>`).join('')}</div></article><aside class="destination-photo">${photo(IMG.sailing, 'Sailing on the Nile')}<div>Make this a part of your journey.${button('Plan Your Journey', 'plan-your-journey', 'btn-gold')}</div></aside></div></section>`;
  }

  function storyList() {
    const st = CMS.getState();
    const stories = (st.stories || []).filter(s => s.enabled !== false);
    const c = new URLSearchParams(location.hash.split('?')[1] || '').get('category') || '';
    let arr = stories.filter(s => !c || s.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === c);
    return `${pageHero('Nile Stories', 'NILE STORIES', 'A journal of places, people and the journeys in between.', IMG.temple)}<section class="wrap section-space">${sectionTitle('THE NILETRAILS JOURNAL', 'A little more <em>Egypt.</em>', 'Travel inspiration, useful ideas and glimpses of life along the river.')}<div class="pill-row"><a class="pill ${!c ? 'active' : ''}" href="${p('nile-stories')}">All Stories</a>${['Nile Cruise Guide', 'Dahabiya Life', 'Egypt Travel Guide', 'Temples & Tombs'].map(x => `<a class="pill ${c === x.toLowerCase().replace(/[^a-z0-9]+/g, '-') ? 'active' : ''}" href="${p('nile-stories?category=' + x.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${x}</a>`).join('')}</div><div class="story-grid">${arr.map(s => `<a href="${p('nile-stories/' + s.slug)}" class="story-feature">${photo(s.image, s.title)}<div><small>${esc(s.category)} / ${esc(s.date)}</small><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p><span>Read story ↗</span></div></a>`).join('')}</div>${arr.length ? '' : '<div class="no-results">No articles in this category yet.</div>'}</section>`;
  }

  function storyDetail(s) {
    return `<article class="story-detail"><div class="wrap story-heading"><div class="breadcrumb dark"><a href="${p('')}">Home</a> / <a href="${p('nile-stories')}">Nile Stories</a> / ${esc(s.category)}</div>${label(esc(s.category))}<h1>${esc(s.title)}</h1><p>${esc(s.summary)}</p></div><div class="story-cover">${photo(s.image, s.title)}</div><div class="story-reading"><p class="article-lead">${esc(s.summary)}</p><p>Every journey begins with curiosity. The Nile invites you to discover a culture and landscape that have shaped travellers for generations — whether from the deck of a traditional sailing vessel or during a carefully planned journey on land.</p><h2>Travel with a sense of discovery</h2><p>Think about your own pace, the places you most want to see and the experiences that are meaningful to you. The best itinerary is not always the busiest; there is beauty in allowing time for the unexpected.</p><h2>Make space for the moments</h2><p>A thoughtful Nile journey leaves room for the river, for local stories and for those small details that make travel memorable. Our team can help shape your experience around what matters to you.</p><div class="article-note"><b>Planning your own journey?</b><span>Start a conversation with a NileTrails travel designer.</span>${arrow('Plan Your Journey', 'plan-your-journey')}</div></div></article>`;
  }

  function about(page = '') {
    if (page === 'our-team') return `${pageHero('Our Team', 'ABOUT NILETRAILS', 'Real people who care about how you experience Egypt.', IMG.temple)}<section class="wrap section-space editorial-lede">${label('THE PEOPLE BEHIND THE JOURNEYS')}<h2>Travel is <em>personal.</em></h2><p>We believe thoughtful journeys begin with people who listen. Our team profiles and verified credentials will be published once confirmed by NileTrails.</p>${button('Meet your travel designer', 'contact', 'btn-outline')}</section>`;
    if (page === 'why-niletrails') return `${pageHero('Why NileTrails', 'ABOUT NILETRAILS', 'Thoughtful choices, memorable experiences, genuine discovery.', IMG.sailing)}<section class="wrap section-space editorial-lede">${label('WHAT WE BELIEVE')}<h2>Thoughtful travel,<br><em>beautifully considered.</em></h2><p>From choosing the right style of Nile sailing to connecting your favourite destinations, we focus on experiences that feel personal, unhurried and full of meaning.</p><div class="three-notes"><div><b>01</b><h3>River-led experiences</h3><p>The Nile connects our cruises, dahabiyas and journeys.</p></div><div><b>02</b><h3>Choice without pressure</h3><p>A range of travel styles, not a single definition of luxury.</p></div><div><b>03</b><h3>Designed around you</h3><p>Your interests and your pace shape the journey.</p></div></div></section>`;
    return `${pageHero(page === 'our-story' ? 'Our Story' : 'About NileTrails', 'ABOUT NILETRAILS', 'A different perspective on Egypt, with the river at its heart.', IMG.sailing)}<section class="about-split wrap section-space"><div class="about-image">${photo(IMG.temple, 'Egyptian temple at golden hour')}</div><div>${label('WHY WE EXIST')}<h2>Egypt is more than a place to visit.<br><em>It is a journey to feel.</em></h2><p>NileTrails is built around a simple idea: the most memorable travel happens when people, place and pace come together.</p><p>Our focus begins with the Nile — its remarkable landscapes, timeless cultures and the many ways to experience them — then extends across Egypt through thoughtfully designed journeys.</p>${button('Why Travel With Us', 'about/why-niletrails', 'btn-outline')}</div></section><section class="belief-section wrap">${sectionTitle('THE NILETRAILS APPROACH', 'Our approach to <em>exploring Egypt.</em>')}<div class="three-notes"><div><b>01</b><h3>Rooted in the Nile</h3><p>The river is our starting point, not the limit of what you can discover.</p></div><div><b>02</b><h3>Different ways to sail</h3><p>From comfortable cruises to traditional dahabiyas and private experiences.</p></div><div><b>03</b><h3>Personal from the start</h3><p>A journey designed around your interests, schedule and aspirations.</p></div></div></section>`;
  }

  function travelInfo() {
    return `${pageHero('Travel Information', 'BEFORE YOU GO', 'Thoughtful planning for a more enjoyable journey.', IMG.temple)}<section class="wrap section-space"><div class="editorial-lede">${label('PREPARE FOR EGYPT')}<h2>A little preparation.<br><em>A lot more discovery.</em></h2><p>These are general planning topics rather than legal or visa advice. Always verify current entry requirements, health guidance and travel conditions with official sources before departure.</p></div><div class="accordion travel-accordion">${[['When to visit', 'Egypt’s climate varies by region and season. Your ideal travel period depends on your preferred activities and tolerance for heat.'], ['Visas and entry', 'Entry requirements depend on your nationality and passport. Check the current requirements with official Egyptian authorities or your consulate.'], ['Packing for the Nile', 'Comfortable layers, sun protection, sensible walking shoes and respect for local customs are good starting points.'], ['Cruise routes and timings', 'Schedules, navigation conditions, vessel availability and sightseeing arrangements can vary. Confirm your departure details before booking.'], ['Travelling with family', 'Share the ages and interests of your group when enquiring so the pace and experience can be tailored.']].map(([a, b], i) => `<details ${i === 0 ? 'open' : ''}><summary>${a}<span>+</span></summary><p>${b}</p></details>`).join('')}</div></section>`;
  }

  function contact() {
    return `${pageHero('Start a Conversation', 'CONTACT US', 'Tell us what you imagine. We’ll help shape the journey.', IMG.sailing)}<section class="wrap contact-layout section-space"><div class="contact-copy">${label('WE WOULD LOVE TO HEAR FROM YOU')}<h2>Every great journey<br><em>starts here.</em></h2><p>Whether you know exactly how you want to travel or are still exploring the possibilities, share a few details and let us start planning together.</p><div class="contact-note"><b>What happens next?</b><p>We review your preferences, discuss the possibilities and help you refine the right direction for your trip.</p></div></div><form id="contact-form" class="contact-form"><h3>Send an enquiry</h3><div class="two-fields"><label>Full name *<input name="name" autocomplete="name" required placeholder="Your full name"></label><label>Email address *<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label></div><div class="two-fields"><label>Nationality / Country<input name="nationality" list="contact-countries" placeholder="Your country"><datalist id="contact-countries">${WORLD_COUNTRIES.map(c => `<option value="${c}"></option>`).join('')}</datalist></label><label>Phone / WhatsApp<input name="phone" type="tel" autocomplete="tel" placeholder="+44 / +1 ..."></label></div><div class="two-fields"><label>Interested in<select name="interest"><option>Nile Cruises & Programs</option><option>Dahabiyas</option><option>Nubian & the Nile Sightseeing</option><option>Journeys</option><option>Custom Add-ons Package</option></select></label><label>Travel period<input type="month" name="period"></label></div><label>Your message *<textarea name="message" required rows="5" placeholder="Tell us a little about your ideas..."></textarea></label><label class="check-field"><input type="checkbox" required> I agree to be contacted about my enquiry. *</label><div id="contact-feedback" class="form-feedback" role="status"></div><button class="button btn-gold" type="submit">Send Enquiry <span>↗</span></button></form></section>`;
  }

  function plan() {
    let qs = new URLSearchParams(location.hash.split('?')[1] || '');
    let type = qs.get('interest') || '';
    const st = CMS.getState();
    const addons = (st.addons || []).filter(a => a.enabled !== false);
    const places = (st.sightseeingPlaces || []).filter(p => p.enabled !== false);
    const cur = st.settings?.currencySymbol || '$';

    return `${pageHero('Plan Your Journey', 'TAILOR-MADE EGYPT', 'A journey entirely your own begins with a conversation.', IMG.sailing, V + 'hero-main.mp4')}<section class="wrap planner-layout section-space"><div class="planner-intro">${label('MAKE IT PERSONAL')}<h2>Dream it.<br><em>We will help design it.</em></h2><p>Tell us what you love, where you hope to go and how you like to travel. We will use your preferences to shape the beginning of your NileTrails experience.</p><div class="planner-benefits"><div><b>01</b><span>Choose your way to travel & sightseeing</span></div><div><b>02</b><span>Share your travel preferences</span></div><div><b>03</b><span>Tell us how to reach you</span></div></div></div><div class="planner-card"><div class="planner-progress"><span id="step-label">STEP 01 OF 03</span><div><i class="dot active"></i><i class="dot"></i><i class="dot"></i></div></div><form id="planner-form"><div class="plan-step" data-step="1"><h3>What kind of journey are you imagining?</h3><p>Start with the experiences that interest you most.</p><div class="choice-grid"><label class="choice"><input type="radio" name="interest" value="cruise" ${type === 'cruise' || !type ? 'checked' : ''} required><span>◈</span><b>Nile Cruise Program</b><small>3, 4 or 7-Night river exploration</small></label><label class="choice"><input type="radio" name="interest" value="dahabiya" ${type === 'dahabiya' ? 'checked' : ''}><span>△</span><b>Dahabiya Sailing</b><small>Traditional, intimate sailing</small></label><label class="choice"><input type="radio" name="interest" value="journey" ${type === 'journey' ? 'checked' : ''}><span>✧</span><b>Egypt Journey</b><small>Places, people and discovery</small></label><label class="choice"><input type="radio" name="interest" value="unsure" ${type === 'unsure' ? 'checked' : ''}><span>○</span><b>Help Me Choose</b><small>We’ll explore ideas together</small></label></div><div class="two-fields"><label>Destinations of interest<input name="destinations" placeholder="e.g. Luxor, Aswan, Abu Simbel, Nubian Village"></label><label>Approximate duration<select name="duration"><option value="">I’m flexible</option><option>3 Nights (Aswan → Luxor)</option><option>4 Nights (Luxor → Aswan)</option><option>7 Nights (Round Trip)</option><option>10–14 Nights (Cairo + Nile)</option></select></label></div></div><div class="plan-step" data-step="2" hidden><h3>Select Sightseeing with Tour Guide & Add-ons</h3><p>Choose any guided sightseeing places or extension programs you would like to include.</p><div class="two-fields"><label>Expected travel month<input type="month" name="month"></label><label>Number of travellers<select name="travellers"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5–8</option><option>9+</option></select></label></div><div class="two-fields"><label>Preferred comfort level<select name="comfort"><option>Open to suggestions</option><option>Luxury</option><option>Deluxe</option><option>Superior</option></select></label><label>Dietary requirements<select name="dietary"><option>No restrictions</option><option>Vegetarian / Vegan</option><option>Gluten-Free</option><option>Halal / Kosher</option><option>Other allergies</option></select></label></div><label>Sightseeing with Tour Guide & Program Add-ons</label><div class="planner-addons-mini">${places.map(pl => `<label class="check-field"><input type="checkbox" name="planAddons" value="Sightseeing: ${esc(pl.title)}"> <span><strong>${esc(pl.title)}</strong> (${esc(pl.location)} · +${cur}${pl.price})</span></label>`).join('')}${addons.map(a => `<label class="check-field"><input type="checkbox" name="planAddons" value="${esc(a.title)}"> <span><strong>${esc(a.title)}</strong> (${esc(a.duration)} · +${cur}${a.price})</span></label>`).join('')}</div><label>What matters most to you?<textarea name="notes" rows="3" placeholder="Interests, travel style, special occasions or anything you’d love to experience..."></textarea></label></div><div class="plan-step" data-step="3" hidden><h3>Where can we reach you?</h3><p>We’ll use these details only to respond to your travel enquiry.</p><div class="two-fields"><label>Full name *<input name="name" autocomplete="name" required placeholder="Your full name"></label><label>Email address *<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label></div><div class="two-fields"><label>Nationality / Country *<input name="country" list="plan-countries" autocomplete="country-name" required placeholder="Country of residence"><datalist id="plan-countries">${WORLD_COUNTRIES.map(c => `<option value="${c}"></option>`).join('')}</datalist></label><label>Phone / WhatsApp *<input name="phone" autocomplete="tel" type="tel" required placeholder="Include country code (e.g. +44...)"></label></div><label class="check-field"><input name="consent" type="checkbox" required> I consent to being contacted about this enquiry. *</label></div><div class="planner-error" id="planner-error" role="alert"></div><div class="planner-actions"><button type="button" id="plan-back" class="button btn-muted" hidden><span>←</span> Back</button><button type="button" id="plan-next" class="button btn-gold">Continue <span>↗</span></button><button type="submit" id="plan-send" class="button btn-gold" hidden>Submit Enquiry <span>↗</span></button></div><div class="planner-success" id="planner-success" hidden></div></form></div></section>`;
  }

  function legal(t) {
    const privacy = t === 'privacy';
    return `${pageHero(privacy ? 'Privacy Policy' : 'Terms & Conditions', privacy ? 'PRIVACY' : 'TERMS', 'Information about the website and its services.', IMG.temple)}<section class="wrap legal-body section-space"><h2>Publication placeholder</h2><p>This page is reserved for NileTrails’ reviewed ${privacy ? 'privacy policy' : 'booking and website terms'}.</p>${button('Contact NileTrails', 'contact', 'btn-outline')}</section>`;
  }

  function whyDahabiya() {
    return `${pageHero('Why Sail by Dahabiya?', 'THE DAHABIYA EXPERIENCE', 'Experience the Nile the traditional way — slowly, intimately and with care.', IMG.sailing, V + 'hero-dahabiya-1.mp4')}<section class="about-split wrap section-space"><div class="about-image">${photo(IMG.sailing, 'Sailing dahabiya on Nile')}</div><div>${label('THE ART OF SLOW TRAVEL')}<h2>Less rushing.<br><em>More remembering.</em></h2><p>For travellers who enjoy quieter moments, smaller vessels and a stronger connection to the river, the dahabiya offers an inspiring alternative to a conventional Nile cruise.</p><p>Explore luxury, deluxe and private sailing styles — then personalise the experience around you.</p>${button('Explore the Collection', 'dahabiyas', 'btn-outline')}</div></section>`;
  }

  function notfound() {
    return `<section class="notfound wrap"><span>404</span><h1>A different route awaits.</h1><p>That page isn’t part of this journey. Return to the NileTrails homepage.</p>${button('Back to Home', '', 'btn-primary')}</section>`;
  }

  function renderPageFaqSection(scope = 'all') {
    const st = CMS.getState();
    const allEnabled = (st.faqs || CMS.DEFAULT_FAQS || []).filter(f => f && f.enabled !== false);
    if (!allEnabled.length) return '';

    const seen = new Set();
    const picked = [];
    const pushItem = (item) => {
      if (!item || seen.has(item.id)) return;
      seen.add(item.id);
      picked.push(item);
    };

    // 1. Page-specific FAQs first
    allEnabled.filter(f => f.scope === scope).forEach(pushItem);
    // 2. Global FAQs next
    allEnabled.filter(f => !f.scope || f.scope === 'all').forEach(pushItem);
    // 3. Ensure every page always shows helpful FAQs even if custom filters exist
    if (picked.length < 4) {
      allEnabled.forEach(pushItem);
    }

    const visibleFaqs = picked.slice(0, 7);
    if (!visibleFaqs.length) return '';

    const scopeLabels = {
      home: 'NILE CRUISES & DAHABIYAS · FAQ',
      'nile-cruises': 'NILE CRUISES · FREQUENTLY ASKED QUESTIONS',
      dahabiyas: 'DAHABIYA SAILING · FREQUENTLY ASKED QUESTIONS',
      sightseeing: 'SIGHTSEEING & NUBIAN EXCURSIONS · FAQ',
      journeys: 'TAILORED EGYPT JOURNEYS · FAQ'
    };

    return `
      <section class="faq-section accordion wrap section-space" id="page-faq" aria-labelledby="page-faq-heading">
        <div class="faq-header-row">
          <div>
            ${label(scopeLabels[scope] || 'FREQUENTLY ASKED QUESTIONS')}
            <h2 id="page-faq-heading">Everything you need to know<br><em>before you set sail.</em></h2>
          </div>
          <button type="button" class="button btn-outline faq-toggle-all-btn" id="faq-toggle-all" aria-expanded="false">
            <span class="faq-expand-lbl">Expand All</span>
            <span class="faq-collapse-lbl">Collapse All</span>
          </button>
        </div>
        <div class="faq-list">
          ${visibleFaqs.map((faq, idx) => `
            <details class="faq-item"${idx === 0 ? ' open' : ''}>
              <summary>${esc(faq.question)}</summary>
              <div class="faq-answer"><p>${esc(faq.answer)}</p></div>
            </details>
          `).join('')}
        </div>
      </section>
    `;
  }

  function route() {
    const st = CMS.getState();
    const raw = location.hash.replace(/^#\/?/, '').split('?')[0].replace(/^\/+|\/+$/g, '');
    const seg = raw ? raw.split('/') : [];
    let body = '', title = 'Sailing the Nile';

    if (seg[0] === 'admin') {
      if (window.NileTrailsAdmin) {
        document.title = 'Admin Dashboard | ' + (st.settings?.brandName || 'NileTrails');
        window.NileTrailsAdmin.renderAdmin('#app');
        return;
      }
    }

    switch (seg[0] || '') {
      case '':
        body = home();
        title = 'Sailing the Nile';
        break;
      case 'nile-cruises':
        body = seg[1] ? detail('cruise', seg[1]) : listings('cruise');
        title = 'Nile Cruises & Programs';
        break;
      case 'dahabiyas':
        body = seg[1] ? (seg[1] === 'why-sail-by-dahabiya' ? whyDahabiya() : detail('dahabiya', seg[1])) : listings('dahabiya');
        title = 'Dahabiyas & Programs';
        break;
      case 'journeys': {
        let j = (st.journeys || []).find(x => x.slug === seg[1]);
        body = seg[1] ? (j ? journeyDetail(j) : notfound()) : journeyListing();
        title = j?.name || 'Journeys';
        break;
      }
      case 'beyond-the-nile': {
        if (seg[1] === 'nubian-and-the-nile') {
          body = nubianAndTheNilePage(seg[2] || '');
          title = seg[2] ? 'Sightseeing Excursion | Nubian and the Nile' : 'Nubian and the Nile — Main Places to Visit';
        } else {
          let d = (st.destinations || []).find(x => x.slug === seg[1]);
          body = seg[1] ? (d ? destinationDetail(d) : notfound()) : destinationsPage();
          title = d?.name || 'Beyond the Nile';
        }
        break;
      }
      case 'nile-stories': {
        let s = (st.stories || []).find(x => x.slug === seg[1]);
        body = seg[1] ? (s ? storyDetail(s) : notfound()) : storyList();
        title = s?.title || 'Nile Stories';
        break;
      }
      case 'page':
        body = seg[1] ? customPageView(seg[1]) : notfound();
        title = (st.customPages || []).find(cp => cp.slug === seg[1])?.title || 'Page';
        break;
      case 'about':
        body = about(seg[1] || '');
        title = 'About NileTrails';
        break;
      case 'plan-your-journey':
        body = plan();
        title = 'Plan Your Journey';
        break;
      case 'contact':
        body = contact();
        title = 'Contact';
        break;
      case 'travel-information':
        body = travelInfo();
        title = 'Travel Information';
        break;
      case 'privacy-policy':
        body = legal('privacy');
        title = 'Privacy Policy';
        break;
      case 'terms-and-conditions':
        body = legal('terms');
        title = 'Terms & Conditions';
        break;
      default: {
        const cpMatch = (st.customPages || []).find(cp => cp.slug === seg[0] && cp.enabled !== false);
        if (cpMatch) {
          body = customPageView(cpMatch.slug);
          title = cpMatch.title;
        } else {
          body = notfound();
          title = 'Page Not Found';
        }
      }
    }

    const faqScopeMap = {
      '': 'home',
      'nile-cruises': 'nile-cruises',
      'dahabiyas': 'dahabiyas',
      'beyond-the-nile': 'sightseeing',
      'journeys': 'journeys',
      'nile-stories': 'nile-stories',
      'about': 'about',
      'plan-your-journey': 'plan',
      'contact': 'contact',
      'travel-information': 'travel-info'
    };
    const faqScope = faqScopeMap[seg[0] || ''] || 'all';

    document.title = title + ' | ' + (st.settings?.brandName || 'NileTrails');
    $('#app').innerHTML = header() + `<main id="main">${body}${renderPageFaqSection(faqScope)}</main>` + footer();
    bind();
  }

  function bindProgramBookingForm() {
    const workspace = $('#program-workspace');
    const form = $('#program-booking-form');
    if (!workspace || !form) return;

    const basePrice = Number(workspace.dataset.basePrice) || 750;
    const cur = workspace.dataset.currency || '$';
    let lastGrandTotal = null;

    const dateInput = $('#bf-checkin', form);
    if (dateInput && !dateInput.value) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      dateInput.value = d.toISOString().split('T')[0];
    }

    function getSeasonRates(season) {
      const s = season === 'winter' ? 'winter' : 'summer';
      return {
        season: s,
        doubleRate: Number(workspace.dataset[s + 'Double']) || basePrice,
        tripleRate: Number(workspace.dataset[s + 'Triple']) || Math.round(basePrice * 0.96),
        singleRate: Number(workspace.dataset[s + 'Single']) || Math.round(basePrice * 1.65)
      };
    }

    const cabinKey = (s) => {
      const l = String(s || '').toLowerCase();
      if (l.includes('triple')) return 'triple';
      if (l.includes('single')) return 'single';
      if (l.includes('double')) return 'double';
      return l.trim();
    };

    function recalculateSummary(animatePulse = false) {
      const activeSeason = workspace.dataset.activeSeason === 'winter' ? 'winter' : 'summer';
      const rates = getSeasonRates(activeSeason);
      const checkedCabin = $('input[name="cabinName"]:checked', form);
      const cabinDelta = Number(checkedCabin?.dataset.cabinDelta) || 0;
      const cabinName = workspace.dataset.overrideCabin || checkedCabin?.value || 'Double Cabin';
      const adults = Number($('#bf-adults', form)?.value) || 2;
      const children = Number($('#bf-children', form)?.value) || 0;

      // Sync visual selection states between Step 01 radios and Pricing cards
      const selectedKey = cabinKey(cabinName);
      $$('.cabin-radio-card', form).forEach(lbl => {
        const inp = lbl.querySelector('input[type="radio"]');
        lbl.classList.toggle('is-selected', Boolean(inp && inp.checked && !workspace.dataset.overrideCabin));
      });
      $$('.nct-pcard[data-select-cabin]', workspace).forEach(card => {
        const cardKey = cabinKey(card.dataset.selectCabin);
        card.classList.toggle('is-selected', cardKey === selectedKey);
      });

      const lowerCabin = cabinName.toLowerCase();
      let ratePerAdult = rates.doubleRate + cabinDelta;
      if (lowerCabin.includes('triple')) ratePerAdult = rates.tripleRate;
      else if (lowerCabin.includes('single')) ratePerAdult = rates.singleRate;
      else if (lowerCabin.includes('double')) ratePerAdult = rates.doubleRate;

      const guestMultiplier = adults + (children * 0.5);
      const baseTotal = Math.round(ratePerAdult * guestMultiplier);

      // Combine both Program Add-ons checkboxes AND Sightseeing with Tour Guide checkboxes!
      const checkedAddons = $$('input[name="addons"]:checked', form);
      const checkedSightseeing = $$('.sight-journey-checkbox:checked', workspace);

      let addonsTotal = 0;
      const addonsHtml = [];
      const allSelectedItems = [];

      checkedSightseeing.forEach(chk => {
        const sTitle = chk.dataset.sightTitle || 'Sightseeing Tour';
        const sPrice = Number(chk.dataset.sightPrice) || 0;
        const sUnit = chk.dataset.sightUnit || 'per person';
        const itemCost = sUnit.includes('booking') ? sPrice : Math.round(sPrice * guestMultiplier);
        addonsTotal += itemCost;
        addonsHtml.push(`
          <li>
            <span>🏛 ${esc(sTitle)}</span>
            <span class="sum-item-actions">
              <strong>+${cur}${itemCost.toLocaleString()}</strong>
              <button type="button" class="sum-remove-btn" data-remove-chk="${esc(chk.id)}" title="Remove ${esc(sTitle)}" aria-label="Remove ${esc(sTitle)}">×</button>
            </span>
          </li>
        `);
        allSelectedItems.push({ id: chk.value, title: sTitle, price: sPrice });
      });

      checkedAddons.forEach(chk => {
        const aTitle = chk.dataset.addonTitle || 'Add-on';
        const aPrice = Number(chk.dataset.addonPrice) || 0;
        const aUnit = chk.dataset.addonUnit || 'per person';
        const itemCost = aUnit.includes('booking') ? aPrice : Math.round(aPrice * guestMultiplier);
        addonsTotal += itemCost;
        addonsHtml.push(`
          <li>
            <span>✦ ${esc(aTitle)}</span>
            <span class="sum-item-actions">
              <strong>+${cur}${itemCost.toLocaleString()}</strong>
              <button type="button" class="sum-remove-btn" data-remove-chk="${esc(chk.id)}" title="Remove ${esc(aTitle)}" aria-label="Remove ${esc(aTitle)}">×</button>
            </span>
          </li>
        `);
        allSelectedItems.push({ id: chk.value, title: aTitle, price: aPrice });
      });

      const grandTotal = baseTotal + addonsTotal;
      const perPersonAvg = guestMultiplier > 0 ? Math.round(grandTotal / guestMultiplier) : grandTotal;
      const seasonShort = activeSeason === 'winter' ? 'Sep – Apr' : 'May – Aug';
      const seasonFull = activeSeason === 'winter' ? 'Sep – Apr (Peak)' : 'May – Aug (Summer)';
      const guestsLabel = `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}`;

      // Update TOP Sticky Price Card Header automatically
      if ($('#bc-top-label')) {
        $('#bc-top-label').textContent = allSelectedItems.length
          ? `LIVE PACKAGE · ${allSelectedItems.length} ADDED`
          : 'LIVE PACKAGE PRICE';
      }
      if ($('#bc-season-pill')) $('#bc-season-pill').textContent = seasonShort;
      if ($('#bc-top-price')) {
        $('#bc-top-price').innerHTML = `${cur}${grandTotal.toLocaleString()} <span>total · ${cur}${perPersonAvg.toLocaleString()}/pp</span>`;
      }
      if ($('#bc-top-breakdown')) {
        const vesselLbl = $('#bc-top-breakdown').dataset.vesselLabel || 'Cruise';
        $('#bc-top-breakdown').textContent = allSelectedItems.length
          ? `${vesselLbl} ${cur}${baseTotal.toLocaleString()} + ${allSelectedItems.length} Extras (${cur}${addonsTotal.toLocaleString()}) · ${guestsLabel}`
          : `${vesselLbl} ${cur}${baseTotal.toLocaleString()} · ${guestsLabel} · 0 Extras`;
      }

      if ($('#sum-season-name')) $('#sum-season-name').textContent = seasonFull;
      if ($('#sum-cabin-name')) $('#sum-cabin-name').textContent = cabinName;
      if ($('#sum-guests')) $('#sum-guests').textContent = guestsLabel;
      if ($('#sum-base-calc')) $('#sum-base-calc').textContent = `${cur}${ratePerAdult} × ${adults}${children ? ` + ${children} chd` : ''} = ${cur}${baseTotal.toLocaleString()}`;
      if ($('#sum-extras-count')) $('#sum-extras-count').textContent = String(allSelectedItems.length);
      if ($('#sum-extras-subtotal')) $('#sum-extras-subtotal').textContent = addonsTotal > 0 ? `+${cur}${addonsTotal.toLocaleString()}` : `${cur}0`;

      if ($('#sum-addons-list')) {
        $('#sum-addons-list').innerHTML = addonsHtml.length
          ? addonsHtml.join('')
          : '<li class="empty-addon-note">Tick any Sightseeing Tour or Program Add-on on the left to add it to your journey.</li>';
      }
      if ($('#sum-grand-total')) $('#sum-grand-total').textContent = `${cur}${grandTotal.toLocaleString()}`;
      if ($('#bf-inline-total')) $('#bf-inline-total').textContent = `${cur}${grandTotal.toLocaleString()}`;
      if ($('#bf-inline-sub')) $('#bf-inline-sub').textContent = `For ${adults} Adult${adults > 1 ? 's' : ''}${children ? ` & ${children} Child` : ''} (${seasonShort}) · ${allSelectedItems.length} Add-on${allSelectedItems.length === 1 ? '' : 's'} / Sightseeing included`;

      if (animatePulse && lastGrandTotal !== null && lastGrandTotal !== grandTotal) {
        const card = $('#live-price-card');
        if (card) {
          card.classList.remove('price-updated');
          void card.offsetWidth;
          card.classList.add('price-updated');
        }
      }
      lastGrandTotal = grandTotal;

      return { grandTotal, cabinName, adults, children, selectedAddons: allSelectedItems };
    }

    // Remove item directly from Sticky Card list
    $('#sum-addons-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-chk]');
      if (!btn) return;
      const targetId = btn.getAttribute('data-remove-chk');
      const chk = document.getElementById(targetId);
      if (chk && chk.checked) {
        chk.checked = false;
        chk.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Clicking any Cabin Card inside #pricing selects that cabin & recalculates immediately
    $$('.nct-pcard[data-select-cabin]', workspace).forEach(card => {
      const selectCardCabin = () => {
        const targetKey = cabinKey(card.dataset.selectCabin);
        const matchRadio = $$('input[name="cabinName"]', form).find(r => cabinKey(r.value) === targetKey);
        if (matchRadio) {
          delete workspace.dataset.overrideCabin;
          matchRadio.checked = true;
          matchRadio.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          workspace.dataset.overrideCabin = card.dataset.selectCabin;
          recalculateSummary(true);
        }
      };
      card.addEventListener('click', selectCardCabin);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCardCabin();
        }
      });
    });

    // Clear override if user clicks any explicit cabin radio in Step 01
    $$('input[name="cabinName"]', form).forEach(r => {
      r.addEventListener('change', () => { delete workspace.dataset.overrideCabin; });
    });

    // Expose recalculation hook for season switcher or external controls
    workspace.addEventListener('niletrails:recalc', () => recalculateSummary(true));

    form.addEventListener('change', () => recalculateSummary(true));
    $$('.sight-journey-checkbox', workspace).forEach(chk => {
      chk.addEventListener('change', () => {
        const btnText = chk.parentElement?.querySelector('.spc-add-btn-text');
        if (btnText) {
          btnText.textContent = chk.checked ? '✓ Added to Journey' : '+ Add to Journey';
        }
        chk.closest('.sight-place-card')?.classList.toggle('is-added', chk.checked);
        recalculateSummary(true);
      });
    });

    form.addEventListener('input', () => {
      if ($('#bf-error-msg')) $('#bf-error-msg').textContent = '';
    });
    recalculateSummary(false);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = $('#bf-error-msg');
      if (!form.checkValidity()) {
        const firstInvalid = form.querySelector(':invalid');
        if (errBox) {
          errBox.textContent = 'Please complete all required international guest fields (marked with *) to submit your booking.';
        }
        firstInvalid?.focus();
        return;
      }

      const submitBtn = $('#bf-submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      const fd = new FormData(form);
      const calc = recalculateSummary();
      const refId = 'NT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const dial = fd.get('dialCode') || '';
      const rawPhone = String(fd.get('clientPhone') || '').trim();
      const fullPhone = rawPhone.startsWith('+') ? rawPhone : `${dial} ${rawPhone}`.trim();

      const enquiryPayload = {
        id: refId,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'New',
        vesselSlug: fd.get('vesselSlug'),
        vesselTitle: fd.get('vesselTitle'),
        programId: fd.get('programId'),
        programSlug: fd.get('programSlug'),
        programTitle: fd.get('programTitle'),
        cabinName: calc.cabinName,
        bedConfig: fd.get('bedConfig'),
        checkInDate: fd.get('checkInDate'),
        dateFlexibility: fd.get('dateFlexibility'),
        adults: calc.adults,
        children: calc.children,
        selectedAddons: calc.selectedAddons,
        estimatedTotal: calc.grandTotal,
        clientName: fd.get('clientName'),
        clientEmail: fd.get('clientEmail'),
        clientPhone: fullPhone,
        nationality: fd.get('nationality'),
        passportReady: fd.get('passportReady'),
        dietary: fd.get('dietary'),
        occasion: fd.get('occasion'),
        flightTransfer: fd.get('flightTransfer'),
        notes: fd.get('notes')
      };

      await CMS.submitEnquiry(enquiryPayload);

      const successBox = $('#bf-success-box');
      form.hidden = true;
      if (successBox) {
        successBox.hidden = false;
        successBox.innerHTML = `
          <div class="booking-confirmed-card">
            <div class="bc-icon">✓</div>
            <span class="eyebrow"><span class="eyebrow-mark"></span>BOOKING REQUEST RECEIVED · REF #${esc(refId)}</span>
            <h3>Thank you, ${esc(enquiryPayload.clientName)}!</h3>
            <p>Your reservation request for <strong>${esc(enquiryPayload.programTitle)}</strong> aboard <strong>${esc(enquiryPayload.vesselTitle)}</strong> has been registered in our concierge system.</p>
            <div class="bc-summary-grid">
              <div><small>REFERENCE ID</small><strong>${esc(refId)}</strong></div>
              <div><small>CHECK-IN DATE</small><strong>${esc(enquiryPayload.checkInDate)} (${esc(enquiryPayload.dateFlexibility)})</strong></div>
              <div><small>CABIN & PARTY</small><strong>${esc(enquiryPayload.cabinName)} · ${calc.adults} Adults${calc.children ? `, ${calc.children} Children` : ''}</strong></div>
              <div><small>NATIONALITY</small><strong>${esc(enquiryPayload.nationality)}</strong></div>
              <div><small>SIGHTSEEING & ADD-ONS</small><strong>${calc.selectedAddons.length ? calc.selectedAddons.map(a => esc(a.title)).join(' + ') : 'Standard Program Sightseeing'}</strong></div>
              <div><small>ESTIMATED PACKAGE TOTAL</small><strong style="color:#a57a47;font-size:18px">${cur}${calc.grandTotal.toLocaleString()}</strong></div>
            </div>
            <p style="font-size:13px;color:#5d727d">Our Egypt travel specialist will review your dates and send your formal confirmation dossier to <strong>${esc(enquiryPayload.clientEmail)}</strong> and WhatsApp <strong>${esc(enquiryPayload.clientPhone)}</strong>.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px">
              <a href="${p('admin')}" class="button btn-gold">View in Admin Dashboard <span>↗</span></a>
              <button type="button" class="button btn-outline" id="bf-book-another">Modify / Submit Another Request</button>
            </div>
          </div>
        `;
        $('#bf-book-another')?.addEventListener('click', () => {
          form.hidden = false;
          successBox.hidden = true;
          if (submitBtn) submitBtn.disabled = false;
        });
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function bindSightseeingDetailForm() {
    const form = $('#sightseeing-booking-form');
    if (!form) return;
    const st = CMS.getState();
    const cur = st.settings?.currencySymbol || '$';
    const primaryPrice = Number(form.querySelector('input[name="primaryPlacePrice"]')?.value) || 55;
    const primaryTitle = form.querySelector('input[name="primaryPlaceTitle"]')?.value || 'Sightseeing Tour';

    const dateIn = form.querySelector('input[name="checkInDate"]');
    if (dateIn && !dateIn.value) {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      dateIn.value = d.toISOString().split('T')[0];
    }

    function updateSightTotal() {
      const guests = Number($('#sight-guests', form)?.value) || 2;
      let perPerson = primaryPrice;
      const extras = $$('input[name="extraSightseeing"]:checked', form);
      extras.forEach(ex => {
        perPerson += Number(ex.dataset.extraPrice) || 0;
      });
      const total = perPerson * guests;
      if ($('#sight-form-total')) $('#sight-form-total').textContent = `${cur}${total.toLocaleString()}`;
      if ($('#sight-form-sub')) $('#sight-form-sub').textContent = `For ${guests} Guest${guests > 1 ? 's' : ''} · ${1 + extras.length} Guided Sightseeing Tour${extras.length ? 's' : ''}`;
      return { total, guests, extras: extras.map(e => ({ id: 'sight-extra', title: e.value, price: Number(e.dataset.extraPrice) || 0 })) };
    }

    form.addEventListener('change', updateSightTotal);
    updateSightTotal();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const calc = updateSightTotal();
      const refId = 'NT-SIGHT-' + Math.floor(1000 + Math.random() * 9000);
      await CMS.submitEnquiry({
        id: refId,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'New',
        vesselTitle: fd.get('linkedCruise') || 'Nubian & the Nile Sightseeing',
        programTitle: `Guided Sightseeing: ${primaryTitle}`,
        cabinName: `Private Egyptologist (${fd.get('guideLang') || 'English'})`,
        checkInDate: fd.get('checkInDate'),
        adults: calc.guests,
        children: 0,
        selectedAddons: [{ id: 'primary-sight', title: primaryTitle, price: primaryPrice }, ...calc.extras],
        estimatedTotal: calc.total,
        clientName: fd.get('clientName'),
        clientEmail: fd.get('clientEmail'),
        clientPhone: fd.get('clientPhone'),
        nationality: fd.get('nationality'),
        notes: fd.get('notes')
      });
      form.hidden = true;
      const sBox = $('#sight-booking-success');
      if (sBox) {
        sBox.hidden = false;
        sBox.innerHTML = `
          <div class="booking-confirmed-card">
            <div class="bc-icon">✓</div>
            <span class="eyebrow"><span class="eyebrow-mark"></span>SIGHTSEEING RESERVATION RECEIVED · #${esc(refId)}</span>
            <h3>Thank you, ${esc(fd.get('clientName'))}!</h3>
            <p>Your guided sightseeing reservation for <strong>${esc(primaryTitle)}</strong> has been saved. Estimated total: <strong>${cur}${calc.total.toLocaleString()}</strong>.</p>
            <div style="display:flex;gap:12px;justify-content:center;margin-top:18px">
              <a href="${p('beyond-the-nile/nubian-and-the-nile')}" class="button btn-outline">Explore More Sightseeing Places</a>
              <a href="${p('admin')}" class="button btn-gold">View in Admin Dashboard ↗</a>
            </div>
          </div>
        `;
      }
    });
  }

  function bind() {
    const st = CMS.getState();
    const toggle = $('#menu-toggle'), panel = $('#mobile-panel');
    toggle?.addEventListener('click', () => {
      let open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      toggle.textContent = open ? '☰' : '✕';
      panel.hidden = open;
    });
    $$('.mobile-panel a').forEach(a => a.addEventListener('click', () => { if (panel) panel.hidden = true; }));

    // Ensure all background videos play smoothly
    $$('.hero-bg-video').forEach(v => {
      v.muted = true;
      v.play().catch(() => {});
    });

    // Smooth scroll links inside detail page (Overview / Itinerary / Facilities / Sightseeing / Pricing / Book)
    $$('[data-scroll-to]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-scroll-to');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          $$('.nct-sublink').forEach(l => l.classList.toggle('active', l === link));
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Interactive Route Map Stops -> Highlight & scroll to Day Card
    $$('[data-day-jump]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-day-jump');
        $$('.nct-rstop').forEach(b => b.classList.toggle('on', b === btn));
        $$('.nct-daycard').forEach((card, i) => card.classList.toggle('hot', String(i) === String(idx)));
        const dayEl = document.getElementById('nct-day-' + idx);
        dayEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // Interactive Season Pricing Toggle (May – Aug vs Sep – Apr)
    $$('#nct-seg-season button').forEach(btn => {
      btn.addEventListener('click', () => {
        const season = btn.dataset.season === 'winter' ? 'winter' : 'summer';
        $$('#nct-seg-season button').forEach(b => b.classList.toggle('on', b === btn));
        $$('.nct-pv').forEach(pv => {
          const val = pv.getAttribute('data-' + season);
          if (val) pv.textContent = val;
        });
        const ws = document.getElementById('program-workspace');
        if (ws) {
          ws.dataset.activeSeason = season;
          ws.dispatchEvent(new CustomEvent('niletrails:recalc'));
        }
      });
    });

    // Accessible FAQ Expand All / Collapse All Button (modern-web-guidance accordion)
    const faqSection = document.getElementById('page-faq');
    const faqToggleAll = document.getElementById('faq-toggle-all');
    if (faqSection && faqToggleAll) {
      const faqDetails = () => $$('details.faq-item', faqSection);
      const syncFaqButton = () => {
        const items = faqDetails();
        const allOpen = items.length > 0 && items.every(d => d.open);
        faqToggleAll.setAttribute('aria-expanded', String(allOpen));
      };
      faqToggleAll.addEventListener('click', () => {
        const expand = faqToggleAll.getAttribute('aria-expanded') !== 'true';
        faqDetails().forEach(d => { d.open = expand; });
        syncFaqButton();
      });
      faqDetails().forEach(d => {
        d.addEventListener('toggle', syncFaqButton);
      });
      syncFaqButton();
    }

    // Sightseeing Location Filter Pills (works both inside Cruise Programs and in Nubian & the Nile Hub)
    $$('.sight-filter-pills .sight-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const parentBar = pill.closest('.sight-filter-pills');
        parentBar.querySelectorAll('.sight-pill').forEach(p => p.classList.toggle('active', p === pill));
        const locFilter = pill.getAttribute('data-sight-loc') || 'all';
        const allowedLocs = locFilter.split(',').map(s => s.trim().toLowerCase());
        const section = pill.closest('section');
        const cards = section ? $$('.sight-place-card', section) : $$('.sight-place-card');
        cards.forEach(card => {
          const cardLoc = (card.getAttribute('data-location') || '').toLowerCase();
          const show = locFilter === 'all' || allowedLocs.some(al => cardLoc.includes(al));
          card.style.display = show ? '' : 'none';
        });
      });
    });

    // Program tab switching inside Cruise / Dahabiya detail page
    $$('[data-prog-switch]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const progSlug = el.getAttribute('data-prog-switch');
        const baseHash = location.hash.split('?')[0];
        location.hash = `${baseHash}?program=${encodeURIComponent(progSlug)}`;
        setTimeout(() => {
          document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      });
    });

    bindProgramBookingForm();
    bindSightseeingDetailForm();

    $('#quick-type')?.addEventListener('change', e => {
      const type = e.target.value, el = $('#quick-style');
      el.disabled = type === 'journeys' || type.includes('nubian');
      let options = type === 'dahabiyas' ? ['Luxury', 'Deluxe', 'Private'] : (type === 'journeys' || type.includes('nubian')) ? [] : ['Luxury', 'Deluxe', 'Superior'];
      el.innerHTML = '<option value="">All styles</option>' + options.map(x => `<option value="${x.toLowerCase()}">${x}</option>`).join('');
    });

    $('#quick-search')?.addEventListener('submit', e => {
      e.preventDefault();
      let t = $('#quick-type').value, s = $('#quick-style').value, n = $('#quick-nights').value;
      if (t.includes('nubian')) {
        location.hash = p(t);
        return;
      }
      location.hash = p(t + ((s && t !== 'journeys') ? '?category=' + s : '') + (n && t !== 'journeys' ? (s ? '&' : '?') + 'nights=' + n : ''));
    });

    let fav = [];
    try { fav = JSON.parse(localStorage.getItem('niletrails-shortlist') || '[]'); } catch {}

    if ($('#results-grid')) {
      let params = new URLSearchParams(location.hash.split('?')[1] || '');
      const initialN = params.get('nights') || '';
      if (initialN && $('#filter-duration')) $('#filter-duration').value = initialN;
      function update() {
        let type = location.hash.startsWith('#/nile-cruises') ? 'cruise' : 'dahabiya';
        let xs = (type === 'cruise' ? st.cruises : st.dahabiyas).filter(x => x.enabled !== false);
        let cat = $('#filter-category').value, routeVal = $('#filter-route').value, night = $('#filter-duration').value, sort = $('#filter-sort').value;
        xs = xs.filter(x => (!cat || x.tier.toLowerCase() === cat) && (!routeVal || x.route === routeVal) && (!night || String(x.nights) === night));
        if (sort === 'duration-asc') xs.sort((a, b) => a.nights - b.nights);
        if (sort === 'duration-desc') xs.sort((a, b) => b.nights - a.nights);
        $('#results-grid').innerHTML = xs.length ? xs.map(x => miniCard(x, type)).join('') : '<div class="no-results">No exact matches. Try adjusting your filters, or ask us to find a tailored option.</div>';
        $('#results-count').textContent = `${xs.length} experience${xs.length === 1 ? '' : 's'} to explore`;
        syncSaves();
      }
      $$('.filters-fields select').forEach(x => x.addEventListener('change', update));
      $('#reset-filters')?.addEventListener('click', () => { $$('.filters-fields select').forEach(e => e.value = ''); update(); });
      update();
    }

    function syncSaves() {
      $$('[data-save]').forEach(x => {
        let saved = fav.includes(x.dataset.save);
        x.classList.toggle('saved', saved);
        x.setAttribute('aria-pressed', String(saved));
        x.querySelector('span').textContent = saved ? '♥' : '♡';
      });
    }
    document.onclick = e => {
      let b = e.target.closest?.('[data-save]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      let v = b.dataset.save;
      fav = fav.includes(v) ? fav.filter(x => x !== v) : [...fav, v];
      try { localStorage.setItem('niletrails-shortlist', JSON.stringify(fav)); } catch {}
      syncSaves();
    };
    syncSaves();

    const form = $('#planner-form');
    if (form) {
      let step = 1;
      function paint() {
        $$('.plan-step', form).forEach(x => x.hidden = +x.dataset.step !== step);
        $('#plan-back').hidden = step === 1;
        $('#plan-next').hidden = step === 3;
        $('#plan-send').hidden = step !== 3;
        $('#step-label').textContent = 'STEP 0' + step + ' OF 03';
        $$('.planner-progress .dot').forEach((x, i) => x.classList.toggle('active', i < step));
        $('#planner-error').textContent = '';
      }
      function validateStep() {
        let fields = $$(`.plan-step[data-step="${step}"] [required]`, form);
        let bad = fields.find(x => !x.checkValidity());
        if (bad) {
          $('#planner-error').textContent = bad.name === 'consent' ? 'Please confirm your contact preference.' : 'Please complete the required fields to continue.';
          bad.focus();
          return false;
        }
        return true;
      }
      $('#plan-next').onclick = () => { if (validateStep()) { step++; paint(); $('.planner-card').scrollIntoView({ block: 'start', behavior: 'smooth' }); } };
      $('#plan-back').onclick = () => { step--; paint(); };
      form.onsubmit = async e => {
        e.preventDefault();
        if (!validateStep()) return;
        const data = new FormData(form);
        const name = data.get('name');
        const pickedAddons = data.getAll('planAddons').map(t => ({ id: 'plan-addon', title: t, price: 0 }));
        const refId = 'NT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        await CMS.submitEnquiry({
          id: refId,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'New',
          vesselTitle: 'Custom Journey Planner (' + (data.get('interest') || 'General') + ')',
          programTitle: (data.get('destinations') || 'Tailor-Made Route') + ' (' + (data.get('duration') || 'Flexible') + ')',
          cabinName: data.get('comfort') || 'Flexible',
          checkInDate: data.get('month') || 'Flexible',
          adults: data.get('travellers') || 2,
          children: 0,
          selectedAddons: pickedAddons,
          estimatedTotal: 'Custom Quote',
          clientName: name,
          clientEmail: data.get('email'),
          clientPhone: data.get('phone'),
          nationality: data.get('country'),
          dietary: data.get('dietary') || 'None',
          notes: data.get('notes')
        });
        form.innerHTML = `<div class="completion"><span>✓</span><h3>Your journey starts here, ${esc(name)}.</h3><p>Reference <strong>#${esc(refId)}</strong> has been saved to our concierge system. You can view it in the Admin Dashboard.</p>${button('Return to Home', '', 'btn-outline')}</div>`;
      };
      paint();
    }

    const contactForm = $('#contact-form');
    if (contactForm) {
      contactForm.onsubmit = async e => {
        e.preventDefault();
        if (!contactForm.reportValidity()) return;
        const fd = new FormData(contactForm);
        const refId = 'NT-MSG-' + Math.floor(1000 + Math.random() * 9000);
        await CMS.submitEnquiry({
          id: refId,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'New',
          vesselTitle: 'Contact Enquiry (' + (fd.get('interest') || 'General') + ')',
          programTitle: 'Direct Contact Message',
          cabinName: '-',
          checkInDate: fd.get('period') || 'Flexible',
          adults: 2,
          children: 0,
          selectedAddons: [],
          estimatedTotal: 'Enquiry',
          clientName: fd.get('name'),
          clientEmail: fd.get('email'),
          clientPhone: fd.get('phone') || '-',
          nationality: fd.get('nationality') || '-',
          notes: fd.get('message')
        });
        $('#contact-feedback').textContent = `Thank you! Your enquiry (#${refId}) has been received and saved to the Admin Panel.`;
        contactForm.reset();
      };
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = location.hash;
    // Don't scroll to top if switching programs on the same page
    if (!hash.includes('?program=')) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    route();
  });

  window.addEventListener('DOMContentLoaded', async () => {
    await CMS.sync();
    route();
  });
})();
