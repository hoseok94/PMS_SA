const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { CheckInID } = req.body;

    const [ci] = await conn.query('SELECT * FROM CheckIn WHERE CheckInID=?', [CheckInID]);
    if (ci.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลเช็คอิน' });

    const [last] = await conn.query('SELECT CheckOutID FROM CheckOut ORDER BY CheckOutID DESC LIMIT 1');
    let newId = 'CO001';
    if (last.length > 0) {
      const num = parseInt(last[0].CheckOutID.slice(2)) + 1;
      newId = 'CO' + String(num).padStart(3, '0');
    }

    await conn.query('INSERT INTO CheckOut (CheckOutID, CheckInID, CheckOutDateTime, EmployeeID) VALUES (?,?,NOW(),?)',
      [newId, CheckInID, req.user.id]);
    await conn.query("UPDATE Room SET Status='Cleaning' WHERE RoomID=?", [ci[0].RoomID]);
    await conn.query("UPDATE Booking SET Status='CheckedOut' WHERE BookingID=?", [ci[0].BookingID]);

    await conn.commit();
    res.json({ success: true, data: { CheckOutID: newId }, message: 'เช็คเอาท์สำเร็จ' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

module.exports = router;
