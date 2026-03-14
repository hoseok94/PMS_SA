async function renderBookingList() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header"><h2><i class="fas fa-list-alt text-gold"></i> รายการจอง</h2>
      <button class="btn btn-primary" onclick="navigateTo('booking')"><i class="fas fa-plus"></i> จองใหม่</button>
    </div>
    <div class="card">
      <div class="filter-bar">
        <select id="blStatus" onchange="loadBookings()">
          <option value="">ทุกสถานะ</option>
          <option value="Confirmed">ยืนยัน</option>
          <option value="CheckedIn">เข้าพักแล้ว</option>
          <option value="CheckedOut">เช็คเอาท์แล้ว</option>
          <option value="Cancelled">ยกเลิก</option>
        </select>
        <input type="date" id="blDate" onchange="loadBookings()" placeholder="กรองตามวันที่">
      </div>
      <div id="blTable" class="loading"><i class="fas fa-spinner"></i></div>
    </div>`;
  await loadBookings();
}

async function loadBookings() {
  const status = document.getElementById('blStatus')?.value;
  const date = document.getElementById('blDate')?.value;
  const params = [status?'status='+status:'', date?'date='+date:''].filter(Boolean).join('&');
  try {
    const { data } = await API.getBookings(params);
    const el = document.getElementById('blTable');
    if (!el) return;
    if (data.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>ไม่พบรายการจอง</p></div>'; return; }
    el.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>รหัสจอง</th><th>ลูกค้า</th><th>ห้อง</th><th>เช็คอิน</th><th>เช็คเอาท์</th><th>ราคารวม</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
      <tbody>${data.map(b => `<tr>
        <td class="fw-bold text-gold">${b.BookingID}</td>
        <td><div class="fw-bold">${b.FirstName} ${b.LastName}</div><div class="text-muted" style="font-size:.78rem">${b.Phone}</div></td>
        <td>${b.Rooms||'-'}</td>
        <td>${formatDate(b.CheckInDate)}</td>
        <td>${formatDate(b.CheckOutDate)}</td>
        <td class="fw-bold">${formatMoney(b.TotalAmount)}</td>
        <td>${statusBadge(b.Status)}</td>
        <td>
          <div style="display:flex;gap:5px">
            <button class="btn btn-sm btn-info" onclick="viewBooking('${b.BookingID}')"><i class="fas fa-eye"></i></button>
            ${b.Status==='Confirmed'?`<button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.BookingID}')"><i class="fas fa-times"></i></button>`:''}
          </div>
        </td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch (err) { document.getElementById('blTable').innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function viewBooking(id) {
  const { data: b } = await API.getBooking(id);
  const nights = Math.ceil((new Date(b.CheckOutDate)-new Date(b.CheckInDate))/86400000);
  openModal(`รายละเอียดการจอง ${b.BookingID}`, `
    <div class="form-row" style="margin-bottom:14px">
      <div><div class="text-muted" style="font-size:.78rem">ลูกค้า</div><div class="fw-bold">${b.FirstName} ${b.LastName}</div><div class="text-muted" style="font-size:.78rem">${b.Phone}</div></div>
      <div><div class="text-muted" style="font-size:.78rem">สถานะ</div><div style="margin-top:4px">${statusBadge(b.Status)}</div></div>
      <div><div class="text-muted" style="font-size:.78rem">เช็คอิน</div><div class="fw-bold">${formatDate(b.CheckInDate)}</div></div>
      <div><div class="text-muted" style="font-size:.78rem">เช็คเอาท์</div><div class="fw-bold">${formatDate(b.CheckOutDate)}</div></div>
    </div>
    <div class="card-title" style="margin-bottom:10px"><i class="fas fa-door-open"></i> ห้องพักที่จอง</div>
    <div class="table-wrap"><table>
      <thead><tr><th>ห้อง</th><th>ประเภท</th><th>ราคา/คืน</th><th>รวม</th></tr></thead>
      <tbody>${b.details.map(d=>`<tr><td>${d.RoomNumber}</td><td>${d.TypeName}</td><td>${formatMoney(d.PricePerNight)}</td><td>${formatMoney(d.PricePerNight*nights)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div style="text-align:right;margin-top:12px;font-size:1.05rem;font-weight:700;color:var(--gold)">ราคารวม (${nights} คืน): ${formatMoney(b.TotalAmount)}</div>
    ${b.Notes?`<div class="alert alert-info" style="margin-top:12px">หมายเหตุ: ${b.Notes}</div>`:''}
  `, 'modal-lg');
}

async function cancelBooking(id) {
  if (!confirm(`ยืนยันยกเลิกการจอง ${id}?`)) return;
  try {
    await API.cancelBooking(id);
    showToast('ยกเลิกการจองสำเร็จ');
    loadBookings();
  } catch (err) { showToast(err.message, 'error'); }
}

window.loadBookings = loadBookings;
window.viewBooking = viewBooking;
window.cancelBooking = cancelBooking;
