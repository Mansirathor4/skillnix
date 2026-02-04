import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, RefreshCw } from 'lucide-react';
import API_URL from '../config';

const CandidateSearch = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    position: '',
    companyName: '',
    location: '',
    expMin: '',
    expMax: '',
    ctcMin: '',
    ctcMax: '',
    expectedCtcMin: '',
    expectedCtcMax: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (String(value).trim() !== '') params.append(key, value.trim());
    });
    return params.toString();
  };

  const hasAnyFilter = () => Object.values(filters).some(v => String(v).trim() !== '');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!hasAnyFilter()) {
      setResults([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const query = buildQuery();
      const res = await fetch(`${API_URL}/candidates?${query}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Search failed');
        setResults([]);
        return;
      }
      setResults(data.data || []);
    } catch (err) {
      setError('Server error. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      position: '',
      companyName: '',
      location: '',
      expMin: '',
      expMax: '',
      ctcMin: '',
      ctcMax: '',
      expectedCtcMin: '',
      expectedCtcMax: ''
    });
    setResults([]);
    setError('');
  };

  useEffect(() => {
    if (!hasAnyFilter()) {
      setResults([]);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      const fetchAuto = async () => {
        setLoading(true);
        setError('');
        try {
          const query = buildQuery();
          const res = await fetch(`${API_URL}/candidates?${query}`);
          const data = await res.json();
          if (!res.ok) {
            setError(data.message || 'Search failed');
            setResults([]);
            return;
          }
          setResults(data.data || []);
        } catch (err) {
          setError('Server error. Please try again.');
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAuto();
    }, 400);

    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Advanced Candidate Search</h1>
            <p className="text-slate-500">Search by any field and range filters.</p>
          </div>
          <button
            onClick={() => navigate('/ats')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
          >
            <ArrowLeft size={18} /> Back to ATS
          </button>
        </div>

        <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Position</label>
              <input name="position" value={filters.position} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="Role / Position" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">City</label>
              <input name="location" value={filters.location} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="City / Location" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Company Name</label>
              <input name="companyName" value={filters.companyName} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="Company" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Experience (Min)</label>
              <input name="expMin" value={filters.expMin} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="e.g. 1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Experience (Max)</label>
              <input name="expMax" value={filters.expMax} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">CTC (Min)</label>
              <input name="ctcMin" value={filters.ctcMin} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="e.g. 4" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">CTC (Max)</label>
              <input name="ctcMax" value={filters.ctcMax} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="e.g. 10" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Expected CTC (Min)</label>
              <input name="expectedCtcMin" value={filters.expectedCtcMin} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Expected CTC (Max)</label>
              <input name="expectedCtcMax" value={filters.expectedCtcMax} onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg" placeholder="e.g. 12" />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
              <Search size={18} /> Search
            </button>
            <button type="button" onClick={handleReset} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200">
              <RefreshCw size={18} /> Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="p-4 text-sm text-slate-600 font-semibold">
            Results: {results.length}
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Position</th>
                <th className="p-3 text-left">City</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Experience</th>
                <th className="p-3 text-left">CTC</th>
                <th className="p-3 text-left">Expected CTC</th>
              </tr>
            </thead>
            <tbody>
              {results.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3">{c.position}</td>
                  <td className="p-3">{c.location}</td>
                  <td className="p-3">{c.companyName}</td>
                  <td className="p-3">{c.experience}</td>
                  <td className="p-3">{c.ctc}</td>
                  <td className="p-3">{c.expectedCtc}</td>
                </tr>
              ))}
              {!loading && results.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-400" colSpan={9}>No candidates found.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="p-6 text-center text-slate-400" colSpan={9}>Searching...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidateSearch;
