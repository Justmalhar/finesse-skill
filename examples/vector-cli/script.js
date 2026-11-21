(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* Theme toggle: flips data-theme for this visit; ?theme= sets it on load. */
  var toggle = document.querySelector("[data-theme-toggle]");
  function labelToggle() {
    var other = root.dataset.theme === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + other + " theme");
  }
  labelToggle();
  toggle.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    labelToggle();
  });

  /* Sticky nav gains its shadow only after scroll. */
  var nav = document.querySelector("[data-nav]");
  function onScroll() { nav.toggleAttribute("data-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Install tabs: roving tabindex, arrows, Home and End. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panel = document.getElementById("install-cmd");
  var cmdText = panel.querySelector("[data-cmd-text]");
  var swapTimer;
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", tab.id);
    if (focus) tab.focus();
    clearTimeout(swapTimer);
    panel.classList.add("is-swapping");
    swapTimer = setTimeout(function () {
      cmdText.textContent = tab.dataset.cmd;
      panel.classList.remove("is-swapping");
    }, 120);
    resetCopy(panel.querySelector("[data-copy]"));
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  /* Copy: idle, copied, failed. Faces share one grid cell; the result is announced politely. */
  var status = document.querySelector("[data-copy-status]");
  var timers = new WeakMap();
  function resetCopy(btn) {
    clearTimeout(timers.get(btn));
    btn.removeAttribute("data-state");
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.parentElement.querySelector("code > span:last-child").textContent;
      clearTimeout(timers.get(btn));
      function done(ok) {
        btn.dataset.state = ok ? "copied" : "failed";
        status.textContent = ok ? "Command copied" : "Copy failed. Select the command and copy it by hand.";
        if (!ok) {
          var range = document.createRange();
          range.selectNodeContents(btn.parentElement.querySelector("code > span:last-child"));
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        }
        timers.set(btn, setTimeout(function () { btn.removeAttribute("data-state"); }, ok ? 1800 : 4000));
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  });

  /* Benchmark bars draw in once, when the chart is in view. */
  var plot = document.querySelector("[data-reveal]");
  if (root.classList.contains("reveal-all") || !("IntersectionObserver" in window)) {
    plot.classList.add("is-in");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    io.observe(plot);
  }
})();
