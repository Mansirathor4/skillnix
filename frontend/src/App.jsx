

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';




// Existing imports
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ATS from './components/ATS';
import Recruitment from './components/Recruitment';
import Homeunder from './components/Homeunder';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CandidateSearch from './components/CandidateSearch';

// ✅ STEP 1: Jobs Component Import karein
import Jobs from './pages/Jobs'; 

function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{backgroundColor: 'var(--bg-secondary)'}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ats" element={<ATS />} /> 
         <Route path="/homeunder" element={<Homeunder />} /> 
          
          {/* ✅ STEP 2: Jobs Page ka Route add karein */}
          <Route path="/jobs" element={<Jobs />} />

          {/* ✅ STEP 3: Recruitment Page ka Route add karein */}
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/candidate-search" element={<CandidateSearch />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;