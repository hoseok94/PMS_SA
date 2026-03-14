async function renderCheckout() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header"><h2><i class="fas fa-sign-out-alt text-gold"></i> เช็คเอาท์</h2></div>
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="fas fa-bed"></i> ผู้เข้าพักที่รอเช็คเอาท์</div></div>
      <div id="coGuestList" class="loading"><i class="fas fa-spinner"></i></div>
    </div>
  `;
  loadCheckoutGuests();
}

async function loadCheckoutGuests() {
  try {
    const { data } = await API.getCheckIns();
    const el = document.getElementById('coGuestList');
    if (!el) return;
    if (data.length === 0) {
      el.innerHTML = '<div class="empty-state"><i class="fas fa-moon"></i><p>ไม่มีผู้เข้าพักที่รอเช็คเอาท์</p></div>';
      return;
    }
    el.innerHTML = data.map(ci => {
      const nights = Math.ceil((new Date(ci.CheckOutDate) - new Date(ci.CheckInDateTime)) / 86400000) || 1;
      return `
      <div class="checkin-card">
        <div class="checkin-info">
          <h4><i class="fas fa-user"></i> ${ci.FirstName} ${ci.LastName}</h4>
          <p><i class="fas fa-door-open"></i> ห้อง ${ci.RoomNumber} (${ci.TypeName})</p>
          <p><i class="fas fa-sign-in-alt"></i> เช็คอิน: ${formatDatetime(ci.CheckInDateTime)}</p>
          <p><i class="fas fa-calendar-check"></i> กำหนดออก: ${formatDate(ci.CheckOutDate)}</p>
          <p><i class="fas fa-baht-sign"></i> ยอดรวม: <strong class="text-gold">${formatMoney(ci.TotalAmount)}</strong></p>
        </div>
        <div class="checkin-meta">
          <span class="badge badge-orange">เข้าพักแล้ว</span>
          <button class="btn btn-primary btn-sm" onclick="showCheckoutModal('${ci.CheckInID}','${ci.FirstName} ${ci.LastName}','${ci.RoomNumber}','${ci.BookingID}',${ci.TotalAmount})">
            <i class="fas fa-sign-out-alt"></i> เช็คเอาท์
          </button>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    document.getElementById('coGuestList').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function showCheckoutModal(checkInId, guestName, roomNo, bookingId, total) {
  openModal(`เช็คเอาท์ - ${guestName}`, `
    <div class="receipt">
      <div class="receipt-header">
        <h3>Hypnos Hotel</h3>
        <p class="text-muted" style="font-size:.82rem">ใบสรุปค่าใช้จ่าย</p>
      </div>
      <div class="receipt-row"><span>ลูกค้า</span><span class="fw-bold">${guestName}</span></div>
      <div class="receipt-row"><span>ห้อง</span><span class="fw-bold">${roomNo}</span></div>
      <div class="receipt-row"><span>รหัสการจอง</span><span class="fw-bold">${bookingId}</span></div>
      <div class="receipt-row"><span>รหัสเช็คอิน</span><span class="fw-bold">${checkInId}</span></div>
      <div class="receipt-total"><span>ยอดรวมทั้งหมด</span><span>${formatMoney(total)}</span></div>
    </div>
    <div class="alert alert-warning" style="margin-top:14px"><i class="fas fa-exclamation-triangle"></i> กรุณาตรวจสอบการชำระเงินก่อนทำการเช็คเอาท์</div>
    <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:14px">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-warning" onclick="navigateToPayment('${bookingId}')"><i class="fas fa-credit-card"></i> ชำระเงิน</button>
      <button class="btn btn-primary" onclick="doCheckout('${checkInId}')"><i class="fas fa-sign-out-alt"></i> ยืนยันเช็คเอาท์</button>
    </div>
  `);
}

function navigateToPayment(bookingId) {
  closeModal();
  window._pendingPaymentBookingId = bookingId;
  navigateTo('payment');
}

async function doCheckout(checkInId) {
  try {
    await API.checkOut({ CheckInID: checkInId });
    closeModal();
    showToast('เช็คเอาท์สำเร็จ! ขอบคุณที่ใช้บริการ');
    loadCheckoutGuests();
  } catch (err) { showToast(err.message, 'error'); }
}

window.loadCheckoutGuests = loadCheckoutGuests;
window.showCheckoutModal = showCheckoutModal;
window.navigateToPayment = navigateToPayment;
window.doCheckout = doCheckout;
