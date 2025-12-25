# Quick Start Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Quick Setup (5 minutes)

1. **Clone and Install**
   ```bash
   cd BoloSign
   npm run install-all
   ```

2. **Setup Backend Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI
   ```

3. **Start MongoDB** (if using local MongoDB)
   ```bash
   # On macOS/Linux
   mongod
   
   # On Windows
   # Start MongoDB service from Services
   ```

4. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   
   # Or separately:
   # Terminal 1: cd backend && npm run dev
   # Terminal 2: cd frontend && npm start
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## First Steps

1. **Load PDF**: The app automatically loads a sample PDF
2. **Add Field**: Drag a field from the left palette onto the PDF
3. **Sign**: Click on a signature field to draw your signature
4. **Resize**: Use the bottom-right handle to resize fields
5. **Sign Document**: Click "Sign Document" to process

## Testing the Coordinate System

1. Place a signature field on a specific paragraph
2. Open Chrome DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Switch to mobile view
5. Verify the field stays anchored to the same paragraph
6. Sign the document and verify the signature appears correctly

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- For MongoDB Atlas, verify IP whitelist

### PDF Not Loading
- Check backend is running on port 5000
- Verify `/api/pdf/sample` endpoint works
- Check browser console for errors

### Fields Not Dragging
- Ensure you're dragging from the field palette
- Check browser console for JavaScript errors
- Verify React app is running

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Read [COORDINATE_CALCULATION.md](./COORDINATE_CALCULATION.md) for math explanation
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions

