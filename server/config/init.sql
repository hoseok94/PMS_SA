SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS hypnos_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hypnos_pms;

CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID VARCHAR(5) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Position ENUM('Receptionist','Housekeeping','Manager','Admin','Maintenance','Accounting') NOT NULL,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS RoomType (
    RoomTypeID VARCHAR(3) PRIMARY KEY,
    TypeName VARCHAR(30) NOT NULL,
    BasePrice DECIMAL(10,2) NOT NULL,
    MaxCapacity INT NOT NULL DEFAULT 2,
    Description TEXT
);

CREATE TABLE IF NOT EXISTS Room (
    RoomID VARCHAR(4) PRIMARY KEY,
    RoomNumber VARCHAR(5) NOT NULL UNIQUE,
    RoomTypeID VARCHAR(3) NOT NULL,
    Floor INT NOT NULL,
    Status ENUM('Available','Booked','CheckedIn','Cleaning','Maintenance') DEFAULT 'Available',
    FOREIGN KEY (RoomTypeID) REFERENCES RoomType(RoomTypeID)
);

CREATE TABLE IF NOT EXISTS Customer (
    CustomerID VARCHAR(5) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100),
    Phone VARCHAR(15) NOT NULL,
    IDCard VARCHAR(20),
    Nationality VARCHAR(30) DEFAULT 'Thai',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Booking (
    BookingID VARCHAR(5) PRIMARY KEY,
    CustomerID VARCHAR(5) NOT NULL,
    BookingDate DATE NOT NULL,
    CheckInDate DATE NOT NULL,
    CheckOutDate DATE NOT NULL,
    TotalAmount DECIMAL(10,2) DEFAULT 0,
    Status ENUM('Confirmed','CheckedIn','CheckedOut','Cancelled') DEFAULT 'Confirmed',
    Notes TEXT,
    CreatedBy VARCHAR(5),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (CreatedBy) REFERENCES Employee(EmployeeID)
);

CREATE TABLE IF NOT EXISTS BookingDetail (
    BookingDetailID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID VARCHAR(5) NOT NULL,
    RoomID VARCHAR(4) NOT NULL,
    PricePerNight DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID)
);

CREATE TABLE IF NOT EXISTS CheckIn (
    CheckInID VARCHAR(5) PRIMARY KEY,
    BookingID VARCHAR(5) NOT NULL,
    RoomID VARCHAR(4) NOT NULL,
    CheckInDateTime DATETIME NOT NULL,
    EmployeeID VARCHAR(5) NOT NULL,
    Notes TEXT,
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE IF NOT EXISTS CheckOut (
    CheckOutID VARCHAR(5) PRIMARY KEY,
    CheckInID VARCHAR(5) NOT NULL,
    CheckOutDateTime DATETIME NOT NULL,
    EmployeeID VARCHAR(5) NOT NULL,
    Notes TEXT,
    FOREIGN KEY (CheckInID) REFERENCES CheckIn(CheckInID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE IF NOT EXISTS Payment (
    PaymentID VARCHAR(5) PRIMARY KEY,
    BookingID VARCHAR(5) NOT NULL,
    PaymentDate DATETIME NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Method ENUM('Cash','Credit Card','Bank Transfer','QR Code') NOT NULL,
    Status ENUM('Pending','Paid','Refunded') DEFAULT 'Paid',
    EmployeeID VARCHAR(5),
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

INSERT INTO Employee VALUES
('E001','สมปอง','ต้องรัก','Receptionist','sompong','$2a$10$3Rw.P5cQ.eGRtFFDcqGoBOwKk3ZvInPQTNvV8dcnx2nJejH0IGrau','2024-01-01'),
('E002','นานา','จิตตัง','Housekeeping','nana','$2a$10$SJYMdHfVcWGvN2YPckCwQOLg576EpMr5ZWJ8UnOisofroShLG6pyi','2024-01-01'),
('E003','กาย','เป็นบ่าว','Manager','kay','$2a$10$P2v2.qmHMrm8ohUGN0NBjeX8Nfej.VG8rmeXwrAva5vhvqRt8Y/Ae','2024-01-01'),
('E004','กมลรัตน์','ทองดี','Receptionist','kamon','$2a$10$4o4C6BbI9Z34kFIpoUjNvOvU.9s9i5IzPxO8fg4K7ds9qI7Rf6eFO','2024-01-01'),
('E005','Admin','System','Admin','admin','$2a$10$4o4C6BbI9Z34kFIpoUjNvOvU.9s9i5IzPxO8fg4K7ds9qI7Rf6eFO','2024-01-01'),
('E006','ชอบคิด','คณิตจิตนัง','Accounting','mathlover','$2a$10$uQf4jXhmbBnM80thegDLROl4CgjeuGE08Iv5qjKw0DmiGiIXsRnrC','2026-03-14'),
('E007','เพตรารัตน์','ศรีมงคล','Maintenance','petra05','$2a$10$Bb9fp69FadyUg3y4nIcUDOIoUOuOZcMR3r1RyIPzjrP3oi8hiRi6K','2026-03-14');

INSERT INTO RoomType VALUES
('T01','Standard',1000.00,2,'ห้องมาตรฐาน เตียงเดี่ยวหรือคู่ พร้อมสิ่งอำนวยความสะดวกพื้นฐาน'),
('T02','Deluxe',2000.00,3,'ห้องดีลักซ์ วิวสวน พร้อมระเบียง และสิ่งอำนวยความสะดวกเพิ่มเติม'),
('T03','Suite',5000.00,4,'ห้องสวีท วิวทะเล ห้องนั่งเล่นแยก พร้อมบริการพิเศษ');

INSERT INTO Room VALUES
('R101','101','T01',1,'Available'),
('R102','102','T01',1,'Available'),
('R103','103','T01',1,'Available'),
('R104','104','T01',1,'Maintenance'),
('R201','201','T02',2,'Available'),
('R202','202','T02',2,'Available'),
('R203','203','T02',2,'Available'),
('R301','301','T03',3,'Available'),
('R302','302','T03',3,'Available'),
('R303','303','T03',3,'Available');

INSERT INTO Customer VALUES
('C001','สมชาย','รักดี','r.som@mail.com','0812345678','1234567890123','Thai','2024-01-01'),
('C002','สมหญิง','จริงใจ','yingying@mail.com','0812345679','1234567890124','Thai','2024-01-01'),
('C003','John','Doe','john.d@mail.com','0812345680','PASSPORT123','American','2024-01-01'),
('C004','มานี','มีใจ','manee@mail.com','0812345681','1234567890126','Thai','2024-01-01'),
('C005','ชูใจ','ดีใจ','choojai@mail.com','0812345682','1234567890127','Thai','2024-01-01');
