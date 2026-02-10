# 1Ummah - Connect Globally

An open-source, democratic, transparent, and rewarding social media platform. Alternative to Facebook, Instagram, and Twitter — owned by the community.

**Website:** [1ummah.me](https://1ummah.me)

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Backend:** Express 5, Prisma ORM, PostgreSQL 16
- **Cache/Queue:** Redis 7, BullMQ
- **Real-time:** WebSocket
- **Blockchain:** 1UMMAH token (ethers.js)
- **Deployment:** AWS (ECS Fargate, RDS, S3, CloudFront)

## Project Structure

```
1ummah4humanity/
  packages/shared/        # Shared TypeScript types, constants, validators
  apps/
    web/                  # Next.js frontend (port 3000)
    api/                  # Express.js backend (port 4000)
  infra/
    docker/               # Dockerfiles and docker-compose
    terraform/            # AWS infrastructure (IaC)
  .github/workflows/      # CI/CD pipeline
```

## Quick Start

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose (for database services)

### Development Setup

```bash
# Clone the repo
git clone https://github.com/malifatih/1ummah4humanity.git
cd 1ummah4humanity

# Install dependencies
npm install

# Start PostgreSQL and Redis via Docker
docker compose -f infra/docker/docker-compose.yml up postgres redis -d

# Copy env file and configure
cp apps/api/.env.example apps/api/.env

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start both frontend and backend in development mode
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health: http://localhost:4000/api/v1/health

### Demo Credentials

After seeding, you can login with:
- **Username:** `demo_user` | **Password:** `password123`
- **Username:** `admin` | **Password:** `password123`

### Docker (Full Stack)

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

## API Endpoints

All endpoints under `/api/v1/`:

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/wallet/challenge`, `/auth/wallet/verify`, `GET /auth/me` |
| Users | `GET /users/:username`, `PATCH /users/me`, `POST /users/:username/follow` |
| Posts | `POST /posts`, `GET /posts/:id`, `DELETE /posts/:id`, `POST /posts/:id/like`, `/posts/:id/repost`, `/posts/:id/bookmark` |
| Feed | `GET /feed/home`, `/feed/following`, `/feed/explore`, `/feed/trending/hashtags` |

## Contributing

All developers are welcome to collaborate! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Open source - see repository for details.
