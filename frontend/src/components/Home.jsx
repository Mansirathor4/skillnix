

import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans" style={{backgroundColor: 'var(--bg-primary)'}}>
      
      {/* --- LEFT COLUMN: Brand & Hero Text ONLY --- */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 text-white flex flex-col justify-center relative overflow-hidden" style={{background: 'var(--gradient-primary)'}}>
        
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Main Text Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Transform <br />
            <span style={{color: 'var(--primary-light)'}}>the way you recruit</span>
          </h1>
          
          <p className="text-lg md:text-xl font-medium mb-8 leading-relaxed" style={{color: 'rgba(255, 255, 255, 0.9)'}}>
            PeopleConnectHR: The ultimate Hybrid OS combining ATS, CRM, and HRMS into one seamless workflow.
          </p>

          {/* Social Proof / Dashboard Image Placeholder */}
          <div className="mt-8 flex items-center space-x-4">
             <div className="flex -space-x-2">
               {[1,2,3,4].map((i) => (
                 <div key={i} className="w-10 h-10 rounded-full" style={{borderWidth: '2px', borderColor: 'var(--primary-light)', backgroundColor: 'rgba(255,255,255,0.3)'}}></div>
               ))}
             </div>
             <p className="text-sm font-medium" style={{color: 'rgba(255, 255, 255, 0.8)'}}>Trusted by top companies</p>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: People Connect HR Card (No Sign Up Form) --- */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center" style={{backgroundColor: 'var(--neutral-50)'}}>
        
        {/* The Premium Card */}
        <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-500" style={{backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)'}}>
          
          {/* Header */}
          <div className="p-8 text-center relative overflow-hidden" style={{background: 'var(--neutral-800)'}}>
            <div className="absolute top-0 left-0 w-full h-1" style={{background: 'var(--gradient-primary)'}}></div>
            <h2 className="text-3xl font-bold text-white tracking-wide mb-2">
              People Connect HR
            </h2>
            <p className="text-xs uppercase font-bold tracking-[0.2em]" style={{color: 'var(--text-secondary)', opacity: 0.7}}>
              Choose your access point
            </p>
          </div>

          {/* Buttons Section */}
          <div className="p-8 space-y-5" style={{backgroundColor: 'var(--bg-primary)'}}>
            
            {/* Login Button */}
            <Link to="/login" className="block w-full group">
              <button className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 group-hover:-translate-y-1" style={{color: 'var(--text-primary)', backgroundColor: 'var(--neutral-100)', border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'}} onMouseEnter={(e) => {e.target.style.borderColor = 'var(--primary-light)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = 'var(--shadow-lg)';}} onMouseLeave={(e) => {e.target.style.borderColor = 'var(--border-light)'; e.target.style.backgroundColor = 'var(--neutral-100)'; e.target.style.boxShadow = 'var(--shadow-sm)';}}>
                Login to Account
              </button>
            </Link>

            {/* Separator */}
            <div className="flex items-center justify-center space-x-2">
              <span className="h-px w-12" style={{backgroundColor: 'var(--border-light)'}}></span>
              <span className="text-xs font-medium uppercase" style={{color: 'var(--text-tertiary)'}}>OR</span>
              <span className="h-px w-12" style={{backgroundColor: 'var(--border-light)'}}></span>
            </div>

            {/* Register Button */}
            <Link to="/register" className="block w-full group">
              <button className="relative w-full py-4 rounded-xl font-bold text-lg text-white overflow-hidden transition-all duration-300 group-hover:-translate-y-1" style={{background: 'var(--gradient-primary)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'}} onMouseEnter={(e) => e.target.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.5)'} onMouseLeave={(e) => e.target.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)'}>
                <span className="relative z-10">Register New ID</span>
                {/* Shine Effect */}
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-700"></div>
              </button>
            </Link>

          </div>
          
          {/* Footer inside card */}
          <div className="p-4 text-center" style={{backgroundColor: 'var(--neutral-50)', borderTop: '1px solid var(--border-light)'}}>
            <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>Secure & Encrypted Access • v1.0.0</p>
          </div>

        </div>

        <p className="mt-8 text-center text-sm" style={{color: 'var(--text-tertiary)'}}>
          By continuing, you agree to PeopleConnectHR Terms of Service.
        </p>

      </div>
    </div>
  );
};

export default Home;
// export default Home;