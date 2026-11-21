(function () {
  "use strict";
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var euro = function (n) { return "€" + n.toLocaleString("en-GB"); };

  /* Nav: shadow only after scroll; phone menu as a sheet under the bar. */
  var nav = document.querySelector(".nav");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var menuBtn = document.querySelector(".nav__menu");
  var links = document.getElementById("nav-links");
  var setMenu = function (open) {
    links.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close the menu" : "Open the menu");
    menuBtn.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
  };
  menuBtn.addEventListener("click", function () { setMenu(!links.classList.contains("is-open")); });
  links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
  });

  /* One reveal style: bottles, the sheet and the pull quote rise once. Harvest bars draw in once. */
  var revealTargets = document.querySelectorAll(".wine, .sheet, .pull, .menu li, .order__sum");
  revealTargets.forEach(function (el, i) { el.classList.add("reveal"); el.style.setProperty("--i", String(i % 4)); });
  document.querySelectorAll(".cal__row").forEach(function (row, i) { row.style.setProperty("--n", String(i)); });
  var cal = document.querySelector(".cal");
  var showAll = params.get("reveal") === "all" || !("IntersectionObserver" in window);
  if (showAll) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
    cal.classList.add("is-in");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
    io.observe(cal);
  }

  /* Steppers: guests for the tasting, bottles for the case. */
  function stepper(group, min, max, onChange) {
    var out = group.querySelector("output");
    var dec = group.querySelector('[data-step="-1"]');
    var inc = group.querySelector('[data-step="1"]');
    var sync = function () {
      var v = Number(out.value || out.textContent);
      dec.disabled = v <= min;
      inc.disabled = v >= max;
    };
    group.addEventListener("click", function (e) {
      var b = e.target.closest("[data-step]");
      if (!b || b.disabled) return;
      var v = Math.min(max, Math.max(min, Number(out.textContent) + Number(b.dataset.step)));
      out.textContent = String(v);
      sync();
      onChange(v);
    });
    sync();
  }

  /* Booking. */
  var prices = { cellar: 25, walk: 45, harvest: 95 };
  var guestsOut = document.getElementById("b-guests");
  var sum = document.getElementById("b-sum");
  var form = document.getElementById("book");
  var updateSum = function () {
    var t = form.querySelector('input[name="tasting"]:checked').value;
    sum.textContent = euro(prices[t] * Number(guestsOut.textContent)) + " in all";
  };
  stepper(guestsOut.parentElement, 1, 10, updateSum);
  form.addEventListener("change", function (e) { if (e.target.name === "tasting") updateSum(); });

  var fields = {
    date: { el: document.getElementById("b-date"), help: "Tuesday to Saturday, from 24 November" },
    email: { el: document.getElementById("b-email"), help: "For the confirmation and directions" }
  };
  function problem(name) {
    var v = fields[name].el.value.trim();
    if (name === "date") {
      if (!v) return "Pick a date for the tasting.";
      var d = new Date(v + "T12:00:00");
      var day = d.getDay();
      if (day === 0 || day === 1) return "We are closed on Sundays and Mondays. Pick Tuesday to Saturday.";
      if (v < fields.date.el.min) return "The first free date is Tuesday 24 November.";
      if ((d.getMonth() === 11 && d.getDate() >= 20) || (d.getMonth() === 0 && d.getDate() <= 6)) return "The quinta is closed from 20 December to 6 January.";
      return "";
    }
    if (!v) return "Add an email so we can confirm.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Check the email: it needs an @ and a domain, like ana@example.pt.";
    return "";
  }
  function show(name) {
    var f = fields[name], msg = problem(name);
    var help = document.getElementById(f.el.getAttribute("aria-describedby"));
    f.el.setAttribute("aria-invalid", msg ? "true" : "false");
    help.classList.toggle("is-error", !!msg);
    help.innerHTML = msg ? '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg><span></span>' : "<span></span>";
    help.lastChild.textContent = msg || f.help;
    return !msg;
  }
  Object.keys(fields).forEach(function (name) {
    var el = fields[name].el;
    el.addEventListener("blur", function () { if (el.value) show(name); });
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") show(name); });
  });

  var submit = document.getElementById("b-submit");
  var status = document.getElementById("b-status");
  var timers = [];
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submit.getAttribute("aria-busy") === "true") return;
    var okDate = show("date"), okEmail = show("email");
    if (!okDate || !okEmail) {
      status.classList.add("is-error");
      status.textContent = "Two details need a look before we can send this.";
      if (okDate && !okEmail) status.textContent = "The email needs a look before we can send this.";
      if (!okDate && okEmail) status.textContent = "The date needs a look before we can send this.";
      (okDate ? fields.email.el : fields.date.el).focus();
      return;
    }
    timers.forEach(clearTimeout);
    status.classList.remove("is-error");
    status.textContent = "";
    submit.setAttribute("aria-busy", "true");
    submit.setAttribute("aria-disabled", "true");
    /* Spinner after 150 ms, held at least 400 ms, so it never flashes. */
    timers.push(setTimeout(function () { submit.dataset.state = "busy"; }, 150));
    timers.push(setTimeout(function () {
      submit.dataset.state = "done";
      submit.removeAttribute("aria-busy");
      submit.removeAttribute("aria-disabled");
      var d = new Date(fields.date.el.value + "T12:00:00");
      status.textContent = "Sent. We will confirm " + d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + " by email within a day.";
      timers.push(setTimeout(function () { delete submit.dataset.state; }, 1800));
    }, 1100));
  });

  /* Case builder: totals, shipping and the case drawn from above. */
  var rows = Array.prototype.slice.call(document.querySelectorAll(".order__list li"));
  var caseEl = document.getElementById("case");
  function total() {
    var bottles = 0, wine = 0, caps = [];
    rows.forEach(function (li) {
      var n = Number(li.querySelector("output").textContent), p = Number(li.dataset.price);
      li.querySelector(".order__line").textContent = euro(n * p);
      bottles += n; wine += n * p;
      for (var i = 0; i < n; i++) caps.push(li.style.getPropertyValue("--wine"));
    });
    var places = Math.max(6, Math.ceil(bottles / 6) * 6);
    var html = "";
    for (var j = 0; j < places; j++) html += caps[j] ? '<i style="--wine: ' + caps[j] + '"></i>' : "<i></i>";
    caseEl.innerHTML = html;
    var cases = Math.max(1, Math.ceil(bottles / 6));
    document.getElementById("case-note").textContent = bottles === 0
      ? "Your case is empty. Add a bottle to start."
      : bottles + " of " + places + " places filled" + (cases > 1 ? ", " + cases + " cases" : "");
    var ship = bottles === 0 ? 0 : bottles >= 6 ? 0 : 9;
    document.getElementById("o-bottles").textContent = String(bottles);
    document.getElementById("o-wine").textContent = euro(wine);
    document.getElementById("o-ship").textContent = bottles === 0 ? "None" : ship === 0 ? "Free" : euro(ship) + ", free from 6";
    document.getElementById("o-total").textContent = euro(wine + ship);
  }
  rows.forEach(function (li) { stepper(li.querySelector(".stepper"), 0, Number(li.dataset.max), total); });
  total();

  /* Screenshot states. */
  if (params.get("state") === "errors") {
    fields.date.el.value = "2026-11-30";
    fields.email.el.value = "ana.sousa@";
    form.requestSubmit();
  }
  if (params.get("state") === "sent") {
    fields.date.el.value = "2026-11-28";
    fields.email.el.value = "ana.sousa@example.pt";
    form.requestSubmit();
  }
})();
