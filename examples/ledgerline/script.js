/* Ledgerline: every figure on screen is computed from the seed below. Today is fixed at 21 Nov 2026. */
(function () {
  "use strict";

  /* ---------- Seed data ---------- */
  var TODAY = "2026-11-21";
  var CLIENTS = {
    fern: { name: "Fernhill Coffee Roasters", contact: "accounts@fernhillcoffee.com" },
    kest: { name: "Kestrel Labs", contact: "finance@kestrellabs.io" },
    brit: { name: "Brightwater Health", contact: "ap@brightwaterhealth.org" },
    tall: { name: "Tallis Architects", contact: "office@tallisarchitects.com" },
    outp: { name: "Outpost Bikes", contact: "hello@outpostbikes.co" },
    juni: { name: "Juniper & Vale", contact: "billing@junipervale.law" },
    harb: { name: "Harbor Line Ferries", contact: "payables@harborline.com" },
    moss: { name: "Moss & Pine Studio", contact: "studio@mossandpine.design" }
  };
  /* Payments received Dec 2025 to Sep 2026, by client. October and November come from the invoices below. */
  var HISTORY = {
    fern: [3200, 3200, 3200, 3200, 3200, 3200, 3200, 3200, 3200, 3200],
    kest: [0, 4800, 0, 6400, 0, 5200, 0, 7200, 0, 4600],
    brit: [2600, 0, 0, 3900, 0, 0, 4400, 0, 2100, 0],
    tall: [0, 0, 2750, 0, 0, 3300, 0, 0, 0, 2900],
    outp: [1850, 0, 0, 0, 2400, 0, 0, 1500, 0, 0],
    juni: [0, 0, 0, 1200, 0, 0, 0, 0, 1650, 0],
    harb: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    moss: [900, 0, 1400, 0, 0, 0, 1100, 0, 0, 0]
  };
  /* Expenses Dec 2025 to Nov 2026 (November to date), by category. */
  var EXPENSES = {
    "Software": [310, 310, 325, 325, 325, 340, 340, 340, 340, 355, 355, 355],
    "Coworking desk": [450, 450, 450, 450, 450, 450, 450, 450, 450, 450, 450, 450],
    "Subcontractors": [0, 0, 600, 1800, 0, 1200, 0, 2400, 0, 900, 1100, 0],
    "Hardware": [0, 2400, 0, 0, 0, 0, 0, 0, 180, 0, 0, 0],
    "Travel": [0, 0, 0, 420, 0, 0, 0, 860, 0, 0, 240, 0],
    "Insurance and fees": [95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95]
  };
  /* Invoices. Amounts are the sum of their line items. Status is derived from the dates. */
  var INVOICES = [
    { no: 141, c: "fern", title: "Design retainer, October", issued: "2026-10-01", due: "2026-10-15", sent: "2026-10-01", paid: "2026-10-09", items: [["Design retainer, October", 1, 3200]] },
    { no: 142, c: "kest", title: "Design sprint: onboarding", issued: "2026-09-22", due: "2026-10-22", sent: "2026-09-22", paid: "2026-10-20", items: [["Design sprint: onboarding flows (days)", 8, 750], ["Usability sessions, 4 participants", 1, 800]] },
    { no: 143, c: "harb", title: "Timetable app discovery", issued: "2026-10-02", due: "2026-10-16", sent: "2026-10-02", paid: "2026-10-27", items: [["Discovery workshop", 1, 1200], ["Stakeholder interviews", 6, 200]] },
    { no: 144, c: "brit", title: "Patient portal audit", issued: "2026-10-06", due: "2026-11-05", sent: "2026-10-06", paid: "2026-10-30", items: [["Accessibility audit, patient portal", 1, 2400], ["Report and walkthrough (hours)", 5, 150]] },
    { no: 145, c: "fern", title: "Design retainer, November", issued: "2026-11-02", due: "2026-11-16", sent: "2026-11-02", paid: "2026-11-06", items: [["Design retainer, November", 1, 3200]] },
    { no: 146, c: "tall", title: "Website phase 2", issued: "2026-10-12", due: "2026-11-11", sent: "2026-10-12", paid: "2026-11-13", items: [["Case study templates", 1, 2850], ["Front-end build (hours)", 20, 75]] },
    { no: 147, c: "juni", title: "Brand refresh, stage 1", issued: "2026-10-19", due: "2026-11-02", sent: "2026-10-19", paid: "2026-11-17", items: [["Brand audit and moodboards", 1, 1900]] },
    { no: 148, c: "outp", title: "Fit-finder prototype", issued: "2026-10-05", due: "2026-10-19", sent: "2026-10-05", reminders: ["2026-10-30", "2026-11-12"], items: [["Fit-finder prototype", 1, 2200], ["User testing rounds", 2, 275]] },
    { no: 149, c: "moss", title: "Illustration set", issued: "2026-10-26", due: "2026-11-09", sent: "2026-10-26", reminders: ["2026-11-16"], items: [["Spot illustrations", 12, 100]] },
    { no: 150, c: "harb", title: "Timetable app UI, phase 1", issued: "2026-11-02", due: "2026-11-16", sent: "2026-11-02", items: [["Timetable app UI, phase 1", 1, 4800], ["Design system setup (hours)", 8, 100]] },
    { no: 151, c: "kest", title: "Design sprint: billing", issued: "2026-10-27", due: "2026-11-26", sent: "2026-10-27", items: [["Design sprint: billing and plans (days)", 8, 750], ["Prototype and handoff", 1, 1400]] },
    { no: 152, c: "brit", title: "Accessibility fixes", issued: "2026-11-10", due: "2026-11-24", sent: "2026-11-10", items: [["Accessibility fixes, front-end (hours)", 30, 75]] },
    { no: 153, c: "tall", title: "CMS training", issued: "2026-11-13", due: "2026-11-27", sent: "2026-11-13", items: [["CMS training session", 1, 650], ["Editor guide", 1, 300]] },
    { no: 154, c: "fern", title: "Design retainer, December", issued: "2026-11-20", due: "2026-12-15", items: [["Design retainer, December", 1, 3200]] }
  ];
  var PLAN = { name: "Starter", limit: 5, next: "Pro" };
  var MONTHS = ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
  /* Client hues follow one meaning per colour: chart-1 is income, chart-2 expenses, chart-3 to chart-6 clients. */
  var CLIENT_HUES = ["var(--chart-3)", "var(--chart-4)", "var(--chart-6)", "var(--chart-5)"];
  var SW_SHAPES = ["", "sw--round", "sw--diamond", "sw--ring"];

  /* ---------- Helpers ---------- */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var DAY = 864e5;
  var D = function (s) { return new Date(s + "T00:00:00Z"); };
  var diff = function (a, b) { return Math.round((D(b) - D(a)) / DAY); };
  var dfmt = function (s, o) { return D(s).toLocaleDateString("en-GB", Object.assign({ timeZone: "UTC" }, o || { day: "numeric", month: "short" })); };
  var usd = function (n, dp) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); };
  var kf = function (n) { return n < 1000 ? String(Math.round(n)) : String(parseFloat((n / 1000).toPrecision(n >= 100000 ? 4 : 3))); };
  var kfig = function (n) { return '<span class="cur">$</span>' + kf(n) + (n >= 1000 ? '<span class="unit">k</span>' : ""); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var invNo = function (i) { return "INV-0" + i.no; };
  var initials = function (name) { return name.replace(/&/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join(""); };
  var icon = function (id, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };

  var q = new URLSearchParams(location.search), root = document.documentElement;
  var VIEW = root.dataset.view || "";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Model ---------- */
  var invoices = VIEW === "empty" ? [] : INVOICES.map(function (i) { return Object.assign({ reminders: [] }, i, { reminders: (i.reminders || []).slice() }); });
  var hist = VIEW === "empty" ? {} : HISTORY;
  var expenses = VIEW === "empty" ? {} : EXPENSES;

  function amountOf(i) { return sum(i.items.map(function (it) { return it[1] * it[2]; })); }
  function statusOf(i) { if (!i.sent) return "draft"; if (i.paid) return "paid"; return i.due < TODAY ? "overdue" : "sent"; }
  function clientOf(i) { return i.c ? CLIENTS[i.c] : { name: "No client yet", contact: "Not set" }; }

  function compute() {
    invoices.forEach(function (i) { i.amount = amountOf(i); i.status = statusOf(i); });
    var m = {};
    m.byStatus = { draft: [], sent: [], overdue: [], paid: [] };
    invoices.forEach(function (i) { m.byStatus[i.status].push(i); });
    var amt = function (list) { return sum(list.map(function (i) { return i.amount; })); };

    /* Income by month and by client: history for Dec to Sep, paid invoices for every month. */
    var keys = Object.keys(CLIENTS);
    m.clientMonths = {};
    keys.forEach(function (k) { m.clientMonths[k] = MONTHS.map(function (_, mi) { return (hist[k] || [])[mi] || 0; }); });
    invoices.forEach(function (i) {
      if (!i.paid) return;
      var mi = MONTHS.indexOf(i.paid.slice(0, 7));
      if (mi >= 0) m.clientMonths[i.c][mi] += i.amount;
    });
    m.income = MONTHS.map(function (_, mi) { return sum(keys.map(function (k) { return m.clientMonths[k][mi]; })); });
    m.expenses = MONTHS.map(function (_, mi) { return sum(Object.keys(expenses).map(function (c) { return expenses[c][mi]; })); });
    m.net = MONTHS.map(function (_, mi) { return m.income[mi] - m.expenses[mi]; });
    m.income12 = sum(m.income); m.expenses12 = sum(m.expenses); m.net12 = m.income12 - m.expenses12;

    /* Clients ranked by twelve-month income; the top four keep a hue, the rest fold into Other. */
    m.clients = keys.map(function (k) { return { k: k, name: CLIENTS[k].name, total: sum(m.clientMonths[k]), months: m.clientMonths[k] }; })
      .filter(function (c) { return c.total > 0; }).sort(function (a, b) { return b.total - a.total; });
    m.hue = {};
    m.clients.slice(0, 4).forEach(function (c, ix) { m.hue[c.k] = CLIENT_HUES[ix]; c.hue = CLIENT_HUES[ix]; c.shape = SW_SHAPES[ix]; });

    /* This month against the same days of last month, cumulative by payment day. */
    var cum = function (prefix, n) {
      var out = [], run = 0;
      for (var d = 1; d <= n; d++) {
        var day = prefix + "-" + String(d).padStart(2, "0");
        run += amt(invoices.filter(function (i) { return i.paid === day; }));
        out.push(run);
      }
      return out;
    };
    var todayD = +TODAY.slice(8);
    m.nov = cum("2026-11", todayD); m.oct = cum("2026-10", 31);
    m.incomeNow = m.nov[m.nov.length - 1] || 0;
    m.octSameDay = m.oct[todayD - 1] || 0;
    m.octTotal = m.oct[30] || 0;

    m.unpaid = m.byStatus.sent.concat(m.byStatus.overdue);
    m.outstanding = amt(m.unpaid);
    m.overdue = amt(m.byStatus.overdue);
    var since = invoices.filter(function (i) { return i.sent && i.issued >= "2026-10-01"; });
    m.billedSince = amt(since);
    m.collectedSince = amt(since.filter(function (i) { return i.paid; }));
    m.overdueNew = amt(m.byStatus.overdue.filter(function (i) { return diff(i.due, TODAY) <= 7; }));

    var paid = m.byStatus.paid.slice().sort(function (a, b) { return a.paid < b.paid ? -1 : 1; });
    m.paidList = paid;
    var avg = function (list) { return list.length ? sum(list.map(function (i) { return diff(i.issued, i.paid); })) / list.length : 0; };
    m.avgDays = avg(paid);
    m.avgOct = avg(paid.filter(function (i) { return i.paid.slice(0, 7) === "2026-10"; }));
    m.avgNov = avg(paid.filter(function (i) { return i.paid.slice(0, 7) === "2026-11"; }));
    m.avgTerms = paid.length ? sum(paid.map(function (i) { return diff(i.issued, i.due); })) / paid.length : 0;
    m.paidLate = paid.filter(function (i) { return i.paid > i.due; }).length;

    /* The coming seven days, today included. */
    m.week = [];
    for (var w = 0; w < 7; w++) {
      var day = new Date(D(TODAY).getTime() + w * DAY).toISOString().slice(0, 10);
      var due = m.byStatus.sent.filter(function (i) { return i.due === day; });
      m.week.push({ day: day, due: due, amount: amt(due) });
    }
    m.dueWeek = [].concat.apply([], m.week.map(function (d) { return d.due; }));
    m.dueWeekAmt = amt(m.dueWeek);

    var late = function (i) { return diff(i.due, TODAY); };
    var bucket = function (lo, hi) { return m.byStatus.overdue.filter(function (i) { return late(i) >= lo && late(i) <= hi; }); };
    m.ageing = [
      { label: "Not due", list: m.byStatus.sent, c: "var(--chart-1)" },
      { label: "1 to 30", list: bucket(1, 30), c: "var(--warning)" },
      { label: "31 to 60", list: bucket(31, 60), c: "var(--danger)", hatch: true },
      { label: "61 to 90", list: bucket(61, 90), c: "var(--danger)", hatch: true },
      { label: "90+", list: bucket(91, 1e4), c: "var(--danger)", hatch: true }
    ].map(function (b) { b.amount = amt(b.list); return b; });
    m.oldest = m.byStatus.overdue.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0];

    m.sentThisMonth = invoices.filter(function (i) { return i.sent && i.sent.slice(0, 7) === "2026-11"; }).length;
    m.statusAmt = { draft: amt(m.byStatus.draft), sent: amt(m.byStatus.sent), overdue: m.overdue, paid: amt(m.byStatus.paid) };
    return m;
  }

  var M = compute();

  /* ---------- Small renderers ---------- */
  function delta(kind, dir, text, sr) {
    return '<span class="delta delta--' + kind + (dir ? "" : " delta--flat") + '">' + (dir ? '<svg aria-hidden="true"><use href="#i-' + dir + '"/></svg>' : "") + text + '<span class="sr-only">, ' + sr + "</span></span>";
  }
  function ring(f) {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><circle class="ring-t" cx="8" cy="8" r="6"/><circle class="ring-f" cx="8" cy="8" r="6" pathLength="100" stroke-dasharray="' + r2(Math.max(4, Math.min(100, f * 100))) + ' 100" transform="rotate(-90 8 8)"/></svg>';
  }
  function statusCell(i) {
    var s = i.status;
    if (s === "sent") {
      var span = diff(i.issued, i.due) || 1, gone = diff(i.issued, TODAY);
      return '<span class="st st--sent">' + ring(gone / span) + "Sent</span>";
    }
    var label = { paid: "Paid", overdue: "Overdue", draft: "Draft" }[s];
    return '<span class="st st--' + s + '"><svg aria-hidden="true"><use href="#g-' + s + '"/></svg>' + label + "</span>";
  }
  function dueCell(i) {
    var d = diff(TODAY, i.due), sub;
    if (i.status === "paid") sub = "<small>Paid " + dfmt(i.paid) + "</small>";
    else if (i.status === "draft") sub = "<small>Not sent</small>";
    else if (i.status === "overdue") sub = '<small class="late">' + plural(-d, "day") + " late</small>";
    else sub = "<small>" + (d === 0 ? "Due today" : "In " + plural(d, "day")) + "</small>";
    return '<span class="when"><span>' + dfmt(i.due) + "</span>" + sub + "</span>";
  }
  function avatar(i, sm) {
    var c = clientOf(i), hue = M.hue[i.c];
    return '<span class="avatar' + (sm ? " avatar--sm" : "") + '"' + (hue ? ' style="--c: ' + hue + '"' : "") + ' aria-hidden="true">' + (i.c ? initials(c.name) : "?") + "</span>";
  }

  /* ---------- Overview ---------- */
  function renderHead() {
    $("#ov-sub").textContent = invoices.length
      ? dfmt(TODAY, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + ". Figures in US dollars."
      : "Your income, unpaid invoices and cash flow appear here once you send your first invoice.";
    var o = M.byStatus.overdue, drafts = M.byStatus.draft, chips = "";
    if (o.length) chips += '<li><a class="chip chip--bad" href="?page=invoices&tab=overdue" data-goto="invoices" data-tab="overdue">' + icon("i-alert") + "<span><b>" + plural(o.length, "invoice") + "</b> overdue, " + usd(M.overdue) + "</span></a></li>";
    if (M.dueWeek.length) chips += '<li><a class="chip chip--due" href="#week">' + icon("i-clock") + "<span><b>" + M.dueWeek.length + " due</b> this week, " + usd(M.dueWeekAmt) + "</span></a></li>";
    if (drafts.length) chips += '<li><a class="chip" href="?page=invoices&tab=draft" data-goto="invoices" data-tab="draft">' + icon("i-pen") + "<span><b>" + plural(drafts.length, "draft") + "</b> to send</span></a></li>";
    if (!invoices.length) chips = '<li><span class="chip">' + icon("i-doc") + "No invoices yet</span></li>";
    $("#chips").innerHTML = chips;
    $("#nav-overdue").textContent = o.length || "";
    $("#nav-overdue").hidden = !o.length;
    $("#tb-overdue").textContent = o.length || "";
    $("#tb-overdue").hidden = !o.length;
    $("#nav-clients").textContent = invoices.length ? Object.keys(CLIENTS).length : "";
    $("#nav-clients").hidden = !invoices.length;
  }

  function kpiShell(id, label, iconId, deltaHtml, body) {
    $(id).innerHTML = '<h2 class="kpi__top">' + icon(iconId) + "<span>" + label + "</span>" + (deltaHtml || "") + "</h2>" + body;
  }

  function renderKpis() {
    var none = !invoices.length;
    /* 1. Income this month: a cumulative step line against last month. */
    var vmax = Math.max(M.octTotal, M.incomeNow, 1);
    var x = function (d, n) { return r2((d - 1) / (n - 1) * 100); }, y = function (v) { return r2(92 - v / vmax * 84); };
    var step = function (arr, n) {
      var p = "M0 " + y(0);
      arr.forEach(function (v, ix) { p += "H" + x(ix + 1, n) + "V" + y(v); });
      return p;
    };
    var nn = 30, novPath = step(M.nov, nn), last = M.nov.length;
    var change = M.octSameDay ? (M.incomeNow - M.octSameDay) / M.octSameDay * 100 : 0;
    kpiShell("#k-income", 'Income<span class="ph-hide"> this month</span>', "i-in",
      none ? "" : delta(change >= 0 ? "good" : "bad", change >= 0 ? "up" : "dn", Math.abs(change).toFixed(1) + "%", (change >= 0 ? "up" : "down") + " on the same days of October"),
      none ? '<p class="kpi__none">No payments yet</p><div class="kpi__viz"><i class="ghostline"></i></div><p class="kpi__cap"><span>1 Nov</span><span>30 Nov</span></p>'
        : '<div class="kpi__mid"><p class="kpi__fig">' + kfig(M.incomeNow) + '</p><p class="kpi__ctx">' + usd(M.octSameDay) + " by 21 Oct</p></div>" +
          '<div class="kpi__viz spark" role="img" aria-label="Cumulative income in November, ' + usd(M.incomeNow) + " by the 21st, against " + usd(M.octTotal) + ' for all of October">' +
          '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="g-inc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--chart-1);stop-opacity:.32"/><stop offset="1" style="stop-color:var(--chart-1);stop-opacity:0"/></linearGradient></defs>' +
          '<path class="s-cmp" d="' + step(M.oct, 31) + '"/>' +
          '<path class="s-area" fill="url(#g-inc)" d="' + novPath + "V100H0Z" + '"/><path class="s-line" d="' + novPath + '"/></svg>' +
          '<i class="dot" style="left:' + x(last, nn) + "%;top:" + y(M.incomeNow) + '%"></i></div>' +
          '<p class="kpi__cap"><span><span class="key" style="--k: var(--chart-1)">Nov</span> <span class="key key--dash" style="--k: var(--border-strong)">Oct</span></span><span class="ph-hide">Oct total <b>' + usd(M.octTotal) + "</b></span></p>");

    /* 2. Outstanding: a segmented meter of what was billed since 1 Oct, split into paid, not yet due and late. */
    var pc = M.billedSince ? M.collectedSince / M.billedSince * 100 : 0;
    var pnd = M.billedSince ? (M.collectedSince + M.statusAmt.sent) / M.billedSince * 100 : 0;
    kpiShell("#k-out", "Outstanding", "i-hourglass",
      none ? "" : delta("flat", "", plural(M.unpaid.length, "invoice"), "open"),
      none ? '<p class="kpi__none">Nothing billed yet</p><div class="kpi__viz"><div class="segbar segbar--none" style="--n:24"></div></div><p class="kpi__cap"><span>0%</span><span>100%</span></p>'
        : '<div class="kpi__mid"><p class="kpi__fig">' + kfig(M.outstanding) + '</p><p class="kpi__ctx">of ' + usd(M.billedSince) + " billed</p></div>" +
          '<div class="kpi__viz"><span class="mark" style="--at:' + r2(pc) + '%"><span>' + Math.round(pc) + "% paid</span></span>" +
          '<div class="segbar seg3" role="meter" aria-label="Share of invoices billed since 1 October that has been paid" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pc) + '" style="--p:' + r2(pc) + "%;--p2:" + r2(pnd) + '%;--n:24"></div></div>' +
          '<p class="kpi__cap"><span><span class="key key--sq" style="--k: var(--chart-1)">Paid</span><span class="key key--sq" style="--k: var(--border-strong)">Not due</span><span class="key key--sq" style="--k: var(--danger)">Late</span></span><span class="ph-hide">since 1 Oct</span></p>');

    /* 3. Overdue: one bar per late invoice, length in days late. */
    var o = M.byStatus.overdue.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; }), scale = 60;
    kpiShell("#k-overdue", "Overdue", "i-alert",
      none || !M.overdueNew ? "" : delta("bad", "up", "$" + (M.overdueNew / 1000).toFixed(1) + "k", "newly overdue in the last 7 days"),
      none || !o.length ? '<p class="kpi__none">Nothing overdue</p><div class="kpi__viz"><i class="ghostline"></i></div><p class="kpi__cap"><span>Days late</span><span>60</span></p>'
        : '<div class="kpi__mid"><p class="kpi__fig">' + kfig(M.overdue) + '</p><p class="kpi__ctx">' + plural(o.length, "invoice") + "</p></div>" +
          '<div class="kpi__viz"><ul class="hbars" style="position:absolute;inset:0" aria-label="Days late per overdue invoice">' +
          o.slice(0, 3).map(function (i) { var dl = diff(i.due, TODAY); return '<li><span aria-hidden="true">' + initials(clientOf(i).name) + '</span><i style="--p:' + r2(Math.min(dl / scale, 1) * 100) + '%" aria-hidden="true"></i><b>' + dl + ' d</b><span class="sr-only">' + esc(clientOf(i).name) + ", " + dl + " days late</span></li>"; }).join("") +
          "</ul></div>" +
          '<p class="kpi__cap"><span>Oldest <b>' + diff(o[0].due, TODAY) + ' days</b></span><span class="ph-hide">scale 60 days</span></p>');

    /* 4. Average days to get paid: one bar per paid invoice against the average terms. */
    var dmax = 40, dch = M.avgNov - M.avgOct;
    kpiShell("#k-days", '<span class="ph-hide">Days to get paid</span><span class="ph-only">Days to pay</span>', "i-clock",
      none || !M.avgOct ? "" : delta(dch <= 0 ? "good" : "bad", dch <= 0 ? "dn" : "up", Math.abs(dch).toFixed(1) + " d", (dch <= 0 ? "faster" : "slower") + " than invoices paid in October"),
      none || !M.paidList.length ? '<p class="kpi__none">No payments yet</p><div class="kpi__viz"><i class="ghostline"></i></div><p class="kpi__cap"><span>Days</span><span>40</span></p>'
        : '<div class="kpi__mid"><p class="kpi__fig">' + M.avgDays.toFixed(1) + '<span class="unit">days</span></p><p class="kpi__ctx">average, ' + M.paidList.length + " paid</p></div>" +
          '<div class="kpi__viz" role="img" aria-label="Days from issue to payment for each paid invoice, average terms ' + Math.round(M.avgTerms) + ' days">' +
          '<div class="vbars">' + M.paidList.map(function (i, ix) { var d = diff(i.issued, i.paid); return '<i class="' + (i.paid > i.due ? "late" : "") + '" style="--v:' + r2(Math.min(d / dmax, 1)) + ";--i:" + ix + '"></i>'; }).join("") + "</div>" +
          '<span class="terms" style="--at:' + r2(M.avgTerms / dmax * 100) + '%" aria-hidden="true"></span></div>' +
          '<p class="kpi__cap"><span><b>' + M.paidLate + " of " + M.paidList.length + '</b> paid late</span><span class="ph-hide"><span class="key key--dash" style="--k: var(--text-muted)">Terms ' + Math.round(M.avgTerms) + " d</span></span></p>");
  }

  var MON = function (k) { return D(k + "-01").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }); };
  var MONL = function (k) { return D(k + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }); };

  function renderCashflow() {
    var none = !invoices.length, top = Math.max.apply(0, M.income.concat(M.expenses, [1]));
    var MAX = none ? 8000 : Math.ceil(top / 4000) * 4000, ticks = [1, 0.75, 0.5, 0.25, 0];
    var best = M.income.indexOf(Math.max.apply(0, M.income));
    var margin = M.income12 ? M.net12 / M.income12 * 100 : 0;
    var cols = "", pts = [], dots = "";
    MONTHS.forEach(function (k, ix) {
      var part = ix === MONTHS.length - 1 ? " bar--partial" : "";
      cols += '<div class="col-m" data-i="' + ix + '">' + (none ? '<i class="bar bar--ghost" style="--v:' + [0.42, 0.38, 0.5, 0.36, 0.56, 0.48, 0.6, 0.52, 0.66, 0.58, 0.7, 0.62][ix] + '"></i>' :
        '<i class="bar bar--in' + part + '" style="--v:' + r2(M.income[ix] / MAX) + ";--i:" + ix + '"></i><i class="bar bar--out' + part + '" style="--v:' + r2(M.expenses[ix] / MAX) + ";--i:" + ix + '"></i>') + "</div>";
      var px = r2((ix + 0.5) / 12 * 120), py = r2(100 - Math.max(0, M.net[ix]) / MAX * 100);
      pts.push(px + " " + py);
      dots += '<i class="npt" data-i="' + ix + '" style="--x:' + r2((ix + 0.5) / 12 * 100) + "%;--y:" + py + '%"></i>';
    });
    var xl = MONTHS.map(function (k, ix) { return "<span>" + MON(k) + (ix === 0 || k.slice(5) === "01" ? " <b>" + k.slice(2, 4) + "</b>" : "") + "</span>"; }).join("");
    $("#cashflow").innerHTML =
      '<header class="tile__head"><div><h2 id="cf-h">Cash flow</h2><p>Income against expenses by month, Dec 2025 to Nov 2026, US dollars</p></div>' +
      (none ? "" : '<ul class="legend"><li><i class="sw" style="--c: var(--chart-1)"></i>Income <b>' + usd(M.income12) + '</b></li><li><i class="sw sw--round" style="--c: var(--chart-2)"></i>Expenses <b>' + usd(M.expenses12) + '</b></li><li><i class="sw sw--line"></i>Net <b>' + usd(M.net12) + "</b></li></ul>") +
      "</header>" +
      '<div class="well"><div class="chart">' +
      '<div class="chart__y" aria-hidden="true">' + ticks.map(function (t) { return '<span style="top:' + (100 - t * 100) + '%">' + (t ? MAX * t / 1000 + "k" : "0") + "</span>"; }).join("") + "</div>" +
      '<div class="plot" id="plot"' + (none ? "" : ' tabindex="0" role="slider" aria-label="Cash flow by month. Left and right arrow keys move one month." aria-valuemin="0" aria-valuemax="11" aria-valuenow="10"') + ">" +
      '<div class="cols">' + cols + "</div>" +
      (none ? '<div class="ghost-plot"><div><h3>No money in or out yet</h3><p>Each month’s income and expenses are drawn here once your first invoice is paid.</p><button class="btn btn--primary" type="button" data-new>' + icon("i-plus") + "Create your first invoice</button></div></div>"
        : '<svg class="netline" viewBox="0 0 120 100" preserveAspectRatio="none" aria-hidden="true"><path d="M' + pts.join("L") + '"/></svg>' + dots +
          '<div class="tip" id="tip" aria-hidden="true"></div>') +
      "</div>" +
      '<div class="chart__x" aria-hidden="true">' + xl + "</div></div></div>" +
      (none ? '<p class="tile__foot" style="margin-top:12px"><span>Net, margin and best month are worked out after the first paid month.</span></p>' :
      '<dl class="stats">' +
      '<div><dt>Net, 12 months</dt><dd class="v">' + kfig(M.net12) + "</dd><dd>" + margin.toFixed(1) + "% margin</dd></div>" +
      '<div><dt>Average month</dt><dd class="v">' + kfig(M.income12 / 12) + "</dd><dd>income, " + usd(Math.round(M.expenses12 / 12)) + " spent</dd></div>" +
      '<div><dt>Best month</dt><dd class="v">' + kfig(M.income[best]) + "</dd><dd>" + MONL(MONTHS[best]) + "</dd></div>" +
      '<div><dt>Spend ratio</dt><dd class="v">' + (M.expenses12 / M.income12 * 100).toFixed(1) + '<span class="unit">%</span></dd><dd>of income went on costs</dd></div>' +
      "</dl>") +
      '<table class="sr-only"><caption>Cash flow by month, US dollars</caption><thead><tr><th scope="col">Month</th><th scope="col">Income</th><th scope="col">Expenses</th><th scope="col">Net</th></tr></thead><tbody>' +
      MONTHS.map(function (k, ix) { return '<tr><th scope="row">' + MONL(k) + "</th><td>" + M.income[ix] + "</td><td>" + M.expenses[ix] + "</td><td>" + M.net[ix] + "</td></tr>"; }).join("") + "</tbody></table>";
    if (!none) wirePlot(MAX);
  }

  function wirePlot() {
    var plot = $("#plot"), tip = $("#tip"), index = 10, N = 12;
    function show(i) {
      index = Math.max(0, Math.min(N - 1, i));
      var inc = M.income[index], ex = M.expenses[index], net = M.net[index], k = MONTHS[index];
      var mtd = index === N - 1 ? ", to date" : "";
      plot.style.setProperty("--x", r2((index + 0.5) / N * 100) + "%");
      tip.classList.toggle("is-left", index > 7);
      var lit = plot.classList.contains("is-live");
      $$(".col-m", plot).forEach(function (c, ix) { c.classList.toggle("is-on", lit && ix === index); });
      $$(".npt", plot).forEach(function (c, ix) { c.classList.toggle("is-on", lit && ix === index); });
      tip.innerHTML = '<span class="tip__t"><span>' + MONL(k) + mtd + "</span></span>" +
        '<span class="tip__r"><i class="sw" style="--c: var(--chart-1)"></i>Income<b>' + usd(inc) + "</b></span>" +
        '<span class="tip__r"><i class="sw sw--round" style="--c: var(--chart-2)"></i>Expenses<b>' + usd(ex) + "</b></span>" +
        '<span class="tip__r tip__d"><i class="sw sw--line"></i>Net<b>' + usd(net) + '</b></span><span class="tip__t"><span>Margin</span><span>' + (inc ? (net / inc * 100).toFixed(1) + "%" : "n/a") + "</span></span>";
      plot.setAttribute("aria-valuenow", index);
      plot.setAttribute("aria-valuetext", MONL(k) + mtd + ": income " + usd(inc) + ", expenses " + usd(ex) + ", net " + usd(net));
    }
    function live(on) {
      plot.classList.toggle("is-live", on);
      show(index);
    }
    plot.addEventListener("pointermove", function (e) {
      var b = plot.getBoundingClientRect();
      index = Math.floor((e.clientX - b.left) / b.width * N);
      live(true);
    });
    plot.addEventListener("pointerleave", function () { if (document.activeElement !== plot) live(false); });
    plot.addEventListener("focus", function () { live(true); });
    plot.addEventListener("blur", function () { live(false); });
    plot.addEventListener("keydown", function (e) {
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1, Home: -N, End: N }[e.key];
      if (!step) return;
      e.preventDefault(); show(index + step);
    });
    show(index);
    if (q.get("tip")) live(true);
  }

  /* G38: the composition bar under the lead figure, with a legend of swatch, label, trend, amount and share. */
  function renderMix() {
    var none = !M.clients.length, total = M.income12 || 1;
    var top = M.clients.slice(0, 4), rest = M.clients.slice(4);
    var parts = top.map(function (c) { return { name: c.name, total: c.total, months: c.months, hue: c.hue, shape: c.shape }; });
    if (rest.length) parts.push({ name: "Other, " + plural(rest.length, "client"), total: sum(rest.map(function (c) { return c.total; })), months: MONTHS.map(function (_, mi) { return sum(rest.map(function (c) { return c.months[mi]; })); }), hue: "var(--border-strong)", shape: "", other: true });
    var mmax = Math.max.apply(0, [1].concat.apply([], parts.map(function (p) { return p.months; })));
    var share2 = top.length > 1 ? (top[0].total + top[1].total) / total * 100 : 0;
    $("#mix").innerHTML =
      '<header class="tile__head"><div><h2 id="mix-h">Income by client</h2><p>Paid in the last 12 months</p></div></header>' +
      '<div class="mix__lead"><p class="mix__fig num">' + (none ? '<span class="muted">No income yet</span>' : kfig(M.income12)) + "</p>" +
      '<div class="compbar" id="compbar" aria-hidden="true">' + (none ? '<i style="--g:1;--c:var(--track)"></i>' : parts.map(function (p, ix) { return '<i data-i="' + ix + '" style="--g:' + p.total + ";--c:" + p.hue + '"></i>'; }).join("")) + "</div></div>" +
      (none ? '<div class="mixrows" aria-hidden="true">' + [70, 56, 44, 32].map(function (w) { return '<div class="mixrow mixrow--ghost"><span style="width:' + w + '%"></span><span></span><span></span><span></span></div>'; }).join("") + '</div><p class="empty-msg">Clients are ranked here by what they paid you, with a 12-month trend for each.</p>' :
      '<div class="mixrows" role="table" aria-label="Income by client, last 12 months">' +
      parts.map(function (p, ix) {
        return '<div class="mixrow" role="row" data-i="' + ix + '"><span class="mixrow__name" role="rowheader" title="' + esc(p.name) + '"><i class="sw ' + p.shape + '" style="--c:' + p.hue + '" aria-hidden="true"></i><span>' + esc(p.name) + "</span></span>" +
          '<span class="minibars" role="cell" aria-label="Monthly trend">' + p.months.map(function (v) { return '<i class="' + (v ? "" : "z") + '" style="--v:' + r2(v / mmax) + ";--c:" + p.hue + '"></i>'; }).join("") + "</span>" +
          '<span class="mixrow__amt" role="cell">' + usd(p.total) + '</span><span class="mixrow__pct" role="cell">' + (p.total / total * 100).toFixed(1) + "%</span></div>";
      }).join("") + "</div>") +
      (none ? "" : '<p class="tile__foot mix__foot"><span class="note">' + (share2 > 50 ? icon("i-alert") : "") + "Top two clients bring in " + share2.toFixed(1) + "% of income</span></p>");
    var bar = $("#compbar");
    $$(".mixrow").forEach(function (row) {
      ["pointerenter", "pointerleave"].forEach(function (t) {
        row.addEventListener(t, function () {
          var on = t === "pointerenter";
          bar.classList.toggle("has-active", on); row.classList.toggle("is-active", on);
          $$('[data-i="' + row.dataset.i + '"]', bar).forEach(function (n) { n.classList.toggle("is-active", on); });
        });
      });
    });
  }

  function tableRows(list, cols) {
    return list.map(function (i) {
      var c = clientOf(i);
      return '<tr data-no="' + i.no + '"' + (i.isNew ? ' class="row-new"' : "") + ">" +
        '<td><button class="open" type="button" data-open="' + i.no + '" aria-label="Open ' + invNo(i) + ", " + esc(c.name) + '">' + invNo(i) + "</button></td>" +
        '<td><span class="who">' + avatar(i, true) + "<span>" + esc(c.name) + (cols.sub ? "<small>" + esc(i.title || "Untitled") + "</small>" : "") + "</span></span></td>" +
        (cols.issued ? '<td class="hide-ph">' + dfmt(i.issued) + "</td>" : "") +
        '<td class="hide-ph">' + dueCell(i) + "</td>" +
        '<td class="r amt">' + usd(i.amount, 2) + '<span class="ph-only when">' + dueCell(i).replace(/^<span class="when"><span>[^<]*<\/span>/, "").replace(/<\/span>$/, "") + "</span></td>" +
        '<td class="hide-ph">' + statusCell(i) + "</td>" +
        (cols.chev ? '<td class="chev hide-ph">' + icon("i-chev") + "</td>" : "") + "</tr>";
    }).join("");
  }

  function blankTable(title, text, action) {
    return '<div class="blank"><div class="ghost-rows" aria-hidden="true"><i></i><i></i><i></i></div><h3>' + title + "</h3><p>" + text + "</p>" + (action || "") + "</div>";
  }

  function renderRecent() {
    var list = invoices.slice().sort(function (a, b) { return a.issued < b.issued ? 1 : a.issued > b.issued ? -1 : b.no - a.no; }).slice(0, 9);
    $("#recent").innerHTML =
      '<header class="tile__head"><div><h2 id="rec-h">Recent invoices</h2><p>' + (invoices.length ? "Latest " + list.length + " of " + invoices.length + ", newest first" : "Nothing issued yet") + "</p></div></header>" +
      (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Invoice</th><th scope="col">Client</th><th scope="col" class="hide-ph">Issued</th><th scope="col" class="hide-ph">Due</th><th scope="col" class="r">Amount</th><th scope="col" class="hide-ph">Status</th></tr></thead><tbody>' +
        tableRows(list, { issued: true, sub: true }) + "</tbody></table></div>" +
        '<p class="tile__foot"><span>' + usd(M.outstanding) + " still to collect</span>" + '<a class="link-btn" href="?page=invoices" data-goto="invoices">View all ' + invoices.length + " invoices" + icon("i-arrow") + "</a></p>"
        : blankTable("No invoices yet", "Invoices you create show here with their status, from draft to paid.", '<button class="btn btn--primary" type="button" data-new>' + icon("i-plus") + "Create your first invoice</button>"));
  }

  function renderWeek() {
    var max = Math.max.apply(0, M.week.map(function (d) { return d.amount; }).concat([1]));
    $("#week").innerHTML =
      '<header class="tile__head"><div><h2 id="week-h">Due this week</h2><p>' + dfmt(TODAY) + " to " + dfmt(M.week[6].day) + ', expected from clients</p></div><p class="num head-fig" style="font-size:var(--fs-lg);line-height:24px;font-weight:var(--fw-display);color:var(--text)">' + (M.dueWeekAmt ? kfig(M.dueWeekAmt) : "") + "</p></header>" +
      '<div class="week" aria-hidden="true">' + M.week.map(function (d, ix) {
        return '<div class="day' + (ix === 0 ? " is-today" : "") + '"><span class="day__bar"><i class="' + (d.amount ? "" : "z") + '" style="--v:' + r2(d.amount / max) + ";--i:" + ix + '"></i></span><b>' + dfmt(d.day, { day: "numeric" }) + "</b><span>" + dfmt(d.day, { weekday: "narrow" }) + "</span></div>";
      }).join("") + "</div>" +
      (M.dueWeek.length ? '<ul class="due">' + M.dueWeek.map(function (i) {
        var left = diff(TODAY, i.due);
        return '<li><span class="datechip"><small>' + dfmt(i.due, { weekday: "short" }) + "</small><b>" + dfmt(i.due, { day: "numeric" }) + "</b></span>" +
          '<div class="due__id"><p>' + esc(clientOf(i).name) + '</p><small><button class="open link-btn" type="button" data-open="' + i.no + '" style="text-decoration:none">' + invNo(i) + "</button>, " + esc(i.title) + "</small></div>" +
          '<div class="due__amt"><b>' + usd(i.amount) + '</b><small><span class="st st--sent">' + ring(1 - left / 7) + "</span>in " + plural(left, "day") + "</small></div></li>";
      }).join("") + "</ul>" : '<p class="empty-msg">Nothing falls due in the next seven days.</p>');
  }

  function renderAgeing() {
    var max = Math.max.apply(0, M.ageing.map(function (b) { return b.amount; }).concat([1]));
    var o = M.oldest;
    $("#ageing").innerHTML =
      '<header class="tile__head"><div><h2 id="age-h">Unpaid by age</h2><p>' + (M.unpaid.length ? usd(M.outstanding) + " across " + plural(M.unpaid.length, "invoice") + ", days past due" : "Nothing unpaid") + "</p></div></header>" +
      '<div class="age" role="list" aria-label="Unpaid invoices by days past due">' + M.ageing.map(function (b, ix) {
        return '<div class="age__col" role="listitem"><div class="age__plot"><b>' + (b.amount ? kfig(b.amount) : '<span class="muted">0</span>') + '</b><i class="' + (b.amount ? (b.hatch ? "hatch" : "") : "z") + '" style="--v:' + r2(b.amount / max) + ";--c:" + b.c + ";--i:" + ix + '"></i></div>' +
          '<span class="age__lab">' + b.label + '<small style="--c:' + b.c + '" aria-label="' + plural(b.list.length, "invoice") + '">' + (b.list.length ? new Array(b.list.length + 1).join("<i></i>") : '<i class="z"></i>') + "</small></span></div>";
      }).join("") + "</div>" +
      '<p class="tile__foot">' + (o ? "<span>Oldest: " + esc(clientOf(o).name) + ", " + diff(o.due, TODAY) + ' days</span><button class="link-btn" type="button" data-open="' + o.no + '">Chase ' + invNo(o) + "</button>" : "<span>Every sent invoice is within its terms.</span>") + "</p>";
  }

  function renderUsage() {
    var el = $("#usage"), used = M.sentThisMonth, lim = PLAN.limit, share = used / lim, n = 30, on = Math.round(Math.min(share, 1) * n);
    /* Shown only past 60 percent of the limit, and only until dismissed. */
    if (share < 0.6 || sessionFlag("usage-off")) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<div class="usage__top"><div><span id="usage-h">Invoices sent in November</span><b>' + used + " <span>of " + lim + "</span></b></div>" +
      '<button class="btn btn--quiet btn--icon btn--sm usage__x" type="button" id="usage-x" aria-label="Dismiss plan usage">' + icon("i-x") + "</button></div>" +
      '<div class="ticks" role="meter" aria-labelledby="usage-h" aria-valuemin="0" aria-valuemax="' + lim + '" aria-valuenow="' + used + '" style="--n:' + n + (share > 0.9 ? ";--fill: var(--warning)" : "") + '">' +
      new Array(n + 1).join("x").split("").map(function (_, ix) { return '<i class="' + (ix < on ? "on" : "") + '"></i>'; }).join("") + "</div>" +
      "<p>" + plural(Math.max(lim - used, 0), "invoice") + " left on " + PLAN.name + ". The count resets on 1 Dec.</p>" +
      '<button class="btn btn--sm btn--primary" type="button" id="upgrade" aria-describedby="usage-h">Upgrade to ' + PLAN.next + "</button>";
    $("#usage-x").addEventListener("click", function () { sessionFlag("usage-off", true); el.hidden = true; $(".me .avatar").focus && announce("Plan usage dismissed"); });
  }
  function sessionFlag(k, v) { try { if (v) sessionStorage.setItem(k, "1"); return sessionStorage.getItem(k) === "1"; } catch (e) { return false; } }

  /* ---------- Invoices page ---------- */
  var TABS = [["all", "All"], ["draft", "Draft"], ["sent", "Sent"], ["overdue", "Overdue"], ["paid", "Paid"]];
  var state = { tab: TABS.some(function (t) { return t[0] === q.get("tab"); }) ? q.get("tab") : "all", query: "", sort: null, dir: 1 };
  var RANK = { overdue: 0, sent: 1, draft: 2, paid: 3 };

  function renderBand() {
    var a = M.statusAmt, tot = a.draft + a.sent + a.overdue + a.paid;
    var cells = [["draft", "Draft", "var(--track)"], ["sent", "Sent, not due", "var(--border-strong)"], ["overdue", "Overdue", "var(--danger)"], ["paid", "Paid", "var(--success)"]];
    $("#inv-sub").textContent = invoices.length ? plural(invoices.length, "invoice") + " to " + plural(new Set(invoices.filter(function (i) { return i.c; }).map(function (i) { return i.c; })).size, "client") + ", " + usd(tot) + " in total" : "Nothing issued yet";
    $("#band").innerHTML = '<dl class="status-band">' + cells.map(function (c) {
      return '<div><dt><i class="sw" style="--c:' + c[2] + '" aria-hidden="true"></i>' + c[1] + "</dt><dd>" + usd(a[c[0]]) + "<small>" + plural(M.byStatus[c[0]].length, "invoice") + "</small></dd></div>";
    }).join("") + '<div class="compbar-wrap" aria-hidden="true"><div class="compbar">' + (tot ? cells.filter(function (c) { return a[c[0]]; }).map(function (c) { return '<i style="--g:' + a[c[0]] + ";--c:" + c[2] + '"></i>'; }).join("") : '<i style="--g:1;--c:var(--track)"></i>') + "</div></div></dl>";
  }

  function renderTabs() {
    var tl = $("#tabs");
    /* Update in place, so the focused tab keeps focus for arrow keys. */
    TABS.forEach(function (t) {
      var n = t[0] === "all" ? invoices.length : M.byStatus[t[0]].length, sel = t[0] === state.tab, el = $("#tab-" + t[0]);
      if (el) { el.setAttribute("aria-selected", sel); el.tabIndex = sel ? 0 : -1; $(".count", el).textContent = n; return; }
      tl.insertAdjacentHTML("beforeend", '<button class="tab tab--' + t[0] + '" role="tab" type="button" id="tab-' + t[0] + '" aria-controls="inv-panel" aria-selected="' + sel + '" tabindex="' + (sel ? 0 : -1) + '" data-tab="' + t[0] + '">' + t[1] + '<span class="count">' + n + "</span></button>");
    });
    $("#inv-panel").setAttribute("aria-labelledby", "tab-" + state.tab);
    moveThumb();
  }
  function moveThumb() {
    var sel = $('.tab[aria-selected="true"]'), th = $(".tabs__thumb");
    if (!sel || !sel.offsetWidth) return;
    th.style.setProperty("--w", sel.offsetWidth + "px");
    th.style.setProperty("--x", sel.offsetLeft - 0 + "px");
  }

  function filtered() {
    var qy = state.query.trim().toLowerCase();
    var list = invoices.filter(function (i) {
      if (state.tab !== "all" && i.status !== state.tab) return false;
      if (!qy) return true;
      var hay = [invNo(i), String(i.no), clientOf(i).name, i.title || ""].concat(i.items.map(function (it) { return it[0]; })).join(" ").toLowerCase();
      return hay.indexOf(qy) >= 0;
    });
    var key = state.sort, dir = state.dir;
    return list.sort(function (a, b) {
      if (key === "amount") return (a.amount - b.amount) * dir;
      if (key) return (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * dir;
      /* Default order: what needs attention first, then by due date. */
      return RANK[a.status] - RANK[b.status] || (a.status === "paid" ? (a.paid < b.paid ? 1 : -1) : (a.due < b.due ? -1 : 1));
    });
  }

  function renderTable() {
    var list = filtered(), panel = $("#inv-panel");
    var th = function (key, label, cls) {
      var s = state.sort === key ? (state.dir > 0 ? "ascending" : "descending") : "";
      return '<th scope="col"' + (cls ? ' class="' + cls + '"' : "") + (s ? ' aria-sort="' + s + '"' : "") + '><button class="sort" type="button" data-sort="' + key + '">' + label + '<svg aria-hidden="true"><use href="#i-sort"/></svg></button></th>';
    };
    $("#tbl-meta").textContent = state.query ? "Showing " + list.length + " of " + invoices.length + " for “" + state.query + "”" : (state.sort ? "Sorted by " + state.sort : "Overdue first, then by due date");
    if (!invoices.length) {
      panel.innerHTML = blankTable("Send your first invoice", "Drafts, sent and paid invoices are listed here. Ledgerline flags the late ones and tracks how long each client takes to pay.", '<button class="btn btn--primary" type="button" data-new>' + icon("i-plus") + "New invoice</button>");
      return;
    }
    if (!list.length) {
      panel.innerHTML = state.query
        ? blankTable("No invoices match “" + esc(state.query) + "”", "Search looks at invoice numbers, client names and line items" + (state.tab !== "all" ? " within " + state.tab + " invoices" : "") + ".", '<button class="btn" type="button" id="clear-search">' + icon("i-x") + "Clear search</button>")
        : blankTable("No " + state.tab + " invoices", { draft: "Every invoice has been sent.", sent: "Nothing is waiting inside its terms.", overdue: "Every client is paid up or still inside their terms.", paid: "Paid invoices appear here with the date the money arrived." }[state.tab], "");
      var cs = $("#clear-search"); if (cs) cs.addEventListener("click", function () { setQuery(""); $("#search").focus(); });
      return;
    }
    panel.innerHTML = '<table class="tbl tbl--full"><thead><tr><th scope="col">Invoice</th><th scope="col">Client</th>' + th("issued", "Issued", "hide-ph") + th("due", "Due", "hide-ph") + th("amount", "Amount", "r") + '<th scope="col" class="hide-ph">Status</th><th class="hide-ph"><span class="sr-only">Open</span></th></tr></thead><tbody>' +
      tableRows(list, { issued: true, sub: true, chev: true }) + "</tbody></table>";
  }

  function setQuery(v) {
    state.query = v; $("#search").value = v;
    renderTable();
  }

  /* ---------- Sheet ---------- */
  var sheet = $("#sheet"), opener = null, busy = null;
  function sheetHTML(i) {
    var c = clientOf(i), s = i.status, over = s === "overdue" ? diff(i.due, TODAY) : 0;
    var badgeG = { paid: "g-paid", overdue: "g-overdue", draft: "g-draft", sent: "i-send" }[s];
    var label = { paid: "Paid", overdue: over + " days overdue", draft: "Draft", sent: "Sent" }[s];
    var steps = [
      ["Issued", dfmt(i.issued), true],
      ["Sent", i.sent ? dfmt(i.sent) : "Not yet", !!i.sent],
      ["Due", dfmt(i.due), i.sent && (s === "overdue" || !!i.paid || i.due <= TODAY), s === "overdue"],
      ["Paid", i.paid ? dfmt(i.paid) : "Not yet", !!i.paid]
    ];
    var log = [["i-pen", "Created", i.issued]];
    if (i.sent) log.push(["i-send", "Sent to " + c.contact, i.sent]);
    i.reminders.forEach(function (d) { log.push(["i-bell", "Reminder sent", d]); });
    if (i.paid) log.push(["i-check", "Payment received, " + usd(i.amount, 2), i.paid]);
    log.sort(function (a, b) { return a[2] < b[2] ? 1 : -1; });
    var canRemind = s === "sent" || s === "overdue";
    return '<div class="sheet__head">' +
      '<div class="sheet__bar"><span class="mono">' + invNo(i) + '</span><span class="badge badge--' + s + '"><svg aria-hidden="true"><use href="#' + badgeG + '"/></svg>' + label + '</span><button class="btn btn--quiet btn--icon btn--sm" type="button" data-close aria-label="Close invoice">' + icon("i-x") + "</button></div>" +
      '<div class="sheet__who">' + avatar(i) + '<div><h2 id="sheet-h">' + esc(c.name) + "</h2><p>" + esc(i.title || "Untitled draft") + "</p></div></div>" +
      '<div class="sheet__fig"><div><p class="muted" style="font-size:var(--fs-xs);line-height:16px">' + (s === "paid" ? "Amount paid" : "Amount due") + "</p><b>" + usd(i.amount, 2) + '</b></div><p class="muted" style="font-size:var(--fs-xs)">' + (s === "overdue" ? "Was due " + dfmt(i.due) : s === "paid" ? "Paid in " + diff(i.issued, i.paid) + " days" : "Due " + dfmt(i.due)) + "</p></div></div>" +
      '<div class="sheet__body">' +
      '<ol class="track" aria-label="Progress">' + steps.map(function (st) { return '<li class="' + (st[2] ? "done" : "") + (st[3] ? " bad" : "") + '"><b>' + st[0] + "</b>" + st[1] + "</li>"; }).join("") + "</ol>" +
      '<dl class="meta"><div><dt>Bill to</dt><dd>' + esc(c.contact) + "</dd></div><div><dt>Terms</dt><dd>Net " + diff(i.issued, i.due) + "</dd></div><div><dt>Issued</dt><dd>" + dfmt(i.issued, { day: "numeric", month: "long", year: "numeric" }) + "</dd></div><div><dt>Due</dt><dd>" + dfmt(i.due, { day: "numeric", month: "long", year: "numeric" }) + "</dd></div></dl>" +
      '<section aria-labelledby="li-h"><h3 id="li-h">Line items</h3><table class="items"><thead><tr><th scope="col">Description</th><th scope="col">Qty</th><th scope="col">Rate</th><th scope="col">Amount</th></tr></thead><tbody>' +
      (i.items.length ? i.items.map(function (it) { return "<tr><td>" + esc(it[0]) + "</td><td>" + it[1] + "</td><td>" + usd(it[2], 2) + "</td><td>" + usd(it[1] * it[2], 2) + "</td></tr>"; }).join("") : '<tr><td colspan="4" class="muted">No line items yet.</td></tr>') +
      "</tbody><tfoot><tr><td>Subtotal</td><td></td><td></td><td>" + usd(i.amount, 2) + '</td></tr><tr><td>Tax</td><td></td><td></td><td>Not charged</td></tr><tr class="total"><td>Total</td><td></td><td></td><td>' + usd(i.amount, 2) + "</td></tr></tfoot></table></section>" +
      '<section aria-labelledby="log-h"><h3 id="log-h">Activity</h3><ol class="log" id="log">' + log.map(function (l) { return "<li>" + icon(l[0]) + "<span>" + esc(l[1]) + "</span><time datetime=\"" + l[2] + '">' + dfmt(l[2]) + "</time></li>"; }).join("") + "</ol></section>" +
      "</div>" +
      '<div class="sheet__foot">' + (canRemind
        ? '<button class="btn btn--primary async" type="button" id="remind" data-state="idle"><span class="is-on" data-face="idle">' + icon("i-bell") + 'Send reminder</span><span data-face="loading"><svg class="spinner" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 1 6 6"/></svg>Sending reminder</span><span data-face="success">' + icon("i-check") + 'Reminder sent</span><span data-face="error">' + icon("i-alert") + "Couldn’t send, try again</span></button>" +
          '<p id="remind-note">' + (i.reminders.length ? "Last reminder " + dfmt(i.reminders[i.reminders.length - 1]) + ". " : "") + "Emails " + esc(c.contact) + " with a payment link.</p>"
        : '<p>' + (s === "paid" ? "Paid " + dfmt(i.paid) + ". Nothing to chase." : "Drafts are not sent yet, so there is nothing to remind.") + "</p>") + "</div>";
  }

  function openSheet(no, from) {
    var i = invoices.filter(function (x) { return x.no === +no; })[0];
    if (!i) return;
    opener = from || document.activeElement;
    sheet.innerHTML = sheetHTML(i);
    sheet.classList.remove("is-closing");
    sheet.showModal();
    var first = $("#remind") || $("[data-close]", sheet);
    first.focus();
    var btn = $("#remind");
    if (btn) btn.addEventListener("click", function () { sendReminder(i, btn); });
  }
  function closeSheet() {
    if (!sheet.open || sheet.classList.contains("is-closing")) return;
    clearTimeout(busy);
    if (reduced) { finishClose(); return; }
    sheet.classList.add("is-closing");
    sheet.addEventListener("animationend", finishClose, { once: true });
  }
  function finishClose() {
    sheet.classList.remove("is-closing");
    sheet.close();
    if (opener && document.contains(opener)) opener.focus();
  }
  sheet.addEventListener("cancel", function (e) { e.preventDefault(); closeSheet(); });
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet) closeSheet();
    if (e.target.closest("[data-close]")) closeSheet();
  });

  /* Async button: idle, loading (spinner after 150 ms, held 400 ms), success held 1.8 s, error until retried. */
  function face(btn, s) {
    btn.dataset.state = s;
    $$("[data-face]", btn).forEach(function (f) { f.classList.toggle("is-on", f.dataset.face === s); });
    if (s === "loading") { btn.setAttribute("aria-busy", "true"); btn.setAttribute("aria-disabled", "true"); }
    else { btn.removeAttribute("aria-busy"); btn.removeAttribute("aria-disabled"); }
  }
  function fakeSend() { return new Promise(function (res) { setTimeout(res, 1100); }); } // ponytail: stands in for the reminder API; a rejected promise lands in the error face.
  function sendReminder(i, btn) {
    if (btn.dataset.state === "loading") return;
    clearTimeout(busy);
    var started = Date.now(), shown = false;
    var spin = setTimeout(function () { shown = true; face(btn, "loading"); }, 150);
    btn.setAttribute("aria-busy", "true");
    fakeSend().then(function () {
      var hold = shown ? Math.max(0, 400 - (Date.now() - started - 150)) : 0;
      setTimeout(function () {
        clearTimeout(spin);
        face(btn, "success");
        i.reminders.push(TODAY);
        var log = $("#log");
        log.insertAdjacentHTML("afterbegin", '<li class="is-new">' + icon("i-bell") + "<span>Reminder sent to " + esc(clientOf(i).contact) + '</span><time datetime="' + TODAY + '">Today</time></li>');
        $("#remind-note").textContent = "Last reminder today. Emails " + clientOf(i).contact + " with a payment link.";
        announce("Reminder sent to " + clientOf(i).name);
        busy = setTimeout(function () { if (document.contains(btn)) face(btn, "idle"); }, 1800);
      }, hold);
    }).catch(function () {
      clearTimeout(spin); face(btn, "error"); announce("The reminder could not be sent. Try again.");
    });
  }

  /* ---------- Shell: pages, theme, search, toast ---------- */
  var page = q.get("page") === "invoices" || q.get("sheet") ? "invoices" : "overview";
  function setURL(params) {
    var u = new URLSearchParams(location.search);
    Object.keys(params).forEach(function (k) { if (params[k] == null) u.delete(k); else u.set(k, params[k]); });
    history.replaceState(null, "", "?" + u.toString());
  }
  function setPage(p, push) {
    page = p;
    $("#page-overview").hidden = p !== "overview";
    $("#page-invoices").hidden = p !== "invoices";
    $$("[data-page]").forEach(function (a) { if (a.dataset.page === p) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("#crumb").textContent = p === "invoices" ? "Invoices" : "Overview";
    document.title = (p === "invoices" ? "Invoices" : "Overview") + ", Ledgerline";
    if (push) { setURL({ page: p, tab: p === "invoices" && state.tab !== "all" ? state.tab : null, sheet: null }); window.scrollTo(0, 0); }
    if (p === "invoices") requestAnimationFrame(moveThumb);
  }
  function selectTab(t, focus) {
    state.tab = t;
    renderTabs(); renderTable();
    if (focus) $("#tab-" + t).focus();
    setURL({ tab: t === "all" ? null : t });
  }

  function themeNow() { return root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); }
  function syncThemeBtn() {
    var now = themeNow();
    root.dataset.themeNow = now;
    $("#theme-btn").setAttribute("aria-label", "Switch to " + (now === "dark" ? "light" : "dark") + " theme");
  }
  $("#theme-btn").addEventListener("click", function () {
    root.dataset.theme = themeNow() === "dark" ? "light" : "dark";
    setURL({ theme: root.dataset.theme });
    syncThemeBtn();
  });

  var toastT;
  function toast(msg) {
    var t = $("#toast");
    t.innerHTML = icon("i-check") + esc(msg);
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("is-on"); }, 4000);
  }
  function announce(msg) { var l = $("#live"); l.textContent = ""; setTimeout(function () { l.textContent = msg; }, 50); }

  /* New invoice: creates a draft at the next number and shows it among the drafts. The editor itself is not built. */
  function newInvoice() {
    if (VIEW === "loading") return;
    var next = Math.max.apply(0, [154].concat(invoices.map(function (i) { return i.no; }))) + 1;
    invoices.forEach(function (i) { i.isNew = false; });
    var due = new Date(D(TODAY).getTime() + 14 * DAY).toISOString().slice(0, 10);
    invoices.push({ no: next, c: null, title: "Untitled draft", issued: TODAY, due: due, items: [], reminders: [], isNew: true });
    M = compute();
    renderAll();
    state.query = ""; $("#search").value = "";
    setPage("invoices", true);
    selectTab("draft");
    toast("Draft " + "INV-0" + next + " created");
    var row = $('tr[data-no="' + next + '"] .open'); if (row) row.focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var nav = t.closest("a[data-page]");
    if (nav && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setPage(nav.dataset.page, true); return; }
    var go = t.closest("[data-goto]");
    if (go && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (go.dataset.tab) state.tab = go.dataset.tab; renderTabs(); renderTable(); setPage(go.dataset.goto, true); return; }
    if (t.closest("[data-new]") || t.closest("#new-invoice")) { newInvoice(); return; }
    var open = t.closest("[data-open]");
    if (open) { openSheet(open.dataset.open, open); return; }
    var tab = t.closest(".tab");
    if (tab) { selectTab(tab.dataset.tab, true); return; }
    var sort = t.closest("[data-sort]");
    if (sort) {
      var k = sort.dataset.sort;
      if (state.sort === k) { if (state.dir < 0) { state.sort = null; state.dir = 1; } else state.dir = -1; } else { state.sort = k; state.dir = k === "amount" ? -1 : 1; }
      renderTable();
      var again = $('[data-sort="' + k + '"]'); if (again) again.focus();
      return;
    }
    /* A click anywhere on a row opens it; the number button is the keyboard path. */
    var row = t.closest("tbody tr[data-no]");
    if (row && !t.closest("button, a")) openSheet(row.dataset.no, $(".open", row));
  });

  $("#tabs").addEventListener("keydown", function (e) {
    var ix = TABS.map(function (t) { return t[0]; }).indexOf(state.tab), n = TABS.length;
    var to = { ArrowRight: ix + 1, ArrowLeft: ix - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault(); selectTab(TABS[(to + n) % n][0], true);
  });

  var search = $("#search");
  search.addEventListener("input", function () {
    if (page !== "invoices") setPage("invoices", true);
    setQuery(search.value);
  });
  search.addEventListener("keydown", function (e) { if (e.key === "Escape" && search.value) { e.preventDefault(); setQuery(""); } });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); search.focus(); search.select(); }
  });

  var topBar = $("#top");
  addEventListener("scroll", function () { topBar.classList.toggle("is-stuck", scrollY > 4); }, { passive: true });
  addEventListener("resize", moveThumb);
  addEventListener("popstate", function () { setPage(new URLSearchParams(location.search).get("page") === "invoices" ? "invoices" : "overview"); });

  /* ---------- Loading: every tile gets bars shaped like its content. ---------- */
  var SKEL = {
    kpi: '<i style="--w:48%;--mt:4px"></i><i style="--w:56%;--h:28px;--mt:16px"></i><i style="--w:100%;--h:48px;--mt:16px"></i><i style="--w:72%;--mt:12px"></i>',
    chart: '<i style="--w:18%;--h:16px;--mt:4px"></i><i style="--w:44%;--mt:8px"></i><i class="wellghost" style="--h:256px;--mt:16px"></i><i style="--w:100%;--h:44px;--mt:16px"></i>',
    mix: '<i style="--w:44%;--h:16px;--mt:4px"></i><i style="--w:36%;--mt:8px"></i><i style="--w:40%;--h:28px;--mt:20px"></i><i style="--w:100%;--h:10px;--mt:16px"></i>' + new Array(6).join('<i style="--w:100%;--h:20px;--mt:20px"></i>'),
    table: '<i style="--w:24%;--h:16px;--mt:4px"></i><i style="--w:30%;--mt:8px"></i>' + new Array(8).join('<i style="--w:100%;--h:14px;--mt:30px"></i>'),
    week: '<i style="--w:36%;--h:16px;--mt:4px"></i><i style="--w:52%;--mt:8px"></i><i class="wellghost" style="--h:88px;--mt:16px"></i>' + new Array(4).join('<i style="--w:100%;--h:40px;--mt:12px"></i>'),
    age: '<i style="--w:40%;--h:16px;--mt:4px"></i><i style="--w:60%;--mt:8px"></i><i class="wellghost" style="--h:168px;--mt:16px"></i><i style="--w:70%;--mt:16px"></i>',
    band: '<i style="--w:100%;--h:52px"></i><i style="--w:100%;--h:8px;--mt:16px"></i>'
  };
  function skeletons() {
    $$("[data-skel]").forEach(function (el) {
      el.setAttribute("aria-busy", "true");
      el.insertAdjacentHTML("beforeend", '<div class="skel" aria-hidden="true">' + SKEL[el.dataset.skel] + "</div>");
    });
    announce("Loading your figures");
  }

  /* ---------- Boot ---------- */
  function renderAll() {
    renderHead(); renderKpis(); renderCashflow(); renderMix(); renderRecent(); renderWeek(); renderAgeing(); renderUsage();
    renderBand(); renderTabs(); renderTable();
  }
  renderAll();
  syncThemeBtn();
  setPage(page);
  if (VIEW === "loading") skeletons();
  else setTimeout(function () { $("#ov-grid").classList.remove("draw"); }, 1500);
  if (q.get("sheet") && VIEW !== "loading") {
    var firstRow = $("#inv-panel tbody tr[data-no]");
    if (firstRow) openSheet(firstRow.dataset.no, $(".open", firstRow));
  }
})();
