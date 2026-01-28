import React, { useState } from 'react';

const JDLibraryModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Static templates for now (Inhe tum baad mein backend se fetch kar sakte ho)
  const templates = [
    {
      id: 1,
      role: 'Full Stack Developer',
      experience: '3-5 Years',
      skills: ['React', 'Node.js', 'MongoDB', 'Express'],
      description: 'Responsibilities include building scalable web applications and managing APIs.'
    },
    {
      id: 2,
      role: 'Frontend Developer',
      experience: '2+ Years',
      skills: ['React', 'Tailwind CSS', 'TypeScript'],
      description: 'Focus on building responsive and high-performance user interfaces.'
    },
    {
      id: 3,
      role: 'HR Manager',
      experience: '5+ Years',
      skills: ['Recruitment', 'Employee Relations', 'Payroll'],
      description: 'Oversee all aspects of Human Resources practices and processes.'
    }
  ];

  const filteredTemplates = templates.filter(t =>
    t.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">JD Library Templates</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
        </div>

        {/* Search */}
        <div className="p-4">
          <input
            type="text"
            placeholder="Search for a role (e.g. Developer)..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Template List */}
        <div className="overflow-y-auto p-4 flex-1">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="group p-4 mb-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-700">{template.role}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description.substring(0, 100)}...</p>
                  </div>
                  <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-500">
                    {template.experience}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.skills.map((skill, idx) => (
                    <span key={idx} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">No templates found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JDLibraryModal;