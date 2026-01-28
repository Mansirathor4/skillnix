
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  BarChart3, 
  LogOut, 
  UserCircle,
  PhoneCall,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // User State
  const [user] = useState({ name: 'Mansi Rathor', role: 'Admin' });
  const [candidates, setCandidates] = useState([]);

  // Database se data lane ke liye useEffect
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('http://localhost:5000/candidates'); 
        const data = await response.json();
        setCandidates(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchCandidates();
  }, []);

  // Filter candidates for reminders: Sirf unhe dikhao jinme text/date hai
  const liveReminders = candidates.filter(c => 
    c.callBackDate && c.callBackDate.trim() !== ""
  );

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* --- TOP NAVIGATION --- */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
          <span className="text-xl font-bold text-slate-800">TriNexus</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
            <UserCircle size={20} className="text-gray-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">{user.name}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors border border-transparent hover:border-red-100"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- LEFT SIDE: WELCOME & MODULES --- */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
              <p className="text-indigo-100 text-lg max-w-2xl leading-relaxed">
                You are logged into the <strong>TriNexus System</strong>. Manage your recruitment, clients, and employees from one central place.
              </p>
            </div>
            <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform"></div>
          </div>

          {/* MODULES SECTION */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-600" /> System Modules
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ATS CARD */}
              <div 
                onClick={() => navigate('/recruitment')}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <Users className="text-blue-600 group-hover:text-white transition-colors" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">ATS</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">Manage candidates, job postings, and interviews.</p>
                <span className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Dashboard &rarr;
                </span>
              </div>

              {/* CRM CARD */}
              <div 
                onClick={() => navigate('/crm')}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                  <BarChart3 className="text-purple-600 group-hover:text-white transition-colors" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">CRM</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">Track leads, sales pipeline, and client relations.</p>
                <span className="text-purple-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Pipeline &rarr;
                </span>
              </div>

              {/* HRMS CARD */}
              <div 
                onClick={() => navigate('/hrms')}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-pink-200 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-600 transition-colors">
                  <Briefcase className="text-pink-600 group-hover:text-white transition-colors" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">HRMS</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">Employee records, attendance, and payroll mgmt.</p>
                <span className="text-pink-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Staff &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: CALL BACKS & SYSTEM STATUS --- */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-100 p-5 ring-4 ring-orange-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall size={18} className="text-orange-600" /> Call Backs
              </h3>
              <span className="bg-orange-600 text-white text-[10px] px-2 py-1 rounded-full animate-pulse font-bold tracking-tighter">
                REMINDERS
              </span>
            </div>

            <div className="space-y-4">
              {liveReminders.length > 0 ? (
                liveReminders.map((rem) => (
                  <div key={rem._id} className="p-4 bg-orange-50 rounded-xl border border-orange-100 group hover:bg-orange-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{rem.name}</span>
                        {/* contact ya contactNumber field ko check karein */}
                        <p className="text-[11px] text-slate-500 font-medium">{rem.contactNumber || rem.contact}</p>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-orange-200 text-orange-600 shadow-sm">
                        <PhoneCall size={12} />
                      </div>
                    </div>
                    
                    {/* Dynamic Message Box: Form se data yahan aayega */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-orange-700 bg-orange-100/50 p-2 rounded-lg">
                      <Calendar size={13} /> 
                      <span>Follow-up: <span className="underline decoration-dotted">{rem.callBackDate}</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 italic font-medium">No active call back reminders found.</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/recruitment')}
              className="w-full mt-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100 rounded-lg transition-colors border border-dashed border-orange-200"
            >
              Manage All Call Backs
            </button>
          </div>

          {/* System Status Widget */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
            <h4 className="text-[10px] text-slate-500 uppercase font-extrabold tracking-widest mb-4">Server Status</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold tracking-tighter">99.9%</span>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic">All cloud systems are currently operational.</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;