import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function ExcelUpload({ onDataParsed, onConfirm }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|csv|xls)$/i)) {
      setError("Please upload a valid Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        const rows = [];
        for (let i = 0; i < rawRows.length; i++) {
          let r = rawRows[i];
          if (!r || r.length === 0) continue;
          // Deal with pipe-delimited CSVs parsing as single strings
          if (r.length === 1 && typeof r[0] === 'string' && r[0].includes('|')) {
            r = r[0].split('|').map(s => s.trim());
          }
          if (r.join('').trim() !== '') {
            rows.push(r);
          }
        }

        const buildingsMap = {};
        const roomsMap = {};
        let roomCount = 0;

        let deptIdx = 0, bldgIdx = 1, rnIdx = 2, ridIdx = 3, numIdx = 4, capIdx = 5;
        let startRow = 0;

        // Try to find header definitions
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const row = rows[i];
          const rowStr = row.join(" ").toLowerCase();
          if (rowStr.includes("build") || rowStr.includes("bldg")) {
            startRow = i + 1;
            // Identify columns
            row.forEach((cell, idx) => {
              const cellLower = String(cell).toLowerCase().trim();
              if (cellLower.includes("dept") || cellLower.includes("department")) deptIdx = idx;
              else if (cellLower.includes("build") || cellLower.includes("bldg")) bldgIdx = idx;
              else if (cellLower.match(/\bname\b/)) rnIdx = idx;
              else if (cellLower.match(/\bid\b/)) ridIdx = idx;
              else if (cellLower.includes("number") || cellLower.includes("count")) numIdx = idx;
              else if (cellLower.includes("cap") || cellLower.includes("size")) capIdx = idx;
            });
            break;
          }
        }

        // Iterate data
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];

          const dept = String(row[deptIdx] || 'General').trim();
          const bldg = String(row[bldgIdx] || '').trim();

          if (!bldg || bldg === 'undefined') continue; // Building is required

          const roomName = String(row[rnIdx] || '').trim();
          const roomId = String(row[ridIdx] || '').trim();
          const count = parseInt(row[numIdx]) || 1;
          const capacity = parseInt(row[capIdx]) || 30;

          if (!buildingsMap[bldg]) {
            buildingsMap[bldg] = {
              id: bldg.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              name: bldg,
              department: dept,
              floors: 1,
              type: 'mixed'
            };
          }

          const resolvedBldgId = buildingsMap[bldg].id;
          const finalRoomName = roomName || roomId || `Room ${roomCount + 1}`;
          const finalBaseRoomId = roomId || `room-${Math.random().toString(36).substr(2, 5)}`;

          const safeCount = Math.max(1, count);
          const safeCapacity = Math.max(5, capacity);

          for (let c = 0; c < safeCount; c++) {
            const finalRoomId = safeCount > 1 ? `${finalBaseRoomId}-${c + 1}` : finalBaseRoomId;
            roomsMap[finalRoomId] = {
              building_id: resolvedBldgId,
              floor: 1,
              room_number: finalRoomId,
              type: 'classroom',
              capacity: safeCapacity,
              area_sqm: safeCapacity * 2,
              name: safeCount > 1 ? `${finalRoomName} (${c + 1})` : finalRoomName
            };
            roomCount++;
          }
        }

        if (Object.keys(buildingsMap).length === 0) {
          throw new Error("Could not find any building data. Ensure 'Building' column has values.");
        }

        const campusData = {
          campus_info: {
            name: "Uploaded Campus Data",
            location: "Custom",
            total_area_sqm: roomCount * 60
          },
          buildings: buildingsMap,
          rooms: roomsMap
        };

        setParsedData(campusData);
        if (onDataParsed) onDataParsed(campusData);

      } catch (err) {
        console.error("Parse error", err);
        setError("Error parsing the file. Please check the format.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleConfirm = () => {
    if (parsedData && onConfirm) {
      onConfirm(parsedData);
    }
  };

  return (
    <div className="excel-upload-container" style={{
      backgroundColor: 'var(--surface-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '2rem',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
        <FileSpreadsheet size={24} color="var(--primary-color)" />
        Upload Building Architecture
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Upload an Excel (.xlsx) or CSV file with the following columns:<br />
        <code>Department | Building | Room Name | Room ID | Number of Rooms | Capacity per Room</code>
      </p>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}>
          <Upload size={18} />
          {file ? 'Change File' : 'Select Excel File'}
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>

        {file && <span style={{ color: 'var(--text-secondary)' }}>{file.name}</span>}
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: '#ef4444', backgroundColor: '#fef2f2',
          padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {parsedData && (
        <div className="preview-section" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Data Preview</h3>
          <div style={{
            display: 'flex', gap: '2rem', marginBottom: '1rem',
            padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)'
          }}>
            <div><strong>Buildings:</strong> {Object.keys(parsedData.buildings).length}</div>
            <div><strong>Total Rooms:</strong> {Object.keys(parsedData.rooms).length}</div>
          </div>

          <button
            onClick={handleConfirm}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981', // emerald-500
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '1rem'
            }}
          >
            <Check size={18} />
            Confirm & Apply Configuration
          </button>
        </div>
      )}
    </div>
  );
}
