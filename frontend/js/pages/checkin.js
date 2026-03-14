async function renderCheckin() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header"><h2><i class="fas fa-sign-in-alt text-gold"></i> เช็คอิน</h2></div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-search"></i> ค้นหาการจอง</div></div>
        <div class="form-group">
          <label>รหัสการจอง</label>
          <div style="display:flex;gap:9px">
            <input id="ciBookingId" placeholder="เช่น B001" style="flex:1">
            <button class="btn btn-primary" onclick="searchBookingForCI()"><i class="fas fa-search"></i> ค้นหา</button>
          </div>
        </div>
        <div id="ciBookingResult"></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-bed"></i> ผู้เข้าพักปัจจุบัน</div></div>
        <div id="currentGuests" class="loading"><i class="fas fa-spinner"></i></div>
      </div>
    </div>
  `;
  loadCurrentGuests();
}

async function loadCurrentGuests() {
  try {
    const { data } = await API.getCheckIns();
    const el = document.getElementById('currentGuests');
    if (!el) return;
    if (data.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-moon"></i><p>ไม่มีผู้เข้าพักตอนนี้</p></div>'; return; }
    el.innerHTML = data.map(ci => `
      <div class="checkin-card">
        <div class="checkin-info">
          <h4>${ci.FirstName} ${ci.LastName}</h4>
          <p><i class="fas fa-door-open"></i> ห้อง ${ci.RoomNumber} (${ci.TypeName})</p>
          <p><i class="fas fa-clock"></i> เช็คอิน: ${formatDatetime(ci.CheckInDateTime)}</p>
          <p><i class="fas fa-calendar"></i> กำหนดออก: ${formatDate(ci.CheckOutDate)}</p>
        </div>
        <span class="badge badge-orange">เข้าพักแล้ว</span>
      </div>`).join('');
  } catch (err) {}
}

async function searchBookingForCI() {
  const id = document.getElementById('ciBookingId').value.trim().toUpperCase();
  if (!id) return;
  try {
    const { data: b } = await API.getBooking(id);
    if (b.Status !== 'Confirmed') {
      document.getElementById('ciBookingResult').innerHTML = `<div class="alert alert-warning">การจองนี้มีสถานะ "${b.Status}" ไม่สามารถเช็คอินได้</div>`;
      return;
    }
    document.getElementById('ciBookingResult').innerHTML = `
      <div class="alert alert-info">
        <div class="fw-bold">${b.FirstName} ${b.LastName} (${b.Phone})</div>
        <div>เช็คอิน: ${formatDate(b.CheckInDate)} → เช็คเอาท์: ${formatDate(b.CheckOutDate)}</div>
        <div>ราคารวม: <strong class="text-gold">${formatMoney(b.TotalAmount)}</strong></div>
      </div>
      <div class="form-group">
        <label>เลือกห้องที่จะเข้าพัก</label>
        <select id="ciRoomSelect">
          ${b.details.map(d=>`<option value="${d.RoomID}">ห้อง ${d.RoomNumber} - ${d.TypeName}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-full" onclick="doCheckIn('${b.BookingID}')"><i class="fas fa-sign-in-alt"></i> ยืนยันเช็คอิน</button>
    `;
  } catch (err) {
    document.getElementById('ciBookingResult').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function doCheckIn(bookingId) {
  const roomId = document.getElementById('ciRoomSelect').value;
  try {
    await API.checkIn({ BookingID: bookingId, RoomID: roomId });
    showToast('เช็คอินสำเร็จ!');
    document.getElementById('ciBookingId').value = '';
    document.getElementById('ciBookingResult').innerHTML = '';
    loadCurrentGuests();
  } catch (err) { showToast(err.message, 'error'); }
}

window.searchBookingForCI = searchBookingForCI;
window.doCheckIn = doCheckIn;
window.loadCurrentGuests = loadCurrentGuests;
