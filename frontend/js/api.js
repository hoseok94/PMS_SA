const API_BASE = '/api';

function getToken() { return localStorage.getItem('pms_token'); }

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด');
  return data;
}

const API = {
  get: (path) => apiCall('GET', path),
  post: (path, body) => apiCall('POST', path, body),
  put: (path, body) => apiCall('PUT', path, body),
  del: (path) => apiCall('DELETE', path),

  // Auth
  login: (u, p) => apiCall('POST', '/auth/login', { username: u, password: p }),

  // Rooms
  getRooms: () => apiCall('GET', '/rooms'),
  getRoomTypes: () => apiCall('GET', '/rooms/types'),
  getAvailableRooms: (ci, co) => apiCall('GET', `/rooms/available?checkIn=${ci}&checkOut=${co}`),
  updateRoomStatus: (id, status) => apiCall('PUT', `/rooms/${id}/status`, { status }),
  createRoom: (d) => apiCall('POST', '/rooms', d),
  updateRoom: (id, d) => apiCall('PUT', `/rooms/${id}`, d),

  // Customers
  getCustomers: (search='') => apiCall('GET', `/customers${search ? '?search='+search : ''}`),
  getCustomer: (id) => apiCall('GET', `/customers/${id}`),
  createCustomer: (d) => apiCall('POST', '/customers', d),
  updateCustomer: (id, d) => apiCall('PUT', `/customers/${id}`, d),

  // Bookings
  getBookings: (params='') => apiCall('GET', `/bookings${params ? '?' + params : ''}`),
  getBooking: (id) => apiCall('GET', `/bookings/${id}`),
  createBooking: (d) => apiCall('POST', '/bookings', d),
  cancelBooking: (id) => apiCall('PUT', `/bookings/${id}/cancel`),

  // CheckIn/Out
  getCheckIns: () => apiCall('GET', '/checkin'),
  checkIn: (d) => apiCall('POST', '/checkin', d),
  checkOut: (d) => apiCall('POST', '/checkout', d),

  // Payments
  getPayments: () => apiCall('GET', '/payments'),
  createPayment: (d) => apiCall('POST', '/payments', d),

  // Reports
  getDashboard: () => apiCall('GET', '/reports/dashboard'),
  getRevenueReport: (from, to) => apiCall('GET', `/reports/revenue?from=${from}&to=${to}`),
  getOccupancyReport: () => apiCall('GET', '/reports/occupancy'),

  // Employees
  getEmployees: () => apiCall('GET', '/employees'),
  createEmployee: (d) => apiCall('POST', '/employees', d),
  resetPassword: (id, p) => apiCall('PUT', `/employees/${id}/reset-password`, { newPassword: p }),
};
