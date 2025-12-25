import React, { useState } from 'react';
import './App.css';
import PdfEditor from './components/PdfEditor';
import FieldPalette from './components/FieldPalette';

function App() {
  const [selectedField, setSelectedField] = useState(null);
  const [fields, setFields] = useState([]);
  const [pdfId, setPdfId] = useState(null);

  const handleFieldSelect = (fieldType) => {
    setSelectedField(fieldType);
  };

  const handleFieldAdd = (field) => {
    setFields([...fields, field]);
  };

  const handleFieldUpdate = (fieldId, updates) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleFieldDelete = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>BoloSign - Signature Injection Engine</h1>
      </header>
      <div className="App-container">
        <FieldPalette 
          onFieldSelect={handleFieldSelect}
          selectedField={selectedField}
        />
        <PdfEditor
          selectedField={selectedField}
          fields={fields}
          onFieldAdd={handleFieldAdd}
          onFieldUpdate={handleFieldUpdate}
          onFieldDelete={handleFieldDelete}
          pdfId={pdfId}
          setPdfId={setPdfId}
        />
      </div>
    </div>
  );
}

export default App;

