# MuTraPro - Music Production System

Hệ thống quản lý và sản xuất âm nhạc chuyên nghiệp được xây dựng với React và microservices architecture.

![MuTraPro](https://img.shields.io/badge/MuTraPro-Music%20Production-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-green)

##  Giới Thiệu

MuTraPro là một hệ thống quản lý dịch vụ sản xuất âm nhạc toàn diện, cho phép khách hàng đặt hàng các dịch vụ như ký âm, phối khí, và thu âm. Hệ thống hỗ trợ quản lý đơn hàng, phân công nhiệm vụ cho các chuyên gia, và quản lý phòng thu một cách hiệu quả.

### Tính Năng Chính

-  **Quản Lý Người Dùng**: Xác thực và phân quyền theo vai trò (Customer, Artist, Transcriber, Arranger, Coordinator, Admin, Studio Admin)
-  **Quản Lý Đơn Hàng**: Tạo và theo dõi đơn hàng dịch vụ âm nhạc
-  **Phân Công Nhiệm Vụ**: Tự động phân công công việc cho các chuyên gia
-  **Quản Lý Phòng Thu**: Đặt lịch và quản lý phòng thu
-  **Upload & Download File**: Quản lý file audio, notation, và các file sản phẩm
-  **Thông Báo Real-time**: Thông báo tức thời qua Socket.IO
-  **Thống Kê & Báo Cáo**: Dashboard với biểu đồ và báo cáo chi tiết

##  Bắt Đầu

### Yêu Cầu Hệ Thống

- Node.js >= 16.x
- npm hoặc yarn
- MySQL 8.0 (được chạy qua Docker Compose)

### Cài Đặt

1. **Clone repository** (nếu chưa có)
   ```bash
   git clone <repository-url>
   cd mutrapro_system/web-app
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Đảm bảo các microservices đang chạy**
   
   Từ thư mục gốc của dự án, khởi động các services bằng Docker Compose:
   ```bash
   docker-compose up -d
   ```
   
   Các services sẽ chạy trên các ports:
   - Auth Service: `http://localhost:3001`
   - Order Service: `http://localhost:3002`
   - Task Service: `http://localhost:3003`
   - File Service: `http://localhost:3004`
   - Studio Service: `http://localhost:3005`
   - Notification Service: `http://localhost:3006`

4. **Khởi chạy ứng dụng web**
   ```bash
   npm start
   ```

5. **Mở trình duyệt**
   
   Ứng dụng sẽ tự động mở tại [http://localhost:3000](http://localhost:3000)

##  Scripts Có Sẵn

Trong thư mục dự án, bạn có thể chạy:

### `npm start`

Chạy ứng dụng ở chế độ development.\
Mở [http://localhost:3000](http://localhost:3000) để xem trong trình duyệt.

Trang sẽ tự động reload khi bạn thay đổi code.\
Bạn cũng sẽ thấy các lỗi lint trong console.

### `npm test`

Chạy test runner ở chế độ interactive watch mode.\
Xem thêm thông tin về [running tests](https://facebook.github.io/create-react-app/docs/running-tests).

### `npm run build`

Build ứng dụng cho production vào thư mục `build`.\
Code được bundle tối ưu cho production và minified.

Build được tối ưu và sẵn sàng để deploy!

##  Cấu Trúc Dự Án

```
web-app/
├── public/                 # Static files
│   ├── images/            # Hình ảnh và assets
│   └── index.html         # HTML template
├── src/
│   ├── api/               # API clients
│   │   ├── authApi.js
│   │   ├── orderApi.js
│   │   ├── taskApi.js
│   │   ├── fileApi.js
│   │   └── studioApi.js
│   ├── components/        # React components
│   │   ├── Layout.js      # Layout chính
│   │   ├── Navbar.js      # Navigation bar
│   │   ├── ProtectedRoute.js
│   │   └── ...
│   ├── context/           # React Context
│   │   └── AuthContext.js # Authentication context
│   ├── pages/             # Page components
│   │   ├── HomePage.js
│   │   ├── LoginPage.js
│   │   ├── Dashboard.js
│   │   ├── CreateOrderPage.js
│   │   ├── TaskListPage.js
│   │   └── ...
│   ├── App.js            # Main app component
│   └── App.css           # Global styles
└── package.json
```

##  Tính Năng Giao Diện

- **Glassmorphism Design**: Giao diện hiện đại với hiệu ứng glassmorphism
- **Gradient Backgrounds**: Màu sắc gradient đẹp mắt
- **Smooth Animations**: Animations mượt mà cho các tương tác
- **Responsive Design**: Tối ưu cho mọi thiết bị
- **Dark Theme**: Giao diện tối với nền hình ảnh blur

##  Vai Trò Người Dùng

### Customer (Khách hàng)
- Tạo đơn hàng mới
- Xem lịch sử đơn hàng
- Xem chi tiết đơn hàng
- Chỉnh sửa hồ sơ

### Artist (Nghệ sĩ)
- Xem nhiệm vụ được giao
- Đặt lịch phòng thu
- Upload sản phẩm hoàn thành

### Transcriber (Ký âm)
- Xem nhiệm vụ ký âm
- Tải file audio của khách
- Upload file notation hoàn thành

### Arranger (Phối khí)
- Xem nhiệm vụ phối khí
- Tải file notation
- Upload file mix hoàn thành

### Coordinator (Điều phối viên)
- Phân công nhiệm vụ cho chuyên gia
- Xem báo cáo và thống kê
- Quản lý đơn hàng

### Admin (Quản trị viên)
- Xem báo cáo tổng quan
- Thống kê hệ thống

### Studio Admin (Quản lý phòng thu)
- Quản lý phòng thu
- Xem và quản lý lịch đặt

## 🔧 Công Nghệ Sử Dụng

### Frontend
- **React 18.3.1**: UI framework
- **React Router DOM 6.23.1**: Client-side routing
- **Axios 1.7.2**: HTTP client
- **Socket.IO Client 4.8.1**: Real-time communication
- **React Toastify 11.0.5**: Toast notifications
- **Chart.js 4.5.1**: Data visualization
- **React Big Calendar 1.12.2**: Calendar component

### Styling
- **CSS3**: Custom styles với modern effects
- **Google Fonts**: Inter & Poppins

##  API Endpoints

Web app kết nối với các microservices:

- **Auth Service** (`localhost:3001`): Xác thực và quản lý người dùng
- **Order Service** (`localhost:3002`): Quản lý đơn hàng
- **Task Service** (`localhost:3003`): Quản lý nhiệm vụ
- **File Service** (`localhost:3004`): Upload và download file
- **Studio Service** (`localhost:3005`): Quản lý phòng thu
- **Notification Service** (`localhost:3006`): Thông báo real-time (Socket.IO)

##  Xử Lý Lỗi

Nếu gặp vấn đề:

1. **Port đã được sử dụng**: Đảm bảo port 3000 không bị chiếm dụng
2. **API không kết nối được**: Kiểm tra các microservices đã chạy chưa
3. **Database connection**: Kiểm tra MySQL đã được khởi động qua Docker

##  License

MIT License

##  Phát Triển

Dự án được phát triển bởi Nhóm 5 - MuTraPro System

---

**"Designed For Music, Engineered to Last"** 🎵
