const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ci.*, b.CheckInDate, b.CheckOutDate, b.TotalAmount,
             c.FirstName, c.LastName, c.Phone,
             r.RoomNumber, rt.TypeName
      FROM CheckIn ci
      JOIN Booking b ON ci.BookingID = b.BookingID
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Room r ON ci.RoomID = r.RoomID
      JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
      LEFT JOIN CheckOut co ON ci.CheckInID = co.CheckInID
      WHERE co.CheckOutID IS NULL
      ORDER BY ci.CheckInDateTime DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { BookingID, RoomID } = req.body;

    // Verify booking exists & is confirmed
    const [booking] = await conn.query("SELECT * FROM Booking WHERE BookingID=? AND Status='Confirmed'", [BookingID]);
    if (booking.length === 0) return res.status(400).json({ success: false, message: 'ไม่พบการจองหรือสถานะไม่ถูกต้อง' });

    // Verify room is in booking
    const [bd] = await conn.query('SELECT * FROM BookingDetail WHERE BookingID=? AND RoomID=?', [BookingID, RoomID]);
    if (bd.length === 0) return res.status(400).json({ success: false, message: 'ห้องนี้ไม่ได้อยู่ในรายการจอง' });

    // Generate CheckInID
    const [last] = await conn.query('SELECT CheckInID FROM CheckIn ORDER BY CheckInID DESC LIMIT 1');
    let newId = 'CI001';
    if (last.length > 0) {
      const num = parseInt(last[0].CheckInID.slice(2)) + 1;
      newId = 'CI' + String(num).padStart(3, '0');
    }

    await conn.query(
      'INSERT INTO CheckIn (CheckInID, BookingID, RoomID, CheckInDateTime, EmployeeID) VALUES (?,?,?,NOW(),?)',
      [newId, BookingID, RoomID, req.user.id]
    );
    await conn.query("UPDATE Room SET Status='CheckedIn' WHERE RoomID=?", [RoomID]);
    await conn.query("UPDATE Booking SET Status='CheckedIn' WHERE BookingID=?", [BookingID]);

    await conn.commit();
    res.json({ success: true, data: { CheckInID: newId }, message: 'เช็คอินสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

module.exports = router;
