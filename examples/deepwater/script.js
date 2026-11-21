(function () {
  var root = document.documentElement;

  /* Days at sea: weeks with a ship out (from the ship-time log), 31 of 52. */
  var weeks = document.querySelector("[data-weeks]");
  var on = [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 41, 42, 44];
  for (var w = 0; w < 52; w++) {
    var i = document.createElement("i");
    if (on.indexOf(w) > -1) i.className = "on";
    weeks.appendChild(i);
  }
  /* Species: 100 cells, 4 lit (61 of 1,486 is 4.1 in 100). */
  var cells = document.querySelector("[data-cells]");
  for (var c = 0; c < 100; c++) {
    var j = document.createElement("i");
    if (c % 25 === 24) j.className = "on";
    cells.appendChild(j);
  }

  /* Story 1 chart: hover or arrow keys move a year index; one readout shows both depths. */
  var S = JSON.parse(document.getElementById("series").textContent);
  var YMIN = -0.4, YMAX = 0.6, N = S.years.length;
  var plot = document.querySelector(".plot");
  var cross = plot.querySelector(".cross");
  var d8 = plot.querySelector('[data-s="800"]'), d2 = plot.querySelector('[data-s="200"]');
  var ro = plot.querySelector(".readout");
  function sign(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2) + " °C"; }
  function y(v) { return ((YMAX - v) / (YMAX - YMIN)) * 100 + "%"; }
  var idx = N - 1;
  function show(k) {
    idx = Math.max(0, Math.min(N - 1, k));
    var x = (idx / (N - 1)) * 100 + "%";
    cross.style.left = x; d8.style.left = x; d2.style.left = x;
    d8.style.top = y(S.a800[idx]); d2.style.top = y(S.a200[idx]);
    ro.querySelector("b").textContent = S.years[idx];
    ro.querySelector('[data-v="800"]').textContent = sign(S.a800[idx]);
    ro.querySelector('[data-v="200"]').textContent = sign(S.a200[idx]);
    var left = idx / (N - 1) > 0.6;
    ro.style.left = left ? "auto" : "calc(" + x + " + 16px)";
    ro.style.right = left ? "calc(100% - " + x + " + 16px)" : "auto";
    cross.hidden = d8.hidden = d2.hidden = ro.hidden = false;
    plot.setAttribute("aria-valuenow", S.years[idx]);
    plot.setAttribute("aria-valuetext", S.years[idx] + ": 800 m " + sign(S.a800[idx]) + ", 200 m " + sign(S.a200[idx]));
  }
  function hide() { cross.hidden = d8.hidden = d2.hidden = ro.hidden = true; }
  plot.addEventListener("pointermove", function (e) {
    var r = plot.getBoundingClientRect();
    show(Math.round(((e.clientX - r.left) / r.width) * (N - 1)));
  });
  plot.addEventListener("pointerleave", function () { if (document.activeElement !== plot) hide(); });
  plot.addEventListener("focus", function () { show(idx); });
  plot.addEventListener("blur", hide);
  plot.addEventListener("keydown", function (e) {
    var k = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (k) { e.preventDefault(); show(idx + k); }
    else if (e.key === "Home") { e.preventDefault(); show(0); }
    else if (e.key === "End") { e.preventDefault(); show(N - 1); }
  });

  /* The page's one reveal: the warming line draws in once when its chart arrives. */
  var fig = document.querySelector("[data-chart]");
  if (root.dataset.shots === "all" || !("IntersectionObserver" in window)) fig.classList.add("is-seen");
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-seen"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -20% 0px" });
    io.observe(fig);
  }

  /* Donation picker: amounts and what they buy change with the frequency. */
  var OPTS = {
    monthly: [
      { a: 8, d: "One sediment core analysed, every year" },
      { a: 20, d: "One hour of camera time, every year" },
      { a: 50, d: "A scientist’s day at sea, every year" }
    ],
    once: [
      { a: 25, d: "Logs and stores one coral sample" },
      { a: 100, d: "A day of hydrophone recording" },
      { a: 250, d: "About one hour of camera time" }
    ]
  };
  var form = document.querySelector(".form");
  var sum = form.querySelector("[data-sum]");
  function update() {
    var f = form.querySelector('[name="freq"]:checked').value;
    var k = +form.querySelector('[name="amt"]:checked').value;
    form.querySelectorAll(".amt").forEach(function (l, n) {
      l.querySelector("[data-a]").textContent = "£" + OPTS[f][n].a;
      l.querySelector("[data-d]").textContent = OPTS[f][n].d;
    });
    var o = OPTS[f][k];
    sum.textContent = f === "monthly"
      ? "£" + o.a + " a month, £" + o.a * 12 + " a year. " + o.d.replace(", every year", "") + "."
      : "A single gift of £" + o.a + ". " + o.d + ".";
  }
  form.addEventListener("change", update);
  update();
})();
