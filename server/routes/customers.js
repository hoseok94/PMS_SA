const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM Customer';
    let params = [];
    if (search) {
      query += ' WHERE FirstName LIKE ? OR LastName LIKE ? OR Phone LIKE ? OR CustomerID LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }
    query += ' ORDER BY CreatedAt DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE CustomerID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบลูกค้า' });
    // Get booking history
    const [bookings] = await db.query(`
      SELECT b.*, GROUP_CONCAT(r.RoomNumber) as Rooms
      FROM Booking b
      LEFT JOIN BookingDetail bd ON b.BookingID = bd.BookingID
      LEFT JOIN Room r ON bd.RoomID = r.RoomID
      WHERE b.CustomerID = ?
      GROUP BY b.BookingID
      ORDER BY b.BookingDate DESC
    `, [req.params.id]);
    res.json({ success: true, data: { ...rows[0], bookings } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { FirstName, LastName, Email, Phone, IDCard, Nationality } = req.body;
  try {
    // Generate CustomerID
    const [last] = await db.query('SELECT CustomerID FROM Customer ORDER BY CustomerID DESC LIMIT 1');
    let newId = 'C001';
    if (last.length > 0) {
      const num = parseInt(last[0].CustomerID.slice(1)) + 1;
      newId = 'C' + String(num).padStart(3, '0');
    }
    await db.query('INSERT INTO Customer (CustomerID, FirstName, LastName, Email, Phone, IDCard, Nationality) VALUES (?,?,?,?,?,?,?)',
      [newId, FirstName, LastName, Email || null, Phone, IDCard || null, Nationality || 'Thai']);
    res.json({ success: true, data: { CustomerID: newId }, message: 'เพิ่มลูกค้าสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { FirstName, LastName, Email, Phone, IDCard, Nationality } = req.body;
  try {
    await db.query('UPDATE Customer SET FirstName=?, LastName=?, Email=?, Phone=?, IDCard=?, Nationality=? WHERE CustomerID=?',
      [FirstName, LastName, Email || null, Phone, IDCard || null, Nationality || 'Thai', req.params.id]);
    res.json({ success: true, message: 'แก้ไขข้อมูลลูกค้าสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
