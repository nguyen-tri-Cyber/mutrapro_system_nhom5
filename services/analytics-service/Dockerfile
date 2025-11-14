# Sử dụng base image Node.js
FROM node:18-alpine
# Đặt thư mục làm việc
WORKDIR /app
# Sao chép package.json và cài đặt
COPY package*.json ./
RUN npm install
# Sao chép code shared
COPY shared ./shared
# Sao chép code của service này
COPY services/analytics-service .
# Mở port
EXPOSE 3008
# Chạy service
CMD ["node", "index.js"]