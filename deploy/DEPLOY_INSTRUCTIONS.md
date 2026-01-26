# FocusGuard VPS Deployment Instructions

## Architecture

```
Internet → nginx (host:80/443) → Docker container (localhost:3010)
```

## First-Time Setup on VPS

### 1. Create project directory

```bash
mkdir -p ~/apps/focusguard
cd ~/apps/focusguard
```

### 2. Clone or copy the project

```bash
git clone https://github.com/PominausGH/focusguard.git .
# Or copy files via SCP
```

### 3. Build and start Docker container

```bash
docker compose up -d --build
```

### 4. Verify container is running

```bash
docker compose ps
curl http://localhost:3010  # Should return HTML
```

### 5. Configure nginx reverse proxy

```bash
# Copy the nginx config
sudo cp deploy/nginx-site.conf /etc/nginx/sites-available/focusguard

# Edit and change the domain name
sudo nano /etc/nginx/sites-available/focusguard

# Enable the site
sudo ln -s /etc/nginx/sites-available/focusguard /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### 6. (Optional) Set up SSL with Let's Encrypt

```bash
sudo certbot --nginx -d focusguard.yourdomain.com
```

## Updating the App

### Option A: Manual update

```bash
cd ~/apps/focusguard
git pull
docker compose up -d --build
docker image prune -f
```

### Option B: GitHub Actions (automatic)

Add these secrets to your GitHub repo:

- `VPS_HOST`: Your VPS IP or hostname
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: Private SSH key contents
- `VPS_DEPLOY_PATH`: `/home/youruser/apps/focusguard`

Then push to `master` branch to auto-deploy.

## Useful Commands

```bash
# View logs
docker compose logs -f

# Restart container
docker compose restart

# Stop container
docker compose down

# Rebuild from scratch
docker compose down
docker compose up -d --build --force-recreate

# Check container health
docker compose ps
docker inspect focusguard --format='{{.State.Health.Status}}'
```

## Port Reference

- **3010**: FocusGuard (change in docker-compose.yml if conflicts)

## Troubleshooting

### Container won't start

```bash
docker compose logs focusguard
```

### 502 Bad Gateway from nginx

```bash
# Check if container is running
docker compose ps

# Check if port is accessible
curl http://localhost:3010
```

### Build fails

```bash
# Build with verbose output
docker compose build --no-cache --progress=plain
```
