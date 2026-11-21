/* Petal & Stem. Plain script; every section is complete without it. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Sticky nav gains its shadow only after scroll. */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("is-scrolled", scrollY > 8); }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Same-day cut-off: Zone 1 closes at 11:00, Monday to Saturday. */
  var msg = document.getElementById("cutoff-msg");
  var bar = document.getElementById("daybar");
  function cutoff() {
    var now = new Date(), day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var open = 7 * 60, close = 11 * 60;
    var progress = Math.min(1, Math.max(0, (mins - open) / (close - open)));
    bar.style.setProperty("--day", progress.toFixed(3));
    if (day !== 0 && mins < close) {
      var left = close - mins, h = Math.floor(left / 60), m = left % 60;
      msg.innerHTML = "Order in the next <b>" + (h ? h + " h " : "") + m + " min</b> for delivery today";
    } else {
      var next = day === 6 ? "Monday" : day === 0 ? "tomorrow, Monday" : "tomorrow";
      msg.innerHTML = "Today’s bikes have gone. Order now for <b>" + next + "</b>";
    }
  }
  cutoff();
  setInterval(cutoff, 60000);

  /* Leader lines from each hero note to its pin on the photograph. */
  var photo = document.getElementById("hero-photo");
  function leads() {
    document.querySelectorAll(".hero .note").forEach(function (n) {
      var pin = photo.querySelector('[data-pin="' + n.dataset.note + '"]');
      if (!pin) return;
      var len = n.getBoundingClientRect().left - pin.getBoundingClientRect().right - 4;
      n.style.setProperty("--lead", Math.max(0, len) + "px");
    });
  }
  leads();
  addEventListener("resize", leads);
  document.fonts && document.fonts.ready.then(leads);

  /* Basket: async add button holds its width; toast confirms. */
  var count = 0;
  var countEl = document.getElementById("basket-count");
  var basket = document.getElementById("basket");
  var toast = document.getElementById("toast");
  var toastText = document.getElementById("toast-text");
  var toastTimer;
  function face(btn, name) {
    btn.querySelectorAll("[data-face]").forEach(function (f) { f.classList.toggle("is-on", f.dataset.face === name); });
  }
  function showToast(text) {
    toastText.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 5000);
  }
  toast.addEventListener("pointerenter", function () { clearTimeout(toastTimer); });
  toast.addEventListener("pointerleave", function () { toastTimer = setTimeout(function () { toast.hidden = true; }, 2500); });
  document.querySelectorAll(".add").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.getAttribute("aria-busy") === "true") return;
      var size = btn.closest(".prod").querySelector(".sz input:checked").parentElement.textContent.trim();
      btn.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      var shown = setTimeout(function () { face(btn, "busy"); }, 150);
      setTimeout(function () {
        clearTimeout(shown);
        face(btn, "done");
        count += 1;
        countEl.textContent = count;
        countEl.setAttribute("aria-label", count + (count === 1 ? " item" : " items"));
        if (!reduce) { basket.classList.add("is-bump"); setTimeout(function () { basket.classList.remove("is-bump"); }, 400); }
        showToast(btn.dataset.name + ", " + size.toLowerCase() + ", added to your basket");
        setTimeout(function () { face(btn, "idle"); btn.removeAttribute("aria-busy"); btn.removeAttribute("aria-disabled"); }, 1800);
      }, 650);
    });
  });

  /* Subscription calculator. December 2026 has four Fridays; the 25th is a holiday. */
  var PRICES = { weekly: { regular: 32, grand: 46 }, fortnightly: { regular: 34, grand: 49 }, monthly: { regular: 36, grand: 52 } };
  var ONEOFF = { regular: 38, grand: 54 };
  var DEC = { weekly: 3, fortnightly: 2, monthly: 1 };
  var plan = document.getElementById("plan");
  function price() {
    var f = plan.freq.value, s = plan.size.value, p = PRICES[f][s];
    document.getElementById("per").textContent = "£" + p;
    document.getElementById("oneoff").textContent = "£" + ONEOFF[s];
    document.getElementById("save").textContent = "you save " + Math.round((1 - p / ONEOFF[s]) * 100) + "%";
    var n = DEC[f];
    document.getElementById("month").textContent = n + (n === 1 ? " delivery, £" : " deliveries, £") + n * p;
  }
  plan.addEventListener("change", price);
  price();
  var start = document.getElementById("start");
  plan.addEventListener("submit", function (e) {
    e.preventDefault();
    if (start.getAttribute("aria-busy") === "true") return;
    start.setAttribute("aria-busy", "true");
    start.setAttribute("aria-disabled", "true");
    face(start, "busy");
    setTimeout(function () {
      face(start, "done");
      showToast("Subscription saved. Your first bouquet comes on Friday 27 November.");
      setTimeout(function () { face(start, "idle"); start.removeAttribute("aria-busy"); start.removeAttribute("aria-disabled"); }, 2000);
    }, 800);
  });

  /* Postcode checker: validate on submit, then live once an error has shown. */
  var ZONES = {
    1: { codes: [1, 2, 3, 6, 7], text: "Zone 1, by bike. Order by <b>11:00</b> for delivery between 12:00 and 16:00 the same day. £5.", at: [318, 214] },
    2: { codes: [4, 5, 8, 9, 10, 11, 12, 15, 16], text: "Zone 2, by van. Order by <b>10:00</b> for delivery between 13:00 and 17:00 the same day. £7.", at: [440, 268] },
    3: { codes: [13, 14, 17, 21, 22, 28, 29, 30], text: "Zone 3, next day. Order by <b>16:00</b> and it arrives between 10:00 and 16:00 the day after. £9.", at: [520, 330] }
  };
  /* Rough centre of each postcode district on the drawn map. */
  var SPOTS = { 1: [330, 252], 2: [300, 222], 3: [236, 210], 6: [372, 196], 7: [392, 232], 4: [170, 200], 5: [270, 186], 8: [400, 280], 9: [296, 296], 10: [250, 316], 11: [176, 300], 12: [120, 240], 15: [490, 222], 16: [420, 322], 13: [210, 372], 14: [110, 336], 17: [400, 374], 21: [540, 300], 22: [470, 384], 28: [60, 214], 29: [44, 200], 30: [40, 168] };
  var form = document.getElementById("check");
  var input = document.getElementById("pc");
  var result = document.getElementById("pc-result");
  var hit = document.getElementById("m-hit");
  var rows = document.querySelectorAll(".zones tbody tr");
  var initial = result.innerHTML;
  var showed = false;
  function icon(id) { return '<svg class="icon" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function check(live) {
    var v = input.value.trim().toUpperCase().replace(/\s+/g, " ");
    var m = /^EH(\d{1,2})\b/.exec(v);
    var zone = null;
    if (m) Object.keys(ZONES).forEach(function (z) { if (ZONES[z].codes.indexOf(+m[1]) > -1) zone = z; });
    rows.forEach(function (r) { r.classList.toggle("is-hit", r.dataset.zone === zone); });
    result.className = "result";
    if (!v) {
      if (!live) { result.classList.add("is-error"); result.innerHTML = icon("i-alert") + "<span>Type a postcode first, like EH6 or EH10 4BF.</span>"; input.setAttribute("aria-invalid", "true"); }
      else { result.innerHTML = initial; input.removeAttribute("aria-invalid"); }
      hit.setAttribute("hidden", "");
      return false;
    }
    if (zone) {
      input.removeAttribute("aria-invalid");
      result.classList.add("is-ok");
      result.innerHTML = icon("i-check") + "<span>" + ZONES[zone].text + "</span>";
      var at = SPOTS[+m[1]] || ZONES[zone].at;
      hit.setAttribute("cx", at[0]);
      hit.setAttribute("cy", at[1]);
      hit.removeAttribute("hidden");
      return true;
    }
    input.setAttribute("aria-invalid", "true");
    result.classList.add("is-error");
    result.innerHTML = icon("i-alert") + (m
      ? "<span>We don’t reach EH" + m[1] + " yet. You can collect from the shop on Constitution Street any day we are open.</span>"
      : "<span>That doesn’t look like an Edinburgh postcode. They start with EH, like EH6.</span>");
    hit.setAttribute("hidden", "");
    return false;
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); check(false); showed = true; });
  input.addEventListener("input", function () { if (showed) check(true); });
  var q = new URLSearchParams(location.search);
  if (q.get("pc")) { input.value = q.get("pc"); check(false); showed = true; }

  /* One reveal style: product photos and the chart rise once as they enter. */
  var items = document.querySelectorAll(".reveal");
  if (!document.documentElement.classList.contains("js-reveal")) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
