async function renderRooms() {
  try {
    const user = JSON.parse(localStorage.getItem('pms_user') || 'null');
    const perms = typeof getRolePermissions === 'function' ? getRolePermissions(user?.position) : { canEdit: false };
    const [{ data: rooms }, { data: types }] = await Promise.all([API.getRooms(), API.getRoomTypes()]);

    document.getElementById('pageContent').innerHTML = `
      <div class="page-header">
        <h2><i class="fas fa-door-open"></i> จัดการห้องพัก</h2>
        ${perms.canEdit ? `<button class="btn btn-primary" onclick="showAddRoomModal()"><i class="fas fa-plus"></i> เพิ่มห้องพัก</button>` : ''}
      </div>
      ${!perms.canEdit ? `<div class="permission-notice"><i class="fas fa-eye"></i> คุณมีสิทธิ์ดูข้อมูลห้องพักเท่านั้น ไม่สามารถแก้ไขได้</div>` : ''}
      <div class="room-legend">
        <div class="legend-item"><div class="legend-dot" style="background:#86EFAC"></div>ว่าง (${rooms.filter(r=>r.Status==='Available').length})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#93C5FD"></div>จองแล้ว (${rooms.filter(r=>r.Status==='Booked').length})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#B8860B"></div>เข้าพักแล้ว (${rooms.filter(r=>r.Status==='CheckedIn').length})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#FDE68A"></div>ทำความสะอาด (${rooms.filter(r=>r.Status==='Cleaning').length})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#FCA5A5"></div>ซ่อมบำรุง (${rooms.filter(r=>r.Status==='Maintenance').length})</div>
      </div>
      <div class="filter-bar">
        <select id="filterStatus" onchange="filterRooms()">
          <option value="">ทุกสถานะ</option>
          <option value="Available">ว่าง</option>
          <option value="Booked">จองแล้ว</option>
          <option value="CheckedIn">เข้าพักแล้ว</option>
          <option value="Cleaning">ทำความสะอาด</option>
          <option value="Maintenance">ซ่อมบำรุง</option>
        </select>
        <select id="filterType" onchange="filterRooms()">
          <option value="">ทุกประเภท</option>
          ${types.map(t=>`<option value="${t.RoomTypeID}">${t.TypeName}</option>`).join('')}
        </select>
      </div>
      <div id="roomGrid" class="room-grid"></div>
    `;
    window._allRooms = rooms;
    window._roomTypes = types;
    window._roomCanEdit = perms.canEdit;
    filterRooms();
  } catch (err) {
    document.getElementById('pageContent').innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function filterRooms() {
  const status = document.getElementById('filterStatus')?.value;
  const type   = document.getElementById('filterType')?.value;
  let rooms = window._allRooms || [];
  if (status) rooms = rooms.filter(r => r.Status === status);
  if (type)   rooms = rooms.filter(r => r.RoomTypeID === type);
  const grid = document.getElementById('roomGrid');
  if (!grid) return;
  if (rooms.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-door-closed"></i><p>ไม่พบห้องพัก</p></div>';
    return;
  }
  grid.innerHTML = rooms.map(r => `
    <div class="room-card ${r.Status.toLowerCase()}" onclick="${window._roomCanEdit ? `showRoomDetail('${r.RoomID}')` : `showRoomView('${r.RoomID}')`}" style="cursor:pointer">
      <div class="room-number">${r.RoomNumber}</div>
      <div class="room-type">${r.TypeName} • ชั้น ${r.Floor}</div>
      <div class="room-price">${formatMoney(r.BasePrice)}/คืน</div>
      <div class="room-status-label">${statusBadge(r.Status)}</div>
    </div>`).join('');
}

// View-only modal for Housekeeping/Maintenance
async function showRoomView(id) {
  const { data: r } = await API.get(`/rooms/${id}`);
  openModal(`ห้อง ${r.RoomNumber} — ${r.TypeName}`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">หมายเลขห้อง</div><div class="fw-bold">${r.RoomNumber}</div></div>
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">ประเภท</div><div class="fw-bold">${r.TypeName}</div></div>
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">ชั้น</div><div class="fw-bold">${r.Floor}</div></div>
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">สถานะ</div>${statusBadge(r.Status)}</div>
    </div>
    <div class="permission-notice"><i class="fas fa-lock"></i> คุณไม่มีสิทธิ์แก้ไขข้อมูลห้องพัก</div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px">
      <button class="btn btn-secondary" onclick="closeModal()">ปิด</button>
    </div>
  `);
}

async function showRoomDetail(id) {
  const { data: r } = await API.get(`/rooms/${id}`);
  openModal(`ห้อง ${r.RoomNumber} — ${r.TypeName}`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">หมายเลขห้อง</div><div class="fw-bold">${r.RoomNumber}</div></div>
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">ประเภท</div><div class="fw-bold">${r.TypeName}</div></div>
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">ชั้น</div><div class="fw-bold">${r.Floor}</div></div>
      <div><div class="text-muted" style="font-size:.78rem;margin-bottom:3px">ราคา/คืน</div><div class="fw-bold text-gold">${formatMoney(r.BasePrice)}</div></div>
    </div>
    <div class="form-group">
      <label>สถานะห้องพัก</label>
      <select id="editStatus">
        <option value="Available"   ${r.Status==='Available'   ?'selected':''}>ว่าง</option>
        <option value="Booked"      ${r.Status==='Booked'      ?'selected':''}>จองแล้ว</option>
        <option value="CheckedIn"   ${r.Status==='CheckedIn'   ?'selected':''}>เข้าพักแล้ว</option>
        <option value="Cleaning"    ${r.Status==='Cleaning'    ?'selected':''}>ทำความสะอาด</option>
        <option value="Maintenance" ${r.Status==='Maintenance' ?'selected':''}>ซ่อมบำรุง</option>
      </select>
    </div>
    <div style="display:flex;gap:9px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" onclick="saveRoomStatus('${r.RoomID}')"><i class="fas fa-save"></i> บันทึก</button>
    </div>
  `);
}

async function saveRoomStatus(id) {
  const status = document.getElementById('editStatus').value;
  try {
    await API.updateRoomStatus(id, status);
    closeModal(); showToast('อัปเดตสถานะห้องพักสำเร็จ'); renderRooms();
  } catch (err) { showToast(err.message, 'error'); }
}

function showAddRoomModal() {
  const types = window._roomTypes || [];
  openModal('เพิ่มห้องพัก', `
    <div class="form-group"><label>รหัสห้อง *</label><input id="nRoomID" placeholder="เช่น R105" maxlength="4"></div>
    <div class="form-row">
      <div class="form-group"><label>หมายเลขห้อง *</label><input id="nRoomNum" placeholder="เช่น 105"></div>
      <div class="form-group"><label>ชั้น *</label><input id="nFloor" type="number" min="1" value="1"></div>
    </div>
    <div class="form-group"><label>ประเภทห้อง *</label>
      <select id="nRoomType">${types.map(t=>`<option value="${t.RoomTypeID}">${t.TypeName} — ${formatMoney(t.BasePrice)}/คืน</option>`).join('')}</select>
    </div>
    <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" onclick="addRoom()"><i class="fas fa-plus"></i> เพิ่มห้องพัก</button>
    </div>
  `);
}

async function addRoom() {
  try {
    await API.createRoom({
      RoomID:     document.getElementById('nRoomID').value,
      RoomNumber: document.getElementById('nRoomNum').value,
      RoomTypeID: document.getElementById('nRoomType').value,
      Floor:      document.getElementById('nFloor').value,
    });
    closeModal(); showToast('เพิ่มห้องพักสำเร็จ'); renderRooms();
  } catch (err) { showToast(err.message, 'error'); }
}

window.showRoomDetail = showRoomDetail;
window.showRoomView   = showRoomView;
window.saveRoomStatus = saveRoomStatus;
window.showAddRoomModal = showAddRoomModal;
window.addRoom = addRoom;
window.filterRooms = filterRooms;
