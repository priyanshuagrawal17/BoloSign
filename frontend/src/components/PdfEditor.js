import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PdfEditor.css';
import FieldOverlay from './FieldOverlay';
import SignatureCanvas from './SignatureCanvas';
import axios from 'axios';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PdfEditor({ selectedField, fields, onFieldAdd, onFieldUpdate, onFieldDelete, pdfId, setPdfId }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewerDimensions, setViewerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);

  // Load sample PDF on mount
  useEffect(() => {
    loadSamplePdf();
  }, []);

  // Update viewer dimensions when scale changes
  useEffect(() => {
    if (pageRef.current) {
      const updateDimensions = () => {
        const pageElement = pageRef.current?.querySelector('.react-pdf__Page__canvas');
        if (pageElement) {
          setViewerDimensions({
            width: pageElement.offsetWidth,
            height: pageElement.offsetHeight
          });
        }
      };
      
      updateDimensions();
      const timer = setTimeout(updateDimensions, 100);
      return () => clearTimeout(timer);
    }
  }, [scale, numPages]);

  const loadSamplePdf = async () => {
    try {
      // Load sample PDF from backend
      const response = await axios.get(`${API_URL}/pdf/sample`, { 
        responseType: 'blob' 
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setPdfBase64(base64);
        uploadPdfToBackend(base64);
      };
      reader.readAsDataURL(response.data);
    } catch (error) {
      console.error('Error loading sample PDF:', error);
      alert('Failed to load sample PDF. Please ensure the backend is running.');
    }
  };

  const uploadPdfToBackend = async (base64) => {
    try {
      const response = await axios.post(`${API_URL}/pdf/upload`, {
        pdfBase64: base64,
        fileName: 'sample.pdf'
      });
      if (response.data.pdfId) {
        setPdfId(response.data.pdfId);
      }
    } catch (error) {
      console.error('Error uploading PDF to backend:', error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType');
    
    if (!fieldType || !pageRef.current) return;

    const pageElement = pageRef.current.querySelector('.react-pdf__Page__canvas');
    if (!pageElement) return;

    const rect = pageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newField = {
      id: Date.now().toString(),
      type: fieldType,
      x,
      y,
      width: fieldType === 'signature' || fieldType === 'image' ? 200 : 150,
      height: fieldType === 'signature' || fieldType === 'image' ? 80 : 50,
      pageNumber: pageNumber,
      data: fieldType === 'date' ? { date: new Date().toLocaleDateString() } : 
            fieldType === 'text' ? { text: 'Text' } : {}
    };

    if (fieldType === 'signature') {
      setCurrentField(newField);
      setShowSignatureModal(true);
    } else if (fieldType === 'text' || fieldType === 'date') {
      // For text and date, prompt for value
      const value = fieldType === 'date' 
        ? prompt('Enter date (or leave empty for today):', new Date().toLocaleDateString())
        : prompt('Enter text:', 'Text');
      
      if (value !== null) {
        newField.data = fieldType === 'date' ? { date: value || new Date().toLocaleDateString() } : { text: value || 'Text' };
        onFieldAdd(newField);
      }
    } else {
      onFieldAdd(newField);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSignDocument = async () => {
    if (!pdfId || fields.length === 0) {
      alert('Please add at least one field to the PDF');
      return;
    }

    setLoading(true);
    try {
      let signedPdfUrl = null;
      
      // Sign the PDF with all fields
      for (const field of fields) {
        if (field.type === 'signature' && field.data.signature) {
          const coordinates = calculateCoordinates(field);
          
          if (!coordinates) {
            continue;
          }
          
          const response = await axios.post(`${API_URL}/sign-pdf`, {
            pdfId,
            signatureImage: field.data.signature,
            coordinates,
            fieldType: field.type,
            fieldData: field.data
          });
          
          if (response.data.signedPdfUrl) {
            signedPdfUrl = response.data.signedPdfUrl;
            // Update pdfId to the signed version for subsequent fields
            // In a real scenario, you might want to handle multiple fields differently
          }
        } else if (field.type === 'text' || field.type === 'date') {
          const coordinates = calculateCoordinates(field);
          
          if (!coordinates) {
            continue;
          }
          
          const response = await axios.post(`${API_URL}/sign-pdf`, {
            pdfId,
            signatureImage: null,
            coordinates,
            fieldType: field.type,
            fieldData: field.data || { text: field.type === 'date' ? new Date().toLocaleDateString() : 'Text' }
          });
          
          if (response.data.signedPdfUrl) {
            signedPdfUrl = response.data.signedPdfUrl;
          }
        }
      }

      if (signedPdfUrl) {
        const fullUrl = `${API_URL}${signedPdfUrl}`;
        alert(`PDF signed successfully! Download link: ${fullUrl}`);
        window.open(fullUrl, '_blank');
      } else {
        alert('PDF signed successfully!');
      }
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Failed to sign PDF: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateCoordinates = (field) => {
    // Get the actual PDF page dimensions from the rendered canvas
    const pageElement = pageRef.current?.querySelector('.react-pdf__Page__canvas');
    if (!pageElement) {
      console.warn('Page element not found');
      return null;
    }

    // Get the actual rendered dimensions of the PDF page
    const viewportWidth = pageElement.offsetWidth;
    const viewportHeight = pageElement.offsetHeight;

    // These coordinates are relative to the page container
    // The field positions are already in CSS pixels relative to the page
    return {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      viewportWidth,
      viewportHeight,
      pageNumber: field.pageNumber
    };
  };

  const handleSignatureComplete = (signatureData) => {
    if (currentField) {
      const fieldWithSignature = {
        ...currentField,
        data: { signature: signatureData }
      };
      onFieldAdd(fieldWithSignature);
      setCurrentField(null);
    }
    setShowSignatureModal(false);
  };

  return (
    <div className="pdf-editor" ref={containerRef}>
      <div className="pdf-controls">
        <div className="page-controls">
          <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1}>
            Previous
          </button>
          <span>Page {pageNumber} of {numPages || 0}</span>
          <button onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))} disabled={pageNumber >= (numPages || 1)}>
            Next
          </button>
        </div>
        <div className="zoom-controls">
          <button onClick={() => setScale(Math.max(0.5, scale - 0.25))}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2.0, scale + 0.25))}>+</button>
        </div>
        <button 
          className="sign-button" 
          onClick={handleSignDocument}
          disabled={loading || !pdfId}
        >
          {loading ? 'Signing...' : 'Sign Document'}
        </button>
      </div>

      <div 
        className="pdf-viewer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        ref={pageRef}
      >
        {pdfBase64 ? (
          <Document
            file={`data:application/pdf;base64,${pdfBase64}`}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="loading">Loading PDF...</div>}
          >
            <div className="page-container">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
              <FieldOverlay
                fields={fields.filter(f => f.pageNumber === pageNumber)}
                onFieldUpdate={onFieldUpdate}
                onFieldDelete={onFieldDelete}
                viewerWidth={viewerDimensions.width}
                viewerHeight={viewerDimensions.height}
                scale={scale}
              />
            </div>
          </Document>
        ) : (
          <div className="loading">Loading PDF...</div>
        )}
      </div>

      {showSignatureModal && (
        <SignatureCanvas
          onClose={() => {
            setShowSignatureModal(false);
            setCurrentField(null);
          }}
          onComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
}

export default PdfEditor;

