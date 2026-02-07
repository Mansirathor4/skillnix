import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { CheckSquare, Square, Edit, Trash2, Mail, FileText, MessageCircle } from 'lucide-react';

const VirtualizedCandidateTable = ({
  candidates,
  filteredCandidates,
  selectedIds,
  statusOptions,
  stickyColWidths,
  stickyLeftOffsets,
  getStickyHeaderStyle,
  getStickyBodyStyle,
  onEdit,
  onDelete,
  onSendEmail,
  onToggleSelection,
  onSelectAll,
  onStatusChange,
  onWhatsApp,
  isAllSelected,
  tableColumns
}) => {
  const itemSize = 50; // Height of each row
  const containerHeight = Math.min(filteredCandidates.length * itemSize, 600); // Max 600px visible

  const Row = ({ index, style }) => {
    const candidate = filteredCandidates[index];
    if (!candidate) return null;

    return (
      <tr 
        key={candidate._id} 
        className="border-b hover:bg-slate-50 transition"
        style={style}
      >
        <td 
          className="p-4 text-center sticky left-0 z-10 bg-white border-r border-slate-200" 
          style={{ width: `${stickyColWidths.checkbox}px`, minWidth: `${stickyColWidths.checkbox}px` }}
        >
          <div onClick={() => onToggleSelection(candidate._id)} className="cursor-pointer flex justify-center">
            {selectedIds.includes(candidate._id) ? 
              <CheckSquare className="text-indigo-600" size={20} /> : 
              <Square className="text-slate-300" size={20} />
            }
          </div>
        </td>
        {tableColumns.map((column, idx) => (
          <td
            key={`${candidate._id}-${column.key}`}
            className={`p-4 text-sm${idx < 4 ? ' sticky z-10 bg-white border-r border-slate-200' : ''}`}
            style={getStickyBodyStyle(idx)}
          >
            {column.render(candidate, index)}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[2000px]">
        <thead>
          <tr className="bg-emerald-50 text-slate-700 border-b-2 border-emerald-100">
            <th className="p-4 w-[60px] min-w-[60px] sticky left-0 z-20 bg-emerald-50 border-r border-emerald-100">
              <div onClick={() => onSelectAll(filteredCandidates.map(c => c._id))} className="cursor-pointer flex justify-center">
                {isAllSelected ? <CheckSquare size={22} className="text-indigo-600" /> : <Square size={22} className="text-slate-400" />}
              </div>
            </th>
            {tableColumns.map((column, idx) => (
              <th
                key={column.key}
                className={`p-4 text-sm font-bold whitespace-nowrap${idx < 4 ? ' sticky z-20 bg-emerald-50 border-r border-emerald-100' : ''}`}
                style={getStickyHeaderStyle(idx)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* Only render if we have data */}
      {filteredCandidates.length > 0 ? (
        <div style={{ height: containerHeight, overflow: 'auto' }}>
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <tbody>
              {filteredCandidates.map((candidate, index) => (
                <tr 
                  key={candidate._id} 
                  className="border-b hover:bg-slate-50 transition text-sm"
                >
                  <td 
                    className="p-4 text-center sticky left-0 z-10 bg-white border-r border-slate-200" 
                    style={{ width: `${stickyColWidths.checkbox}px`, minWidth: `${stickyColWidths.checkbox}px` }}
                  >
                    <div onClick={() => onToggleSelection(candidate._id)} className="cursor-pointer flex justify-center">
                      {selectedIds.includes(candidate._id) ? 
                        <CheckSquare className="text-indigo-600" size={20} /> : 
                        <Square className="text-slate-300" size={20} />
                      }
                    </div>
                  </td>
                  {tableColumns.map((column, idx) => (
                    <td
                      key={`${candidate._id}-${column.key}`}
                      className={`p-4${idx < 4 ? ' sticky z-10 bg-white border-r border-slate-200' : ''}`}
                      style={getStickyBodyStyle(idx)}
                    >
                      {column.render(candidate, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500">
          <p className="text-lg font-semibold">No candidates found</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedCandidateTable;
