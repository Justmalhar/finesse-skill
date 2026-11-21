(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  /* Theme toggle. */
  var themeBtn = document.getElementById("theme-btn");
  function syncTheme() {
    themeBtn.setAttribute("aria-label", "Switch to " + (root.dataset.theme === "dark" ? "light" : "dark") + " theme");
  }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    syncTheme();
  });
  syncTheme();

  /* Top bar: shadow after scroll, menu sheet on narrow screens. */
  var top = document.getElementById("top");
  var menuBtn = top.querySelector(".top__menu");
  function onScroll() { top.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    top.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!top.classList.contains("is-open")); });
  document.getElementById("nav").addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && top.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
  });

  /* Open or closed, in Melbourne time. Sessions per weekday (0 is Sunday), minutes after midnight. */
  var HOURS = {
    0: [[690, 960]],
    1: [],
    2: [[690, 900], [1050, 1290]],
    3: [[690, 900], [1050, 1290]],
    4: [[690, 900], [1050, 1290]],
    5: [[690, 900], [1050, 1350]],
    6: [[690, 900], [1050, 1350]]
  };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function hhmm(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
  function melbourneNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
      var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      return { day: day, min: +get("hour") * 60 + +get("minute") };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  var now = melbourneNow();
  var status = document.getElementById("status");
  var label = status.querySelector("span");
  var today = HOURS[now.day];
  var open = today.find(function (s) { return now.min >= s[0] && now.min < s[1]; });
  if (open) {
    status.classList.add("is-open");
    label.textContent = "Open now, until " + hhmm(open[1]);
  } else {
    status.classList.add("is-closed");
    var next = today.find(function (s) { return now.min < s[0]; });
    if (next) {
      label.textContent = "Closed, opens " + hhmm(next[0]);
    } else {
      for (var i = 1; i <= 7; i++) {
        var d = (now.day + i) % 7;
        if (HOURS[d].length) { label.textContent = "Closed, opens " + (i === 1 ? "tomorrow" : DAYS[d]) + " " + hhmm(HOURS[d][0][0]); break; }
      }
    }
  }
  var row = document.querySelector('.hours__t tr[data-day="' + now.day + '"]');
  if (row) row.classList.add("is-today");

  /* Mark the current half hour on the wait chart when we are open. */
  if (open) {
    var slotMin = now.min - (now.min % 30);
    var slot = document.querySelector('.waits__slot[data-t="' + hhmm(slotMin) + '"]');
    if (slot) slot.classList.add("is-now");
  }

  /* One reveal style: the two charts draw in once. Visible without JS. */
  var targets = document.querySelectorAll(".waits, .chart");
  if ("IntersectionObserver" in window && !params.has("static")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("is-in"); });
  }
})();
