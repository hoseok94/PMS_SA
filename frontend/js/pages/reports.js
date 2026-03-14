// ====== CHART INSTANCES (for destroy/re-render) ======
let _chartLine = null, _chartBar = null, _chartPie = null, _chartRoomBar = null;

function destroyCharts() {
  [_chartLine, _chartBar, _chartPie, _chartRoomBar].forEach(c => { if (c) { c.destroy(); } });
  _chartLine = _chartBar = _chartPie = _chartRoomBar = null;
}

async function renderReports() {
  destroyCharts();
  const today = new Date().toISOString().split('T')[0];
  const firstDay = today.slice(0, 8) + '01';

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-chart-bar"></i> รายงาน</h2>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-chart-pie"></i> ภาพรวมอัตราการเข้าพัก</div>
        <div class="download-bar">
          <button class="btn btn-secondary btn-sm" onclick="downloadOccupancyPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
          <button class="btn btn-secondary btn-sm" onclick="downloadOccupancyExcel()"><i class="fas fa-file-excel"></i> Excel</button>
        </div>
      </div>
      <div id="occupancyReport" class="loading"><i class="fas fa-spinner"></i></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-baht-sign"></i> รายงานรายได้</div>
        <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
          <div style="display:flex;gap:6px;align-items:center">
            <input type="date" id="rptFrom" value="${firstDay}" style="padding:7px 11px;border:1.5px solid var(--border-strong);border-radius:6px;font-family:var(--font);font-size:.85rem">
            <span style="color:var(--text-muted);font-size:.85rem">ถึง</span>
            <input type="date" id="rptTo" value="${today}" style="padding:7px 11px;border:1.5px solid var(--border-strong);border-radius:6px;font-family:var(--font);font-size:.85rem">
            <button class="btn btn-primary btn-sm" onclick="loadRevenueReport()"><i class="fas fa-search"></i> ดูรายงาน</button>
          </div>
          <div class="download-bar">
            <button class="btn btn-secondary btn-sm" onclick="downloadRevenuePDF()"><i class="fas fa-file-pdf"></i> PDF</button>
            <button class="btn btn-secondary btn-sm" onclick="downloadRevenueExcel()"><i class="fas fa-file-excel"></i> Excel</button>
          </div>
        </div>
      </div>
      <div id="revenueReport" class="loading"><i class="fas fa-spinner"></i></div>
    </div>
  `;
  loadOccupancyReport();
  loadRevenueReport();
}

let _occupancyData = null;
let _revenueData = null;

async function loadOccupancyReport() {
  try {
    const { data } = await API.getOccupancyReport();
    _occupancyData = data;
    const el = document.getElementById('occupancyReport');
    if (!el) return;
    el.innerHTML = `
      <div class="two-col" style="margin-bottom:24px">
        <div>
          <div class="section-title">สถานะห้องพักตามประเภท</div>
          <div class="table-wrap"><table>
            <thead><tr><th>ประเภท</th><th>ทั้งหมด</th><th>ว่าง</th><th>มีผู้พัก</th><th>จอง</th><th>อัตราการเข้าพัก</th></tr></thead>
            <tbody>${data.byType.map(t => `<tr>
              <td class="fw-bold">${t.TypeName}</td><td>${t.total}</td>
              <td style="color:var(--success)">${t.available}</td>
              <td style="color:var(--gold)">${t.occupied}</td>
              <td style="color:var(--info)">${t.booked}</td>
              <td><div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:7px;background:#E2E8F0;border-radius:4px">
                  <div style="width:${t.occupancyRate}%;height:100%;background:var(--gold);border-radius:4px"></div>
                </div>
                <span class="fw-bold" style="font-size:.83rem;min-width:35px">${t.occupancyRate}%</span>
              </div></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div>
          <div class="section-title">การจองรายเดือน (12 เดือนล่าสุด)</div>
          <div class="table-wrap"><table>
            <thead><tr><th>เดือน</th><th>จำนวนการจอง</th><th>รายได้</th></tr></thead>
            <tbody>${data.bookingsByMonth.map(m => `<tr>
              <td>${m.month}</td>
              <td><span class="badge badge-blue">${m.bookings} ครั้ง</span></td>
              <td class="fw-bold text-gold">${formatMoney(m.revenue)}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <div class="two-col" style="margin-bottom:20px">
        <div class="card" style="padding:20px;border:1px solid var(--border)">
          <div class="section-title" style="margin-top:0"><i class="fas fa-chart-bar"></i> กราฟแท่ง: อัตราการเข้าพักแต่ละประเภทห้อง</div>
          <div style="position:relative;height:260px"><canvas id="chartRoomBar"></canvas></div>
        </div>
        <div class="card" style="padding:20px;border:1px solid var(--border)">
          <div class="section-title" style="margin-top:0"><i class="fas fa-chart-pie"></i> กราฟวงกลม: สัดส่วนสถานะห้องพัก</div>
          <div style="position:relative;height:260px"><canvas id="chartPie"></canvas></div>
        </div>
      </div>

      <div class="card" style="padding:20px;border:1px solid var(--border)">
        <div class="section-title" style="margin-top:0"><i class="fas fa-chart-line"></i> กราฟเส้น: การจองและรายได้รายเดือน (12 เดือนล่าสุด)</div>
        <div style="position:relative;height:280px"><canvas id="chartLine"></canvas></div>
      </div>
    `;
    setTimeout(() => {
      renderRoomBarChart(data.byType);
      renderPieChart(data.byType);
      renderLineChart(data.bookingsByMonth);
    }, 50);
  } catch (err) {
    const el = document.getElementById('occupancyReport');
    if (el) el.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function renderRoomBarChart(byType) {
  const ctx = document.getElementById('chartRoomBar');
  if (!ctx) return;
  if (_chartRoomBar) _chartRoomBar.destroy();
  _chartRoomBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: byType.map(t => t.TypeName),
      datasets: [
        { label: 'ว่าง', data: byType.map(t => t.available), backgroundColor: 'rgba(26,122,74,0.75)', borderRadius: 5 },
        { label: 'มีผู้พัก', data: byType.map(t => t.occupied), backgroundColor: 'rgba(184,134,11,0.8)', borderRadius: 5 },
        { label: 'จองแล้ว', data: byType.map(t => t.booked), backgroundColor: 'rgba(29,95,166,0.75)', borderRadius: 5 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Sarabun' }, boxWidth: 12 } } },
      scales: {
        x: { ticks: { font: { family: 'Sarabun', size: 12 } } },
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Sarabun' } } }
      }
    }
  });
}

function renderPieChart(byType) {
  const ctx = document.getElementById('chartPie');
  if (!ctx) return;
  if (_chartPie) _chartPie.destroy();
  const totAvailable = byType.reduce((s, t) => s + Number(t.available), 0);
  const totOccupied = byType.reduce((s, t) => s + Number(t.occupied), 0);
  const totBooked = byType.reduce((s, t) => s + Number(t.booked), 0);
  const totOther = byType.reduce((s, t) => s + Math.max(0, Number(t.total) - Number(t.available) - Number(t.occupied) - Number(t.booked)), 0);
  _chartPie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['ว่าง', 'มีผู้พัก', 'จองแล้ว', 'ซ่อมบำรุง/อื่นๆ'],
      datasets: [{
        data: [totAvailable, totOccupied, totBooked, totOther],
        backgroundColor: ['rgba(26,122,74,0.8)','rgba(184,134,11,0.85)','rgba(29,95,166,0.8)','rgba(185,28,28,0.75)'],
        borderWidth: 2, borderColor: '#fff'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Sarabun', size: 12 }, padding: 12 } } },
      cutout: '60%'
    }
  });
}

function renderLineChart(bookingsByMonth) {
  const ctx = document.getElementById('chartLine');
  if (!ctx) return;
  if (_chartLine) _chartLine.destroy();
  _chartLine = new Chart(ctx, {
    type: 'line',
    data: {
      labels: bookingsByMonth.map(m => m.month),
      datasets: [
        {
          label: 'จำนวนการจอง', data: bookingsByMonth.map(m => m.bookings),
          borderColor: 'rgba(29,95,166,0.9)', backgroundColor: 'rgba(29,95,166,0.1)',
          tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: 'rgba(29,95,166,1)', yAxisID: 'y'
        },
        {
          label: 'รายได้ (฿)', data: bookingsByMonth.map(m => Number(m.revenue) || 0),
          borderColor: 'rgba(184,134,11,0.9)', backgroundColor: 'rgba(184,134,11,0.08)',
          tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: 'rgba(184,134,11,1)', yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { font: { family: 'Sarabun' }, boxWidth: 14 } } },
      scales: {
        x: { ticks: { font: { family: 'Sarabun', size: 11 }, maxRotation: 45 } },
        y: {
          type: 'linear', position: 'left', beginAtZero: true,
          ticks: { stepSize: 1, font: { family: 'Sarabun' } },
          title: { display: true, text: 'จำนวนการจอง', font: { family: 'Sarabun', size: 11 }, color: 'rgba(29,95,166,0.9)' }
        },
        y2: {
          type: 'linear', position: 'right', beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: { font: { family: 'Sarabun' }, callback: v => v.toLocaleString('th-TH') + '฿' },
          title: { display: true, text: 'รายได้ (฿)', font: { family: 'Sarabun', size: 11 }, color: 'rgba(184,134,11,0.9)' }
        }
      }
    }
  });
}

async function loadRevenueReport() {
  const from = document.getElementById('rptFrom')?.value;
  const to = document.getElementById('rptTo')?.value;
  if (!from || !to) return;
  try {
    const { data } = await API.getRevenueReport(from, to);
    _revenueData = { data, from, to };
    const el = document.getElementById('revenueReport');
    if (!el) return;
    el.innerHTML = `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-baht-sign"></i></div><div><div class="stat-value" style="font-size:1.2rem">${formatMoney(data.summary.totalRevenue||0)}</div><div class="stat-label">รายได้รวม</div></div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-receipt"></i></div><div><div class="stat-value">${data.summary.totalTransactions||0}</div><div class="stat-label">จำนวนรายการ</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-calculator"></i></div><div><div class="stat-value" style="font-size:1.2rem">${formatMoney(data.summary.avgAmount||0)}</div><div class="stat-label">ยอดเฉลี่ย/รายการ</div></div></div>
      </div>
      <div class="two-col" style="margin-bottom:20px">
        <div>
          <div class="section-title"><i class="fas fa-credit-card"></i> ยอดตามวิธีชำระเงิน</div>
          ${data.byMethod.length === 0 ? '<div class="empty-state"><i class="fas fa-receipt"></i><p>ไม่มีข้อมูล</p></div>' :
          `<div class="table-wrap"><table>
            <thead><tr><th>วิธีชำระ</th><th>จำนวน</th><th>ยอดรวม</th></tr></thead>
            <tbody>${data.byMethod.map(m => `<tr><td><span class="badge badge-blue">${m.Method}</span></td><td>${m.count} รายการ</td><td class="fw-bold text-gold">${formatMoney(m.total)}</td></tr>`).join('')}</tbody>
          </table></div>`}
        </div>
        <div>
          <div class="section-title"><i class="fas fa-calendar-alt"></i> รายได้รายวัน</div>
          ${data.daily.length === 0 ? '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>ไม่มีข้อมูลในช่วงเวลานี้</p></div>' :
          `<div class="table-wrap" style="max-height:320px;overflow-y:auto"><table>
            <thead><tr><th>วันที่</th><th>รายได้</th><th>รายการ</th></tr></thead>
            <tbody>${data.daily.map(d => `<tr><td>${formatDate(d.date)}</td><td class="fw-bold text-gold">${formatMoney(d.revenue)}</td><td><span class="badge badge-gray">${d.transactions} รายการ</span></td></tr>`).join('')}</tbody>
          </table></div>`}
        </div>
      </div>
      ${data.daily.length > 0 ? `
      <div class="card" style="padding:20px;border:1px solid var(--border)">
        <div class="section-title" style="margin-top:0"><i class="fas fa-chart-bar"></i> กราฟแท่ง: รายได้รายวัน</div>
        <div style="position:relative;height:260px"><canvas id="chartBar"></canvas></div>
      </div>` : ''}
    `;
    if (data.daily.length > 0) {
      setTimeout(() => {
        const ctx = document.getElementById('chartBar');
        if (!ctx) return;
        if (_chartBar) _chartBar.destroy();
        _chartBar = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.daily.map(d => new Date(d.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })),
            datasets: [{ label: 'รายได้ (฿)', data: data.daily.map(d => Number(d.revenue)), backgroundColor: 'rgba(184,134,11,0.75)', borderColor: 'rgba(184,134,11,1)', borderWidth: 1, borderRadius: 5 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { font: { family: 'Sarabun', size: 11 }, maxRotation: 45 } },
              y: { beginAtZero: true, ticks: { font: { family: 'Sarabun' }, callback: v => v.toLocaleString('th-TH') + '฿' } }
            }
          }
        });
      }, 50);
    }
  } catch (err) {
    const el = document.getElementById('revenueReport');
    if (el) el.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function getHotelName() { return 'Hypnos Hotel PMS'; }

function buildPDFHTML(title, tableHTML, summaryHTML = '') {
  const now = new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>body{font-family:Arial,sans-serif;font-size:12px;color:#1A202C;margin:0;padding:24px}h1{font-size:18px;font-weight:700;border-bottom:2px solid #B8860B;padding-bottom:8px;margin-bottom:4px;color:#1C2233}.subtitle{font-size:10px;color:#64748B;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#F8FAFD;padding:8px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #DDE2EC}td{padding:8px 10px;border-bottom:1px solid #DDE2EC;font-size:11px}.summary{background:#FDF6E3;border:1px solid #DAA520;border-radius:6px;padding:12px;margin-bottom:16px;display:flex;gap:20px}.sum-item{flex:1;text-align:center}.sum-value{font-size:16px;font-weight:700;color:#B8860B}.sum-label{font-size:9px;color:#64748B;text-transform:uppercase}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #DDE2EC;font-size:9px;color:#94A3B8;text-align:right}</style>
  </head><body><h1>${title}</h1><div class="subtitle">พิมพ์เมื่อ: ${now} — ${getHotelName()}</div>${summaryHTML}${tableHTML}<div class="footer">${getHotelName()} • รายงานสร้างโดยระบบอัตโนมัติ</div></body></html>`;
}

function downloadAsPDF(htmlContent) {
  const w = window.open('', '_blank');
  if (!w) { showToast('กรุณาอนุญาต popup เพื่อดาวน์โหลด PDF', 'warning'); return; }
  w.document.write(htmlContent); w.document.close();
  w.onload = () => { setTimeout(() => { w.focus(); w.print(); }, 400); };
}

function downloadAsCSV(rows, headers, filename) {
  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('ดาวน์โหลด Excel (CSV) สำเร็จ', 'success');
}

function downloadOccupancyPDF() {
  if (!_occupancyData) { showToast('กรุณารอโหลดข้อมูลก่อน', 'warning'); return; }
  const d = _occupancyData;
  const t = `<table><thead><tr><th>ประเภทห้องพัก</th><th>ทั้งหมด</th><th>ว่าง</th><th>มีผู้พัก</th><th>จอง</th><th>อัตราเข้าพัก</th></tr></thead><tbody>${d.byType.map(t => `<tr><td>${t.TypeName}</td><td>${t.total}</td><td>${t.available}</td><td>${t.occupied}</td><td>${t.booked}</td><td>${t.occupancyRate}%</td></tr>`).join('')}</tbody></table><h3 style="margin-top:20px;font-size:13px">การจองรายเดือน</h3><table><thead><tr><th>เดือน</th><th>จำนวนการจอง</th><th>รายได้</th></tr></thead><tbody>${d.bookingsByMonth.map(m => `<tr><td>${m.month}</td><td>${m.bookings} ครั้ง</td><td>${m.revenue?m.revenue.toLocaleString()+' ฿':'-'}</td></tr>`).join('')}</tbody></table>`;
  downloadAsPDF(buildPDFHTML('รายงานภาพรวมอัตราการเข้าพัก', t));
}

function downloadOccupancyExcel() {
  if (!_occupancyData) { showToast('กรุณารอโหลดข้อมูลก่อน', 'warning'); return; }
  downloadAsCSV(_occupancyData.byType.map(t => [t.TypeName,t.total,t.available,t.occupied,t.booked,t.occupancyRate]), ['ประเภทห้องพัก','ทั้งหมด','ว่าง','มีผู้พัก','จอง','อัตราเข้าพัก (%)'], 'รายงานอัตราการเข้าพัก');
}

function downloadRevenuePDF() {
  if (!_revenueData) { showToast('กรุณารอโหลดข้อมูลก่อน', 'warning'); return; }
  const { data, from, to } = _revenueData;
  const s = `<div class="summary"><div class="sum-item"><div class="sum-value">${Number(data.summary.totalRevenue||0).toLocaleString()} ฿</div><div class="sum-label">รายได้รวม</div></div><div class="sum-item"><div class="sum-value">${data.summary.totalTransactions||0}</div><div class="sum-label">จำนวนรายการ</div></div><div class="sum-item"><div class="sum-value">${Number(data.summary.avgAmount||0).toLocaleString()} ฿</div><div class="sum-label">ยอดเฉลี่ย/รายการ</div></div></div>`;
  const t = `<h3 style="font-size:12px;margin-bottom:8px">ยอดตามวิธีชำระเงิน</h3><table><thead><tr><th>วิธีชำระเงิน</th><th>จำนวน</th><th>ยอดรวม</th></tr></thead><tbody>${data.byMethod.map(m=>`<tr><td>${m.Method}</td><td>${m.count}</td><td>${Number(m.total).toLocaleString()} ฿</td></tr>`).join('')}</tbody></table><h3 style="font-size:12px;margin:16px 0 8px">รายได้รายวัน</h3><table><thead><tr><th>วันที่</th><th>รายได้</th><th>รายการ</th></tr></thead><tbody>${data.daily.map(d=>`<tr><td>${new Date(d.date).toLocaleDateString('th-TH')}</td><td>${Number(d.revenue).toLocaleString()} ฿</td><td>${d.transactions}</td></tr>`).join('')}</tbody></table>`;
  downloadAsPDF(buildPDFHTML(`รายงานรายได้ (${from} ถึง ${to})`, t, s));
}

function downloadRevenueExcel() {
  if (!_revenueData) { showToast('กรุณารอโหลดข้อมูลก่อน', 'warning'); return; }
  const { data, from, to } = _revenueData;
  const rows = data.daily.map(d => [new Date(d.date).toLocaleDateString('th-TH'), d.revenue, d.transactions]);
  rows.push(['','',''],['สรุปรวม','',''],['รายได้รวม',data.summary.totalRevenue||0,''],['จำนวนรายการ',data.summary.totalTransactions||0,''],['ยอดเฉลี่ย/รายการ',data.summary.avgAmount||0,'']);
  downloadAsCSV(rows, ['วันที่','รายได้ (฿)','จำนวนรายการ'], `รายงานรายได้_${from}_ถึง_${to}`);
}

window.loadOccupancyReport = loadOccupancyReport;
window.loadRevenueReport = loadRevenueReport;
window.downloadOccupancyPDF = downloadOccupancyPDF;
window.downloadOccupancyExcel = downloadOccupancyExcel;
window.downloadRevenuePDF = downloadRevenuePDF;
window.downloadRevenueExcel = downloadRevenueExcel;
