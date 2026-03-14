async function renderBooking() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header"><h2><i class="fas fa-calendar-plus text-gold"></i> จองห้องพัก</h2></div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-user"></i> ข้อมูลลูกค้า</div></div>
        <div class="search-bar">
          <div class="search-input" style="flex:1"><i class="fas fa-search"></i><input id="cusSearch" placeholder="ค้นหาลูกค้า (ชื่อ/เบอร์โทร)" onkeyup="searchCus(this.value)"></div>
          <button class="btn btn-outline btn-sm" onclick="showNewCusForm()"><i class="fas fa-user-plus"></i> ลูกค้าใหม่</button>
        </div>
        <div id="cusResults"></div>
        <div id="selectedCus" style="display:none" class="alert alert-success">
          <i class="fas fa-check-circle"></i> เลือกลูกค้า: <strong id="selectedCusName"></strong>
          <button onclick="clearCus()" style="float:right;background:none;border:none;cursor:pointer;color:var(--success)"><i class="fas fa-times"></i></button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-calendar"></i> วันที่เข้าพัก</div></div>
        <div class="form-group">
          <label><i class="fas fa-calendar-plus"></i> วันเช็คอิน</label>
          <input type="date" id="checkInDate" min="${new Date().toISOString().split('T')[0]}" onchange="searchAvailRooms()">
        </div>
        <div class="form-group">
          <label><i class="fas fa-calendar-minus"></i> วันเช็คเอาท์</label>
          <input type="date" id="checkOutDate" onchange="searchAvailRooms()">
        </div>
        <div id="nightsInfo" class="text-muted" style="font-size:.85rem;margin-top:-8px;margin-bottom:12px"></div>
        <div class="form-group">
          <label>หมายเหตุ</label>
          <textarea id="bookingNotes" rows="2" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"></textarea>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header"><div class="card-title"><i class="fas fa-door-open"></i> เลือกห้องพัก</div><span id="selectedRoomsCount" class="badge badge-blue">เลือกแล้ว: 0 ห้อง</span></div>
      <div id="availableRooms"><div class="empty-state"><i class="fas fa-search"></i><p>กรอกวันเช็คอิน-เช็คเอาท์เพื่อดูห้องว่าง</p></div></div>
    </div>

    <div class="card" id="summaryCard" style="margin-top:16px;display:none">
      <div class="card-header"><div class="card-title"><i class="fas fa-receipt"></i> สรุปการจอง</div></div>
      <div id="summaryContent"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-primary" onclick="confirmBooking()"><i class="fas fa-check"></i> ยืนยันการจอง</button>
      </div>
    </div>
  `;
  window._selectedCusId = null;
  window._selectedRooms = new Set();
}

async function searchCus(q) {
  if (q.length < 2) { document.getElementById('cusResults').innerHTML = ''; return; }
  try {
    const { data } = await API.getCustomers(q);
    document.getElementById('cusResults').innerHTML = data.length === 0
      ? '<div class="text-muted" style="font-size:.85rem;padding:8px">ไม่พบลูกค้า</div>'
      : `<div style="border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:12px">${
        data.map(c => `<div onclick="selectCus('${c.CustomerID}','${c.FirstName} ${c.LastName}','${c.Phone}')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background='#F7F8FC'" onmouseout="this.style.background=''">
          <div class="fw-bold">${c.FirstName} ${c.LastName}</div>
          <div class="text-muted" style="font-size:.8rem">${c.Phone} • ${c.CustomerID}</div>
        </div>`).join('')}</div>`;
  } catch (e) {}
}

function selectCus(id, name, phone) {
  window._selectedCusId = id;
  document.getElementById('cusResults').innerHTML = '';
  document.getElementById('cusSearch').value = '';
  document.getElementById('selectedCusName').textContent = `${name} (${phone})`;
  document.getElementById('selectedCus').style.display = 'block';
  updateSummary();
}

function clearCus() {
  window._selectedCusId = null;
  document.getElementById('selectedCus').style.display = 'none';
  updateSummary();
}

async function searchAvailRooms() {
  const ci = document.getElementById('checkInDate').value;
  const co = document.getElementById('checkOutDate').value;
  if (!ci || !co || ci >= co) {
    document.getElementById('nightsInfo').textContent = co && ci >= co ? '⚠️ วันเช็คเอาท์ต้องหลังวันเช็คอิน' : '';
    return;
  }
  const nights = Math.ceil((new Date(co) - new Date(ci)) / 86400000);
  document.getElementById('nightsInfo').textContent = `จำนวน ${nights} คืน`;
  document.getElementById('availableRooms').innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> กำลังโหลด...</div>';
  window._selectedRooms = new Set();
  try {
    const { data: rooms } = await API.getAvailableRooms(ci, co);
    if (rooms.length === 0) {
      document.getElementById('availableRooms').innerHTML = '<div class="empty-state"><i class="fas fa-bed"></i><p>ไม่มีห้องว่างในช่วงเวลานี้</p></div>';
      return;
    }
    document.getElementById('availableRooms').innerHTML = `<div class="room-grid">${rooms.map(r => `
      <div class="room-card available" id="rc_${r.RoomID}" onclick="toggleRoom('${r.RoomID}','${r.BasePrice}')">
        <div class="room-number">${r.RoomNumber}</div>
        <div class="room-type">${r.TypeName} • ชั้น ${r.Floor}</div>
        <div class="room-price">${formatMoney(r.BasePrice)}/คืน</div>
        <div class="room-status-label" style="margin-top:6px"><span class="badge badge-green">ว่าง</span></div>
      </div>`).join('')}</div>`;
  } catch (err) { document.getElementById('availableRooms').innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function toggleRoom(id, price) {
  const el = document.getElementById(`rc_${id}`);
  if (window._selectedRooms.has(id)) {
    window._selectedRooms.delete(id);
    el.style.border = ''; el.style.background = '';
    el.querySelector('.room-status-label').innerHTML = '<span class="badge badge-green">ว่าง</span>';
  } else {
    window._selectedRooms.add(id);
    el.style.border = '2px solid var(--gold)'; el.style.background = 'rgba(201,169,110,.1)';
    el.querySelector('.room-status-label').innerHTML = '<span class="badge badge-yellow">เลือกแล้ว ✓</span>';
  }
  document.getElementById('selectedRoomsCount').textContent = `เลือกแล้ว: ${window._selectedRooms.size} ห้อง`;
  updateSummary();
}

function updateSummary() {
  const ci = document.getElementById('checkInDate')?.value;
  const co = document.getElementById('checkOutDate')?.value;
  const card = document.getElementById('summaryCard');
  if (!card) return;
  if (!window._selectedCusId || window._selectedRooms.size === 0 || !ci || !co) { card.style.display = 'none'; return; }
  const nights = Math.ceil((new Date(co) - new Date(ci)) / 86400000);
  card.style.display = 'block';
  document.getElementById('summaryContent').innerHTML = `
    <div class="form-row">
      <div><div class="text-muted" style="font-size:.8rem">ลูกค้า</div><div class="fw-bold">${document.getElementById('selectedCusName').textContent}</div></div>
      <div><div class="text-muted" style="font-size:.8rem">วันเช็คอิน</div><div class="fw-bold">${formatDate(ci)}</div></div>
      <div><div class="text-muted" style="font-size:.8rem">วันเช็คเอาท์</div><div class="fw-bold">${formatDate(co)}</div></div>
      <div><div class="text-muted" style="font-size:.8rem">จำนวนคืน</div><div class="fw-bold">${nights} คืน</div></div>
    </div>`;
}

async function confirmBooking() {
  const ci = document.getElementById('checkInDate').value;
  const co = document.getElementById('checkOutDate').value;
  const notes = document.getElementById('bookingNotes').value;
  if (!window._selectedCusId) { showToast('กรุณาเลือกลูกค้า','warning'); return; }
  if (window._selectedRooms.size === 0) { showToast('กรุณาเลือกห้องพัก','warning'); return; }
  try {
    const { data } = await API.createBooking({ CustomerID: window._selectedCusId, CheckInDate: ci, CheckOutDate: co, RoomIDs: [...window._selectedRooms], Notes: notes });
    showToast(`จองสำเร็จ! รหัสการจอง: ${data.BookingID}`);
    navigateTo('bookingList');
  } catch (err) { showToast(err.message, 'error'); }
}

function showNewCusForm() {
  openModal('เพิ่มลูกค้าใหม่', `
    <div class="form-row">
      <div class="form-group"><label>ชื่อ *</label><input id="nFirst" placeholder="ชื่อ"></div>
      <div class="form-group"><label>นามสกุล *</label><input id="nLast" placeholder="นามสกุล"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>เบอร์โทร *</label><input id="nPhone" placeholder="0812345678"></div>
      <div class="form-group"><label>อีเมล</label><input id="nEmail" type="email" placeholder="email@example.com"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>เลขบัตรประชาชน/Passport</label><input id="nID" placeholder="หมายเลขบัตร"></div>
      <div class="form-group"><label>สัญชาติ</label><input id="nNat" value="Thai"></div>
    </div>
    <div style="display:flex;gap:9px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" onclick="saveNewCus()"><i class="fas fa-save"></i> บันทึก</button>
    </div>
  `);
}

async function saveNewCus() {
  const first = document.getElementById('nFirst').value.trim();
  const last = document.getElementById('nLast').value.trim();
  const phone = document.getElementById('nPhone').value.trim();
  if (!first || !last || !phone) { showToast('กรุณากรอกชื่อ นามสกุล และเบอร์โทร', 'warning'); return; }
  try {
    const { data } = await API.createCustomer({ FirstName:first, LastName:last, Phone:phone, Email:document.getElementById('nEmail').value, IDCard:document.getElementById('nID').value, Nationality:document.getElementById('nNat').value||'Thai' });
    closeModal();
    showToast('เพิ่มลูกค้าสำเร็จ');
    selectCus(data.CustomerID, `${first} ${last}`, phone);
  } catch (err) { showToast(err.message,'error'); }
}

window.searchCus = searchCus;
window.selectCus = selectCus;
window.clearCus = clearCus;
window.searchAvailRooms = searchAvailRooms;
window.toggleRoom = toggleRoom;
window.confirmBooking = confirmBooking;
window.showNewCusForm = showNewCusForm;
window.saveNewCus = saveNewCus;
window.updateSummary = updateSummary;
