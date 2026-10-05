(function () {
  'use strict';

  var D = window.BEANFLOW;
  var C = window.Charts;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeMeta() {
    var dark = currentTheme() === 'dark';
    $$('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', dark ? '#121110' : '#faf8f5');
      m.removeAttribute('media');
    });
    $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  $('#theme-toggle').addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeMeta();
  });
  syncThemeMeta();

  /* ---------- Header: shadow on scroll + mobile menu ---------- */
  var header = $('.site-header');
  var menuBtn = $('#menu-toggle');
  var navLinks = $('#nav-links');

  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  navLinks.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ---------- Active nav link ---------- */
  var linkMap = {};
  $$('.nav-links a').forEach(function (a) { linkMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.nav-links a').forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = linkMap[en.target.id];
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(linkMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Count-up numbers ---------- */
  function formatCount(elm, v) {
    var dec = parseInt(elm.dataset.decimals || '0', 10);
    var s = elm.dataset.format === 'int'
      ? Math.round(v).toLocaleString('en-US')
      : v.toFixed(dec);
    return (elm.dataset.prefix || '') + s + (elm.dataset.suffix || '');
  }
  function countUp(elm) {
    var target = parseFloat(elm.dataset.count);
    if (reduceMotion) { elm.textContent = formatCount(elm, target); return; }
    var start = null, dur = 1100;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      elm.textContent = formatCount(elm, target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Reveal on scroll ---------- */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        if (en.target.hasAttribute('data-count')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (n) { io.observe(n); });
    // Counters outside .reveal blocks (hero)
    counters.filter(function (c) { return !c.closest('.reveal'); }).forEach(countUp);
  }

  /* ---------- Pipeline ---------- */
  var pipe = $('#pipeline'), detail = $('#stage-detail');
  D.pipeline.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'stage';
    b.id = 'stage-' + s.id;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'stage-detail');
    b.innerHTML = '<span class="stage-num">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="stage-tag">' + s.tag + '</span><span class="stage-name">' + s.name + '</span>';
    b.addEventListener('click', function () { selectStage(i, true); });
    pipe.appendChild(b);
  });
  var stages = $$('.stage', pipe);
  function selectStage(i, focus) {
    stages.forEach(function (b, j) {
      var on = i === j;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle('done', j < i);
    });
    var s = D.pipeline[i];
    detail.setAttribute('aria-labelledby', 'stage-' + s.id);
    detail.innerHTML = '<div class="sd-copy"><p class="eyebrow">' + s.tag + ' · step ' + (i + 1) + ' of ' + D.pipeline.length + '</p>' +
      '<h4>' + s.title + '</h4><p>' + s.body + '</p></div>' +
      '<ul class="sd-points">' + s.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>';
    detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap');
    if (focus) stages[i].focus({ preventScroll: true });
  }
  pipe.addEventListener('keydown', function (e) {
    var i = stages.indexOf(document.activeElement);
    if (i < 0) return;
    var n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (e.key === 'Home') n = -i;
    if (e.key === 'End') n = stages.length - 1 - i;
    if (n === undefined) return;
    e.preventDefault();
    selectStage((i + n + stages.length) % stages.length, true);
  });
  selectStage(4, false);

  /* ---------- Charts ---------- */
  function segmented(group, onPick) {
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', group).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      onPick(b.dataset.metric);
    });
  }

  var trend = new C.LineChart($('#trend-chart'), D.daily, D.dailyMetrics);
  segmented($('#trend-metric'), function (m) {
    trend.setMetric(m);
    $('#trend-sub').textContent = D.dailyMetrics[m].sub;
  });
  C.renderTable($('#trend-table'), [
    { label: 'Date', get: function (r) { return C.fmtDate(r.date, true); } },
    { label: 'Sales', num: true, get: function (r) { return C.fmtFull(r.sales, 'compact'); } },
    { label: 'Orders', num: true, get: function (r) { return C.fmt(r.tx, 'int'); } },
    { label: 'AOV', num: true, get: function (r) { return C.fmt(r.aov, 'dec'); } },
    { label: 'ADS', num: true, get: function (r) { return C.fmt(r.ads, 'dec'); } }
  ], D.daily);

  var bars = new C.BarChart($('#region-chart'), D.regions, D.regionMetrics);
  function regionCopy(m) {
    $('#region-sub').textContent = D.regionMetrics[m].sub;
    $('#region-insight').textContent = D.regionMetrics[m].insight;
  }
  segmented($('#region-metric'), function (m) { bars.setMetric(m); regionCopy(m); });
  regionCopy('sales');
  C.renderTable($('#region-table'), [
    { label: 'Region', get: function (r) { return r.name; } },
    { label: 'Sales', num: true, get: function (r) { return C.fmtFull(r.sales, 'compact'); } },
    { label: 'Store-days', num: true, get: function (r) { return r.storeDays; } },
    { label: 'ADS', num: true, get: function (r) { return C.fmt(r.ads, 'dec'); } },
    { label: 'ADQ', num: true, get: function (r) { return C.fmt(r.adq, 'dec'); } }
  ], D.regions);

  /* ---------- Gallery + lightbox ---------- */
  var gallery = $('#gallery');
  var tabs = $$('#gallery-tabs button');
  var currentSet = [];
  function renderGallery(key) {
    currentSet = D.gallery[key];
    gallery.innerHTML = '';
    currentSet.forEach(function (img, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'shot' + (i === 0 ? ' shot-main' : '');
      b.innerHTML = '<img src="' + img.src + '" width="' + img.w + '" height="' + img.h + '" alt="' + img.caption + '" loading="lazy" decoding="async">' +
        '<span class="shot-cap">' + img.caption + '</span>';
      b.addEventListener('click', function () { openLightbox(i, b); });
      gallery.appendChild(b);
    });
    gallery.classList.remove('swap'); void gallery.offsetWidth; gallery.classList.add('swap');
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      renderGallery(t.dataset.tab);
    });
  });
  renderGallery('exec');

  var lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  var lbIndex = 0, lbReturn = null;
  function paintLightbox() {
    var it = currentSet[lbIndex];
    lbImg.src = it.src; lbImg.alt = it.caption; lbCap.textContent = it.caption + '  (' + (lbIndex + 1) + ' / ' + currentSet.length + ')';
    $$('.lb-nav', lb).forEach(function (b) { b.hidden = currentSet.length < 2; });
  }
  function openLightbox(i, from) {
    lbIndex = i; lbReturn = from;
    paintLightbox();
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { lb.classList.add('open'); });
    $('.lb-close', lb).focus();
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { lb.hidden = true; }, reduceMotion ? 0 : 200);
    if (lbReturn) lbReturn.focus();
  }
  function step(n) { lbIndex = (lbIndex + n + currentSet.length) % currentSet.length; paintLightbox(); }
  $('.lb-close', lb).addEventListener('click', closeLightbox);
  $('.lb-prev', lb).addEventListener('click', function () { step(-1); });
  $('.lb-next', lb).addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {
      var f = $$('button:not([hidden])', lb);
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Swipe between screenshots on touch devices
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    sx = null;
  });

  /* ---------- Toast ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 2200);
  }

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.dataset.copy;
      var done = function () { b.textContent = 'Copied'; showToast('Email address copied'); setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  });
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------- Contact form → mailto ---------- */
  var form = $('#contact-form');
  function fieldError(input, msg) {
    var err = input.parentElement.querySelector('.err');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
    return !msg;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name, msg = form.elements.message;
    var ok = fieldError(name, name.value.trim() ? '' : 'Please add your name.');
    ok = fieldError(msg, msg.value.trim().length >= 10 ? '' : 'Please write a short message (10+ characters).') && ok;
    if (!ok) { (name.value.trim() ? msg : name).focus(); return; }
    var company = form.elements.company.value.trim();
    var topic = form.elements.topic.value;
    var subject = topic + ' – from ' + name.value.trim() + (company ? ' (' + company + ')' : '');
    var body = msg.value.trim() + '\n\n— ' + name.value.trim() + (company ? '\n' + company : '');
    window.location.href = 'mailto:almontemike2001@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    showToast('Opening your email app…');
  });
  $$('input, textarea', form).forEach(function (i) {
    i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') fieldError(i, ''); });
  });

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
