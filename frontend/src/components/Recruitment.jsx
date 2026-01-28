import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

const Recruitment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-black text-slate-800 mb-2 text-center">Recruitment Portal</h1>
        <p className="text-slate-500 text-center mb-12">Select a module to proceed</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Option 1: Candidates (ATS) */}
          <div 
            onClick={() => navigate('/ats')}
            className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Candidate Dashboard</h2>
            <p className="text-slate-500 mb-6">
              Track applications, parse resumes, and manage interview statuses.
            </p>
            <span className="text-indigo-600 font-bold flex items-center gap-2">
              Open ATS <ArrowRight size={18} />
            </span>
          </div>

          {/* Option 2: Job Postings */}
          <div 
            onClick={() => navigate('/jobs')}
            className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Briefcase size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Job Requisitions</h2>
            <p className="text-slate-500 mb-6">
              Create new job openings, manage requirements, and hiring managers.
            </p>
            <span className="text-emerald-600 font-bold flex items-center gap-2">
              Manage Jobs <ArrowRight size={18} />
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Recruitment;