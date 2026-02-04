import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

const ColumnMapper = ({ excelHeaders, onMapComplete, onClose }) => {
  const dbFields = [
    'name', 'email', 'contact', 'position', 'location', 'companyName',
    'experience', 'ctc', 'expectedCtc', 'noticePeriod', 'fls', 'status', 'client', 'spoc', 'source', 'date'
  ];

  const [mapping, setMapping] = useState(() => {
    const initial = {};
    excelHeaders.forEach((header, idx) => {
      initial[idx] = '';
    });
    return initial;
  });

  const handleMapChange = (excelIndex, dbField) => {
    setMapping(prev => ({ ...prev, [excelIndex]: dbField }));
  };

  const handleComplete = () => {
    const finalMapping = {};
    Object.entries(mapping).forEach(([excelIdx, dbField]) => {
      if (dbField) {
        finalMapping[parseInt(excelIdx)] = dbField;
      }
    });
    onMapComplete(finalMapping);
  };

  // ✅ Ab skip karne ki option hai - only check if at least name is mapped
  const hasMinimumMapping = Object.values(mapping).some(v => v === 'name');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Map Excel Columns</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 mb-6 font-medium">
            Match each Excel column to a database field. Leave unmapped columns blank.
          </p>

          <div className="space-y-3">
            {excelHeaders.map((header, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-500">Excel Column {idx + 1}</div>
                  <div className="text-lg font-bold text-slate-800 break-words">{header}</div>
                </div>

                <ArrowRight size={24} className="text-slate-400" />

                <div className="flex-1">
                  <select
                    value={mapping[idx]}
                    onChange={(e) => handleMapChange(idx, e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Skip This Column --</option>
                    <optgroup label="Personal Info">
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="contact">Phone Contact</option>
                    </optgroup>
                    <optgroup label="Job Details">
                      <option value="position">Position</option>
                      <option value="location">City/Location</option>
                      <option value="companyName">Company Name</option>
                    </optgroup>
                    <optgroup label="Experience & Salary">
                      <option value="experience">Experience</option>
                      <option value="ctc">Current CTC</option>
                      <option value="expectedCtc">Expected CTC</option>
                      <option value="noticePeriod">Notice Period</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="date">Date</option>
                      <option value="fls">FLS/Non FLS</option>
                      <option value="status">Status</option>
                      <option value="client">Client</option>
                      <option value="spoc">SPOC</option>
                      <option value="source">Source</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> You can skip columns you don't need. At minimum, map the "Name" field to proceed.
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={!hasMinimumMapping}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
            >
              Confirm Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapper;
