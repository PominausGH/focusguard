# FocusShield

React Native/Expo web app with Node.js/PostgreSQL backend.

## Tech Stack

- **Frontend**: React Native with Expo SDK 54, Expo Router
- **Backend**: Node.js, Express, PostgreSQL
- **Auth**: JWT tokens
- **State**: React Context + API calls (demo mode uses AsyncStorage)
- **Language**: TypeScript/JavaScript

## Deployment

- **Domain**: focusshield.app (landing), app.focusshield.app (React app)
- **Containers**: frontend (3012), api (3011), db (PostgreSQL)
- **Docker path on VPS**: `/opt/docker/focusguard`

### Deploy Commands

```bash
# Local - commit and push
git add -A && git commit -m "message" && git push

# VPS - deploy
ssh root@69.62.79.159
cd /opt/docker/focusguard
git pull
docker compose up -d --build --force-recreate
```

### Architecture

```
Internet → Cloudflare → NPM (80/443)
  ├── focusshield.app → frontend:3012 → landing.html
  ├── app.focusshield.app → frontend:3012 → React SPA
  └── */api → api:3011 → Express API → PostgreSQL
```

## Local Development

```bash
npm start          # Start Expo dev server
npm run web        # Run in browser
npm run android    # Run on Android
npm run ios        # Run on iOS
npm test           # Run Jest tests
```

## Structure

- `app/` - Expo Router screens (index.tsx, auth.tsx, (tabs)/)
- `components/` - Reusable components
- `contexts/` - AuthContext, TaskContext (API or demo mode)
- `services/` - api.ts, analytics.ts, validation.ts
- `backend/` - Express API (routes/, models/, middleware/)
- `public/` - landing.html, privacy.html

## Environment Variables

### Frontend (.env)

```
EXPO_PUBLIC_API_URL=https://app.focusshield.app/api
```

### Backend (backend/.env)

```
DATABASE_URL=postgresql://focusshield:password@db:5432/focusshield
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
```

## Demo Mode

Both AuthContext and TaskContext have `DEMO_MODE` flag:

- `true` = Uses AsyncStorage (no backend needed)
- `false` = Uses API calls to backend

## Key Files

| File                       | Purpose                  |
| -------------------------- | ------------------------ |
| `contexts/AuthContext.tsx` | Auth state, login/signup |
| `contexts/TaskContext.tsx` | Task CRUD operations     |
| `services/api.ts`          | HTTP client for backend  |
| `nginx.conf`               | Container routing        |
| `docker-compose.yml`       | All services             |
| `public/landing.html`      | Marketing page           |
