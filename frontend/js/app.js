// ====== ROLE PERMISSIONS ======
const ROLE_PERMISSIONS = {
  Admin: {
    pages: ['dashboard','rooms','booking','bookingList','checkin','checkout','payment','customers','reports','employees'],
    canEdit: true, canDelete: true, canViewReports: true, label: 'ผู้ดูแลระบบ'
  },
  Manager: {
    pages: ['dashboard','rooms','bookingList','checkin','checkout','customers','reports'],
    canEdit: true, canDelete: false, canViewReports: true, label: 'ผู้จัดการ'
  },
  Receptionist: {
    pages: ['dashboard','booking','bookingList','checkin','checkout','payment','customers'],
    canEdit: true, canDelete: false, canViewReports: false, label: 'พนักงานต้อนรับ'
  },
  Housekeeping: {
    pages: ['housekeeping'],
    canEdit: false, canDelete: false, canViewReports: false, label: 'แม่บ้าน'
  },
  Maintenance: {
    pages: ['maintenance'],
    canEdit: false, canDelete: false, canViewReports: false, label: 'ช่างซ่อมบำรุง'
  },
  Accounting: {
    pages: ['dashboard','accounting'],
    canEdit: false, canDelete: false, canViewReports: true, label: 'บัญชี'
  }
};

function getRolePermissions(position) {
  return ROLE_PERMISSIONS[position] || ROLE_PERMISSIONS['Receptionist'];
}

function canAccess(page) {
  const user = JSON.parse(localStorage.getItem('pms_user') || 'null');
  if (!user) return false;
  return getRolePermissions(user.position).pages.includes(page);
}

window.canAccess = canAccess;
window.getRolePermissions = getRolePermissions;

// ====== APP CORE ======
let currentPage = 'dashboard';
const pageMap = {
  dashboard: { title: 'แดชบอร์ด', render: renderDashboard },
  rooms: { title: 'จัดการห้องพัก', render: renderRooms },
  booking: { title: 'จองห้องพัก', render: renderBooking },
  bookingList: { title: 'รายการจอง', render: renderBookingList },
  checkin: { title: 'เช็คอิน', render: renderCheckin },
  checkout: { title: 'เช็คเอาท์', render: renderCheckout },
  payment: { title: 'ชำระเงิน', render: renderPayment },
  customers: { title: 'ข้อมูลลูกค้า', render: renderCustomers },
  reports: { title: 'รายงาน', render: renderReports },
  employees: { title: 'พนักงาน', render: renderEmployees },
  housekeeping: { title: 'งานแม่บ้าน', render: renderHousekeeping },
  maintenance: { title: 'งานซ่อมบำรุง', render: renderMaintenance },
  accounting: { title: 'บัญชีและการเงิน', render: renderAccounting },
};

const NAV_ITEMS = [
  { page: 'dashboard',   icon: 'fa-chart-pie',     label: 'แดชบอร์ด' },
  { page: 'rooms',       icon: 'fa-door-open',     label: 'จัดการห้องพัก' },
  { page: 'booking',     icon: 'fa-calendar-plus', label: 'จองห้องพัก' },
  { page: 'bookingList', icon: 'fa-list-alt',      label: 'รายการจอง' },
  { page: 'checkin',     icon: 'fa-sign-in-alt',   label: 'เช็คอิน' },
  { page: 'checkout',    icon: 'fa-sign-out-alt',  label: 'เช็คเอาท์' },
  { page: 'payment',     icon: 'fa-credit-card',   label: 'ชำระเงิน' },
  { page: 'customers',   icon: 'fa-users',         label: 'ข้อมูลลูกค้า' },
  { page: 'reports',     icon: 'fa-chart-bar',     label: 'รายงาน' },
  { page: 'employees',   icon: 'fa-user-tie',      label: 'พนักงาน' },
  { page: 'housekeeping',icon: 'fa-broom',         label: 'งานแม่บ้าน' },
  { page: 'maintenance', icon: 'fa-tools',         label: 'งานซ่อมบำรุง' },
  { page: 'accounting',  icon: 'fa-file-invoice-dollar', label: 'บัญชี' },
];

function buildNav(userPosition) {
  const nav = document.querySelector('.sidebar-nav');
  nav.innerHTML = '';
  const perms = getRolePermissions(userPosition);

  // Group separator logic
  const frontOffice = ['dashboard','rooms','booking','bookingList','checkin','checkout','payment','customers'];
  const management = ['reports','employees','housekeeping','maintenance','accounting'];
  let addedSep = false;

  NAV_ITEMS.forEach(item => {
    if (!perms.pages.includes(item.page)) return;

    // Add separator before management items
    if (management.includes(item.page) && !addedSep && perms.pages.some(p => frontOffice.includes(p))) {
      const sep = document.createElement('div');
      sep.className = 'nav-separator';
      sep.innerHTML = '<span>จัดการระบบ</span>';
      nav.appendChild(sep);
      addedSep = true;
    }

    const a = document.createElement('a');
    a.href = '#';
    a.className = 'nav-item';
    a.dataset.page = item.page;
    a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.page);
      if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
    });
    nav.appendChild(a);
  });
}

function init() {
  const token = localStorage.getItem('pms_token');
  const user = JSON.parse(localStorage.getItem('pms_user') || 'null');
  if (token && user) showApp(user);

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';
    errEl.style.display = 'none';
    try {
      const res = await API.login(
        document.getElementById('loginUsername').value,
        document.getElementById('loginPassword').value
      );
      localStorage.setItem('pms_token', res.token);
      localStorage.setItem('pms_user', JSON.stringify(res.user));
      showApp(res.user);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>เข้าสู่ระบบ</span><i class="fas fa-arrow-right"></i>';
    }
  });

  updateDate();
  setInterval(updateDate, 60000);
}

function showApp(user) {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  document.getElementById('mainApp').style.flexDirection = 'row';
  document.getElementById('userName').textContent = user.name;

  const perms = getRolePermissions(user.position);
  document.getElementById('userPosition').textContent = perms.label || positionThai(user.position);

  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    const roleColors = {
      Admin:'badge-red', Manager:'badge-purple', Receptionist:'badge-blue',
      Housekeeping:'badge-yellow', Maintenance:'badge-orange', Accounting:'badge-green'
    };
    roleBadge.className = `badge ${roleColors[user.position] || 'badge-gray'}`;
    roleBadge.textContent = perms.label;
  }

  buildNav(user.position);
  const permsPages = perms.pages;
  const firstPage = permsPages[0] || 'dashboard';
  navigateTo(firstPage);
}

function logout() {
  localStorage.removeItem('pms_token');
  localStorage.removeItem('pms_user');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
}

function navigateTo(page) {
  if (!pageMap[page]) return;
  if (!canAccess(page)) {
    showToast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
    return;
  }
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  document.getElementById('pageTitle').textContent = pageMap[page].title;
  document.getElementById('pageContent').innerHTML = '<div class="loading"><i class="fas fa-spinner"></i></div>';
  pageMap[page].render();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const mc = document.querySelector('.main-content');
  if (window.innerWidth < 768) {
    sb.classList.toggle('open');
  } else {
    sb.classList.toggle('collapsed');
    mc.classList.toggle('expanded');
  }
}

function updateDate() {
  const now = new Date();
  document.getElementById('currentDate').textContent = now.toLocaleDateString('th-TH', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
}

// ====== MODAL ======
function openModal(title, content, size = '') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  const box = document.getElementById('modalBox');
  box.className = 'modal-box' + (size ? ' ' + size : '');
  document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ====== TOAST ======
function showToast(msg, type = 'success') {
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-circle', info:'fa-info-circle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||icons.success}"></i><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(30px)'; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); }, 3000);
}

// ====== HELPERS ======
function positionThai(p) {
  const m = { Receptionist:'พนักงานต้อนรับ', Housekeeping:'แม่บ้าน', Manager:'ผู้จัดการ', Admin:'ผู้ดูแลระบบ', Maintenance:'ช่างซ่อมบำรุง', Accounting:'บัญชี' };
  return m[p] || p;
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });
}
function formatDatetime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('th-TH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatMoney(n) { return Number(n||0).toLocaleString('th-TH', { minimumFractionDigits:0 }) + ' ฿'; }
function statusBadge(s) {
  const m = {
    Available:['badge-green','ว่าง'], Booked:['badge-blue','จองแล้ว'], CheckedIn:['badge-orange','เข้าพักแล้ว'],
    Cleaning:['badge-yellow','ทำความสะอาด'], Maintenance:['badge-red','ซ่อมบำรุง'],
    Confirmed:['badge-blue','ยืนยัน'], CheckedOut:['badge-gray','เช็คเอาท์แล้ว'], Cancelled:['badge-red','ยกเลิก'],
    Paid:['badge-green','ชำระแล้ว'], Pending:['badge-yellow','รอชำระ'], Refunded:['badge-gray','คืนเงิน']
  };
  const [cls, label] = m[s] || ['badge-gray', s];
  return `<span class="badge ${cls}">${label}</span>`;
}

window.navigateTo = navigateTo;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.formatDate = formatDate;
window.formatDatetime = formatDatetime;
window.formatMoney = formatMoney;
window.statusBadge = statusBadge;
window.positionThai = positionThai;
window.logout = logout;
window.toggleSidebar = toggleSidebar;

init();
