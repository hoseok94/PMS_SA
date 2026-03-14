const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = `
      SELECT b.*, c.FirstName, c.LastName, c.Phone,
             GROUP_CONCAT(DISTINCT r.RoomNumber ORDER BY r.RoomNumber SEPARATOR ', ') as Rooms,
             GROUP_CONCAT(DISTINCT rt.TypeName ORDER BY rt.TypeName SEPARATOR ', ') as RoomTypes
      FROM Booking b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      LEFT JOIN BookingDetail bd ON b.BookingID = bd.BookingID
      LEFT JOIN Room r ON bd.RoomID = r.RoomID
      LEFT JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
    `;
    const conditions = [];
    const params = [];
    if (status) { conditions.push('b.Status = ?'); params.push(status); }
    if (date) { conditions.push('(b.CheckInDate = ? OR b.CheckOutDate = ?)'); params.push(date, date); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY b.BookingID ORDER BY b.BookingDate DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, c.FirstName, c.LastName, c.Phone, c.Email, c.IDCard, c.Nationality
      FROM Booking b JOIN Customer c ON b.CustomerID = c.CustomerID
      WHERE b.BookingID = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
    const [details] = await db.query(`
      SELECT bd.*, r.RoomNumber, rt.TypeName, rt.BasePrice
      FROM BookingDetail bd
      JOIN Room r ON bd.RoomID = r.RoomID
      JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
      WHERE bd.BookingID = ?
    `, [req.params.id]);
    const [payments] = await db.query('SELECT * FROM Payment WHERE BookingID = ?', [req.params.id]);
    res.json({ success: true, data: { ...rows[0], details, payments } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { CustomerID, CheckInDate, CheckOutDate, RoomIDs, Notes } = req.body;

    // Generate BookingID
    const [last] = await conn.query('SELECT BookingID FROM Booking ORDER BY BookingID DESC LIMIT 1');
    let newId = 'B001';
    if (last.length > 0) {
      const num = parseInt(last[0].BookingID.slice(1)) + 1;
      newId = 'B' + String(num).padStart(3, '0');
    }

    // Calculate total nights & amount
    const d1 = new Date(CheckInDate), d2 = new Date(CheckOutDate);
    const nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));

    // Get room prices
    let totalAmount = 0;
    const roomPrices = [];
    for (const roomId of RoomIDs) {
      const [rr] = await conn.query('SELECT r.RoomID, rt.BasePrice FROM Room r JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID WHERE r.RoomID = ?', [roomId]);
      if (rr.length > 0) {
        const price = rr[0].BasePrice * nights;
        totalAmount += price;
        roomPrices.push({ roomId, pricePerNight: rr[0].BasePrice });
      }
    }

    await conn.query(
      'INSERT INTO Booking (BookingID, CustomerID, BookingDate, CheckInDate, CheckOutDate, TotalAmount, Notes, CreatedBy) VALUES (?,?,NOW(),?,?,?,?,?)',
      [newId, CustomerID, CheckInDate, CheckOutDate, totalAmount, Notes || null, req.user.id]
    );

    for (const { roomId, pricePerNight } of roomPrices) {
      await conn.query('INSERT INTO BookingDetail (BookingID, RoomID, PricePerNight) VALUES (?,?,?)',
        [newId, roomId, pricePerNight]);
      await conn.query("UPDATE Room SET Status='Booked' WHERE RoomID=?", [roomId]);
    }

    await conn.commit();
    res.json({ success: true, data: { BookingID: newId }, message: 'บันทึกการจองสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

router.put('/:id/cancel', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [details] = await conn.query('SELECT RoomID FROM BookingDetail WHERE BookingID=?', [req.params.id]);
    await conn.query("UPDATE Booking SET Status='Cancelled' WHERE BookingID=?", [req.params.id]);
    for (const d of details) {
      await conn.query("UPDATE Room SET Status='Available' WHERE RoomID=?", [d.RoomID]);
    }
    await conn.commit();
    res.json({ success: true, message: 'ยกเลิกการจองสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

module.exports = router;
