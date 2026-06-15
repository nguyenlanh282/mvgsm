# Deploy MV-GSM lên Dokploy

## Mục lục
1. [Yêu cầu](#1-yêu-cầu)
2. [Kiến trúc](#2-kiến-trúc)
3. [Setup PostgreSQL](#3-setup-postgresql)
4. [Deploy Web App](#4-deploy-web-app)
5. [Di chuyển data từ Cloudflare D1](#5-di-chuyển-data-từ-cloudflare-d1)
6. [Cấu hình Domain](#6-cấu-hình-domain)
7. [ Troubleshooting](#7-troubleshooting)

---

## 1. Yêu cầu

- Dokploy account với server Ubuntu
- PostgreSQL database (từ Dokploy hoặc external)
- GitHub repo đã có code

---

## 2. Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                      Dokploy Server                        │
│  ┌─────────────┐      ┌─────────────────┐                │
│  │  PostgreSQL │      │   mvgsm-web     │                │
│  │  (Port 5432)│      │  (Docker:3000)  │                │
│  └─────────────┘      └─────────────────┘                │
│         │                      │                           │
│         └──────────────────────                          │
│                    External API                            │
│         (Cloudflare Workers - hiện tại)                   │
└─────────────────────────────────────────────────────────────┘
```

**Lưu ý:** API đang chạy trên Cloudflare Workers với D1/KV/R2 bindings. Không thể containerize được vì phụ thuộc vào Cloudflare runtime.

---

## 3. Setup PostgreSQL

### 3.1 Tạo Database trên Dokploy

1. Đăng nhập Dokploy → **Databases** → **Create Database**
2. Chọn **PostgreSQL**
3. Điền thông tin:
   - **Name:** `mvgsm-db`
   - **Username:** `mvgsm_user`
   - **Password:** `<strong-password>`
4. Sau khi tạo xong, lưu lại connection string:

```
postgresql://mvgsm_user:<password>@<server-ip>:5432/mvgsm_db
```

### 3.2 Cấu hình biến môi trường

Trên server, tạo file `.env`:

```bash
# Database
DATABASE_URL=postgresql://mvgsm_user:password@localhost:5432/mvgsm_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=28800
REFRESH_EXPIRES_IN=2592000

# API URL (trỏ đến Cloudflare Workers hiện tại)
NEXT_PUBLIC_API_URL=https://goal-manager-api.admin-tripower-account.workers.dev
```

---

## 4. Deploy Web App

### 4.1 Tạo Project trên Dokploy

1. **Projects** → **Create Project**
2. Điền thông tin:
   - **Name:** `mvgsm-web`
   - **Type:** `Docker`
   - **Repository:** `https://github.com/nguyenlanh282/mvgsm`
3. Branch: `main`

### 4.2 Cấu hình Build

Trong phần **Build Configuration**:

| Setting | Value |
|---------|-------|
| Build Method | `Dockerfile` |
| Dockerfile Path | `Dockerfile` |
| Container Port | `3000` |

### 4.3 Cấu hình Environment

Trong phần **Environment Variables**, thêm:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goal-manager-api.admin-tripower-account.workers.dev
```

### 4.4 Deploy

1. Click **Deploy Now**
2. Theo dõi logs trong **Real-time Logs**
3. Sau khi deploy thành công, app sẽ chạy ở port 3000

---

## 5. Di chuyển data từ Cloudflare D1

### 5.1 Export data từ D1

```bash
# Login Cloudflare
wrangler login

# Export schema
wrangler d1 export goal-manager-db --output=./migration.sql
```

### 5.2 Chuyển đổi syntax

D1 dùng SQLite syntax. Cần chuyển sang PostgreSQL:

```sql
-- Ví dụ: D1 syntax
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- PostgreSQL syntax
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Import vào PostgreSQL

```bash
# Kết nối PostgreSQL
psql $DATABASE_URL -f ./migration.sql
```

### 5.4 Lưu ý quan trọng

| D1 (SQLite) | PostgreSQL |
|-------------|------------|
| `TEXT` | `VARCHAR` hoặc `TEXT` |
| `INTEGER PRIMARY KEY` | `SERIAL PRIMARY KEY` hoặc `UUID` |
| `strftime('%s', 'now')` | `CURRENT_TIMESTAMP` |
| `AUTOINCREMENT` | `SERIAL` |
| `INTEGER DEFAULT (strftime...)` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |

---

## 6. Cấu hình Domain

### 6.1 Custom Domain

1. **Projects** → `mvgsm-web` → **Domains**
2. Click **Add Domain**
3. Nhập domain: `mvgsm.yourcompany.com`
4. Dokploy sẽ tự động tạo SSL certificate

### 6.2 SSL

Dokploy tự động cấu hình Let's Encrypt SSL. Không cần làm gì thêm.

---

## 7. Troubleshooting

### 7.1 Container không start

```bash
# Kiểm tra logs
docker logs mvgsm-web

# Kiểm tra port
lsof -i :3000
```

### 7.2 Lỗi kết nối Database

```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Kiểm tra logs app
docker logs mvgsm-web | grep -i error
```

### 7.3 Lỗi 502 Bad Gateway

- Container có thể chưa ready
- Kiểm tra health check endpoint
- Restart container

### 7.4 Build failed

```bash
# Local build test
docker build -t mvgsm-web .
docker run -p 3000:3000 mvgsm-web
```

---

## Commands hữu ích

```bash
# Xem logs
docker logs -f mvgsm-web

# Restart container
docker restart mvgsm-web

# Shell vào container
docker exec -it mvgsm-web sh

# Kiểm tra environment
docker exec mvgsm-web env | grep -E "DATABASE|NEXT_PUBLIC"
```

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- **Dokploy Docs:** https://docs.dokploy.com
- **Logs** trong Dokploy dashboard
- **GitHub Issues** của project
