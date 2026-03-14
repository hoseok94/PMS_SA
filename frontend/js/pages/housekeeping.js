// ====== HOUSEKEEPING PAGE ======

async function renderHousekeeping() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-broom text-gold"></i> งานแม่บ้าน</h2>
      <div style="display:flex;gap:10px;align-items:center">
        <span id="hkLastUpdate" style="font-size:13px;color:var(--text-muted)"></span>
        <button class="btn btn-outline btn-sm" onclick="loadHousekeepingData()">
          <i class="fas fa-sync-alt"></i> รีเฟรช
        </button>
      </div>
    </div>

    <!-- Daily progress bar -->
    <div class="card" style="margin-bottom:20px;padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-weight:500;font-size:14px"><i class="fas fa-chart-bar text-gold"></i> ความคืบหน้าวันนี้</span>
        <span id="hkProgressLabel" style="font-size:13px;color:var(--text-muted)">-</span>
      </div>
      <div style="height:10px;background:var(--border-color);border-radius:5px;overflow:hidden">
        <div id="hkProgressBar" style="height:100%;width:0%;background:#10b981;border-radius:5px;transition:width .6s ease"></div>
      </div>
      <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap" id="hkProgressLegend"></div>
    </div>

    <!-- Summary stats -->
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444"><i class="fas fa-bolt"></i></div>
        <div class="stat-body"><div class="stat-number" id="hkCountUrgent">-</div><div class="stat-label">ด่วน (Check-in รอ)</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-broom"></i></div>
        <div class="stat-body"><div class="stat-number" id="hkCountNormal">-</div><div class="stat-label">รอทำความสะอาด</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981"><i class="fas fa-check-circle"></i></div>
        <div class="stat-body"><div class="stat-number" id="hkCountReady">-</div><div class="stat-label">เสร็จแล้ว / ว่าง</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1"><i class="fas fa-moon"></i></div>
        <div class="stat-body"><div class="stat-number" id="hkCountOccupied">-</div><div class="stat-label">มีผู้เข้าพักอยู่</div></div>
      </div>
    </div>

    <!-- Task queue -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-tasks"></i> คิวงานวันนี้</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm hk-tab active" data-tab="urgent" onclick="switchHkTab('urgent',this)"><i class="fas fa-bolt"></i> ด่วน</button>
          <button class="btn btn-sm hk-tab" data-tab="cleaning" onclick="switchHkTab('cleaning',this)"><i class="fas fa-broom"></i> รอทำ</button>
          <button class="btn btn-sm hk-tab" data-tab="occupied" onclick="switchHkTab('occupied',this)"><i class="fas fa-user"></i> เข้าพักอยู่</button>
          <button class="btn btn-sm hk-tab" data-tab="done" onclick="switchHkTab('done',this)"><i class="fas fa-check"></i> เสร็จแล้ว</button>
        </div>
      </div>
      <div id="hkTaskList" class="loading"><i class="fas fa-spinner fa-spin"></i></div>
    </div>

    <!-- Floor map -->
    <div class="card" style="margin-top:20px">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-building"></i> แผนผังตามชั้น</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" id="hkRoomFilter">
          <button class="btn btn-sm hk-filter active" data-status="all" onclick="filterHkRooms('all',this)">ทั้งหมด</button>
          <button class="btn btn-sm hk-filter" data-status="Cleaning" onclick="filterHkRooms('Cleaning',this)">รอทำ</button>
          <button class="btn btn-sm hk-filter" data-status="Available" onclick="filterHkRooms('Available',this)">ว่าง</button>
          <button class="btn btn-sm hk-filter" data-status="CheckedIn" onclick="filterHkRooms('CheckedIn',this)">เข้าพักอยู่</button>
          <button class="btn btn-sm hk-filter" data-status="Maintenance" onclick="filterHkRooms('Maintenance',this)">ซ่อมบำรุง</button>
        </div>
      </div>
      <div id="hkFloorMap"></div>
    </div>
  `;
  loadHousekeepingData();
}

let _hkRooms = [];
let _hkCurrentTab = 'urgent';
let _hkNotes = JSON.parse(localStorage.getItem('hk_notes') || '{}');

async function loadHousekeepingData() {
  try {
    const [roomsRes, checkinsRes] = await Promise.all([API.getRooms(), API.getCheckIns()]);
    _hkRooms = roomsRes.data || [];
    const checkins = checkinsRes.data || [];
    const today = new Date().toDateString();

    const todayCheckoutIds = new Set(checkins.filter(ci => new Date(ci.CheckOutDate).toDateString() === today).map(ci => ci.RoomID));
    const todayCheckinIds = new Set(checkins.filter(ci => new Date(ci.CheckInDate).toDateString() === today && ci.Status === 'Confirmed').map(ci => ci.RoomID));

    const cleaning = _hkRooms.filter(r => r.Status === 'Cleaning');
    const available = _hkRooms.filter(r => r.Status === 'Available');
    const occupied = _hkRooms.filter(r => r.Status === 'CheckedIn');

    const urgent = cleaning.filter(r => todayCheckoutIds.has(r.RoomID) || todayCheckinIds.has(r.RoomID));
    const normalCleaning = cleaning.filter(r => !todayCheckoutIds.has(r.RoomID) && !todayCheckinIds.has(r.RoomID));

    const totalWork = cleaning.length + available.length;
    const done = available.length;
    const pct = totalWork > 0 ? Math.round(done / totalWork * 100) : 100;

    const bar = document.getElementById('hkProgressBar');
    if (bar) bar.style.width = pct + '%';
    const lbl = document.getElementById('hkProgressLabel');
    if (lbl) lbl.textContent = done + ' / ' + totalWork + ' ห้อง (' + pct + '%)';
    const legend = document.getElementById('hkProgressLegend');
    if (legend) {
      const items = [
        { color: '#ef4444', label: 'ด่วน ' + urgent.length },
        { color: '#f59e0b', label: 'รอทำ ' + normalCleaning.length },
        { color: '#10b981', label: 'เสร็จ ' + done },
        { color: '#6366f1', label: 'เข้าพักอยู่ ' + occupied.length }
      ];
      legend.innerHTML = items.map(x =>
        '<span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + x.color + ';display:inline-block"></span>' +
        x.label + '</span>'
      ).join('');
    }

    document.getElementById('hkCountUrgent').textContent = urgent.length;
    document.getElementById('hkCountNormal').textContent = normalCleaning.length;
    document.getElementById('hkCountReady').textContent = available.length;
    document.getElementById('hkCountOccupied').textContent = occupied.length;
    document.getElementById('hkLastUpdate').textContent = 'อัพเดต: ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    window._hkUrgent = urgent;
    window._hkNormalCleaning = normalCleaning;
    window._hkOccupied = occupied;
    window._hkTodayCheckinIds = todayCheckinIds;

    renderHkTab(_hkCurrentTab);
    renderHkFloorMap('all');
    document.querySelectorAll('.hk-filter').forEach(b => {
      if (b.dataset.status === 'all') b.classList.add('active'); else b.classList.remove('active');
    });
  } catch (err) {
    showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

function switchHkTab(tab, btn) {
  _hkCurrentTab = tab;
  document.querySelectorAll('.hk-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHkTab(tab);
}

function renderHkTab(tab) {
  const el = document.getElementById('hkTaskList');
  if (!el) return;
  const urgent = window._hkUrgent || [];
  const normal = window._hkNormalCleaning || [];
  const occupied = window._hkOccupied || [];
  const available = _hkRooms.filter(r => r.Status === 'Available');
  const emptyMsgs = {
    urgent: '<i class="fas fa-check-circle" style="color:#10b981"></i><p>ไม่มีงานด่วน</p>',
    cleaning: '<i class="fas fa-check-circle" style="color:#10b981"></i><p>ไม่มีห้องรอทำความสะอาด</p>',
    occupied: '<i class="fas fa-moon"></i><p>ไม่มีห้องที่มีผู้เข้าพัก</p>',
    done: '<i class="fas fa-moon"></i><p>ยังไม่มีห้องที่เสร็จวันนี้</p>'
  };
  const tabItems = { urgent, cleaning: normal, occupied, done: available };
  const items = tabItems[tab] || [];
  if (items.length === 0) { el.innerHTML = '<div class="empty-state">' + emptyMsgs[tab] + '</div>'; return; }
  el.innerHTML = '<div style="display:grid;gap:10px;padding:4px 0">' + items.map(r => renderHkTaskCard(r, tab, urgent)).join('') + '</div>';
}

function renderHkTaskCard(room, tab, urgentList) {
  const isUrgent = urgentList.some(u => u.RoomID === room.RoomID);
  const isDone = room.Status === 'Available';
  const isOccupied = room.Status === 'CheckedIn';
  const note = _hkNotes[room.RoomID] || '';
  const hasCheckinToday = window._hkTodayCheckinIds && window._hkTodayCheckinIds.has(room.RoomID);

  let badge = isUrgent
    ? (hasCheckinToday
        ? '<span class="badge badge-red"><i class="fas fa-bolt"></i> ด่วนมาก — Check-in วันนี้</span>'
        : '<span class="badge badge-red"><i class="fas fa-exclamation-circle"></i> ด่วน — Check-out วันนี้</span>')
    : isDone ? '<span class="badge badge-green"><i class="fas fa-check"></i> พร้อมแล้ว</span>'
    : isOccupied ? '<span class="badge" style="background:rgba(99,102,241,.12);color:#6366f1;border-radius:4px"><i class="fas fa-user"></i> มีผู้เข้าพักอยู่</span>'
    : '<span class="badge badge-yellow"><i class="fas fa-clock"></i> รอทำความสะอาด</span>';

  const actionBtns = isOccupied
    ? '<button class="btn btn-outline btn-sm" disabled><i class="fas fa-lock"></i> ห้องมีผู้พัก</button>'
    : isDone ? '<button class="btn btn-outline btn-sm" disabled><i class="fas fa-check-circle"></i> เสร็จแล้ว</button>'
    : '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">' +
        '<button class="btn btn-primary btn-sm" onclick="markRoomDone(\'' + room.RoomID + '\',\'' + room.RoomNumber + '\')">' +
          '<i class="fas fa-check"></i> เสร็จแล้ว</button>' +
        '<button class="btn btn-outline btn-sm" title="บันทึกหมายเหตุ" onclick="showHkNoteModal(\'' + room.RoomID + '\',\'' + room.RoomNumber + '\')">' +
          '<i class="fas fa-sticky-note"></i></button>' +
        '<button class="btn btn-outline btn-sm" title="แจ้งซ่อม" onclick="hkReportIssue(\'' + room.RoomID + '\',\'' + room.RoomNumber + '\')">' +
          '<i class="fas fa-tools"></i></button>' +
      '</div>';

  return '<div class="hk-task-card ' + (isUrgent ? 'hk-urgent' : isDone ? 'hk-done' : '') + '">' +
    '<div class="hk-task-room">' +
      '<div class="hk-room-number">' + room.RoomNumber + '</div>' +
      '<div class="hk-room-type">' + (room.TypeName || room.RoomTypeID) + '</div>' +
      '<div class="hk-room-type">ชั้น ' + room.Floor + '</div>' +
    '</div>' +
    '<div class="hk-task-center">' + badge +
      (note ? '<div style="margin-top:6px;font-size:12px;color:var(--text-muted)"><i class="fas fa-sticky-note" style="color:#f59e0b"></i> ' + note + '</div>' : '') +
    '</div>' +
    '<div class="hk-task-action">' + actionBtns + '</div>' +
  '</div>';
}

function filterHkRooms(status, btn) {
  document.querySelectorAll('.hk-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHkFloorMap(status);
}

function renderHkFloorMap(filterStatus) {
  const el = document.getElementById('hkFloorMap');
  if (!el) return;
  const rooms = filterStatus === 'all' ? _hkRooms : _hkRooms.filter(r => r.Status === filterStatus);
  if (rooms.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-door-open"></i><p>ไม่มีห้องในสถานะนี้</p></div>'; return; }

  const floors = {};
  rooms.forEach(r => { const f = r.Floor || 1; if (!floors[f]) floors[f] = []; floors[f].push(r); });
  const sc = { Available:'#10b981', Booked:'#3b82f6', CheckedIn:'#6366f1', Cleaning:'#f59e0b', Maintenance:'#ef4444' };
  const sl = { Available:'ว่าง', Booked:'จองแล้ว', CheckedIn:'เข้าพักอยู่', Cleaning:'รอทำ', Maintenance:'ซ่อมบำรุง' };

  el.innerHTML = Object.keys(floors).sort((a,b)=>b-a).map(floor =>
    '<div style="padding:16px 20px;border-bottom:1px solid var(--border-color)">' +
    '<div style="font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px">ชั้น ' + floor + '</div>' +
    '<div class="room-grid-hk">' +
    floors[floor].map(r =>
      '<div class="room-cell-hk" style="border-top:3px solid ' + (sc[r.Status]||'#ccc') + '">' +
        '<div class="room-cell-num">' + r.RoomNumber + '</div>' +
        '<div class="room-cell-type">' + (r.TypeName||r.RoomTypeID) + '</div>' +
        '<div style="margin-top:5px"><span class="badge" style="background:' + (sc[r.Status]) + '20;color:' + (sc[r.Status]) + ';border-radius:4px;font-size:11px">' + (sl[r.Status]||r.Status) + '</span></div>' +
        (r.Status === 'Cleaning' ? '<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;font-size:11px" onclick="markRoomDone(\'' + r.RoomID + '\',\'' + r.RoomNumber + '\')"><i class="fas fa-check"></i> เสร็จ</button>' : '') +
      '</div>'
    ).join('') + '</div></div>'
  ).join('');
}

function showHkNoteModal(roomId, roomNumber) {
  const current = _hkNotes[roomId] || '';
  openModal('บันทึกสำหรับห้อง ' + roomNumber,
    '<div class="form-group"><label>หมายเหตุ / สิ่งที่พบในห้อง</label>' +
    '<textarea id="hkNoteText" rows="4" placeholder="เช่น พรมเปื้อน, ขาดผ้าเช็ดตัว...">' + current + '</textarea></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
    '<button class="btn btn-outline" onclick="closeModal()">ยกเลิก</button>' +
    '<button class="btn btn-primary" onclick="saveHkNote(\'' + roomId + '\',\'' + roomNumber + '\')"><i class="fas fa-save"></i> บันทึก</button></div>');
}

function saveHkNote(roomId, roomNumber) {
  const note = document.getElementById('hkNoteText').value.trim();
  if (note) _hkNotes[roomId] = note; else delete _hkNotes[roomId];
  localStorage.setItem('hk_notes', JSON.stringify(_hkNotes));
  closeModal();
  showToast('บันทึกหมายเหตุห้อง ' + roomNumber + ' แล้ว', 'success');
  renderHkTab(_hkCurrentTab);
}

function hkReportIssue(roomId, roomNumber) {
  openModal('แจ้งซ่อมห้อง ' + roomNumber,
    '<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">พบปัญหาระหว่างทำความสะอาด — จะส่งใบแจ้งซ่อมให้แผนกช่างทันที</p>' +
    '<div class="form-group"><label>รายละเอียดปัญหา</label>' +
    '<textarea id="hkIssueText" rows="3" placeholder="เช่น หลอดไฟดับ, ก๊อกน้ำรั่ว..."></textarea></div>' +
    '<div class="form-group"><label>ระดับความเร่งด่วน</label>' +
    '<select id="hkIssuePriority"><option value="medium" selected>🟡 ปานกลาง</option><option value="high">🔴 เร่งด่วน</option><option value="low">⚪ ต่ำ</option></select></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
    '<button class="btn btn-outline" onclick="closeModal()">ยกเลิก</button>' +
    '<button class="btn btn-primary" onclick="submitHkIssue(\'' + roomId + '\',\'' + roomNumber + '\')"><i class="fas fa-tools"></i> ส่งใบแจ้งซ่อม</button></div>');
}

function submitHkIssue(roomId, roomNumber) {
  const issue = document.getElementById('hkIssueText')?.value.trim();
  const priority = document.getElementById('hkIssuePriority')?.value || 'medium';
  if (!issue) { showToast('กรุณาระบุปัญหา', 'warning'); return; }
  if (!window._workOrders) window._workOrders = [];
  const newId = 'WO' + String(window._workOrders.length + 1).padStart(3, '0');
  window._workOrders.push({ id: newId, roomId, roomNumber, issue, priority, status: 'open', createdAt: new Date().toISOString(), note: 'แจ้งโดยแผนกแม่บ้าน' });
  closeModal();
  showToast('ส่งใบแจ้งซ่อม ' + newId + ' ให้แผนกช่างแล้ว', 'success');
}

async function markRoomDone(roomId, roomNumber) {
  if (!confirm('ยืนยันว่าทำความสะอาดห้อง ' + roomNumber + ' เสร็จแล้ว?')) return;
  try {
    await API.updateRoomStatus(roomId, 'Available');
    delete _hkNotes[roomId];
    localStorage.setItem('hk_notes', JSON.stringify(_hkNotes));
    showToast('ห้อง ' + roomNumber + ' พร้อมเข้าพักแล้ว ✓', 'success');
    loadHousekeepingData();
  } catch (err) {
    showToast('อัพเดตสถานะไม่สำเร็จ', 'error');
  }
}
