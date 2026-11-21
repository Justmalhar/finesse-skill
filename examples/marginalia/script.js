(function () {
  "use strict";
  var root = document.documentElement;
  var q = new URLSearchParams(location.search);
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* Theme toggle: flips the same variables ?theme= sets. */
  var toggle = document.querySelector("[data-theme-toggle]");
  function syncToggle() {
    var other = root.dataset.theme === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + other + " theme");
  }
  syncToggle();
  toggle.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    syncToggle();
  });

  /* Phone menu */
  var menuBtn = document.querySelector(".menubtn");
  var nav = document.getElementById("nav");
  function closeMenu() { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    if (open) nav.querySelector("a").focus();
  });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); menuBtn.focus(); }
  });

  /* Open now: hours in shop time (Europe/London), in minutes after midnight. */
  var HOURS = {
    Monday: [600, 1080], Tuesday: [600, 1080], Wednesday: [600, 1080], Thursday: [600, 1230],
    Friday: [600, 1080], Saturday: [570, 1080], Sunday: [660, 960]
  };
  var ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  function clock(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
  try {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = get("weekday"), now = Number(get("hour")) * 60 + Number(get("minute"));
    var h = HOURS[day];
    if (h) {
      var status = document.querySelector("[data-status]");
      var open = now >= h[0] && now < h[1];
      if (open) status.textContent = "Open now, until " + clock(h[1]);
      else if (now < h[0]) status.textContent = "Closed now, opens at " + clock(h[0]);
      else {
        var next = ORDER[(ORDER.indexOf(day) + 1) % 7];
        status.textContent = "Closed now, opens " + next + " at " + clock(HOURS[next][0]);
      }
      status.parentElement.dataset.open = String(open);
      document.querySelector("[data-today-label]").textContent = "Today, " + day;
      document.querySelector("[data-today-hours]").textContent = clock(h[0]) + " to " + clock(h[1]);
      document.querySelectorAll("[data-hours] [data-day]").forEach(function (row) {
        row.classList.toggle("is-today", row.dataset.day === day);
      });
    }
  } catch (err) { /* Keep the static hours. */ }

  /* Middlemarch: 86 chapters, coloured by the meeting that covers them. */
  var bar = document.querySelector("[data-chapters]");
  var firsts = [1, 13, 23, 34, 43, 54, 63, 72];
  for (var c = 1; c <= 86; c++) {
    var i = document.createElement("i");
    i.className = c <= 33 ? "m1" : c <= 62 ? "m2" : "m3";
    if (firsts.indexOf(c) > 0) i.classList.add("is-first");
    bar.appendChild(i);
  }

  /* G29 Row image peek: one element follows the pointer and takes the hovered row's cover. */
  var peek = document.querySelector("[data-peek]");
  var fine = matchMedia("(hover: hover) and (pointer: fine)");
  var tx = 0, ty = 0, x = 0, y = 0, raf = 0, current = null;
  function frame() {
    var k = reduce.matches ? 1 : 0.22;
    x += (tx - x) * k; y += (ty - y) * k;
    peek.style.setProperty("--x", x.toFixed(1) + "px");
    peek.style.setProperty("--y", y.toFixed(1) + "px");
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(frame) : 0;
  }
  function aim(e) {
    var w = peek.offsetWidth || 168, hgt = w * 1.5;
    tx = Math.min(e.clientX + 32, innerWidth - w - 16);
    ty = Math.max(16, Math.min(e.clientY - hgt / 2, innerHeight - hgt - 16));
    if (!raf) raf = requestAnimationFrame(frame);
  }
  document.querySelectorAll("[data-peek-list] .prow").forEach(function (row) {
    row.addEventListener("pointerenter", function (e) {
      if (!fine.matches) return;
      if (current !== row) {
        var cover = row.querySelector(".prow__thumb .cover").cloneNode(true);
        peek.replaceChildren(cover);
        current = row;
      }
      if (!peek.classList.contains("is-on")) { x = tx; y = ty; }
      aim(e);
      if (!peek.classList.contains("is-on")) { x = tx; y = ty; frame(); }
      peek.classList.add("is-on");
    });
    row.addEventListener("pointermove", function (e) { if (fine.matches) aim(e); });
    row.addEventListener("pointerleave", function () { peek.classList.remove("is-on"); });
  });
  addEventListener("scroll", function () { peek.classList.remove("is-on"); }, { passive: true });

  /* Newsletter forms: validate on submit and blur, then live; async states hold the button width. */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll("[data-signup]").forEach(function (form) {
    var input = form.querySelector("input");
    var btn = form.querySelector("button");
    var help = form.querySelector(".signup__help");
    var idleHelp = help.innerHTML;
    var shown = false, busy = false, timer = 0;

    function face(name) {
      btn.querySelectorAll("[data-face]").forEach(function (f) {
        var on = f.dataset.face === name;
        f.classList.toggle("is-on", on);
        f.setAttribute("aria-hidden", String(!on));
      });
    }
    function say(tone, html) {
      help.dataset.tone = tone || "";
      help.innerHTML = html;
    }
    function check() {
      var v = input.value.trim();
      if (!v) { input.setAttribute("aria-invalid", "true"); say("error", '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>Add your email address so we know where to send it.'); return false; }
      if (!EMAIL.test(v)) { input.setAttribute("aria-invalid", "true"); say("error", '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>That address looks incomplete. It needs a full domain, like name@example.com.'); return false; }
      input.removeAttribute("aria-invalid");
      say("", idleHelp);
      return true;
    }
    input.addEventListener("blur", function () { if (input.value.trim()) { shown = true; check(); } });
    input.addEventListener("input", function () { if (shown) check(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      shown = true;
      if (!check()) { input.focus(); return; }
      busy = true;
      btn.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      face("busy");
      clearTimeout(timer);
      /* No mailing service behind this example page: the request is simulated. ?signup=fail shows the failure path. */
      timer = setTimeout(function () {
        busy = false;
        btn.removeAttribute("aria-busy");
        btn.removeAttribute("aria-disabled");
        if (q.get("signup") === "fail") {
          face("idle");
          say("error", '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>We could not reach the mailing list just now. Your address is still here; try again in a minute.');
          return;
        }
        face("done");
        say("ok", '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Done. Your first letter arrives Friday 27 November at 8am.');
        input.value = "";
        timer = setTimeout(function () { face("idle"); }, 2000);
      }, 900);
    });
  });

  /* One reveal style: staff pick rows rise into place once. */
  var rows = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !root.classList.contains("static")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    rows.forEach(function (r) { io.observe(r); });
  } else {
    rows.forEach(function (r) { r.classList.add("is-in"); });
  }

  /* States for screenshots: ?state=error shows a validation error, ?state=done the success line. */
  var st = q.get("state");
  if (st === "error") { var f = document.querySelector("[data-signup]"); f.querySelector("input").value = "ruth@colegate"; f.requestSubmit(); }
  if (st === "done") { var g = document.querySelector("[data-signup]"); g.querySelector("input").value = "ruth@example.com"; g.requestSubmit(); }
})();
