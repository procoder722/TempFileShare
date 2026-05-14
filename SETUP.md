# TempFileShare - Setup & Configuration Guide

## ✅ Architecture Fixes Applied

### Backend Improvements

1. **Async File I/O** ✅
   - Converted `readFileSync()` → `fs.promises.readFile()`
   - Converted `writeFileSync()` → `fs.promises.writeFile()`
   - Prevents blocking the event loop under concurrent load

2. **Security Hardening** ✅
   - **CORS Restrictions**: Only allows frontend origin (configurable via `FRONTEND_URL`)
   - **Input Validation**: Validates expiry days (1-30), max downloads (1-100), password length
   - **Proper Error Handling**: All endpoints wrapped with try-catch and error logging

3. **Environment Variables** ✅
   - `PORT`: Server port (default: 5000)
   - `FRONTEND_URL`: Allowed CORS origin (default: http://localhost:5173)
   - `SHARE_URL`: URL for share links (default: http://localhost:5000)

### Frontend Improvements

1. **API Configuration** ✅
   - Uses environment variable `VITE_API_URL`
   - Falls back to current origin if not set
   - Supports different backend URLs

## 📋 Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd backend/frontend
npm install
```

### 2. Environment Configuration

**Backend** - Create `backend/.env`:
```env
PORT=5000
cd backend && node server.js
SHARE_URL=http://localhost:5000
```

**Frontend** - Create cd backend/frontend && npm run dev
VITE_API_URL=http://localhost:5000
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
✅ Server running on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd backend/frontend
npm run dev
```
✅ Frontend running on http://localhost:5173

## 🚀 Production Deployment

Update environment variables for production:

**Backend .env:**
```env
PORT=5000
FRONTEND_URL=https://yourdomain.com
SHARE_URL=https://yourdomain.com:5000
```

**Frontend .env:**
```env
VITE_API_URL=https://yourdomain.com:5000
```

## 📊 Feature Overview

| Feature | Status |
|---------|--------|
| File Upload (PDF, JPG, PNG) | ✅ Working |
| Password Protection | ✅ Working |
| Expiry Control (1-30 days) | ✅ Working |
| Download Limit | ✅ Working |
| Auto-cleanup | ✅ Every 2 mins |
| File Preview | ✅ Images & PDF |
| CORS Security | ✅ Restricted |
| Async Operations | ✅ Non-blocking |
| Input Validation | ✅ Sanitized |

## 🔍 What Was Fixed

### Issues & Solutions

| Issue | Solution |
|-------|----------|
| Synchronous file I/O blocking | Converted to async/await |
| CORS wide open to all origins | Restricted to `FRONTEND_URL` only |
| No input validation | Added range checks & validation |
| Hardcoded API URLs in frontend | Environment variables + fallback |
| Default ports (3000, 5000) mismatch | Updated to standard (5173, 5000) |

## 🛠️ Troubleshooting

**CORS Error?**
- Update `FRONTEND_URL` in `backend/.env` to match your frontend URL

**API Not Found?**
- Ensure `VITE_API_URL` in `frontend/.env` matches backend `SHARE_URL`

**Upload Fails?**
- Check file type (only PDF, JPG, PNG)
- Check file size (max 5MB)
- Verify `uploads/` directory exists

## 📝 Next Steps (Future Improvements)

1. Use a proper database (MongoDB/PostgreSQL) instead of JSON file
2. Split backend into modular architecture (controllers, services, models)
3. Add rate limiting on upload/download
4. Add authentication & authorization
5. Add database migrations
6. Add comprehensive logging
7. Add API documentation (Swagger/OpenAPI)
