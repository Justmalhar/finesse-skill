(function () {
  var root = document.documentElement;

  /* Opening hours by weekday (0 = Sunday). Decimal hours; null = closed to the public. */
  var HOURS = { 0: [9.5, 18], 1: null, 2: [10, 17], 3: [10, 17], 4: [10, 17], 5: [10, 17], 6: [9.5, 18] };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var SHOWS = [
    { at: 11, kind: "Planetarium show", name: "Is the Moon following us?", c: "--g-sky" },
    { at: 12.25, kind: "Live in Spark Shed", name: "Big Static", c: "--g-spark" },
    { at: 13.5, kind: "Planetarium show", name: "Is the Moon following us?", c: "--g-sky" },
    { at: 14.5, kind: "Tiny Worlds", name: "Feeding the ants", c: "--g-tiny" },
    { at: 14.75, kind: "Live in Spark Shed", name: "Big Static", c: "--g-spark" },
    { at: 15.5, kind: "Planetarium show", name: "Is the Moon following us?", c: "--g-sky" }
  ];
  var AXIS_FROM = 9, AXIS_TO = 18.5;

  function fmt(h) {
    var m = Math.round((h % 1) * 60);
    return Math.floor(h) + ":" + (m < 10 ? "0" : "") + m;
  }
  function pct(h) { return ((h - AXIS_FROM) / (AXIS_TO - AXIS_FROM)) * 100 + "%"; }
  function nextOpen(day) {
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7;
      if (HOURS[d]) return { day: d, at: HOURS[d][0], i: i };
    }
  }

  var now = new Date();
  var day = now.getDay();
  var h = now.getHours() + now.getMinutes() / 60;
  var today = HOURS[day];
  var open = !!today && h >= today[0] && h < today[1];

  var chip = document.querySelector("[data-today-chip]");
  var chipWrap = chip && chip.closest(".openchip");
  var status = document.querySelector("[data-today-status]");
  var hoursEl = document.querySelector("[data-today-hours]");
  var dateEl = document.querySelector("[data-today-date]");
  var line = document.querySelector("[data-dayline]");

  dateEl.textContent = DAYS[day] + " " + now.getDate() + " " + MONTHS[now.getMonth()];

  if (today) {
    hoursEl.innerHTML = fmt(today[0]) + "<small>to</small>" + fmt(today[1]);
    line.style.setProperty("--from", pct(today[0]));
    line.style.setProperty("--to", pct(today[1]));
  } else {
    hoursEl.innerHTML = "Schools only";
    line.style.setProperty("--from", "0%");
    line.style.setProperty("--to", "0%");
  }

  var label;
  if (open) label = "Open today until " + fmt(today[1]);
  else if (today && h < today[0]) label = "Opens today at " + fmt(today[0]);
  else {
    var n = nextOpen(day);
    label = "Opens " + (n.i === 1 ? "tomorrow" : DAYS[n.day]) + " at " + fmt(n.at);
  }
  chip.textContent = label;
  chipWrap.dataset.open = String(open);
  status.dataset.open = String(open);
  status.lastElementChild.textContent = open ? "Open now" : (today && h < today[0] ? "Opens " + fmt(today[0]) : "Closed");

  if (h >= AXIS_FROM && h <= AXIS_TO) {
    var marker = line.querySelector(".dayline__now");
    line.style.setProperty("--now", pct(h));
    marker.hidden = false;
  }

  /* Highlight the current hour in the busy chart. */
  var bars = document.querySelectorAll("[data-busy] i");
  var idx = Math.floor(h) - 9;
  if (open && bars[idx]) bars[idx].classList.add("now");

  /* Next show today, or the first show of the next open day. */
  var nextEl = document.querySelector("[data-nextshow]");
  var show = null;
  if (today) for (var s = 0; s < SHOWS.length; s++) if (SHOWS[s].at > h && SHOWS[s].at < today[1]) { show = SHOWS[s]; break; }
  var lead = show ? "Next: " + show.kind : "First show next open day";
  if (!show) show = SHOWS[0];
  nextEl.style.setProperty("--c", "var(" + show.c + ")");
  nextEl.querySelector("p").innerHTML = "<span>" + lead + "</span>" + show.name;
  nextEl.querySelector("time").textContent = fmt(show.at);

  var row = document.querySelector('[data-week] tr[data-day="' + day + '"]');
  if (row) row.classList.add("is-today");

  /* Folder tabs: roving tabindex, arrows, Home and End. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      p.hidden = !on;
      p.classList.toggle("is-in", on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(t, false); });
    t.addEventListener("keydown", function (e) {
      var j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); select(tabs[j], true); }
    });
  });
  /* Planets on the hero map open their gallery's tab. */
  document.querySelectorAll("[data-goto]").forEach(function (a) {
    a.addEventListener("click", function () { select(document.getElementById("t-" + a.dataset.goto), false); });
  });
  var q = new URLSearchParams(location.search).get("gallery");
  if (q && document.getElementById("t-" + q)) select(document.getElementById("t-" + q), false);

  /* The page's one scroll reveal: the party timeline. */
  var reveal = document.querySelector(".twohours");
  if (root.dataset.reveal === "all" || !("IntersectionObserver" in window)) {
    reveal.classList.add("is-seen");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-seen"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(reveal);
  }
})();

/* Close the phone menu after a link is chosen. */
document.querySelectorAll(".menu a").forEach(function (a) {
  a.addEventListener("click", function () { a.closest("details").open = false; });
});
document.addEventListener("keydown", function (e) {
  var m = document.querySelector(".menu[open]");
  if (e.key === "Escape" && m) { m.open = false; m.querySelector("summary").focus(); }
});
