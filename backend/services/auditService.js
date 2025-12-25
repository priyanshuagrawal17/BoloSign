const mongoose = require('mongoose');
const { calculateHash } = require('./hashService');
const fs = require('fs').promises;
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../outputs');

// Audit Trail Schema
const auditTrailSchema = new mongoose.Schema({
  pdfId: {
    type: String,
    required: true,
    index: true
  },
  signedPdfId: {
    type: String,
    required: true
  },
  originalHash: {
    type: String,
    required: true
  },
  signedHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  coordinates: {
    type: mongoose.Schema.Types.Mixed
  },
  fieldType: {
    type: String
  }
});

const AuditTrail = mongoose.models.AuditTrail || mongoose.model('AuditTrail', auditTrailSchema);

/**
 * Create an audit trail entry
 */
async function createAuditTrail(pdfId, signedPdfUrl) {
  try {
    // Extract signed PDF ID from URL
    const signedPdfId = signedPdfUrl.split('/').pop();
    
    // Read original PDF and calculate hash
    const originalPdfPath = path.join(UPLOAD_DIR, `${pdfId}.pdf`);
    const originalPdfBuffer = await fs.readFile(originalPdfPath);
    const originalHash = calculateHash(originalPdfBuffer);
    
    // Read signed PDF and calculate hash
    const signedPdfPath = path.join(OUTPUT_DIR, `${signedPdfId}.pdf`);
    const signedPdfBuffer = await fs.readFile(signedPdfPath);
    const signedHash = calculateHash(signedPdfBuffer);
    
    // Create audit trail entry
    const auditEntry = new AuditTrail({
      pdfId,
      signedPdfId,
      originalHash,
      signedHash,
      timestamp: new Date()
    });
    
    await auditEntry.save();
    
    return auditEntry;
  } catch (error) {
    console.error('Error creating audit trail:', error);
    throw new Error(`Failed to create audit trail: ${error.message}`);
  }
}

/**
 * Get audit trail for a PDF
 */
async function getAuditTrail(pdfId) {
  try {
    const auditEntries = await AuditTrail.find({ pdfId }).sort({ timestamp: -1 });
    return auditEntries;
  } catch (error) {
    throw new Error(`Failed to get audit trail: ${error.message}`);
  }
}

module.exports = {
  createAuditTrail,
  getAuditTrail,
  AuditTrail
};

