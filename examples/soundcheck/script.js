(function () {
  "use strict";
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var live = document.getElementById("live");
  var fmtK = function (n) { return n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : (n / 1e3).toFixed(1) + "k"; };

  /* Small deterministic random, so every load draws the same strips. */
  function rng(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /* ---------- Band chart: 52 weeks from 1 Dec 2025 ---------- */
  /* Monthly listeners in thousands, last year's same weeks, and streams per week in thousands. */
  var L = [118,117,119,121,120,122,124,123,125,127,126,128,129,131,152,163,160,158,161,166,168,171,173,175,176,174,176,214,229,236,241,244,247,251,253,255,258,260,262,271,284,291,293,288,285,289,292,296,299,304,309,312.4];
  var C = [61,62,62,64,65,66,68,69,70,72,73,74,75,77,78,80,82,83,85,86,88,90,91,93,95,96,98,99,100,102,103,104,106,107,108,109,110,111,112,113,113,114,114,115,115,116,116,117,117,117,118,118];
  var S = [171,168,174,179,176,181,186,184,190,193,191,197,199,203,262,281,270,265,268,277,282,287,291,296,298,293,299,371,402,411,418,421,427,432,436,439,444,447,451,431,452,458,455,441,436,440,444,446,447,477,472,463];
  var MAX = 400, SMAX = 600;
  var start = new Date(2025, 11, 1);
  var weekLabel = function (i) { var d = new Date(start); d.setDate(d.getDate() + i * 7); return "Week of " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  var y = function (v) { return 100 - (v / MAX) * 100; };

  function smooth(vals) {
    var p = vals.map(function (v, i) { return [i, y(v)]; });
    var d = "M" + p[0][0] + " " + p[0][1].toFixed(2);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C" + c1x.toFixed(2) + " " + c1y.toFixed(2) + " " + c2x.toFixed(2) + " " + c2y.toFixed(2) + " " + p2[0] + " " + p2[1].toFixed(2);
    }
    return d;
  }
  var line = smooth(L);
  document.getElementById("p-line").setAttribute("d", line);
  document.getElementById("p-area").setAttribute("d", line + "L51 100L0 100Z");
  document.getElementById("p-cmp").setAttribute("d", smooth(C));
  var bars = document.getElementById("bars");
  bars.innerHTML = S.map(function (v, i) { return '<i style="--v: ' + (v / SMAX).toFixed(3) + "; --i: " + i + '"></i>'; }).join("");

  var plot = document.getElementById("plot");
  var tip = document.getElementById("tip");
  var pt = document.getElementById("pt");
  function show(i) {
    var x = (i / 51) * 100;
    plot.style.setProperty("--x", x + "%");
    pt.style.setProperty("--y", y(L[i]) + "%");
    tip.classList.toggle("is-left", i > 34);
    document.getElementById("tip-t").textContent = weekLabel(i);
    document.getElementById("tip-l").textContent = fmtK(L[i] * 1000);
    document.getElementById("tip-c").textContent = fmtK(C[i] * 1000);
    document.getElementById("tip-s").textContent = fmtK(S[i] * 1000);
    plot.setAttribute("aria-valuenow", String(i));
    plot.setAttribute("aria-valuetext", weekLabel(i) + ": " + fmtK(L[i] * 1000) + " monthly listeners, " + fmtK(S[i] * 1000) + " streams");
  }
  var idx = 51;
  show(idx);
  plot.addEventListener("pointermove", function (e) {
    var r = plot.getBoundingClientRect();
    idx = Math.max(0, Math.min(51, Math.round(((e.clientX - r.left) / r.width) * 51)));
    plot.classList.add("is-live"); show(idx);
  });
  plot.addEventListener("pointerleave", function () { if (document.activeElement !== plot) plot.classList.remove("is-live"); });
  plot.addEventListener("focus", function () { plot.classList.add("is-live"); show(idx); });
  plot.addEventListener("blur", function () { plot.classList.remove("is-live"); });
  plot.addEventListener("keydown", function (e) {
    var step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -4, PageUp: 4 }[e.key];
    if (e.key === "Home") step = -idx; if (e.key === "End") step = 51 - idx;
    if (step === undefined) return;
    e.preventDefault(); idx = Math.max(0, Math.min(51, idx + step)); show(idx);
  });
  if (params.get("state") === "tooltip") { idx = 28; plot.classList.add("is-live"); show(idx); }

  /* ---------- G43 heat strips: 30 days, four steps of one hue ---------- */
  var day0 = new Date(2026, 9, 22);
  function strip(el, seed, trend, base, startAt) {
    var r = rng(seed), cells = "";
    for (var d = 0; d < 30; d++) {
      var v;
      if (startAt !== undefined && d < startAt) v = -1;
      else {
        var t = startAt !== undefined ? (d - startAt) / (29 - startAt) : d / 29;
        v = base + trend * t * 0.5 + (r() - 0.5) * 0.35;
        var dow = (day0.getDay() + d) % 7;
        if (dow === 5 || dow === 6) v += 0.12;
        if (d === 22) v += 0.2; /* 13 Nov, the single */
      }
      var lvl = v < 0 ? 0 : v < 0.3 ? 1 : v < 0.55 ? 2 : v < 0.8 ? 3 : 4;
      var date = new Date(day0); date.setDate(date.getDate() + d);
      var label = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ": " + (lvl === 0 ? "not released" : ["", "low", "steady", "high", "peak"][lvl]);
      cells += '<i data-l="' + lvl + '" title="' + label + '"></i>';
    }
    el.innerHTML = cells;
  }
  var total = document.getElementById("heat-total");
  strip(total, 7, 0.9, 0.42);
  document.querySelectorAll("#tt-body tr[data-seed]").forEach(function (tr) {
    var h = tr.querySelector(".heat");
    strip(h, Number(tr.dataset.seed), Number(tr.dataset.trend), Number(tr.dataset.base), tr.dataset.start ? Number(tr.dataset.start) : undefined);
    h.setAttribute("role", "img");
    h.setAttribute("aria-label", "Daily listeners for " + tr.querySelector("b").textContent + ", 22 October to 20 November");
  });

  /* Spark bars for saves. */
  document.querySelectorAll(".spark").forEach(function (el) {
    var v = el.dataset.values.split(",").map(Number), m = Math.max.apply(null, v);
    el.innerHTML = v.map(function (n) { return '<i style="--v: ' + n + '"' + (n === m ? ' class="is-peak"' : "") + "></i>"; }).join("");
  });

  /* Donut drawn from its table. */
  var donut = document.getElementById("donut"), run = 0, arcs = '<circle class="d-track" r="60" cx="68" cy="68" pathLength="100"/>';
  document.querySelectorAll("#mix tr").forEach(function (tr) {
    var s = Number(tr.dataset.share);
    arcs += '<circle r="60" cx="68" cy="68" pathLength="100" style="stroke: ' + tr.style.getPropertyValue("--c") + "; stroke-dasharray: " + (s - 1.2) + " " + (100 - s + 1.2) + "; stroke-dashoffset: " + (-run) + '"/>';
    run += s;
  });
  donut.insertAdjacentHTML("afterbegin", '<svg viewBox="0 0 136 136">' + arcs + "</svg>");

  /* ---------- Countdown to 00:00 on Fri 11 Dec 2026 ---------- */
  var release = new Date(2026, 11, 11, 0, 0, 0);
  var cd = document.getElementById("countdown");
  var units = { d: cd.querySelector('[data-u="d"]'), h: cd.querySelector('[data-u="h"]'), m: cd.querySelector('[data-u="m"]'), s: cd.querySelector('[data-u="s"]') };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  function tick() {
    var ms = release - Date.now();
    if (ms <= 0) { cd.innerHTML = '<div class="out"><b>Out now</b></div>'; clearInterval(timer); return; }
    var s = Math.floor(ms / 1000);
    units.d.textContent = String(Math.floor(s / 86400));
    units.h.textContent = pad(Math.floor((s % 86400) / 3600));
    units.m.textContent = pad(Math.floor((s % 3600) / 60));
    units.s.textContent = pad(s % 60);
    cd.setAttribute("aria-label", units.d.textContent + " days " + units.h.textContent + " hours until release");
  }
  var timer = setInterval(tick, 1000);
  tick();

  /* ---------- Track filter, with its empty state ---------- */
  var q = document.getElementById("q"), rows = document.querySelectorAll("#tt-body tr[data-name]");
  var empty = document.getElementById("tt-empty");
  function filter() {
    var v = q.value.trim().toLowerCase(), shown = 0;
    rows.forEach(function (tr) { var ok = !v || tr.dataset.name.indexOf(v) !== -1; tr.hidden = !ok; if (ok) shown++; });
    empty.hidden = shown > 0;
    document.getElementById("tt-q").textContent = q.value.trim();
    live.textContent = v ? shown + " of 6 tracks shown" : "";
  }
  q.addEventListener("input", filter);
  document.getElementById("tt-clear").addEventListener("click", function () { q.value = ""; filter(); q.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); q.focus(); }
    if (e.key === "Escape" && document.activeElement === q) { q.value = ""; filter(); }
  });
  if (params.get("q")) { q.value = params.get("q"); filter(); }

  /* Range: this file holds the 28-day cut only; the control says so instead of pretending. */
  document.querySelectorAll('input[name="range"]').forEach(function (r) {
    r.addEventListener("change", function () { live.textContent = "Showing " + r.parentElement.textContent.trim() + ". This demo holds the 28-day figures."; });
  });

  /* Theme link keeps the other parameters. */
  var themeLink = document.getElementById("theme");
  var next = root.dataset.theme === "light" ? "dark" : "light";
  themeLink.href = "?theme=" + next;
  themeLink.setAttribute("aria-label", "Switch to " + next + " theme");

  /* Export: async button that keeps its width. */
  var exp = document.getElementById("export"), label = exp.querySelector(".t");
  exp.style.minWidth = exp.offsetWidth + "px";
  exp.addEventListener("click", function () {
    if (exp.getAttribute("aria-busy") === "true") return;
    exp.setAttribute("aria-busy", "true");
    label.textContent = "Preparing";
    setTimeout(function () {
      exp.removeAttribute("aria-busy");
      label.textContent = "Report ready";
      live.textContent = "Report for 24 Oct to 20 Nov is ready to download.";
      setTimeout(function () { label.textContent = "Export report"; }, 1800);
    }, 900);
  });

  /* Top bar gains its shadow only after scroll. */
  var top = document.querySelector(".top");
  window.addEventListener("scroll", function () { top.classList.toggle("is-scrolled", window.scrollY > 4); }, { passive: true });
})();
