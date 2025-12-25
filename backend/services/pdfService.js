const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { calculateHash } = require('./hashService');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../outputs');

// Ensure directories exist
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
})();

/**
 * Convert CSS pixels to PDF points
 * 
 * This function handles the coordinate transformation from browser viewport to PDF coordinates.
 * 
 * Key considerations:
 * 1. PDF uses points (72 DPI) with origin at bottom-left
 * 2. Browser uses CSS pixels (96 DPI) with origin at top-left
 * 3. The viewport may be scaled/zoomed, so we need to account for the actual rendered size
 * 
 * The math:
 * - Scale factor = PDF dimension / Viewport dimension
 * - PDF X = CSS X * scaleX
 * - PDF Y = PDF Height - (CSS Y * scaleY) [flip Y axis]
 * 
 * This ensures that a field placed at a specific position on the screen will appear
 * at the correct position on the PDF, regardless of screen size or zoom level.
 */
function cssPixelsToPdfPoints(cssX, cssY, viewportWidth, viewportHeight, pdfWidth, pdfHeight, pdfPageHeight) {
  // Calculate the scale factor between viewport (CSS pixels) and PDF (points)
  // This accounts for any zoom/scale applied to the PDF viewer
  const scaleX = pdfWidth / viewportWidth;
  const scaleY = pdfHeight / viewportHeight;
  
  // Convert CSS X coordinate to PDF X coordinate
  // Direct scaling since both use left-to-right
  const pdfX = cssX * scaleX;
  
  // Convert CSS Y coordinate to PDF Y coordinate
  // PDF uses bottom-left origin, browser uses top-left origin
  // So we need to: 1) Scale the Y coordinate, 2) Flip it relative to PDF height
  const pdfY = pdfPageHeight - (cssY * scaleY);
  
  return { x: pdfX, y: pdfY };
}

/**
 * Upload and store a PDF
 */
async function uploadPdf(pdfBase64, fileName = 'document.pdf') {
  try {
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfId = crypto.randomBytes(16).toString('hex');
    const filePath = path.join(UPLOAD_DIR, `${pdfId}.pdf`);
    
    await fs.writeFile(filePath, pdfBuffer);
    
    // Calculate hash of original PDF
    const originalHash = calculateHash(pdfBuffer);
    
    return {
      pdfId,
      fileName,
      originalHash,
      message: 'PDF uploaded successfully'
    };
  } catch (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }
}

/**
 * Get PDF file
 */
async function getPdf(pdfId) {
  try {
    const filePath = path.join(UPLOAD_DIR, `${pdfId}.pdf`);
    const pdfBuffer = await fs.readFile(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    return {
      pdfId,
      pdfBase64,
      contentType: 'application/pdf'
    };
  } catch (error) {
    return null;
  }
}

/**
 * Sign PDF with signature/image at specified coordinates
 */
async function signPdf({ pdfId, signatureImage, coordinates, fieldType, fieldData }) {
  try {
    // Read the original PDF (or the last signed version if this is a subsequent field)
    let pdfPath = path.join(UPLOAD_DIR, `${pdfId}.pdf`);
    
    // Check if there's a signed version (for multiple fields)
    // In a production system, you'd track the latest signed version
    // For now, we'll always start from the original
    const pdfBytes = await fs.readFile(pdfPath);
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const pageNumber = coordinates.pageNumber || 1;
    const targetPage = pages[pageNumber - 1] || pages[0];
    
    // Get PDF page dimensions
    const { width: pdfWidth, height: pdfHeight } = targetPage.getSize();
    
    // Extract coordinates
    const { x: cssX, y: cssY, width: cssWidth, height: cssHeight, viewportWidth, viewportHeight } = coordinates;
    
    // Convert CSS coordinates to PDF coordinates
    const { x: pdfX, y: pdfY } = cssPixelsToPdfPoints(
      cssX, 
      cssY, 
      viewportWidth, 
      viewportHeight, 
      pdfWidth, 
      pdfHeight,
      pdfHeight
    );
    
    // Convert CSS dimensions to PDF dimensions
    const scaleX = pdfWidth / viewportWidth;
    const scaleY = pdfHeight / viewportHeight;
    const pdfWidthScaled = cssWidth * scaleX;
    const pdfHeightScaled = cssHeight * scaleY;
    
    if (fieldType === 'signature' || fieldType === 'image') {
      // Handle image/signature
      let image;
      
      // Remove data URL prefix if present
      let imageBase64 = signatureImage;
      if (signatureImage.includes(',')) {
        imageBase64 = signatureImage.split(',')[1];
      }
      
      const imageBytes = Buffer.from(imageBase64, 'base64');
      
      // Determine image type
      let imageType = 'png';
      if (imageBytes[0] === 0xFF && imageBytes[1] === 0xD8) {
        imageType = 'jpg';
      }
      
      // Embed image in PDF
      if (imageType === 'jpg') {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        image = await pdfDoc.embedPng(imageBytes);
      }
      
      // Calculate aspect ratio preservation
      const imageAspectRatio = image.width / image.height;
      const boxAspectRatio = pdfWidthScaled / pdfHeightScaled;
      
      let finalWidth = pdfWidthScaled;
      let finalHeight = pdfHeightScaled;
      let offsetX = 0;
      let offsetY = 0;
      
      // Preserve aspect ratio - fit image within box
      if (imageAspectRatio > boxAspectRatio) {
        // Image is wider - fit to width
        finalHeight = pdfWidthScaled / imageAspectRatio;
        offsetY = (pdfHeightScaled - finalHeight) / 2;
      } else {
        // Image is taller - fit to height
        finalWidth = pdfHeightScaled * imageAspectRatio;
        offsetX = (pdfWidthScaled - finalWidth) / 2;
      }
      
      // Draw image centered in the box
      // pdfY is the top of the box in PDF coordinates (after Y flip)
      // We need to draw from the bottom of the box, so subtract the height
      targetPage.drawImage(image, {
        x: pdfX + offsetX,
        y: pdfY - pdfHeightScaled + offsetY,
        width: finalWidth,
        height: finalHeight,
      });
    } else if (fieldType === 'text') {
      // Handle text field
      const text = fieldData.text || '';
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      targetPage.drawText(text, {
        x: pdfX,
        y: pdfY - pdfHeightScaled + 5, // Small offset for text baseline
        size: fieldData.fontSize || 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    } else if (fieldType === 'date') {
      // Handle date field
      const dateText = fieldData.date || new Date().toLocaleDateString();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      targetPage.drawText(dateText, {
        x: pdfX,
        y: pdfY - pdfHeightScaled + 5, // Small offset for text baseline
        size: fieldData.fontSize || 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const signedPdfId = crypto.randomBytes(16).toString('hex');
    const outputPath = path.join(OUTPUT_DIR, `${signedPdfId}.pdf`);
    await fs.writeFile(outputPath, modifiedPdfBytes);
    
    // Return URL (in production, this would be a proper URL)
    const signedPdfUrl = `/api/pdf/download/${signedPdfId}`;
    
    return signedPdfUrl;
  } catch (error) {
    throw new Error(`Failed to sign PDF: ${error.message}`);
  }
}

/**
 * Create a sample PDF for testing
 */
async function createSamplePdf() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    
    // Title
    page.drawText('Sample Document for Signature Testing', {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Paragraph 1
    page.drawText('This is a sample PDF document created for testing the signature injection engine.', {
      x: 50,
      y: height - 100,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('You can drag and drop signature fields, text boxes, images, date selectors, and radio buttons onto this document.', {
      x: 50,
      y: height - 130,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Paragraph 2
    page.drawText('The coordinate system conversion ensures that fields placed on the PDF will appear in the correct location', {
      x: 50,
      y: height - 180,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('regardless of screen size or viewport dimensions.', {
      x: 50,
      y: height - 200,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Signature area label
    page.drawText('Signature Area:', {
      x: 50,
      y: height - 250,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Date area label
    page.drawText('Date:', {
      x: 50,
      y: height - 350,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Footer
    page.drawText('BoloSign - Signature Injection Engine Prototype', {
      x: 50,
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    throw new Error(`Failed to create sample PDF: ${error.message}`);
  }
}

module.exports = {
  uploadPdf,
  getPdf,
  signPdf,
  cssPixelsToPdfPoints,
  createSamplePdf
};

