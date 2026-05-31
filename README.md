# MV-GSM Goal Manager

Hệ thống Quản trị Mục tiêu Doanh nghiệp - Cloudflare-native (Pages + Workers + D1 + R2 + KV)

## Architecture

```
apps/
├── web/          # Next.js frontend (Cloudflare Pages)
│   └── app/      # App router pages
└── api/          # Cloudflare Workers backend
    └── src/
        ├── routes/     # API endpoints
        ├── middleware/  # Auth, role middleware
        ├── db/          # D1 queries
        └── utils/       # JWT, audit, progress utils

packages/
└── shared/      # Shared types

migrations/       # D1 SQL migrations
```

## Setup

```bash
# Install dependencies
npm install

# Setup D1 database
npm run db:migrate

# Run development
npm run dev:web      # Next.js on :3000
npm run dev:api      # Workers on :8787
```

## Features

- **Authentication**: JWT with refresh tokens (HMAC-SHA256)
- **Goals**: CRUD for 6-pillar goals with weekly tracking
- **Progress Tracking**: ActualProgress, ExpectedProgress, HealthScore
- **Financial**: Monthly actuals, targets, Five-Way analysis
- **Personal KPI**: Sales calculator for staff
- **Reward Approvals**: 3-step approval workflow
- **Notifications**: In-app badges
- **Activity Feed**: Recent updates
- **PDF Reports**: Client-side generation

## PRD

See `PRD_GoalManager_MVGSM_v1.3.1_Final_Freeze.md` for full specification.
