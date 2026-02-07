
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
    <div className="p-6 min-h-screen" style={{backgroundColor: 'var(--neutral-50)'}}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{color: 'var(--text-primary)'}}>Job Openings</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowLibrary(true)} className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition shadow-sm" style={{backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', border: '1px solid', color: 'var(--text-primary)'}}>
            <BookOpen size={20} style={{color: 'var(--primary-main)'}} /> JD Library
          </button>
          <button onClick={() => setShowModal(true)} className="text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition shadow-lg" style={{background: 'var(--gradient-primary)'}}>
            <Plus size={20} /> Post New Job
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job._id} className="p-6 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden" style={{backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)'}}>
            <div className="absolute top-0 right-0 p-3">
               <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{backgroundColor: job.status === 'Open' ? 'var(--success-bg)' : 'var(--error-bg)', color: job.status === 'Open' ? 'var(--success-main)' : 'var(--error-main)'}}>
                {job.status}
               </span>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>{job.role}</h3>
            <div className="space-y-2 text-sm" style={{color: 'var(--text-secondary)'}}>
              <p className="flex items-center gap-2"><MapPin size={16} style={{color: 'var(--text-tertiary)'}} /> {job.location}</p>
              <p className="flex items-center gap-2"><Briefcase size={16} style={{color: 'var(--text-tertiary)'}} /> {job.experience || 'Exp not specified'}</p>
              <p className="flex items-center gap-2 font-semibold" style={{color: 'var(--text-primary)'}}><IndianRupee size={16} style={{color: 'var(--text-tertiary)'}} /> {job.ctc || 'As per industry'}</p>
            </div>

            {/* Hiring Managers Display */}
            <div className="mt-5 pt-4" style={{borderTop: '1px solid var(--border-light)'}}>
              <p className="text-[10px] uppercase font-bold mb-2" style={{color: 'var(--text-tertiary)'}}>Assigned Managers</p>
              <div className="flex flex-wrap gap-2">
                {job.hiringManagers && job.hiringManagers.length > 0 ? (
                  job.hiringManagers.map((email, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium" style={{backgroundColor: 'var(--primary-lighter)', color: 'var(--primary-main)', border: '1px solid var(--primary-main)'}}>
                      <UserCheck size={12} /> {email.split('@')[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic" style={{color: 'var(--text-tertiary)'}}>No managers assigned</span>
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{backgroundColor: 'var(--overlay-dark)'}}>
          <div className="rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{backgroundColor: 'var(--bg-primary)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
            <div className="p-6 flex justify-between items-center sticky top-0" style={{backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)'}}>
               <h2 className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>Create New Job Requisition</h2>
               <button onClick={() => setShowModal(false)} className="transition" style={{color: 'var(--text-tertiary)', cursor: 'pointer'}} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-main)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-semibold mb-1 block" style={{color: 'var(--text-secondary)'}}>Job Role *</label>
                  <input type="text" placeholder="e.g. Senior Frontend Developer" required className="w-full p-3 rounded-xl outline-none" style={{border: '1px solid var(--border-light)'}} onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-lighter)'} onBlur={(e) => e.currentTarget.style.boxShadow = 'none'} 
                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-sm font-semibold mb-1 block" style={{color: 'var(--text-secondary)'}}>Location</label>
                  <input type="text" placeholder="e.g. Pune / Remote" required className="w-full p-3 rounded-xl outline-none" style={{border: '1px solid var(--border-light)'}} onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-lighter)'} onBlur={(e) => e.currentTarget.style.boxShadow = 'none'} 
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-sm font-semibold mb-1 block" style={{color: 'var(--text-secondary)'}}>Experience Required</label>
                  <input type="text" placeholder="e.g. 3-5 Years" className="w-full p-3 rounded-xl outline-none" style={{border: '1px solid var(--border-light)'}} onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-lighter)'} onBlur={(e) => e.currentTarget.style.boxShadow = 'none'} 
                    value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-semibold mb-1 block" style={{color: 'var(--text-secondary)'}}>CTC / Salary Range</label>
                  <input type="text" placeholder="e.g. 12 - 15 LPA" className="w-full p-3 rounded-xl outline-none" style={{border: '1px solid var(--border-light)'}} onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-lighter)'} onBlur={(e) => e.currentTarget.style.boxShadow = 'none'} 
                    value={formData.ctc} onChange={(e) => setFormData({...formData, ctc: e.target.value})} />
                </div>

                {/* Hiring Managers Multi-select */}
                <div className="col-span-2">
                  <label className="text-sm font-semibold mb-1 block" style={{color: 'var(--text-secondary)'}}>Assign Hiring Managers (Select multiple)</label>
                  <select 
                    multiple 
                    className="w-full p-3 rounded-xl outline-none h-28" style={{backgroundColor: 'var(--neutral-50)', border: '1px solid var(--border-light)'}} onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-lighter)'} onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                    value={formData.hiringManagers}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, hiringManagers: values});
                    }}
                  >
                    {managersList.map(email => <option key={email} value={email} className="p-2">{email}</option>)}
                  </select>
                  <p className="text-[10px] mt-1 italic" style={{color: 'var(--text-tertiary)'}}>Hold Ctrl (Win) or Cmd (Mac) to select multiple managers.</p>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-semibold mb-1 block" style={{color: 'var(--text-secondary)'}}>Job Description</label>
                  <textarea placeholder="Paste detailed JD here..." className="w-full p-3 rounded-xl h-32 outline-none resize-none" style={{border: '1px solid var(--border-light)'}} onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-lighter)'} onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0" style={{backgroundColor: 'var(--bg-primary)'}}>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 font-bold rounded-2xl transition" style={{backgroundColor: 'var(--neutral-100)', color: 'var(--text-secondary)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-200)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-100)'}>Cancel</button>
                <button type="submit" className="flex-1 py-3.5 text-white font-bold rounded-2xl transition" style={{background: 'var(--gradient-primary)', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)'}} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>Create & Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;