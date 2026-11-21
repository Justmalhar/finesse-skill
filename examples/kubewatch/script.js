/* KubeWatch overview. Every figure on the page is computed from the same 24 hour series below, so tiles, charts and table agree. */
(function () {
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- Data: 289 samples, 5 minutes apart, 16:00 Friday to 16:00 Saturday ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6d2b79f5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var N = 289, START = 960; /* minutes after midnight of the first sample */
  var minuteOf = function (i) { return (START + i * 5) % 1440; };
  var clock = function (m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  var diurnal = function (h) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * (h - 2.5) / 24); };
  var lunch = function (h) { return Math.exp(-Math.pow(h - 13, 2) / 2); };
  /* The incident: checkout-api v2.41.0 at 13:05, rolled back at 13:34. Minutes counted on the second day. */
  function incident(m, day2) {
    if (!day2) return 0;
    if (m >= 785 && m < 800) return (m - 785) / 15;
    if (m >= 800 && m < 814) return 1 - 0.21 * (m - 800) / 14;
    if (m >= 814) return 0.79 * Math.exp(-(m - 814) / 6);
    return 0;
  }
  function series(seed, scale) {
    var r = rng(seed), req = [], err = [], lat = [], n1 = 0, n2 = 0, n3 = 0;
    for (var i = 0; i < N; i++) {
      var m = minuteOf(i), h = m / 60, day2 = i * 5 + START >= 1440;
      n1 = n1 * 0.7 + (r() - 0.5) * 0.3; n2 = n2 * 0.6 + (r() - 0.5) * 0.4; n3 = n3 * 0.7 + (r() - 0.5) * 0.3;
      var inc = scale === 1 ? incident(m, day2) : 0;
      var blip = scale === 1 && !day2 && m >= 1300 && m < 1340 ? 0.5 * Math.exp(-(m - 1305) / 9) * (m >= 1305 ? 1 : (m - 1300) / 5) : 0;
      req.push(Math.round((5200 + 13800 * diurnal(h) + 2200 * lunch(h)) * scale * (1 + n1 * 0.06) * (1 + inc * 0.05)));
      err.push(Math.max(0.02, 0.05 + 0.012 * diurnal(h) + n2 * 0.03 + 2.79 * inc + blip));
      lat.push(Math.round(168 + 46 * diurnal(h) + 22 * lunch(h) + n3 * 18 + 472 * inc));
    }
    return { req: req, err: err, lat: lat };
  }
  var D = series(11, 1), Y = series(29, 0.945);

  var DEPLOYS = [
    { svc: "search-indexer", ns: "search", ver: "v1.18.2", at: 17 * 60 + 12, st: "ok" },
    { svc: "payments-gateway", ns: "shop", ver: "v3.9.0", at: 21 * 60 + 40, st: "ok" },
    { svc: "cert-manager", ns: "platform", ver: "v1.16.1", at: 26 * 60 + 15, st: "ok" },
    { svc: "catalog-api", ns: "shop", ver: "v5.2.0", at: 33 * 60 + 30, st: "ok" },
    { svc: "ingress-nginx", ns: "platform", ver: "v1.12.0", at: 35 * 60 + 2, st: "ok" },
    { svc: "checkout-api", ns: "shop", ver: "v2.41.0", at: 37 * 60 + 5, st: "fail", back: { ver: "v2.40.3", at: 37 * 60 + 34 } },
    { svc: "recommendations", ns: "ml", ver: "v0.33.1", at: 39 * 60 + 20, st: "run", note: "canary 10%" }
  ];
  var NS = [
    { id: "shop", c: "var(--chart-3)", run: 409, pend: 1, bad: 2 },
    { id: "data", c: "var(--chart-6)", run: 284, pend: 2, bad: 0 },
    { id: "platform", c: "var(--text-muted)", run: 214, pend: 0, bad: 0 },
    { id: "ml", c: "var(--chart-2)", run: 195, pend: 0, bad: 3 },
    { id: "search", c: "color-mix(in oklab, var(--text) 38%, var(--surface))", run: 96, pend: 0, bad: 0 },
    { id: "7 others", c: "repeating-linear-gradient(-45deg, var(--border-strong) 0 2px, transparent 2px 4px)", run: 77, pend: 1, bad: 0 }
  ];
  var nsColor = function (id) { for (var k = 0; k < NS.length; k++) if (NS[k].id === id) return NS[k].c; return "var(--border-strong)"; };

  /* ---------- Totals ---------- */
  var totalReq = 0, total5xx = 0, ydayReq = 0;
  for (var i = 0; i < N - 1; i++) { totalReq += D.req[i] * 300; total5xx += D.req[i] * D.err[i] / 100 * 300; ydayReq += Y.req[i] * 300; }
  var fmtInt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var compact = function (n) { return n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n)); };
  var MINUS = "−";
  var signed = function (v, d) { return (v >= 0 ? "+" : MINUS) + Math.abs(v).toFixed(d); };
  function argmax(a, from) { var b = from || 0; for (var k = b; k < a.length; k++) if (a[k] > a[b]) b = k; return b; }

  /* Delta chip: arrow and sign for direction, colour for good or bad. */
  function delta(el, now, then, upIsGood, words) {
    var pct = (now - then) / then * 100, up = pct >= 0, good = up === upIsGood;
    el.innerHTML = '<span class="delta ' + (good ? "delta--good" : "delta--bad") + '"><svg aria-hidden="true"><use href="#i-' + (up ? "up" : "down") + '"/></svg>' + signed(pct, 1) + '%<span class="sr-only">, ' + (good ? "better" : "worse") + "</span></span>" + words;
  }

  /* ---------- Error budget card ---------- */
  var budgetToday = total5xx / (0.001 * totalReq * 30) * 100;
  $("[data-budget-today]").style.setProperty("--p", budgetToday.toFixed(1) + "%");
  $("[data-budget-note]").textContent = "Today spent " + budgetToday.toFixed(1) + "% of it, most at 13:05. Resets 1 December.";

  /* ---------- Band ---------- */
  var range = 288;
  var gEl = function (tag, attrs) { var s = '<' + tag; for (var k in attrs) s += " " + k + '="' + attrs[k] + '"'; return s + "/>"; };
  var MAX = { req: 25000, err: 3, lat: 800 };
  var TICKS = { req: [[25000, "25k"], [12500, "12.5k"], [0, "0"]], err: [[3, "3%"], [1.5, "1.5%"], [0, "0"]], lat: [[800, "800"], [400, "400"], [0, "0"]] };
  var SLO = { err: 1, lat: 400 };

  function pathOf(arr, a, max) {
    var w = N - 1 - a, s = "";
    for (var k = a; k < N; k++) s += (k === a ? "M" : "L") + ((k - a) / w * 288).toFixed(2) + " " + (100 - arr[k] / max * 100).toFixed(2);
    return s;
  }
  function draw() {
    var a = N - 1 - range, w = range;
    /* Requests: area, today's line, yesterday dashed. */
    var line = pathOf(D.req, a, MAX.req);
    $('[data-svg="req"]').innerHTML = '<defs><linearGradient id="g-req" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-opacity="0.32"/><stop offset="1" stop-opacity="0"/></linearGradient></defs>' +
      '<g class="series">' + gEl("path", { class: "p-area", d: line + "L288 100L0 100Z" }) + gEl("path", { class: "p-yday", d: pathOf(Y.req, a, MAX.req) }) + gEl("path", { class: "p-line", d: line }) + "</g>";
    /* Errors: bars per 15 minutes on a 24 hour range, per sample when zoomed; bars over the SLO turn red. */
    var step = range > 100 ? 3 : 1, bars = "", bw = 288 / (w / step);
    for (var k = a; k < N - 1; k += step) {
      var v = 0, c = 0;
      for (var j = k; j < Math.min(k + step, N); j++) { v += D.err[j]; c++; }
      v /= c;
      var x = (k - a) / w * 288, hgt = Math.min(v, MAX.err) / MAX.err * 100;
      bars += '<rect class="p-bar' + (v > SLO.err ? " is-over" : "") + '" x="' + (x + bw * 0.15).toFixed(2) + '" y="' + (100 - hgt).toFixed(2) + '" width="' + (bw * 0.7).toFixed(2) + '" height="' + hgt.toFixed(2) + '"/>';
    }
    var sloY = (100 - SLO.err / MAX.err * 100).toFixed(2);
    $('[data-svg="err"]').innerHTML = '<g class="series">' + bars + "</g>" + gEl("path", { class: "p-slo", d: "M0 " + sloY + "H288" });
    /* Latency: line, the band above the SLO shaded. */
    var latY = (100 - SLO.lat / MAX.lat * 100).toFixed(2);
    $('[data-svg="lat"]').innerHTML = gEl("path", { class: "p-over", d: "M0 0H288V" + latY + "H0Z" }) + '<g class="series">' + gEl("path", { class: "p-yday", d: pathOf(Y.lat, a, MAX.lat) }) + gEl("path", { class: "p-line", d: pathOf(D.lat, a, MAX.lat) }) + "</g>" + gEl("path", { class: "p-slo", d: "M0 " + latY + "H288" });

    /* Y axes and SLO tags, in HTML so the text never scales. */
    ["req", "err", "lat"].forEach(function (key) {
      $('[data-y="' + key + '"]').innerHTML = TICKS[key].map(function (t) { return '<span style="top:' + (100 - t[0] / MAX[key] * 100) + '%">' + t[1] + "</span>"; }).join("");
      var plot = $('[data-svg="' + key + '"]').parentNode;
      $$(".slo-tag, .peak", plot).forEach(function (n) { n.remove(); });
      if (SLO[key]) plot.insertAdjacentHTML("beforeend", '<span class="slo-tag num" style="top:' + (100 - SLO[key] / MAX[key] * 100) + '%">SLO ' + (key === "err" ? SLO.err + "%" : SLO.lat + " ms") + "</span>");
      var p = argmax(D[key], a);
      var val = key === "req" ? compact(D.req[p]) : key === "err" ? D.err[p].toFixed(2) + "%" : D.lat[p] + " ms";
      var px = (p - a) / w * 100;
      plot.insertAdjacentHTML("beforeend", '<span class="peak' + (px > 70 ? " peak--end" : px < 30 ? " peak--start" : "") + '" style="left:' + px + "%;top:" + (100 - Math.min(D[key][p], MAX[key]) / MAX[key] * 100) + '%">' + val + " at " + clock(minuteOf(p)) + "</span>");
    });

    /* X axis. */
    var every = range === 288 ? 48 : range === 72 ? 12 : 2, ax = "";
    for (var t = 0; t <= w; t += every) ax += '<span style="left:' + (t / w * 100) + '%">' + clock(minuteOf(a + t)) + "</span>";
    $("[data-xaxis]").innerHTML = ax;
    $("[data-band-sub]").textContent = "Last " + (range === 288 ? "24 hours" : range === 72 ? "6 hours" : "hour") + " at 5 minute resolution, all ingress traffic";

    /* Deploy lanes. Times are minutes since 00:00 Friday. */
    var t0 = 960 + a * 5, t1 = 960 + (N - 1) * 5, pos = function (m) { return (m - t0) / (t1 - t0) * 100; };
    $("[data-deploys]").innerHTML = DEPLOYS.map(function (d) {
      var x = pos(d.at), inside = x >= 0 && x <= 100, end = x > 70, h = "";
      if (inside) {
        var lab = '<em><b>' + d.ver + "</b> " + (d.st === "fail" ? "<span>failed, rolled back to " + d.back.ver + " at " + clock(d.back.at) + "</span>" : d.st === "run" ? "<span>" + d.note + ", since " + clock(d.at) + "</span>" : "<span>" + clock(d.at) + "</span>") + "</em>";
        if (d.st === "fail") {
          var xb = pos(d.back.at);
          h += '<span class="span-bad" style="left:' + x + "%;width:" + (xb - x) + '%"></span>';
          h += '<span class="mk mk--back' + (xb > 70 ? " mk--end" : "") + '" style="left:' + xb + '%"><i></i>' + (xb > 70 ? "" : lab) + "</span>";
          if (xb <= 70) lab = "";
        }
        if (d.st === "run") h += '<span class="canary" style="left:' + x + "%;right:0" + '"></span>';
        h += '<span class="mk mk--' + d.st + (end ? " mk--end" : "") + '" style="left:' + x + '%"><i></i>' + lab + "</span>";
      }
      return '<div class="dep" role="listitem"><p class="dep__name"><i class="ns-sw" style="--c:' + nsColor(d.ns) + '"></i><b>' + d.svc + "</b><span>" + d.ns + '</span></p><div class="dep__track">' + h + "</div></div>";
    }).join("");
    setScrub(scrubIndex == null ? null : Math.min(scrubIndex, range));
  }

  /* Figures beside each signal. */
  var now = N - 1;
  delta($('[data-delta="req"]'), D.req[now], Y.req[now], true, "vs yesterday 16:00");
  $('[data-cap="req"]').innerHTML = "<b>" + compact(totalReq) + "</b> requests in 24 h, " + signed((totalReq - ydayReq) / ydayReq * 100, 1) + "% on the day before";
  $('[data-fig="err"]').textContent = D.err[now].toFixed(2);
  delta($('[data-delta="err"]'), D.err[now], Y.err[now], false, "vs yesterday");
  $('[data-cap="err"]').innerHTML = "<b>" + fmtInt(total5xx) + "</b> 5xx in 24 h, availability " + (100 - total5xx / totalReq * 100).toFixed(3) + "%";
  $('[data-fig="lat"]').textContent = D.lat[now];
  delta($('[data-delta="lat"]'), D.lat[now], Y.lat[now], false, "vs yesterday");
  var over = 0; D.lat.forEach(function (v) { if (v > SLO.lat) over += 5; });
  $('[data-cap="lat"]').innerHTML = "Over the " + SLO.lat + " ms SLO for <b>" + over + " min</b> today";

  /* Screen-reader summary table. */
  $("[data-sr-table] tbody").innerHTML = "<tr><th>Requests now</th><td>" + fmtInt(D.req[now]) + " per second</td></tr><tr><th>Error rate now</th><td>" + D.err[now].toFixed(2) + "%</td></tr><tr><th>p95 latency now</th><td>" + D.lat[now] + " ms</td></tr><tr><th>Worst error rate</th><td>" + D.err[argmax(D.err)].toFixed(2) + "% at " + clock(minuteOf(argmax(D.err))) + "</td></tr>";

  /* ---------- Rolling digits (G30) on the live request rate ---------- */
  var odo = $("[data-odo]"), odoLive = $("[data-odo-live]"), lastSpoken = 0;
  function setOdo(n) {
    var s = fmtInt(n);
    if (odo.dataset.len !== String(s.length)) {
      odo.innerHTML = s.split("").map(function (ch) {
        return /\d/.test(ch) ? '<span class="odo__d">' + "0123456789".split("").map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</span>" : '<span class="odo__sep">' + ch + "</span>";
      }).join("");
      odo.dataset.len = s.length;
    }
    var strips = $$(".odo__d", odo), k = 0;
    s.split("").forEach(function (ch) { if (/\d/.test(ch)) strips[k++].style.transform = "translateY(" + (-ch) + "em)"; });
    if (Date.now() - lastSpoken > 30000) { odoLive.textContent = "Requests now " + s + " per second"; lastSpoken = Date.now(); }
  }
  var live = D.req[now];
  setOdo(live);
  var age = $("[data-age]"), since = 0, r2 = rng(5);
  setInterval(function () {
    since += 1;
    if (since >= 3) { since = 0; live = Math.round(live + (r2() - 0.48) * 260); setOdo(live); }
    age.textContent = since + "s ago";
  }, 1000);

  /* ---------- Crosshair and readout ---------- */
  var scrub = $("[data-scrub]"), tip = $("[data-tip]"), scrubIndex = null;
  function setScrub(idx) {
    if (idx == null) { scrub.classList.remove("is-live"); return; }
    scrubIndex = idx;
    var a = N - 1 - range, i2 = a + idx, x = idx / range * 100;
    scrub.style.setProperty("--x", x + "%");
    var sb = scrub.getBoundingClientRect();
    ["req", "err", "lat"].forEach(function (key) {
      var pb = $('[data-svg="' + key + '"]').getBoundingClientRect();
      var y = pb.top - sb.top + (1 - Math.min(D[key][i2], MAX[key]) / MAX[key]) * pb.height;
      scrub.style.setProperty("--y-" + key, y.toFixed(1) + "px");
    });
    var m = 960 + i2 * 5, dep = DEPLOYS.filter(function (d) { return Math.abs(d.at - m) <= 10 || (d.back && Math.abs(d.back.at - m) <= 10); })[0];
    tip.innerHTML = '<p class="tip__t">' + (m >= 1440 ? "Sat " : "Fri ") + clock(m) + "</p>" +
      '<p class="tip__r" style="--c: var(--chart-1)"><i></i>Requests<b>' + fmtInt(D.req[i2]) + ' <span class="unit">req/s</span></b></p>' +
      '<p class="tip__r" style="--c: var(--chart-5)"><i></i>5xx rate<b>' + D.err[i2].toFixed(2) + ' <span class="unit">%</span></b></p>' +
      '<p class="tip__r" style="--c: var(--chart-4)"><i></i>p95<b>' + D.lat[i2] + ' <span class="unit">ms</span></b></p>' +
      (dep ? '<p class="tip__d">Deploy: ' + dep.svc + " " + dep.ver + (dep.st === "fail" ? ", rolled back at " + clock(dep.back.at) : "") + "</p>" : '<p class="tip__d">Yesterday: ' + fmtInt(Y.req[i2]) + " req/s, " + Y.lat[i2] + " ms</p>");
    tip.classList.toggle("is-left", x > 66);
    scrub.classList.add("is-live");
    scrub.setAttribute("aria-valuenow", idx);
    scrub.setAttribute("aria-valuetext", clock(m) + ", " + fmtInt(D.req[i2]) + " requests per second, " + D.err[i2].toFixed(2) + "% errors, p95 " + D.lat[i2] + " ms");
  }
  function fromPointer(e) { var b = scrub.getBoundingClientRect(); setScrub(Math.round(Math.min(Math.max((e.clientX - b.left) / b.width, 0), 1) * range)); }
  scrub.addEventListener("pointermove", fromPointer);
  scrub.addEventListener("pointerdown", fromPointer);
  scrub.addEventListener("pointerleave", function () { if (document.activeElement !== scrub) setScrub(null); });
  scrub.addEventListener("focus", function () { setScrub(scrubIndex == null ? range : scrubIndex); });
  scrub.addEventListener("blur", function () { setScrub(null); });
  scrub.addEventListener("keydown", function (e) {
    var k = { ArrowLeft: -1, ArrowRight: 1, PageDown: -12, PageUp: 12 }[e.key], i3 = scrubIndex == null ? range : scrubIndex;
    if (e.key === "Home") i3 = 0; else if (e.key === "End") i3 = range; else if (k) i3 += k; else return;
    e.preventDefault();
    setScrub(Math.min(Math.max(i3, 0), range));
  });

  $$('input[name="range"]').forEach(function (r) { r.addEventListener("change", function () { range = +r.value; scrubIndex = null; draw(); }); });
  draw();
  /* A screenshot can open the readout at a given sample: ?at=255 */
  var at = new URLSearchParams(location.search).get("at");
  if (at !== null) setScrub(Math.min(Math.max(+at, 0), range));

  /* ---------- Node strip by zone ---------- */
  $("[data-zones]").innerHTML = ["eu-west-1a", "eu-west-1b", "eu-west-1c"].map(function (z, zi) {
    var cells = "";
    for (var n = 0; n < 14; n++) {
      var cls = zi === 1 && n === 5 ? ' class="is-warn" title="ip-10-4-23-118, memory pressure"' : zi === 2 && n === 11 ? ' class="is-off" title="ip-10-4-41-207, cordoned for upgrade"' : "";
      cells += "<i" + cls + "></i>";
    }
    return '<div class="zone"><span>' + z + '</span><div class="zone__nodes" role="img" aria-label="' + z + ": 14 nodes" + (zi === 1 ? ", 1 under memory pressure" : zi === 2 ? ", 1 cordoned" : ", all ready") + '">' + cells + "</div></div>";
  }).join("");

  /* ---------- Pods by namespace ---------- */
  var podSum = NS.reduce(function (s, n) { return s + n.run + n.pend + n.bad; }, 0);
  var maxNs = Math.max.apply(null, NS.map(function (n) { return n.run + n.pend + n.bad; }));
  $("[data-pods-sum]").textContent = fmtInt(podSum);
  $("[data-pods-total]").textContent = fmtInt(podSum);
  $("[data-mixbar]").innerHTML = NS.map(function (n) { return '<i style="--v:' + (n.run + n.pend + n.bad) + ";--c:" + n.c + '" title="' + n.id + '"></i>'; }).join("");
  $("[data-pods]").innerHTML = NS.map(function (n) {
    var tot = n.run + n.pend + n.bad, f = function (v) { return (v / maxNs * 100).toFixed(2) + "%"; };
    return '<tr><th scope="row"><span><i class="ns-sw" style="--c:' + n.c + '"></i>' + n.id + '</span></th><td class="r">' + fmtInt(tot) +
      '</td><td class="phase"><span class="phasebar" style="--c:' + n.c + '"><i class="run" style="width:' + f(n.run) + '"></i><i class="pend" style="width:' + f(n.pend) + '"></i><i class="bad" style="width:' + f(n.bad) + '"></i></span></td>' +
      '<td class="r ' + (n.bad ? "fail-n" : "zero") + '">' + (n.bad ? n.bad + " CrashLoop" : n.pend ? n.pend + " pending" : "0") + "</td></tr>";
  }).join("");
  var retry = $("[data-retry]");
  if (retry) retry.addEventListener("click", function () { root.removeAttribute("data-state"); });

  /* ---------- Noisiest services ---------- */
  var SVC = [
    { svc: "checkout-api", ns: "shop", share: 0.71, reqShare: 0.12, p95: 236, restarts: 3, logs: 12400, shape: "incident" },
    { svc: "payments-gateway", ns: "shop", share: 0.09, reqShare: 0.06, p95: 312, restarts: 0, logs: 3100, shape: "blip" },
    { svc: "recommendations", ns: "ml", share: 0.07, reqShare: 0.18, p95: 188, restarts: 7, logs: 8900, shape: "crash" },
    { svc: "search-api", ns: "search", share: 0.05, reqShare: 0.22, p95: 96, restarts: 1, logs: 5200, shape: "flat" },
    { svc: "catalog-api", ns: "shop", share: 0.04, reqShare: 0.25, p95: 74, restarts: 0, logs: 2700, shape: "flat" },
    { svc: "auth-service", ns: "identity", share: 0.02, reqShare: 0.09, p95: 41, restarts: 0, logs: 1900, shape: "flat" }
  ].map(function (s, idx) {
    s.e5 = total5xx * s.share;
    s.rate = s.e5 / (totalReq * s.reqShare) * 100;
    var rr = rng(40 + idx), pts = [];
    for (var b = 0; b < 96; b++) {
      var m = minuteOf(b * 3), day2 = b * 15 + START >= 1440, v = 0.15 + rr() * 0.25;
      if (s.shape === "incident") v += incident(m, day2) * 9;
      if (s.shape === "blip" && !day2 && m >= 1300 && m < 1345) v += 3;
      if (s.shape === "crash" && b % 13 === 6) v += 1.6 + rr();
      pts.push(v);
    }
    s.pts = pts;
    return s;
  });
  var maxE5 = SVC[0].e5;
  function spark(pts) {
    var mx = Math.max.apply(null, pts), d = "";
    pts.forEach(function (v, k) { d += (k ? "L" : "M") + (k / (pts.length - 1) * 160).toFixed(1) + " " + (26 - v / mx * 24).toFixed(1); });
    return '<svg class="spark" viewBox="0 0 160 28" preserveAspectRatio="none" aria-hidden="true"><path class="base" d="M0 27.5H160"/><path d="' + d + '"/></svg>';
  }
  var sortKey = "e5", query = "";
  function renderTable() {
    var rows = SVC.filter(function (s) { return !query || (s.svc + " " + s.ns).indexOf(query) !== -1; })
      .sort(function (x, y) { return y[sortKey] - x[sortKey]; });
    $("[data-services]").innerHTML = rows.map(function (s) {
      return '<tr><td><span class="svc"><i class="ns-sw" style="--c:' + nsColor(s.ns) + '"></i><b>' + s.svc + "</b><span>" + s.ns + "</span></span></td>" +
        '<td class="r"><span class="e5">' + fmtInt(s.e5) + '<i style="--p:' + (s.e5 / maxE5 * 100).toFixed(1) + '%"></i></span></td>' +
        '<td class="r' + (s.rate > 0.1 ? " is-hot" : "") + '">' + s.rate.toFixed(3) + "%</td>" +
        "<td>" + spark(s.pts) + "</td>" +
        '<td class="r' + (s.p95 > 300 ? " is-hot" : "") + '">' + s.p95 + "</td>" +
        '<td class="r' + (s.restarts >= 3 ? " is-hot" : "") + '">' + s.restarts + "</td>" +
        '<td class="r">' + compact(s.logs) + "</td></tr>";
    }).join("");
    var none = !rows.length;
    $("[data-noresult]").hidden = !none;
    $("[data-q]").textContent = query;
  }
  $$("[data-sort]").forEach(function (b) {
    b.addEventListener("click", function () {
      sortKey = b.dataset.sort;
      $$(".stable th").forEach(function (th) { th.removeAttribute("aria-sort"); });
      b.parentNode.setAttribute("aria-sort", "descending");
      renderTable();
    });
  });
  var search = $("[data-search]");
  search.addEventListener("input", function () { query = search.value.trim().toLowerCase(); renderTable(); });
  $("[data-clear]").addEventListener("click", function () { search.value = ""; query = ""; renderTable(); search.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
  });
  var qs = new URLSearchParams(location.search).get("q");
  if (qs) { search.value = qs; query = qs.toLowerCase(); }
  renderTable();
  var share = SVC[0].share * 100;
  $("[data-noisy-sub]").textContent = "By 5xx responses in the last 24 hours. checkout-api alone sent " + share.toFixed(0) + "% of them.";

  /* ---------- Ack on the critical alert ---------- */
  var ack = $("[data-ack]"), ackLive = $("[data-ack-live]"), timers = [];
  if (ack) ack.addEventListener("click", function () {
    if (ack.getAttribute("aria-busy") === "true" || ack.dataset.state === "done") return;
    ack.setAttribute("aria-busy", "true");
    timers.push(setTimeout(function () { ack.dataset.state = "busy"; }, 150));
    timers.push(setTimeout(function () {
      ack.removeAttribute("aria-busy");
      ack.dataset.state = "done";
      ack.closest(".al").classList.add("is-acked");
      ackLive.textContent = "Alert acknowledged by Priya Raman.";
    }, 750));
  });
})();
