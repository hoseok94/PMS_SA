async function renderDashboard() {
  try {
    const { data: d } = await API.getDashboard();
    const occupancyRate = d.roomStats.total > 0
      ? Math.round((d.roomStats.checkedIn / d.roomStats.total) * 100)
      : 0;
    document.getElementById('pageContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-door-open"></i></div><div><div class="stat-value">${d.roomStats.available||0}</div><div class="stat-label">ห้องว่าง</div></div></div>
        <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-bed"></i></div><div><div class="stat-value">${d.roomStats.checkedIn||0}</div><div class="stat-label">กำลังเข้าพัก</div></div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar-check"></i></div><div><div class="stat-value">${d.roomStats.booked||0}</div><div class="stat-label">จองแล้ว</div></div></div>
        <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-broom"></i></div><div><div class="stat-value">${d.roomStats.cleaning||0}</div><div class="stat-label">กำลังทำความสะอาด</div></div></div>
        <div class="stat-card"><div class="stat-icon red"><i class="fas fa-tools"></i></div><div><div class="stat-value">${d.roomStats.maintenance||0}</div><div class="stat-label">ซ่อมบำรุง</div></div></div>
        <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-percent"></i></div><div><div class="stat-value">${occupancyRate}%</div><div class="stat-label">อัตราการเข้าพัก</div></div></div>
      </div>

      <div class="two-col" style="gap:18px;margin-bottom:18px">
        <div class="card">
          <div class="card-header"><div class="card-title"><i class="fas fa-chart-line"></i> สรุปวันนี้</div></div>
          <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:12px">
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-sign-in-alt"></i></div><div><div class="stat-value">${d.todayCheckIn.count}</div><div class="stat-label">เช็คอินวันนี้</div></div></div>
            <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-sign-out-alt"></i></div><div><div class="stat-value">${d.todayCheckOut.count}</div><div class="stat-label">เช็คเอาท์วันนี้</div></div></div>
            <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-calendar-plus"></i></div><div><div class="stat-value">${d.todayBookings.count}</div><div class="stat-label">จองวันนี้</div></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-baht-sign"></i></div><div><div class="stat-value" style="font-size:1.1rem">${formatMoney(d.monthRevenue.revenue)}</div><div class="stat-label">รายได้เดือนนี้</div></div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title"><i class="fas fa-clock"></i> การจองล่าสุด</div><button class="btn btn-sm btn-outline" onclick="navigateTo('bookingList')">ดูทั้งหมด</button></div>
          ${d.recentBookings.length === 0 ? '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>ยังไม่มีการจอง</p></div>' :
          '<div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ลูกค้า</th><th>เช็คอิน</th><th>สถานะ</th></tr></thead><tbody>' +
          d.recentBookings.map(b => `<tr>
            <td class="fw-bold text-gold">${b.BookingID}</td>
            <td>${b.FirstName} ${b.LastName}</td>
            <td>${formatDate(b.CheckInDate)}</td>
            <td>${statusBadge(b.Status)}</td>
          </tr>`).join('') + '</tbody></table></div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-door-open"></i> ภาพรวมห้องพัก</div><button class="btn btn-sm btn-outline" onclick="navigateTo('rooms')">จัดการห้องพัก</button></div>
        <div class="room-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#86EFAC"></div>ว่าง</div>
          <div class="legend-item"><div class="legend-dot" style="background:#93C5FD"></div>จองแล้ว</div>
          <div class="legend-item"><div class="legend-dot" style="background:#B8860B"></div>เข้าพักแล้ว</div>
          <div class="legend-item"><div class="legend-dot" style="background:#FDE68A"></div>ทำความสะอาด</div>
          <div class="legend-item"><div class="legend-dot" style="background:#FCA5A5"></div>ซ่อมบำรุง</div>
        </div>
        <div id="dashRoomGrid" class="loading"><i class="fas fa-spinner"></i></div>
      </div>
    `;
    // Load room grid
    const { data: rooms } = await API.getRooms();
    document.getElementById('dashRoomGrid').innerHTML = `<div class="room-grid">${rooms.map(r => `
      <div class="room-card ${r.Status.toLowerCase().replace('checkedin','checkedin')}" onclick="navigateTo('rooms')">
        <div class="room-number">${r.RoomNumber}</div>
        <div class="room-type">${r.TypeName}</div>
        <div class="room-price">${formatMoney(r.BasePrice)}/คืน</div>
        <div class="room-status-label">${statusBadge(r.Status)}</div>
      </div>`).join('')}</div>`;
  } catch (err) {
    document.getElementById('pageContent').innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}
