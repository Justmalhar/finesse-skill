(function () {
  var root = document.documentElement, state = root.dataset.state || "";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var gbp = function (n) { return (n < 0 ? "−£" : "£") + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var live = $("#live");

  /* Theme: a real toggle, remembered per browser. */
  var tbtn = $("[data-theme-toggle]");
  function syncThemeLabel() { tbtn.setAttribute("aria-label", "Switch to " + (root.dataset.theme === "dark" ? "light" : "dark") + " theme"); }
  syncThemeLabel();
  tbtn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("pw-theme", root.dataset.theme); } catch (e) { /* storage blocked: the toggle still works for this visit */ }
    syncThemeLabel();
  });

  /* Top bar gains its edge only after scroll. */
  var top = $(".top");
  window.addEventListener("scroll", function () { top.classList.toggle("is-scrolled", window.scrollY > 4); }, { passive: true });

  /* Loading state: every tile keeps its box and shows bars shaped like it. */
  var SKEL = {
    lead: '<i style="--w:42%;--h:48px;--mt:8px"></i><i style="--w:56%;--mt:16px"></i><i style="--w:100%;--h:220px;--mt:28px"></i>',
    kpi: '<i style="--w:48%;--mt:4px"></i><i style="--w:62%;--h:28px;--mt:16px"></i><i style="--w:40%;--mt:8px"></i><i style="--w:100%;--h:44px;--mt:20px"></i>',
    list: new Array(6).join('<i style="--w:100%;--h:36px;--mt:16px"></i>')
  };
  if (state === "loading") {
    $$("[data-skel]").forEach(function (el) {
      el.setAttribute("aria-busy", "true");
      el.insertAdjacentHTML("beforeend", '<div class="skel" aria-hidden="true">' + SKEL[el.dataset.skel] + "</div>");
    });
    live.textContent = "Loading November";
    return;
  }

  /* Smooth path through points: Catmull-Rom as cubic Béziers. */
  function curve(p) {
    var d = "M" + p[0][0] + " " + p[0][1];
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += "C" + r2(b[0] + (c[0] - a[0]) / 6) + " " + r2(b[1] + (c[1] - a[1]) / 6) + " " + r2(c[0] - (e[0] - b[0]) / 6) + " " + r2(c[1] - (e[1] - b[1]) / 6) + " " + c[0] + " " + c[1];
    }
    return d;
  }
  var lineOf = function (p) { return "M" + p.map(function (q) { return q[0] + " " + q[1]; }).join("L"); };

  /* ---------- Balance and plan, November. One source of truth: the daily spend list. ---------- */
  var START = 4126.40, RENT = 1350, SAVE = 600, GIG = 240, FLEX_BUDGET = 1355, DAYS = 30, TODAY = 21;
  var FLEX = [42.10, 18.40, 61.25, 12.80, 88.40, 35.60, 74.30, 22.15, 9.80, 54.20, 31.90, 46.75, 68.99, 27.40, 96.30, 14.20, 39.80, 51.60, 23.45, 118.60, 31.04];
  var actual = [START], plan = [START], spentByDay = [0];
  for (var d = 1; d <= DAYS; d++) {
    var fixed = (d === 1 ? RENT : 0) + (d === 2 ? SAVE : 0) - (d === 14 ? GIG : 0);
    plan.push(r2(START - RENT - (d >= 2 ? SAVE : 0) + (d >= 14 ? GIG : 0) - FLEX_BUDGET * d / DAYS));
    if (d <= TODAY) { actual.push(r2(actual[d - 1] - fixed - FLEX[d - 1])); spentByDay.push(r2(FLEX[d - 1] + (d === 1 ? RENT : 0))); }
  }
  /* ponytail: self-check that the chart agrees with the tiles; logs only if the figures drift. */
  if (Math.abs(actual[TODAY] - 1447.37) > 0.005 || Math.abs(plan[TODAY] - 1467.90) > 0.005) console.warn("Pennywise: balance figures drifted", actual[TODAY], plan[TODAY]);

  var MAX = 4500, X = function (i) { return r2(i / DAYS * 100); }, Y = function (v) { return r2(100 - v / MAX * 100); };
  var plot = $("#plot"), svg = $(".plot__svg", plot);
  var ap = actual.map(function (v, i) { return [X(i), Y(v)]; }), pp = plan.map(function (v, i) { return [X(i), Y(v)]; });
  var aLine = lineOf(ap), last = ap[ap.length - 1];
  svg.innerHTML =
    '<defs><linearGradient id="bal-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-opacity=".32"/><stop offset="1" stop-opacity="0"/></linearGradient></defs>' +
    '<path class="p-today" d="M' + last[0] + ' 0V100"/>' +
    '<path class="p-plan" d="' + lineOf(pp) + '"/>' +
    '<g class="series"><path class="p-area" d="' + aLine + "L" + last[0] + " 100L0 100Z" + '"/><path class="p-line" d="' + aLine + '"/></g>';
  plot.insertAdjacentHTML("beforeend",
    '<i class="endpt" style="--x:' + last[0] + "%;--y:" + last[1] + '"></i>' +
    '<span class="endlab" style="--x:' + last[0] + "%;--y:" + last[1] + '"><b class="num">' + gbp(actual[TODAY]) + '</b><span>today, 21 Nov</span></span>' +
    '<span class="paylab num" style="--y:' + pp[DAYS][1] + '">Plan ends ' + gbp(plan[DAYS]) + "</span>" +
    '<i class="cross"></i><i class="pt" data-s="a" style="--c: var(--chart-1)"></i><i class="pt" data-s="p" style="--c: var(--chart-2)"></i>' +
    '<div class="tip"><span class="tip__t num"></span><span class="tip__r"><i class="sw"></i>Balance<b class="num" data-t="a"></b></span><span class="tip__r"><i class="sw sw--dash"></i>Plan<b class="num" data-t="p"></b></span><span class="tip__d num" data-t="d"></span></div>');
  $(".chart__y").innerHTML = [4000, 3000, 2000, 1000, 0].map(function (v) { return '<span style="top:' + Y(v) + '%">' + (v ? "£" + v / 1000 + "k" : "£0") + "</span>"; }).join("");
  $(".chart__x").innerHTML = [1, 5, 10, 15, 21, 25, 30].map(function (dd) { return '<span class="' + (dd === TODAY ? "today" : dd === 5 || dd === 25 || dd === 15 ? "minor" : "") + '" style="left:' + X(dd) + '%">' + (dd === TODAY ? "Today" : dd + " Nov") + "</span>"; }).join("");

  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var idx = TODAY;
  function show(i) {
    idx = Math.max(0, Math.min(DAYS, i));
    var x = X(idx), has = idx <= TODAY, diff = has ? actual[idx] - plan[idx] : 0;
    plot.style.setProperty("--x", x + "%");
    $(".cross", plot).style.setProperty("--x", x + "%");
    $('.pt[data-s="p"]', plot).style.cssText = "--c: var(--chart-2); --x:" + x + "%; --y:" + Y(plan[idx]);
    var pa = $('.pt[data-s="a"]', plot);
    pa.style.cssText = "--c: var(--chart-1); --x:" + x + "%; --y:" + (has ? Y(actual[idx]) : 0);
    pa.hidden = !has;
    var tip = $(".tip", plot);
    tip.style.setProperty("--x", x + "%");
    tip.classList.toggle("is-left", idx > 18);
    var label = idx === 0 ? "Start of November" : WD[(idx + 6) % 7] + " " + idx + " Nov";
    $(".tip__t", tip).textContent = label;
    $('[data-t="a"]', tip).textContent = has ? gbp(actual[idx]) : "Not yet";
    $('[data-t="p"]', tip).textContent = gbp(plan[idx]);
    $('[data-t="d"]', tip).textContent = has ? (idx ? "Spent " + gbp(spentByDay[idx]) + ", " : "") + gbp(Math.abs(diff)) + (diff < 0 ? " under plan" : " over plan") : "Plan only, " + (idx - TODAY) + " days ahead";
    plot.setAttribute("aria-valuenow", String(idx));
    plot.setAttribute("aria-valuetext", label + ": balance " + (has ? gbp(actual[idx]) : "not yet known") + ", plan " + gbp(plan[idx]));
  }
  function fromPointer(e) { var b = plot.getBoundingClientRect(); show(Math.round((e.clientX - b.left) / b.width * DAYS)); }
  plot.addEventListener("pointermove", function (e) { plot.classList.add("is-live"); fromPointer(e); });
  plot.addEventListener("pointerdown", function (e) { plot.classList.add("is-live"); fromPointer(e); });
  plot.addEventListener("pointerleave", function () { if (document.activeElement !== plot) plot.classList.remove("is-live"); });
  plot.addEventListener("focus", function () { plot.classList.add("is-live"); show(idx); });
  plot.addEventListener("blur", function () { plot.classList.remove("is-live"); });
  plot.addEventListener("keydown", function (e) {
    var k = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1, PageDown: -7, PageUp: 7 }[e.key];
    if (e.key === "Home") { e.preventDefault(); show(0); } else if (e.key === "End") { e.preventDefault(); show(TODAY); } else if (k) { e.preventDefault(); show(idx + k); }
  });
  show(TODAY);
  if (new URLSearchParams(location.search).get("state") === "tooltip") { plot.classList.add("is-live"); show(14); }

  /* ---------- Small visuals ---------- */
  $$('[data-viz="bars"]').forEach(function (el) {
    var v = el.dataset.values.split(",").map(Number), max = Math.max.apply(0, v), min = Math.min.apply(0, v) * 0.9;
    el.innerHTML = v.map(function (x) { return '<i style="--v:' + r2((x - min) / (max - min)) + '"></i>'; }).join("");
  });
  $$('[data-viz="line"]').forEach(function (el) {
    var v = el.dataset.values.split(",").map(Number), lo = Math.min.apply(0, v), span = Math.max.apply(0, v) - lo, n = v.length - 1;
    var p = v.map(function (y, i) { return [r2(i / n * 100), r2(88 - (y - lo) / span * 76)]; }), dd = curve(p), end = p[n];
    el.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="sv-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--c);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--c);stop-opacity:0"/></linearGradient></defs><path style="fill:url(#sv-fill)" d="' + dd + "L100 100L0 100Z" + '"/><path class="v-line" d="' + dd + '"/></svg><i class="v-dot" style="left:' + end[0] + "%;top:" + end[1] + '%"></i>';
  });

  /* ---------- Monthly summary: stacked spending by category, income as a rule ---------- */
  var MONTHS = [
    ["Jun", [1590, 402, 165, 140, 310], 3850], ["Jul", [1588, 431, 198, 152, 388], 3850], ["Aug", [1601, 415, 240, 96, 520], 4120],
    ["Sep", [1593, 398, 172, 166, 295], 3850], ["Oct", [1597, 446, 204, 171, 336], 3910], ["Nov", [1452.49, 318.72, 211.40, 96.30, 240.12], 4090]
  ];
  var CC = ["var(--chart-3)", "var(--chart-6)", "var(--chart-5)", "var(--chart-4)", "var(--border-strong)"], MMAX = 5000;
  $(".mchart__y").innerHTML = [5000, 4000, 3000, 2000, 1000, 0].map(function (v) { return '<span style="top:' + (100 - v / MMAX * 100) + '%">' + (v ? "£" + v / 1000 + "k" : "£0") + "</span>"; }).join("");
  $(".mchart__plot").innerHTML = MONTHS.map(function (m, i) {
    var tot = m[1].reduce(function (a, b) { return a + b; }, 0);
    return '<div class="mcol' + (i === 5 ? " is-now" : "") + '" title="' + m[0] + ": spent " + gbp(tot) + ", income " + gbp(m[2]) + '">' +
      m[1].map(function (v, j) { return '<i style="--c:' + CC[j] + ";--v:" + r2(v / tot) + '"></i>'; }).join("").replace(/^/, '<div style="display:flex;flex-direction:column-reverse;height:' + r2(tot / MMAX * 100) + '%">') + "</div>" +
      '<b class="inc" style="--v:' + r2(m[2] / MMAX) + '"><span class="num">£' + (m[2] / 1000).toFixed(2).replace(/0$/, "") + "k</span></b></div>";
  }).join("");
  $(".mchart__x").innerHTML = MONTHS.map(function (m, i) { return i === 5 ? "<b>Nov, so far</b>" : "<span>" + m[0] + "</span>"; }).join("");

  /* ---------- Transactions: search filters the rows, empty state offers a way out ---------- */
  var search = $("#search"), body = $("#tx-body"), empty = $("#tx-empty");
  function filter() {
    var q = search.value.trim().toLowerCase(), shown = 0;
    $$("tr", body).forEach(function (tr) { var hit = !q || tr.textContent.toLowerCase().indexOf(q) > -1; tr.hidden = !hit; if (hit) shown++; });
    $("#tx-count").textContent = shown;
    empty.hidden = shown > 0;
    $("#tx-q").textContent = search.value.trim();
    $(".txt thead").hidden = shown === 0;
  }
  search.addEventListener("input", filter);
  search.addEventListener("keydown", function (e) { if (e.key === "Enter") { $("#tx").scrollIntoView({ block: "start" }); } if (e.key === "Escape") { search.value = ""; filter(); } });
  $("#tx-clear").addEventListener("click", function () { search.value = ""; filter(); search.focus(); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); search.focus(); search.select(); }
  });
  var qs = new URLSearchParams(location.search).get("q");
  if (qs) { search.value = qs; filter(); }

  /* ---------- Add a cash transaction ---------- */
  var dlg = $("#add"), form = $("#add-form"), opener = null;
  var CATS = { "6": ["Groceries", "sw--round", "var(--chart-6)"], "5": ["Eating out", "sw--diamond", "var(--chart-5)"], "4": ["Transport", "sw--ring", "var(--chart-4)"], "3": ["Home and bills", "", "var(--chart-3)"], "0": ["Everything else", "sw--bar", "var(--border-strong)"] };
  $("[data-open-add]").addEventListener("click", function (e) { opener = e.currentTarget; dlg.showModal(); $("#a-who").focus(); });
  $$("[data-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
  dlg.addEventListener("close", function () { if (opener) opener.focus(); });
  var checks = {
    "a-who": function (v) { return v.trim() ? "" : "Add who you paid."; },
    "a-amt": function (v) { var n = parseFloat(v.replace(",", ".")); return n > 0 && n < 100000 ? "" : "Enter an amount like 12.50."; }
  };
  var helps = {};
  function check(id) {
    var el = $("#" + id), h = $("#" + id + "-h"), msg = checks[id](el.value);
    if (!(id in helps)) helps[id] = h.textContent;
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    h.textContent = msg || helps[id]; h.classList.toggle("is-error", !!msg);
    return !msg;
  }
  Object.keys(checks).forEach(function (id) {
    var el = $("#" + id);
    el.addEventListener("blur", function () { el.dataset.t = "1"; check(id); });
    el.addEventListener("input", function () { if (el.dataset.t) check(id); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = ["a-who", "a-amt"].map(check).every(Boolean);
    if (!ok) { $('[aria-invalid="true"]', form).focus(); return; }
    var c = CATS[$("#a-cat").value], amt = parseFloat($("#a-amt").value.replace(",", "."));
    var tr = document.createElement("tr");
    tr.className = "is-new";
    tr.innerHTML = '<td class="num">Sat 21</td><td><b></b><small>Cash, added by you</small></td><td><span class="cat" style="--c:' + c[2] + '"><i class="sw ' + c[1] + '"></i>' + c[0] + '</span></td><td>Cash</td><td class="r num">−' + amt.toFixed(2) + "</td>";
    $("b", tr).textContent = $("#a-who").value.trim();
    body.prepend(tr);
    form.reset(); dlg.close();
    filter();
    live.textContent = "Added " + gbp(amt) + " to transactions.";
  });

  /* ---------- Sync: async button that never changes width ---------- */
  $$("[data-async]").forEach(function (b) {
    var timers = [];
    b.addEventListener("click", function () {
      if (b.getAttribute("aria-busy") === "true") return;
      timers.forEach(clearTimeout); timers = [];
      b.setAttribute("aria-busy", "true");
      timers.push(setTimeout(function () { b.dataset.state = "busy"; }, 150));
      /* ponytail: no bank connection in a static example; the sync is simulated. */
      timers.push(setTimeout(function () {
        b.dataset.state = "ok"; b.removeAttribute("aria-busy");
        live.textContent = "All three accounts are up to date.";
        timers.push(setTimeout(function () { b.dataset.state = ""; }, 1800));
      }, 1200));
    });
  });
})();
