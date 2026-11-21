/* Nata & Co. Small, dependency-free behaviours. The page reads fully without this file. */
(function () {
  var q = new URLSearchParams(location.search);
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  /* Opening hours in minutes after midnight, Lisbon time. Monday closed. */
  var HOURS = { 0: [420, 900], 1: null, 2: [360, 1140], 3: [360, 1140], 4: [360, 1140], 5: [360, 1200], 6: [360, 1200] };
  var hhmm = function (m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };

  /* Lisbon wall clock, whatever the visitor's zone. */
  function lisbonNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: day, min: +get("hour") * 60 + +get("minute") };
  }

  /* Open status in the nav. */
  var now = lisbonNow();
  var status = document.querySelector("[data-status]");
  if (status) {
    var h = HOURS[now.day], text;
    if (h && now.min >= h[0] && now.min < h[1]) {
      status.dataset.open = "true";
      text = "<b>Open now</b>, until " + hhmm(h[1]);
    } else {
      var d = now.day, step = 0;
      if (h && now.min < h[0]) text = "Opens today at " + hhmm(h[0]);
      else {
        do { d = (d + 1) % 7; step++; } while (!HOURS[d]);
        text = "Opens " + (step === 1 ? "tomorrow" : DAYS[d]) + " at " + hhmm(HOURS[d][0]);
      }
    }
    status.querySelector(".status__text").innerHTML = text;
  }

  /* Today in the hours table. */
  var today = document.querySelector('[data-hours] tr[data-day="' + now.day + '"]');
  if (today) today.classList.add("is-today");

  /* Sticky nav gains its shadow only after scroll. */
  var nav = document.querySelector(".nav");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Trays out on a weekday: every 25 minutes from 06:40, eighteen in all, on a 06:00 to 14:00 axis. */
  var row = document.querySelector("[data-trays]");
  if (row) {
    for (var i = 0; i < 18; i++) {
      var t = 400 + i * 25, dot = document.createElement("i");
      dot.style.left = ((t - 360) / 480 * 100).toFixed(2) + "%";
      dot.title = hhmm(t);
      row.appendChild(dot);
    }
  }

  /* The box: redraw the tarts for 6 or 12, and keep every price in step. */
  var BOX = { 6: { price: 7.8, cols: 3, rows: 2 }, 12: { price: 15, cols: 4, rows: 3 } };
  var SINGLE = 1.4;
  var euro = function (n) { return "€" + n.toFixed(2); };
  var tarts = document.querySelector("[data-tarts]");
  var svgBox = document.querySelector("[data-box]");
  function drawBox(size) {
    var b = BOX[size], w = 328, h = 228, x0 = 36, y0 = 36;
    var cw = w / b.cols, ch = h / b.rows, s = Math.min(cw, ch) / 62;
    var html = "";
    for (var r = 0, n = 0; r < b.rows; r++) for (var c = 0; c < b.cols; c++, n++) {
      var rot = (n * 47) % 360;
      html += '<g transform="translate(' + (x0 + cw * (c + 0.5)).toFixed(1) + " " + (y0 + ch * (r + 0.5)).toFixed(1) + ") scale(" + s.toFixed(3) + ") rotate(" + rot + ')"><g class="tart" style="--i:' + n + '"><use href="#tart"/></g></g>';
    }
    tarts.innerHTML = html;
    svgBox.dataset.box = size;
  }
  function setSize(size) {
    var b = BOX[size];
    drawBox(size);
    document.querySelector("[data-box-cap]").textContent = size + " tarts, " + euro(b.price);
    document.querySelector("[data-total]").textContent = euro(b.price);
    document.querySelector("[data-save]").textContent = (size == 6 ? "Six" : "Twelve") + " singles would be " + euro(size * SINGLE) + ". The box saves " + euro(size * SINGLE - b.price) + ".";
  }
  var form = document.querySelector("[data-order]");
  if (form && tarts) {
    form.querySelectorAll('input[name="size"]').forEach(function (r) {
      r.addEventListener("change", function () { setSize(r.value); });
    });
    setSize(form.querySelector('input[name="size"]:checked').value);
  }

  /* Collection days: the next seven open days. */
  var daySel = document.querySelector("[data-days]");
  if (daySel) {
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var opts = "", base = new Date(), count = 0;
    for (var k = 1; count < 7 && k < 14; k++) {
      var dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + k);
      if (!HOURS[dt.getDay()]) continue;
      var label = (k === 1 ? "Tomorrow, " : "") + DAYS[dt.getDay()] + " " + dt.getDate() + " " + MONTHS[dt.getMonth()];
      opts += "<option>" + label + "</option>";
      count++;
    }
    daySel.innerHTML = opts;
  }

  /* Validation: on blur first, then live once a field has shown an error. */
  var rules = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Add the name we should write on the lid."; },
    phone: function (v) { return /^[29]\d{8}$/.test(v.replace(/\s/g, "")) ? "" : "Use a Portuguese number of 9 digits, like 912 345 678."; }
  };
  var helpText = {};
  function check(input) {
    var msg = rules[input.name](input.value);
    var help = document.getElementById(input.getAttribute("aria-describedby"));
    if (!(input.name in helpText)) helpText[input.name] = help.textContent;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    help.textContent = msg || helpText[input.name];
    help.classList.toggle("field__help--error", !!msg);
    if (msg) input.dataset.touched = "1";
    return !msg;
  }
  if (form) {
    ["name", "phone"].forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener("blur", function () { if (el.value) check(el); });
      el.addEventListener("input", function () { if (el.dataset.touched) check(el); });
    });

    var btn = form.querySelector("[data-submit]");
    var msg = form.querySelector("[data-msg]");
    var timers = [];
    var clear = function () { timers.forEach(clearTimeout); timers = []; };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (btn.getAttribute("aria-busy") === "true") return;
      var okName = check(form.elements.name), okPhone = check(form.elements.phone);
      if (!okName || !okPhone) { (okName ? form.elements.phone : form.elements.name).focus(); return; }

      clear();
      msg.textContent = ""; msg.removeAttribute("data-kind");
      btn.setAttribute("aria-busy", "true"); btn.setAttribute("aria-disabled", "true");
      var started = Date.now();
      /* Spinner only after 150 ms, then held at least 400 ms so it never flashes. */
      timers.push(setTimeout(function () { btn.dataset.state = "busy"; }, 150));
      var fail = q.get("state") === "error";
      timers.push(setTimeout(function () {
        var wait = Math.max(0, 400 - (Date.now() - started - 150));
        timers.push(setTimeout(function () {
          btn.removeAttribute("aria-busy"); btn.removeAttribute("aria-disabled");
          if (fail) {
            btn.dataset.state = "idle";
            msg.dataset.kind = "error";
            msg.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>We could not reach the shop. Your details are still here; try again, or call +351 21 342 0612.';
            return;
          }
          var size = form.querySelector('input[name="size"]:checked').value;
          var ref = "NC-" + (4000 + Math.floor(Math.random() * 900));
          btn.dataset.state = "done";
          msg.dataset.kind = "ok";
          msg.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Box of ' + size + " held for " + form.elements.day.value + " at " + form.elements.time.value + ". Reference " + ref + ".";
          timers.push(setTimeout(function () { btn.dataset.state = "idle"; }, 2000));
        }, wait));
      }, 900));
    });
  }

  /* One reveal style: the pastries rise once as they enter. */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !document.documentElement.classList.contains("is-shot")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (el, n) { el.style.setProperty("--i", n % 4); io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
