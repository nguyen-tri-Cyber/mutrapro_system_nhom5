#  Hướng Dẫn Chạy Dự Án MuTraPro

Hướng dẫn chi tiết từng bước để chạy hệ thống MuTraPro.

##  Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt](#cài-đặt)
3. [Chạy Hệ Thống](#chạy-hệ-thống)
4. [Kiểm Tra](#kiểm-tra)
5. [Troubleshooting](#troubleshooting)

---

##  Yêu Cầu Hệ Thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

### Bắt Buộc:
-  **Docker Desktop** (Windows/Mac) hoặc **Docker Engine + Docker Compose** (Linux)
  - Phiên bản: Docker >= 20.x
  - Docker Compose >= 2.x
  - Kiểm tra: `docker --version` và `docker-compose --version`

-  **Node.js** >= 16.x (cho development)
  - Kiểm tra: `node --version`
  - Download: https://nodejs.org/

-  **Git** (để clone repository nếu cần)
  - Kiểm tra: `git --version`

### Khuyến Nghị:
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Disk Space**: Ít nhất 10GB trống
- **Browser**: Chrome, Firefox, Edge (phiên bản mới nhất)

---

##  Cài Đặt

### Bước 1: Clone hoặc Tải Dự Án

Nếu chưa có code:
```bash
git clone <repository-url>
cd mutrapro_system
```

Hoặc giải nén file ZIP vào thư mục `mutrapro_system`.

### Bước 2: Kiểm Tra Cấu Trúc Thư Mục

Đảm bảo bạn có cấu trúc sau:
```
mutrapro_system/
├── docker-compose.yml
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── order-service/
│   ├── task-service/
│   ├── file-service/
│   ├── studio-service/
│   └── notification-service/
└── web-app/
```

---

##  Chạy Hệ Thống

### Phương Pháp 1: Chạy Tự Động (Khuyến Nghị)

#### Bước 1: Khởi Động Tất Cả Services

Mở terminal/command prompt tại thư mục gốc `mutrapro_system` và chạy:

```bash
docker-compose up -d
```

Lệnh này sẽ:
- Tải và build Docker images (nếu chưa có)
- Khởi động MySQL database
- Khởi động 6 microservices
- Khởi động API Gateway
- Tất cả chạy trong background (`-d` = detached mode)

**Thời gian**: Lần đầu tiên có thể mất 5-10 phút để tải images và build.

#### Bước 2: Kiểm Tra Services Đã Chạy

```bash
docker-compose ps
```

Bạn sẽ thấy danh sách các containers:
```
NAME                      STATUS          PORTS
mutrapro_api-gateway      Up              0.0.0.0:3000->3000/tcp
mutrapro_auth-service     Up              0.0.0.0:3001->3001/tcp
mutrapro_order-service    Up              0.0.0.0:3002->3002/tcp
mutrapro_task-service     Up              0.0.0.0:3003->3003/tcp
mutrapro_file-service     Up              0.0.0.0:3004->3004/tcp
mutrapro_studio-service   Up              0.0.0.0:3005->3005/tcp
mutrapro_notification     Up              0.0.0.0:3006->3006/tcp
mutrapro_mysql_db         Up              0.0.0.0:3306->3306/tcp
```

#### Bước 3: Xem Logs (Tùy Chọn)

Để xem logs của các services:
```bash
# Xem logs của API Gateway
docker-compose logs api-gateway

# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f auth-service
docker-compose logs -f order-service
```

#### Bước 4: Khởi Động Web Application

Mở terminal/command prompt mới và chuyển vào thư mục web-app:

```bash
cd web-app
```

Cài đặt dependencies (chỉ lần đầu tiên):
```bash
npm install
```

Khởi động React app:
```bash
npm start
```

Ứng dụng sẽ tự động mở tại: **http://localhost:3000**

> ⚠️ **Lưu ý**: Nếu port 3000 đã được sử dụng bởi API Gateway, React sẽ hỏi bạn có muốn dùng port khác (như 3001). Chọn **Y** và tiếp tục.

---

### Phương Pháp 2: Chạy Từng Service (Development)

Nếu muốn chạy từng service riêng lẻ để debug:

#### 1. Chạy Database và Services qua Docker:
```bash
docker-compose up -d mysql_db
docker-compose up -d auth-service
docker-compose up -d order-service
# ... các service khác
```

#### 2. Chạy API Gateway riêng (development mode):
```bash
cd services/api-gateway
npm install
npm start
```

#### 3. Chạy Web App:
```bash
cd web-app
npm install
npm start
```

---

##  Kiểm Tra

### Kiểm Tra API Gateway

Mở trình duyệt hoặc dùng curl:

```bash
curl http://localhost:3000/health
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "service": "API Gateway",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Kiểm Tra Các Services

#### Auth Service:
```bash
curl http://localhost:3001
# hoặc qua Gateway
curl http://localhost:3000/api/auth
```

#### Order Service:
```bash
curl http://localhost:3002/orders
# hoặc qua Gateway
curl http://localhost:3000/api/orders
```

### Kiểm Tra Database

Kết nối MySQL:
```bash
docker exec -it mutrapro_mysql_db mysql -uroot -pyour_strong_password
```

Hoặc dùng MySQL Workbench/DBeaver:
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `your_strong_password`

### Kiểm Tra Web App

Mở trình duyệt và truy cập: **http://localhost:3000**

Bạn sẽ thấy:
- Trang chủ với hero section
- Form đăng nhập/đăng ký
- Navigation bar

---

##  Troubleshooting

### Lỗi: Port đã được sử dụng

**Lỗi**: `Error: bind EADDRINUSE: address already in use :::3000`

**Giải pháp 1**: Tắt service đang dùng port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Giải pháp 2**: Đổi port trong `docker-compose.yml`
```yaml
api-gateway:
  ports:
    - "3001:3000"  # Đổi từ 3000 sang 3001
```

### Lỗi: Container không khởi động

**Kiểm tra logs**:
```bash
docker-compose logs api-gateway
```

**Restart container**:
```bash
docker-compose restart api-gateway
```

**Rebuild nếu cần**:
```bash
docker-compose up -d --build api-gateway
```

### Lỗi: Database connection failed

**Kiểm tra MySQL container**:
```bash
docker-compose ps mysql_db
```

**Nếu container chưa sẵn sàng, đợi thêm**:
```bash
docker-compose logs mysql_db
```

**Restart database**:
```bash
docker-compose restart mysql_db
```

### Lỗi: npm install failed

**Xóa node_modules và reinstall**:
```bash
cd web-app
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: CORS Error

Kiểm tra file `services/api-gateway/index.js` đã có:
```javascript
app.use(cors());
```

### Lỗi: Services không giao tiếp được

**Kiểm tra network**:
```bash
docker network ls
docker network inspect mutrapro_system_default
```

**Kiểm tra các services có cùng network không**.

---

##  Các Lệnh Hữu Ích

### Quản Lý Containers

```bash
# Xem tất cả containers
docker-compose ps

# Xem logs real-time
docker-compose logs -f

# Stop tất cả services
docker-compose stop

# Stop và xóa containers
docker-compose down

# Stop, xóa containers và volumes (⚠️ Xóa dữ liệu)
docker-compose down -v

# Restart một service
docker-compose restart api-gateway

# Rebuild một service
docker-compose up -d --build api-gateway
```

### Kiểm Tra Resources

```bash
# Xem CPU, RAM usage
docker stats

# Xem disk usage
docker system df
```

### Debugging

```bash
# Vào trong container
docker exec -it mutrapro_api-gateway sh

# Xem environment variables
docker-compose exec api-gateway env
```

---

##  Quy Trình Development

### 1. Start Services
```bash
docker-compose up -d
```

### 2. Start Web App (terminal riêng)
```bash
cd web-app
npm start
```

### 3. Code và Test
- Sửa code trong `web-app/src/`
- React tự động reload
- Xem logs: `docker-compose logs -f`

### 4. Stop Services
```bash
docker-compose stop
# Hoặc Ctrl+C trong terminal web-app
```

---

##  Checklist Chạy Lần Đầu

- [ ] Đã cài Docker và Docker Compose
- [ ] Đã cài Node.js >= 16.x
- [ ] Đã clone/giải nén project
- [ ] Đã chạy `docker-compose up -d`
- [ ] Đã kiểm tra `docker-compose ps` - tất cả containers đều Up
- [ ] Đã chạy `npm install` trong thư mục `web-app`
- [ ] Đã chạy `npm start` trong thư mục `web-app`
- [ ] Đã mở http://localhost:3000 và thấy trang chủ
- [ ] Đã test đăng ký/đăng nhập

---

##  Hoàn Thành!

Nếu bạn thấy:
-  Tất cả containers đang chạy (`docker-compose ps`)
-  API Gateway trả về `{"status":"OK"}` tại `/health`
-  Web app mở được tại http://localhost:3000
-  Có thể đăng ký/đăng nhập

** Chúc mừng! Hệ thống đã sẵn sàng để sử dụng!**

---

##  Hỗ Trợ

Nếu gặp vấn đề:
1. Xem lại phần Troubleshooting
2. Kiểm tra logs: `docker-compose logs -f`
3. Đảm bảo đã cài đặt đủ yêu cầu
4. Kiểm tra firewall không block ports 3000-3006

---

**"Designed For Music, Engineered to Last"** 

