#  Giải Thích Các Script Khởi Động

## Tổng Quan

Hai file `start.bat` và `start.sh` là các script tự động hóa việc khởi động hệ thống MuTraPro. Chúng giúp bạn khởi động tất cả services chỉ bằng một lệnh thay vì phải nhớ nhiều lệnh.

---

##  Sự Khác Biệt

### `start.bat` - Cho Windows

- **File extension**: `.bat` (Batch file)
- **Hệ điều hành**: Windows
- **Cách chạy**: Double-click hoặc `start.bat` trong Command Prompt/PowerShell
- **Shell**: Windows Command Prompt hoặc PowerShell

### `start.sh` - Cho Linux/Mac

- **File extension**: `.sh` (Shell script)
- **Hệ điều hành**: Linux, macOS, Unix
- **Cách chạy**: `./start.sh` trong Terminal
- **Shell**: Bash shell
- **Quyền**: Cần quyền thực thi (`chmod +x start.sh`)

---

##  Chi Tiết Từng Bước

### Cả Hai Script Đều Thực Hiện 3 Bước:

#### **Bước 1: Khởi Động Docker Containers**

```bash
# Windows (start.bat)
docker-compose up -d

# Linux/Mac (start.sh)
docker-compose up -d
```

**Mục đích**: 
- Khởi động tất cả services qua Docker Compose
- `-d` = detached mode (chạy background, không chiếm terminal)

**Services được khởi động**:
- MySQL Database (port 3306)
- Auth Service (port 3001)
- Order Service (port 3002)
- Task Service (port 3003)
- File Service (port 3004)
- Studio Service (port 3005)
- Notification Service (port 3006)
- API Gateway (port 3000)

#### **Bước 2: Đợi Services Sẵn Sàng**

```bash
# Windows (start.bat)
timeout /t 10 /nobreak >nul

# Linux/Mac (start.sh)
sleep 10
```

**Mục đích**: 
- Đợi 10 giây để các containers khởi động hoàn toàn
- Đảm bảo database và services đã sẵn sàng nhận kết nối

**Tại sao cần đợi?**:
- Docker containers cần thời gian để khởi động
- MySQL cần thời gian để initialize databases
- Các services cần thời gian để kết nối database

#### **Bước 3: Kiểm Tra Trạng Thái**

```bash
# Cả hai đều giống nhau
docker-compose ps
```

**Mục đích**: 
- Hiển thị trạng thái tất cả containers
- Giúp bạn biết services nào đã chạy thành công

**Kết quả mong đợi**: Tất cả containers có status là "Up"

---

##  Cách Sử Dụng

### Windows - Sử dụng `start.bat`

#### Cách 1: Double-click
1. Mở File Explorer
2. Tìm file `start.bat` trong thư mục gốc `mutrapro_system`
3. Double-click vào file
4. Màn hình Command Prompt sẽ hiện ra và chạy script

#### Cách 2: Command Prompt/PowerShell
```cmd
cd D:\mutrapro_system_nhom5\mutrapro_system
start.bat
```

#### Cách 3: Chạy trực tiếp với docker-compose
```cmd
docker-compose up -d
```

### Linux/Mac - Sử dụng `start.sh`

#### Bước 1: Cấp quyền thực thi (chỉ lần đầu)
```bash
chmod +x start.sh
```

#### Bước 2: Chạy script
```bash
./start.sh
```

#### Hoặc chạy trực tiếp với bash
```bash
bash start.sh
```

---

## Phân Tích Chi Tiết Code

### `start.bat` (Windows)

```batch
@echo off                    # Tắt hiển thị lệnh (chỉ hiện kết quả)
echo ============================================
echo    MuTraPro System - Quick Start Script
echo ============================================
echo.

echo [1/3] Starting Docker containers...
docker-compose up -d         # Khởi động containers

if %errorlevel% neq 0 (     # Kiểm tra lỗi
    echo.
    echo ERROR: Failed to start Docker containers!
    echo Please check if Docker is running.
    pause
    exit /b 1                # Thoát với mã lỗi 1
)

echo.
echo [2/3] Waiting for services to be ready...
timeout /t 10 /nobreak >nul  # Đợi 10 giây (ẩn output)

echo.
echo [3/3] Checking services status...
docker-compose ps            # Hiển thị trạng thái

echo.
echo ============================================
echo    Services started successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Open a new terminal
echo 2. Run: cd web-app
echo 3. Run: npm install (first time only)
echo 4. Run: npm start
echo.
echo API Gateway: http://localhost:3000/health
echo Web App: http://localhost:3000 (after npm start)
echo.
pause                        # Dừng để bạn đọc kết quả
```

**Đặc điểm Windows**:
- `%errorlevel%` - biến kiểm tra mã lỗi trong Windows
- `timeout /t 10` - lệnh đợi của Windows
- `pause` - dừng màn hình để đọc kết quả

### `start.sh` (Linux/Mac)

```bash
#!/bin/bash                  # Shebang - chỉ định dùng bash shell

echo "============================================"
echo "   MuTraPro System - Quick Start Script"
echo "============================================"
echo

echo "[1/3] Starting Docker containers..."
docker-compose up -d

if [ $? -ne 0 ]; then        # Kiểm tra mã trả về (0 = thành công)
    echo
    echo "ERROR: Failed to start Docker containers!"
    echo "Please check if Docker is running."
    exit 1                   # Thoát với mã lỗi 1
fi

echo
echo "[2/3] Waiting for services to be ready..."
sleep 10                     # Đợi 10 giây

echo
echo "[3/3] Checking services status..."
docker-compose ps

echo
echo "============================================"
echo "   Services started successfully!"
echo "============================================"
echo
echo "Next steps:"
echo "1. Open a new terminal"
echo "2. Run: cd web-app"
echo "3. Run: npm install (first time only)"
echo "4. Run: npm start"
echo
echo "API Gateway: http://localhost:3000/health"
echo "Web App: http://localhost:3000 (after npm start)"
echo
```

**Đặc điểm Linux/Mac**:
- `#!/bin/bash` - shebang line
- `$?` - biến lưu mã trả về của lệnh trước
- `sleep 10` - lệnh đợi của Unix/Linux
- Không có `pause` (terminal tự đóng sau khi chạy xong)

---

## So Sánh Nhanh

| Tính Năng | start.bat (Windows) | start.sh (Linux/Mac) |
|-----------|---------------------|----------------------|
| **Cách chạy** | `start.bat` hoặc double-click | `./start.sh` |
| **Quyền thực thi** | Không cần | Cần `chmod +x` |
| **Lệnh đợi** | `timeout /t 10` | `sleep 10` |
| **Kiểm tra lỗi** | `%errorlevel%` | `$?` |
| **Dừng màn hình** | `pause` | Tự đóng |
| **Shebang** | Không có | `#!/bin/bash` |

---

## 🎯 Khi Nào Dùng Script Này?

###  Nên dùng khi:
- Chạy lần đầu để setup hệ thống
- Muốn khởi động nhanh tất cả services
- Không muốn nhớ nhiều lệnh
- Demo hoặc trình bày cho người khác

###  Không cần dùng khi:
- Đã biết rõ các lệnh Docker
- Muốn chạy từng service riêng để debug
- Muốn xem logs real-time ngay từ đầu
- Đang development và cần kiểm soát chi tiết

---

## 🔧 Tùy Chỉnh Script

### Thêm thời gian đợi lâu hơn:

**start.bat**:
```batch
timeout /t 30 /nobreak >nul  # Đợi 30 giây thay vì 10
```

**start.sh**:
```bash
sleep 30                      # Đợi 30 giây thay vì 10
```

### Thêm kiểm tra health check:

**start.sh** (ví dụ):
```bash
echo "Checking API Gateway..."
sleep 5
curl -f http://localhost:3000/health || echo "Warning: API Gateway not ready"
```

### Thêm màu sắc (chỉ Linux/Mac):

**start.sh**:
```bash
GREEN='\033[0;32m'
echo -e "${GREEN}Services started successfully!"
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Docker phải đang chạy**: Script sẽ fail nếu Docker Desktop/Engine chưa khởi động
2. **Ports không bị chiếm**: Đảm bảo ports 3000-3006 và 3306 không bị sử dụng
3. **Quyền truy cập**: Trên Linux/Mac có thể cần `sudo` nếu có vấn đề quyền
4. **Lần đầu tiên**: Mất 5-10 phút để tải images, script chỉ đợi 10 giây
5. **Sau khi chạy script**: Vẫn cần chạy `npm start` trong `web-app` để khởi động frontend

---

##  Xử Lý Lỗi

### Script báo lỗi "Docker is not running"

**Giải pháp**:
- Windows: Mở Docker Desktop
- Linux: `sudo systemctl start docker`
- Mac: Mở Docker Desktop

### Script chạy nhưng containers không start

**Kiểm tra**:
```bash
docker-compose ps
docker-compose logs
```

### Script chạy quá nhanh, services chưa sẵn sàng

**Giải pháp**: Tăng thời gian đợi trong script (sửa `sleep 10` thành `sleep 20`)

---

##  Tóm Tắt

| | start.bat | start.sh |
|---|-----------|----------|
| **OS** | Windows | Linux/Mac |
| **Chạy** | `start.bat` | `./start.sh` |
| **Chức năng** | Khởi động tất cả Docker services | Khởi động tất cả Docker services |
| **Lợi ích** | Đơn giản, nhanh, tự động | Đơn giản, nhanh, tự động |

**Kết luận**: Cả hai script đều giúp bạn khởi động hệ thống nhanh chóng chỉ bằng một lệnh, tiết kiệm thời gian và tránh nhầm lẫn!

---

**"Designed For Music, Engineered to Last"** 🎵

