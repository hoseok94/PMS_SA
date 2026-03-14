async function renderEmployees() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-user-tie"></i> จัดการพนักงาน</h2>
      <button class="btn btn-primary" onclick="showAddEmpModal()"><i class="fas fa-user-plus"></i> เพิ่มพนักงาน</button>
    </div>

    <!-- Role Permission Matrix -->
    <div class="card" style="margin-bottom:18px">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-shield-alt"></i> สิทธิ์การเข้าถึงตามตำแหน่ง</div>
        <button class="btn btn-secondary btn-sm" onclick="togglePermMatrix()"><i class="fas fa-table"></i> แสดง/ซ่อน</button>
      </div>
      <div id="permMatrix" style="display:none">
        ${renderPermissionMatrix()}
      </div>
    </div>

    <!-- Employee Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-users"></i> รายชื่อพนักงาน</div>
      </div>
      <div id="empTable" class="loading"><i class="fas fa-spinner"></i></div>
    </div>
  `;
  loadEmployees();
}

function renderPermissionMatrix() {
  const PAGES = [
    { key: 'dashboard',   label: 'แดชบอร์ด' },
    { key: 'rooms',       label: 'จัดการห้องพัก' },
    { key: 'booking',     label: 'จองห้องพัก' },
    { key: 'bookingList', label: 'รายการจอง' },
    { key: 'checkin',     label: 'เช็คอิน' },
    { key: 'checkout',    label: 'เช็คเอาท์' },
    { key: 'payment',     label: 'ชำระเงิน' },
    { key: 'customers',   label: 'ข้อมูลลูกค้า' },
    { key: 'reports',     label: 'รายงาน' },
    { key: 'employees',   label: 'พนักงาน' },
  ];
  const ROLES = ['Admin','Manager','Receptionist','Housekeeping','Maintenance','Accounting'];
  const ROLE_LABELS = {
    Admin:'ผู้ดูแลระบบ', Manager:'ผู้จัดการ', Receptionist:'พนักงานต้อนรับ',
    Housekeeping:'แม่บ้าน', Maintenance:'ช่างซ่อมบำรุง', Accounting:'บัญชี'
  };
  const ROLE_BADGE = {
    Admin:'badge-red', Manager:'badge-purple', Receptionist:'badge-blue',
    Housekeeping:'badge-yellow', Maintenance:'badge-orange', Accounting:'badge-green'
  };

  const check = (role, page) => {
    const perms = typeof getRolePermissions === 'function' ? getRolePermissions(role) : { pages: [] };
    return perms.pages.includes(page);
  };

  const headerCells = ROLES.map(r => `<th style="text-align:center;min-width:90px">
    <span class="badge ${ROLE_BADGE[r]}" style="display:block;text-align:center;font-size:.68rem;white-space:normal;line-height:1.4;padding:4px 6px">${ROLE_LABELS[r]}</span>
  </th>`).join('');

  const rows = PAGES.map(p => {
    const cells = ROLES.map(r => {
      const has = check(r, p.key);
      return `<td style="text-align:center">
        ${has
          ? `<i class="fas fa-check-circle" style="color:var(--success);font-size:1rem"></i>`
          : `<i class="fas fa-minus" style="color:var(--border-strong);font-size:.8rem"></i>`}
      </td>`;
    }).join('');
    return `<tr><td style="font-weight:600;font-size:.86rem">${p.label}</td>${cells}</tr>`;
  }).join('');

  // Also show edit/delete/report capabilities
  const capRows = [
    { label: 'แก้ไขข้อมูล', key: 'canEdit' },
    { label: 'ดูรายงาน',    key: 'canViewReports' },
    { label: 'ลบข้อมูล',    key: 'canDelete' },
  ].map(cap => {
    const cells = ROLES.map(r => {
      const perms = typeof getRolePermissions === 'function' ? getRolePermissions(r) : {};
      const has = !!perms[cap.key];
      return `<td style="text-align:center">
        ${has
          ? `<i class="fas fa-check-circle" style="color:var(--success);font-size:1rem"></i>`
          : `<i class="fas fa-minus" style="color:var(--border-strong);font-size:.8rem"></i>`}
      </td>`;
    }).join('');
    return `<tr style="background:var(--bg)"><td style="font-weight:600;font-size:.86rem;color:var(--text-muted)"><i class="fas fa-cog" style="margin-right:5px;color:var(--gold)"></i>${cap.label}</td>${cells}</tr>`;
  }).join('');

  return `
    <div class="table-wrap" style="margin-top:4px">
      <table>
        <thead>
          <tr>
            <th style="min-width:140px">เมนู / ฟีเจอร์</th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr><td colspan="${ROLES.length + 1}" style="padding:4px;background:var(--bg)"></td></tr>
          ${capRows}
        </tbody>
      </table>
    </div>
    <p style="font-size:.75rem;color:var(--text-muted);margin-top:10px;padding:0 4px">
      <i class="fas fa-info-circle"></i> ตารางนี้แสดงสิทธิ์ Frontend ที่ถูกควบคุมโดย Role ของผู้ใช้งาน
    </p>
  `;
}

function togglePermMatrix() {
  const el = document.getElementById('permMatrix');
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function loadEmployees() {
  try {
    const { data } = await API.getEmployees();
    const el = document.getElementById('empTable');
    if (!el) return;
    if (data.length === 0) {
      el.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>ยังไม่มีพนักงาน</p></div>';
      return;
    }
    el.innerHTML = `<div class="table-wrap"><table>
      <thead><tr>
        <th>รหัส</th><th>ชื่อ-นามสกุล</th><th>ตำแหน่ง</th><th>ชื่อผู้ใช้</th>
        <th>สิทธิ์เมนู</th><th>วันที่เพิ่ม</th><th>จัดการ</th>
      </tr></thead>
      <tbody>${data.map(e => {
        const perms = typeof getRolePermissions === 'function' ? getRolePermissions(e.Position) : { pages: [] };
        const pageCount = perms.pages.length;
        return `<tr>
          <td class="fw-bold text-gold">${e.EmployeeID}</td>
          <td class="fw-bold">${e.FirstName} ${e.LastName}</td>
          <td><span class="badge ${positionBadge(e.Position)}">${positionThai(e.Position)}</span></td>
          <td style="font-family:monospace;font-size:.83rem">${e.Username}</td>
          <td>
            <span title="เข้าถึงได้ ${pageCount} เมนู" style="font-size:.8rem;color:var(--text-muted)">
              <i class="fas fa-lock-open" style="color:var(--gold);margin-right:4px"></i>${pageCount} เมนู
            </span>
          </td>
          <td>${formatDate(e.CreatedAt)}</td>
          <td>
            <div style="display:flex;gap:5px">
              <button class="btn btn-sm btn-warning" onclick="showResetPassModal('${e.EmployeeID}','${e.FirstName} ${e.LastName}')" title="รีเซ็ตรหัสผ่าน">
                <i class="fas fa-key"></i>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  } catch (err) {
    document.getElementById('empTable').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function positionBadge(p) {
  const m = { Receptionist:'badge-blue', Housekeeping:'badge-yellow', Manager:'badge-purple', Admin:'badge-red', Maintenance:'badge-orange', Accounting:'badge-green' };
  return m[p] || 'badge-gray';
}

function showAddEmpModal() {
  openModal('เพิ่มพนักงานใหม่', `
    <div class="form-row">
      <div class="form-group"><label>ชื่อ *</label><input id="eFirst" placeholder="ชื่อ"></div>
      <div class="form-group"><label>นามสกุล *</label><input id="eLast" placeholder="นามสกุล"></div>
    </div>
    <div class="form-group">
      <label>ตำแหน่ง *</label>
      <select id="ePos" onchange="updateRolePreview()">
        <option value="Receptionist">พนักงานต้อนรับ</option>
        <option value="Housekeeping">แม่บ้าน</option>
        <option value="Manager">ผู้จัดการ</option>
        <option value="Admin">ผู้ดูแลระบบ</option>
        <option value="Maintenance">ช่างซ่อมบำรุง</option>
        <option value="Accounting">บัญชี</option>
      </select>
    </div>
    <div id="rolePreview" class="alert alert-info" style="font-size:.83rem;margin-bottom:14px">
      <i class="fas fa-shield-alt"></i> <span id="rolePreviewText"></span>
    </div>
    <div class="form-row">
      <div class="form-group"><label>ชื่อผู้ใช้ *</label><input id="eUser" placeholder="username"></div>
      <div class="form-group"><label>รหัสผ่าน *</label><input id="ePass" type="password" placeholder="รหัสผ่าน"></div>
    </div>
    <div class="modal-footer" style="padding:0;border:none;margin-top:6px">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" onclick="addEmployee()"><i class="fas fa-save"></i> บันทึก</button>
    </div>
  `);
  updateRolePreview();
}

function updateRolePreview() {
  const pos = document.getElementById('ePos')?.value;
  const el = document.getElementById('rolePreviewText');
  if (!el || !pos) return;
  const perms = typeof getRolePermissions === 'function' ? getRolePermissions(pos) : { pages: [] };
  el.textContent = `ตำแหน่งนี้เข้าถึงได้ ${perms.pages.length} เมนู: ${perms.pages.map(p => {
    const labels = { dashboard:'แดชบอร์ด', rooms:'ห้องพัก', booking:'จองห้อง', bookingList:'รายการจอง',
      checkin:'เช็คอิน', checkout:'เช็คเอาท์', payment:'ชำระเงิน', customers:'ลูกค้า', reports:'รายงาน', employees:'พนักงาน' };
    return labels[p] || p;
  }).join(', ')}`;
}

async function addEmployee() {
  const first = document.getElementById('eFirst').value.trim();
  const last  = document.getElementById('eLast').value.trim();
  const pos   = document.getElementById('ePos').value;
  const user  = document.getElementById('eUser').value.trim();
  const pass  = document.getElementById('ePass').value;
  if (!first || !last || !user || !pass) { showToast('กรุณากรอกข้อมูลให้ครบ', 'warning'); return; }
  try {
    await API.createEmployee({ FirstName:first, LastName:last, Position:pos, Username:user, Password:pass });
    closeModal(); showToast('เพิ่มพนักงานสำเร็จ'); loadEmployees();
  } catch (err) { showToast(err.message, 'error'); }
}

function showResetPassModal(id, name) {
  openModal(`รีเซ็ตรหัสผ่าน — ${name}`, `
    <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> รหัสผ่านเดิมจะถูกเปลี่ยนทันทีหลังกด "ยืนยัน"</div>
    <div class="form-group"><label>รหัสผ่านใหม่ *</label><input id="newPass" type="password" placeholder="รหัสผ่านใหม่"></div>
    <div class="form-group"><label>ยืนยันรหัสผ่าน *</label><input id="confPass" type="password" placeholder="ยืนยันรหัสผ่าน"></div>
    <div class="modal-footer" style="padding:0;border:none;margin-top:6px">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-danger" onclick="resetPassword('${id}')"><i class="fas fa-key"></i> ยืนยันรีเซ็ต</button>
    </div>
  `);
}

async function resetPassword(id) {
  const newPass  = document.getElementById('newPass').value;
  const confPass = document.getElementById('confPass').value;
  if (!newPass) { showToast('กรุณากรอกรหัสผ่านใหม่', 'warning'); return; }
  if (newPass !== confPass) { showToast('รหัสผ่านไม่ตรงกัน', 'error'); return; }
  try {
    await API.resetPassword(id, newPass);
    closeModal(); showToast('รีเซ็ตรหัสผ่านสำเร็จ');
  } catch (err) { showToast(err.message, 'error'); }
}

window.loadEmployees = loadEmployees;
window.showAddEmpModal = showAddEmpModal;
window.addEmployee = addEmployee;
window.showResetPassModal = showResetPassModal;
window.resetPassword = resetPassword;
window.positionBadge = positionBadge;
window.togglePermMatrix = togglePermMatrix;
window.updateRolePreview = updateRolePreview;
