async function renderPayment() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header"><h2><i class="fas fa-credit-card text-gold"></i> ชำระเงิน</h2></div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-search"></i> บันทึกการชำระเงิน</div></div>
        <div class="form-group">
          <label>รหัสการจอง</label>
          <div style="display:flex;gap:9px">
            <input id="payBookingId" placeholder="เช่น B001" style="flex:1" value="${window._pendingPaymentBookingId||''}">
            <button class="btn btn-primary" onclick="loadBookingForPay()"><i class="fas fa-search"></i> ค้นหา</button>
          </div>
        </div>
        <div id="payBookingInfo"></div>
        <div id="payForm" style="display:none">
          <hr class="divider">
          <div class="form-group">
            <label><i class="fas fa-baht-sign"></i> จำนวนเงิน (บาท)</label>
            <input type="number" id="payAmount" min="0" step="1">
          </div>
          <div class="form-group">
            <label><i class="fas fa-money-bill"></i> วิธีชำระเงิน</label>
            <select id="payMethod">
              <option value="Cash">เงินสด</option>
              <option value="Credit Card">บัตรเครดิต</option>
              <option value="Bank Transfer">โอนธนาคาร</option>
              <option value="QR Code">QR Code</option>
            </select>
          </div>
          <button class="btn btn-primary btn-full" onclick="submitPayment()"><i class="fas fa-check-circle"></i> ยืนยันการชำระเงิน</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-history"></i> ประวัติการชำระเงิน</div></div>
        <div id="payHistory" class="loading"><i class="fas fa-spinner"></i></div>
      </div>
    </div>
  `;
  window._pendingPaymentBookingId = null;
  loadPayHistory();
  if (document.getElementById('payBookingId').value) loadBookingForPay();
}

async function loadBookingForPay() {
  const id = document.getElementById('payBookingId').value.trim().toUpperCase();
  if (!id) return;
  try {
    const { data: b } = await API.getBooking(id);
    const paidTotal = b.payments.reduce((s, p) => s + Number(p.Amount), 0);
    const remaining = Number(b.TotalAmount) - paidTotal;
    document.getElementById('payBookingInfo').innerHTML = `
      <div class="alert alert-info">
        <div class="fw-bold">${b.FirstName} ${b.LastName}</div>
        <div>เช็คอิน: ${formatDate(b.CheckInDate)} → ${formatDate(b.CheckOutDate)}</div>
        <div style="margin-top:6px;display:flex;gap:16px">
          <div><span class="text-muted">ยอดรวม</span><br><strong>${formatMoney(b.TotalAmount)}</strong></div>
          <div><span class="text-muted">ชำระแล้ว</span><br><strong class="text-success">${formatMoney(paidTotal)}</strong></div>
          <div><span class="text-muted">คงเหลือ</span><br><strong class="text-gold">${formatMoney(remaining)}</strong></div>
        </div>
      </div>
      ${b.payments.length > 0 ? `<div style="font-size:.82rem;margin-bottom:8px"><strong>ประวัติชำระ:</strong> ${b.payments.map(p=>`${formatMoney(p.Amount)} (${p.Method})`).join(', ')}</div>` : ''}
    `;
    document.getElementById('payAmount').value = remaining > 0 ? remaining : '';
    document.getElementById('payForm').style.display = remaining > 0 ? 'block' : 'none';
    if (remaining <= 0) document.getElementById('payBookingInfo').innerHTML += '<div class="alert alert-success"><i class="fas fa-check-circle"></i> ชำระเงินครบถ้วนแล้ว</div>';
    window._payBookingId = id;
  } catch (err) {
    document.getElementById('payBookingInfo').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function submitPayment() {
  const amount = document.getElementById('payAmount').value;
  const method = document.getElementById('payMethod').value;
  if (!amount || amount <= 0) { showToast('กรุณากรอกจำนวนเงิน', 'warning'); return; }
  try {
    await API.createPayment({ BookingID: window._payBookingId, Amount: amount, Method: method });
    showToast('บันทึกการชำระเงินสำเร็จ');
    loadBookingForPay();
    loadPayHistory();
  } catch (err) { showToast(err.message, 'error'); }
}

async function loadPayHistory() {
  try {
    const { data } = await API.getPayments();
    const el = document.getElementById('payHistory');
    if (!el) return;
    if (data.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>ยังไม่มีประวัติการชำระเงิน</p></div>'; return; }
    el.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>รหัส</th><th>ลูกค้า</th><th>จำนวนเงิน</th><th>วิธี</th><th>วันที่</th></tr></thead>
      <tbody>${data.map(p => `<tr>
        <td class="fw-bold text-gold">${p.PaymentID}</td>
        <td>${p.FirstName} ${p.LastName}</td>
        <td class="fw-bold">${formatMoney(p.Amount)}</td>
        <td><span class="badge badge-blue">${p.Method}</span></td>
        <td>${formatDatetime(p.PaymentDate)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch (err) {}
}

window.loadBookingForPay = loadBookingForPay;
window.submitPayment = submitPayment;
window.loadPayHistory = loadPayHistory;
