# Sử dụng image Node.js phiên bản 18
FROM node:18-alpine

# Tạo thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Mở port 3001 để bên ngoài có thể truy cập
EXPOSE 3001

# Lệnh để khởi chạy ứng dụng
CMD ["node", "index.js"]