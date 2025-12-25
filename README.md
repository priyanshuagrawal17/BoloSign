# BoloSign - Signature Injection Engine

A full-stack MERN application that bridges the gap between web browsers and PDF files for precise signature placement. This prototype demonstrates reliable coordinate transformation from CSS pixels (browser) to PDF points, ensuring signatures appear in the exact location on the final PDF regardless of screen size.

## 🚀 Features

- **PDF Viewer**: Interactive PDF viewer using react-pdf
- **Drag & Drop Fields**: Place Text, Signature, Image, Date, and Radio fields on PDFs
- **Resize Fields**: Adjust field sizes with intuitive resize handles
- **Responsive Design**: Fields maintain correct positions across different screen sizes
- **Signature Canvas**: Draw signatures directly in the browser
- **Coordinate Transformation**: Accurate conversion from CSS pixels to PDF points
- **Aspect Ratio Preservation**: Images/signatures maintain aspect ratio when placed
- **Audit Trail**: SHA-256 hash tracking for document integrity

## 📁 Project Structure

```
BoloSign/
├── frontend/          # React.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── PdfEditor.js      # Main PDF editor component
│   │   │   ├── FieldPalette.js   # Field selection palette
│   │   │   ├── FieldOverlay.js   # Field overlay with drag/resize
│   │   │   └── SignatureCanvas.js # Signature drawing canvas
│   │   └── App.js
│   └── package.json
├── backend/           # Node.js/Express backend
│   ├── routes/
│   │   ├── signPdf.js    # PDF signing endpoint
│   │   └── pdf.js        # PDF management endpoints
│   ├── services/
│   │   ├── pdfService.js    # PDF manipulation & coordinate conversion
│   │   ├── hashService.js   # SHA-256 hash calculation
│   │   └── auditService.js  # MongoDB audit trail
│   └── server.js
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- React.js 18
- react-pdf (PDF.js wrapper)
- Axios for API calls

### Backend
- Node.js
- Express.js
- pdf-lib for PDF manipulation
- MongoDB with Mongoose
- crypto for SHA-256 hashing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BoloSign
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   Or install separately:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment variables**

   Create `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bolosign
   NODE_ENV=development
   ```

   Create `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development servers**

   From the root directory:
   ```bash
   npm run dev
   ```

   Or start separately:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 Usage

1. **Load PDF**: The application automatically loads a sample PDF on startup
2. **Add Fields**: Drag fields from the palette onto the PDF
3. **Position Fields**: Click and drag to move fields
4. **Resize Fields**: Use the resize handle (bottom-right corner) to adjust size
5. **Sign**: Click on a signature field to draw your signature
6. **Sign Document**: Click "Sign Document" to process and download the signed PDF

## 🔧 Coordinate Transformation Logic

The core challenge is converting between two coordinate systems:

### Browser (CSS Pixels)
- Origin: Top-left (0, 0)
- Units: CSS pixels (96 DPI)
- Coordinate system: (x, y) where y increases downward

### PDF (Points)
- Origin: Bottom-left (0, 0)
- Units: Points (72 DPI)
- Coordinate system: (x, y) where y increases upward

### The Solution

The transformation happens in `backend/services/pdfService.js`:

```javascript
function cssPixelsToPdfPoints(cssX, cssY, viewportWidth, viewportHeight, pdfWidth, pdfHeight, pdfPageHeight) {
  // Calculate scale factors
  const scaleX = pdfWidth / viewportWidth;
  const scaleY = pdfHeight / viewportHeight;
  
  // Convert X (same direction)
  const pdfX = cssX * scaleX;
  
  // Convert Y (flip axis)
  const pdfY = pdfPageHeight - (cssY * scaleY);
  
  return { x: pdfX, y: pdfY };
}
```

**Key Points:**
- Scale factors account for zoom/viewport size differences
- X coordinate scales directly
- Y coordinate scales and flips (PDF uses bottom-left origin)
- This ensures fields stay anchored to the correct content regardless of screen size

## 🔒 Security & Audit Trail

- **SHA-256 Hashing**: Original and signed PDFs are hashed
- **MongoDB Storage**: Audit trail stores:
  - Original PDF hash
  - Signed PDF hash
  - Timestamp
  - Coordinates
  - Field type

## 🚢 Deployment

### Frontend (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd frontend`
3. Deploy: `vercel`
4. Set environment variable: `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`

### Backend (Render/Railway)

1. **Render**:
   - Create new Web Service
   - Connect GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `PORT`: 10000 (or auto-assigned)
     - `NODE_ENV`: production

2. **Railway**:
   - Create new project
   - Deploy from GitHub
   - Set root directory to `backend`
   - Add environment variables

## 📝 API Endpoints

### POST `/api/sign-pdf`
Sign a PDF with a signature/image at specified coordinates.

**Request Body:**
```json
{
  "pdfId": "string",
  "signatureImage": "base64_string",
  "coordinates": {
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 50,
    "viewportWidth": 800,
    "viewportHeight": 1200,
    "pageNumber": 1
  },
  "fieldType": "signature",
  "fieldData": {}
}
```

**Response:**
```json
{
  "success": true,
  "signedPdfUrl": "/api/pdf/download/{signedPdfId}",
  "message": "PDF signed successfully"
}
```

### POST `/api/pdf/upload`
Upload a PDF to the server.

### GET `/api/pdf/sample`
Get a sample PDF for testing.

### GET `/api/pdf/download/:signedPdfId`
Download a signed PDF.

## 🎥 Video Walkthrough

**Note**: Please create a 3-minute Loom/Screen recording demonstrating:

1. **Feature Demo**:
   - Loading the PDF
   - Dragging fields (Text, Signature, Image, Date, Radio) onto the PDF
   - Resizing fields using the resize handle
   - Drawing a signature in the signature canvas
   - Switching between desktop and mobile view to show responsive behavior
   - Signing the document
   - Downloading and verifying the signed PDF

2. **Code Explanation**:
   - Show the `cssPixelsToPdfPoints` function in `backend/services/pdfService.js`
   - Explain the coordinate transformation math:
     - How scale factors are calculated
     - Why Y-axis needs to be flipped
     - How this ensures fields stay anchored to content
   - Show how aspect ratio is preserved for images

3. **Key Points to Highlight**:
   - The coordinate system difference (browser vs PDF)
   - The responsive behavior (fields stay in correct position)
   - The aspect ratio preservation logic
   - The audit trail with SHA-256 hashing

## 🤝 Assumptions Made

1. Single-page PDFs for initial prototype (multi-page support can be added)
2. Fields are placed on the first page
3. Signature images are PNG or JPG format
4. MongoDB is available (local or cloud)
5. File storage is local (can be upgraded to S3/cloud storage)

## 📄 License

MIT

## 👤 Author

Built for BoloForms Signature Injection Engine Challenge

---

**Note**: This is a prototype demonstrating the core functionality. Production deployment would require additional features like:
- Multi-page support
- Cloud storage for PDFs
- User authentication
- Field validation
- Better error handling
- Unit tests

