(function (global) {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = (key, params) => global.CilentomaniaI18n.t('operatorProfile.' + key, '', params);
  const paths = {
    call: 'M6 3h4l2 5-3 2c2 4 3 5 7 7l2-3 5 2v4c-1 3-7 2-12-3S2 4 6 3Z',
    whatsapp: 'M20 11a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4Z M9 7c0 4 2 6 6 6',
    directions: 'm12 2 10 10-10 10L2 12 10-10Z M8 15v-4h8m-3-3 3 3-3 3',
    book: 'M4 5h16v16H4V5Zm0 5h16M8 2v5m8-5v5m-9 8 3 3 6-6',
    arrow: 'M4 12h16m-6-6 6 6-6 6',
    pin: 'M12 22s8-8 8-13a8 8 0 0 0-16 0c0 5 8 13 8 13Zm0-16a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
    wifi: 'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01',
    pool: 'M3 18q3-3 6 0t6 0 6 0M3 22q3-3 6 0t6 0 6 0M8 15V4a2 2 0 0 1 4 0m3 11V4a2 2 0 0 1 4 0M8 7h7m-7 5h7',
    parking: 'M4 3h16v18H4V3Zm6 14V7h3a3 3 0 0 1 0 6h-3',
    breakfast: 'M4 9h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Zm12 1h2a3 3 0 0 1 0 6h-2M7 3v3m5-3v3',
    sea_view: 'M3 18q3-3 6 0t6 0 6 0M12 3v3M4 6l2 2m14-2-2 2M7 14a5 5 0 0 1 10 0',
    air_conditioning: 'M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3',
    rooms: 'M3 20V8m18 12V8M3 15h18M6 8h5v7H6V8Zm7 0h5v7h-5V8Z',
    beds: 'M3 21V5h18v16M3 16h18M7 8h4v4H7V8Zm6 0h4v4h-4V8Z',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
    pets: 'M8 15c-4 4 0 7 4 4 4 3 8 0 4-4l-4-4-4 4ZM5 8h.01M10 5h.01M15 5h.01M20 8h.01',
    accessible: 'M12 3h.01M5 7h14m-7 0v7m0 0-5 7m5-7 5 7',
    family: 'M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 21v-6a6 6 0 0 1 12 0v6m1-6a4 4 0 0 1 7 3v3',
    check: 'm5 12 4 4L19 6',
    image: 'M3 3h18v18H3V3Zm0 14 6-6 4 4 3-3 5 5M16 7h.01'
  };
  const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key] || paths.check}"/></svg>`;
  const image = (src, alt, extra = '') => `<img src="${escape(src)}" alt="${escape(alt)}" width="1280" height="800" decoding="async" ${extra}>`;
  function render(profile, context) {
    const p = profile, e = escape, actions = global.OperatorProfileModel.actions(p);
    const galleryAlt = index => t(p.photosIllustrative ? 'territoryPhoto' : 'photo', { name: p.photosIllustrative ? 'Cilento' : p.name, index: index + 1 });
    const ctas = actions.map(action => action.enabled
      ? `<a class="op-action ${action.key === 'book' ? 'op-action--primary' : ''}" href="${e(action.href)}" ${action.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${icon(action.key)}<span>${e(t(action.key))}</span></a>`
      : `<button type="button" class="op-action ${action.key === 'book' ? 'op-action--primary' : ''}" aria-disabled="true" data-op-unavailable>${icon(action.key)}<span>${e(t(action.key))}</span></button>`).join('');
    const state = value => t(value === null ? 'unknown' : value ? 'yes' : 'no');
    const features = [
      ['roomCount', p.features.roomCount ?? t('unknown'), 'rooms'],
      ['beds', p.features.beds ?? t('unknown'), 'beds'],
      ['checkIn', p.features.checkIn || t('unknown'), 'clock'],
      ['checkOut', p.features.checkOut || t('unknown'), 'clock'],
      ['rooms', p.features.rooms.join(' · ') || t('unknown')],
      ['board', p.features.board.join(' · ') || t('unknown')],
      ['opening', p.features.opening || t('unknown')],
      ['yearRound', state(p.features.yearRound), 'book'], ['pets', state(p.features.pets)], ['accessible', state(p.features.accessible)], ['family', state(p.features.family)]
    ].map(([key, value, symbol]) => `<div>${icon(symbol || ({opening:"book",board:"breakfast"}[key]) || key)}<dt>${e(t(key))}</dt><dd>${e(value)}</dd></div>`).join('');
    const relatedHtml = (p.territoryContent || []).map(item => `<details class="op-territory-card"><summary>${image(item.image,item.title,'loading="lazy"')}<span class="op-related-copy"><small>${e(t('relatedTypes.'+item.type))} · ${e(context.municipality)}</small><strong>${e(item.title)}</strong><span class="op-territory-meta">${item.demo ? '<span class="op-mini-badge">'+e(t('demoShort'))+'</span>' : ''}${e(t('discoverMore'))} +</span></span></summary><div class="op-territory-detail"><p>${e(item.description)}</p>${item.demo ? '<small>'+e(t('relatedDemoNotice'))+'</small>' : ''}</div></details>`).join('');
    const contactLink = (value, label, href) => value && !p.isDemo && !p.isDraft ? `<a href="${e(href)}" ${href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${e(label)} ${icon('arrow')}</a>` : '';
    const contacts = contactLink(p.contacts.phone, p.contacts.phone, 'tel:' + p.contacts.phone) + contactLink(p.contacts.email, p.contacts.email, 'mailto:' + p.contacts.email) + contactLink(p.contacts.website, t('website'), p.contacts.website) + contactLink(p.contacts.facebook, 'Facebook', p.contacts.facebook) + contactLink(p.contacts.instagram, 'Instagram', p.contacts.instagram);
    return `<article class="operator-profile" data-module-detail-root data-entity-type="accommodation" data-entity-id="${e(p.id)}" data-comune-id="${e(p.municipalityId)}" data-localita="${e(p.locality)}">
      <div class="op-topline"><button class="territory-back" type="button" data-action="back-to-module-list" data-module-back-results data-module-back-type="sleep" data-module-back-municipality="${e(context.municipality)}" data-module-back-comune-id="${e(p.municipalityId)}" data-module-back-state="${e(JSON.stringify(context.navigationState))}">← ${e(t('back'))}</button><span>${e(t('collection'))}</span></div>
      <div class="op-hero op-hero--immersive">${p.photos.length ? image(p.photos[0],galleryAlt(0),'fetchpriority="high" class="op-hero-background"') : '<div class="op-no-photo">'+e(t('noPhoto'))+'</div>'}<header class="module-detail__head op-heading">${p.logo ? '<img class="op-property-logo" src="'+e(p.logo)+'" alt="'+e(t('propertyLogo',{name:p.name}))+'" width="80" height="80">' : ''}<p class="op-eyebrow">${e(p.category)} <span>·</span> ${e(context.municipality)}</p><h2>${e(p.name)}</h2><p class="op-location">${icon('pin')}${e(p.locality || context.municipality)}</p><div class="op-hero-bottom">${p.isDemo || p.isDraft ? '<span class="op-mini-badge">'+e(t(p.isDemo?'demoShort':'draftBadge'))+'</span>' : ''}${p.photos.length ? '<button type="button" class="op-open-gallery" data-op-photo="0">'+icon('image')+e(t('viewAllPhotos',{count:p.photos.length}))+'</button>' : ''}</div></header></div>
      <div class="op-cta-dock"><div class="op-actions">${ctas}</div><p class="op-action-status" role="status" aria-live="polite" data-op-action-status></p></div>
      ${p.isDemo || p.isDraft ? '<p class="op-demo-line">'+e(t(p.isDemo?'demoNotice':'draftNotice'))+' '+e(t('demoCta'))+'</p>' : ''}
      ${p.photosIllustrative ? '<p class="op-photo-note">'+e(t('illustrative'))+'</p>' : ''}
      <div class="op-main">
        <section id="op-overview" class="op-section"><p class="op-eyebrow">${e(t('stay'))}</p><h3>${e(p.claim || t('welcome'))}</h3><p class="op-description">${e(p.description || t('unknown'))}</p>${p.features.idealFor.length ? `<div class="op-tags">${p.features.idealFor.map(v=>`<span>${e(v)}</span>`).join('')}</div>` : ''}${contacts ? `<div class="op-inline-contacts">${contacts}</div>` : ''}</section>
        <section id="op-services" class="op-section"><p class="op-eyebrow">${e(t('comfort'))}</p><h3>${e(t('services'))}</h3><div class="op-services">${p.services.length ? p.services.map(code=>`<div data-service-code="${e(code)}">${icon(code)}<span>${e(t('serviceLabels.'+code))}</span></div>`).join('') : `<p>${e(t('unknown'))}</p>`}</div></section>
        <section class="op-section"><h3>${e(t('features'))}</h3><dl class="op-features">${features}</dl></section>
      </div>
      <section id="op-location" class="op-section op-location-section"><div><p class="op-eyebrow">${e(t('findUs'))}</p><h3>${e(context.municipality)}</h3><p>${e(p.address || p.locality || t('unknown'))}</p><p>${e(t(p.isDemo ? 'demoMap' : 'mapHint'))}</p></div><div class="op-map" data-op-map>${p.coordinates ? `<div class="op-map-preview">${icon('pin')}<strong>${e(context.municipality)}</strong><button type="button" data-op-load-map>${e(t('loadMap'))}</button><small>OpenStreetMap</small></div>` : `<p>${e(t('mapMissing'))}</p>`}</div></section>
      <section id="op-territory" class="op-section"><p class="op-eyebrow">${e(t('beyondStay'))}</p><h3>${e(t('territory'))}</h3><div class="op-territory-grid">${relatedHtml || `<p>${e(t('relatedMissing'))}</p>`}</div></section>
      <footer class="op-footer"><span>${e(t('collection'))}</span><span>${e(t(p.isDemo ? 'demoBadge' : 'footer'))}</span></footer>
      <dialog class="op-lightbox" aria-label="${e(t('gallery'))}"><div class="op-lightbox-bar"><span data-op-counter></span><button type="button" data-op-close aria-label="${e(t('close'))}">×</button></div><img data-op-large alt=""><div class="op-lightbox-controls"><button type="button" data-op-prev aria-label="${e(t('previous'))}">←</button><p data-op-caption></p><button type="button" data-op-next aria-label="${e(t('next'))}">→</button></div></dialog>
    </article>`;
  }
  function bind(root, profile, context) {
    const dialog = root.querySelector('dialog'); let current = 0, trigger;
    const show = index => {
      current = (index + profile.photos.length) % profile.photos.length;
      const large = dialog.querySelector('[data-op-large]');
      large.src = profile.photos[current];
      large.alt = t(profile.photosIllustrative ? 'territoryPhoto' : 'photo', { name: profile.photosIllustrative ? 'Cilento' : profile.name, index: current + 1 });
      dialog.querySelector('[data-op-counter]').textContent = `${current + 1} / ${profile.photos.length}`;
      dialog.querySelector('[data-op-caption]').textContent = large.alt;
      dialog.querySelectorAll('[data-op-prev],[data-op-next]').forEach(button => { button.disabled = profile.photos.length < 2; });
    };
    root.querySelectorAll('[data-op-photo]').forEach(button => button.addEventListener('click', () => { trigger = button; show(Number(button.dataset.opPhoto)); dialog.showModal(); dialog.querySelector('[data-op-close]').focus(); }));
    dialog.querySelector('[data-op-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', event => {
      if (['Escape', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { event.stopPropagation(); event.preventDefault(); }
      if (event.key === 'Escape') dialog.close();
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
    dialog.querySelector('[data-op-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-op-next]').addEventListener('click', () => show(current + 1));
    root.querySelectorAll('[data-op-unavailable]').forEach(button => button.addEventListener('click', () => { root.querySelector('[data-op-action-status]').textContent = t(profile.isDemo || profile.isDraft ? 'demoCta' : 'contactMissing'); }));
    root.querySelectorAll('[data-op-related]').forEach(button => button.addEventListener('click', () => context.openRelated(button.dataset.opRelated)));
    const loadMap = () => {
      const { latitude: lat, longitude: lng } = profile.coordinates;
      const frame = document.createElement('iframe');
      frame.title = t('mapTitle', { name: context.municipality }); frame.loading = 'eager'; frame.referrerPolicy = 'no-referrer';
      const box = [lng - .015, lat - .01, lng + .015, lat + .01].join(',');
      frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(box)}&layer=mapnik&marker=${lat},${lng}`;
      const external = document.createElement('a');
      external.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
      external.target = '_blank'; external.rel = 'noopener noreferrer';
      external.textContent = 'OpenStreetMap ↗'; external.className = 'op-map-external';
      root.querySelector('[data-op-map]').replaceChildren(frame, external);
    };
    root.querySelector('[data-op-load-map]')?.addEventListener('click', loadMap);
    if (profile.coordinates && !profile.isDemo && !profile.isDraft) loadMap();
    root.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { img.hidden = true; img.parentElement.classList.add('op-image-missing'); }, { once: true }));
  }
  global.OperatorProfile = Object.freeze({ render, bind });
})(globalThis);
