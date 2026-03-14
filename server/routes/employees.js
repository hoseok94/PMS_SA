const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT EmployeeID, FirstName, LastName, Position, Username, CreatedAt FROM Employee ORDER BY EmployeeID');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { FirstName, LastName, Position, Username, Password } = req.body;
  try {
    const [last] = await db.query('SELECT EmployeeID FROM Employee ORDER BY EmployeeID DESC LIMIT 1');
    let newId = 'E001';
    if (last.length > 0) {
      const num = parseInt(last[0].EmployeeID.slice(1)) + 1;
      newId = 'E' + String(num).padStart(3, '0');
    }
    const hashed = await bcrypt.hash(Password, 10);
    await db.query('INSERT INTO Employee (EmployeeID, FirstName, LastName, Position, Username, Password) VALUES (?,?,?,?,?,?)',
      [newId, FirstName, LastName, Position, Username, hashed]);
    res.json({ success: true, message: 'เพิ่มพนักงานสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/reset-password', auth, async (req, res) => {
  const { newPassword } = req.body;
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE Employee SET Password=? WHERE EmployeeID=?', [hashed, req.params.id]);
    res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
