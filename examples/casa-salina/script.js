(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* Theme toggle for this visit; ?theme= sets it on load. */
  var toggle = document.querySelector("[data-theme-toggle]");
  function labelToggle() {
    toggle.setAttribute("aria-label", "Switch to " + (root.dataset.theme === "dark" ? "light" : "dark") + " theme");
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

  /* The year chart's bars grow once, when it scrolls into view. */
  var year = document.querySelector(".year");
  if (!("IntersectionObserver" in window)) year.classList.add("is-in");
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    io.observe(year);
  }

  /* ---------- Booking: the price comes from the rates table on this page ---------- */
  var RATES = {
    magazzino: { low: 140, mid: 165, high: 195, peak: 230, name: "Magazzino" },
    terrazza: { low: 185, mid: 215, high: 250, peak: 290, name: "Terrazza" },
    torre: { low: 260, mid: 300, high: 350, peak: 410, name: "Torre" }
  };
  /* Month index 0 to 11 -> season. December to February is closed. */
  var SEASON = [null, null, "low", "mid", "mid", "high", "peak", "peak", "high", "mid", "low", null];
  var TAX = 2.5, THIRD_GUEST = 40;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  var form = document.querySelector("[data-form]");
  var f = form.elements;
  var est = document.querySelector("[data-estimate]");
  var lines = est.querySelector("[data-est-lines]");
  var totalEl = est.querySelector("[data-est-total]");
  var datesEl = est.querySelector("[data-est-dates]");
  var submit = form.querySelector("[data-submit]");
  var status = form.querySelector("[data-status]");
  var touched = {};

  function parse(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function eur(n) { return "€" + n.toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 }); }
  function nightsOf(a, d) {
    var out = [];
    for (var t = a.getTime(); t < d.getTime(); t += 86400000) out.push(new Date(t));
    return out;
  }

  /* Returns { errors: {field: message}, quote } for the current values. */
  function evaluate() {
    var errors = {}, a = parse(f.arrive.value), d = parse(f.depart.value);
    var guests = +f.guests.value, room = f.room.value, quote = null;
    if (!a) errors.arrive = "Choose an arrival date.";
    if (!d) errors.depart = "Choose a departure date.";
    if (a && d && d <= a) errors.depart = "Departure must be after arrival.";
    if (guests === 3 && room !== "torre") errors.guests = "Three guests need a Torre suite.";
    if (a && d && !errors.depart) {
      var nights = nightsOf(a, d), bySeason = {}, closed = false, summer = false;
      nights.forEach(function (n) {
        var s = SEASON[n.getUTCMonth()];
        if (!s) closed = true;
        else { bySeason[s] = (bySeason[s] || 0) + 1; if (s === "peak") summer = true; }
      });
      if (closed) errors.arrive = "We are closed from 1 December to 28 February. Choose dates from March.";
      else if (summer && nights.length < 3) errors.depart = "3 nights minimum in July and August.";
      else if (nights.length > 21) errors.depart = "For more than 21 nights, write to us directly.";
      else quote = { nights: nights.length, bySeason: bySeason, a: a, d: d };
    }
    return { errors: errors, quote: quote, guests: guests, room: room };
  }

  function render(showAll) {
    var r = evaluate();
    ["arrive", "depart", "guests", "room", "name", "email"].forEach(function (k) {
      if (!showAll && !touched[k]) { setError(k, null); return; }
      var msg = r.errors[k] || null;
      if (k === "name" && showAll && !f.name.value.trim()) msg = "Tell us who the room is for.";
      if (k === "email" && showAll && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) msg = "Check the email address.";
      setError(k, msg);
    });
    /* Date and room errors show as soon as they happen; they come from choices, not typing. */
    ["arrive", "depart", "guests"].forEach(function (k) { if (r.errors[k]) setError(k, r.errors[k]); });

    lines.textContent = "";
    if (!r.quote || r.errors.guests) { est.classList.add("is-empty"); return r; }
    est.classList.remove("is-empty");
    var rate = RATES[r.room], total = 0;
    Object.keys(r.quote.bySeason).forEach(function (s) {
      var n = r.quote.bySeason[s], price = rate[s] + (r.guests === 3 ? THIRD_GUEST : 0);
      total += n * price;
      addLine(n + (n === 1 ? " night, " : " nights, ") + rate.name + ", " + s + " season", eur(n * price));
    });
    var tax = r.quote.nights * r.guests * TAX;
    total += tax;
    addLine("Tourist tax, " + r.guests + (r.guests === 1 ? " adult" : " adults"), eur(tax));
    totalEl.textContent = eur(total);
    var a = r.quote.a, d = r.quote.d;
    datesEl.textContent = a.getUTCDate() + (a.getUTCMonth() === d.getUTCMonth() ? "" : " " + MONTHS[a.getUTCMonth()]) +
      " to " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
    r.total = total;
    return r;
  }
  function addLine(label, value) {
    var row = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
    row.className = "leader"; dd.className = "num";
    dt.textContent = label; dd.textContent = value;
    row.append(dt, dd); lines.append(row);
  }

  var helpText = {};
  function setError(key, msg) {
    var field = form.querySelector('[data-field="' + key + '"]');
    var help = field.querySelector(".field__help"), input = f[key];
    if (!(key in helpText)) helpText[key] = help.textContent;
    field.classList.toggle("is-error", !!msg);
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      help.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>';
      help.append(document.createTextNode(msg));
    } else {
      input.removeAttribute("aria-invalid");
      help.textContent = helpText[key];
    }
  }

  ["arrive", "depart", "guests", "room"].forEach(function (k) {
    f[k].addEventListener("change", function () { touched[k] = true; render(false); });
  });
  /* Text fields validate on blur, then live once they have shown an error. */
  ["name", "email"].forEach(function (k) {
    f[k].addEventListener("blur", function () { if (f[k].value) { touched[k] = true; render(form.dataset.tried === "1"); } });
    f[k].addEventListener("input", function () {
      if (form.querySelector('[data-field="' + k + '"]').classList.contains("is-error")) render(true);
    });
  });
  /* The room select updates its help line with how many of that kind exist. */
  var counts = { magazzino: "5 of 11 rooms are this kind", terrazza: "4 of 11 rooms are this kind", torre: "2 suites, sleep up to 3" };
  f.room.addEventListener("change", function () { helpText.room = counts[f.room.value]; setError("room", null); render(false); });

  var timer;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submit.dataset.state === "busy") return;
    form.dataset.tried = "1";
    var r = render(true);
    var bad = form.querySelector(".is-error input, .is-error select");
    if (bad) { bad.focus(); status.textContent = "Some details need fixing before we can send the request."; return; }
    clearTimeout(timer);
    submit.dataset.state = "busy"; submit.setAttribute("aria-busy", "true");
    var body = "Hello Rosaria,%0D%0A%0D%0AI would like to book a " + RATES[r.room].name + " room for " + r.guests +
      (r.guests === 1 ? " adult" : " adults") + ", " + encodeURIComponent(datesEl.textContent) + ". The estimate on your site is " +
      encodeURIComponent(eur(r.total)) + ".%0D%0A%0D%0A" + encodeURIComponent(f.name.value.trim()) + "%0D%0A" + encodeURIComponent(f.email.value.trim());
    timer = setTimeout(function () {
      submit.dataset.state = "done"; submit.removeAttribute("aria-busy");
      status.textContent = "Your email app is opening with the request. If it does not, write to stay@casasalina.it.";
      document.querySelector("[data-form-note]").textContent = "If no email opened, write to stay@casasalina.it.";
      window.location.href = "mailto:stay@casasalina.it?subject=" + encodeURIComponent("Booking request, " + datesEl.textContent) + "&body=" + body;
      timer = setTimeout(function () { submit.removeAttribute("data-state"); }, 2000);
    }, 450);
  });

  render(false);
  /* ?state=error shows the form with its validation errors, for review. */
  if (root.dataset.state === "error") {
    f.depart.value = "2027-07-02"; f.arrive.value = "2027-07-01"; f.guests.value = "3";
    form.dataset.tried = "1"; render(true);
  }
})();
