const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.FirstName, c.LastName, b.CheckInDate, b.CheckOutDate
      FROM Payment p
      JOIN Booking b ON p.BookingID = b.BookingID
      JOIN Customer c ON b.CustomerID = c.CustomerID
      ORDER BY p.PaymentDate DESC LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { BookingID, Amount, Method } = req.body;

    const [last] = await db.query('SELECT PaymentID FROM Payment ORDER BY PaymentID DESC LIMIT 1');
    let newId = 'P001';
    if (last.length > 0) {
      const num = parseInt(last[0].PaymentID.slice(1)) + 1;
      newId = 'P' + String(num).padStart(3, '0');
    }

    await db.query('INSERT INTO Payment (PaymentID, BookingID, PaymentDate, Amount, Method, Status, EmployeeID) VALUES (?,?,NOW(),?,?,?,?)',
      [newId, BookingID, Amount, Method, 'Paid', req.user.id]);
    res.json({ success: true, data: { PaymentID: newId }, message: 'บันทึกการชำระเงินสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
