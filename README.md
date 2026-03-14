# 🏨 Hypnos Hotel PMS

ระบบบริหารจัดการโรงแรม (Property Management System)

## วิธีรัน (ครั้งแรก หรือ reset ข้อมูล)
```powershell
docker-compose down -v
docker-compose up -d --build
```

## วิธีรัน (ครั้งต่อไป)
```powershell
docker-compose up -d
```

## URL
| บริการ | URL |
|--------|-----|
| ระบบ PMS | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 |
# PMS_SA - Property Management System

ระบบจัดการโรงแรม (Property Management System) พัฒนาด้วย Node.js + Express + MySQL

## URL
| บริการ | URL |
|--------|-----|
| ระบบ PMS | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 |

## การติดตั้ง
```bash
# Clone โปรเจค
git clone https://github.com/hoseok94/PMS_SA.git
cd PMS_SA

# รันด้วย Docker
docker-compose up --build
```

## โครงสร้างโปรเจค
```
PMS_SA/
├── frontend/          # หน้าเว็บ HTML/CSS/JS
│   ├── css/
│   ├── js/
│   └── index.html
├── server/            # Backend Node.js
│   ├── config/        # การตั้งค่า DB
│   ├── middleware/    # Auth middleware
│   ├── routes/        # API routes
│   └── index.js
├── docker-compose.yml
└── Dockerfile
```

## บัญชีผู้ใช้งาน

| Username | รหัสผ่าน | ตำแหน่ง | ภาษาไทย |
|----------|----------|----------|----------|
| admin | hotel11234 | Admin | ผู้ดูแลระบบ |
| sompong | sompongeiei01 | Receptionist | พนักงานต้อนรับ |
| kay | leadernumber1 | Manager | ผู้จัดการ |
| nana | nani04 | Housekeeping | แม่บ้าน |
| petra05 | petraza55 | Maintenance | ช่างซ่อมบำรุง |
| mathlover | ilovemath99 | Accounting | บัญชี |

## เทคโนโลยีที่ใช้
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Auth:** JWT, bcryptjs
- **Deploy:** Docker, Docker Compose

## phpMyAdmin Login
- Username: `hypnoshotel`
- Password: `hypnos1234`
- Database: `hypnos_pms`
https://github.com/hoseok94/PMS_SA
