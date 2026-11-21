/* Stride Tempo 3 drop page. */
(function () {
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var DROP = Date.UTC(2026, 11, 3, 9, 0, 0); /* Thursday 3 December 2026, 09:00 GMT */

  /* Countdown: one tick a second, digits in tabular figures so nothing shifts. */
  var cells = {};
  document.querySelectorAll("#clock [data-u]").forEach(function (b) { cells[b.dataset.u] = b; });
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    var left = Math.max(0, DROP - Date.now()), s = Math.floor(left / 1000);
    cells.d.textContent = pad(Math.floor(s / 86400));
    cells.h.textContent = pad(Math.floor(s % 86400 / 3600));
    cells.m.textContent = pad(Math.floor(s % 3600 / 60));
    cells.s.textContent = pad(s % 60);
    if (!left) { $(".clock__label span").textContent = "The drop is open"; return; }
    setTimeout(tick, 1000 - Date.now() % 1000);
  }
  tick();

  /* Colourways: one choice drives both drawings, the swatches and the sign-up form. */
  var CW = {
    chalk: { name: "Chalk", note: "Fig. 3, the launch colourway", parts: ["Off-white", "Bone", "Vermilion"] },
    night: { name: "Night shift", note: "Fig. 3, reflective heel tab", parts: ["Ink blue", "Slate", "Vermilion"] },
    lane: { name: "Lane 2", note: "Fig. 3, the club colour", parts: ["Track red", "Chalk", "Black"] }
  };
  var figs = [$("#hero-fig"), $("#cw-fig")];
  function setCw(k) {
    figs.forEach(function (f) { f.classList.remove("cw-chalk", "cw-night", "cw-lane"); f.classList.add("cw-" + k); });
    document.querySelectorAll("[data-cw]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cw === k ? "true" : "false"); });
    var c = CW[k];
    $("#cw-name").innerHTML = c.name + "<span>" + c.note + "</span>";
    var p = $("#cw-parts").querySelectorAll("b");
    c.parts.forEach(function (t, i) { p[i].textContent = t; });
    var r = document.querySelector('#nform input[value="' + c.name + '"]');
    if (r) r.checked = true;
  }
  document.querySelectorAll("[data-cw]").forEach(function (b) { b.addEventListener("click", function () { setCw(b.dataset.cw); }); });

  /* Size chart: UK 3 to 13 in half sizes, foot length grows 0.85 cm a size. */
  var EU = { 3: 35.5, 4: 37, 5: 38, 6: 39, 7: 40.5, 8: 42, 9: 43, 10: 44.5, 11: 45.5, 12: 47, 13: 48 };
  var sizes = [];
  for (var uk = 3; uk <= 13; uk += 0.5) {
    var lo = Math.floor(uk), eu = uk === lo ? EU[lo] : (EU[lo] + EU[lo + 1]) / 2;
    sizes.push({ uk: uk, eu: Math.round(eu * 2) / 2, usm: uk + 1, usw: uk + 2.5, cm: 21.8 + (uk - 3) * 0.85 });
  }
  function f1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
  function sz(n) { return n % 1 ? Math.floor(n) + "½" : String(n); }
  /* The chart lists whole sizes; each row also gives the half size above it, so 11 rows cover all 21 sizes. */
  $("#size-table tbody").innerHTML = sizes.filter(function (s) { return s.uk % 1 === 0; }).map(function (s) {
    var half = sizes[(s.uk - 3) * 2 + 1];
    return '<tr id="sz-' + s.uk + '"><th scope="row">' + sz(s.uk) + "</th><td>" + sz(s.eu) + "</td><td>" + sz(s.usm) + '</td><td class="us-w">' + sz(s.usw) + "</td><td>" + f1(s.cm) + "</td><td>" + (half ? f1(half.cm) : "\u2013") + "</td></tr>";
  }).join("");
  var sel = $("#n-size");
  sizes.forEach(function (s) { var o = document.createElement("option"); o.value = sz(s.uk); o.textContent = "UK " + sz(s.uk); sel.append(o); });

  /* Size finder: smallest size whose foot length is at least the measurement. */
  var foot = $("#foot"), footH = $("#foot-h"), out = $("#finder-out"), baseH = footH.textContent;
  function find() {
    document.querySelectorAll(".tbl tr.is-match").forEach(function (r) { r.classList.remove("is-match"); });
    var v = parseFloat(foot.value);
    if (!foot.value) { foot.removeAttribute("aria-invalid"); footH.textContent = baseH; footH.className = "help"; out.innerHTML = "<b>–</b><span>Enter a length to see your size</span><span>The chart row lights up too</span>"; return; }
    if (isNaN(v) || v < 21 || v > 30.3) {
      foot.setAttribute("aria-invalid", "true");
      footH.textContent = "Enter a length between 21 and 30.3 cm, like 26.4.";
      footH.className = "help is-err";
      return;
    }
    foot.removeAttribute("aria-invalid");
    footH.textContent = baseH; footH.className = "help";
    var i = sizes.findIndex(function (s) { return s.cm >= v - 0.05; });
    var s = sizes[i];
    out.innerHTML = "<b>" + sz(s.uk) + "</b><span><strong>UK " + sz(s.uk) + "</strong>, EU " + sz(s.eu) + ", US men " + sz(s.usm) + "</span><span>Fits feet up to " + f1(s.cm) + " cm</span>";
    $("#sz-" + Math.floor(s.uk)).classList.add("is-match");
    if (!sel.value) sel.value = sz(s.uk);
  }
  foot.addEventListener("input", function () { if (foot.getAttribute("aria-invalid") === "true" || parseFloat(foot.value) >= 21) find(); });
  foot.addEventListener("blur", find);
  $("#finder").addEventListener("submit", function (e) { e.preventDefault(); find(); });

  /* Sign-up forms: validate on submit and blur, then a button that keeps its width through three faces. */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function faces(btn, n) { btn.querySelectorAll(".faces > span").forEach(function (s, i) { s.classList.toggle("is-on", i === n); }); }
  function setErr(input, help, msg, base) {
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    help.textContent = msg || base;
    help.className = msg ? "help is-err" : "help";
  }
  function checkEmail(input, help, base) {
    var v = input.value.trim();
    if (!v) { setErr(input, help, "Enter your email so we can send the 09:00 link.", base); return false; }
    if (!EMAIL.test(v)) { setErr(input, help, "That address is missing something. Check the part after the @.", base); return false; }
    setErr(input, help, "", base); return true;
  }
  function submitting(btn, done) {
    if (btn.getAttribute("aria-busy") === "true") return;
    btn.setAttribute("aria-busy", "true");
    var t1 = setTimeout(function () { faces(btn, 1); }, 150);
    setTimeout(function () { clearTimeout(t1); faces(btn, 2); btn.removeAttribute("aria-busy"); done(); }, 900);
  }

  var qf = $("#quick"), qe = $("#q-email"), qh = $("#q-help"), qBase = qh.textContent, qb = qf.querySelector("button");
  qe.addEventListener("blur", function () { if (qe.value) checkEmail(qe, qh, qBase); });
  qe.addEventListener("input", function () { if (qe.getAttribute("aria-invalid") === "true") checkEmail(qe, qh, qBase); });
  qf.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!checkEmail(qe, qh, qBase)) { qe.focus(); return; }
    submitting(qb, function () {
      qh.textContent = "Done. We’ll email " + qe.value.trim() + " at 09:00 on 3 December.";
      qh.className = "help is-ok";
      $("#n-email").value = qe.value.trim();
    });
  });

  var nf = $("#nform"), ne = $("#n-email"), nh = $("#n-email-h"), nBase = nh.textContent, sh = $("#n-size-h"), sBase = sh.textContent, nb = nf.querySelector('button[type="submit"]');
  ne.addEventListener("blur", function () { if (ne.value) checkEmail(ne, nh, nBase); });
  ne.addEventListener("input", function () { if (ne.getAttribute("aria-invalid") === "true") checkEmail(ne, nh, nBase); });
  sel.addEventListener("change", function () { if (sel.value) setErr(sel, sh, "", sBase); });
  nf.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = checkEmail(ne, nh, nBase);
    if (!sel.value) { setErr(sel, sh, "Choose a size. The email links straight to it.", sBase); ok = false; }
    if (!ok) { nf.querySelector('[aria-invalid="true"]').focus(); return; }
    submitting(nb, function () {
      var cw = nf.querySelector('input[name="cw"]:checked').value;
      $("#done-t").textContent = "You’re on the list for 3 December.";
      $("#done-p").textContent = "At 09:00 GMT we’ll email " + ne.value.trim() + " a link to the Tempo 3 in " + cw + ", UK " + sel.value + ".";
      setTimeout(function () { nf.classList.add("is-done"); $("#again").focus(); }, 600);
    });
  });
  $("#again").addEventListener("click", function () { nf.classList.remove("is-done"); faces(nb, 0); sel.focus(); });

  /* Calendar file for the drop. */
  var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stride//Tempo 3 drop//EN", "BEGIN:VEVENT", "UID:tempo3-drop@stride.example",
    "DTSTAMP:20261121T090000Z", "DTSTART:20261203T090000Z", "DTEND:20261203T093000Z", "SUMMARY:Stride Tempo 3 drop opens", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  $("#ics").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

  /* Theme */
  $("#theme").addEventListener("click", function () {
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
  });

  /* The one scroll reveal: the Tempo 2 against Tempo 3 dumbbells draw once. */
  var vs = $("#vs");
  if ("IntersectionObserver" in window && !new URLSearchParams(location.search).has("static")) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { vs.classList.add("in"); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(vs);
  } else vs.classList.add("in");
})();
