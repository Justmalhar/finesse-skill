'use strict';

/* ---------- Setup ---------- */
const params = new URLSearchParams(location.search);
const VIEW = ['empty', 'loading'].includes(params.get('view')) ? params.get('view') : null;
const PAGES = { overview: 'Overview', invoices: 'Invoices', clients: 'Clients', expenses: 'Expenses', reports: 'Reports', settings: 'Settings' };
const TODAY = new Date(2026, 10, 21); // ponytail: fixed "today" so the demo data always lines up
const DAY = 864e5;
const TERMS = 14;

const ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const daysBetween = (a, b) => Math.round((b - a) / DAY);
const wait = ms => new Promise(r => setTimeout(r, ms));
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = n => usd0.format(n);
const fmtDate = (d, o = { month: 'short', day: 'numeric' }) => d.toLocaleDateString('en-US', o);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/* ---------- Data ---------- */
// [number, client, issued, due, status, paidOn, [[description, qty, rate]]]
const RAW = [
  ['INV-1062', 'Halcyon Labs', '2026-11-20', '2026-12-04', 'sent', null, [['Product design sprint, 2 weeks', 1, 4200], ['Moderated usability sessions', 6, 180]]],
  ['INV-1061', 'Northwind Studio', '2026-11-19', '2026-12-03', 'draft', null, [['Brand guidelines refresh', 1, 2400], ['Custom icon set', 24, 45]]],
  ['INV-1060', 'Tidewater Media', '2026-11-12', '2026-11-26', 'sent', null, [['Episode edit (hours)', 12, 95], ['Motion graphics package', 1, 850]]],
  ['INV-1059', 'Brightpath Co.', '2026-11-10', '2026-11-24', 'sent', null, [['Frontend development (hours)', 32, 110]]],
  ['INV-1058', 'Marlow & Finch', '2026-11-08', '2026-11-22', 'sent', null, [['Launch campaign copy', 1, 1800], ['SEO audit', 1, 950]]],
  ['INV-1057', 'Oakline Architects', '2026-11-06', '2026-11-20', 'paid', '2026-11-19', [['Website maintenance, November', 1, 600], ['Project page updates', 5, 80]]],
  ['INV-1056', 'Halcyon Labs', '2026-11-01', '2026-11-15', 'paid', '2026-11-12', [['Design retainer, November', 1, 4500]]],
  ['INV-1055', 'Juniper Health', '2026-10-28', '2026-11-11', 'sent', null, [['Patient portal UX review', 1, 2600], ['Accessibility audit (WCAG 2.2)', 1, 1400]]],
  ['INV-1054', 'Northwind Studio', '2026-10-22', '2026-11-05', 'paid', '2026-11-03', [['Packaging design', 1, 2400], ['Print production files', 1, 800]]],
  ['INV-1053', 'Tidewater Media', '2026-10-15', '2026-10-29', 'sent', null, [['Podcast edit (hours)', 10, 95], ['Episode thumbnails', 7, 100]]],
  ['INV-1052', 'Brightpath Co.', '2026-10-08', '2026-10-22', 'paid', '2026-10-30', [['Frontend development (hours)', 28, 110]]],
  ['INV-1051', 'Halcyon Labs', '2026-10-01', '2026-10-15', 'paid', '2026-10-10', [['Design retainer, October', 1, 4500]]],
  ['INV-1050', 'Marlow & Finch', '2026-09-20', '2026-10-04', 'sent', null, [['Newsletter series', 4, 550]]],
  ['INV-1049', 'Oakline Architects', '2026-09-10', '2026-09-24', 'paid', '2026-09-29', [['Website maintenance, September', 1, 600], ['Photo retouching', 12, 40]]],
  ['INV-1048', 'Northwind Studio', '2026-09-02', '2026-09-16', 'paid', '2026-09-15', [['Campaign landing page', 1, 2900]]],
  ['INV-1047', 'Brightpath Co.', '2026-08-20', '2026-09-03', 'paid', '2026-09-10', [['Frontend development (hours)', 30, 110]]],
  ['INV-1046', 'Juniper Health', '2026-08-14', '2026-08-28', 'sent', null, [['Content audit', 1, 980]]],
  ['INV-1045', 'Tidewater Media', '2026-07-10', '2026-07-24', 'sent', null, [['Trailer edit', 1, 1250]]],
];

const invoices = VIEW === 'empty' ? [] : RAW.map(([number, client, issued, due, status, paidOn, items]) => ({
  number, client, status,
  issued: parseDate(issued), due: parseDate(due), paidOn: paidOn ? parseDate(paidOn) : null,
  items: items.map(([desc, qty, rate]) => ({ desc, qty, rate })),
}));

// Dec 2025 to Oct 2026; November is computed from paid invoices so the KPI and chart agree.
const INCOME_HISTORY = [7200, 8400, 9100, 10800, 9600, 12400, 11200, 13100, 10900, 12600, 11240];
const EXPENSES = [2100, 3400, 1900, 2200, 2050, 2600, 1800, 2400, 4100, 2000, 2300, 1650];
const CLIENT_INCOME = [['Halcyon Labs', 38400], ['Northwind Studio', 27650], ['Brightpath Co.', 21300], ['Marlow & Finch', 15890], ['Oakline Architects', 9800], ['Tidewater Media', 7200], ['Juniper Health', 5000]];
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(TODAY.getFullYear(), TODAY.getMonth() - 11 + i, 1));
const AGE_BUCKETS = ['Not yet due', '1-30 days late', '31-60 days late', '61-90 days late', '90+ days late'];

const total = inv => inv.items.reduce((s, i) => s + i.qty * i.rate, 0);
const sumOf = list => list.reduce((s, i) => s + total(i), 0);
const statusOf = inv => (inv.status === 'sent' && inv.due < TODAY ? 'overdue' : inv.status);
const STATUS_LABEL = { draft: 'Draft', sent: 'Sent', overdue: 'Overdue', paid: 'Paid' };
const pill = st => `<span class="pill pill-${st}">${STATUS_LABEL[st]}</span>`;

function metrics() {
  const unpaid = invoices.filter(i => ['sent', 'overdue'].includes(statusOf(i)));
  const overdue = unpaid.filter(i => statusOf(i) === 'overdue');
  const paid = invoices.filter(i => i.status === 'paid' && i.paidOn);
  const paidThisMonth = paid.filter(i => i.paidOn.getMonth() === TODAY.getMonth() && i.paidOn.getFullYear() === TODAY.getFullYear());
  return {
    unpaid, overdue, paid, paidThisMonth,
    income: sumOf(paidThisMonth),
    outstanding: sumOf(unpaid),
    overdueAmt: sumOf(overdue),
    avgDays: paid.length ? Math.round(paid.reduce((s, i) => s + daysBetween(i.issued, i.paidOn), 0) / paid.length) : null,
    oldest: overdue.length ? Math.max(...overdue.map(i => daysBetween(i.due, TODAY))) : 0,
  };
}

/* ---------- State + routing ---------- */
const state = {
  page: PAGES[params.get('page')] ? params.get('page') : 'overview',
  filter: 'all',
  query: '',
  open: null,
};

function setParam(key, value) {
  try {
    const url = new URL(location.href);
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    history.replaceState(null, '', url);
  } catch (e) { /* file:// can refuse history updates; the in-app state still changes */ }
}

function navigate(page) {
  state.page = page;
  document.body.classList.remove('nav-open');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
  setParam('page', page);
  render(true);
  window.scrollTo(0, 0);
}

/* ---------- Shared pieces ---------- */
const emptyState = (ic, title, text, action = '', cls = '') =>
  `<div class="empty ${cls}"><span class="empty-icon">${icon(ic)}</span><h3>${title}</h3><p>${text}</p>${action}</div>`;
const newBtn = (label = 'New invoice') => `<button class="btn btn-primary" type="button" data-action="new">${icon('plus')}${label}</button>`;
const skel = (w, h = 12, extra = '') => `<span class="skel" style="width:${w};height:${h}px;${extra}"></span>`;
const relDay = n => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`);

/* ---------- Overview ---------- */
function overviewHTML() {
  const head = `<div class="page-head"><div><h1>Overview</h1><p class="sub">${fmtDate(TODAY, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div></div>`;
  if (VIEW === 'loading') return head + overviewSkeleton();

  const m = metrics();
  const empty = invoices.length === 0;
  const kpi = (label, value, sub, tone = '') =>
    `<div class="card kpi"><p class="kpi-label">${label}</p><p class="kpi-value ${tone}">${value}</p><p class="kpi-sub">${sub}</p></div>`;
  const avgNote = m.avgDays == null ? '' : m.avgDays > TERMS ? `${plural(m.avgDays - TERMS, 'day')} past net ${TERMS} terms` : `Within net ${TERMS} terms`;
  const kpis = empty
    ? kpi('Income this month', '$0', 'No payments received yet') +
      kpi('Outstanding', '$0', 'Nothing awaiting payment') +
      kpi('Overdue', '$0', 'Nothing overdue') +
      kpi('Avg. days to get paid', 'No data', 'Appears after your first payment')
    : kpi('Income this month', fmt(m.income), `From ${plural(m.paidThisMonth.length, 'payment')}. October closed at ${fmt(INCOME_HISTORY[10])}`) +
      kpi('Outstanding', fmt(m.outstanding), `${plural(m.unpaid.length, 'invoice')} awaiting payment`) +
      kpi('Overdue', fmt(m.overdueAmt), m.overdue.length ? `${plural(m.overdue.length, 'invoice')}, oldest ${m.oldest} days late` : 'Nothing overdue', m.overdue.length ? 'tone-overdue' : '') +
      kpi('Avg. days to get paid', `${m.avgDays}<small>days</small>`, `Across the last ${m.paid.length} paid, ${avgNote.toLowerCase()}`);

  const onboard = empty ? `
    <section class="card onboard">
      <div><h2>Send your first invoice</h2><p>Once clients start paying, this page tracks income, what you're owed, and what's due this week.</p></div>
      ${newBtn('Create invoice')}
    </section>` : '';

  return `${head}${onboard}
    <section class="kpis" aria-label="Key figures">${kpis}</section>
    <div class="grid">
      <section class="card span-8" aria-labelledby="cf-title">${cashflowCard(empty, m)}</section>
      <section class="card span-4" aria-labelledby="cl-title">${clientsCard(empty)}</section>
      <section class="card flush span-8" aria-labelledby="ri-title">${recentCard(empty)}</section>
      <div class="stack span-4">
        <section class="card" aria-labelledby="ag-title">${ageingCard(empty, m)}</section>
        <section class="card" aria-labelledby="du-title">${dueCard(empty, m)}</section>
      </div>
    </div>`;
}

function cashflowCard(empty, m) {
  const head = sub => `<div><h2 id="cf-title">Cash flow</h2><p>${sub}</p></div>`;
  if (empty) return `<div class="card-head">${head('Income against expenses, last 12 months')}</div>${emptyState('chart', 'No cash flow yet', 'Paid invoices and logged expenses build this chart month by month.', '', 'small')}`;
  const income = [...INCOME_HISTORY, m.income];
  const tI = income.reduce((a, b) => a + b, 0);
  const tE = EXPENSES.reduce((a, b) => a + b, 0);
  return `
    <div class="card-head">
      ${head(`Income against expenses, ${fmtDate(MONTHS[0], { month: 'short', year: 'numeric' })} to ${fmtDate(MONTHS[11], { month: 'short', year: 'numeric' })}`)}
      <div class="legend">
        <div class="legend-item"><span class="swatch" style="background:var(--income)"></span><span>Income</span><strong>${fmt(tI)}</strong></div>
        <div class="legend-item"><span class="swatch" style="background:var(--expense)"></span><span>Expenses</span><strong>${fmt(tE)}</strong></div>
        <div class="legend-item"><span class="swatch" style="background:transparent"></span><span>Net</span><strong>${fmt(tI - tE)}</strong></div>
      </div>
    </div>
    <div class="chart animate" id="cashflow" tabindex="0" role="img"
      aria-label="Bar chart of monthly income and expenses. Income totals ${fmt(tI)} and expenses ${fmt(tE)} over 12 months. Use the arrow keys to read each month."></div>`;
}

function clientsCard(empty) {
  const head = `<div class="card-head"><div><h2 id="cl-title">Income by client</h2><p>Last 12 months</p></div></div>`;
  if (empty) return head + emptyState('users', 'No client income yet', 'See which clients bring in the most once invoices are paid.', '', 'small');
  const tot = CLIENT_INCOME.reduce((s, [, v]) => s + v, 0);
  const max = CLIENT_INCOME[0][1];
  return head + `<ul class="bars">${CLIENT_INCOME.map(([name, v], i) => `
    <li>
      <div class="bar-row"><span class="bar-name">${esc(name)}</span><span class="num">${fmt(v)}<span class="pct">${Math.round((v / tot) * 100)}%</span></span></div>
      <div class="track"><span style="width:${(v / max) * 100}%;animation-delay:${i * 40}ms"></span></div>
    </li>`).join('')}</ul>`;
}

function recentCard(empty) {
  const head = `<div class="card-head"><div><h2 id="ri-title">Recent invoices</h2><p>Newest first</p></div>${empty ? '' : `<button class="btn-link" type="button" data-nav="invoices">View all${icon('arrow')}</button>`}</div>`;
  if (empty) return head + emptyState('file', 'No invoices yet', 'Your latest invoices and their status will show here.', newBtn(), 'small');
  const rows = invoices.slice(0, 7).map(inv => {
    const st = statusOf(inv);
    return `<tr data-open="${inv.number}" tabindex="0" aria-label="Open ${inv.number} for ${esc(inv.client)}">
      <td><span class="cell-stack"><span class="strong">${esc(inv.client)}</span><small>${inv.number}</small></span></td>
      <td class="col-due">${fmtDate(inv.due)}</td>
      <td class="r strong">${fmt(total(inv))}</td>
      <td>${pill(st)}</td>
    </tr>`;
  }).join('');
  return head + `<div class="table-wrap"><table class="table compact"><thead><tr><th>Client</th><th class="col-due">Due</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function ageingCard(empty, m) {
  const buckets = AGE_BUCKETS.map((label, i) => ({ label, i, n: 0, amt: 0 }));
  m.unpaid.forEach(inv => {
    const late = daysBetween(inv.due, TODAY);
    const b = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4;
    buckets[b].n++; buckets[b].amt += total(inv);
  });
  const head = `<div class="card-head"><div><h2 id="ag-title">Unpaid ageing</h2><p>${empty || !m.unpaid.length ? 'Nothing unpaid' : `${fmt(m.outstanding)} across ${plural(m.unpaid.length, 'invoice')}`}</p></div></div>`;
  if (empty || !m.unpaid.length) return head + emptyState('calendar', 'All caught up', 'Unpaid invoices are grouped here by how late they are.', '', 'small');
  const summary = buckets.map(b => `${b.label}: ${fmt(b.amt)}`).join('; ');
  return head + `
    <div class="age-bar" role="img" aria-label="${summary}">
      ${buckets.filter(b => b.amt).map(b => `<span style="flex:${b.amt};background:var(--age-${b.i})"></span>`).join('')}
    </div>
    <ul class="age-list">${buckets.map(b => `
      <li class="${b.n ? '' : 'zero'}"><span class="swatch" style="background:var(--age-${b.i})"></span><span>${b.label}</span><span class="age-count">${b.n}</span><span class="num">${fmt(b.amt)}</span></li>`).join('')}
    </ul>`;
}

function dueCard(empty, m) {
  const end = new Date(+TODAY + 7 * DAY);
  const due = m.unpaid.filter(i => i.due >= TODAY && i.due <= end).sort((a, b) => a.due - b.due);
  const head = `<div class="card-head"><div><h2 id="du-title">Due this week</h2><p>${fmtDate(TODAY)} to ${fmtDate(end)}</p></div></div>`;
  if (!due.length) return head + emptyState('calendar', 'Nothing due this week', empty ? 'Payment due dates for sent invoices will show here.' : 'No sent invoices fall due in the next 7 days.', '', 'small');
  return head + `<ul class="due-list">${due.map(inv => `
    <li><button class="due-item" type="button" data-open="${inv.number}">
      <span class="due-date" aria-hidden="true"><span class="dow">${fmtDate(inv.due, { weekday: 'short' })}</span><span class="dom">${inv.due.getDate()}</span></span>
      <span class="due-main"><span class="due-client">${esc(inv.client)}</span><span class="due-sub">${inv.number}, due ${relDay(daysBetween(TODAY, inv.due))}</span></span>
      <span class="num">${fmt(total(inv))}</span>
    </button></li>`).join('')}</ul>
    <div class="card-foot"><span>Expected this week</span><strong>${fmt(sumOf(due))}</strong></div>`;
}

function overviewSkeleton() {
  const kpi = `<div class="card kpi">${skel('45%')}${skel('60%', 28, 'margin:12px 0')}${skel('80%')}</div>`;
  const heights = [42, 50, 55, 64, 58, 74, 68, 80, 66, 76, 70, 54];
  const lines = (n, h) => Array.from({ length: n }, (_, i) => skel(`${100 - (i % 3) * 12}%`, h, 'margin-bottom:16px')).join('');
  return `<p class="visually-hidden">Loading overview</p>
    <section class="kpis" aria-hidden="true">${kpi.repeat(4)}</section>
    <div class="grid" aria-hidden="true">
      <section class="card span-8">${skel('22%', 14)}${skel('40%')}<div class="skel-bars">${heights.map(h => `<span class="skel" style="height:${h}%"></span>`).join('')}</div></section>
      <section class="card span-4">${skel('40%', 14)}${skel('25%', 12, 'margin-bottom:22px')}${lines(7, 8)}</section>
      <section class="card span-8">${skel('30%', 14)}${skel('20%', 12, 'margin-bottom:22px')}${lines(5, 22)}</section>
      <div class="stack span-4">
        <section class="card">${skel('45%', 14)}${skel('60%', 12, 'margin-bottom:18px')}${skel('100%', 12, 'margin-bottom:18px')}${lines(5, 10)}</section>
        <section class="card">${skel('40%', 14)}${skel('35%', 12, 'margin-bottom:18px')}${lines(3, 36)}</section>
      </div>
    </div>`;
}

/* ---------- Cash flow chart (SVG) ---------- */
let chartObserver = null;

function mountCashflow() {
  chartObserver?.disconnect();
  const el = $('#cashflow');
  if (!el) return;
  const income = [...INCOME_HISTORY, metrics().income];
  let geo = null;
  let active = -1;

  const draw = () => {
    const W = el.clientWidth, H = el.clientHeight;
    if (!W) return;
    const P = { t: 8, r: 4, b: 26, l: 44 };
    const max = Math.max(...income, ...EXPENSES);
    const step = [500, 1000, 2000, 2500, 5000, 10000, 20000, 50000].find(s => s >= max / 4) || 100000;
    const top = Math.ceil(max / step) * step;
    const y = v => P.t + (H - P.t - P.b) * (1 - v / top);
    const band = (W - P.l - P.r) / 12;
    const bw = Math.max(4, Math.min(16, band * 0.3));
    const bar = (x, v, cls) => {
      const y0 = y(0), y1 = y(v), h = y0 - y1;
      if (h <= 0) return '';
      const r = Math.min(3, bw / 2, h);
      return `<path class="${cls}" d="M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + bw - r}Q${x + bw},${y1} ${x + bw},${y1 + r}V${y0}Z"/>`;
    };
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
    for (let v = 0; v <= top; v += step) {
      s += `<line class="grid-line${v ? '' : ' base'}" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/>`;
      s += `<text class="axis" x="${P.l - 10}" y="${y(v)}" dy="0.32em" text-anchor="end">${v ? `$${v / 1000}k` : '$0'}</text>`;
    }
    MONTHS.forEach((mo, i) => {
      const cx = P.l + band * i + band / 2;
      s += `<rect class="band" x="${P.l + band * i + 2}" y="${P.t}" width="${band - 4}" height="${H - P.t - P.b}" rx="6"/>`;
      s += bar(cx - bw - 1.5, income[i], 'bar-income');
      s += bar(cx + 1.5, EXPENSES[i], 'bar-expense');
      if (band >= 34 || i % 2 === 1) s += `<text class="axis" x="${cx}" y="${H - 6}" text-anchor="middle">${fmtDate(mo, { month: 'short' })}</text>`;
    });
    s += `</svg><div class="tooltip" hidden></div>`;
    el.innerHTML = s;
    geo = { W, P, band };
    if (active >= 0) show(active);
  };

  const show = i => {
    active = i;
    const tip = $('.tooltip', el);
    el.querySelectorAll('.band').forEach((b, j) => b.classList.toggle('active', j === i));
    const net = income[i] - EXPENSES[i];
    tip.innerHTML = `<strong>${fmtDate(MONTHS[i], { month: 'long', year: 'numeric' })}</strong>
      <div class="tooltip-row"><span><i class="swatch" style="background:var(--income)"></i>Income</span><span>${fmt(income[i])}</span></div>
      <div class="tooltip-row"><span><i class="swatch" style="background:var(--expense)"></i>Expenses</span><span>${fmt(EXPENSES[i])}</span></div>
      <div class="tooltip-row net"><span>Net</span><span>${net < 0 ? '-' : ''}${fmt(Math.abs(net))}</span></div>`;
    tip.hidden = false;
    const { W, P, band } = geo;
    const tw = tip.offsetWidth;
    const right = P.l + band * (i + 1) + 6;
    tip.style.left = `${right + tw <= W ? right : Math.max(0, P.l + band * i - tw - 6)}px`;
  };
  const hide = () => {
    active = -1;
    el.querySelectorAll('.band').forEach(b => b.classList.remove('active'));
    const tip = $('.tooltip', el);
    if (tip) tip.hidden = true;
  };

  el.addEventListener('pointermove', e => {
    if (!geo) return;
    const x = e.clientX - el.getBoundingClientRect().left - geo.P.l;
    const i = Math.floor(x / geo.band);
    i >= 0 && i < 12 ? (i !== active && show(i)) : hide();
  });
  el.addEventListener('pointerleave', hide);
  el.addEventListener('blur', hide);
  el.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = active < 0 ? 11 : Math.min(11, Math.max(0, active + (e.key === 'ArrowRight' ? 1 : -1)));
    show(next);
  });

  draw();
  setTimeout(() => el.classList.remove('animate'), 900); // grow-in only on first paint, not on every resize
  chartObserver = new ResizeObserver(() => draw());
  chartObserver.observe(el);
}

/* ---------- Invoices ---------- */
const FILTERS = ['all', 'draft', 'sent', 'overdue', 'paid'];

function invoicesHTML() {
  const head = `<div class="page-head"><div><h1>Invoices</h1><p class="sub">${VIEW === 'loading' ? 'Loading invoices' : invoices.length ? `${plural(invoices.length, 'invoice')}, ${fmt(metrics().outstanding)} outstanding` : 'Nothing billed yet'}</p></div></div>`;

  if (VIEW === 'loading') {
    const row = `<tr>${['70px', '140px', '60px', '60px', '70px', '64px'].map((w, i) => `<td class="${i === 2 ? 'col-issued' : i === 3 ? 'col-due' : ''}">${skel(w, 12)}</td>`).join('')}</tr>`;
    return `${head}<p class="visually-hidden">Loading invoices</p>
      <div class="toolbar" aria-hidden="true">${skel('340px', 38, 'margin:0;border-radius:12px;max-width:100%')}</div>
      <section class="card flush" aria-hidden="true"><div class="table-wrap"><table class="table"><thead><tr><th>Number</th><th>Client</th><th class="col-issued">Issued</th><th class="col-due">Due</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>${row.repeat(8)}</tbody></table></div></section>`;
  }

  if (!invoices.length) {
    return head + `<section class="card">${emptyState('inbox', 'No invoices yet', 'Create an invoice, send it to a client, and track it here from draft to paid.', newBtn())}</section>`;
  }

  const counts = { all: invoices.length, draft: 0, sent: 0, overdue: 0, paid: 0 };
  invoices.forEach(i => counts[statusOf(i)]++);
  const q = state.query.trim().toLowerCase();
  let rows = invoices.filter(i => state.filter === 'all' || statusOf(i) === state.filter);
  if (q) rows = rows.filter(i => `${i.number} ${i.client}`.toLowerCase().includes(q));

  const tabs = `<div class="tabs" role="tablist" aria-label="Filter invoices">${FILTERS.map(f => `
    <button class="tab" type="button" role="tab" id="tab-${f}" aria-selected="${state.filter === f}" aria-controls="invoice-panel" data-filter="${f}">
      ${f === 'all' ? 'All' : STATUS_LABEL[f]}<span class="count">${counts[f]}</span>
    </button>`).join('')}</div>`;
  const chip = q ? `<span class="query-chip">Matching "${esc(state.query.trim())}"<button type="button" data-action="clear-search" aria-label="Clear search">${icon('x')}</button></span>` : '';

  let body;
  if (!rows.length) {
    const msg = q
      ? emptyState('search', 'No matching invoices', `Nothing in ${state.filter === 'all' ? 'your invoices' : `${STATUS_LABEL[state.filter].toLowerCase()} invoices`} matches "${esc(state.query.trim())}".`, `<button class="btn btn-secondary" type="button" data-action="clear-search">Clear search</button>`)
      : {
          draft: emptyState('file', 'No drafts', 'Invoices you start but haven\'t sent will wait here.', newBtn()),
          sent: emptyState('send', 'Nothing awaiting payment', 'Sent invoices that aren\'t due yet show here.'),
          overdue: emptyState('check', 'Nothing overdue', 'Every sent invoice is within its payment terms.'),
          paid: emptyState('wallet', 'No paid invoices yet', 'Invoices move here once a client pays.'),
        }[state.filter];
    body = msg;
  } else {
    body = `<div class="table-wrap"><table class="table">
      <thead><tr><th>Number</th><th>Client</th><th class="col-issued">Issued</th><th class="col-due">Due</th><th class="r">Amount</th><th>Status</th></tr></thead>
      <tbody>${rows.map(inv => {
        const st = statusOf(inv);
        const late = st === 'overdue' ? `<span class="late">${daysBetween(inv.due, TODAY)} days late</span>` : '';
        return `<tr data-open="${inv.number}" tabindex="0" aria-label="Open ${inv.number} for ${esc(inv.client)}">
          <td class="strong">${inv.number}</td>
          <td><span class="cell-stack"><span>${esc(inv.client)}</span><span class="mobile-meta">Due ${fmtDate(inv.due)}</span></span></td>
          <td class="col-issued muted">${fmtDate(inv.issued, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          <td class="col-due">${fmtDate(inv.due, { month: 'short', day: 'numeric', year: 'numeric' })}${late}</td>
          <td class="r strong">${usd2.format(total(inv))}</td>
          <td>${pill(st)}</td>
        </tr>`;
      }).join('')}</tbody></table></div>
      <div class="table-foot"><span>${plural(rows.length, 'invoice')}</span><span>Total <strong>${usd2.format(sumOf(rows))}</strong></span></div>`;
  }

  return `${head}
    <div class="toolbar">${tabs}${chip}</div>
    <section class="card flush" id="invoice-panel" role="tabpanel" aria-labelledby="tab-${state.filter}">${body}</section>`;
}

/* ---------- Other sections ---------- */
function placeholderHTML() {
  const name = PAGES[state.page];
  return `<div class="page-head"><div><h1>${name}</h1><p class="sub">Not included in this preview</p></div></div>
    <section class="card">${emptyState('dashboard', `${name} is coming next`, 'This build covers Overview and Invoices. Head there to see your numbers.', `<button class="btn btn-secondary" type="button" data-nav="overview">Go to Overview</button>`)}</section>`;
}

/* ---------- Render ---------- */
function render(animate = false) {
  const page = $('#page');
  document.querySelectorAll('.nav [data-nav]').forEach(a => {
    a.toggleAttribute('aria-current', a.dataset.nav === state.page);
    if (a.dataset.nav === state.page) a.setAttribute('aria-current', 'page');
  });
  document.title = `${PAGES[state.page]} | Ledgerline`;
  page.setAttribute('aria-busy', VIEW === 'loading' ? 'true' : 'false');
  page.classList.toggle('enter', animate);
  page.innerHTML = state.page === 'overview' ? overviewHTML() : state.page === 'invoices' ? invoicesHTML() : placeholderHTML();
  if (state.page === 'overview' && VIEW !== 'loading') mountCashflow();
  else chartObserver?.disconnect();
}

/* ---------- Detail sheet ---------- */
const sheet = $('#sheet');
const sheetScrim = $('#sheetScrim');
let returnFocus = null;

function sheetHTML(inv) {
  const st = statusOf(inv);
  const t = total(inv);
  const late = daysBetween(inv.due, TODAY);
  const third = st === 'paid'
    ? `<dt>Paid on</dt><dd>${fmtDate(inv.paidOn)}</dd>`
    : st === 'overdue'
      ? `<dt>Overdue by</dt><dd class="tone-overdue">${plural(late, 'day')}</dd>`
      : `<dt>Terms</dt><dd>Net ${TERMS}</dd>`;
  const items = inv.items.length
    ? inv.items.map(i => `<tr><td>${esc(i.desc)}</td><td>${i.qty}</td><td>${usd2.format(i.rate)}</td><td>${usd2.format(i.qty * i.rate)}</td></tr>`).join('')
    : `<tr class="empty-row"><td colspan="4">No line items yet</td></tr>`;
  let action;
  if (st === 'paid') action = `<span class="muted">Paid in full on ${fmtDate(inv.paidOn, { month: 'long', day: 'numeric' })}</span><button class="btn btn-secondary" type="button" data-close>Done</button>`;
  else if (st === 'draft') action = `${t ? '' : '<span class="muted">Add a line item to send</span>'}<button class="btn btn-primary" type="button" data-send="invoice" ${t ? '' : 'disabled'}>${icon('send')}Send invoice</button>`;
  else action = `<button class="btn btn-primary" type="button" data-send="reminder">${icon('bell')}Send reminder</button>`;

  return `<div class="grabber" aria-hidden="true"></div>
    <header class="sheet-head">
      <div><p class="eyebrow">Invoice</p><h2 id="sheetTitle">${inv.number}</h2></div>
      <button class="icon-btn" type="button" data-close aria-label="Close invoice details">${icon('x')}</button>
    </header>
    <div class="sheet-body">
      <div class="sheet-summary">
        <div><p class="eyebrow">Billed to</p><p class="client-name">${esc(inv.client)}</p></div>
        <span id="sheetPill">${pill(st)}</span>
      </div>
      <p class="sheet-amount">${usd2.format(t)}</p>
      <dl class="meta">
        <div><dt>Issued</dt><dd>${fmtDate(inv.issued)}</dd></div>
        <div><dt>Due</dt><dd>${fmtDate(inv.due)}</dd></div>
        <div>${third}</div>
      </dl>
      <h3 class="section-title">Line items</h3>
      <table class="items">
        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>${items}</tbody>
        <tfoot><tr><td colspan="3">Total due</td><td>${usd2.format(st === 'paid' ? 0 : t)}</td></tr></tfoot>
      </table>
      <p class="reminder-note" id="reminderNote">${inv.reminded ? `${icon('check')}Reminder sent to ${esc(inv.client)} today` : ''}</p>
    </div>
    <footer class="sheet-foot">${action}</footer>`;
}

function openSheet(number) {
  const inv = invoices.find(i => i.number === number);
  if (!inv) return;
  if (!state.open) returnFocus = document.activeElement;
  state.open = number;
  sheet.innerHTML = sheetHTML(inv);
  sheet.hidden = false;
  sheetScrim.hidden = false;
  void sheet.offsetWidth; // commit the closed position so the slide-in transitions
  sheet.classList.add('open');
  sheetScrim.classList.add('open');
  $('#app').inert = true;
  $('[data-close]', sheet).focus({ preventScroll: true });
}

function closeSheet() {
  if (!state.open) return;
  const number = state.open;
  state.open = null;
  sheet.classList.remove('open');
  sheetScrim.classList.remove('open');
  $('#app').inert = false;
  setTimeout(() => { if (!state.open) { sheet.hidden = true; sheetScrim.hidden = true; } }, 400);
  const target = returnFocus && returnFocus.isConnected ? returnFocus : document.querySelector(`[data-open="${number}"]`);
  target?.focus({ preventScroll: true });
}

async function send(btn) {
  const inv = invoices.find(i => i.number === state.open);
  if (!inv || btn.disabled) return;
  const isReminder = btn.dataset.send === 'reminder';
  btn.disabled = true;
  btn.classList.add('is-loading');
  btn.setAttribute('aria-busy', 'true');
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${isReminder ? 'Sending reminder' : 'Sending invoice'}`;
  await wait(1400); // ponytail: stands in for the API call
  btn.classList.replace('is-loading', 'is-success');
  btn.removeAttribute('aria-busy');
  btn.innerHTML = `${icon('check')}${isReminder ? 'Reminder sent' : 'Invoice sent'}`;
  if (isReminder) inv.reminded = true; else inv.status = 'sent';
  toast(isReminder ? `Reminder sent to ${inv.client} for ${inv.number}` : `${inv.number} sent to ${inv.client}`);
  if (state.open === inv.number) {
    if (isReminder) $('#reminderNote').innerHTML = `${icon('check')}Reminder sent to ${esc(inv.client)} today`;
    $('#sheetPill').innerHTML = pill(statusOf(inv));
  }
  render();
}

/* ---------- Toasts ---------- */
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon('check')}<span>${esc(msg)}</span>`;
  $('#toasts').append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 3200);
}

/* ---------- New invoice ---------- */
function newInvoice() {
  const next = Math.max(1062, ...invoices.map(i => +i.number.slice(4))) + 1;
  const inv = { number: `INV-${next}`, client: 'New client', status: 'draft', issued: TODAY, due: new Date(+TODAY + TERMS * DAY), paidOn: null, items: [] };
  invoices.unshift(inv);
  state.filter = 'all';
  state.query = '';
  $('#search').value = '';
  if (state.page !== 'invoices') navigate('invoices'); else render();
  toast(`Draft ${inv.number} created`);
  openSheet(inv.number);
}

/* ---------- Theme ---------- */
const themeBtn = $('#themeBtn');
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
const effectiveTheme = () => document.documentElement.dataset.theme || (darkMQ.matches ? 'dark' : 'light');
function paintThemeBtn() {
  const dark = effectiveTheme() === 'dark';
  themeBtn.innerHTML = icon(dark ? 'sun' : 'moon');
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
themeBtn.addEventListener('click', () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  setParam('theme', next);
  paintThemeBtn();
});
darkMQ.addEventListener('change', paintThemeBtn);

/* ---------- Events ---------- */
document.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });

document.addEventListener('click', e => {
  const t = e.target.closest('[data-nav],[data-open],[data-filter],[data-action],[data-close],[data-send]');
  if (!t) return;
  if (t.dataset.nav) { e.preventDefault(); navigate(t.dataset.nav); }
  else if (t.dataset.open) openSheet(t.dataset.open);
  else if (t.dataset.filter) { state.filter = t.dataset.filter; render(); $(`#tab-${state.filter}`)?.focus(); }
  else if (t.dataset.action === 'new') newInvoice();
  else if (t.dataset.action === 'clear-search') { state.query = ''; $('#search').value = ''; render(); }
  else if (t.hasAttribute('data-close')) closeSheet();
  else if (t.dataset.send) send(t);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (state.open) closeSheet();
    else if (document.body.classList.contains('nav-open')) { document.body.classList.remove('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
    return;
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
    if (state.open) return;
    e.preventDefault();
    $('#search').focus();
    return;
  }
  const row = e.target.closest?.('tr[data-open]');
  if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSheet(row.dataset.open); }
  const tab = e.target.closest?.('[role="tab"]');
  if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const i = FILTERS.indexOf(tab.dataset.filter);
    state.filter = FILTERS[(i + (e.key === 'ArrowRight' ? 1 : FILTERS.length - 1)) % FILTERS.length];
    render();
    $(`#tab-${state.filter}`)?.focus();
  }
});

$('#search').addEventListener('input', e => {
  state.query = e.target.value;
  if (state.page !== 'invoices' && state.query.trim()) navigate('invoices');
  else if (state.page === 'invoices') render();
});

sheetScrim.addEventListener('click', closeSheet);
$('#menuBtn').addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});
$('#navScrim').addEventListener('click', () => { document.body.classList.remove('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); });

/* Keep nav hrefs carrying theme/view so open-in-new-tab lands in the same state. */
document.querySelectorAll('a[data-nav]').forEach(a => {
  const p = new URLSearchParams();
  ['theme', 'view'].forEach(k => params.get(k) && p.set(k, params.get(k)));
  p.set('page', a.dataset.nav);
  a.href = `?${p}`;
});

/* ---------- Boot ---------- */
paintThemeBtn();
render(true);
if (params.get('sheet') === '1' && VIEW !== 'loading' && invoices.length) openSheet(invoices[0].number);
