const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET all rooms
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, rt.TypeName, rt.BasePrice, rt.MaxCapacity
      FROM Room r JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
      ORDER BY r.RoomNumber
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET room types
router.get('/types', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM RoomType ORDER BY BasePrice');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET available rooms
router.get('/available', auth, async (req, res) => {
  const { checkIn, checkOut } = req.query;
  try {
    let query = `
      SELECT r.*, rt.TypeName, rt.BasePrice, rt.MaxCapacity
      FROM Room r JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
      WHERE r.Status = 'Available'
    `;
    if (checkIn && checkOut) {
      query += ` AND r.RoomID NOT IN (
        SELECT DISTINCT bd.RoomID FROM BookingDetail bd
        JOIN Booking b ON bd.BookingID = b.BookingID
        WHERE b.Status IN ('Confirmed','CheckedIn')
        AND NOT (b.CheckOutDate <= ? OR b.CheckInDate >= ?)
      )`;
    }
    query += ' ORDER BY r.RoomNumber';
    const params = checkIn && checkOut ? [checkIn, checkOut] : [];
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single room
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, rt.TypeName, rt.BasePrice, rt.MaxCapacity, rt.Description
      FROM Room r JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
      WHERE r.RoomID = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบห้องพัก' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT update room status
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE Room SET Status = ? WHERE RoomID = ?', [status, req.params.id]);
    res.json({ success: true, message: 'อัปเดตสถานะห้องพักสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST create room
router.post('/', auth, async (req, res) => {
  const { RoomID, RoomNumber, RoomTypeID, Floor } = req.body;
  try {
    await db.query('INSERT INTO Room (RoomID, RoomNumber, RoomTypeID, Floor) VALUES (?,?,?,?)',
      [RoomID, RoomNumber, RoomTypeID, Floor]);
    res.json({ success: true, message: 'เพิ่มห้องพักสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT update room
router.put('/:id', auth, async (req, res) => {
  const { RoomNumber, RoomTypeID, Floor, Status } = req.body;
  try {
    await db.query('UPDATE Room SET RoomNumber=?, RoomTypeID=?, Floor=?, Status=? WHERE RoomID=?',
      [RoomNumber, RoomTypeID, Floor, Status, req.params.id]);
    res.json({ success: true, message: 'แก้ไขห้องพักสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
