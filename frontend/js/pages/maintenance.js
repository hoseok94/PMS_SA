// ====== MAINTENANCE PAGE ======

async function renderMaintenance() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-tools text-gold"></i> งานซ่อมบำรุง</h2>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="loadMaintenanceData()"><i class="fas fa-sync-alt"></i> รีเฟรช</button>
        <button class="btn btn-primary" onclick="showAddWorkOrderModal()"><i class="fas fa-plus"></i> แจ้งซ่อมใหม่</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444"><i class="fas fa-fire"></i></div>
        <div class="stat-body"><div class="stat-number" id="mtCountHigh">-</div><div class="stat-label">เร่งด่วนสูง</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-spinner"></i></div>
        <div class="stat-body"><div class="stat-number" id="mtCountInProgress">-</div><div class="stat-label">กำลังดำเนินการ</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981"><i class="fas fa-check-double"></i></div>
        <div class="stat-body"><div class="stat-number" id="mtCountDone">-</div><div class="stat-label">เสร็จแล้ววันนี้</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444"><i class="fas fa-door-closed"></i></div>
        <div class="stat-body"><div class="stat-number" id="mtCountClosed">-</div><div class="stat-label">ห้องปิดซ่อมอยู่</div></div>
      </div>
    </div>

    <!-- Work orders card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-clipboard-list"></i> ใบแจ้งซ่อม</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm mt-tab active" data-tab="open" onclick="switchMtTab('open',this)"><i class="fas fa-inbox"></i> รอรับงาน</button>
          <button class="btn btn-sm mt-tab" data-tab="inprogress" onclick="switchMtTab('inprogress',this)"><i class="fas fa-spinner"></i> กำลังซ่อม</button>
          <button class="btn btn-sm mt-tab" data-tab="done" onclick="switchMtTab('done',this)"><i class="fas fa-check"></i> เสร็จแล้ว</button>
          <button class="btn btn-sm mt-tab" data-tab="all" onclick="switchMtTab('all',this)"><i class="fas fa-list"></i> ทั้งหมด</button>
        </div>
      </div>
      <!-- Priority filter -->
      <div style="padding:12px 20px 0;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid var(--border-color)">
        <button class="btn btn-sm mt-pfilter active" data-p="all" onclick="switchMtPriority('all',this)">ทุกระดับ</button>
        <button class="btn btn-sm mt-pfilter" data-p="high" onclick="switchMtPriority('high',this)">🔴 เร่งด่วน</button>
        <button class="btn btn-sm mt-pfilter" data-p="medium" onclick="switchMtPriority('medium',this)">🟡 ปานกลาง</button>
        <button class="btn btn-sm mt-pfilter" data-p="low" onclick="switchMtPriority('low',this)">⚪ ต่ำ</button>
      </div>
      <div id="mtWorkOrders" style="padding:4px 0" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
    </div>

    <!-- Closed rooms -->
    <div class="card" style="margin-top:20px">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-door-closed"></i> ห้องที่ปิดซ่อมบำรุงอยู่</div>
      </div>
      <div id="mtClosedRooms" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
    </div>

    <!-- History (done last 7 days) -->
    <div class="card" style="margin-top:20px">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-history"></i> ประวัติการซ่อม (7 วันล่าสุด)</div>
      </div>
      <div id="mtHistory"></div>
    </div>
  `;
  loadMaintenanceData();
}

if (!window._workOrders) {
  window._workOrders = [
    { id:'WO001', roomNumber:'104', roomId:'R104', issue:'แอร์ไม่เย็น', priority:'high', status:'open', createdAt:new Date(Date.now()-86400000*2).toISOString(), note:'' },
    { id:'WO002', roomNumber:'202', roomId:'R202', issue:'ก๊อกน้ำรั่ว', priority:'medium', status:'inprogress', createdAt:new Date(Date.now()-86400000).toISOString(), note:'รอช่างประปา', assignedTo:'ช่างสมชาย', eta:'16:00' },
    { id:'WO003', roomNumber:'301', roomId:'R301', issue:'ประตูล็อคไม่ติด', priority:'high', status:'open', createdAt:new Date(Date.now()-3600000*3).toISOString(), note:'' },
    { id:'WO004', roomNumber:'105', roomId:'R105', issue:'หลอดไฟห้องน้ำดับ', priority:'low', status:'done', createdAt:new Date(Date.now()-86400000*3).toISOString(), note:'เปลี่ยนหลอดใหม่แล้ว', updatedAt:new Date(Date.now()-86400000*2).toISOString() },
  ];
}

let _mtCurrentTab = 'open';
let _mtCurrentPriority = 'all';

async function loadMaintenanceData() {
  try {
    const roomsRes = await API.getRooms();
    const rooms = roomsRes.data || [];
    window._mtRooms = rooms;
    const today = new Date().toDateString();
    const orders = window._workOrders;

    document.getElementById('mtCountHigh').textContent = orders.filter(o => o.priority === 'high' && o.status !== 'done').length;
    document.getElementById('mtCountInProgress').textContent = orders.filter(o => o.status === 'inprogress').length;
    document.getElementById('mtCountDone').textContent = orders.filter(o => o.status === 'done' && new Date(o.updatedAt||o.createdAt).toDateString() === today).length;
    document.getElementById('mtCountClosed').textContent = rooms.filter(r => r.Status === 'Maintenance').length;

    renderMtTab(_mtCurrentTab);
    renderMtClosedRooms(rooms);
    renderMtHistory();
  } catch (err) {
    showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

function switchMtTab(tab, btn) {
  _mtCurrentTab = tab;
  document.querySelectorAll('.mt-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMtTab(tab);
}

function switchMtPriority(p, btn) {
  _mtCurrentPriority = p;
  document.querySelectorAll('.mt-pfilter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMtTab(_mtCurrentTab);
}

function renderMtTab(tab) {
  const el = document.getElementById('mtWorkOrders');
  if (!el) return;
  let orders = tab === 'all' ? window._workOrders : window._workOrders.filter(o => o.status === tab);
  if (_mtCurrentPriority !== 'all') orders = orders.filter(o => o.priority === _mtCurrentPriority);

  const emptyMsgs = { open:'ไม่มีใบแจ้งซ่อมที่รอ', inprogress:'ไม่มีงานที่กำลังดำเนินการ', done:'ยังไม่มีงานที่เสร็จ', all:'ไม่มีใบแจ้งซ่อม' };
  if (orders.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle" style="color:#10b981"></i><p>' + (emptyMsgs[tab]||'') + '</p></div>'; return; }

  const sorted = [...orders].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (b.status === 'done' && a.status !== 'done') return -1;
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  el.innerHTML = '<div style="display:grid;gap:10px;padding:12px 20px">' + sorted.map(renderWorkOrderCard).join('') + '</div>';
}

function renderWorkOrderCard(order) {
  const pMap = {
    high:   { label:'เร่งด่วน', cls:'badge-red',    icon:'fa-fire' },
    medium: { label:'ปานกลาง', cls:'badge-orange',  icon:'fa-wrench' },
    low:    { label:'ต่ำ',      cls:'badge-gray',    icon:'fa-info-circle' }
  };
  const statusMap = {
    open:       { label:'รอรับงาน', cls:'badge-gray' },
    inprogress: { label:'กำลังซ่อม', cls:'badge-yellow' },
    done:       { label:'เสร็จแล้ว', cls:'badge-green' }
  };
  const p = pMap[order.priority] || pMap.low;
  const s = statusMap[order.status] || statusMap.open;
  const age = Math.round((Date.now() - new Date(order.createdAt)) / 3600000);
  const ageStr = age < 1 ? 'เพิ่งแจ้ง' : age < 24 ? age + ' ชม.ที่แล้ว' : Math.floor(age/24) + ' วันที่แล้ว';

  let actions = '';
  if (order.status === 'open') {
    actions = '<button class="btn btn-primary btn-sm" onclick="showAcceptModal(\'' + order.id + '\')">' +
              '<i class="fas fa-play"></i> รับงาน</button>';
  } else if (order.status === 'inprogress') {
    actions = '<button class="btn btn-primary btn-sm" onclick="showCompleteModal(\'' + order.id + '\')">' +
              '<i class="fas fa-check"></i> ซ่อมเสร็จ</button>';
  } else {
    actions = '<button class="btn btn-outline btn-sm" disabled><i class="fas fa-check-circle"></i> เสร็จแล้ว</button>';
  }

  const etaHtml = order.eta ? '<span style="font-size:12px;color:var(--text-muted)"><i class="fas fa-clock"></i> ETA ' + order.eta + '</span>' : '';
  const assignedHtml = order.assignedTo ? '<span style="font-size:12px;color:var(--text-muted)"><i class="fas fa-user-hard-hat"></i> ' + order.assignedTo + '</span>' : '';

  return '<div class="mt-order-card ' + (order.priority === 'high' && order.status !== 'done' ? 'mt-urgent' : '') + '">' +
    '<div class="mt-order-left">' +
      '<div class="mt-room-badge">ห้อง ' + order.roomNumber + '</div>' +
      '<div class="mt-order-age">' + ageStr + '</div>' +
    '</div>' +
    '<div class="mt-order-body">' +
      '<div class="mt-order-issue">' + order.issue + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">' + assignedHtml + etaHtml + '</div>' +
      (order.note ? '<div class="mt-order-note"><i class="fas fa-sticky-note"></i> ' + order.note + '</div>' : '') +
    '</div>' +
    '<div class="mt-order-right">' +
      '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' +
        '<span class="badge ' + p.cls + '"><i class="fas ' + p.icon + '"></i> ' + p.label + '</span>' +
        '<span class="badge ' + s.cls + '">' + s.label + '</span>' +
      '</div>' +
      '<div style="margin-top:10px">' + actions + '</div>' +
    '</div>' +
  '</div>';
}

function renderMtClosedRooms(rooms) {
  const el = document.getElementById('mtClosedRooms');
  if (!el) return;
  const closed = rooms.filter(r => r.Status === 'Maintenance');
  if (closed.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-door-open"></i><p>ไม่มีห้องปิดซ่อมอยู่</p></div>'; return; }
  el.innerHTML = '<div style="display:grid;gap:10px;padding:16px 20px">' +
    closed.map(r =>
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:8px;background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.2)">' +
        '<div><strong>ห้อง ' + r.RoomNumber + '</strong><span style="margin-left:8px;font-size:13px;color:var(--text-muted)">' + (r.TypeName||r.RoomTypeID) + ' · ชั้น ' + r.Floor + '</span></div>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<span class="badge badge-red"><i class="fas fa-tools"></i> ปิดซ่อมบำรุง</span>' +
          '<button class="btn btn-primary btn-sm" onclick="reopenRoom(\'' + r.RoomID + '\',\'' + r.RoomNumber + '\')">' +
            '<i class="fas fa-door-open"></i> เปิดห้องคืน</button>' +
        '</div>' +
      '</div>'
    ).join('') + '</div>';
}

function renderMtHistory() {
  const el = document.getElementById('mtHistory');
  if (!el) return;
  const cutoff = Date.now() - 7 * 86400000;
  const history = window._workOrders
    .filter(o => o.status === 'done' && new Date(o.updatedAt || o.createdAt) >= cutoff)
    .sort((a, b) => new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt));

  if (history.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>ยังไม่มีประวัติ</p></div>'; return; }

  el.innerHTML = '<div style="overflow-x:auto"><table class="data-table"><thead><tr>' +
    '<th>รหัส</th><th>ห้อง</th><th>ปัญหา</th><th>เสร็จเมื่อ</th><th>หมายเหตุ</th>' +
    '</tr></thead><tbody>' +
    history.map(o =>
      '<tr>' +
        '<td style="font-family:monospace;font-size:12px;color:var(--text-muted)">' + o.id + '</td>' +
        '<td><strong>ห้อง ' + o.roomNumber + '</strong></td>' +
        '<td>' + o.issue + '</td>' +
        '<td style="font-size:13px;color:var(--text-muted)">' + (o.updatedAt ? formatDatetime(o.updatedAt) : '-') + '</td>' +
        '<td style="font-size:13px;color:var(--text-muted)">' + (o.note || '-') + '</td>' +
      '</tr>'
    ).join('') +
    '</tbody></table></div>';
}

function showAddWorkOrderModal() {
  const rooms = (window._mtRooms || []).filter(r => r.Status !== 'CheckedIn');
  openModal('แจ้งซ่อมใหม่',
    '<div class="form-group"><label>ห้องพัก</label><select id="woRoom">' +
    '<option value="">-- เลือกห้อง --</option>' +
    rooms.map(r => '<option value="' + r.RoomID + '|' + r.RoomNumber + '">ห้อง ' + r.RoomNumber + ' (' + (r.TypeName||r.RoomTypeID) + ')</option>').join('') +
    '</select></div>' +
    '<div class="form-group"><label>รายละเอียดปัญหา</label><textarea id="woIssue" rows="3" placeholder="อธิบายปัญหาที่พบ..."></textarea></div>' +
    '<div class="form-group"><label>ระดับความเร่งด่วน</label><select id="woPriority">' +
    '<option value="high">🔴 เร่งด่วน — ต้องแก้ทันที</option>' +
    '<option value="medium" selected>🟡 ปานกลาง — แก้ภายในวันนี้</option>' +
    '<option value="low">⚪ ต่ำ — แก้ได้ตามสะดวก</option></select></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
    '<button class="btn btn-outline" onclick="closeModal()">ยกเลิก</button>' +
    '<button class="btn btn-primary" onclick="submitWorkOrder()"><i class="fas fa-plus"></i> บันทึก</button></div>');
}

function showAcceptModal(id) {
  const order = window._workOrders.find(o => o.id === id);
  if (!order) return;
  openModal('รับงาน: ห้อง ' + order.roomNumber,
    '<p style="margin-bottom:16px"><strong>' + order.issue + '</strong></p>' +
    '<div class="form-group"><label>ช่างผู้รับผิดชอบ</label>' +
    '<input type="text" id="woAssigned" placeholder="ชื่อช่าง..."></div>' +
    '<div class="form-group"><label>เวลาที่คาดว่าจะเสร็จ (ETA)</label>' +
    '<input type="time" id="woEta"></div>' +
    '<div class="form-group"><label>' +
    '<input type="checkbox" id="woCloseRoom"> ปิดห้องซ่อมบำรุง (เปลี่ยนสถานะเป็น Maintenance)</label></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
    '<button class="btn btn-outline" onclick="closeModal()">ยกเลิก</button>' +
    '<button class="btn btn-primary" onclick="confirmAccept(\'' + id + '\')"><i class="fas fa-play"></i> รับงาน</button></div>');
}

async function confirmAccept(id) {
  const order = window._workOrders.find(o => o.id === id);
  if (!order) return;
  const assigned = document.getElementById('woAssigned')?.value.trim();
  const eta = document.getElementById('woEta')?.value;
  const closeRoom = document.getElementById('woCloseRoom')?.checked;

  order.status = 'inprogress';
  order.assignedTo = assigned || 'ช่างซ่อมบำรุง';
  order.eta = eta || '';
  order.updatedAt = new Date().toISOString();

  if (closeRoom && order.roomId) {
    try {
      await API.updateRoomStatus(order.roomId, 'Maintenance');
      showToast('รับงานแล้ว — ห้อง ' + order.roomNumber + ' ปิดซ่อมบำรุง', 'success');
    } catch {
      showToast('รับงานแล้ว (อัพเดตสถานะห้องไม่สำเร็จ)', 'warning');
    }
  } else {
    showToast('รับงานแล้ว', 'success');
  }
  closeModal();
  loadMaintenanceData();
}

function submitWorkOrder() {
  const roomVal = document.getElementById('woRoom').value;
  const issue = document.getElementById('woIssue').value.trim();
  const priority = document.getElementById('woPriority').value;
  if (!roomVal || !issue) { showToast('กรุณากรอกข้อมูลให้ครบ', 'warning'); return; }
  const [roomId, roomNumber] = roomVal.split('|');
  const newId = 'WO' + String(window._workOrders.length + 1).padStart(3, '0');
  window._workOrders.push({ id:newId, roomId, roomNumber, issue, priority, status:'open', createdAt:new Date().toISOString(), note:'' });
  if (priority === 'high') {
    closeModal();
    if (confirm('ปัญหาเร่งด่วน — ต้องการปิดห้อง ' + roomNumber + ' ทันทีหรือไม่?')) {
      API.updateRoomStatus(roomId, 'Maintenance').then(() => {
        showToast('ห้อง ' + roomNumber + ' ปิดซ่อมบำรุงแล้ว', 'info');
        loadMaintenanceData();
      });
      return;
    }
  }
  closeModal();
  showToast('บันทึกใบแจ้งซ่อม ' + newId + ' แล้ว', 'success');
  loadMaintenanceData();
}

function showCompleteModal(id) {
  const order = window._workOrders.find(o => o.id === id);
  if (!order) return;
  openModal('ซ่อมเสร็จแล้ว',
    '<p>ยืนยันว่าซ่อม "<strong>' + order.issue + '</strong>" ห้อง <strong>' + order.roomNumber + '</strong> เสร็จแล้ว?</p>' +
    '<div class="form-group" style="margin-top:12px"><label>หมายเหตุ</label>' +
    '<input type="text" id="completNote" placeholder="เช่น เปลี่ยนอะไหล่ใหม่แล้ว..."></div>' +
    '<div class="form-group"><label>' +
    '<input type="checkbox" id="reopenAfterDone" checked> เปิดห้องให้พร้อมใช้งาน (Available)</label></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
    '<button class="btn btn-outline" onclick="closeModal()">ยกเลิก</button>' +
    '<button class="btn btn-primary" onclick="confirmComplete(\'' + id + '\')"><i class="fas fa-check"></i> ยืนยัน</button></div>');
}

async function confirmComplete(id) {
  const order = window._workOrders.find(o => o.id === id);
  if (!order) return;
  const note = document.getElementById('completNote')?.value || '';
  const reopen = document.getElementById('reopenAfterDone')?.checked;
  order.status = 'done';
  order.note = note;
  order.updatedAt = new Date().toISOString();
  if (reopen) {
    try {
      await API.updateRoomStatus(order.roomId, 'Available');
      showToast('ซ่อมเสร็จ — ห้อง ' + order.roomNumber + ' พร้อมเข้าพักแล้ว ✓', 'success');
    } catch {
      showToast('ซ่อมเสร็จแล้ว (อัพเดตสถานะห้องไม่สำเร็จ)', 'warning');
    }
  } else {
    showToast('บันทึกว่าซ่อมเสร็จแล้ว', 'success');
  }
  closeModal();
  loadMaintenanceData();
}

async function reopenRoom(roomId, roomNumber) {
  if (!confirm('เปิดห้อง ' + roomNumber + ' ให้พร้อมใช้งาน?')) return;
  try {
    await API.updateRoomStatus(roomId, 'Available');
    showToast('ห้อง ' + roomNumber + ' พร้อมเข้าพักแล้ว', 'success');
    loadMaintenanceData();
  } catch {
    showToast('อัพเดตสถานะไม่สำเร็จ', 'error');
  }
}
