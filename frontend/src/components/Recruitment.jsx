import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

const Recruitment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center" style={{backgroundColor: 'var(--neutral-50)'}}>
      
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-black mb-2 text-center" style={{color: 'var(--text-primary)'}}>Recruitment Portal</h1>
        <p className="text-center mb-12" style={{color: 'var(--text-secondary)'}}>Select a module to proceed</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Option 1: Candidates (ATS) */}
          <div 
            onClick={() => navigate('/ats')}
            className="p-8 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--primary-lighter)'}} onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-xl)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors" style={{backgroundColor: 'var(--primary-lighter)', color: 'var(--primary-main)'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary-main)'; e.currentTarget.style.color = 'var(--text-inverse)';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'; e.currentTarget.style.color = 'var(--primary-main)';}}>
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>Candidate Dashboard</h2>
            <p className="mb-6" style={{color: 'var(--text-secondary)'}}>
              Track applications, parse resumes, and manage interview statuses.
            </p>
            <span className="font-bold flex items-center gap-2" style={{color: 'var(--primary-main)'}}>
              Open ATS <ArrowRight size={18} />
            </span>
          </div>

          {/* Option 2: Job Postings */}
          <div 
            onClick={() => navigate('/jobs')}
            className="p-8 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--primary-lighter)'}} onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-xl)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors" style={{backgroundColor: 'var(--success-bg)', color: 'var(--success-main)'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--success-main)'; e.currentTarget.style.color = 'var(--text-inverse)';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--success-bg)'; e.currentTarget.style.color = 'var(--success-main)';}}>
              <Briefcase size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>Job Requisitions</h2>
            <p className="mb-6" style={{color: 'var(--text-secondary)'}}>
              Create new job openings, manage requirements, and hiring managers.
            </p>
            <span className="font-bold flex items-center gap-2" style={{color: 'var(--success-main)'}}>
              Manage Jobs <ArrowRight size={18} />
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Recruitment;