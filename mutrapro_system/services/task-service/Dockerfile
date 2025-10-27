# Sử dụng image Node.js phiên bản 18-alpine
FROM node:18-alpine

# Tạo thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json
COPY package*.json ./

# Cài đặt các thư viện cần thiết
RUN npm install

# Sao chép toàn bộ mã nguồn của service
COPY . .

# Mở port 3003 của container
EXPOSE 3003

# Lệnh khởi chạy ứng dụng
CMD ["node", "index.js"]