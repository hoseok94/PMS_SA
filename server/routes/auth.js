const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT * FROM Employee WHERE Username = ?', [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    const emp = rows[0];
    const valid = await bcrypt.compare(password, emp.Password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    const token = jwt.sign(
      { id: emp.EmployeeID, username: emp.Username, position: emp.Position, name: `${emp.FirstName} ${emp.LastName}` },
      process.env.JWT_SECRET || 'hotel_secret',
      { expiresIn: '8h' }
    );
    res.json({ success: true, token, user: { id: emp.EmployeeID, name: `${emp.FirstName} ${emp.LastName}`, position: emp.Position } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/change-password
const authMiddleware = require('../middleware/auth');
router.post('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM Employee WHERE EmployeeID = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบพนักงาน' });
    const valid = await bcrypt.compare(oldPassword, rows[0].Password);
    if (!valid) return res.status(401).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE Employee SET Password = ? WHERE EmployeeID = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
