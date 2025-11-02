🎶 Hệ thống MuTraPro
MuTraPro (Music Transcription & Production) là một nền tảng tích hợp, được xây dựng trên kiến trúc microservices, cung cấp các dịch vụ ký âm, phối khí và sản xuất âm nhạc theo yêu cầu một cách hiệu quả và liền mạch.
Hệ thống cho phép khách hàng chuyển đổi bất kỳ tệp âm thanh đầu vào nào thành bản ký âm chi tiết, yêu cầu phối khí tùy chỉnh, và kết hợp thu âm chuyên nghiệp. Toàn bộ quy trình được quản lý chặt chẽ từ khi nhận yêu cầu, phân công nhiệm vụ, đến khi bàn giao sản phẩm cuối cùng.
🚀 Tính năng nổi bật
•	Quản lý Dịch vụ: Khách hàng upload file âm thanh (MP3, WAV, MP4...) để yêu cầu Ký âm, Phối khí, hoặc Thu âm.
•	Quản lý Quy trình (Workflow):
  o	Điều phối viên (Coordinator) tiếp nhận và phân công nhiệm vụ cho các chuyên viên.
  o	Chuyên viên (Specialist) nhận việc, xử lý, và nộp sản phẩm.
  o	Khách hàng (Customer) theo dõi tiến độ, thanh toán, và gửi phản hồi/yêu cầu chỉnh sửa (revision).
•	Quản lý Phòng thu: Nghệ sĩ (Artist) có thể đặt lịch phòng thu. Quản trị viên phòng thu (Studio Admin) quản lý trạng thái và lịch làm việc của phòng thu.
•	Thông báo Real-time: Sử dụng WebSockets (Socket.io) để gửi thông báo tức thời về đơn hàng mới, nhiệm vụ mới, cập nhật trạng thái...
•	Quản trị Hệ thống: Admin có toàn quyền quản lý người dùng (CRUD) và xem báo cáo thống kê doanh thu, đơn hàng.

🛠️ Công nghệ sử dụng
Backend (Microservices): Node.js, Express.js, MySQL (với mysql2/promise)
Frontend: React.js, React Router, Axios, Socket.io Client
Cơ sở dữ liệu: MySQL 8.0
Containerization: Docker, Docker Compose
Web Server (Frontend): Nginx (để phục vụ React app đã build)
Xác thực: JSON Web Tokens (JWT)
Upload File: Multer (trong file-service)

🏛️ Kiến trúc hệ thống
Project được xây dựng theo kiến trúc Microservices, giao tiếp với nhau qua các lời gọi API nội bộ (và docker-compose quản lý network):
•	mysql_db (Port 3306): Dịch vụ cơ sở dữ liệu MySQL1111.
•	auth-service (Port 3001): Xử lý đăng ký, đăng nhập, phân quyền (JWT), và CRUD người dùng222.
•	order-service (Port 3002): Xử lý logic tạo đơn hàng, thanh toán, và feedback333.
•	task-service (Port 3003): Xử lý việc phân công và cập nhật trạng thái công việc444.
•	file-service (Port 3004): Xử lý upload (Multer) và download file cho các đơn hàng555.
•	studio-service (Port 3005): Xử lý logic phòng thu và đặt lịch (booking)666.
•	notification-service (Port 3006): Xử lý thông báo real-time qua Socket.io777.
•	web-app (Port 3000): Giao diện React phục vụ cho tất cả người dùng qua Nginx888.

📋 Yêu cầu hệ thống
Trước khi bắt đầu, bạn cần cài đặt:
1.	Docker: Tải Docker Desktop
2.	Docker Compose: (Thường đi kèm với Docker Desktop)
3.	Git: (Để clone project)
4.	Trình duyệt web (Chrome, Firefox...)
Lưu ý: Bạn không cần cài đặt Node.js hay MySQL trên máy cá nhân, vì Docker sẽ lo việc đó.

🚀 Cài đặt và Khởi chạy
Đây là các bước chi tiết để chạy toàn bộ hệ thống trên máy của bạn.
1. Clone Project
Bash
# Clone repository về máy (thay bằng URL repo của bạn)
git clone https://github.com/your-username/mutrapro_system.git

# Di chuyển vào thư mục gốc của project
cd mutrapro_system
2. Tạo file môi trường (.env)
Tạo một file mới tên là .env 9 trong thư mục gốc (mutrapro_system/) và sao chép nội dung bên dưới vào. File này chứa các biến môi trường mà docker-compose.yml sẽ sử dụng.
Ini, TOML
# Mật khẩu cho user 'root' của MySQL
DB_PASSWORD=123456

# Chuỗi bí mật để mã hóa JWT
# BẮT BUỘC đổi chuỗi này thành một chuỗi ngẫu nhiên, dài và phức tạp
JWT_SECRET=daylamotcaisupersecretkeyratlaannin_haydoithanhgiatrikhac
(Nội dung này được lấy từ file .env và docker-compose.yml của bạn).
3. Build và Chạy Docker
Mở terminal của bạn ngay tại thư mục gốc (mutrapro_system/) và chạy lệnh sau:
Bash
# Lệnh này sẽ:
# 1. Build images cho tất cả các services (auth, order, web-app...)
# 2. Khởi tạo các container
# 3. Tạo network và volume
# 4. Chạy ở chế độ "detached" (chạy ngầm)
docker-compose up --build -d
Lần chạy đầu tiên có thể mất vài phút để tải image MySQL và build các service.
4. Kiểm tra trạng thái
Sau khi chạy xong, bạn có thể kiểm tra xem tất cả các container đã "up" và "healthy" chưa:
Bash
docker-compose ps
Bạn sẽ thấy một danh sách các service đang chạy, bao gồm mysql_db, auth-service, web-app...
5. Dừng hệ thống
Để dừng toàn bộ hệ thống, chạy lệnh:
Bash
docker-compose down

🌐 Truy cập hệ thống
Sau khi đã khởi chạy thành công (docker-compose up), bạn có thể truy cập hệ thống:
•	Trang Web (Frontend):
o	http://localhost:3000
•	Các API (Backend - Dùng để test bằng Postman/Insomnia):
o	Auth Service: http://localhost:3001
o	Order Service: http://localhost:3002
o	Task Service: http://localhost:3003
o	File Service: http://localhost:3004
o	Studio Service: http://localhost:3005
o	Notification Service: http://localhost:3006

🔑 Tài khoản mẫu
Hệ thống đã tự động tạo sẵn các tài khoản mẫu (từ file init.sql) để bạn kiểm tra các vai trò.
Mật khẩu chung cho tất cả tài khoản: Admin@123
Admin: admin@mutrapro.com
Điều phối viên (Coordinator): dpv@mutrapro.com
Chuyên viên Ký âm (Transcriber): cvka@mutrapro.com
Chuyên viên Phối khí (Arranger): cvpk@mutrapro.com
Nghệ sĩ (Artist):  artist@mutrapro.com
Quản trị Phòng thu (Studio Admin): studio@mutrapro.com

🔧 Xử lý sự cố (Troubleshooting)
Reset cơ sở dữ liệu
Nếu bạn muốn xóa toàn bộ dữ liệu (bao gồm cả các tài khoản, đơn hàng) và bắt đầu lại từ đầu (để init.sql chạy lại), hãy làm theo các bước sau:
Bash
# 1. Dừng tất cả container VÀ xóa volume
# (Cờ -v sẽ xóa volume 'mysql_data' được định nghĩa trong compose file)
docker-compose down -v

# 2. Build lại và khởi động lại
docker-compose up --build -d
Xem Log của một Service cụ thể
Nếu một service bị lỗi (ví dụ: order-service), bạn có thể xem log của nó:
Bash
docker-compose logs -f order-service
(Thay order-service bằng tên service bạn muốn xem, ví dụ: auth-service, web-app...)

