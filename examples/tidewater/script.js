(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  /* ---------- Theme ---------- */
  var toggle = document.querySelector("[data-theme-toggle]");
  var dark = window.matchMedia("(prefers-color-scheme: dark)");
  function current() {
    return root.getAttribute("data-theme") || (dark.matches ? "dark" : "light");
  }
  function label() {
    toggle.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  toggle.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("tidewater-theme", next); } catch (e) { /* storage blocked: the choice lasts this visit */ }
    label();
  });
  dark.addEventListener("change", label);
  label();

  /* ---------- Nav gains its shadow only after scroll ---------- */
  var nav = document.querySelector("[data-nav]");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Tabs: surf break / harbour ---------- */
  var tablist = document.querySelector("[role=tablist]");
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role=tab]"));
  var spotLabel = document.querySelector("[data-spot-label]");
  var spots = ["Porthleven, Cornwall", "Falmouth Harbour, Cornwall"];
  function select(i, focus) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    tablist.setAttribute("data-index", String(i));
    spotLabel.textContent = spots[i];
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(i, false); });
    t.addEventListener("keydown", function (e) {
      var n = tabs.length, k = e.key, to = null;
      if (k === "ArrowRight") to = (i + 1) % n;
      else if (k === "ArrowLeft") to = (i - 1 + n) % n;
      else if (k === "Home") to = 0;
      else if (k === "End") to = n - 1;
      if (to !== null) { e.preventDefault(); select(to, true); }
    });
  });
  var q = new URLSearchParams(location.search);
  if (q.get("tab") === "harbour") select(1, false);

  /* ---------- Alert rule: which days this week would have alerted ---------- */
  var week = window.TIDEWATER_WEEK || [];
  var form = document.querySelector("[data-rule]");
  var inputs = {};
  form.querySelectorAll("[data-in]").forEach(function (el) { inputs[el.getAttribute("data-in")] = el; });
  var onSwitch = form.querySelector("[data-rule-on]");
  var list = document.querySelector("[data-list]");
  var count = document.querySelector("[data-count]");
  var empty = document.querySelector("[data-empty]");
  var hint = document.querySelector("[data-hint]");
  var units = { swell: " m", period: " s", wind: " kn" };
  var sendAt = { "2": function (i) { return week[(i + 5) % 7].day.split(" ")[0] + " 18:00"; },
                 "1": function (i) { return (i === 0 ? "Fri" : week[i - 1].day.split(" ")[0]) + " 18:00"; },
                 "0": function (i) { return week[i].day.split(" ")[0] + " 05:30"; } };

  // ponytail: a static week of data; the real app would read the live forecast.
  if (q.get("alerts") === "none") inputs.swell.value = "2.6";

  function fill(el) {
    var p = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty("--fill", p + "%");
  }

  function render() {
    var r = {
      swell: parseFloat(inputs.swell.value),
      period: parseInt(inputs.period.value, 10),
      wind: parseInt(inputs.wind.value, 10),
      offshore: inputs.offshore.checked,
      when: inputs.when.value
    };
    ["swell", "period", "wind"].forEach(function (k) {
      var v = k === "swell" ? r[k].toFixed(1) : r[k];
      form.querySelector('[data-out="' + k + '"]').textContent = v + units[k];
      fill(inputs[k]);
    });
    var on = onSwitch.checked;
    form.classList.toggle("is-off", !on);
    form.querySelector(".switch__label").textContent = on ? "On" : "Off";

    var hits = !on ? [] : week.map(function (d, i) { return { d: d, i: i }; }).filter(function (x) {
      var d = x.d;
      return d.best && d.swell >= r.swell && d.period >= r.period && d.wind <= r.wind && (!r.offshore || d.offshore);
    });

    list.textContent = "";
    hits.forEach(function (x, n) {
      var d = x.d;
      var li = document.createElement("li");
      li.className = "notice";
      li.style.animationDelay = n * 40 + "ms";
      li.innerHTML =
        '<span class="notice__icon" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M2.5 12.5c2.8 0 3.5-6 8.4-6s5.6 6 6.6 6"/><path d="M2.5 16h15"/></svg></span>' +
        '<span class="notice__meta"><span>Tidewater</span><span>' + sendAt[r.when](x.i) + "</span></span>" +
        '<span class="notice__title">Porthleven is on ' + d.long + ", " + d.best[0] + " to " + d.best[1] + "</span>" +
        '<span class="notice__body"><b>' + d.swell.toFixed(1) + " m</b> at <b>" + d.period + " s</b>, wind " + d.dir + " " + d.wind + " kn" + (d.offshore ? ", offshore" : "") + ".</span>";
      list.appendChild(li);
    });

    if (!on) {
      count.innerHTML = "Alert is off. Nothing will be sent.";
    } else {
      count.innerHTML = hits.length
        ? "<b>" + hits.length + (hits.length === 1 ? " day" : " days") + "</b> this week would send an alert"
        : "<b>No days</b> this week would send an alert";
    }
    empty.hidden = !on || hits.length > 0;
    if (on && !hits.length) {
      // Suggest the one change that brings back the nearest day.
      var best = null;
      week.forEach(function (d) {
        if (!d.best) return;
        var misses = [];
        if (d.swell < r.swell) misses.push("swell to " + d.swell.toFixed(1) + "\u00a0m");
        if (d.period < r.period) misses.push("period to " + d.period + "\u00a0s");
        if (d.wind > r.wind) misses.push("wind to " + d.wind + "\u00a0kn");
        if (r.offshore && !d.offshore) misses.push("allow cross-shore wind");
        if (misses.length && (!best || misses.length < best.m.length)) best = { m: misses, d: d };
      });
      hint.textContent = best ? "Set " + best.m.join(" and ") + " to catch " + best.d.long + "." : "";
    }
  }
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();

  /* ---------- One reveal style: rows and figures rise once ---------- */
  var targets = document.querySelectorAll(".week__table tbody tr, .ledger");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    targets.forEach(function (el, i) {
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--i", String(i % 7));
      io.observe(el);
    });
  }
})();
