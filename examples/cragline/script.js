/* Cragline logbook. One data source drives the lead chart, its legend, figure and summary strip. */
(function () {
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };

  /* 24 weeks, oldest first. W24 to W35 is the summer block, W36 to W47 the autumn block. */
  var starts = ["8 Jun", "15 Jun", "22 Jun", "29 Jun", "6 Jul", "13 Jul", "20 Jul", "27 Jul", "3 Aug", "10 Aug", "17 Aug", "24 Aug",
    "31 Aug", "7 Sep", "14 Sep", "21 Sep", "28 Sep", "5 Oct", "12 Oct", "19 Oct", "26 Oct", "2 Nov", "9 Nov", "16 Nov"];
  var easy = [5, 4, 6, 4, 5, 4, 5, 4, 5, 4, 4, 5, 6, 5, 7, 4, 5, 3, 4, 3, 2, 3, 2, 2];
  var mid = [4, 5, 4, 5, 4, 5, 5, 6, 4, 5, 5, 6, 4, 5, 5, 6, 7, 6, 7, 8, 6, 7, 8, 7];
  var hard = [0, 1, 0, 1, 1, 0, 1, 1, 0, 2, 1, 1, 0, 1, 1, 1, 2, 1, 2, 2, 3, 2, 3, 4];
  /* What each range compares against: the equal period before it, or the same weeks last year for 24. */
  var prior = {
    4: { total: 50, hard: 7, label: "previous 4 weeks", avg: 12.5 },
    12: { total: 122, hard: 9, label: "summer block", avg: 10.2 },
    24: { total: 231, hard: 11, label: "same weeks 2025", avg: 9.6 }
  };
  var sessions = { 4: 11, 12: 30, 24: 54 };
  var MAX = 16;

  var bars = $("#bars"), plot = $("#plot"), tip = $("#tip"), xaxis = $("#xaxis"), ref = $("#ref");
  var range = 12, view = [];

  function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
  function arrow(up) { return '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="' + (up ? "M6 9.5v-7M3 5.5l3-3 3 3" : "M6 2.5v7M3 6.5l3 3 3-3") + '"/></svg>'; }

  function render(animate) {
    var from = 24 - range;
    view = [];
    for (var i = from; i < 24; i++) view.push({ w: starts[i], e: easy[i], m: mid[i], h: hard[i], t: easy[i] + mid[i] + hard[i] });
    bars.style.setProperty("--cols", range);
    xaxis.style.setProperty("--cols", range);
    bars.style.setProperty("--bar-gap", range > 12 ? "4px" : "8px");
    bars.innerHTML = view.map(function (d, i) {
      return '<div class="bar" style="--t:' + d.t + ";--max:" + MAX + ";--i:" + i + '">' +
        '<i class="b-easy" style="--v:' + d.e + '"></i><i class="b-mid mid" style="--v:' + d.m + '"></i>' +
        (d.h ? '<i class="b-hard" style="--v:' + d.h + '"></i>' : "") + "</div>";
    }).join("");
    var step = range > 12 ? 4 : range > 4 ? 2 : 1;
    xaxis.innerHTML = view.map(function (d, i) {
      return "<span>" + ((range - 1 - i) % step === 0 ? d.w : "") + "</span>";
    }).join("");

    var tE = sum(view.map(function (d) { return d.e; })), tM = sum(view.map(function (d) { return d.m; })), tH = sum(view.map(function (d) { return d.h; }));
    var total = tE + tM + tH, p = prior[range];
    var pct = Math.round((total - p.total) / p.total * 100);
    $("#lead-total").innerHTML = total + '<span class="unit">sends</span>';
    var delta = $("#lead-delta");
    delta.className = "delta " + (pct >= 0 ? "delta--good" : "delta--bad");
    delta.innerHTML = arrow(pct >= 0) + "<span>" + Math.abs(pct) + "% vs " + p.label + '</span><span class="sr-only">' + (pct >= 0 ? "up" : "down") + "</span>";
    var lg = $("#lead-legend").querySelectorAll("b");
    lg[0].textContent = tH; lg[1].textContent = tM; lg[2].textContent = tE;

    ref.style.setProperty("--y", p.avg / MAX);
    ref.querySelector("span").textContent = "Prior average " + p.avg.toFixed(1);

    var best = view.reduce(function (b, d) { return d.t > b.t ? d : b; }, view[0]);
    $("#st-hard").textContent = tH + " sends";
    $("#st-hard-c").textContent = p.label + " " + p.hard;
    $("#st-avg").textContent = view.filter(function (d) { return d.t > p.avg; }).length + " of " + range + " wk";
    $("#st-avg-c").textContent = "average " + p.avg.toFixed(1) + " a week";
    $("#st-best").textContent = best.t + " sends";
    $("#st-best-c").textContent = "week of " + best.w;
    $("#st-ps").textContent = (total / sessions[range]).toFixed(1) + " sends";
    $("#st-ps-c").textContent = "over " + sessions[range] + " sessions";
    plot.setAttribute("aria-valuemax", range);
    plot.classList.remove("draw");
    if (animate) { void plot.offsetWidth; plot.classList.add("draw"); }
    setIdx(null);
  }

  /* Tooltip and keyboard readout share one index. */
  var idx = null;
  function setIdx(i) {
    idx = i;
    var list = bars.children;
    for (var k = 0; k < list.length; k++) list[k].classList.toggle("is-on", k === i);
    if (i === null) { plot.classList.remove("is-live"); plot.removeAttribute("aria-valuetext"); return; }
    var d = view[i], w = plot.clientWidth, x = (i + 0.5) / range * w;
    plot.classList.add("is-live");
    tip.style.setProperty("--x", x + "px");
    tip.classList.toggle("is-left", x > w - 220);
    tip.innerHTML = '<span class="tip__t">Week of ' + d.w + "</span>" +
      '<span class="tip__r"><i class="sw b-hard"></i>V5 and up<b>' + d.h + "</b></span>" +
      '<span class="tip__r"><i class="sw sw--dia b-mid"></i>V3 to V4<b>' + d.m + "</b></span>" +
      '<span class="tip__r"><i class="sw sw--ring b-easy"></i>V0 to V2<b>' + d.e + "</b></span>" +
      '<span class="tip__d">' + d.t + " sends that week</span>";
    plot.setAttribute("aria-valuenow", i + 1);
    plot.setAttribute("aria-valuetext", "Week of " + d.w + ": " + d.t + " sends, " + d.h + " at V5 or harder, " + d.m + " at V3 to V4, " + d.e + " at V0 to V2");
  }
  plot.addEventListener("pointermove", function (e) {
    var r = bars.getBoundingClientRect();
    var i = Math.floor((e.clientX - r.left) / r.width * range);
    setIdx(Math.max(0, Math.min(range - 1, i)));
  });
  plot.addEventListener("pointerleave", function () { if (document.activeElement !== plot) setIdx(null); });
  plot.addEventListener("blur", function () { setIdx(null); });
  plot.addEventListener("focus", function () { if (idx === null) setIdx(range - 1); });
  plot.addEventListener("keydown", function (e) {
    var n = idx === null ? range - 1 : idx;
    if (e.key === "ArrowLeft") n--; else if (e.key === "ArrowRight") n++;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = range - 1; else return;
    e.preventDefault();
    setIdx(Math.max(0, Math.min(range - 1, n)));
  });
  document.querySelectorAll('input[name="range"]').forEach(function (r) {
    r.addEventListener("change", function () { range = +r.value; render(false); });
  });

  /* Attempts per send, the last 12 weeks, against the summer block average. */
  (function trend() {
    var v = [3.5, 3.3, 3.4, 3.1, 3.0, 2.9, 2.8, 2.9, 2.7, 2.6, 2.5, 2.4], lo = 2, hi = 4;
    var y = function (a) { return (hi - a) / (hi - lo) * 100; };
    var d = v.map(function (a, i) { return (i ? "L" : "M") + (i / (v.length - 1) * 100).toFixed(2) + " " + y(a).toFixed(2); }).join(" ");
    var el = $("#trend");
    el.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="ref" d="M0 ' + y(3.4) + " L100 " + y(3.4) + '"/><path class="ln" d="' + d + '"/></svg>' +
      '<span class="ref-lab" style="top:' + y(3.4) + '%">Summer 3.4</span>' +
      '<i class="dot" style="left:100%;top:' + y(v[v.length - 1]) + '%"></i>';
  })();

  /* Search filters this week's routes and dims the pins that do not match. */
  var q = $("#q"), routes = document.querySelectorAll(".route"), pins = document.querySelectorAll(".pin");
  function filter() {
    var s = q.value.trim().toLowerCase().replace(/ê/g, "e"), shown = 0, keep = {};
    routes.forEach(function (r) {
      var ok = !s || r.dataset.k.indexOf(s) > -1;
      r.hidden = !ok;
      if (ok) { shown++; keep[r.dataset.r] = 1; }
    });
    pins.forEach(function (p) { p.classList.toggle("is-dim", !!s && !keep[p.dataset.r]); });
    $("#routes-none").hidden = shown > 0;
    $("#routes-q").textContent = "“" + q.value.trim() + "”";
  }
  q.addEventListener("input", filter);
  $("#clear-q").addEventListener("click", function () { q.value = ""; filter(); q.focus(); });
  routes.forEach(function (r) {
    var pin = document.querySelector('.pin[data-r="' + r.dataset.r + '"]');
    r.addEventListener("pointerenter", function () { pin.classList.add("is-hot"); });
    r.addEventListener("pointerleave", function () { pin.classList.remove("is-hot"); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
  });
  var preset = new URLSearchParams(location.search).get("q");
  if (preset) { q.value = preset; filter(); }

  /* Theme */
  $("#theme").addEventListener("click", function () {
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
  });

  /* Log a send: validate, save with an async button that keeps its width, then add the send to today's session. */
  var dlg = $("#log"), form = $("#log-form"), opener = $("#open-log"), save = $("#save-log");
  var fRoute = $("#f-route"), fAtt = $("#f-att"), hRoute = $("#f-route-h"), hAtt = $("#f-att-h");
  var helpRoute = hRoute.textContent, helpAtt = hAtt.textContent, timers = [];
  function face(n) { save.querySelectorAll(".btn__faces > span").forEach(function (s, i) { s.classList.toggle("is-on", i === n); }); }
  function err(input, help, msg, base) {
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    help.textContent = msg || base;
    help.classList.toggle("is-err", !!msg);
  }
  function validate() {
    var ok = true, style = form.querySelector('input[name="style"]:checked').value, att = +fAtt.value;
    if (!fRoute.value) { err(fRoute, hRoute, "Choose the route you sent.", helpRoute); ok = false; } else err(fRoute, hRoute, "", helpRoute);
    if (!att || att < 1) { err(fAtt, hAtt, "Attempts must be 1 or more.", helpAtt); ok = false; }
    else if (style === "Flash" && att !== 1) { err(fAtt, hAtt, "A flash is a first-go send. Set attempts to 1, or choose Redpoint.", helpAtt); ok = false; }
    else err(fAtt, hAtt, "", helpAtt);
    return ok;
  }
  opener.addEventListener("click", function () { dlg.showModal(); fRoute.focus(); });
  function close() { dlg.close(); }
  $("#close-log").addEventListener("click", close);
  $("#cancel-log").addEventListener("click", close);
  dlg.addEventListener("close", function () { timers.forEach(clearTimeout); timers = []; face(0); save.removeAttribute("aria-busy"); opener.focus(); });
  [fRoute, fAtt].forEach(function (el) {
    el.addEventListener("blur", validate);
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validate(); });
  });
  form.addEventListener("change", function (e) { if (e.target.name === "style" && fAtt.getAttribute("aria-invalid") === "true") validate(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (save.getAttribute("aria-busy") === "true") return;
    if (!validate()) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    save.setAttribute("aria-busy", "true");
    timers.push(setTimeout(function () { face(1); }, 150));
    timers.push(setTimeout(function () {
      face(2);
      var parts = fRoute.value.split("|"), g = +parts[1], style = form.querySelector('input[name="style"]:checked').value;
      addToToday(parts[0], g, style);
      toast("Logged " + parts[0] + ", V" + g + " " + style.toLowerCase() + ".");
      timers.push(setTimeout(close, 700));
    }, 900));
  });

  function band(g) { return g >= 5 ? "b-hard" : g >= 3 ? "b-mid" : "b-easy"; }
  function addToToday(name, g, style) {
    var today = document.querySelector(".ses.is-new");
    if (!today) {
      today = document.createElement("li");
      today.className = "ses is-new";
      today.innerHTML = '<span class="ses__d"><b>21</b><span>Sat</span></span><div class="ses__mid"><div class="dots"></div><p></p></div><span class="ses__r"><b>0</b>Today</span>';
      $("#sess").prepend(today);
    }
    var dot = document.createElement("i");
    dot.className = band(g); dot.textContent = "V" + g;
    today.querySelector(".dots").append(dot);
    var n = today.querySelectorAll(".dots i").length;
    today.querySelector(".ses__r b").textContent = n;
    today.querySelector("p").innerHTML = "<b>" + name + "</b> " + style.toLowerCase();
  }

  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    $("#toast-t").textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.hidden = true; }, 5000);
  }

  render(true);
  /* The stamp lands once, after the tickets are on screen. */
  setTimeout(function () { $("#t-crimson").classList.add("is-stamping"); }, 50);
  if (root.dataset.state === "dialog") opener.click();
  if (root.dataset.state === "tooltip") setIdx(8);
})();
