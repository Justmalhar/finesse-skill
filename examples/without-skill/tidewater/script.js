(() => {
  // Sample week for one west-facing reef break. Window hours are local, decimal.
  const DAYS = [
    { swell: 1.4, period: 11, swellDir: 250, wind: 6, windDir: 90, windNote: 'Offshore', window: [6, 9],
      text: 'Clean 1.4 m at 11 s on the drop from high tide. Light offshore until the sea breeze fills in near 11:00.' },
    { swell: 1.8, period: 13, swellDir: 245, wind: 8, windDir: 75, windNote: 'Offshore', window: [6.5, 10],
      text: 'The pick of the week. Long-period swell and a light offshore breeze through the whole morning drop.' },
    { swell: 2.3, period: 14, swellDir: 240, wind: 14, windDir: 200, windNote: 'Cross-onshore', window: [7.5, 9],
      text: 'Bigger and less tidy. A short window early, before the south-westerly gets onto it.' },
    { swell: 2.0, period: 12, swellDir: 255, wind: 18, windDir: 225, windNote: 'Onshore', window: null,
      text: 'No clean surf today. Onshore all day, though a steady 18 kn suits a sail out of the harbour on the afternoon ebb.' },
    { swell: 1.5, period: 10, swellDir: 260, wind: 10, windDir: 120, windNote: 'Cross-offshore', window: [9, 12],
      text: 'Cleaning up. 1.5 m at 10 s with a cross-offshore breeze, best as the tide drops toward low.' },
    { swell: 1.0, period: 9, swellDir: 270, wind: 5, windDir: 80, windNote: 'Offshore', window: [10, 13],
      text: 'Small and glassy. A longboard morning on the mid-tide drop.' },
    { swell: 0.7, period: 8, swellDir: 280, wind: 4, windDir: 60, windNote: 'Offshore', window: [11, 14],
      text: 'Small, clean and fading. Worth a paddle only if you are close by.' }
  ];

  const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const compass = d => COMPASS[Math.round(d / 22.5) % 16];
  const pad = n => String(n).padStart(2, '0');
  const hhmm = h => { const m = Math.round(h * 60); return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); };
  const dayDate = i => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; };
  const short = new Intl.DateTimeFormat('en', { weekday: 'short' });
  const long = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' });
  const dayName = i => (i === 0 ? 'Today' : short.format(dayDate(i)));

  // ponytail: synthetic semi-diurnal tide (M2 plus a small diurnal term), stands in for a real harmonic model
  const tide = (d, t) => {
    const hi = 4.2 + d * 0.84;
    const amp = 1 + 0.3 * Math.cos(2 * Math.PI * (d + 2) / 14.8);
    return 1.5 + amp * Math.cos(2 * Math.PI * (t - hi) / 12.42) + 0.12 * Math.cos(2 * Math.PI * (t - hi) / 24.84);
  };
  const extremes = d => {
    const out = [];
    for (let k = 1; k < 288; k++) {
      const t = k / 12, p = tide(d, t - 1 / 12), c = tide(d, t), n = tide(d, t + 1 / 12);
      if (c > p && c >= n) out.push({ t, h: c, high: true });
      else if (c < p && c <= n) out.push({ t, h: c, high: false });
    }
    return out;
  };

  /* Hero week view */
  const week = document.getElementById('week');
  week.innerHTML = DAYS.map((d, i) => {
    const w = d.window;
    const bar = w ? `<span class="win" style="left:${w[0] / 24 * 100}%;width:${(w[1] - w[0]) / 24 * 100}%;animation-delay:${0.35 + i * 0.07}s"></span>` : '';
    const sr = w ? `Best window ${hhmm(w[0])} to ${hhmm(w[1])}.` : 'No clean window.';
    return `<li class="week-row${w ? '' : ' is-flat'}">
      <span class="wd"><b>${dayName(i)}</b>${dayDate(i).getDate()}</span>
      <span class="track">${bar}<span class="sr">${sr}</span></span>
      <span class="sw">${w ? d.swell.toFixed(1) + ' m' : 'Onshore'}<small>${d.period} s</small></span>
    </li>`;
  }).join('');

  /* Forecast reader */
  const $ = id => document.getElementById(id);
  const tabs = $('day-tabs');
  const panel = $('day-panel');
  const chart = $('tide-chart');

  tabs.innerHTML = DAYS.map((d, i) =>
    `<button type="button" role="tab" id="tab-${i}" aria-controls="day-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
      <span>${dayName(i)}</span><b>${d.swell.toFixed(1)} m</b>
    </button>`).join('');

  const W = 640, H = 210, P = { l: 28, r: 12, t: 30, b: 44 }, MAX = 3;
  const x = t => P.l + (t / 24) * (W - P.l - P.r);
  const y = h => P.t + (1 - h / MAX) * (H - P.t - P.b);
  const clampX = v => Math.min(Math.max(v, P.l + 70), W - P.r - 70);

  function drawChart(i) {
    const d = DAYS[i];
    let line = '';
    for (let k = 0; k <= 96; k++) {
      const t = k / 4;
      line += (k ? 'L' : 'M') + x(t).toFixed(1) + ' ' + y(tide(i, t)).toFixed(1);
    }
    const area = `${line}L${x(24)} ${y(0)}L${x(0)} ${y(0)}Z`;
    const grid = [0, 6, 12, 18, 24].map(t =>
      `<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${P.t - 8}" y2="${y(0)}"/>` +
      `<text class="axis" x="${x(t)}" y="${H - 8}" text-anchor="middle">${pad(t % 24)}:00</text>`).join('');
    const yAxis = [1, 2].map(h => `<text class="axis" x="0" y="${y(h) + 4}">${h} m</text>`).join('');
    const w = d.window;
    const win = w
      ? `<rect class="win" x="${x(w[0])}" y="${P.t - 8}" width="${x(w[1]) - x(w[0])}" height="${y(0) - P.t + 8}" rx="6"/>` +
        `<line class="win-edge" x1="${x(w[0])}" x2="${x(w[0])}" y1="${P.t - 8}" y2="${y(0)}"/>` +
        `<line class="win-edge" x1="${x(w[1])}" x2="${x(w[1])}" y1="${P.t - 8}" y2="${y(0)}"/>`
      : '';
    const ex = extremes(i);
    const marks = ex.map(e => {
      const cx = x(e.t), cy = y(e.h);
      return `<circle class="dot" cx="${cx}" cy="${cy}" r="4"/>` +
        `<text class="ex" x="${clampX(cx)}" y="${e.high ? cy - 12 : cy + 20}" text-anchor="middle">${e.high ? 'High' : 'Low'} ${hhmm(e.t)}, ${e.h.toFixed(1)} m</text>`;
    }).join('');
    let now = '';
    if (i === 0) {
      const n = new Date(), t = n.getHours() + n.getMinutes() / 60;
      // Put the label at the top unless a high-tide label already sits there.
      const crowded = ex.some(e => e.high && Math.abs(clampX(x(e.t)) - x(t)) < 90);
      const ly = crowded ? y(0) - 8 : P.t - 12;
      const anchor = t > 22 ? 'end' : 'start';
      now = `<line class="now" x1="${x(t)}" x2="${x(t)}" y1="${P.t - 8}" y2="${y(0)}"/><text class="now-label" x="${x(t) + (anchor === 'end' ? -5 : 5)}" y="${ly}" text-anchor="${anchor}">Now</text>`;
    }
    chart.innerHTML = win + grid + yAxis + `<path class="area" d="${area}"/><path class="line" d="${line}"/>` + now + marks;
    chart.setAttribute('aria-label', 'Tide: ' + ex.map(e => `${e.high ? 'high' : 'low'} at ${hhmm(e.t)}, ${e.h.toFixed(1)} metres`).join('; '));
  }

  function select(i, focus) {
    const d = DAYS[i];
    tabs.querySelectorAll('[role="tab"]').forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === i));
      b.tabIndex = k === i ? 0 : -1;
    });
    if (focus) $('tab-' + i).focus();
    panel.setAttribute('aria-labelledby', 'tab-' + i);

    $('day-date').textContent = long.format(dayDate(i));
    $('best').classList.toggle('is-flat', !d.window);
    $('best-time').textContent = d.window ? `${hhmm(d.window[0])} to ${hhmm(d.window[1])}` : 'No clean window';
    $('best-text').textContent = d.text;
    $('swell-h').textContent = d.swell.toFixed(1);
    $('swell-sub').textContent = `${d.period} s from ${compass(d.swellDir)} (${d.swellDir}°)`;
    $('wind-s').textContent = d.wind;
    $('wind-sub').textContent = `From ${compass(d.windDir)}, ${d.windNote.toLowerCase()}`;
    // Arrow points the way the swell or wind travels: from bearing + 180.
    $('swell-arrow').style.transform = `rotate(${d.swellDir}deg)`;
    $('wind-arrow').style.transform = `rotate(${d.windDir}deg)`;
    drawChart(i);

    panel.classList.remove('swap');
    void panel.offsetWidth;
    panel.classList.add('swap');
  }

  tabs.addEventListener('click', e => {
    const b = e.target.closest('[role="tab"]');
    if (b) select(+b.id.slice(4));
  });
  tabs.addEventListener('keydown', e => {
    const cur = +document.activeElement.id.slice(4);
    const map = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: DAYS.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select((map[e.key] + DAYS.length) % DAYS.length, true);
  });

  select(0);
  panel.classList.remove('swap');

  /* Alert switch */
  document.querySelectorAll('.switch').forEach(s =>
    s.addEventListener('click', () => s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true'))));
})();
