# Deployment Guide

## Frontend Deployment (Vercel)

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Set environment variable in Vercel Dashboard:
   - Go to your project settings
   - Add environment variable: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.onrender.com/api`

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Set build command: `npm run build`
5. Set output directory: `build`
6. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`
7. Deploy

## Backend Deployment (Render)

### Using Render Dashboard

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Name**: bolosign-backend
   - **Environment**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid)

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave empty for auto-assignment)
   - `MONGODB_URI`: Your MongoDB connection string
     - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/bolosign?retryWrites=true&w=majority`
     - For local MongoDB: `mongodb://localhost:27017/bolosign`

6. Deploy

### Using render.yaml (Alternative)

If you have `render.yaml` in your repository:

1. Go to Render Dashboard
2. Create new Web Service
3. Select "Apply render.yaml"
4. Render will automatically detect and use the configuration

## Backend Deployment (Railway)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub
4. Set root directory to `backend`
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`
   - `PORT`: (auto-assigned)
6. Deploy

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/bolosign?retryWrites=true&w=majority`

### Option 2: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Connection string: `mongodb://localhost:27017/bolosign`

## Environment Variables Summary

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bolosign
NODE_ENV=development
```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] MongoDB connected
- [ ] Environment variables set
- [ ] CORS configured (backend allows frontend origin)
- [ ] Test PDF upload
- [ ] Test signature placement
- [ ] Test PDF signing
- [ ] Verify signed PDF download

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure:
- Backend has `cors()` middleware enabled
- Frontend API URL matches backend URL

### MongoDB Connection Issues
- Check connection string format
- Verify IP whitelist (for Atlas)
- Check database user credentials

### PDF Not Loading
- Check backend `/api/pdf/sample` endpoint
- Verify PDF.js worker is loading correctly
- Check browser console for errors

### Signature Not Appearing
- Verify coordinates are being sent correctly
- Check backend logs for errors
- Verify PDF manipulation is working
- Check aspect ratio calculation

## Production Considerations

1. **File Storage**: Consider using cloud storage (S3, Cloudinary) instead of local filesystem
2. **Database**: Use MongoDB Atlas or managed database service
3. **Security**: Add authentication, rate limiting, input validation
4. **Error Handling**: Implement comprehensive error handling and logging
5. **Monitoring**: Set up error tracking (Sentry, LogRocket)
6. **CDN**: Use CDN for static assets
7. **SSL**: Ensure HTTPS is enabled

