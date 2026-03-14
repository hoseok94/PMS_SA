// ====== ACCOUNTING PAGE ======

async function renderAccounting() {
  const today = new Date();
  const firstOfMonth = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-01';
  const todayStr = today.toISOString().slice(0,10);

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-file-invoice-dollar text-gold"></i> บัญชีและการเงิน</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="exportAccountingCSV()"><i class="fas fa-file-excel"></i> Export CSV</button>
        <button class="btn btn-outline btn-sm" onclick="printAccountingReport()"><i class="fas fa-print"></i> พิมพ์รายงาน</button>
      </div>
    </div>

    <!-- Date filter -->
    <div class="card" style="margin-bottom:20px;padding:16px 20px">
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="form-group" style="margin:0;flex:1;min-width:130px">
          <label>จากวันที่</label>
          <input type="date" id="accDateFrom" value="${firstOfMonth}">
        </div>
        <div class="form-group" style="margin:0;flex:1;min-width:130px">
          <label>ถึงวันที่</label>
          <input type="date" id="accDateTo" value="${todayStr}">
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;padding-bottom:1px">
          <button class="btn btn-sm acc-quick active" onclick="setQuickRange('month',this)">เดือนนี้</button>
          <button class="btn btn-sm acc-quick" onclick="setQuickRange('week',this)">7 วัน</button>
          <button class="btn btn-sm acc-quick" onclick="setQuickRange('today',this)">วันนี้</button>
          <button class="btn btn-primary btn-sm" onclick="loadAccountingData()"><i class="fas fa-search"></i> ดูรายงาน</button>
        </div>
      </div>
    </div>

    <!-- KPI row -->
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981"><i class="fas fa-baht-sign"></i></div>
        <div class="stat-body"><div class="stat-number" id="accTotalRev">-</div><div class="stat-label">รายรับรวม</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6"><i class="fas fa-receipt"></i></div>
        <div class="stat-body"><div class="stat-number" id="accTxCount">-</div><div class="stat-label">จำนวนรายการ</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.12);color:#8b5cf6"><i class="fas fa-chart-line"></i></div>
        <div class="stat-body"><div class="stat-number" id="accAvgPerTx">-</div><div class="stat-label">เฉลี่ยต่อรายการ</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-percent"></i></div>
        <div class="stat-body"><div class="stat-number" id="accVatTotal">-</div><div class="stat-label">VAT 7% (ประมาณ)</div></div>
      </div>
    </div>

    <!-- Two-col: method + VAT breakdown -->
    <div class="two-col" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-credit-card"></i> สรุปตามวิธีชำระ</div></div>
        <div id="accMethodTable" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-calendar-alt"></i> สรุปรายวัน</div></div>
        <div id="accDailyTable" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
      </div>
    </div>

    <!-- VAT summary card -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title"><i class="fas fa-file-invoice"></i> สรุปสำหรับยื่นภาษี (VAT)</div></div>
      <div id="accVatSummary"></div>
    </div>

    <!-- Outstanding (unpaid) -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title"><i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i> รายการค้างชำระ</div></div>
      <div id="accOutstanding" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
    </div>

    <!-- Ledger -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-list"></i> รายการทั้งหมด</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="accMethodFilter" onchange="filterAccLedger()" style="font-size:13px;padding:5px 10px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary)">
            <option value="all">ทุกวิธีชำระ</option>
            <option value="Cash">เงินสด</option>
            <option value="Credit Card">บัตรเครดิต</option>
            <option value="Bank Transfer">โอนธนาคาร</option>
            <option value="QR Code">QR Code</option>
          </select>
        </div>
      </div>
      <div id="accLedger" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
    </div>
  `;
  loadAccountingData();
}

let _accAllPayments = [];

function setQuickRange(range, btn) {
  document.querySelectorAll('.acc-quick').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  let fromStr = todayStr;
  if (range === 'month') {
    fromStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-01';
  } else if (range === 'week') {
    const d = new Date(today); d.setDate(d.getDate()-6);
    fromStr = d.toISOString().slice(0,10);
  }
  document.getElementById('accDateFrom').value = fromStr;
  document.getElementById('accDateTo').value = todayStr;
  loadAccountingData();
}

async function loadAccountingData() {
  const from = document.getElementById('accDateFrom')?.value;
  const to = document.getElementById('accDateTo')?.value;
  if (!from || !to) return;
  try {
    const [payRes, bookRes] = await Promise.all([API.getPayments(), API.getBookings()]);
    const allPay = payRes.data || [];
    const allBook = bookRes.data || [];

    const payments = allPay.filter(p => { const d = p.PaymentDate?.slice(0,10); return d >= from && d <= to; });
    _accAllPayments = payments;

    const total = payments.reduce((s,p) => s + Number(p.Amount||0), 0);
    const vat = total / 1.07 * 0.07;
    const preVat = total - vat;

    document.getElementById('accTotalRev').textContent = formatMoney(total);
    document.getElementById('accTxCount').textContent = payments.length + ' รายการ';
    document.getElementById('accAvgPerTx').textContent = payments.length > 0 ? formatMoney(total/payments.length) : '-';
    document.getElementById('accVatTotal').textContent = formatMoney(vat);

    renderMethodTable(payments);
    renderDailyTable(payments, from, to);
    renderVatSummary(total, preVat, vat, from, to);
    renderOutstanding(allBook, allPay);
    renderAccLedger(payments);
  } catch (err) {
    showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

function renderMethodTable(payments) {
  const el = document.getElementById('accMethodTable');
  if (!el) return;
  const methods = ['Cash','Credit Card','Bank Transfer','QR Code'];
  const mLabel = { Cash:'เงินสด', 'Credit Card':'บัตรเครดิต', 'Bank Transfer':'โอนธนาคาร', 'QR Code':'QR Code' };
  const mColor = { Cash:'#10b981', 'Credit Card':'#3b82f6', 'Bank Transfer':'#8b5cf6', 'QR Code':'#f59e0b' };
  const total = payments.reduce((s,p) => s+Number(p.Amount||0), 0);
  const rows = methods.map(m => {
    const items = payments.filter(p => p.Method === m);
    const sum = items.reduce((s,p) => s+Number(p.Amount||0), 0);
    const pct = total > 0 ? Math.round(sum/total*100) : 0;
    return { m, label:mLabel[m], count:items.length, sum, pct };
  }).filter(r => r.count > 0);

  if (!rows.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>ไม่มีข้อมูล</p></div>'; return; }

  el.innerHTML = '<div style="padding:4px 0">' +
    rows.map(r =>
      '<div style="padding:12px 0;border-bottom:1px solid var(--border-color)">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
          '<span style="font-weight:500;font-size:14px">' + r.label + '</span>' +
          '<span style="font-weight:500;font-size:14px">' + formatMoney(r.sum) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
          '<span style="font-size:12px;color:var(--text-muted)">' + r.count + ' รายการ</span>' +
          '<span style="font-size:12px;color:var(--text-muted)">' + r.pct + '%</span></div>' +
        '<div style="height:5px;background:var(--border-color);border-radius:3px;overflow:hidden">' +
          '<div style="height:100%;width:' + r.pct + '%;background:' + (mColor[r.m]||'#888') + ';border-radius:3px;transition:width .4s"></div></div>' +
      '</div>'
    ).join('') +
    '<div style="padding:14px 0 4px;display:flex;justify-content:space-between;font-weight:500">' +
      '<span>รวมทั้งหมด</span><span class="text-gold">' + formatMoney(total) + '</span></div>' +
  '</div>';
}

function renderDailyTable(payments, from, to) {
  const el = document.getElementById('accDailyTable');
  if (!el) return;
  const byDate = {};
  payments.forEach(p => {
    const d = p.PaymentDate?.slice(0,10) || '';
    if (!byDate[d]) byDate[d] = { total:0, count:0 };
    byDate[d].total += Number(p.Amount||0);
    byDate[d].count++;
  });
  const dates = Object.keys(byDate).sort().reverse();
  if (!dates.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><p>ไม่มีข้อมูลในช่วงนี้</p></div>'; return; }

  el.innerHTML = '<div style="overflow-x:auto"><table class="data-table"><thead><tr>' +
    '<th>วันที่</th><th style="text-align:right">จำนวน</th><th style="text-align:right">รายรับ</th>' +
    '</tr></thead><tbody>' +
    dates.map(d =>
      '<tr><td style="font-size:13px">' + formatDate(d) + '</td>' +
      '<td style="text-align:right;font-size:13px;color:var(--text-muted)">' + byDate[d].count + ' รายการ</td>' +
      '<td style="text-align:right;font-weight:500;color:#10b981">' + formatMoney(byDate[d].total) + '</td></tr>'
    ).join('') +
    '</tbody></table></div>';
}

function renderVatSummary(total, preVat, vat, from, to) {
  const el = document.getElementById('accVatSummary');
  if (!el) return;
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;padding:16px 20px">' +
    [
      { label:'รายรับทั้งหมด (รวม VAT)', val:formatMoney(total), color:'var(--text-primary)' },
      { label:'รายรับก่อน VAT (ยอดฐาน)', val:formatMoney(preVat), color:'#3b82f6' },
      { label:'VAT 7%', val:formatMoney(vat), color:'#8b5cf6' },
      { label:'ช่วงวันที่', val:formatDate(from) + ' – ' + formatDate(to), color:'var(--text-muted)' }
    ].map(x =>
      '<div style="padding:14px 16px;background:var(--bg-secondary);border-radius:8px">' +
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">' + x.label + '</div>' +
        '<div style="font-size:16px;font-weight:600;color:' + x.color + '">' + x.val + '</div>' +
      '</div>'
    ).join('') + '</div>' +
  '<div style="padding:0 20px 16px;font-size:12px;color:var(--text-muted)">' +
    '<i class="fas fa-info-circle"></i> คำนวณโดยถือว่าราคาที่เรียกเก็บรวม VAT 7% แล้ว (ยอดฐาน = รายรับ ÷ 1.07) — กรุณาตรวจสอบกับนักบัญชีอีกครั้ง' +
  '</div>';
}

function renderOutstanding(bookings, payments) {
  const el = document.getElementById('accOutstanding');
  if (!el) return;
  const paidBookings = new Set(payments.map(p => p.BookingID));
  const outstanding = (bookings || []).filter(b => b.Status === 'CheckedOut' && !paidBookings.has(b.BookingID));
  if (!outstanding.length) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle" style="color:#10b981"></i><p>ไม่มีรายการค้างชำระ</p></div>';
    return;
  }
  el.innerHTML = '<div style="overflow-x:auto"><table class="data-table"><thead><tr>' +
    '<th>รหัสการจอง</th><th>ลูกค้า</th><th>Check-out</th><th style="text-align:right">ยอดค้างชำระ</th><th></th>' +
    '</tr></thead><tbody>' +
    outstanding.map(b =>
      '<tr>' +
        '<td style="font-family:monospace;font-size:12px">' + b.BookingID + '</td>' +
        '<td>' + (b.CustomerName || b.CustomerID) + '</td>' +
        '<td style="font-size:13px;color:var(--text-muted)">' + formatDate(b.CheckOutDate) + '</td>' +
        '<td style="text-align:right;font-weight:500;color:#ef4444">' + formatMoney(b.TotalAmount||0) + '</td>' +
        '<td><button class="btn btn-primary btn-sm" onclick="navigateTo(\'payment\')"><i class="fas fa-credit-card"></i> รับชำระ</button></td>' +
      '</tr>'
    ).join('') +
    '</tbody></table></div>';
}

function filterAccLedger() {
  const method = document.getElementById('accMethodFilter')?.value || 'all';
  const filtered = method === 'all' ? _accAllPayments : _accAllPayments.filter(p => p.Method === method);
  renderAccLedger(filtered);
}

function renderAccLedger(payments) {
  const el = document.getElementById('accLedger');
  if (!el) return;
  if (!payments || !payments.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>ไม่มีรายการในช่วงนี้</p></div>'; return; }
  const sorted = [...payments].sort((a,b) => new Date(b.PaymentDate)-new Date(a.PaymentDate));
  const mIcon = { Cash:'fa-money-bill', 'Credit Card':'fa-credit-card', 'Bank Transfer':'fa-university', 'QR Code':'fa-qrcode' };
  const mLabel = { Cash:'เงินสด', 'Credit Card':'บัตรเครดิต', 'Bank Transfer':'โอน', 'QR Code':'QR' };

  el.innerHTML = '<div style="overflow-x:auto"><table class="data-table"><thead><tr>' +
    '<th>รหัส</th><th>วันที่-เวลา</th><th>การจอง</th><th>วิธีชำระ</th><th style="text-align:right">จำนวนเงิน</th><th style="text-align:right">VAT</th>' +
    '</tr></thead><tbody>' +
    sorted.map(p => {
      const amt = Number(p.Amount||0);
      const vat = amt / 1.07 * 0.07;
      return '<tr>' +
        '<td style="font-family:monospace;font-size:12px;color:var(--text-muted)">' + p.PaymentID + '</td>' +
        '<td style="font-size:13px">' + formatDatetime(p.PaymentDate) + '</td>' +
        '<td style="font-size:13px;font-weight:500">' + p.BookingID + '</td>' +
        '<td><span style="font-size:12px;display:flex;align-items:center;gap:5px">' +
          '<i class="fas ' + (mIcon[p.Method]||'fa-money-bill') + '" style="color:var(--text-muted)"></i>' +
          (mLabel[p.Method]||p.Method) + '</span></td>' +
        '<td style="text-align:right;font-weight:500;color:#10b981">' + formatMoney(amt) + '</td>' +
        '<td style="text-align:right;font-size:12px;color:var(--text-muted)">' + formatMoney(vat) + '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table></div>';
}

function exportAccountingCSV() {
  if (!_accAllPayments.length) { showToast('ไม่มีข้อมูลที่จะ export', 'warning'); return; }
  const from = document.getElementById('accDateFrom')?.value || '';
  const to = document.getElementById('accDateTo')?.value || '';
  const total = _accAllPayments.reduce((s,p) => s+Number(p.Amount||0), 0);
  const vat = total/1.07*0.07;
  const headers = ['PaymentID','BookingID','วันที่','วิธีชำระ','จำนวนเงิน','VAT (7%)','สถานะ'];
  const rows = _accAllPayments.map(p => {
    const amt = Number(p.Amount||0);
    return [p.PaymentID, p.BookingID, formatDatetime(p.PaymentDate), p.Method, amt, (amt/1.07*0.07).toFixed(2), p.Status||'Paid'];
  });
  rows.push([]);
  rows.push(['','','','รวมทั้งหมด', total, vat.toFixed(2),'']);
  rows.push(['','','','ยอดก่อน VAT', (total-vat).toFixed(2),'','']);
  const csv = '\uFEFF' + [headers,...rows].map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'accounting_' + from + '_' + to + '.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Export สำเร็จ', 'success');
}

function printAccountingReport() {
  const from = document.getElementById('accDateFrom')?.value || '';
  const to = document.getElementById('accDateTo')?.value || '';
  const total = _accAllPayments.reduce((s,p) => s+Number(p.Amount||0), 0);
  const vat = total/1.07*0.07;
  const preVat = total-vat;
  const mLabel = { Cash:'เงินสด', 'Credit Card':'บัตรเครดิต', 'Bank Transfer':'โอนธนาคาร', 'QR Code':'QR Code' };
  const mTotals = {};
  _accAllPayments.forEach(p => { mTotals[p.Method] = (mTotals[p.Method]||0)+Number(p.Amount||0); });
  const methodRows = Object.entries(mTotals).map(([m,s]) =>
    '<tr><td>' + (mLabel[m]||m) + '</td><td style="text-align:right">' + formatMoney(s) + '</td></tr>'
  ).join('');
  const txRows = [..._accAllPayments].sort((a,b)=>new Date(b.PaymentDate)-new Date(a.PaymentDate)).map(p => {
    const amt = Number(p.Amount||0);
    return '<tr><td>' + p.PaymentID + '</td><td>' + formatDatetime(p.PaymentDate) + '</td><td>' + p.BookingID + '</td>' +
      '<td>' + (mLabel[p.Method]||p.Method) + '</td><td style="text-align:right">' + formatMoney(amt) + '</td>' +
      '<td style="text-align:right;color:#888">' + formatMoney(amt/1.07*0.07) + '</td></tr>';
  }).join('');
  const w = window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานบัญชี</title>' +
    '<style>body{font-family:Sarabun,sans-serif;font-size:13px;color:#111;padding:24px}' +
    'h1{font-size:18px;margin:0 0 4px}.sub{color:#666;font-size:13px;margin-bottom:20px}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:20px}' +
    'th{background:#f3f4f6;font-size:12px;letter-spacing:.5px;text-align:left;padding:8px 10px}' +
    'td{padding:7px 10px;border-bottom:1px solid #e5e7eb}' +
    '.total-row td{font-weight:700;border-top:2px solid #111}.gold{color:#B8860B}' +
    '.vat-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
    '.vat-item label{display:block;font-size:11px;color:#666;margin-bottom:4px}.vat-item .val{font-size:15px;font-weight:600}' +
    '@media print{button{display:none}}</style></head><body>' +
    '<h1>รายงานบัญชีและการเงิน — Hypnos Hotel PMS</h1>' +
    '<div class="sub">ช่วงวันที่: ' + formatDate(from) + ' ถึง ' + formatDate(to) + ' | พิมพ์: ' + formatDatetime(new Date().toISOString()) + '</div>' +
    '<div class="vat-box">' +
      '<div class="vat-item"><label>รายรับรวม (รวม VAT)</label><div class="val gold">' + formatMoney(total) + '</div></div>' +
      '<div class="vat-item"><label>ยอดก่อน VAT</label><div class="val">' + formatMoney(preVat) + '</div></div>' +
      '<div class="vat-item"><label>VAT 7%</label><div class="val" style="color:#8b5cf6">' + formatMoney(vat) + '</div></div>' +
    '</div>' +
    '<h3 style="margin:0 0 8px">สรุปตามวิธีชำระ</h3>' +
    '<table><thead><tr><th>วิธีชำระ</th><th style="text-align:right">ยอดรวม</th></tr></thead>' +
    '<tbody>' + methodRows +
    '<tr class="total-row"><td>รวมทั้งหมด</td><td style="text-align:right" class="gold">' + formatMoney(total) + '</td></tr>' +
    '</tbody></table>' +
    '<h3 style="margin:0 0 8px">รายการทั้งหมด (' + _accAllPayments.length + ' รายการ)</h3>' +
    '<table><thead><tr><th>รหัส</th><th>วันที่</th><th>การจอง</th><th>วิธีชำระ</th><th style="text-align:right">จำนวนเงิน</th><th style="text-align:right">VAT</th></tr></thead>' +
    '<tbody>' + txRows + '</tbody></table>' +
    '<button onclick="window.print()">🖨 พิมพ์</button></body></html>');
  w.document.close();
}
