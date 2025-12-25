const express = require('express');
const router = express.Router();
const { uploadPdf, getPdf, createSamplePdf } = require('../services/pdfService');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../outputs');

// Upload a PDF
router.post('/upload', async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ error: 'PDF base64 data is required' });
    }

    const result = await uploadPdf(pdfBase64, fileName);
    res.json(result);
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload PDF', details: error.message });
  }
});

// Get PDF by ID
router.get('/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    const pdf = await getPdf(pdfId);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.json(pdf);
  } catch (error) {
    console.error('Error getting PDF:', error);
    res.status(500).json({ error: 'Failed to get PDF', details: error.message });
  }
});

// Download signed PDF
router.get('/download/:signedPdfId', async (req, res) => {
  try {
    const { signedPdfId } = req.params;
    const filePath = path.join(OUTPUT_DIR, `${signedPdfId}.pdf`);
    
    try {
      const pdfBuffer = await fs.readFile(filePath);
      res.contentType('application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      res.status(404).json({ error: 'Signed PDF not found' });
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF', details: error.message });
  }
});

// Create sample PDF
router.get('/sample', async (req, res) => {
  try {
    const pdfBuffer = await createSamplePdf();
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error creating sample PDF:', error);
    res.status(500).json({ error: 'Failed to create sample PDF', details: error.message });
  }
});

module.exports = router;

