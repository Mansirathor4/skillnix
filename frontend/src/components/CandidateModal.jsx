
// import React from 'react';
// import { X, Clock } from 'lucide-center';

// const CandidateModal = ({ show, onClose, onSubmit, formData, setFormData, editId }) => {
//     if (!show) return null;

//     // 1. INPUT HANDLE FUNCTION
//     const handleInputChange = (e) => {
//         const { name, value, files } = e.target;
//         setFormData({ ...formData, [name]: files ? files[0] : value });
//     };

//     // 2. SMART EMAIL CHECK (Jab user email dal kar dusre box pe click karega)
//     const handleEmailCheck = async (email) => {
//         // Agar email khali hai ya hum "Edit" kar rahe hain, toh check mat karo
//         if (!email || editId) return; 

//         try {
//             const response = await fetch(`http://localhost:5000/api/candidates/check-email/${email}`);
//             const result = await response.json();

//             if (result.exists) {
//                 alert(`⚠️ Alert: Ye candidate pehle se registered hai!\nPichla Status: ${result.candidate.status}`);
                
//                 // Pura purana data form mein auto-fill ho jayega
//                 setFormData({
//                     ...result.candidate,
//                     // Date format ko input ke liye fix karna (YYYY-MM-DD)
//                     date: result.candidate.date ? result.candidate.date.split('T')[0] : ''
//                 }); 
//             }
//         } catch (error) {
//             console.error("Email check error:", error);
//         }
//     };

//     const statusOptions = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

//     return (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto p-8 relative">
                
//                 {/* Header */}
//                 <div className="flex justify-between items-center mb-8 border-b pb-4 sticky top-0 bg-white z-10">
//                     <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
//                         {editId ? 'Edit Candidate Info' : 'Register New Candidate'}
//                     </h2>
//                     <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl font-bold transition-colors">&times;</button>
//                 </div>

//                 <form onSubmit={onSubmit} className="space-y-8">
//                     {/* Input Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        
//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Candidate Name</label>
//                             <input type="text" name="name" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20" value={formData.name || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Contact Number</label>
//                             <input type="text" name="contact" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.contact || ''} onChange={handleInputChange} />
//                         </div>

//                         {/* EMAIL INPUT WITH ONBLUR CHECK */}
//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase text-indigo-600">Email Address (Unique)</label>
//                             <input 
//                                 type="email" 
//                                 name="email" 
//                                 className="w-full p-2.5 border border-indigo-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 bg-indigo-50/10" 
//                                 value={formData.email || ''} 
//                                 onChange={handleInputChange}
//                                 onBlur={(e) => handleEmailCheck(e.target.value)} // Yahan duplicate check hota hai
//                                 placeholder="example@gmail.com"
//                             />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Location</label>
//                             <input type="text" name="location" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.location || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Experience (Years)</label>
//                             <input type="text" name="experience" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.experience || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Current CTC</label>
//                             <input type="text" name="ctc" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.ctc || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase font-bold text-indigo-600">Update Status</label>
//                             <select name="status" className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-indigo-600 bg-indigo-50/30 outline-none" value={formData.status || 'Applied'} onChange={handleInputChange}>
//                                 {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
//                             </select>
//                         </div>
//                     </div>

//                    \* Timeline Section (Sirf Edit mode mein dikhai dega) */
//                    {/* Professional Timeline UI - Replaced Old Version */}
// {(editId || (formData.statusHistory && formData.statusHistory.length > 0)) && (
//     <div className="mt-10 bg-indigo-50/30 p-8 rounded-2xl border border-indigo-100">
//         <h3 className="font-black text-sm uppercase mb-8 text-indigo-600 flex items-center gap-3">
//             <Clock size={20} className="text-indigo-500" /> 
//             Application Tracking History
//         </h3>
        
//         <div className="space-y-0 relative ml-3">
//             {/* Vertical Line */}
//             <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-200"></div>

//             {Array.isArray(formData.statusHistory) && formData.statusHistory.length > 0 ? (
//                 // slice(0).reverse() isliye taaki original array kharab na ho aur latest status upar aaye
//                 formData.statusHistory.slice(0).reverse().map((h, i) => (
//                     <div key={i} className="relative pl-10 pb-10 last:pb-0">
//                         {/* Status Dot with dynamic colors */}
//                         <div className={`absolute left-[-6px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
//                             h.status === 'Hired' ? 'bg-emerald-500' : 
//                             h.status === 'Rejected' ? 'bg-red-500' : 
//                             h.status === 'Interview' ? 'bg-orange-500' : 'bg-indigo-500'
//                         }`}></div>
                        
//                         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
//                             <div className="flex justify-between items-start mb-1">
//                                 <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
//                                     h.status === 'Hired' ? 'bg-emerald-100 text-emerald-700' : 
//                                     h.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
//                                 }`}>
//                                     {h.status}
//                                 </span>
//                                 <span className="text-[10px] font-medium text-slate-400">
//                                     {h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('en-GB', { 
//                                         day: '2-digit', month: 'short', year: 'numeric', 
//                                         hour: '2-digit', minute: '2-digit' 
//                                     }) : 'Date N/A'}
//                                 </span>
//                             </div>
//                             <p className="text-sm text-slate-700 font-medium leading-relaxed mt-2">
//                                 <span className="text-slate-400 italic font-normal">Remark:</span> "{h.remark || 'Status updated'}"
//                             </p>
//                         </div>
//                     </div>
//                 ))
//             ) : (
//                 <div className="pl-10 text-slate-400 italic text-sm">No status history found.</div>
//             )}
//         </div>
//     </div>
// )}
//                     {/* Footer Buttons */}
//                     <div className="flex gap-4 border-t pt-8 sticky bottom-0 bg-white">
//                         <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
//                         <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
//                             {editId ? 'Save Updates' : 'Confirm Registration'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default CandidateModal;



// import React from 'react';
// import { X, Clock, Calendar, Link } from 'lucide-react'; // Added icons

// const CandidateModal = ({ show, onClose, onSubmit, formData, setFormData, editId }) => {
//     if (!show) return null;

//     // 1. INPUT HANDLE FUNCTION
//     const handleInputChange = (e) => {
//         const { name, value, files } = e.target;
//         setFormData({ ...formData, [name]: files ? files[0] : value });
//     };

//     // 2. SMART EMAIL CHECK
//     const handleEmailCheck = async (email) => {
//         if (!email || editId) return; 

//         try {
//             const response = await fetch(`http://localhost:5000/api/candidates/check-email/${email}`);
//             const result = await response.json();

//             if (result.exists) {
//                 alert(`⚠️ Alert: Ye candidate pehle se registered hai!\nPichla Status: ${result.candidate.status}`);
//                 setFormData({
//                     ...result.candidate,
//                     date: result.candidate.date ? result.candidate.date.split('T')[0] : ''
//                 }); 
//             }
//         } catch (error) {
//             console.error("Email check error:", error);
//         }
//     };

//     const statusOptions = ['Applied', 'Screening', 'Interview', 'Offer', 'Joined', 'Rejected'];
//     // New Options for Analytics
//     const sourceOptions = ['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Website', 'Other'];

//     return (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto p-8 relative">
                
//                 {/* Header */}
//                 <div className="flex justify-between items-center mb-8 border-b pb-4 sticky top-0 bg-white z-10">
//                     <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
//                         {editId ? 'Edit Candidate Info' : 'Register New Candidate'}
//                     </h2>
//                     <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl font-bold transition-colors">&times;</button>
//                 </div>

//                 <form onSubmit={onSubmit} className="space-y-8">
//                     {/* Input Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        
//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Candidate Name</label>
//                             <input type="text" name="name" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20" value={formData.name || ''} onChange={handleInputChange} required />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Contact Number</label>
//                             <input type="text" name="contact" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.contact || ''} onChange={handleInputChange} required />
//                         </div>

//                         {/* EMAIL INPUT */}
//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase text-indigo-600">Email Address (Unique)</label>
//                             <input 
//                                 type="email" 
//                                 name="email" 
//                                 className="w-full p-2.5 border border-indigo-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 bg-indigo-50/10" 
//                                 value={formData.email || ''} 
//                                 onChange={handleInputChange}
//                                 onBlur={(e) => handleEmailCheck(e.target.value)}
//                                 placeholder="example@gmail.com"
//                                 required
//                             />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Location</label>
//                             <input type="text" name="location" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.location || ''} onChange={handleInputChange} />
//                         </div>

//                         {/* --- NEW FIELD: SOURCE (For Source-wise Performance Report) --- */}
//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
//                                 <Link size={10} /> Source (Required for Analytics)
//                             </label>
//                             <select name="source" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none bg-white" value={formData.source || ''} onChange={handleInputChange} required>
//                                 <option value="" disabled>Select Source</option>
//                                 {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
//                             </select>
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Experience (Years)</label>
//                             <input type="text" name="experience" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.experience || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase">Current CTC</label>
//                             <input type="text" name="ctc" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" value={formData.ctc || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 uppercase font-bold text-indigo-600">Update Status</label>
//                             <select name="status" className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-indigo-600 bg-indigo-50/30 outline-none" value={formData.status || 'Applied'} onChange={handleInputChange}>
//                                 {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
//                             </select>
//                         </div>

//                         {/* --- NEW FIELD: JOINING DATE (Only shows if Status is 'Joined') --- */}
//                         {formData.status === 'Joined' && (
//                             <div className="space-y-1 animate-fadeIn">
//                                 <label className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1">
//                                     <Calendar size={10} /> Joining Date (For Time-to-Hire)
//                                 </label>
//                                 <input 
//                                     type="date" 
//                                     name="hiredDate" 
//                                     className="w-full p-2.5 border border-green-200 bg-green-50 rounded-lg outline-none" 
//                                     value={formData.hiredDate ? formData.hiredDate.split('T')[0] : ''} 
//                                     onChange={handleInputChange} 
//                                     required={formData.status === 'Joined'}
//                                 />
//                             </div>
//                         )}
//                     </div>

//                     {/* Timeline Section (Sirf Edit mode mein dikhai dega) */}
//                     {(editId || (formData.statusHistory && formData.statusHistory.length > 0)) && (
//                         <div className="mt-10 bg-indigo-50/30 p-8 rounded-2xl border border-indigo-100">
//                             <h3 className="font-black text-sm uppercase mb-8 text-indigo-600 flex items-center gap-3">
//                                 <Clock size={20} className="text-indigo-500" /> 
//                                 Application Tracking History
//                             </h3>
                            
//                             <div className="space-y-0 relative ml-3">
//                                 <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-200"></div>

//                                 {Array.isArray(formData.statusHistory) && formData.statusHistory.length > 0 ? (
//                                     formData.statusHistory.slice(0).reverse().map((h, i) => (
//                                         <div key={i} className="relative pl-10 pb-10 last:pb-0">
//                                             <div className={`absolute left-[-6px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
//                                                 h.status === 'Joined' ? 'bg-emerald-500' : 
//                                                 h.status === 'Rejected' ? 'bg-red-500' : 
//                                                 h.status === 'Interview' ? 'bg-orange-500' : 'bg-indigo-500'
//                                             }`}></div>
                                            
//                                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
//                                                 <div className="flex justify-between items-start mb-1">
//                                                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
//                                                         h.status === 'Joined' ? 'bg-emerald-100 text-emerald-700' : 
//                                                         h.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
//                                                     }`}>
//                                                         {h.status}
//                                                     </span>
//                                                     <span className="text-[10px] font-medium text-slate-400">
//                                                         {h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('en-GB', { 
//                                                             day: '2-digit', month: 'short', year: 'numeric', 
//                                                             hour: '2-digit', minute: '2-digit' 
//                                                         }) : 'Date N/A'}
//                                                     </span>
//                                                 </div>
//                                                 <p className="text-sm text-slate-700 font-medium leading-relaxed mt-2">
//                                                     <span className="text-slate-400 italic font-normal">Remark:</span> "{h.remark || 'Status updated'}"
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     ))
//                                 ) : (
//                                     <div className="pl-10 text-slate-400 italic text-sm">No status history found.</div>
//                                 )}
//                             </div>
//                         </div>
//                     )}

//                     {/* Footer Buttons */}
//                     <div className="flex gap-4 border-t pt-8 sticky bottom-0 bg-white">
//                         <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
//                         <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
//                             {editId ? 'Save Updates' : 'Confirm Registration'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default CandidateModal;



// import React, { useEffect } from 'react';
// import { X, Calendar, Link, Briefcase, Upload, User, MapPin, Mail, Building, DollarSign, Clock, Phone } from 'lucide-react'; 

// const CandidateModal = ({ show, onClose, onSubmit, formData, setFormData, editId }) => {
//     if (!show) return null;

//     // 1. INPUT HANDLE FUNCTION
//     const handleInputChange = (e) => {
//         const { name, value, files } = e.target;
//         setFormData({ ...formData, [name]: files ? files[0] : value });
//     };

//     // 2. SMART EMAIL CHECK
//     const handleEmailCheck = async (email) => {
//         if (!email || editId) return; 

//         try {
//             const response = await fetch(`http://localhost:5000/api/candidates/check-email/${email}`);
//             const result = await response.json();

//             if (result.exists) {
//                 alert(`⚠️ Alert: Candidate already exists!\nPrevious Status: ${result.candidate.status}`);
//                 setFormData({
//                     ...result.candidate,
//                     date: result.candidate.date ? result.candidate.date.split('T')[0] : ''
//                 }); 
//             }
//         } catch (error) {
//             console.error("Email check error:", error);
//         }
//     };

//     const statusOptions = ['Applied', 'Screening', 'Interview', 'Offer', 'Joined', 'Rejected'];
//     const sourceOptions = ['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Website', 'Other'];
//     const positionOptions = ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'HR Intern', 'Sales Executive', 'Software Engineer'];

//     return (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 font-sans">
//             <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                
//                 {/* Header */}
//                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
//                     <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
//                         <User className="text-[#6366f1]" size={24} /> 
//                         {editId ? 'Edit Candidate Details' : 'Add New Candidate'}
//                     </h2>
//                     <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
//                         <X size={24} />
//                     </button>
//                 </div>

//                 <form onSubmit={onSubmit} className="p-8 space-y-6 bg-[#f8f9fc]">
                    
//                     {/* 1. Resume Upload Section */}
//                     <div className="bg-[#f0f4ff] border-2 border-dashed border-[#c7d2fe] rounded-lg p-8 text-center hover:bg-[#e0e7ff] transition-colors cursor-pointer relative group">
//                         <div className="flex flex-col items-center justify-center space-y-2">
//                             <Upload className="text-[#6366f1] group-hover:scale-110 transition-transform" size={32} />
//                             <label className="block text-sm font-bold text-[#4338ca]">Resume Upload (PDF/DOC)</label>
//                             <span className="text-xs text-slate-500">Click to browse or drag file here</span>
//                         </div>
//                         <input 
//                             type="file" 
//                             name="resume" 
//                             onChange={handleInputChange} 
//                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                         />
//                         {formData.resume && (
//                             <p className="mt-2 text-xs text-green-600 font-bold">Selected: {formData.resume.name || "File Updated"}</p>
//                         )}
//                     </div>

//                     {/* 2. Main Form Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
                        
//                         {/* Row 1 */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
//                             <input type="date" name="date" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none bg-white text-sm" 
//                                 value={formData.date || new Date().toISOString().split('T')[0]} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
//                             <input type="text" name="location" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.location || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Candidate Name</label>
//                             <input type="text" name="name" required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.name || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
//                             <input type="email" name="email" required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" 
//                                 value={formData.email || ''} onChange={handleInputChange} onBlur={(e) => handleEmailCheck(e.target.value)} placeholder="name@example.com"/>
//                         </div>

//                         {/* Row 2 */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
//                             <input type="text" name="companyName" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.companyName || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Experience</label>
//                             <input type="text" name="experience" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.experience || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CTC</label>
//                             <input type="text" name="ctc" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.ctc || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected CTC</label>
//                             <input type="text" name="expectedCtc" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.expectedCtc || ''} onChange={handleInputChange} />
//                         </div>

//                         {/* Row 3 */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notice Period</label>
//                             <input type="text" name="noticePeriod" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.noticePeriod || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</label>
//                             <input type="text" name="client" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.client || ''} onChange={handleInputChange} />
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SPOC</label>
//                             <input type="text" name="spoc" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.spoc || ''} onChange={handleInputChange} />
//                         </div>

//                         {/* --- IMPORTANT: SOURCE (Analytics) --- */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-[#4338ca]">Source *</label>
//                             <select name="source" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.source || ''} onChange={handleInputChange} required>
//                                 <option value="">Select Source</option>
//                                 {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
//                             </select>
//                         </div>

//                         {/* Row 4 */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Call Back Date</label>
//                             <input type="date" name="callBackDate" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.callBackDate || ''} onChange={handleInputChange} />
//                         </div>

//                         {/* Contact Number with Flag */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
//                             <div className="flex w-full">
//                                 <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
//                                     🇮🇳 +91
//                                 </span>
//                                 <input type="text" name="contact" className="rounded-none rounded-r-lg bg-white border border-gray-200 text-gray-900 focus:ring-[#6366f1] focus:border-[#6366f1] block flex-1 min-w-0 w-full text-sm p-2.5 outline-none" placeholder="9876543210" value={formData.contact || ''} onChange={handleInputChange} />
//                             </div>
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Position</label>
//                             <select name="position" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.position || ''} onChange={handleInputChange} required>
//                                 <option value="">Select Role</option>
//                                 {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
//                             </select>
//                         </div>

//                         {/* --- IMPORTANT: STATUS (Analytics) --- */}
//                         <div className="space-y-1">
//                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 text-[#4338ca]">
//                                 Status *
//                             </label>
//                             <select name="status" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-[#e0e7ff] text-[#4338ca] font-bold text-sm" value={formData.status || 'Applied'} onChange={handleInputChange}>
//                                 {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
//                             </select>
//                         </div>
                        
//                         {/* --- CONDITIONAL: JOINING DATE --- */}
//                         {formData.status === 'Joined' && (
//                             <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-green-50 p-4 rounded-lg border border-green-200 animate-fade-in-down">
//                                 <label className="text-xs font-bold text-green-700 uppercase flex items-center gap-2 mb-2">
//                                     <Calendar size={14} /> Joining Date (Required for 'Time-to-Hire' Report)
//                                 </label>
//                                 <input 
//                                     type="date" 
//                                     name="hiredDate" 
//                                     className="w-full md:w-1/3 p-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-400 outline-none bg-white text-sm" 
//                                     value={formData.hiredDate ? formData.hiredDate.split('T')[0] : ''} 
//                                     onChange={handleInputChange} 
//                                     required={formData.status === 'Joined'}
//                                 />
//                             </div>
//                         )}

//                     </div>

//                     {/* Footer Actions */}
//                     <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
//                         <button type="button" onClick={onClose} className="px-8 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm uppercase tracking-wide">
//                             Cancel
//                         </button>
//                         <button type="submit" className="px-8 py-3 bg-[#6366f1] text-white font-bold rounded-lg hover:bg-[#4f46e5] shadow-lg shadow-indigo-200 transition-all text-sm uppercase tracking-wide">
//                             {editId ? 'Save Changes' : 'Save Candidate'}
//                         </button>
//                     </div>

//                 </form>
//             </div>
//         </div>
//     );
// };

// export default CandidateModal;



import React, { useEffect } from 'react';
import { X, Calendar, Link, Briefcase, Upload, User } from 'lucide-react'; 

const CandidateModal = ({ show, onClose, onSubmit, formData, setFormData, editId }) => {
    if (!show) return null;

    // 1. INPUT HANDLE FUNCTION
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({ ...formData, [name]: files ? files[0] : value });
    };

    // 2. SMART EMAIL CHECK
    const handleEmailCheck = async (email) => {
        if (!email || editId) return; 

        try {
            const response = await fetch(`http://localhost:5000/api/candidates/check-email/${email}`);
            const result = await response.json();

            if (result.exists) {
                alert(`⚠️ Alert: Candidate already exists!\nPrevious Status: ${result.candidate.status}`);
                setFormData({
                    ...result.candidate,
                    date: result.candidate.date ? result.candidate.date.split('T')[0] : ''
                }); 
            }
        } catch (error) {
            console.error("Email check error:", error);
        }
    };

    const statusOptions = ['Applied', 'Screening', 'Interview', 'Offer', 'Joined', 'Rejected'];
    const sourceOptions = ['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Website', 'Other'];
    const positionOptions = ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'HR Intern', 'Sales Executive', 'Software Engineer'];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 font-sans">
            {/* Scroll Fix: max-h-[85vh] aur overflow-y-auto ensure karega ki scrollbar aaye */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-y-auto flex flex-col">
                
                {/* Header - Fixed at Top */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="text-[#6366f1]" size={24} /> 
                        {editId ? 'Edit Candidate Details' : 'Add New Candidate'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 space-y-6 bg-[#f8f9fc]">
                    
                    {/* Resume Upload Section */}
                    <div className="bg-[#f0f4ff] border-2 border-dashed border-[#c7d2fe] rounded-lg p-6 text-center hover:bg-[#e0e7ff] transition-colors cursor-pointer relative group">
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <Upload className="text-[#6366f1] group-hover:scale-110 transition-transform" size={32} />
                            <label className="block text-sm font-bold text-[#4338ca]">Resume Upload (PDF/DOC)</label>
                            <span className="text-xs text-slate-500">Click to browse or drag file here</span>
                        </div>
                        <input type="file" name="resume" onChange={handleInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        {formData.resume && (
                            <p className="mt-2 text-xs text-green-600 font-bold">Selected: {formData.resume.name || "File Updated"}</p>
                        )}
                    </div>

                    {/* --- IMPORTANT SECTION: ANALYTICS FIELDS (TOP PE RAKHA HAI) --- */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Required for Analytics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* 1. STATUS (Top Left) */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#4338ca] uppercase tracking-wider flex items-center gap-1">
                                    Current Status *
                                </label>
                                <select 
                                    name="status" 
                                    className="w-full p-2.5 border-2 border-indigo-100 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-indigo-50 text-[#4338ca] font-bold text-sm" 
                                    value={formData.status || 'Applied'} 
                                    onChange={handleInputChange}
                                >
                                    {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                            {/* 2. SOURCE (Top Middle) */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#4338ca] uppercase tracking-wider">Source *</label>
                                <select name="source" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.source || ''} onChange={handleInputChange} required>
                                    <option value="">Select Source</option>
                                    {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* 3. JOINING DATE (Only visible if Joined) */}
                            {formData.status === 'Joined' && (
                                <div className="space-y-1 animate-fadeIn">
                                    <label className="text-[11px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar size={12}/> Joining Date *
                                    </label>
                                    <input 
                                        type="date" 
                                        name="hiredDate" 
                                        className="w-full p-2.5 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 outline-none bg-green-50 text-sm" 
                                        value={formData.hiredDate ? formData.hiredDate.split('T')[0] : ''} 
                                        onChange={handleInputChange} 
                                        required={formData.status === 'Joined'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- GENERAL DETAILS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Candidate Name</label>
                            <input type="text" name="name" required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.name || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                            <input type="email" name="email" required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" 
                                value={formData.email || ''} onChange={handleInputChange} onBlur={(e) => handleEmailCheck(e.target.value)} placeholder="name@example.com"/>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                            <div className="flex w-full">
                                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">🇮🇳 +91</span>
                                <input type="text" name="contact" className="rounded-none rounded-r-lg bg-white border border-gray-200 text-gray-900 focus:ring-[#6366f1] focus:border-[#6366f1] block flex-1 min-w-0 w-full text-sm p-2.5 outline-none" placeholder="9876543210" value={formData.contact || ''} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input type="date" name="date" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" 
                                value={formData.date || new Date().toISOString().split('T')[0]} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Position</label>
                            <select name="position" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.position || ''} onChange={handleInputChange} required>
                                <option value="">Select Role</option>
                                {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
                            <input type="text" name="location" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.location || ''} onChange={handleInputChange} />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                            <input type="text" name="companyName" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.companyName || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Experience</label>
                            <input type="text" name="experience" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.experience || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CTC</label>
                            <input type="text" name="ctc" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.ctc || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected CTC</label>
                            <input type="text" name="expectedCtc" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.expectedCtc || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notice Period</label>
                            <input type="text" name="noticePeriod" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.noticePeriod || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</label>
                            <input type="text" name="client" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.client || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SPOC</label>
                            <input type="text" name="spoc" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.spoc || ''} onChange={handleInputChange} />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Call Back Date</label>
                            <input type="date" name="callBackDate" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none bg-white text-sm" value={formData.callBackDate || ''} onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* Footer Actions - Sticky Bottom */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 sticky bottom-0 bg-[#f8f9fc] z-10">
                        <button type="button" onClick={onClose} className="px-8 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm uppercase tracking-wide">
                            Cancel
                        </button>
                        <button type="submit" className="px-8 py-3 bg-[#6366f1] text-white font-bold rounded-lg hover:bg-[#4f46e5] shadow-lg shadow-indigo-200 transition-all text-sm uppercase tracking-wide">
                            {editId ? 'Save Changes' : 'Save Candidate'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CandidateModal;