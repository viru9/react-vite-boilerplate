# Environment Configuration Templates

This directory contains environment configuration templates for different development and deployment scenarios.

## Usage

Copy the appropriate template to `.env` in the project root based on your development setup:

```bash
# Choose one and copy to .env
cp config-templates/local-development.env .env
cp config-templates/docker-development.env .env
cp config-templates/local-frontend-docker-backend.env .env
cp config-templates/docker-frontend-local-backend.env .env
cp config-templates/production-native.env .env
cp config-templates/production-docker.env .env
```

## Available Configurations

### Development Scenarios

| Template | Frontend | Backend | Frontend Port | Backend Port | Use Case |
|----------|----------|---------|---------------|--------------|----------|
| `local-development.env` | Local | Local | 5173 | 3000 | Full local development |
| `docker-development.env` | Docker | Docker | 8080 | 8000 | Full Docker development |
| `local-frontend-docker-backend.env` | Local | Docker | 5173 | 8000 | Frontend development with stable backend |
| `docker-frontend-local-backend.env` | Docker | Local | 8080 | 3000 | Testing frontend builds with local backend |

### Production Scenarios

| Template | Deployment Type | Description |
|----------|----------------|-------------|
| `production-native.env` | Native | Direct server deployment with reverse proxy |
| `production-docker.env` | Docker | Containerized deployment with orchestration |

## Quick Setup Commands

### Scenario 1: Both Local (Recommended for new developers)
```bash
# Backend
cd backend
npm run start:dev  # Port 3000

# Frontend
cd ../react-boilerplate
cp config-templates/local-development.env .env
npm run dev        # Port 5173 → calls localhost:3000
```

### Scenario 2: Both Docker (Recommended for team consistency)
```bash
# Backend
cd backend
docker-compose up -d  # Port 8000

# Frontend
cd ../react-boilerplate
cp config-templates/docker-development.env .env
docker-compose up -d  # Port 8080 → calls localhost:8000
```

### Scenario 3: Local Frontend, Docker Backend (Best of both worlds)
```bash
# Backend
cd backend
docker-compose up -d  # Port 8000

# Frontend
cd ../react-boilerplate
cp config-templates/local-frontend-docker-backend.env .env
npm run dev          # Port 5173 → calls localhost:8000
```

## Environment Variables

### Development Variables
- `VITE_API_BASE_URL`: Backend API endpoint
- `VITE_WS_BASE_URL`: WebSocket endpoint for real-time features
- `VITE_API_TIMEOUT`: Request timeout in milliseconds
- `VITE_TOKEN_KEY`: Local storage key for auth token
- `VITE_REFRESH_TOKEN_KEY`: Local storage key for refresh token
- `VITE_APP_NAME`: Application name for branding

### Production Variables
For production deployments, replace `yourdomain.com` with your actual domain:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_WS_BASE_URL=wss://api.yourdomain.com
```

## Port Reference

| Environment | Frontend Port | Backend Port |
|-------------|---------------|--------------|
| Local Development | 5173 | 3000 |
| Docker Development | 8080 | 8000 |
| Production Native | 80/443 | 3000 (behind proxy) |
| Production Docker | 80/443 | 8000 (behind proxy) |

## Troubleshooting

### Port Conflicts
If you get "port already in use" errors:

1. Check what's running: `netstat -ano | findstr :PORT`
2. Kill the process: `taskkill /PID <process_id> /F`
3. Or use different configuration template

### API Connection Issues
1. Verify backend is running on expected port
2. Check CORS configuration in backend
3. Ensure correct API base URL in your .env file
4. Test API directly: `curl http://localhost:PORT/api/v1/health`

## Notes

- Always restart your development servers after changing .env files
- The `.env` file is gitignored for security
- Production builds require environment variables to be available at build time
- WebSocket URLs use `ws://` for development and `wss://` for production
