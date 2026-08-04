# frontend/Dockerfile
# --- STAGE 1: Build React/Vite ---
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json và cài đặt thư viện
COPY package.json package-lock.json ./
RUN npm install

# Copy source code và build dự án
# (Lệnh COPY này cũng sẽ tự động mang theo file frontend/.env để build cùng)
COPY . .
RUN npm run build

# --- STAGE 2: Triển khai với Nginx ---
FROM nginx:alpine

# Copy thư mục dist sau khi build sang Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx để hỗ trợ React Router (tránh lỗi 404 khi F5)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]