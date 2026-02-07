
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';

const Register = () => {
  const navigate = useNavigate();

  // 1. State banaya data store karne ke liye
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Helper function: Capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation - 10 digits only
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  // Password validation
  const validatePassword = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;

    return {
      valid: hasUppercase && hasLowercase && hasNumber && hasSpecial && hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      hasMinLength
    };
  };

  // Input change hone par state update karega
  const handleChange = (e) => {
    let { name, value } = e.target;

    // Auto-capitalize name
    if (name === 'name') {
      value = capitalizeWords(value);
    }

    // Remove non-digits from phone
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData({ ...formData, [name]: value });

    // Clear field errors on change
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    if (error) setError('');
  };

  // 2. Backend ko data bhejne wala function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const { name, email, phone, password } = formData;
    const errors = {};

    // Validation checks
    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.password = 'Password must be 8+ chars with uppercase, lowercase, number & special character (!@#$%^&* etc)';
      }
    }

    // If errors exist, show them
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration Successful! Redirecting to Login...');
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Server error. Make sure backend is running.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{backgroundColor: 'var(--neutral-50)'}}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)'}}>
        
        <h2 className="text-3xl font-bold text-center mb-6" style={{color: 'var(--secondary-main)'}}>Create Account</h2>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-center font-medium" style={{backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-main)', color: 'var(--error-main)'}}>
            {error}
          </div>
        )}

        {/* Form Tag me onSubmit lagaya */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name}
              onChange={handleChange} 
              placeholder="Enter your name"
              className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.name && <p className="text-sm mt-1" style={{color: 'var(--error-main)'}}>{fieldErrors.name}</p>}
            <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>First letter of each word will be capitalized</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange} 
              placeholder="your@email.com"
              className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone}
              onChange={handleChange} 
              placeholder="1234567890"
              maxLength="10"
              className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.phone && <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>}
            <p className="text-gray-500 text-xs mt-1">Must be exactly 10 digits</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Create Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password}
              onChange={handleChange} 
              placeholder="Min 8 chars with A-Z, a-z, 0-9, !@#..."
              className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
            <p className="text-gray-500 text-xs mt-1">Must include: uppercase, lowercase, number & special character</p>
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
