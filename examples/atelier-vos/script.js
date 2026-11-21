(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* G32: the paper stock changes as each section reaches the middle of the viewport. */
  var layers = {};
  document.querySelectorAll(".tones i").forEach(function (i) { layers[i.dataset.tone] = i; });
  var current = "stock";
  function setTone(t) {
    if (t === current || !layers[t]) return;
    layers[current].classList.remove("is-on");
    layers[t].classList.add("is-on");
    current = t;
  }
  var navLinks = document.querySelectorAll(".nav a");
  var toneIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      setTone(e.target.dataset.tone);
      var id = e.target.id;
      navLinks.forEach(function (a) {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
        else if (id) a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  document.querySelectorAll("main > section[data-tone], .foot[data-tone]").forEach(function (s) { toneIO.observe(s); });

  /* Print-in: each drawing's pink plate registers once, the first time its sheet is in view. */
  var printIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-printed");
      printIO.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(".print").forEach(function (el) { printIO.observe(el); });

  /* Masthead gains its shadow only after scroll. */
  var mast = document.querySelector(".mast");
  function onScroll() { mast.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Phone menu */
  var menu = document.querySelector(".menu"), nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menu.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menu.focus(); }
  });

  /* Site visit form: validate on blur, then live; async send keeps its width. */
  var form = document.getElementById("visit");
  var send = form.querySelector(".form__send");
  var live = form.querySelector(".form__live");
  var rules = {
    "f-name": function (v) { return v.trim() ? "" : "Add your name so we know who to ask for."; },
    "f-mail": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Add an email like name@example.nl so we can reply."; }
  };
  var helpText = {};
  Object.keys(rules).forEach(function (id) {
    var input = document.getElementById(id), help = document.getElementById(id + "-help");
    helpText[id] = help.textContent;
    function check() {
      var msg = rules[id](input.value);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      help.textContent = msg || helpText[id];
      help.classList.toggle("is-error", !!msg);
      return !msg;
    }
    input.addEventListener("blur", function () { check(); input.dataset.touched = "1"; });
    input.addEventListener("input", function () { if (input.dataset.touched) check(); });
    input._check = check;
  });
  var timers = [];
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (send.getAttribute("aria-busy") === "true") return;
    var ok = true, first = null;
    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      input.dataset.touched = "1";
      if (!input._check() && ok) { ok = false; first = input; }
    });
    if (!ok) { first.focus(); return; }
    timers.forEach(clearTimeout);
    send.setAttribute("aria-busy", "true");
    send.setAttribute("aria-disabled", "true");
    timers.push(setTimeout(function () { send.dataset.state = "busy"; }, 150));
    /* ponytail: no backend in a static example; the request is simulated. */
    timers.push(setTimeout(function () {
      send.dataset.state = "ok";
      send.removeAttribute("aria-busy");
      send.removeAttribute("aria-disabled");
      live.textContent = "Sent. Femke, Joris or Noor will reply within three working days.";
      timers.push(setTimeout(function () { send.dataset.state = ""; }, 2000));
    }, 1100));
  });

  if (reduce) root.classList.add("reduced");
})();
