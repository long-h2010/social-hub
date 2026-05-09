# ----------------------
# Stage 1: Dependencies 
# ----------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files trước để cache layer npm install
COPY package*.json ./
COPY tsconfig*.json ./

# Cài dependencies 
RUN npm ci

# ----------------------
# Stage 2: Build ứng dụng
# ----------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps từ stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build NestJS tạo thư mục dist/
RUN npm run build

# Xóa devDependencies để chỉ giữ production deps
RUN npm prune --production

# ----------------------
# Stage 3: Production runtime 
# ----------------------
FROM node:20-alpine AS runner

# Tạo user non-root để tăng bảo mật
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy chỉ những gì cần thiết từ builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Chuyển sang user non-root
USER nestjs

# Expose port
EXPOSE ${PORT:-3000}

# Chạy ứng dụng 
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
