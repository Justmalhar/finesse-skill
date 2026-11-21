(function () {
  "use strict";

  /* ---------- Data ---------- */
  var TODAY = new Date(2026, 10, 21); // Saturday 21 November 2026
  var START = new Date(2026, 10, 16); // Monday of this week
  var LAST = new Date(2026, 11, 27); // diaries open six weeks ahead
  var CLOSED = ["2026-12-25", "2026-12-26"]; // Christmas Day, Boxing Day
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  var REASONS = [
    { id: "new", t: "A new problem", d: "Started recently and is not an emergency", mins: 15, who: ["okafor", "wierzbicki"] },
    { id: "ongoing", t: "An ongoing condition", d: "Asthma, diabetes, blood pressure, mental health", mins: 15, who: ["okafor", "wierzbicki"] },
    { id: "meds", t: "Medication review", d: "Side effects, doses, stopping a medicine", mins: 15, who: ["harte", "okafor"] },
    { id: "bloods", t: "Blood test", d: "Only if a clinician has asked for one", mins: 10, who: ["raman"] },
    { id: "jab", t: "Vaccination", d: "Flu, COVID-19, travel, childhood", mins: 10, who: ["raman"] },
    { id: "child", t: "A child under 5", d: "Longer slot, with a parent or carer", mins: 20, who: ["okafor", "wierzbicki", "raman"] }
  ];
  var PEOPLE = {
    okafor: { name: "Dr Amara Okafor", role: "GP", extra: "Speaks English and Igbo", ini: "AO", c: "var(--chart-1)", room: "Room 4, first floor. Lift by the front desk.", days: [1, 2, 3, 4], full: ["2026-11-24", "2026-12-03"] },
    wierzbicki: { name: "Dr Tomasz Wierzbicki", role: "GP", extra: "Speaks English and Polish", ini: "TW", c: "var(--chart-2)", room: "Room 2, ground floor.", days: [1, 3, 5], full: ["2026-11-23", "2026-11-27"] },
    raman: { name: "Priya Raman", role: "Practice nurse", extra: "Bloods, vaccines, dressings", ini: "PR", c: "var(--chart-3)", room: "Room 7, ground floor, step-free.", days: [1, 2, 3, 4, 5], full: ["2026-11-26"] },
    harte: { name: "Leon Harte", role: "Clinical pharmacist", extra: "Medicines and repeat prescriptions", ini: "LH", c: "var(--chart-4)", room: "Room 5, first floor. Lift by the front desk.", days: [2, 4], full: ["2026-11-24"] }
  };
  var SLOTS = [];
  [[8, 30, 14], [14, 0, 14]].forEach(function (b) {
    for (var i = 0; i < b[2]; i++) {
      var m = b[0] * 60 + b[1] + i * 15;
      SLOTS.push(pad(Math.floor(m / 60)) + ":" + pad(m % 60));
    }
  });

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function same(a, b) { return a && b && ymd(a) === ymd(b); }
  function addMin(t, n) { var p = t.split(":"), m = +p[0] * 60 + +p[1] + n; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function short(d) { return DAYS[d.getDay()].slice(0, 3) + " " + d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3); }

  /* Free times for one clinician on one day. Deterministic, so the diary is the same on every load. */
  function free(id, d) {
    var p = PEOPLE[id];
    if (d <= TODAY || d > LAST || CLOSED.indexOf(ymd(d)) >= 0 || p.days.indexOf(d.getDay()) < 0) return null; // closed
    if (p.full.indexOf(ymd(d)) >= 0) return [];
    var busy = 0.42 + hash(id + ymd(d)) * 0.5;
    return SLOTS.filter(function (s) {
      if (id === "okafor" && ymd(d) === "2026-11-25" && (s === "09:15" || s === "10:45")) return true;
      return hash(id + ymd(d) + s) > busy;
    });
  }
  function nextFree(id, from) {
    for (var d = new Date(from); d <= LAST; d.setDate(d.getDate() + 1)) {
      var f = free(id, d);
      if (f && f.length) return { d: new Date(d), t: f[0] };
    }
    return null;
  }

  /* ---------- State ---------- */
  var q = new URLSearchParams(location.search);
  var S = {
    reason: "new", who: "okafor",
    day: new Date(2026, 10, 25), time: "09:15", holdUntil: Date.now() + 581000,
    showErrors: true, touched: {}, loading: false
  };
  if (q.get("day")) { S.day = new Date(2026, 10, +q.get("day")); S.time = null; }
  if (q.get("state") === "empty") { S.reason = null; S.who = null; S.day = null; S.time = null; S.showErrors = false; }
  if (q.get("state") === "clean" || q.get("state") === "done") {
    S.showErrors = false;
    setVal("dob-d", "27"); setVal("dob-m", "03"); setVal("phone", "07700 900412");
  }

  var $ = function (id) { return document.getElementById(id); };
  function setVal(id, v) { document.getElementById(id).value = v; }

  /* ---------- Validation ---------- */
  function check() {
    var e = {};
    var name = $("name").value.trim();
    if (name.length < 2) e.name = { msg: "Enter the patient’s full name.", ids: ["name"] };

    var dd = $("dob-d").value.trim(), mm = $("dob-m").value.trim(), yy = $("dob-y").value.trim();
    if (!dd || !mm || !yy) {
      e.dob = { msg: "Enter the date of birth, for example 27 3 1987.", ids: [!dd && "dob-d", !mm && "dob-m", !yy && "dob-y"].filter(Boolean) };
    } else {
      var D = +dd, M = +mm, Y = +yy, dt = new Date(Y, M - 1, D);
      if (!(M >= 1 && M <= 12)) e.dob = { msg: "The month must be a number from 1 to 12.", ids: ["dob-m"] };
      else if (yy.length !== 4 || Y < 1900) e.dob = { msg: "Enter the year in full, like 1987.", ids: ["dob-y"] };
      else if (dt.getMonth() !== M - 1 || dt.getDate() !== D) e.dob = { msg: "There is no " + D + " " + MONTHS[M - 1] + ". Check the day and the month.", ids: ["dob-d", "dob-m"] };
      else if (dt > TODAY) e.dob = { msg: "The date of birth must be in the past.", ids: ["dob-y"] };
    }

    var digits = $("phone").value.replace(/[\s()-]/g, "").replace(/^\+44/, "0");
    if (!/^0\d{10}$/.test(digits)) e.phone = { msg: digits ? "Enter all 11 digits, like 07700 900412." : "Enter a mobile number so we can text you.", ids: ["phone"] };

    var mail = $("email").value.trim();
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) e.email = { msg: "Enter an email like name@example.com, or leave it blank.", ids: ["email"] };
    return e;
  }

  function paintFields(errs) {
    ["name", "dob", "phone", "email"].forEach(function (k) {
      var help = $(k + "-help");
      var shown = (S.showErrors || S.touched[k]) && errs[k];
      var inputs = k === "dob" ? ["dob-d", "dob-m", "dob-y"] : [k];
      inputs.forEach(function (id) {
        var bad = shown && errs[k].ids.indexOf(id) >= 0;
        var el = $(id);
        if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
        if (k === "dob") el.setAttribute("aria-describedby", "dob-help");
        var ok = el.parentNode.querySelector(".input__ok");
        if (ok) ok.hidden = !(S.touched[k] || S.showErrors) || !!errs[k] || !el.value.trim();
      });
      if (shown) {
        help.className = "help help--error";
        help.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg><span>' + errs[k].msg + "</span>";
      } else {
        help.className = "help";
        help.textContent = help.dataset.help;
      }
    });
  }

  /* ---------- Rendering ---------- */
  function renderReasons() {
    $("reasons").innerHTML = REASONS.map(function (r) {
      return '<label class="opt"><input class="radio" type="radio" name="reason" value="' + r.id + '"' + (S.reason === r.id ? " checked" : "") + '><span><span class="opt__t">' + r.t + '</span><span class="opt__d">' + r.d + '</span></span><span class="dur num">' + r.mins + " min</span></label>";
    }).join("");
    var r = reason();
    $("a1-meta").textContent = r ? r.mins + " minutes" : "";
  }
  function reason() { return REASONS.filter(function (r) { return r.id === S.reason; })[0]; }

  function renderPeople() {
    var r = reason();
    if (!r) { $("clinicians").innerHTML = '<p class="panel__note">Pick a reason in <a class="ref" href="#p-a1">A1</a> first. Not everyone sees everything.</p>'; $("a2-meta").textContent = ""; return; }
    $("a2-meta").textContent = r.who.length + " for this reason";
    $("clinicians").innerHTML = r.who.map(function (id) {
      var p = PEOPLE[id], n = nextFree(id, new Date(TODAY.getTime() + 864e5));
      var week = 0;
      for (var i = 1; i <= 7; i++) { var f = free(id, new Date(2026, 10, 21 + i)); if (f) week += f.length; }
      return '<label class="opt"><input class="radio" type="radio" name="who" value="' + id + '"' + (S.who === id ? " checked" : "") + '>' +
        '<span class="who"><span class="avatar" style="--c:' + p.c + '" aria-hidden="true">' + p.ini + '</span><span><span class="opt__t">' + p.name + '</span><span class="opt__d">' + p.role + ". " + p.extra + '</span><span class="opt__next num">' + (n ? "Next free <b>" + short(n.d) + ", " + n.t + "</b>" : "No free times in six weeks") + "</span></span></span>" +
        '<span class="next num"><b>' + week + '</b><span>times in<br>7 days</span></span></label>';
    }).join("");
  }

  /* B1 shows the six bookable weeks, Monday 16 November to Sunday 27 December, so no row is wasted on the past. */
  function renderCal() {
    var html = "";
    for (var w = 0; w < 6; w++) {
      html += "<tr>";
      for (var c = 0; c < 7; c++) {
        var d = new Date(2026, 10, 16 + w * 7 + c), n = d.getDate(), m = d.getMonth();
        var f = S.who ? free(S.who, d) : null;
        var lbl = n === 1 ? n + " " + MONTHS[m].slice(0, 3) : n;
        var today = same(d, TODAY) ? " day--today" : "";
        if (d <= TODAY || f === null) {
          var why = same(d, TODAY) ? "today, closed for booking" : d < TODAY ? "past" : CLOSED.indexOf(ymd(d)) >= 0 ? "bank holiday, closed" : "no clinic";
          html += '<td><span class="day ' + (d <= TODAY ? "day--past" : "day--closed") + today + '"><b class="num">' + lbl + '</b><span class="sr-only">' + why + "</span></span></td>";
          continue;
        }
        var cls = f.length === 0 ? "day--full" : f.length <= 3 ? "day--few" : "day--free";
        var label = DAYS[d.getDay()] + " " + n + " " + MONTHS[m] + ", " + (f.length ? f.length + " free times" : "fully booked");
        html += '<td><button type="button" class="day ' + cls + '" data-day="' + ymd(d) + '" aria-pressed="' + same(d, S.day) + '" aria-label="' + label + '"><b class="num">' + lbl + '</b><span class="num">' + (f.length ? f.length : "Full") + "</span></button></td>";
      }
      html += "</tr>";
    }
    $("cal-body").innerHTML = html;
  }

  function renderTimes() {
    var box = $("times"), meta = $("b2-meta");
    if (!S.who || !S.day) { meta.textContent = ""; box.innerHTML = '<p class="panel__note">Pick a day in <a class="ref" href="#p-b1">B1</a> to see the times.</p>'; return; }
    if (S.loading) { box.innerHTML = '<div class="skel" aria-label="Loading times">' + "<i></i>".repeat(8) + "</div>"; return; }
    var f = free(S.who, S.day) || [];
    meta.textContent = short(S.day) + ", " + (f.length ? f.length + " free" : "full");
    if (!f.length) {
      var n = nextFree(S.who, S.day), r = reason(), alt = null;
      r.who.forEach(function (id) { if (!alt && id !== S.who) { var g = free(id, S.day); if (g && g.length) alt = { id: id, t: g[0] }; } });
      box.innerHTML = '<div class="full"><div class="full__ghost" aria-hidden="true">' + "<i></i>".repeat(4) + '</div><div class="full__msg">' +
        "<h3>" + DAYS[S.day.getDay()] + " " + S.day.getDate() + " " + MONTHS[S.day.getMonth()] + " is fully booked</h3>" +
        "<p>" + PEOPLE[S.who].name + " has no times left that day. Cancellations show up here as soon as they happen.</p>" +
        '<div class="full__acts">' +
        (n ? '<button class="btn btn--primary" type="button" data-jump="' + ymd(n.d) + '" data-t="' + n.t + '">' + short(n.d) + ", " + n.t + "</button>" : "") +
        (alt ? '<button class="btn" type="button" data-alt="' + alt.id + '" data-t="' + alt.t + '">' + PEOPLE[alt.id].name + ", " + alt.t + "</button>" : "") +
        "</div></div></div>";
      return;
    }
    var am = f.filter(function (t) { return t < "12:00"; }), pm = f.filter(function (t) { return t >= "12:00"; });
    function group(label, list) {
      if (!list.length) return "";
      return '<fieldset class="times__group"><legend class="times__label"><span>' + label + '</span></legend><p class="sr-only">' + list.length + " free</p><div class=\"slots\">" +
        list.map(function (t) { return '<label class="slot"><input class="sr-only" type="radio" name="time" value="' + t + '"' + (S.time === t ? " checked" : "") + '><span>' + t + "</span></label>"; }).join("") + "</div></fieldset>";
    }
    var counts = '<span class="num">' + am.length + " morning, " + pm.length + " afternoon</span>";
    box.innerHTML = group("Morning", am) + group("Afternoon", pm) +
      (S.time ? '<p class="hold"><svg class="ring" viewBox="0 0 16 16" aria-hidden="true"><circle class="r-bg" cx="8" cy="8" r="6"/><circle class="r-fg" id="ring" cx="8" cy="8" r="6"/></svg><span><b class="num">' + S.time + "</b> is held for you for <b class=\"num\" id=\"hold-left\">" + left() + "</b>. After that it goes back on the list.</span></p>" : '<p class="hold">' + counts + "</p>");
    paintHold();
  }

  function left() {
    var s = Math.max(0, Math.round((S.holdUntil - Date.now()) / 1000));
    return Math.floor(s / 60) + ":" + pad(s % 60);
  }
  function paintHold() {
    var el = $("hold-left"), ring = $("ring");
    if (el) el.textContent = left();
    if (ring) ring.style.strokeDashoffset = (37.7 * (1 - Math.max(0, S.holdUntil - Date.now()) / 600000)).toFixed(2);
    var chip = $("chip-hold");
    if (chip) chip.querySelector(".mono").textContent = left();
  }

  function renderSum(errs) {
    var r = reason(), p = S.who && PEOPLE[S.who];
    var name = $("name").value.trim();
    var rows = [
      ["Reason", r ? r.t + "<small>" + r.mins + " minutes</small>" : '<span class="missing">Not chosen</span>', "a1"],
      ["With", p ? p.name + "<small>" + p.room + "</small>" : '<span class="missing">Not chosen</span>', "a2"],
      ["When", S.day && S.time ? DAYS[S.day.getDay()] + " " + S.day.getDate() + " " + MONTHS[S.day.getMonth()] + '<small class="num">' + S.time + " to " + addMin(S.time, r ? r.mins : 15) + "</small>" : '<span class="missing">' + (S.day ? "Choose a time" : "Choose a day") + "</span>", S.day ? "b2" : "b1"],
      ["Patient", name ? name + "<small>" + (Object.keys(errs).length ? Object.keys(errs).length + " details to fix" : "Details complete") + "</small>" : '<span class="missing">Not entered</span>', "c1"]
    ];
    $("sum").innerHTML = rows.map(function (x) {
      return "<div><dt>" + x[0] + "</dt><dd>" + x[1] + '</dd><a class="ref" href="#p-' + x[2] + '" aria-label="Change ' + x[0].toLowerCase() + " in " + x[2].toUpperCase() + '">' + x[2].toUpperCase() + "</a></div>";
    }).join("");
    $("book-label").textContent = S.day && S.time ? "Book " + short(S.day) + ", " + S.time : "Book appointment";
  }

  function renderStatus(errs) {
    var full = S.who && S.day && (free(S.who, S.day) || []).length === 0;
    var done = {
      a1: !!S.reason, a2: !!S.who, b1: !!S.day && !full, b2: !!S.time,
      c1: !Object.keys(errs).length, c2: false
    };
    var err = { c1: S.showErrors && Object.keys(errs).length > 0, b2: full };
    var count = 0;
    Object.keys(done).forEach(function (k) {
      if (done[k]) count++;
      var a = document.querySelector('[data-map="' + k + '"]'), panel = $("p-" + k);
      a.classList.toggle("is-done", done[k]);
      a.classList.toggle("is-error", !done[k] && !!err[k]);
      panel.classList.toggle("is-done", done[k]);
      panel.classList.toggle("is-error", !done[k] && !!err[k]);
      a.setAttribute("aria-label", k.toUpperCase() + (done[k] ? ", done" : err[k] ? ", needs attention" : ", to do"));
    });
    $("map-count").textContent = count + " of 6 done";

    /* Attention chips: only what needs doing now, from real counts, at most three. */
    var chips = [];
    var n = Object.keys(errs).length;
    if (S.showErrors && n) {
      var firstId = errs[Object.keys(errs)[0]].ids[0];
      chips.push('<a class="chip chip--urgent" href="#' + firstId + '" data-focus="' + firstId + '"><svg class="icon" aria-hidden="true"><use href="#i-warn"/></svg><span><b class="num">' + n + "</b> " + (n === 1 ? "detail" : "details") + " to fix in C1</span></a>");
    }
    if (S.time) chips.push('<a class="chip" id="chip-hold" href="#p-b2"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg><span><b class="num">' + S.time + "</b> held for you</span><span class=\"mono num\">" + left() + "</span></a>");
    if (full) chips.push('<a class="chip" href="#p-b2"><svg class="icon" aria-hidden="true"><use href="#i-cal"/></svg><span>' + short(S.day) + " is full, <b>see the next free time</b></span></a>");
    else if (S.who && S.day && !S.time) chips.push('<a class="chip" href="#p-b2"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg><span>Choose a time in B2</span></a>');
    $("chips").innerHTML = chips.slice(0, 3).join("");
    $("chips").hidden = !chips.length;
  }

  function render() {
    var errs = check();
    renderReasons(); renderPeople(); renderCal(); renderTimes();
    paintFields(errs); renderSum(errs); renderStatus(errs);
  }

  /* ---------- Events ---------- */
  var form = $("form");
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "reason") {
      S.reason = t.value;
      if (reason().who.indexOf(S.who) < 0) { S.who = null; S.time = null; }
      render();
    } else if (t.name === "who") {
      S.who = t.value; S.time = null;
      var n = nextFree(S.who, S.day && S.day > TODAY ? S.day : new Date(TODAY.getTime() + 864e5));
      if (n && !(S.day && (free(S.who, S.day) || []).length)) S.day = n.d;
      load();
    } else if (t.name === "time") {
      S.time = t.value; S.holdUntil = Date.now() + 600000;
      var errs = check(); renderTimes(); renderSum(errs); renderStatus(errs);
    }
  });

  /* A diary fetch: skeleton only if it takes longer than 300 ms. */
  var loadTimer = 0, skelTimer = 0;
  function load() {
    clearTimeout(loadTimer); clearTimeout(skelTimer);
    S.loading = false; render();
    skelTimer = setTimeout(function () { S.loading = true; renderTimes(); }, 300);
    loadTimer = setTimeout(function () { clearTimeout(skelTimer); S.loading = false; renderTimes(); }, 520);
  }

  $("cal-body").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-day]");
    if (!b) return;
    var p = b.dataset.day.split("-");
    S.day = new Date(+p[0], +p[1] - 1, +p[2]); S.time = null;
    load();
  });
  $("times").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-jump], button[data-alt]");
    if (!b) return;
    if (b.dataset.jump) { var p = b.dataset.jump.split("-"); S.day = new Date(+p[0], +p[1] - 1, +p[2]); }
    if (b.dataset.alt) S.who = b.dataset.alt;
    S.time = b.dataset.t; S.holdUntil = Date.now() + 600000;
    render();
    var r = form.querySelector('input[name="time"]:checked');
    if (r) r.focus();
  });

  /* Validate on blur, then live once a field has shown an error. */
  function fieldKey(id) { return id.indexOf("dob") === 0 ? "dob" : id; }
  ["name", "dob-d", "dob-m", "dob-y", "phone", "email"].forEach(function (id) {
    var el = $(id);
    el.addEventListener("blur", function () {
      var k = fieldKey(id);
      if (k === "dob" && document.activeElement && document.activeElement.id.indexOf("dob") === 0) return;
      S.touched[k] = true;
      var errs = check(); paintFields(errs); renderSum(errs); renderStatus(errs);
    });
    el.addEventListener("input", function () {
      var k = fieldKey(id);
      if (!(S.touched[k] || S.showErrors)) return;
      var errs = check(); paintFields(errs); renderSum(errs); renderStatus(errs);
    });
  });

  $("chips").addEventListener("click", function (e) {
    var a = e.target.closest("[data-focus]");
    if (a) { e.preventDefault(); $(a.dataset.focus).focus(); $(a.dataset.focus).scrollIntoView({ block: "center", behavior: "smooth" }); }
  });

  /* Book: reveal every error on press; otherwise a spinner that keeps the width, then the confirmation. */
  var book = $("book");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (book.getAttribute("aria-busy") === "true") return;
    S.showErrors = true;
    var errs = check();
    render();
    if (!S.time) { toast("Choose a time in B2 first."); $("p-b2").scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    var keys = Object.keys(errs);
    if (keys.length) { $(errs[keys[0]].ids[0]).focus(); return; }
    book.setAttribute("aria-busy", "true"); book.setAttribute("aria-disabled", "true");
    var spin = setTimeout(function () { book.dataset.state = "loading"; }, 150);
    setTimeout(function () { clearTimeout(spin); confirmBooking(); }, 900);
  });

  function confirmBooking() {
    var r = reason(), p = PEOPLE[S.who], d = S.day;
    var D = +$("dob-d").value, M = +$("dob-m").value, Y = +$("dob-y").value;
    var ref = "NFC-" + Math.floor(1000 + hash(ymd(d) + S.time) * 8999) + "-" + pad(d.getDate()) + "W";
    $("d-mon").textContent = MONTHS[d.getMonth()].slice(0, 3).toUpperCase();
    $("d-day").textContent = d.getDate();
    $("d-time").innerHTML = S.time + " <small>to " + addMin(S.time, r.mins) + "</small>";
    $("d-date").textContent = DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
    $("d-who").textContent = p.name + ", " + p.role;
    $("d-why").textContent = r.t;
    $("d-room").textContent = p.room;
    $("d-pat").textContent = $("name").value.trim() + ", born " + D + " " + MONTHS[M - 1] + " " + Y;
    $("d-ref").textContent = ref;
    $("done-sub").textContent = "We’ve texted the details to " + $("phone").value.trim() + ". Your reference is " + ref + ".";
    var stamp = ymd(d).replace(/-/g, "");
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Northside Family Clinic//Bookings//EN", "BEGIN:VEVENT",
      "UID:" + ref + "@northside-clinic.example", "DTSTAMP:20261121T090000Z",
      "DTSTART;TZID=Europe/London:" + stamp + "T" + S.time.replace(":", "") + "00",
      "DTEND;TZID=Europe/London:" + stamp + "T" + addMin(S.time, r.mins).replace(":", "") + "00",
      "SUMMARY:" + r.t + " with " + p.name, "LOCATION:Northside Family Clinic\\, 14 Harrow Lane\\, Leeds LS6 2QT",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    $("ics").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    clearInterval(tick);
    $("flow").hidden = true;
    $("done").hidden = false;
    book.removeAttribute("aria-busy"); book.removeAttribute("aria-disabled"); book.dataset.state = "idle";
    window.scrollTo(0, 0);
    $("done").focus({ preventScroll: true });
  }
  $("again").addEventListener("click", function () {
    $("done").hidden = true; $("flow").hidden = false;
    S.time = null; S.showErrors = false; S.touched = {};
    render(); tick = setInterval(onTick, 1000);
    $("flow-h").scrollIntoView();
  });

  var toastTimer = 0;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 5000);
  }

  /* Hold timer: one tick a second; when it runs out the time is released. */
  function onTick() {
    if (!S.time) return;
    if (Date.now() >= S.holdUntil) {
      var t = S.time; S.time = null; render();
      toast("Your hold on " + t + " ran out. Pick a time again in B2.");
      return;
    }
    paintHold();
  }
  var tick = setInterval(onTick, 1000);

  window.addEventListener("scroll", function () { $("bar").classList.toggle("is-scrolled", window.scrollY > 4); }, { passive: true });

  render();
  if (q.get("state") === "done") confirmBooking();
})();
