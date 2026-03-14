const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Dashboard summary
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [[roomStats]] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(Status='Available') as available,
        SUM(Status='Booked') as booked,
        SUM(Status='CheckedIn') as checkedIn,
        SUM(Status='Cleaning') as cleaning,
        SUM(Status='Maintenance') as maintenance
      FROM Room
    `);
    const [[todayBookings]] = await db.query(`
      SELECT COUNT(*) as count, IFNULL(SUM(TotalAmount),0) as revenue
      FROM Booking WHERE DATE(BookingDate) = CURDATE() AND Status != 'Cancelled'
    `);
    const [[todayCheckIn]] = await db.query(`
      SELECT COUNT(*) as count FROM CheckIn WHERE DATE(CheckInDateTime) = CURDATE()
    `);
    const [[todayCheckOut]] = await db.query(`
      SELECT COUNT(*) as count FROM CheckOut WHERE DATE(CheckOutDateTime) = CURDATE()
    `);
    const [[monthRevenue]] = await db.query(`
      SELECT IFNULL(SUM(Amount),0) as revenue FROM Payment
      WHERE MONTH(PaymentDate) = MONTH(CURDATE()) AND YEAR(PaymentDate) = YEAR(CURDATE())
    `);
    const [recentBookings] = await db.query(`
      SELECT b.BookingID, c.FirstName, c.LastName, b.CheckInDate, b.CheckOutDate, b.Status, b.TotalAmount
      FROM Booking b JOIN Customer c ON b.CustomerID = c.CustomerID
      ORDER BY b.BookingDate DESC LIMIT 5
    `);
    res.json({ success: true, data: { roomStats, todayBookings, todayCheckIn, todayCheckOut, monthRevenue, recentBookings } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Revenue report
router.get('/revenue', auth, async (req, res) => {
  const { from, to } = req.query;
      try {
        const [daily] = await db.query(`
      SELECT DATE(PaymentDate) as date, SUM(Amount) as revenue, COUNT(*) as transactions
      FROM Payment
      WHERE PaymentDate BETWEEN ? AND ?
      GROUP BY DATE(PaymentDate)
      ORDER BY date DESC
`, [from || '2024-01-01', to || new Date().toISOString().split('T')[0]]);

    const [byMethod] = await db.query(`
      SELECT Method, COUNT(*) as count, SUM(Amount) as total
      FROM Payment WHERE PaymentDate BETWEEN ? AND ?
      GROUP BY Method
    `, [from || '2024-01-01', to || new Date().toISOString().split('T')[0]]);

    const [[summary]] = await db.query(`
      SELECT COUNT(*) as totalTransactions, SUM(Amount) as totalRevenue, AVG(Amount) as avgAmount
      FROM Payment WHERE PaymentDate BETWEEN ? AND ?
    `, [from || '2024-01-01', to || new Date().toISOString().split('T')[0]]);

    res.json({ success: true, data: { daily, byMethod, summary } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Occupancy report
router.get('/occupancy', auth, async (req, res) => {
  try {
    const [byType] = await db.query(`
      SELECT rt.TypeName, COUNT(r.RoomID) as total,
             SUM(r.Status='Available') as available,
             SUM(r.Status='CheckedIn') as occupied,
             SUM(r.Status='Booked') as booked,
             ROUND(SUM(r.Status='CheckedIn')/COUNT(r.RoomID)*100,1) as occupancyRate
      FROM Room r JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
      GROUP BY rt.RoomTypeID
    `);
    const [bookingsByMonth] = await db.query(`
      SELECT DATE_FORMAT(BookingDate,'%Y-%m') as month,
             COUNT(*) as bookings, SUM(TotalAmount) as revenue
      FROM Booking WHERE Status != 'Cancelled'
      GROUP BY month ORDER BY month DESC LIMIT 12
    `);
    res.json({ success: true, data: { byType, bookingsByMonth } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
