/* Checkout-only controller. Mapping and area data load only after Open Map. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const storageKey = 'catharei-delivery-draft-v1';
  const fields = ['area', 'buildingNumber', 'streetNumber', 'zoneNumber', 'propertyType', 'unitNumber', 'floorNumber', 'landmark', 'deliveryInstructions'];
  let ar, modal, map, mapReady = false, loading, areas, confirmed = null, draft = null;
  let state = 'idle', revision = 0, programmatic = false, movement = false, gpsBusy = false, loadTimer, disposeTimer;
  let matches = [], activeIndex = -1, closing = false;
  let resizeFrame = 0, frameObserver;
  const text = (en, arabic) => ar ? arabic : en;
  const valid = point => point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\b(?:al|as|ar|ad|ath|ash)\b/g, '').replace(/[^\p{L}\p{N}]/gu, '').replace(/ou/g, 'u').replace(/aa/g, 'a');
  const cartKey = () => localStorage.getItem('catharei-cart-data') || '';

  function setState(next, message) {
    state = next;
    modal.dataset.state = next;
    $('location-status').textContent = message || '';
    updateConfirm();
    $('location-pin').toggleAttribute('hidden', !mapReady);
  }
  function updateConfirm() {
    $('confirm-location').disabled = !(state === 'ready' && mapReady && valid(draft) && draft.refined && !gpsBusy && map?.areTilesLoaded());
  }
  function summary() {
    $('lat').value = confirmed?.latitude ?? '';
    $('lng').value = confirmed?.longitude ?? '';
    $('location-summary').textContent = confirmed
      ? text('Delivery pin confirmed. Check your building details below. Delivery is subject to staff acceptance.', 'تم تأكيد موقع التوصيل. راجع تفاصيل المبنى أدناه. يخضع التوصيل لقبول الموظفين.')
      : text('No delivery pin confirmed. A manual address will be checked with you by our team.', 'لم يتم تأكيد موقع على الخريطة. سيتحقق فريقنا من العنوان اليدوي معك.');
    $('open-location').textContent = confirmed ? text('Edit Location', 'تعديل الموقع') : text('Confirm on Map', 'تأكيد الموقع على الخريطة');
  }
  function details() { return Object.fromEntries(fields.map(key => [key, $('delivery-' + key).value.trim()])); }
  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ cart: cartKey(), expires: Date.now() + 30 * 60 * 1000, confirmed, address: $('address').value, details: details() })); } catch { /* Storage restrictions must not block checkout. */ }
  }
  function restore() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (!saved || saved.expires < Date.now() || saved.cart !== cartKey()) { sessionStorage.removeItem(storageKey); return; }
      if (valid(saved.confirmed) && saved.confirmed.confirmedAt) confirmed = saved.confirmed;
      if (typeof saved.address === 'string') $('address').value = saved.address;
      for (const key of fields) if (typeof saved.details?.[key] === 'string') $('delivery-' + key).value = saved.details[key];
    } catch { /* Ignore malformed drafts. */ }
  }
  function clearResults() {
    $('location-results').replaceChildren(); matches = []; activeIndex = -1;
    $('location-search').setAttribute('aria-expanded', 'false');
    $('location-search').removeAttribute('aria-activedescendant');
  }
  function search() {
    clearResults();
    const query = normalize($('location-search').value.trim());
    if (!query) return;
    if (!areas) { $('search-status').textContent = text('Area list unavailable. Use the map or enter your area manually.', 'قائمة المناطق غير متاحة. استخدم الخريطة أو أدخل المنطقة يدوياً.'); return; }
    const centre = map?.getCenter() || { lat: 25.2854, lng: 51.531 };
    const distance = area => (area.lat - centre.lat) ** 2 + (area.lng - centre.lng) ** 2;
    matches = areas.filter(area => area.keys.some(key => key.includes(query)))
      .sort((a, b) => Number(b.keys.some(k => k === query)) - Number(a.keys.some(k => k === query)) || Number(a.kind === 'ADM1') - Number(b.kind === 'ADM1') || distance(a) - distance(b))
      .slice(0, 8);
    $('search-status').textContent = matches.length ? text('Choose an area, then move the pin to your building.', 'اختر منطقة، ثم حرّك الدبوس إلى مبناك.') : text('No matching area. Move the map or enter the area manually.', 'لا توجد منطقة مطابقة. حرّك الخريطة أو أدخل المنطقة يدوياً.');
    matches.forEach((area, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'location-button';
      button.id = 'area-option-' + index; button.setAttribute('role', 'option'); button.setAttribute('aria-selected', 'false'); button.tabIndex = -1;
      button.textContent = `${ar && area.ar ? area.ar : area.name}${area.kind === 'ADM1' ? text(' — Municipality', ' — بلدية') : ''}`;
      if (area.region && area.kind !== 'ADM1') { const region = document.createElement('small'); region.textContent = ar && area.region.ar ? area.region.ar : area.region.name; button.append(region); }
      button.addEventListener('click', () => chooseArea(area)); $('location-results').append(button);
    });
    $('location-search').setAttribute('aria-expanded', String(matches.length > 0));
  }
  function chooseArea(area) {
    invalidateGPS(); clearResults();
    $('location-search').value = ar && area.ar ? area.ar : area.name;
    $('search-status').textContent = text('Area centre only — position the pin at your building.', 'هذا مركز المنطقة فقط — ضع الدبوس عند مبناك.');
    if (!mapReady) {
      $('delivery-area').value = $('location-search').value; persist();
      $('location-status').textContent = text('Area added to your address. The map must load before a pin can be confirmed.', 'تمت إضافة المنطقة للعنوان. يجب تحميل الخريطة قبل تأكيد الدبوس.'); return;
    }
    position({ latitude: area.lat, longitude: area.lng, locationSource: 'area-search', refined: false }, 14);
    $('location-search').blur();
  }
  function invalidateGPS() { revision++; gpsBusy = false; if ($('locate-btn')) $('locate-btn').disabled = !mapReady; }
  function position(point, zoom) {
    if (!map || !mapReady || !valid(point)) return;
    programmatic = true;
    map.jumpTo({ center: [point.longitude, point.latitude], zoom });
    programmatic = false; draft = { ...point };
    setState(point.refined ? 'ready' : 'selecting', point.refined
      ? text('Pin selected. Check the building entrance before confirming.', 'تم تحديد الدبوس. تحقق من مدخل المبنى قبل التأكيد.')
      : text('Area centre only. Move the map and zoom in to your building.', 'مركز المنطقة فقط. حرّك الخريطة وكبّرها للوصول إلى مبناك.'));
  }
  function useGPS() {
    if (!mapReady || gpsBusy) return;
    if (!navigator.geolocation) { setState(draft?.refined ? 'ready' : 'selecting', text('Location is unavailable. Search an area or move the map.', 'الموقع غير متاح. ابحث عن منطقة أو حرّك الخريطة.')); return; }
    const token = ++revision; gpsBusy = true; $('locate-btn').disabled = true;
    setState('resolving', text('Finding your location…', 'جارٍ تحديد موقعك…'));
    navigator.geolocation.getCurrentPosition(result => {
      if (token !== revision || modal.hidden) return;
      gpsBusy = false; $('locate-btn').disabled = false;
      const point = { latitude: result.coords.latitude, longitude: result.coords.longitude, accuracyMeters: result.coords.accuracy, locationSource: 'gps', refined: true };
      if (!valid(point)) { setState('error', text('Location unavailable. Search an area or move the map.', 'الموقع غير متاح. ابحث عن منطقة أو حرّك الخريطة.')); return; }
      position(point, 17);
      const accuracy = Number.isFinite(point.accuracyMeters) ? Math.round(point.accuracyMeters) : null;
      $('location-status').textContent = accuracy == null ? text('Check your building entrance before confirming.', 'تحقق من مدخل المبنى قبل التأكيد.') : text(`GPS accuracy: about ${accuracy} m. ${accuracy > 100 ? 'Accuracy is low. ' : ''}Adjust the pin to your entrance.`, `دقة الموقع: نحو ${accuracy} متر. ${accuracy > 100 ? 'الدقة منخفضة. ' : ''}اضبط الدبوس عند المدخل.`);
    }, error => {
      if (token !== revision || modal.hidden) return;
      gpsBusy = false; $('locate-btn').disabled = false;
      const reason = error.code === 1 ? text('Location permission denied.', 'تم رفض إذن الموقع.') : error.code === 3 ? text('Location request timed out.', 'انتهت مهلة تحديد الموقع.') : text('Location unavailable.', 'الموقع غير متاح.');
      setState(draft?.refined ? 'ready' : 'selecting', reason + ' ' + text('Search an area or move the map.', 'ابحث عن منطقة أو حرّك الخريطة.'));
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }
  async function json(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Unavailable');
    return response.json();
  }
  function deadline(promise) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Map loading timed out')), 12000); })]).finally(() => clearTimeout(timer));
  }
  function mapFailure() {
    if (modal.hidden) return;
    mapReady = false; invalidateGPS(); $('locate-btn').disabled = true; $('retry-map').hidden = false;
    setState('error', text('Map unavailable. Retry, or enter your full address for our team to confirm.', 'الخريطة غير متاحة. أعد المحاولة أو أدخل عنوانك الكامل ليتحقق منه فريقنا.'));
  }
  async function loadMap() {
    if (loading || mapReady) return loading;
    loading = (async () => {
      try {
        const config = await json('/api/maps/config');
        if (modal.hidden) return;
        let css = $('maplibre-css');
        if (!css) { css = document.createElement('link'); css.id = 'maplibre-css'; css.rel = 'stylesheet'; css.href = '/vendor/maplibre/maplibre-gl.css?v=' + encodeURIComponent(config.version); document.head.append(css); }
        const lib = await deadline(import('/vendor/maplibre/maplibre-gl.mjs?v=' + encodeURIComponent(config.version)));
        if (modal.hidden) return;
        lib.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs?v=' + encodeURIComponent(config.version));
        lib.setWorkerCount(2);
        const centre = confirmed ? [confirmed.longitude, confirmed.latitude] : [51.531, 25.2854];
        map = new lib.Map({ container: 'map', style: config.styleUrl, center: centre, zoom: confirmed ? 17 : 11,
          maxZoom: 19, minZoom: 5, pitch: 0, maxPitch: 0, dragRotate: false, touchPitch: false, renderWorldCopies: false,
          attributionControl: { compact: false }, fadeDuration: 0, trackResize: false });
        map.touchZoomRotate.disableRotation();
        map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
        map.getCanvas().setAttribute('aria-label', text('Delivery map. Use arrow keys to move and plus or minus to zoom.', 'خريطة التوصيل. استخدم الأسهم للتحريك وعلامتي زائد وناقص للتكبير والتصغير.'));
        loadTimer = setTimeout(mapFailure, 18000);
        let failed = false;
        map.on('load', () => {
          if (failed) return;
          clearTimeout(loadTimer); mapReady = true; $('retry-map').hidden = true; $('locate-btn').disabled = false;
          // Liberty uses a flat street map; remove any optional 3D building layers.
          for (const layer of map.getStyle().layers || []) if (layer.type === 'fill-extrusion') map.setLayoutProperty(layer.id, 'visibility', 'none');
          draft = confirmed ? { ...confirmed, refined: true } : null;
          setState(draft ? 'ready' : 'selecting', text('Search an area, use GPS, or move the map to your building.', 'ابحث عن منطقة أو استخدم الموقع الحالي أو حرّك الخريطة إلى مبناك.'));
        });
        map.on('error', () => { failed = true; mapFailure(); });
        map.on('dataloading', updateConfirm);
        map.on('idle', updateConfirm);
        map.on('movestart', () => {
          if (programmatic || modal.hidden || !mapReady) return;
          invalidateGPS(); movement = true; setState('selecting', text('Positioning pin…', 'جارٍ تحديد الدبوس…'));
        });
        map.on('moveend', () => {
          if (programmatic || !movement || modal.hidden || !mapReady) return;
          movement = false; const centre = map.getCenter();
          const samePoint = draft && Math.abs(draft.latitude - centre.lat) < 1e-9 && Math.abs(draft.longitude - centre.lng) < 1e-9;
          draft = { ...(samePoint ? draft : { locationSource: 'map-pin' }), latitude: centre.lat, longitude: centre.lng, refined: map.getZoom() >= 16 };
          setState(draft.refined ? 'ready' : 'selecting', draft.refined ? text('Pin selected. Enter or check the area in your address details.', 'تم تحديد الدبوس. أدخل المنطقة أو راجعها في تفاصيل العنوان.') : text('Zoom in further to select your building entrance.', 'كبّر الخريطة أكثر لتحديد مدخل مبناك.'));
        });
        map.on('click', event => { if (mapReady) { invalidateGPS(); position({ latitude: event.lngLat.lat, longitude: event.lngLat.lng, locationSource: 'map-pin', refined: true }, Math.max(map.getZoom(), 17)); } });
      } catch { mapFailure(); }
    })().finally(() => { loading = null; });
    return loading;
  }
  function resize() {
    const viewport = window.visualViewport;
    modal.style.setProperty('--location-height', `${viewport?.height || innerHeight}px`);
    modal.style.setProperty('--location-top', `${viewport?.offsetTop || 0}px`);
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { if (!modal.hidden && map) { programmatic = true; map.resize(); map.redraw(); programmatic = false; } });
  }
  async function open() {
    clearTimeout(disposeTimer); modal.hidden = false; closing = false; draft = confirmed ? { ...confirmed, refined: true } : null;
    setState('selecting', text('Loading map…', 'جارٍ تحميل الخريطة…')); clearResults();
    cathareiModal.open(modal, { onClose: close, returnFocus: $('open-location'), initialFocus: $('close-location') }); resize();
    if (!areas) json('/data/qatar-areas.json').then(data => { areas = data.areas.map(area => ({ ...area, region: data.municipalities[area.municipality], keys: area.aliases.map(normalize) })); search(); }).catch(() => { $('search-status').textContent = text('Area list unavailable. You can still use GPS or the map.', 'قائمة المناطق غير متاحة. يمكنك استخدام الموقع الحالي أو الخريطة.'); });
    if (mapReady) {
      programmatic = true; map.jumpTo({ center: confirmed ? [confirmed.longitude, confirmed.latitude] : [51.531, 25.2854], zoom: confirmed ? 17 : 11 }); programmatic = false;
      setState(draft ? 'ready' : 'selecting', text('Move the map to your delivery building.', 'حرّك الخريطة إلى مبنى التوصيل.'));
    } else { if (map) dispose(); await loadMap(); }
  }
  function close() {
    if (closing || modal.hidden) return;
    closing = true; invalidateGPS(); clearResults(); modal.hidden = true; clearTimeout(loadTimer);
    cathareiModal.close(modal); state = confirmed ? 'confirmed' : 'idle'; draft = null;
    // Reuse briefly during checkout, then release GPU memory and worker listeners.
    disposeTimer = setTimeout(dispose, 60000);
  }
  function dispose() { clearTimeout(loadTimer); map?.remove(); map = null; mapReady = false; }
  function confirm() {
    if (state !== 'ready' || !mapReady || !valid(draft) || !draft.refined || gpsBusy || map.isMoving() || !map.areTilesLoaded()) return;
    const centre = map.getCenter();
    if (Math.abs(centre.lat - draft.latitude) > 1e-7 || Math.abs(centre.lng - draft.longitude) > 1e-7) return;
    confirmed = { latitude: centre.lat, longitude: centre.lng, locationSource: draft.locationSource, confirmedAt: new Date().toISOString() };
    if (draft.locationSource === 'gps') confirmed.accuracyMeters = draft.accuracyMeters;
    summary(); persist(); close(); $('delivery-details').open = true;
    $('delivery-area').focus({ preventScroll: true }); $('delivery-details').scrollIntoView({ block: 'nearest' });
  }
  function init() {
    ar = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
    const labels = {
      area: text('Area', 'المنطقة'), buildingNumber: text('Building / Villa Number', 'رقم المبنى / الفيلا'), streetNumber: text('Street Number', 'رقم الشارع'), zoneNumber: text('Zone Number', 'رقم المنطقة'),
      propertyType: text('Property Type', 'نوع العقار'), unitNumber: text('Apartment / Villa / Office Number', 'رقم الشقة / الفيلا / المكتب'), floorNumber: text('Floor (if applicable)', 'الطابق (إن وجد)'), landmark: text('Landmark (optional)', 'معلم قريب (اختياري)'), deliveryInstructions: text('Delivery Instructions (optional)', 'تعليمات التوصيل (اختياري)')
    };
    $('delivery-location').innerHTML = `<div class="delivery-actions"><button class="location-button primary" id="open-location" type="button"></button><button class="location-button" id="manual-location" type="button">${text('Use manual address', 'استخدام عنوان يدوي')}</button></div><p id="location-summary" class="delivery-note" role="status"></p><input type="hidden" id="lat"><input type="hidden" id="lng"><details id="delivery-details"><summary>${text('Building & delivery details', 'تفاصيل المبنى والتوصيل')}</summary><p class="delivery-note">${text('Add any details missing from your address. Use your blue address plate where available. Only fill fields that apply.', 'أضف التفاصيل الناقصة في عنوانك. استخدم لوحة العنوان الزرقاء إن وجدت، واملأ الحقول المناسبة فقط.')}</p><div class="grid-fields">${fields.map(key => `<div class="field"><label for="delivery-${key}">${labels[key]}</label>${key === 'propertyType' ? `<select id="delivery-${key}"><option value="">${text('Select (optional)', 'اختر (اختياري)')}</option>${[['villa','Villa','فيلا'],['apartment','Apartment','شقة'],['office','Office','مكتب'],['other','Other','أخرى']].map(([value,en,arabic]) => `<option value="${value}">${text(en,arabic)}</option>`).join('')}</select>` : `<input id="delivery-${key}" type="text" maxlength="${key === 'deliveryInstructions' ? 500 : 160}"${['zoneNumber','streetNumber','buildingNumber','floorNumber'].includes(key) ? ' inputmode="numeric"' : ''}>`}</div>`).join('')}</div></details>`;
    modal = document.createElement('div'); modal.id = 'location-picker'; modal.className = 'location-overlay'; modal.hidden = true; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'location-title');
    modal.innerHTML = `<div class="location-dialog"><div class="location-top"><div class="location-heading"><div id="location-title" role="heading" aria-level="2">${text('Select Delivery Location', 'اختر موقع التوصيل')}</div><button id="close-location" type="button" class="location-button">${text('Close', 'إغلاق')}</button></div><div class="location-search-wrap"><label for="location-search">${text('Search area in Qatar', 'ابحث عن منطقة في قطر')}</label><input id="location-search" type="search" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="location-results" aria-expanded="false"><div id="location-results" role="listbox" aria-label="${text('Qatar areas', 'مناطق قطر')}"></div></div><p class="delivery-note" id="search-status" role="status">${text('Area search, not a building address lookup.', 'البحث عن المناطق وليس عن عناوين المباني.')}</p><div class="delivery-actions"><button type="button" class="location-button" id="locate-btn" disabled>${text('Use My Location', 'استخدم موقعي')}</button><button type="button" class="location-button" id="retry-map" hidden>${text('Retry map', 'أعد تحميل الخريطة')}</button></div></div><div class="location-map-frame"><div id="map"></div><svg id="location-pin" class="location-center-pin" viewBox="0 0 32 42" aria-hidden="true" hidden><path d="M16 1C7.7 1 1 7.7 1 16c0 11 15 25 15 25s15-14 15-25C31 7.7 24.3 1 16 1Z" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="var(--bg)"/></svg></div><div class="location-bottom"><strong>${text('Delivery Location', 'موقع التوصيل')}</strong><p class="delivery-note">${text('Move the map to position the pin at your delivery building.', 'حرّك الخريطة لوضع الدبوس عند مبنى التوصيل.')}</p><p class="delivery-note" id="location-status" role="status" aria-live="polite"></p><button type="button" class="location-button primary" id="confirm-location" disabled>${text('Confirm Location', 'تأكيد الموقع')}</button><button type="button" class="location-button" id="picker-manual">${text('Enter address manually', 'إدخال العنوان يدوياً')}</button><p class="location-attribution">${text('Area data:', 'بيانات المناطق:')} <a href="https://www.geonames.org/" target="_blank" rel="noopener">GeoNames</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p></div></div>`;
    document.body.append(modal);
    $('open-location').addEventListener('click', open); $('close-location').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    $('locate-btn').addEventListener('click', useGPS); $('confirm-location').addEventListener('click', confirm);
    $('retry-map').addEventListener('click', async () => { dispose(); setState('selecting', text('Loading map…', 'جارٍ تحميل الخريطة…')); $('retry-map').hidden = true; await loadMap(); });
    $('manual-location').addEventListener('click', () => { confirmed = null; summary(); persist(); $('delivery-details').open = true; $('address').focus(); });
    $('picker-manual').addEventListener('click', () => { close(); $('manual-location').click(); });
    $('location-search').addEventListener('input', search);
    $('location-search').addEventListener('keydown', event => {
      if (event.key === 'Escape' && matches.length) { event.stopPropagation(); clearResults(); }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matches.length) {
        event.preventDefault(); activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        [...$('location-results').children].forEach((el, i) => el.setAttribute('aria-selected', String(i === activeIndex)));
        $('location-search').setAttribute('aria-activedescendant', 'area-option-' + activeIndex); $('area-option-' + activeIndex).scrollIntoView({ block: 'nearest' });
      }
      if (event.key === 'Enter') { event.preventDefault(); if (matches[activeIndex]) chooseArea(matches[activeIndex]); }
    });
    $('address').addEventListener('input', persist);
    for (const key of fields) $('delivery-' + key).addEventListener('input', persist);
    window.visualViewport?.addEventListener('resize', resize); window.visualViewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);
    frameObserver = new ResizeObserver(resize); frameObserver.observe(modal.querySelector('.location-map-frame'));
    window.addEventListener('pagehide', () => { clearTimeout(disposeTimer); cancelAnimationFrame(resizeFrame); dispose(); });
    restore(); summary();
    if (typeof validateForm === 'function') validateForm();
  }
  window.deliveryPicker = {
    init,
    payload: () => ({ ...(confirmed || { latitude: null, longitude: null, locationSource: 'manual' }), ...details() }),
    clear: () => { try { sessionStorage.removeItem(storageKey); } catch {} confirmed = null; }
  };
})();
