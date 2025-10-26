# Sử dụng image Node.js phiên bản 18-alpine
FROM node:18-alpine

# Tạo thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json (nếu có)
COPY package*.json ./

# Chạy lệnh cài đặt các thư viện
RUN npm install

# Sao chép toàn bộ mã nguồn của service
COPY . .

# Mở port 3004 của container
EXPOSE 3004

# Lệnh mặc định để khởi chạy ứng dụng
CMD ["node", "index.js"]