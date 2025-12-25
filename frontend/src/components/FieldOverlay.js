import React, { useState, useRef, useEffect } from 'react';
import './FieldOverlay.css';

function FieldOverlay({ fields, onFieldUpdate, onFieldDelete, viewerWidth, viewerHeight, scale }) {
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e, fieldId, type) => {
    e.stopPropagation();
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    if (type === 'resize') {
      setResizing(fieldId);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: field.width,
        height: field.height
      });
    } else {
      setDragging(fieldId);
      setDragStart({
        x: e.clientX - field.x,
        y: e.clientY - field.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging) {
        const field = fields.find(f => f.id === dragging);
        if (field) {
          const newX = e.clientX - dragStart.x;
          const newY = e.clientY - dragStart.y;
          
          // Constrain to viewer bounds
          const constrainedX = Math.max(0, Math.min(newX, viewerWidth - field.width));
          const constrainedY = Math.max(0, Math.min(newY, viewerHeight - field.height));
          
          onFieldUpdate(dragging, { x: constrainedX, y: constrainedY });
        }
      } else if (resizing) {
        const field = fields.find(f => f.id === resizing);
        if (field) {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          
          const newWidth = Math.max(50, resizeStart.width + deltaX);
          const newHeight = Math.max(30, resizeStart.height + deltaY);
          
          // Constrain to viewer bounds
          const maxWidth = viewerWidth - field.x;
          const maxHeight = viewerHeight - field.y;
          
          onFieldUpdate(resizing, {
            width: Math.min(newWidth, maxWidth),
            height: Math.min(newHeight, maxHeight)
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, dragStart, resizeStart, fields, viewerWidth, viewerHeight, onFieldUpdate]);

  const getFieldIcon = (type) => {
    const icons = {
      text: '📝',
      signature: '✍️',
      image: '🖼️',
      date: '📅',
      radio: '🔘'
    };
    return icons[type] || '📄';
  };

  const getFieldLabel = (type) => {
    const labels = {
      text: 'Text',
      signature: 'Signature',
      image: 'Image',
      date: 'Date',
      radio: 'Radio'
    };
    return labels[type] || 'Field';
  };

  return (
    <div className="field-overlay">
      {fields.map(field => (
        <div
          key={field.id}
          className="field-box"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`
          }}
          onMouseDown={(e) => handleMouseDown(e, field.id, 'drag')}
        >
          <div className="field-content">
            {field.type === 'signature' && field.data.signature ? (
              <img 
                src={field.data.signature} 
                alt="Signature" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : field.type === 'text' && field.data.text ? (
              <div className="field-text">{field.data.text}</div>
            ) : field.type === 'date' && field.data.date ? (
              <div className="field-text">{field.data.date}</div>
            ) : (
              <div className="field-placeholder">
                <span className="field-icon">{getFieldIcon(field.type)}</span>
                <span className="field-label">{getFieldLabel(field.type)}</span>
              </div>
            )}
          </div>
          <div 
            className="resize-handle"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, field.id, 'resize');
            }}
          />
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onFieldDelete(field.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default FieldOverlay;

