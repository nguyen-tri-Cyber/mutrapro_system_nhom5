# MuTraPro - Custom Music Transcription and Production System

**English**: Custom Music Transcription and Production System  
**Vietnamese**: Hệ thống ký âm và sản xuất âm nhạc theo yêu cầu  
**Abbreviation**: MuTraPro

![MuTraPro](https://img.shields.io/badge/MuTraPro-Music%20Production-blue)
![Microservices](https://img.shields.io/badge/Architecture-Microservices-green)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)

## 📋 Tổng Quan Dự Án

MuTraPro là một nền tảng tích hợp cung cấp dịch vụ ký âm, phối khí và sản xuất âm nhạc theo yêu cầu một cách hiệu quả và liền mạch. Hệ thống cho phép người dùng (với vai trò Khách hàng) chuyển đổi bất kỳ đầu vào âm thanh nào (file audio, bài hát, hoặc video) thành bản ký âm nhạc chi tiết và chính xác. Ngoài ra, MuTraPro hỗ trợ tạo phối khí tùy chỉnh và khi cần thiết, tích hợp thu âm giọng hát do Nghệ sĩ Thu âm thực hiện.

### Mục Tiêu

- ✅ Tối ưu hóa quy trình sản xuất âm nhạc
- ✅ Tạo điều kiện tương tác minh bạch giữa khách hàng và chuyên gia
- ✅ Theo dõi tiến độ dự án theo thời gian thực
- ✅ Đảm bảo chất lượng dịch vụ cao

## 🏗️ Kiến Trúc Hệ Thống

Hệ thống được xây dựng theo kiến trúc **Microservices** với **API Gateway** làm điểm vào duy nhất:

```
┌─────────────┐
│  Web App    │ (React - Port 3000)
│   (Frontend)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ (Port 3000 - Express + http-proxy-middleware)
│  (Entry     │
│   Point)    │
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │  Order  │ │  Task   │ │  File   │ │ Studio  │ │Notify   │
│ Service │ │ Service │ │ Service │ │ Service │ │ Service │ │ Service │
│  3001   │ │  3002   │ │  3003   │ │  3004   │ │  3005   │ │  3006   │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │          │           │           │           │           │
     └──────────┴──────────┴──────────┴──────────┴──────────┘
                              ▼
                       ┌──────────┐
                       │   MySQL  │
                       │  (Port   │
                       │   3306)  │
                       └──────────┘
```

### Microservices

1. **Auth Service** (Port 3001): Xác thực và quản lý người dùng
2. **Order Service** (Port 3002): Quản lý đơn hàng dịch vụ
3. **Task Service** (Port 3003): Quản lý và phân công nhiệm vụ
4. **File Service** (Port 3004): Upload và quản lý file
5. **Studio Service** (Port 3005): Quản lý phòng thu và lịch đặt
6. **Notification Service** (Port 3006): Thông báo real-time qua Socket.IO

### API Gateway

API Gateway đóng vai trò:
- **Single Entry Point**: Tất cả requests đi qua một cổng duy nhất
- **Request Routing**: Định tuyến requests đến đúng microservice
- **Service Discovery**: Quản lý các service URLs
- **Error Handling**: Xử lý lỗi khi service không khả dụng
- **Load Balancing**: Có thể mở rộng để load balance

## 🚀 Hướng Dẫn Cài Đặt

> 📖 **Xem hướng dẫn chi tiết**: [HUONG_DAN_CHAY.md](./HUONG_DAN_CHAY.md)

### Quick Start

1. **Khởi động tất cả services**
   ```bash
   docker-compose up -d
   ```

2. **Khởi động Web App**
   ```bash
   cd web-app
   npm install  # Chỉ lần đầu tiên
   npm start
   ```

3. **Truy cập ứng dụng**: http://localhost:3000

### Yêu Cầu Hệ Thống

- **Docker** >= 20.x và **Docker Compose** >= 2.x
- **Node.js** >= 16.x (cho development)
- **MySQL** 8.0 (được cài tự động qua Docker)

### Kiểm Tra Services

```bash
# Xem trạng thái tất cả containers
docker-compose ps

# Kiểm tra API Gateway
curl http://localhost:3000/health
```

### Cấu Hình

#### API Gateway Configuration

Cấu hình trong `services/api-gateway/index.js` hoặc qua environment variables:

```env
PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
ORDER_SERVICE_URL=http://order-service:3002
TASK_SERVICE_URL=http://task-service:3003
FILE_SERVICE_URL=http://file-service:3004
STUDIO_SERVICE_URL=http://studio-service:3005
NOTIFICATION_SERVICE_URL=http://notification-service:3006
```

#### Frontend Configuration

Cấu hình trong `web-app/src/config/apiConfig.js`:

```javascript
export const USE_GATEWAY = true; // Sử dụng API Gateway
export const GATEWAY_URL = 'http://localhost:3000';
```

## 📁 Cấu Trúc Dự Án

```
mutrapro_system/
├── services/                    # Microservices
│   ├── api-gateway/            # API Gateway (MỚI)
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── auth-service/           # Authentication service
│   ├── order-service/          # Order management service
│   ├── task-service/           # Task assignment service
│   ├── file-service/           # File upload/download service
│   ├── studio-service/         # Studio booking service
│   └── notification-service/   # Real-time notifications
├── web-app/                     # React Frontend
│   ├── src/
│   │   ├── api/                # API clients (đã cập nhật để dùng Gateway)
│   │   ├── config/             # API Configuration (MỚI)
│   │   ├── components/
│   │   ├── pages/
│   │   └── context/
│   └── public/
├── docker-compose.yml           # Docker orchestration (đã cập nhật)
└── README.md                    # File này
```

## 🔧 Công Nghệ Sử Dụng

### Backend
- **Node.js** + **Express**: Microservices framework
- **MySQL**: Database (mỗi service có database riêng)
- **Socket.IO**: Real-time communication
- **Docker** + **Docker Compose**: Containerization và orchestration

### Frontend
- **React 18.3.1**: UI framework
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client
- **Socket.IO Client**: Real-time notifications
- **Chart.js**: Data visualization

### Infrastructure
- **API Gateway**: Express + http-proxy-middleware
- **Docker**: Containerization
- **Docker Compose**: Service orchestration

## 📝 API Endpoints

Tất cả API requests đi qua API Gateway tại `http://localhost:3000/api/`:

### Auth Service
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `PUT /api/auth/users/:id` - Cập nhật profile

### Order Service
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái

### Task Service
- `POST /api/tasks` - Tạo nhiệm vụ
- `GET /api/tasks/specialist/:id` - Lấy nhiệm vụ của chuyên gia
- `PUT /api/tasks/:id/status` - Cập nhật trạng thái

### File Service
- `POST /api/files/upload` - Upload file
- `GET /api/files/order/:id` - Lấy files của đơn hàng

### Studio Service
- `GET /api/studios` - Lấy danh sách phòng thu
- `POST /api/studios/bookings` - Đặt lịch phòng thu

### Notification Service
- WebSocket connection tại `/socket.io` (qua Gateway)

## 👥 Vai Trò Người Dùng

1. **Customer**: Khách hàng đặt dịch vụ
2. **Transcriber**: Chuyên gia ký âm
3. **Arranger**: Chuyên gia phối khí
4. **Artist**: Nghệ sĩ thu âm
5. **Coordinator**: Điều phối viên phân công nhiệm vụ
6. **Studio Admin**: Quản lý phòng thu
7. **Admin**: Quản trị viên hệ thống

##  Tính Năng Đã Hoàn Thành

### Core Features
-  Microservices Architecture (6 services)
-  API Gateway với request routing
-  Docker containerization
-  Docker Compose orchestration
-  Authentication & Authorization
-  Order Management
-  Task Assignment
- ✅ File Upload/Download
- ✅ Studio Booking
- ✅ Real-time Notifications (Socket.IO)

### Frontend Features
- ✅ Modern UI với Glassmorphism design
- ✅ Responsive layout
- ✅ Real-time updates
- ✅ Role-based dashboard
- ✅ Order tracking
- ✅ Task management

## Workflow

1. **Customer** tạo đơn hàng → **Order Service**
2. **Coordinator** xem đơn hàng chưa phân công
3. **Coordinator** phân công nhiệm vụ → **Task Service**
4. **Specialist** (Transcriber/Arranger/Artist) nhận và thực hiện nhiệm vụ
5. **Specialist** upload sản phẩm → **File Service**
6. **Customer** nhận thông báo real-time → **Notification Service**
7. **Customer** xem và phê duyệt sản phẩm

## Xử Lý Lỗi

### Kiểm tra services
```bash
# Xem trạng thái tất cả containers
docker-compose ps

# Xem logs của API Gateway
docker-compose logs api-gateway

# Restart một service
docker-compose restart api-gateway
```

### Health Check
```bash
# Kiểm tra API Gateway
curl http://localhost:3000/health
```

### Troubleshooting

1. **Port conflicts**: Đảm bảo ports 3000-3006 không bị sử dụng
2. **Database connection**: Kiểm tra MySQL container đã chạy
3. **Service không khả dụng**: Xem logs bằng `docker-compose logs <service-name>`

##  Tài Liệu

- [Web App README](./web-app/README.md) - Hướng dẫn chi tiết cho frontend
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Microservices Best Practices](https://microservices.io/)

##  Security Notes

- **Production**: Cần cấu hình HTTPS, JWT tokens, và rate limiting
- **Database**: Thay đổi password mặc định trong `docker-compose.yml`
- **Environment Variables**: Sử dụng `.env` files cho sensitive data

##  License

MIT License

## 👨 Phát Triển Bởi

Nhóm 5 - MuTraPro System

---

**"Designed For Music, Engineered to Last"** 🎵

