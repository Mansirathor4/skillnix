import React from 'react';

const HistoryModal = ({ candidate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Status History: {candidate.name}</h2>
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {candidate.statusHistory?.map((h, i) => (
            <div key={i} className="flex justify-between items-center text-sm border-l-4 border-indigo-500 pl-3">
              <div>
                <p className="font-bold text-indigo-700">{h.status}</p>
                <p className="text-[10px] text-slate-400">{new Date(h.changedAt).toLocaleString()}</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">By: {h.changedBy}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-slate-900 text-white rounded-xl font-bold">Close</button>
      </div>
    </div>
  );
};

export default HistoryModal;