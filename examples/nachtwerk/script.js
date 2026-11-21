(function () {
  "use strict";

  /* Contact sheet: each frame opens full size in a native dialog. Escape and the Close button return focus to the frame. */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbNo = document.getElementById("lb-no");
  var lbText = document.getElementById("lb-text");
  var opener = null;
  document.querySelectorAll(".frame").forEach(function (b) {
    b.addEventListener("click", function () {
      opener = b;
      lbImg.src = b.dataset.src;
      lbImg.alt = b.dataset.cap;
      lbNo.textContent = "Frame " + b.dataset.no;
      lbText.textContent = b.dataset.cap;
      lb.showModal();
    });
  });
  /* ?frame=16 opens a frame on load, for review screenshots. */
  var f = new URLSearchParams(location.search).get("frame");
  if (f) { var fb = document.querySelector('.frame[data-no="' + f + '"]'); if (fb) fb.click(); }
  lb.addEventListener("close", function () { if (opener) opener.focus(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });

  /* Add to calendar: a real .ics file per night, built here so the page works from file://. */
  var nights = {
    41: { d: "20261205", e: "20261206", t: "Nachtwerk No. 41" },
    42: { d: "20270109", e: "20270110", t: "Nachtwerk No. 42" },
    43: { d: "20270206", e: "20270207", t: "Nachtwerk No. 43" }
  };
  document.querySelectorAll("[data-ics]").forEach(function (a) {
    var n = nights[a.dataset.ics];
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nachtwerk e.V.//Nights//EN", "BEGIN:VEVENT",
      "UID:nachtwerk-" + a.dataset.ics + "@nachtwerk-leipzig.de",
      "DTSTAMP:20261121T120000Z",
      "DTSTART;TZID=Europe/Berlin:" + n.d + "T230000",
      "DTEND;TZID=Europe/Berlin:" + n.e + "T100000",
      "SUMMARY:" + n.t,
      "LOCATION:Kraftwerk Lindenau\\, Karl-Heine-Straße 105\\, 04229 Leipzig",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  });

  /* One reveal style: date rows set in once as they enter. */
  var rows = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    rows.forEach(function (r) { io.observe(r); });
  } else {
    rows.forEach(function (r) { r.classList.add("is-in"); });
  }

  /* Tickets: tiers per night, a quantity stepper (1 to 4) and a total that swaps in place. */
  var TIERS = {
    41: [
      { id: "early", name: "Early", desc: "First 300 tickets", price: 14, note: "Sold out 14 Nov", off: true },
      { id: "second", name: "Second tier", desc: "Until 900 are gone", price: 18, note: "212 left", hot: true },
      { id: "soli", name: "Soli", desc: "60 per night, no questions asked", price: 10, note: "8 left", hot: true },
      { id: "supporter", name: "Supporter", desc: "€10 of it goes into the Soli pool", price: 28, note: "No limit" }
    ],
    42: [
      { id: "early", name: "Early", desc: "First 300 tickets", price: 14, note: "141 left", hot: true },
      { id: "second", name: "Second tier", desc: "Opens when Early sells out", price: 18, note: "Not yet", off: true },
      { id: "soli", name: "Soli", desc: "60 per night, no questions asked", price: 10, note: "60 left" },
      { id: "supporter", name: "Supporter", desc: "€10 of it goes into the Soli pool", price: 28, note: "No limit" }
    ]
  };
  var LABEL = { 41: "No. 41, Sat 5 Dec", 42: "No. 42, Sat 9 Jan" };
  var tiersEl = document.getElementById("tiers");
  var legend = tiersEl.querySelector("legend");
  var qtyEl = document.getElementById("qty");
  var down = document.getElementById("qty-down");
  var up = document.getElementById("qty-up");
  var totalEl = document.getElementById("order-total");
  var state = { night: "41", tier: "second", qty: 2 };

  function euro(n) { return "€" + n.toFixed(2); }

  function renderTiers() {
    tiersEl.replaceChildren(legend);
    var list = TIERS[state.night];
    if (!list.some(function (t) { return t.id === state.tier && !t.off; })) {
      state.tier = list.filter(function (t) { return !t.off; })[0].id;
    }
    list.forEach(function (t) {
      var label = document.createElement("label");
      label.className = "tier";
      label.innerHTML =
        '<input class="radio" type="radio" name="tier" value="' + t.id + '"' + (t.off ? " disabled" : "") + (t.id === state.tier ? " checked" : "") + ">" +
        '<span><span class="tier__name">' + t.name + '</span><span class="tier__desc" style="display:block">' + t.desc + "</span></span>" +
        '<span class="tier__price num"><b><small>€</small>' + t.price + "</b><span" + (t.hot ? ' class="left"' : "") + ">" + t.note + "</span></span>";
      tiersEl.appendChild(label);
    });
  }

  function renderOrder(animate) {
    var t = TIERS[state.night].filter(function (x) { return x.id === state.tier; })[0];
    document.getElementById("order-night").textContent = LABEL[state.night];
    document.getElementById("order-tier").textContent = t.name;
    document.getElementById("order-each").textContent = euro(t.price);
    qtyEl.textContent = state.qty;
    down.disabled = state.qty <= 1;
    up.disabled = state.qty >= 4;
    totalEl.innerHTML = "<small>€</small>" + t.price * state.qty;
    if (animate) {
      totalEl.classList.remove("swap");
      void totalEl.offsetWidth;
      totalEl.classList.add("swap");
    }
  }

  document.getElementById("tix-form").addEventListener("change", function (e) {
    if (e.target.name === "night") { state.night = e.target.value; renderTiers(); }
    if (e.target.name === "tier") state.tier = e.target.value;
    renderOrder(true);
  });
  down.addEventListener("click", function () { if (state.qty > 1) { state.qty--; renderOrder(true); } });
  up.addEventListener("click", function () { if (state.qty < 4) { state.qty++; renderOrder(true); } });

  renderTiers();
  renderOrder(false);
})();
