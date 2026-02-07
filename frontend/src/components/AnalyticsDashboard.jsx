// frontend/src/components/AnalyticsDashboard.jsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Replace with your actual API URL
    fetch('http://localhost:5000/api/analytics/dashboard-stats')
      .then(res => res.json())
      .then(result => setData(result))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  if (!data) return <div className="p-10 text-center">Loading Analytics...</div>;

  // Colors for charts - Theme-consistent palette
  const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#0ea5e9'];

  return (
    <div className="p-6 min-h-screen" style={{backgroundColor: 'var(--neutral-50)'}}>
      <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--text-primary)'}}>ATS Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Daily CV Submission Tracking */}
        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)'}}>
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Daily CV Submissions</h3>
          <LineChart width={400} height={250} data={data.dailySubmissions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </div>

        {/* 2. Source-wise Performance */}
        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)'}}>
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Source-wise Performance</h3>
          <BarChart width={400} height={250} data={data.sourcePerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#a855f7" />
          </BarChart>
        </div>

        {/* 3. Offer vs Joining Ratio */}
        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)'}}>
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Offer vs Joining Ratio</h3>
          <PieChart width={400} height={250}>
            <Pie
              data={data.statusCounts}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="_id"
              label
            >
              {data.statusCounts?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/* 4. Time to Hire & Recruiter Productivity Info */}
        <div className="p-4 rounded-lg flex flex-col justify-center items-center" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)'}}>
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Key Metrics</h3>
          <div className="text-center mb-6">
            <p style={{color: 'var(--text-secondary)'}}>Average Time-to-Hire</p>
            <p className="text-4xl font-bold" style={{color: 'var(--info-main)'}}>
              {Math.round(data.avgTimeToHire)} Days
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Total Candidates Processed</p>
            <p className="text-2xl font-bold text-green-600">
               {/* Sum of all sources */}
               {data.sourcePerformance?.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;