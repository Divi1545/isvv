import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireOwner(req: Request, res: Response, next: Function) {
  if ((req.session as any).ownerAuth) return next();
  res.status(401).json({ error: "Not authenticated" });
}

// ── Login ────────────────────────────────────────────────────────────────────
router.post("/api/owner/login", (req: Request, res: Response) => {
  const { password } = req.body;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: "SESSION_SECRET not set" });
  if (password !== secret) return res.status(401).json({ error: "Invalid password" });
  (req.session as any).ownerAuth = true;
  res.json({ success: true });
});

// ── Logout ───────────────────────────────────────────────────────────────────
router.post("/api/owner/logout", (req: Request, res: Response) => {
  (req.session as any).ownerAuth = false;
  res.json({ success: true });
});

// ── Stats API ────────────────────────────────────────────────────────────────
router.get("/api/owner/stats", requireOwner, async (_req: Request, res: Response) => {
  try {
    const [
      vendorsResult,
      servicesResult,
      bookingStatusResult,
      revenueResult,
      latestBookingsResult,
      latestVendorsResult,
    ] = await Promise.all([
      // Total vendors
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'vendor'`),

      // Total services
      pool.query(`SELECT COUNT(*) AS count FROM services`),

      // Bookings by status
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM bookings
        GROUP BY status
      `),

      // Revenue this month (non-cancelled bookings)
      pool.query(`
        SELECT COALESCE(SUM(total_price), 0) AS revenue
        FROM bookings
        WHERE status NOT IN ('cancelled', 'refunded')
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `),

      // Latest 5 bookings with service + vendor name
      pool.query(`
        SELECT
          b.id,
          b.customer_name,
          b.customer_email,
          b.status,
          b.total_price,
          b.created_at,
          s.name  AS service_name,
          u.business_name AS vendor_name
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id
        LEFT JOIN users u ON u.id = b.user_id
        ORDER BY b.created_at DESC
        LIMIT 5
      `),

      // Latest 5 vendor signups
      pool.query(`
        SELECT id, full_name, business_name, business_type, email, created_at
        FROM users
        WHERE role = 'vendor'
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of bookingStatusResult.rows) {
      statusMap[row.status] = parseInt(row.count, 10);
    }

    res.json({
      totalVendors: parseInt(vendorsResult.rows[0].count, 10),
      totalServices: parseInt(servicesResult.rows[0].count, 10),
      bookings: {
        pending: statusMap["pending"] || 0,
        confirmed: statusMap["confirmed"] || 0,
        completed: statusMap["completed"] || 0,
        cancelled: statusMap["cancelled"] || 0,
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      },
      revenueThisMonth: parseFloat(revenueResult.rows[0].revenue),
      latestBookings: latestBookingsResult.rows,
      latestVendors: latestVendorsResult.rows,
    });
  } catch (err: any) {
    console.error("[OWNER-ADMIN] Stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── Dashboard HTML ────────────────────────────────────────────────────────────
router.get("/admin", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>IslandLoaf Owner Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
  /* Login */
  #login-screen{display:flex;align-items:center;justify-content:center;min-height:100vh}
  .login-card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:40px;width:100%;max-width:400px;text-align:center}
  .login-card h1{font-size:1.5rem;font-weight:700;margin-bottom:8px;color:#f1f5f9}
  .login-card p{color:#94a3b8;font-size:0.875rem;margin-bottom:28px}
  .login-card input{width:100%;padding:12px 16px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:1rem;margin-bottom:16px;outline:none}
  .login-card input:focus{border-color:#6366f1}
  .btn{width:100%;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:background .2s}
  .btn:hover{background:#4f46e5}
  .error-msg{color:#f87171;font-size:0.85rem;margin-top:8px;min-height:20px}
  /* Dashboard */
  #dashboard{display:none}
  .topbar{background:#1e293b;border-bottom:1px solid #334155;padding:16px 32px;display:flex;align-items:center;justify-content:space-between}
  .topbar h1{font-size:1.25rem;font-weight:700;color:#f1f5f9}
  .topbar-right{display:flex;align-items:center;gap:16px}
  .refresh-badge{font-size:0.75rem;color:#64748b;background:#0f172a;padding:4px 10px;border-radius:20px;border:1px solid #334155}
  .logout-btn{background:transparent;border:1px solid #334155;color:#94a3b8;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.85rem;transition:all .2s}
  .logout-btn:hover{border-color:#f87171;color:#f87171}
  .content{padding:32px;max-width:1400px;margin:0 auto}
  /* Stat cards */
  .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:32px}
  .stat-card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px}
  .stat-card .label{font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:10px}
  .stat-card .value{font-size:2rem;font-weight:700;color:#f1f5f9}
  .stat-card .sub{font-size:0.78rem;color:#64748b;margin-top:6px}
  .stat-card.green .value{color:#34d399}
  .stat-card.blue .value{color:#60a5fa}
  .stat-card.yellow .value{color:#fbbf24}
  .stat-card.purple .value{color:#a78bfa}
  /* Tables */
  .tables-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  @media(max-width:900px){.tables-grid{grid-template-columns:1fr}}
  .table-card{background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden}
  .table-card h2{font-size:0.9rem;font-weight:600;color:#f1f5f9;padding:18px 20px;border-bottom:1px solid #334155}
  table{width:100%;border-collapse:collapse}
  th{font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:10px 16px;text-align:left;background:#0f172a}
  td{font-size:0.82rem;color:#cbd5e1;padding:12px 16px;border-top:1px solid #1e293b}
  tr:hover td{background:#263349}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:uppercase}
  .badge-pending{background:#451a03;color:#fbbf24}
  .badge-confirmed{background:#1e3a5f;color:#60a5fa}
  .badge-completed{background:#052e16;color:#34d399}
  .badge-cancelled{background:#3b0764;color:#c084fc}
  .badge-refunded{background:#1c1917;color:#a8a29e}
  .loading{text-align:center;padding:40px;color:#475569}
  #countdown{font-variant-numeric:tabular-nums}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login-screen">
  <div class="login-card">
    <h1>🌴 IslandLoaf</h1>
    <p>Owner Dashboard — Restricted Access</p>
    <input type="password" id="pw-input" placeholder="Enter SESSION_SECRET password" autocomplete="current-password"/>
    <button class="btn" onclick="doLogin()">Sign In</button>
    <div class="error-msg" id="login-error"></div>
  </div>
</div>

<!-- DASHBOARD -->
<div id="dashboard">
  <div class="topbar">
    <h1>🌴 IslandLoaf — Owner Dashboard</h1>
    <div class="topbar-right">
      <span class="refresh-badge">Auto-refresh in <span id="countdown">30</span>s</span>
      <button class="logout-btn" onclick="doLogout()">Logout</button>
    </div>
  </div>
  <div class="content">
    <div id="stats-area"><div class="loading">Loading stats…</div></div>
    <div id="tables-area"></div>
  </div>
</div>

<script>
let refreshTimer, countdownTimer, countdown = 30;

async function doLogin() {
  const pw = document.getElementById('pw-input').value;
  const err = document.getElementById('login-error');
  err.textContent = '';
  try {
    const r = await fetch('/api/owner/login', {
      method: 'POST', credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: pw })
    });
    if (!r.ok) { err.textContent = 'Invalid password.'; return; }
    showDashboard();
  } catch(e) { err.textContent = 'Network error.'; }
}

document.getElementById('pw-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

async function doLogout() {
  await fetch('/api/owner/logout', { method: 'POST', credentials: 'include' });
  clearInterval(refreshTimer); clearInterval(countdownTimer);
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pw-input').value = '';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadStats();
  startRefresh();
}

function startRefresh() {
  clearInterval(refreshTimer); clearInterval(countdownTimer);
  countdown = 30;
  document.getElementById('countdown').textContent = countdown;
  countdownTimer = setInterval(() => {
    countdown--;
    document.getElementById('countdown').textContent = countdown;
    if (countdown <= 0) { countdown = 30; loadStats(); }
  }, 1000);
}

function fmtCurrency(n) {
  return 'LKR ' + Number(n).toLocaleString('en-LK', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
}
function badge(status) {
  return '<span class="badge badge-' + (status||'').toLowerCase() + '">' + (status||'—') + '</span>';
}

async function loadStats() {
  try {
    const r = await fetch('/api/owner/stats', { credentials: 'include' });
    if (r.status === 401) { doLogout(); return; }
    const d = await r.json();
    renderStats(d);
    renderTables(d);
  } catch(e) {
    document.getElementById('stats-area').innerHTML = '<div class="loading">Failed to load stats. Retrying…</div>';
  }
}

function renderStats(d) {
  document.getElementById('stats-area').innerHTML = \`
  <div class="stats-grid">
    <div class="stat-card blue">
      <div class="label">Total Vendors</div>
      <div class="value">\${d.totalVendors}</div>
      <div class="sub">Registered on platform</div>
    </div>
    <div class="stat-card purple">
      <div class="label">Total Services</div>
      <div class="value">\${d.totalServices}</div>
      <div class="sub">Listed across all vendors</div>
    </div>
    <div class="stat-card yellow">
      <div class="label">Bookings</div>
      <div class="value">\${d.bookings.total}</div>
      <div class="sub">
        \${d.bookings.pending} pending &nbsp;·&nbsp;
        \${d.bookings.confirmed} confirmed &nbsp;·&nbsp;
        \${d.bookings.completed} completed
      </div>
    </div>
    <div class="stat-card green">
      <div class="label">Revenue This Month</div>
      <div class="value">\${fmtCurrency(d.revenueThisMonth)}</div>
      <div class="sub">Excluding cancelled / refunded</div>
    </div>
  </div>\`;
}

function renderTables(d) {
  const bookingRows = d.latestBookings.map(b => \`
    <tr>
      <td>#\${b.id}</td>
      <td>\${b.customer_name}</td>
      <td>\${b.service_name || '—'}</td>
      <td>\${b.vendor_name || '—'}</td>
      <td>\${badge(b.status)}</td>
      <td>\${fmtCurrency(b.total_price)}</td>
      <td>\${fmtDate(b.created_at)}</td>
    </tr>\`).join('');

  const vendorRows = d.latestVendors.map(v => \`
    <tr>
      <td>#\${v.id}</td>
      <td>\${v.full_name}</td>
      <td>\${v.business_name}</td>
      <td>\${v.business_type}</td>
      <td>\${v.email}</td>
      <td>\${fmtDate(v.created_at)}</td>
    </tr>\`).join('');

  document.getElementById('tables-area').innerHTML = \`
  <div class="tables-grid">
    <div class="table-card">
      <h2>Latest 5 Bookings</h2>
      <table>
        <thead><tr><th>#</th><th>Customer</th><th>Service</th><th>Vendor</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>\${bookingRows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#475569">No bookings yet</td></tr>'}</tbody>
      </table>
    </div>
    <div class="table-card">
      <h2>Latest 5 Vendor Signups</h2>
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Business</th><th>Type</th><th>Email</th><th>Joined</th></tr></thead>
        <tbody>\${vendorRows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#475569">No vendors yet</td></tr>'}</tbody>
      </table>
    </div>
  </div>\`;
}

// Auto-detect if already logged in on page load
(async () => {
  try {
    const r = await fetch('/api/owner/stats', { credentials: 'include' });
    if (r.ok) { showDashboard(); }
  } catch(e) {}
})();
</script>
</body>
</html>`);
});

export default router;
