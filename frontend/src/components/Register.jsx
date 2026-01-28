
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  // 1. State banaya data store karne ke liye
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Input change hone par state update karega
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Backend ko data bhejne wala function
  const handleSubmit = async (e) => {
    e.preventDefault(); // Page refresh hone se rokega

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration Successful! Redirecting to Login...');
        navigate('/login'); // Success hone par Login page par bhej dega
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Server error. Make sure backend is running.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">Create Account</h2>
        
        {/* Form Tag me onSubmit lagaya */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              name="name" 
              onChange={handleChange} 
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              name="email" 
              onChange={handleChange} 
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              onChange={handleChange} 
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Create Password</label>
            <input 
              type="password" 
              name="password" 
              onChange={handleChange} 
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow-md hover:opacity-90 transition-all mt-4">
            Register Now
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Already have an ID? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;