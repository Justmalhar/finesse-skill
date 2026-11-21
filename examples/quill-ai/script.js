(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Theme toggle. */
  var themeBtn = document.getElementById("theme-btn");
  function syncTheme() {
    var other = root.dataset.theme === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", "Switch to " + other + " theme");
  }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    syncTheme();
  });
  syncTheme();

  /* Nav: shadow only after scroll; menu sheet below 900px. */
  var nav = document.getElementById("nav");
  var menuBtn = nav.querySelector(".nav__menu");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  document.getElementById("nav-links").addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
  });

  /* One reveal style: evidence figures rise once. Visible without JS. */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !new URLSearchParams(location.search).has("static")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Annotated letter: hovering or focusing a marker or a note lights its sentence and note together. */
  function light(id, on) {
    var s = document.getElementById(id);
    var n = document.querySelector('.notes li[data-s="' + id + '"]');
    if (s) s.classList.toggle("is-on", on);
    if (n) n.classList.toggle("is-on", on);
  }
  document.querySelectorAll(".mk").forEach(function (mk) {
    var id = mk.getAttribute("href").replace("#n", "s");
    ["mouseenter", "focus"].forEach(function (ev) { mk.addEventListener(ev, function () { light(id, true); }); });
    ["mouseleave", "blur"].forEach(function (ev) { mk.addEventListener(ev, function () { light(id, false); }); });
  });
  document.querySelectorAll(".notes li").forEach(function (li) {
    li.addEventListener("mouseenter", function () { light(li.dataset.s, true); });
    li.addEventListener("mouseleave", function () { light(li.dataset.s, false); });
  });

  /* G30 rolling digits: the bill total. */
  var roll = document.getElementById("roll");
  var live = document.getElementById("total-live");
  var seats = document.getElementById("seats");
  var out = document.getElementById("seats-out");
  var lineSeats = document.getElementById("line-seats");
  var lineSum = document.getElementById("line-sum");
  var settle;
  var current = "";

  function strip() {
    var s = document.createElement("span");
    s.className = "roll__s";
    for (var i = 0; i < 10; i++) { var d = document.createElement("span"); d.textContent = i; s.appendChild(d); }
    var w = document.createElement("span");
    w.className = "roll__d";
    w.appendChild(s);
    return w;
  }
  function setRoll(text) {
    var oldDigits = current.replace(/\D/g, "");
    var newDigits = text.replace(/\D/g, "");
    if (text.length !== current.length || roll.children.length === 0) {
      /* New shape: rebuild, start each strip where the old digit in that place (from the right) stood. */
      roll.textContent = "";
      var di = 0;
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (/\d/.test(ch)) {
          var w = strip();
          var fromRight = newDigits.length - 1 - di;
          var prev = oldDigits[oldDigits.length - 1 - fromRight];
          w.firstChild.style.transform = "translateY(-" + (prev ? +prev : 0) + "em)";
          roll.appendChild(w);
          di++;
        } else {
          var sep = document.createElement("span");
          sep.className = "roll__sep";
          sep.textContent = ch;
          roll.appendChild(sep);
        }
      }
      void roll.offsetWidth; /* commit the start positions before moving */
    }
    var k = 0;
    roll.querySelectorAll(".roll__s").forEach(function (s) {
      s.style.transform = "translateY(-" + newDigits[k++] + "em)";
    });
    current = text;
  }

  function update(announce) {
    var n = +seats.value;
    var price = +document.querySelector('input[name="plan"]:checked').value;
    var total = n * price;
    var fmt = total.toLocaleString("en-US");
    seats.style.setProperty("--p", ((n - 1) / (+seats.max - 1)) * 100 + "%");
    out.textContent = n;
    lineSeats.textContent = n + (n === 1 ? " agent" : " agents") + " at $" + price;
    lineSum.textContent = "$" + fmt;
    roll.classList.toggle("is-still", !announce);
    setRoll(fmt);
    document.querySelectorAll("[data-step]").forEach(function (b) {
      var step = +b.dataset.step;
      b.disabled = (step < 0 && n <= +seats.min) || (step > 0 && n >= +seats.max);
    });
    if (announce) {
      clearTimeout(settle);
      settle = setTimeout(function () { live.textContent = "$" + fmt + " a month"; }, 500);
    }
  }
  seats.addEventListener("input", function () { update(true); });
  document.querySelectorAll('input[name="plan"]').forEach(function (r) { r.addEventListener("change", function () { update(true); }); });
  document.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      seats.value = Math.min(+seats.max, Math.max(+seats.min, +seats.value + +b.dataset.step));
      update(true);
    });
  });
  update(false);

  /* Trial form: validate on submit, then on input once an error has shown. */
  var form = document.getElementById("signup");
  var email = document.getElementById("email");
  var help = document.getElementById("email-help");
  var formLive = document.getElementById("signup-live");
  var helpText = help.textContent;
  var timers = [];
  function valid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function showError(msg) {
    email.setAttribute("aria-invalid", "true");
    help.textContent = msg;
    help.className = "field__help is-error";
  }
  function clearError() {
    email.removeAttribute("aria-invalid");
    help.textContent = helpText;
    help.className = "field__help";
  }
  email.addEventListener("input", function () {
    if (email.getAttribute("aria-invalid") === "true" && valid(email.value.trim())) clearError();
  });
  email.addEventListener("blur", function () {
    var v = email.value.trim();
    if (v && !valid(v)) showError("That address is missing something. Try the form name@company.com.");
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.dataset.state === "busy") return;
    var v = email.value.trim();
    if (!v) { showError("Enter your work email so we can send the setup link."); email.focus(); return; }
    if (!valid(v)) { showError("That address is missing something. Try the form name@company.com."); email.focus(); return; }
    clearError();
    timers.forEach(clearTimeout);
    var btn = form.querySelector(".signup__btn");
    form.dataset.state = "busy";
    btn.setAttribute("aria-busy", "true");
    btn.setAttribute("aria-disabled", "true");
    timers.push(setTimeout(function () {
      form.dataset.state = "done";
      btn.removeAttribute("aria-busy");
      btn.removeAttribute("aria-disabled");
      help.textContent = "Setup link sent to " + v + ". It works for 24 hours.";
      help.className = "field__help is-ok";
      formLive.textContent = "Setup link sent to " + v;
      timers.push(setTimeout(function () { form.dataset.state = ""; }, 2000));
    }, reduce.matches ? 400 : 1100));
  });
})();
