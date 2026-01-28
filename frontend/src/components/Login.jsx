

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // ✅ Updated HandleSubmit as per your request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { email, password } = formData;

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // ✅ Using the specific URL and Logic you provided
      const res = await fetch('http://localhost:5000/api/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // --- SUCCESS CASE ---
        localStorage.setItem('token', data.token); // Token save karein
        localStorage.setItem('userEmail', email); 
        localStorage.setItem('isLoggedIn', 'true');

        setSuccess('Login Successful! Redirecting...');
        
        setTimeout(() => {
          window.location.href = '/homeunder'; // Direct redirect
        }, 1000);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError("Backend server start nahi hai! Terminal mein 'node server.js' chalayein.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        
        <h2 className="text-3xl font-bold text-center text-indigo-900 mb-6">Login</h2>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600">Email Address</label>
            <input 
              type="email" 
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@company.com" 
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600">Password</label>
            <input 
              type="password" 
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          New here? <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Register Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;