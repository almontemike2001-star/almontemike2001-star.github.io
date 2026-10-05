/* Small, dependency-free charts for the BeanFlow section.
   Line chart: one series at a time (no dual axis), crosshair + tooltip.
   Bar chart: horizontal HTML bars with value at the tip and a per-bar tooltip. */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function fmt(v, kind) {
    if (kind === 'compact') {
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M';
      if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
      return v.toFixed(0);
    }
    if (kind === 'dec') return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Math.round(v).toLocaleString('en-US');
  }

  function fmtFull(v, kind) {
    if (kind === 'compact') return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return fmt(v, kind);
  }

  function fmtDate(iso, long) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', long ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
  }

  function niceStep(range, count) {
    var raw = range / count;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return step * mag;
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVG_NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------------- Line chart ---------------- */
  function LineChart(root, rows, metrics) {
    this.root = root;
    this.rows = rows;
    this.metrics = metrics;
    this.metric = 'sales';
    this.tip = document.createElement('div');
    this.tip.className = 'chart-tip';
    this.tip.setAttribute('aria-hidden', 'true');
    root.appendChild(this.tip);
    var self = this;
    if ('ResizeObserver' in window) {
      var last = 0;
      new ResizeObserver(function (entries) {
        var w = Math.round(entries[0].contentRect.width);
        if (w !== last) { last = w; self.draw(); }
      }).observe(root);
    } else {
      window.addEventListener('resize', function () { self.draw(); });
    }
    this.draw();
  }

  LineChart.prototype.setMetric = function (m) { this.metric = m; this.draw(true); };

  LineChart.prototype.draw = function (animate) {
    var root = this.root, rows = this.rows, key = this.metric, spec = this.metrics[key];
    var W = root.clientWidth || 600;
    var compact = W < 480;
    var H = compact ? 220 : 260;
    var m = { t: 24, r: compact ? 16 : 24, b: 32, l: compact ? 44 : 56 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;

    var vals = rows.map(function (r) { return r[key]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var step = niceStep((hi - lo) || hi, 4);
    var y0 = Math.floor(lo / step) * step - step;
    if (y0 < 0) y0 = 0;
    var y1 = Math.ceil(hi / step) * step;

    var x = function (i) { return m.l + (rows.length === 1 ? iw / 2 : (i * iw) / (rows.length - 1)); };
    var y = function (v) { return m.t + ih - ((v - y0) / (y1 - y0)) * ih; };

    var old = root.querySelector('svg');
    if (old) old.remove();
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img',
      'aria-label': spec.sub + ', ' + fmtDate(rows[0].date) + ' to ' + fmtDate(rows[rows.length - 1].date) +
        '. Range ' + fmt(lo, spec.format) + ' to ' + fmt(hi, spec.format) + '.' });
    root.insertBefore(svg, this.tip);

    // Grid + y ticks
    var g = el('g', { class: 'grid' }, svg);
    for (var t = y0; t <= y1 + step / 2; t += step) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }, g);
      var lab = el('text', { x: m.l - 8, y: y(t), 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'tick' }, g);
      lab.textContent = fmt(t, spec.format === 'dec' ? 'int' : spec.format);
    }
    // X labels
    rows.forEach(function (r, i) {
      if (compact && i % 2 === 1) return;
      var tx = el('text', { x: x(i), y: H - 10, 'text-anchor': 'middle', class: 'tick' }, svg);
      tx.textContent = fmtDate(r.date);
    });

    // Line
    var d = rows.map(function (r, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(r[key]).toFixed(1); }).join(' ');
    var path = el('path', { d: d, class: 'series-line' }, svg);
    if (animate !== false && path.getTotalLength && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 700ms cubic-bezier(.2,.7,.2,1)';
      path.style.strokeDashoffset = '0';
    }

    // Dots
    var peak = vals.indexOf(hi);
    rows.forEach(function (r, i) {
      el('circle', { cx: x(i), cy: y(r[key]), r: 4, class: 'series-dot' + (i === peak ? ' is-peak' : '') }, svg);
    });

    // Direct label on the peak only
    var px = x(peak), py = y(hi);
    var anchor = px > W - 80 ? 'end' : px < m.l + 40 ? 'start' : 'middle';
    var pl = el('text', { x: px, y: py - 12, 'text-anchor': anchor, class: 'peak-label' }, svg);
    pl.textContent = 'Peak ' + fmt(hi, spec.format);

    // Crosshair + hover
    var cross = el('line', { y1: m.t, y2: m.t + ih, class: 'crosshair', opacity: 0 }, svg);
    var focus = el('circle', { r: 6, class: 'focus-dot', opacity: 0 }, svg);
    var overlay = el('rect', { x: m.l - 12, y: 0, width: iw + 24, height: H, fill: 'transparent' }, svg);
    var tip = this.tip;

    function show(i) {
      var r = rows[i];
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
      focus.setAttribute('cx', x(i)); focus.setAttribute('cy', y(r[key])); focus.setAttribute('opacity', 1);
      tip.innerHTML = '<span class="tip-date">' + fmtDate(r.date, true) + '</span>' +
        '<span class="tip-row"><i class="sw"></i>' + spec.label + '<b>' + fmtFull(r[key], spec.format) + '</b></span>';
      tip.classList.add('on');
      var tw = tip.offsetWidth;
      var left = x(i) + 14;
      if (left + tw > W) left = x(i) - tw - 14;
      tip.style.left = Math.max(0, left) + 'px';
      tip.style.top = Math.max(0, y(r[key]) - 52) + 'px';
    }
    function hide() {
      cross.setAttribute('opacity', 0); focus.setAttribute('opacity', 0); tip.classList.remove('on');
    }
    function nearest(evt) {
      var rect = svg.getBoundingClientRect();
      var px = ((evt.clientX - rect.left) / rect.width) * W;
      var i = Math.round(((px - m.l) / iw) * (rows.length - 1));
      return Math.max(0, Math.min(rows.length - 1, i));
    }
    overlay.addEventListener('pointermove', function (e) { show(nearest(e)); });
    overlay.addEventListener('pointerdown', function (e) { show(nearest(e)); });
    overlay.addEventListener('pointerleave', hide);

    // Keyboard access: arrow through points
    svg.setAttribute('tabindex', '0');
    var cur = -1;
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        cur = cur < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)));
        show(cur);
      } else if (e.key === 'Escape') { hide(); cur = -1; }
    });
    svg.addEventListener('blur', function () { hide(); cur = -1; });
  };

  /* ---------------- Bar chart ---------------- */
  function BarChart(root, rows, metrics) {
    this.root = root;
    this.rows = rows;
    this.metrics = metrics;
    this.metric = 'sales';
    this.build();
    this.update();
  }

  BarChart.prototype.build = function () {
    var root = this.root;
    root.classList.add('bars');
    root.setAttribute('role', 'list');
    this.items = this.rows.map(function (r) {
      var row = document.createElement('div');
      row.className = 'bar-row';
      row.setAttribute('role', 'listitem');
      row.tabIndex = 0;
      row.innerHTML =
        '<span class="bar-label"><span class="bar-rank"></span>' + r.name + '</span>' +
        '<span class="bar-track"><span class="bar-fill"></span><span class="bar-value"></span></span>' +
        '<span class="bar-tip" aria-hidden="true">' +
          '<b>' + r.name + '</b>' +
          '<span>Sales <em>' + fmtFull(r.sales, 'compact') + '</em></span>' +
          '<span>Store-days <em>' + r.storeDays + '</em></span>' +
          '<span>ADS <em>' + fmtFull(r.ads, 'dec') + '</em></span>' +
          '<span>ADQ <em>' + fmtFull(r.adq, 'dec') + '</em></span>' +
        '</span>';
      root.appendChild(row);
      return row;
    });
  };

  BarChart.prototype.setMetric = function (m) { this.metric = m; this.update(); };

  BarChart.prototype.update = function () {
    var key = this.metric, spec = this.metrics[key], rows = this.rows;
    var max = Math.max.apply(null, rows.map(function (r) { return r[key]; }));
    var ranked = rows.slice().sort(function (a, b) { return b[key] - a[key]; });
    this.items.forEach(function (row, i) {
      var r = rows[i];
      // Longest bar fills 78% of the track so the value label always fits at its tip
      var pct = (r[key] / max) * 78;
      row.querySelector('.bar-fill').style.width = pct + '%';
      row.querySelector('.bar-value').textContent = fmt(r[key], spec.format);
      row.querySelector('.bar-value').style.left = 'calc(' + pct + '% + 8px)';
      var rank = ranked.indexOf(r) + 1;
      row.querySelector('.bar-rank').textContent = '#' + rank;
      row.classList.toggle('is-top', rank === 1);
      row.setAttribute('aria-label', r.name + ': ' + spec.label + ' ' + fmtFull(r[key], spec.format) + ', rank ' + rank + ' of ' + rows.length);
    });
  };

  /* ---------------- Tables (accessible fallback) ---------------- */
  function renderTable(table, cols, rows) {
    var html = '<thead><tr>' + cols.map(function (c) { return '<th scope="col"' + (c.num ? ' class="num"' : '') + '>' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>' + cols.map(function (c) { return '<td' + (c.num ? ' class="num"' : '') + '>' + c.get(r) + '</td>'; }).join('') + '</tr>';
    });
    table.innerHTML = html + '</tbody>';
  }

  window.Charts = { LineChart: LineChart, BarChart: BarChart, renderTable: renderTable, fmt: fmt, fmtFull: fmtFull, fmtDate: fmtDate };
})();
