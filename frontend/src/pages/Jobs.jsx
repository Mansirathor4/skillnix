
import React, { useState, useEffect } from 'react';
import { Plus, MapPin, BookOpen, UserCheck, X, Briefcase, IndianRupee } from 'lucide-react';
import JDLibraryModal from '../components/JDLibraryModal';

const Jobs = () => {
  const API_URL = 'http://localhost:5000/jobs';
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Model ke exact fields ke hisaab se state
  const initialForm = { 
    role: '', 
    location: '', 
    ctc: '', 
    experience: '', 
    skills: [], // Array
    description: '', 
    hiringManagers: [], // Array of emails
    status: 'Open' 
  };
  
  const [formData, setFormData] = useState(initialForm);
  const managersList = ["hr@company.com", "tech.lead@company.com", "cto@company.com", "product.mgr@company.com"];

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}?isTemplate=false`);
      const data = await res.json();
      setJobs(data);
    } catch (error) { console.error("Error fetching jobs:", error); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleSelectTemplate = (template) => {
    setFormData({
      ...formData,
      role: template.role,
      experience: template.experience || '',
      skills: template.skills || [],
      description: template.description || ''
    });
    setShowLibrary(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, isTemplate: false })
      });
      if(response.ok) {
        setShowModal(false);
        setFormData(initialForm);
        fetchJobs();
        alert("✅ Job Posted Successfully with Hiring Managers!");
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Job Openings</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowLibrary(true)} className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-50 transition shadow-sm">
            <BookOpen size={20} className="text-indigo-600" /> JD Library
          </button>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition shadow-lg">
            <Plus size={20} /> Post New Job
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
               <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${job.status === 'Open' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {job.status}
               </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{job.role}</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p className="flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> {job.location}</p>
              <p className="flex items-center gap-2"><Briefcase size={16} className="text-slate-400"/> {job.experience || 'Exp not specified'}</p>
              <p className="flex items-center gap-2 font-semibold text-slate-700"><IndianRupee size={16} className="text-slate-400"/> {job.ctc || 'As per industry'}</p>
            </div>

            {/* Hiring Managers Display */}
            <div className="mt-5 pt-4 border-t border-slate-50">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Assigned Managers</p>
              <div className="flex flex-wrap gap-2">
                {job.hiringManagers && job.hiringManagers.length > 0 ? (
                  job.hiringManagers.map((email, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[11px] font-medium border border-indigo-100">
                      <UserCheck size={12} /> {email.split('@')[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-300 italic">No managers assigned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* JD Library Modal */}
      <JDLibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)} onSelectTemplate={handleSelectTemplate} />

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
               <h2 className="text-2xl font-bold text-slate-800">Create New Job Requisition</h2>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Job Role *</label>
                  <input type="text" placeholder="e.g. Senior Frontend Developer" required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Location</label>
                  <input type="text" placeholder="e.g. Pune / Remote" required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Experience Required</label>
                  <input type="text" placeholder="e.g. 3-5 Years" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">CTC / Salary Range</label>
                  <input type="text" placeholder="e.g. 12 - 15 LPA" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.ctc} onChange={(e) => setFormData({...formData, ctc: e.target.value})} />
                </div>

                {/* Hiring Managers Multi-select */}
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Assign Hiring Managers (Select multiple)</label>
                  <select 
                    multiple 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-28 bg-slate-50"
                    value={formData.hiringManagers}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, hiringManagers: values});
                    }}
                  >
                    {managersList.map(email => <option key={email} value={email} className="p-2">{email}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Hold Ctrl (Win) or Cmd (Mac) to select multiple managers.</p>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Job Description</label>
                  <textarea placeholder="Paste detailed JD here..." className="w-full p-3 border border-slate-200 rounded-xl h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">Create & Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;