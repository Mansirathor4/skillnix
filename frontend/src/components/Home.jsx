
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-sans">
      
      {/* --- LEFT COLUMN: Brand & Hero Text ONLY --- */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 lg:p-16 text-white flex flex-col justify-center relative overflow-hidden">
        
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Main Text Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Transform <br />
            <span className="text-blue-200">the way you recruit</span>
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 font-medium mb-8 leading-relaxed">
            TriNexus System: The ultimate Hybrid OS combining ATS, CRM, and HRMS into one seamless workflow.
          </p>

          {/* Social Proof / Dashboard Image Placeholder */}
          <div className="mt-8 flex items-center space-x-4">
             <div className="flex -space-x-2">
               {[1,2,3,4].map((i) => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-gray-300"></div>
               ))}
             </div>
             <p className="text-sm font-medium text-blue-200">Trusted by top companies</p>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: People Connect HR Card (No Sign Up Form) --- */}
      <div className="w-full md:w-1/2 bg-gray-50 p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center">
        
        {/* The Premium Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all hover:scale-[1.01] duration-500">
          
          {/* Header */}
          <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h2 className="text-3xl font-bold text-white tracking-wide mb-2">
              People Connect HR
            </h2>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-[0.2em]">
              Choose your access point
            </p>
          </div>

          {/* Buttons Section */}
          <div className="p-8 space-y-5 bg-white">
            
            {/* Login Button */}
            <Link to="/login" className="block w-full group">
              <button className="w-full py-4 rounded-xl font-bold text-lg text-slate-700 bg-gray-50 border-2 border-gray-100 shadow-sm transition-all duration-300 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-lg group-hover:-translate-y-1">
                Login to Account
              </button>
            </Link>

            {/* Separator */}
            <div className="flex items-center justify-center space-x-2">
              <span className="h-px w-12 bg-gray-200"></span>
              <span className="text-xs text-gray-400 font-medium uppercase">OR</span>
              <span className="h-px w-12 bg-gray-200"></span>
            </div>

            {/* Register Button */}
            <Link to="/register" className="block w-full group">
              <button className="relative w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:shadow-blue-500/50 group-hover:-translate-y-1 overflow-hidden">
                <span className="relative z-10">Register New ID</span>
                {/* Shine Effect */}
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-700"></div>
              </button>
            </Link>

          </div>
          
          {/* Footer inside card */}
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">Secure & Encrypted Access • v1.0.0</p>
          </div>

        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          By continuing, you agree to TriNexus Terms of Service.
        </p>

      </div>
    </div>
  );
};

export default Home;