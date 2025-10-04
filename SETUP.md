# Wryft — Local and Ubuntu VPS Setup

This guide shows how to run the project locally on your machine and how to deploy it to an Ubuntu VPS.

## Project layout
- Server: `server/` (Node + Express + Prisma + SQLite)
- Client: `src/` (Vite + React + TypeScript)

## Requirements
- Node.js 18+ and npm
- Git
- For Ubuntu: a non-root user with sudo

---

## 1) Local Development (Windows/macOS/Linux)

### 1.1 Clone and install
```bash
# clone
git clone <your-repo-url> wryft
cd wryft

# install client deps (root)
npm install

# install server deps
cd server
npm install
```

### 1.2 Configure environment
Create `server/.env` with:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-change-me"
INVITE_CODE="your-invite-code"
PORT=4000
```
Client uses `VITE_API_URL` (optional). If not set, it defaults to `http://localhost:4000`.

Optionally create `./.env` at the project root with:
```env
VITE_API_URL=http://localhost:4000
```

### 1.3 Migrate database
```bash
cd server
npx prisma migrate dev -n init
```
This generates `dev.db` (SQLite) and Prisma client.

### 1.4 Run the server (dev)
```bash
cd server
npm run dev
```
Server runs at `http://localhost:4000`.

### 1.5 Run the client (dev)
Open a new terminal at repo root:
```bash
npm run dev
```
Vite runs at `http://localhost:5173` by default.

### 1.6 Invite-only registration
Registration requires an invite code. Set `INVITE_CODE` in `server/.env`, then when registering in the UI, provide that code.

### 1.7 Useful server endpoints
- Health: `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Posts: `GET /api/posts`, `POST /api/posts` (auth), `DELETE /api/posts` (dev util, auth)
- Profiles: `GET /api/users/:username`, `GET /api/users/:username/posts`

### 1.8 Reset / clear DB during dev
- Reset all tables:
```bash
cd server
npx prisma migrate reset
```
- Clear only posts (dev util):
```bash
# while logged-in (token in localStorage)
fetch('http://localhost:4000/api/posts', {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)
```

---

## 2) Ubuntu VPS Deployment (Node + PM2 + Nginx)

Assumptions:
- Domain points to your server (A record)
- You’ll serve client on `:5173` (or built and served statically) and API on `:4000`. Recommended: proxy both behind Nginx.

### 2.1 Install dependencies
```bash
# update
sudo apt update && sudo apt -y upgrade

# install Node (using NodeSource) — Node 20 example
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential git

# PM2 for process management
sudo npm i -g pm2

# Nginx for reverse proxy
sudo apt install -y nginx
```

### 2.2 Clone repo and install
```bash
cd /var/www
sudo mkdir wryft && sudo chown $USER:$USER wryft
cd wryft

git clone <your-repo-url> .

# client deps
npm install

# server deps
cd server
npm install
```

### 2.3 Configure environment (server)
Create `/var/www/wryft/server/.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-please"
INVITE_CODE="your-invite-code"
PORT=4000
```

Optional client env at `/var/www/wryft/.env`:
```env
VITE_API_URL=https://your-domain.com
```

### 2.4 Migrate database
```bash
cd /var/www/wryft/server
npx prisma migrate deploy
```

### 2.5 Start processes with PM2
```bash
# API server
cd /var/www/wryft/server
pm2 start npm --name wryft-api -- run dev

# Client (dev server) — or build and serve statically below
cd /var/www/wryft
pm2 start npm --name wryft-web -- run dev

# save and enable startup
pm2 save
pm2 startup
# follow the printed command to enable PM2 on boot, e.g.:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u <user> --hp /home/<user>
```

### 2.6 Optional: Build client for production
```bash
cd /var/www/wryft
npm run build
# Vite outputs to dist/
```
You can serve `dist/` with Nginx directly (recommended for prod), or continue with the dev server via PM2 for quick testing.

### 2.7 Nginx reverse proxy
Create `/etc/nginx/sites-available/wryft`:
```nginx
server {
  listen 80;
  server_name your-domain.com;

  # Proxy API to Node server
  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Serve built client
  root /var/www/wryft/dist;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```
Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/wryft /etc/nginx/sites-enabled/wryft
sudo nginx -t
sudo systemctl reload nginx
```

### 2.8 HTTPS (Let’s Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2.9 Update & logs
```bash
# pull latest
cd /var/www/wryft
git pull

# restart processes
pm2 restart wryft-api
pm2 restart wryft-web

# logs
pm2 logs wryft-api
pm2 logs wryft-web
```

---

## Troubleshooting
- **CORS**: Server uses `cors({ origin: true, credentials: true })`. Ensure client hits the correct URL (`VITE_API_URL`).
- **Invite code**: 403 on register → set `INVITE_CODE` in `server/.env` and include it in the UI.
- **DB not migrated**: run `npx prisma migrate dev` locally, `npx prisma migrate deploy` on VPS.
- **Ports blocked**: open firewall for 80/443 if using Nginx; only expose Node ports internally.
- **Clearing posts**: use `DELETE /api/posts` while authenticated.

---

## Quick commands (copy/paste)

Local (two terminals):
```bash
# Terminal A
cd server && npm run dev
# Terminal B
npm run dev
```

Ubuntu (API + static client):
```bash
# after clone and install
cd server && npx prisma migrate deploy && pm2 start npm --name wryft-api -- run dev && pm2 save
cd .. && npm run build
# set up nginx to serve /dist and proxy /api to :4000, then:
sudo nginx -t && sudo systemctl reload nginx
```
