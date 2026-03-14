async function renderCustomers() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-users text-gold"></i> ข้อมูลลูกค้า</h2>
      <button class="btn btn-primary" onclick="showAddCustomerModal()"><i class="fas fa-user-plus"></i> เพิ่มลูกค้า</button>
    </div>
    <div class="card">
      <div class="search-bar">
        <div class="search-input"><i class="fas fa-search"></i><input id="cusSearchInput" placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสลูกค้า..." oninput="searchCustomers(this.value)"></div>
      </div>
      <div id="cusTable" class="loading"><i class="fas fa-spinner"></i></div>
    </div>
  `;
  await loadCustomers();
}

async function loadCustomers(search = '') {
  try {
    const { data } = await API.getCustomers(search);
    const el = document.getElementById('cusTable');
    if (!el) return;
    if (data.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><p>ไม่พบข้อมูลลูกค้า</p></div>'; return; }
    el.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>เบอร์โทร</th><th>อีเมล</th><th>สัญชาติ</th><th>วันที่สมัคร</th><th>จัดการ</th></tr></thead>
      <tbody>${data.map(c => `<tr>
        <td class="fw-bold text-gold">${c.CustomerID}</td>
        <td class="fw-bold">${c.FirstName} ${c.LastName}</td>
        <td>${c.Phone}</td>
        <td>${c.Email || '-'}</td>
        <td><span class="badge ${c.Nationality==='Thai'?'badge-blue':'badge-purple'}">${c.Nationality||'Thai'}</span></td>
        <td>${formatDate(c.CreatedAt)}</td>
        <td>
          <div style="display:flex;gap:5px">
            <button class="btn btn-sm btn-info" onclick="viewCustomer('${c.CustomerID}')"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-secondary" onclick="showEditCustomerModal('${c.CustomerID}')"><i class="fas fa-edit"></i></button>
          </div>
        </td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch (err) { document.getElementById('cusTable').innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

let searchTimeout;
function searchCustomers(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadCustomers(val), 400);
}

async function viewCustomer(id) {
  try {
    const { data: c } = await API.getCustomer(id);
    openModal(`${c.FirstName} ${c.LastName}`, `
      <div class="form-row" style="margin-bottom:16px">
        <div><div class="text-muted" style="font-size:.78rem">รหัสลูกค้า</div><div class="fw-bold text-gold">${c.CustomerID}</div></div>
        <div><div class="text-muted" style="font-size:.78rem">เบอร์โทร</div><div class="fw-bold">${c.Phone}</div></div>
        <div><div class="text-muted" style="font-size:.78rem">อีเมล</div><div>${c.Email||'-'}</div></div>
        <div><div class="text-muted" style="font-size:.78rem">สัญชาติ</div><div>${c.Nationality||'Thai'}</div></div>
      </div>
      ${c.IDCard?`<div class="alert alert-info" style="margin-bottom:14px"><i class="fas fa-id-card"></i> เลขบัตร: ${c.IDCard}</div>`:''}
      <div class="card-title" style="margin-bottom:10px"><i class="fas fa-history"></i> ประวัติการจอง (${c.bookings.length} ครั้ง)</div>
      ${c.bookings.length === 0 ? '<div class="text-muted">ยังไม่มีประวัติการจอง</div>' :
      `<div class="table-wrap"><table>
        <thead><tr><th>รหัสจอง</th><th>ห้อง</th><th>เช็คอิน</th><th>เช็คเอาท์</th><th>ราคา</th><th>สถานะ</th></tr></thead>
        <tbody>${c.bookings.map(b=>`<tr>
          <td class="fw-bold text-gold">${b.BookingID}</td>
          <td>${b.Rooms||'-'}</td>
          <td>${formatDate(b.CheckInDate)}</td>
          <td>${formatDate(b.CheckOutDate)}</td>
          <td>${formatMoney(b.TotalAmount)}</td>
          <td>${statusBadge(b.Status)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    `, 'modal-lg');
  } catch (err) { showToast(err.message, 'error'); }
}

function showAddCustomerModal() {
  openModal('เพิ่มลูกค้าใหม่', customerForm(), '');
}

async function showEditCustomerModal(id) {
  const { data: c } = await API.getCustomer(id);
  openModal('แก้ไขข้อมูลลูกค้า', customerForm(c), '');
}

function customerForm(c = null) {
  return `
    <div class="form-row">
      <div class="form-group"><label>ชื่อ *</label><input id="cfFirst" value="${c?.FirstName||''}" placeholder="ชื่อ"></div>
      <div class="form-group"><label>นามสกุล *</label><input id="cfLast" value="${c?.LastName||''}" placeholder="นามสกุล"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>เบอร์โทร *</label><input id="cfPhone" value="${c?.Phone||''}" placeholder="0812345678"></div>
      <div class="form-group"><label>อีเมล</label><input id="cfEmail" type="email" value="${c?.Email||''}" placeholder="email@example.com"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>เลขบัตรประชาชน/Passport</label><input id="cfIDCard" value="${c?.IDCard||''}" placeholder="หมายเลขบัตร"></div>
      <div class="form-group"><label>สัญชาติ</label><input id="cfNat" value="${c?.Nationality||'Thai'}"></div>
    </div>
    <div style="display:flex;gap:9px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" onclick="${c ? `updateCustomer('${c.CustomerID}')` : 'addCustomer()'}">
        <i class="fas fa-save"></i> ${c ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า'}
      </button>
    </div>
  `;
}

async function addCustomer() {
  const first = document.getElementById('cfFirst').value.trim();
  const last = document.getElementById('cfLast').value.trim();
  const phone = document.getElementById('cfPhone').value.trim();
  if (!first || !last || !phone) { showToast('กรุณากรอกชื่อ นามสกุล และเบอร์โทร', 'warning'); return; }
  try {
    await API.createCustomer({ FirstName:first, LastName:last, Phone:phone, Email:document.getElementById('cfEmail').value, IDCard:document.getElementById('cfIDCard').value, Nationality:document.getElementById('cfNat').value||'Thai' });
    closeModal(); showToast('เพิ่มลูกค้าสำเร็จ'); loadCustomers();
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateCustomer(id) {
  const first = document.getElementById('cfFirst').value.trim();
  const last = document.getElementById('cfLast').value.trim();
  const phone = document.getElementById('cfPhone').value.trim();
  if (!first || !last || !phone) { showToast('กรุณากรอกชื่อ นามสกุล และเบอร์โทร', 'warning'); return; }
  try {
    await API.updateCustomer(id, { FirstName:first, LastName:last, Phone:phone, Email:document.getElementById('cfEmail').value, IDCard:document.getElementById('cfIDCard').value, Nationality:document.getElementById('cfNat').value||'Thai' });
    closeModal(); showToast('แก้ไขข้อมูลสำเร็จ'); loadCustomers();
  } catch (err) { showToast(err.message, 'error'); }
}

window.loadCustomers = loadCustomers;
window.searchCustomers = searchCustomers;
window.viewCustomer = viewCustomer;
window.showAddCustomerModal = showAddCustomerModal;
window.showEditCustomerModal = showEditCustomerModal;
window.addCustomer = addCustomer;
window.updateCustomer = updateCustomer;
