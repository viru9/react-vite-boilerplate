# Port Configuration Testing Guide

This guide helps you verify that all development scenarios work correctly after the port configuration changes.

## Pre-Testing Setup

1. **Stop all running services** to avoid conflicts:
```bash
# Stop any running Docker containers
docker-compose down
cd ../backend && docker-compose down

# Kill any processes using our ports
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5173  
netstat -ano | findstr :8000
netstat -ano | findstr :8080
# Kill processes if found: taskkill /PID <process_id> /F

# macOS/Linux:
lsof -ti :3000 :5173 :8000 :8080 | xargs kill -9
```

## Test Scenarios

### ✅ Scenario 1: Both Local Development

**Setup:**
```bash
# Terminal 1: Start Backend Local
cd backend
npm install  # if not done already
npm run start:dev  # Should start on port 3000

# Terminal 2: Start Frontend Local  
cd react-boilerplate
npm install  # if not done already
cp config-templates/local-development.env .env
npm run dev  # Should start on port 5173
```

**Verification Checklist:**
- [ ] Backend starts successfully on port 3000
- [ ] Frontend starts successfully on port 5173  
- [ ] No port conflict errors
- [ ] Frontend can be accessed at http://localhost:5173
- [ ] Backend API can be accessed at http://localhost:3000/api/v1/health
- [ ] Frontend console shows no API connection errors
- [ ] Browser network tab shows API calls going to localhost:3000

**Health Check Commands:**
```bash
# Test backend directly
curl http://localhost:3000/api/v1/health

# Check frontend is serving
curl http://localhost:5173

# Check API calls from frontend (in browser dev tools)
# Network tab should show calls to http://localhost:3000/api/v1/*
```

---

### ✅ Scenario 2: Both Docker Development

**Setup:**
```bash
# Terminal 1: Start Backend Docker
cd backend
docker-compose up -d  # Should start on port 8000

# Terminal 2: Start Frontend Docker
cd react-boilerplate
cp config-templates/docker-development.env .env
docker-compose up -d  # Should start on port 8080
```

**Verification Checklist:**
- [ ] Backend Docker starts successfully on port 8000
- [ ] Frontend Docker starts successfully on port 8080
- [ ] No port conflict errors  
- [ ] Frontend can be accessed at http://localhost:8080
- [ ] Backend API can be accessed at http://localhost:8000/api/v1/health
- [ ] Docker containers are running: `docker ps`
- [ ] Frontend calls backend on port 8000 (check browser network tab)

**Health Check Commands:**
```bash
# Test backend Docker
curl http://localhost:8000/api/v1/health

# Test frontend Docker  
curl http://localhost:8080

# Check Docker containers
docker ps
docker-compose logs  # Check for errors
```

---

### ✅ Scenario 3: Local Frontend + Docker Backend

**Setup:**
```bash
# Terminal 1: Start Backend Docker
cd backend
docker-compose up -d  # Should start on port 8000

# Terminal 2: Start Frontend Local
cd react-boilerplate  
cp config-templates/local-frontend-docker-backend.env .env
npm run dev  # Should start on port 5173
```

**Verification Checklist:**
- [ ] Backend Docker starts successfully on port 8000
- [ ] Frontend Local starts successfully on port 5173
- [ ] No port conflict errors
- [ ] Frontend can be accessed at http://localhost:5173  
- [ ] Backend API can be accessed at http://localhost:8000/api/v1/health
- [ ] Frontend calls backend on port 8000 (check browser network tab)
- [ ] Hot reload works on frontend (make a small change)

**Health Check Commands:**
```bash
# Test backend Docker
curl http://localhost:8000/api/v1/health

# Test frontend local
curl http://localhost:5173

# Verify .env file content
cat .env  # Should show VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

### ✅ Scenario 4: Docker Frontend + Local Backend

**Setup:**
```bash
# Terminal 1: Start Backend Local
cd backend
npm run start:dev  # Should start on port 3000

# Terminal 2: Start Frontend Docker  
cd react-boilerplate
cp config-templates/docker-frontend-local-backend.env .env
docker-compose up -d  # Should start on port 8080
```

**Verification Checklist:**
- [ ] Backend Local starts successfully on port 3000
- [ ] Frontend Docker starts successfully on port 8080
- [ ] No port conflict errors
- [ ] Frontend can be accessed at http://localhost:8080
- [ ] Backend API can be accessed at http://localhost:3000/api/v1/health  
- [ ] Frontend calls backend on port 3000 (check browser network tab)
- [ ] Backend logs show incoming requests

**Health Check Commands:**
```bash
# Test backend local
curl http://localhost:3000/api/v1/health

# Test frontend Docker
curl http://localhost:8080

# Check backend logs for incoming requests
# Should show API calls from frontend
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Error: EADDRINUSE :::3000
# Solution: Kill the process using the port
netstat -ano | findstr :3000  # Windows
lsof -ti :3000 | xargs kill -9  # macOS/Linux
```

### API Connection Refused
```bash
# Error: ERR_CONNECTION_REFUSED
# Solutions:
1. Check backend is running: curl http://localhost:PORT/api/v1/health
2. Verify .env file has correct VITE_API_BASE_URL
3. Check browser console for CORS errors
4. Ensure backend CORS allows frontend origin
```

### Docker Container Won't Start
```bash
# Check Docker logs
docker-compose logs app  # For backend
docker-compose logs frontend  # For frontend

# Common fixes:
docker-compose down
docker-compose up -d --build  # Force rebuild
```

### Environment Variables Not Loading
```bash
# Verify .env file exists and has correct content
cat .env

# Restart development server after changing .env
# Kill the dev server (Ctrl+C) and run npm run dev again
```

## API Testing

### Test Authentication Flow
```bash
# Register a new user
curl -X POST http://localhost:PORT/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login  
curl -X POST http://localhost:PORT/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Health Endpoints
```bash
# Backend health check
curl http://localhost:3000/api/v1/health  # Local backend
curl http://localhost:8000/api/v1/health  # Docker backend

# Frontend health check  
curl http://localhost:5173  # Local frontend
curl http://localhost:8080  # Docker frontend
```

## Browser Testing

### Frontend Console Checks
1. Open browser dev tools (F12)
2. Go to Console tab
3. Should see: 
   - ✅ No API connection errors
   - ✅ No CORS errors
   - ⚠️ Warning if VITE_API_BASE_URL not set (expected during first run)

### Network Tab Verification
1. Open browser dev tools (F12)  
2. Go to Network tab
3. Refresh the page or perform an action
4. Verify API calls go to correct backend port:
   - Scenario 1 & 4: calls to `localhost:3000`
   - Scenario 2 & 3: calls to `localhost:8000`

## Success Criteria

✅ **All scenarios tested successfully when:**
- [ ] No port conflicts occur
- [ ] Frontend loads without errors  
- [ ] Backend API responds to health checks
- [ ] Frontend can communicate with backend
- [ ] No console errors related to API connectivity
- [ ] Network requests go to correct backend port
- [ ] Docker containers (if used) run without errors

## Cleanup After Testing

```bash
# Stop all services
docker-compose down
cd ../backend && docker-compose down

# Kill any remaining processes (if needed)
netstat -ano | findstr :3000  # Check for stragglers
netstat -ano | findstr :8000
netstat -ano | findstr :5173
netstat -ano | findstr :8080
```

## Troubleshooting Checklist

If any scenario fails:

1. **Check Prerequisites:**
   - [ ] Node.js 18+ installed
   - [ ] Docker installed and running
   - [ ] All dependencies installed (`npm install`)

2. **Verify Configuration:**
   - [ ] Correct .env file copied from config-templates
   - [ ] .env file has correct VITE_API_BASE_URL
   - [ ] Backend .env configured properly

3. **Check Network:**
   - [ ] No firewall blocking ports
   - [ ] No other services using same ports
   - [ ] CORS properly configured in backend

4. **Docker Issues:**
   - [ ] Docker daemon running
   - [ ] No conflicting containers
   - [ ] Build completed successfully

Report any issues with specific error messages and the scenario that failed.
