const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const signPdfRoute = require('./routes/signPdf');
const pdfRoute = require('./routes/pdf');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bolosign';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/sign-pdf', signPdfRoute);
app.use('/api/pdf', pdfRoute);

// Serve static files for uploads and outputs (for development)
if (process.env.NODE_ENV === 'development') {
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BoloSign API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

