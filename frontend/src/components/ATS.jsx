
import React, { useState, useEffect,useRef, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Mail, MessageCircle,Upload, 
  Filter, CheckSquare, Square, FileText, Cpu, Trash2, Edit, X, Briefcase,BarChart3 
} from 'lucide-react';
import { useParsing } from '../hooks/useParsing';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom';


const ATS = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);


  const API_URL = 'http://localhost:5000/candidates';
// Pehle: const API_URL = 'http://localhost:5000/candidates';
// const API_URL = 'http://localhost:5000/api/candidates';  
  const JOBS_URL = 'http://localhost:5000/jobs';
  const BULK_UPLOAD_URL = 'http://localhost:5000/candidates/bulk-upload';

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [parsedResults, setParsedResults] = useState([]); 
  const [showPreview, setShowPreview] = useState(false); 
  const [isAutoParsing, setIsAutoParsing] = useState(false);

 const initialFormState = {
    srNo: '', date: new Date().toISOString().split('T')[0], location: '', position: '',
    fls: '', name: '', contact: '', email: '', companyName: '', experience: '',
    ctc: '', expectedCtc: '', noticePeriod: '', status: 'Applied', client: '',
    spoc: '', source: '', resume: null, callBackDate: ''
};
  const [formData, setFormData] = useState(initialFormState);

  // --- Data Fetch Logic ---
  const fetchData = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setCandidates(data);

      const jobRes = await fetch(`${JOBS_URL}?isTemplate=false`);
      const jobData = await jobRes.json();
      setJobs(jobData);
    } catch (error) { console.error("Error fetching data:", error); }
  };

  useEffect(() => { fetchData(); }, []);


const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
        const response = await axios.post(BULK_UPLOAD_URL, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
            // ✅ Show detailed success message
            let successMsg = `✅ Upload Successful!\n\n`;
            successMsg += `Successfully Saved: ${response.data.processed}\n`;
            
            if (response.data.duplicatesInFile > 0 || response.data.duplicatesInDB > 0) {
                successMsg += `Duplicates Skipped: ${response.data.duplicatesInFile + response.data.duplicatesInDB}\n`;
            }
            
            if (response.data.totalInFile) {
                successMsg += `Total Rows in File: ${response.data.totalInFile}`;
            }
            
            alert(successMsg);
            
            // ✅ REAL-TIME UPDATE
            if (response.data.allCandidates && response.data.allCandidates.length > 0) {
                setCandidates(response.data.allCandidates);
                console.log("✅ Updated candidates list with:", response.data.allCandidates.length, "records");
            } else {
                fetchData();
            }
        } else {
            alert("❌ Upload Failed: " + response.data.message);
        }
    } catch (error) {
        console.error("Bulk Upload Error:", error);
        
        let errorMsg = "Something went wrong";
        
        if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        } else if (error.response?.status === 400) {
            errorMsg = "Invalid data format. Please check your Excel file.";
        } else if (error.response?.status === 500) {
            errorMsg = "Server error. Please try again later.";
        }
        
        alert("❌ Error: " + errorMsg);
    } finally {
        event.target.value = null;
    }
};

// Iske niche ka ye useParsing wala part MATH HATANA, isse rehne dena
const { selectedIds, isParsing, toggleSelection, selectAll, handleBulkParse } = useParsing(async () => {
    await fetchData();
    const res = await fetch(API_URL);
    const latestData = await res.json();
    const newlyParsed = latestData.filter(c => selectedIds.includes(c._id));
    setParsedResults(newlyParsed);
    setShowPreview(true);
});

  /* ================= NEW BULK COMMUNICATION LOGIC ================= */

  // ✅ BULK EMAIL: BCC use karke privacy maintain ki hai
  const handleBulkEmail = () => {
    const selected = candidates.filter(c => selectedIds.includes(c._id));
    const emails = selected.map(c => c.email).filter(e => e); // Filter empty emails

    if (emails.length === 0) return alert("No valid emails found!");

    const mailtoLink = `mailto:?bcc=${emails.join(',')}&subject=Interview Selection&body=Hello, We have reviewed your profile...`;
    window.location.href = mailtoLink;
  };

  // ✅ BULK WHATSAPP: Delay ke saath multiple windows open karega
  const handleBulkWhatsApp = () => {
    const selected = candidates.filter(c => selectedIds.includes(c._id));
    const contacts = selected.map(c => c.contact).filter(p => p);

    if (contacts.length === 0) return alert("No valid contacts found!");

    if (window.confirm(`Opening ${contacts.length} WhatsApp chats. Please allow pop-ups.`)) {
      contacts.forEach((phone, index) => {
        const cleanPhone = phone.replace(/\D/g, '');
        // 1 second ka delay taaki browser block na kare
        setTimeout(() => {
          window.open(`https://wa.me/${cleanPhone}?text=Hello, we saw your profile on our ATS dashboard...`, '_blank');
        }, index * 1000);
      });
    }
  };

  /* ================================================================ */

  const sendEmail = (email) => {
    window.location.href = `mailto:${email}?subject=Job Opportunity&body=Hello, we saw your profile...`;
  };

  const sendWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  // const handleDelete = async (id) => {
  //   if (window.confirm("Are you sure?")) {
  //     try {
  //       await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  //       fetchData();
  //     } catch (err) { alert("Delete failed"); }
  //   }
  // };

const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
        try {
            console.log("Deleting ID:", id); // Check karein console mein id sahi aa rahi hai
            
            const response = await fetch(`${API_URL}/${id}`, { 
                method: 'DELETE' 
            });

            if (response.ok) {
                alert("Deleted successfully!");
                fetchData(); 
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Delete Error:", err);
            alert("Network error: Could not reach the server.");
        }
    }
};





  const handleEdit = (candidate) => {
    setEditId(candidate._id);
    setFormData({ ...candidate, resume: null }); 
    setShowModal(true);
  };

 
const handleInputChange = async (e) => {
  const { name, value, files } = e.target;

  // 1. Pehle value ko format kar lete hain (Name aur Email ke liye)
  let finalValue = value;

  if (name === 'name' && value) {
    
    finalValue = value.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  if (name === 'email' && value) {
    // gnail.con -> gmail.com logic
    finalValue = value.toLowerCase()
      .replace(/@gnail\.con$/, '@gmail.com')
      .replace(/@gnail\.com$/, '@gmail.com')
      .replace(/@gmail\.con$/, '@gmail.com')
      .replace(/@gmal\.com$/, '@gmail.com');
  }

  // 2. Resume Parsing Logic (Ye tumhara original logic hai)
  if (name === 'resume') {
    const file = files[0];
    setFormData(prev => ({ ...prev, resume: file }));

    if (file) {
      setIsAutoParsing(true);
      const data = new FormData();
      data.append('resume', file);

      try {
        const response = await fetch('http://localhost:5000/candidates/parse-logic', {
          method: 'POST',
          body: data,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Parsed Data Received:", result);

          // Parsed data ko bhi format karke state mein save karenge
          setFormData(prev => ({
            ...prev,
            name: result.name ? (result.name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) : prev.name,
            email: result.email ? (result.email.toLowerCase().replace(/@gnail\.con$/, '@gmail.com').replace(/@gmail\.con$/, '@gmail.com')) : prev.email,
            contact: result.contact || prev.contact
          }));
        }
      } catch (error) {
        console.error("Auto-parse error:", error);
      } finally {
        setIsAutoParsing(false);
      }
    }
  } else {
    // 3. Normal Input update (Yahan 'finalValue' use ho rahi hai)
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  }
};


const handleAddCandidate = async (e) => {
  e.preventDefault();

  try {
    let response;
    
    if (editId) {
      // --- UPDATE LOGIC (For Edit/Call Back) ---
      // Agar hum edit kar rahe hain, toh hum JSON bhejenge taki empty strings sahi se handle ho jayein
      response = await fetch(`${API_URL}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) 
      });
    } else {
      // --- ADD NEW LOGIC (For New Candidate with File) ---
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (['statusHistory', '_id', '__v', 'updatedAt'].includes(key)) return;
        if (key === 'resume') {
          if (formData[key] instanceof File) data.append('resume', formData[key]);
        } else {
          data.append(key, formData[key] || "");
        }
      });

      response = await fetch(API_URL, { 
        method: 'POST', 
        body: data 
      });
    }

    if (response.ok) {
      alert(editId ? "✅ Profile Updated!" : "✅ Candidate Added!");
      setShowModal(false);
      setEditId(null);
      setFormData(initialFormState);
      fetchData(); // Dashboard/List refresh karne ke liye
    } else {
      const errJson = await response.json();
      alert("❌ Error: " + errJson.message);
    }
  } catch (err) { 
    console.error(err);
    alert("❌ Server Error"); 
  }
};
  const handleStatusChange = async (id, newStatus) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJob = filterJob ? c.position === filterJob : true;
    return matchesSearch && matchesJob;
  });

  // --- Client-side incremental rendering (lazy load rows) ---
  const CHUNK_SIZE = 50; // render 50 rows at a time
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  // Reset visibleCount when filter/search changes
  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [searchQuery, filterJob, candidates]);

  // Memoize the slice to avoid re-computing on unrelated renders
  const visibleCandidates = useMemo(() => filteredCandidates.slice(0, visibleCount), [filteredCandidates, visibleCount]);

  const loadMoreRef = useRef(null);
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(filteredCandidates.length, prev + CHUNK_SIZE));
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0.1 });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredCandidates.length]);

  const isAllSelected = filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length;

  const tableHeaders = [
    'Actions', 'Sr No.', 'Resume', 'Contact Tools', 'Date', 'Location', 'Position', 'FLS/Non FLS',
    'Name', 'Contact', 'Email', 'Company Name', 'Experience',
    'CTC', 'Expected CTC', 'Notice period', 'Status', 'Client',
    'SPOC', 'Source of CV'
  ];

  const statusOptions = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ATS Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage candidates & applications.</p>
        </div>
        
        <div className="flex gap-3 flex-wrap justify-center">
          {/* Hidden File Input for CSV */}
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleBulkUpload} 
            className="hidden" 
          />
          {selectedIds.length > 0 && (
            <>
              {/* ✅ BULK EMAIL BUTTON */}
              <button onClick={handleBulkEmail} className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-200 transition shadow-sm border border-indigo-200">
                <Mail size={18} /> Email Selected ({selectedIds.length})
              </button>

              {/* ✅ BULK WHATSAPP BUTTON */}
              <button onClick={handleBulkWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition shadow-sm border border-green-200">
                <MessageCircle size={18} /> WhatsApp Selected ({selectedIds.length})
              </button>

              <button onClick={handleBulkParse} disabled={isParsing} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition shadow-sm ${isParsing ? 'bg-indigo-200 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                <Cpu size={18} className={isParsing ? 'animate-spin' : ''} /> 
                {isParsing ? 'Parsing...' : `Parse (${selectedIds.length})`}
              </button>
            </>
          )}

          <button 
            onClick={() => navigate('/analytics')} 
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-bold hover:bg-purple-200 transition shadow-sm border border-purple-200"
          >
            <BarChart3 size={18} /> View Reports
          </button>

{/* NEW: BULK IMPORT BUTTON */}
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg transition"
          >
            <Upload size={20} /> Bulk Import (CSV)
          </button>

          <button onClick={() => { setEditId(null); setFormData(initialFormState); setShowModal(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 shadow-lg transition">
            <Plus size={20} /> Add Candidate
          </button>
        </div>
      </div>

      {/* PARSING PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Cpu size={20}/> Parsed Results</h3>
              <button onClick={() => setShowPreview(false)}><X size={24}/></button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-slate-500 font-bold"><th>Name</th><th>Email</th><th>Contact</th></tr></thead>
                <tbody>
                  {parsedResults.map(p => (
                    <tr key={p._id} className="border-b">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">{p.email}</td>
                      <td className="py-2">{p.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setShowPreview(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 focus-within:ring-2 ring-indigo-500/20 transition-all">
          <Search className="text-gray-400" size={20} />
          <input type="text" placeholder="Search by name, email or position..." className="flex-1 outline-none text-gray-700 bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 min-w-[250px]">
          <Filter className="text-indigo-600" size={20} />
          <select className="flex-1 outline-none text-gray-700 bg-transparent cursor-pointer font-bold" value={filterJob} onChange={(e) => setFilterJob(e.target.value)}>
            <option value="">All Job Roles</option>
            {jobs.map((job) => (<option key={job._id} value={job.role}>{job.role}</option>))}
          </select>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2000px]">
          <thead>
            <tr className="bg-emerald-50 text-slate-700 border-b-2 border-emerald-100">
              <th className="p-4 w-[60px]">
                <div onClick={() => selectAll(filteredCandidates.map(c => c._id))} className="cursor-pointer">
                  {isAllSelected ? <CheckSquare size={22} className="text-indigo-600" /> : <Square size={22} className="text-slate-400" />}
                </div>
              </th>
              {tableHeaders.map((header) => (<th key={header} className="p-4 text-sm font-bold whitespace-nowrap">{header}</th>))}
            </tr>
          </thead>
          <tbody>
            {visibleCandidates.map((candidate,index) => (
              <tr key={candidate._id} className="border-b hover:bg-slate-50 transition">
                <td className="p-4 text-center">
                  <div onClick={() => toggleSelection(candidate._id)} className="cursor-pointer">
                    {selectedIds.includes(candidate._id) ? <CheckSquare className="text-indigo-600" size={20} /> : <Square className="text-slate-300" size={20} />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(candidate)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(candidate._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </div>
                </td>
                <td className="p-4 font-medium">{index + 1}</td>
                <td className="p-4">
                   {candidate.resume && (
                     <a href={candidate.resume} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FileText size={18} /></a>
                   )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => sendEmail(candidate.email)} className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200" title="Send Email"><Mail size={16}/></button>
                    <button onClick={() => sendWhatsApp(candidate.contact)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="WhatsApp Message"><MessageCircle size={16}/></button>
                  </div>
                </td>
                <td className="p-4">{candidate.date}</td>
                <td className="p-4">{candidate.location}</td>
                <td className="p-4 font-bold">{candidate.position}</td>
                <td className="p-4">{candidate.fls}</td>
                <td className="p-4 font-bold">{candidate.name}</td>
                <td className="p-4">{candidate.contact}</td>
                <td className="p-4">{candidate.email}</td>
                <td className="p-4">{candidate.companyName}</td>
                <td className="p-4">{candidate.experience}</td>
                <td className="p-4">{candidate.ctc}</td>
                <td className="p-4">{candidate.expectedCtc}</td>
                <td className="p-4">{candidate.noticePeriod}</td>
                <td className="p-4">
                  <select className={`p-1.5 rounded-full text-xs font-bold ${candidate.status === 'Hired' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`} value={candidate.status} onChange={(e) => handleStatusChange(candidate._id, e.target.value)}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-4">{candidate.client}</td>
                <td className="p-4">{candidate.spoc}</td>
                <td className="p-4">{candidate.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>             

      {/* Sentinel for lazy-loading more rows */}
      <div ref={loadMoreRef} className="w-full text-center py-6 text-sm text-gray-500">
        {visibleCount < filteredCandidates.length ? 'Loading more candidates...' : 'All candidates loaded.'}
      </div>

{showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">{editId ? '📝 Edit Profile' : '👤 Add New Candidate'}</h2>
            <form onSubmit={handleAddCandidate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-full bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                   <label className="text-sm font-bold block mb-2 text-slate-600">Resume Upload (PDF/DOC)</label>
                   <input type="file" name="resume" accept=".pdf,.doc,.docx" onChange={handleInputChange} className="w-full text-sm" />
                </div>

                {/* Yahan Mapping ho rahi hai (srNo aur contact ko yahan se hata diya hai) */}
                {Object.keys(initialFormState).map(key => {
                  if (['status', 'fls', 'resume', 'position', 'contact', 'srNo'].includes(key)) return null;
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input 
                        type={key === 'date' ? 'date' : 'text'} 
                        name={key} 
                        className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition ${key === 'email' && formData.email && !formData.email.includes('@gmail.com') ? 'border-orange-500 ring-orange-200' : 'border-slate-200 ring-indigo-500/20'}`} 
                        value={formData[key] || ''} 
                        onChange={handleInputChange} 
                      />
                      {key === 'email' && formData.email && !formData.email.includes('@gmail.com') && (
                        <p className="text-[9px] text-orange-600 font-bold mt-1 italic">Typo? check if it's @gmail.com</p>
                      )}
                    </div>
                  )
                })}
                <div>
  {/* Call Back Date Input Field */}
<div>
  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Call Back Date</label>
  <input 
    type="text" // 'date' ki jagah 'text' use karein agar aap "1 month" likhna chahti hain
    name="callBackDate" 
    placeholder="e.g. 25 Jan or 15 days"
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-orange-500/20"
    value={formData.callBackDate || ''} 
    onChange={handleInputChange} 
  />
</div>
</div>
{/* --- STATUS DROPDOWN (Added manually) --- */}
<div>
  <label className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Status</label>
  <select 
    name="status" 
    value={formData.status || 'Applied'} 
    onChange={handleInputChange} 
    className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg outline-none font-bold text-indigo-700"
  >
    {['Applied', 'Screening', 'Interview', 'Offer', 'Joined', 'Rejected'].map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
</div>

{/* --- JOINING DATE (Sirf tab dikhega jab Status 'Joined' hoga) --- */}
{formData.status === 'Joined' && (
  <div>
    <label className="text-[10px] font-extrabold text-green-600 uppercase tracking-wider">Joining Date</label>
    <input 
      type="date" 
      name="hiredDate" 
      value={formData.hiredDate ? formData.hiredDate.split('T')[0] : ''} 
      onChange={handleInputChange} 
      className="w-full p-2.5 bg-green-50 border border-green-200 rounded-lg outline-none focus:ring-2 ring-green-500/20"
      required={formData.status === 'Joined'}
    />
  </div>
)}



                {/* 1. Naya Phone Input (Mapping ke bahar lekin Grid ke andar) */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Contact Number</label>
                  <PhoneInput
                    country={'in'}
                    value={formData.contact}
                    onChange={(phone) => setFormData(prev => ({ ...prev, contact: phone }))}
                    inputStyle={{ width: '100%', height: '42px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    containerStyle={{ width: '100%' }}
                  />
                </div>

                {/* 2. Position Dropdown */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Position</label>
                  <select name="position" value={formData.position} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option value="">Select Role</option>
                    {jobs.map(j => <option key={j._id} value={j.role}>{j.role}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition">Save Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATS;


