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

## บัญชีเข้าใช้งาน (รหัสผ่าน: hotel1234)
| Username | ตำแหน่ง |
|----------|---------|
| admin    | Admin   |
| sompong  | พนักงานต้อนรับ |
| kay      | ผู้จัดการ |
| nana     | แม่บ้าน |
| kamon    | พนักงานต้อนรับ |

## phpMyAdmin Login
- Username: `hypnoshotel`
- Password: `hypnos1234`
- Database: `hypnos_pms`
