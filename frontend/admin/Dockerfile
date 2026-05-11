# =========================
# Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# install deps 
RUN npm ci

COPY . .

# build (tsc + refine build)
RUN npm run build


# =========================
# Nginx
# =========================
FROM nginx:alpine

# remove default config
RUN rm -rf /etc/nginx/conf.d/default.conf

# copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
