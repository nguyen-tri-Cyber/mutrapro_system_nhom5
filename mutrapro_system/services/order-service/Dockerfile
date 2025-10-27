# Sử dụng image Node.js phiên bản 18-alpine (bản gọn nhẹ)
FROM node:18-alpine

# Tạo thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json vào trước
# Docker sẽ cache lại bước này, giúp build nhanh hơn nếu không có thay đổi về thư viện
COPY package*.json ./

# Chạy lệnh cài đặt các thư viện đã định nghĩa trong package.json
RUN npm install

# Sao chép toàn bộ mã nguồn của service vào thư mục làm việc
COPY . .

# Mở port 3002 của container để cho phép kết nối từ bên ngoài
EXPOSE 3002

# Lệnh mặc định để khởi chạy ứng dụng khi container bắt đầu
CMD ["node", "index.js"]