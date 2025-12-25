const express = require('express');
const router = express.Router();
const { signPdf } = require('../services/pdfService');
const { createAuditTrail } = require('../services/auditService');

router.post('/', async (req, res) => {
  try {
    const { pdfId, signatureImage, coordinates, fieldType, fieldData } = req.body;

    if (!pdfId || !signatureImage || !coordinates) {
      return res.status(400).json({ 
        error: 'Missing required fields: pdfId, signatureImage, and coordinates are required' 
      });
    }

    // Sign the PDF
    const signedPdfUrl = await signPdf({
      pdfId,
      signatureImage,
      coordinates,
      fieldType: fieldType || 'signature',
      fieldData: fieldData || {}
    });

    // Create audit trail
    await createAuditTrail(pdfId, signedPdfUrl);

    res.json({ 
      success: true, 
      signedPdfUrl,
      message: 'PDF signed successfully' 
    });
  } catch (error) {
    console.error('Error signing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to sign PDF', 
      details: error.message 
    });
  }
});

module.exports = router;

