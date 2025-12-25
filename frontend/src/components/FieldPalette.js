import React from 'react';
import './FieldPalette.css';

const FIELD_TYPES = [
  { type: 'text', label: 'Text Box', icon: '📝' },
  { type: 'signature', label: 'Signature', icon: '✍️' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'radio', label: 'Radio', icon: '🔘' },
];

function FieldPalette({ onFieldSelect, selectedField }) {
  return (
    <div className="field-palette">
      <h2>Fields</h2>
      <p className="instruction">Drag a field onto the PDF</p>
      <div className="field-list">
        {FIELD_TYPES.map(field => (
          <div
            key={field.type}
            className={`field-item ${selectedField === field.type ? 'selected' : ''}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('fieldType', field.type);
              onFieldSelect(field.type);
            }}
            onClick={() => onFieldSelect(field.type)}
          >
            <span className="field-icon">{field.icon}</span>
            <span className="field-label">{field.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FieldPalette;

