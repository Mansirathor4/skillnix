

import React, { useEffect, useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const PeopleConnectHRHome = () => {
  const [showModal, setShowModal] = useState(false);
  const [task, setTask] = useState(""); 
  const [homeData, setHomeData] = useState(null);
  
  const [notifications, setNotifications] = useState([]); 
  const [showNotifDropdown, setShowNotifDropdown] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0); 

  const notifRef = useRef(null);

  // ✅ Helper Function: Check if date is within 24 hours
  const isWithin24Hours = (dateString) => {
    if (!dateString) return true; // Agar date nahi hai toh dikha do (safety)
    const now = new Date();
    const notifDate = new Date(dateString);
    const diffInMs = now - notifDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours < 24; // True agar 24 ghante se kam hua hai
  };

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const taskRes = await fetch('http://localhost:5000/api/daily-task');
        const taskData = await taskRes.json();
        setTask(taskData.task);

        const updatesRes = await fetch('http://localhost:5000/api/home-updates');
        const updatesData = await updatesRes.json();
        setHomeData(updatesData);

        // --- Prepare Notifications ---
        const newNotifications = [];

        // 1. System Alert (Isme hum abhi ka time daal rahe hain)
        newNotifications.push({
            id: 1,
            title: "System Alert",
            message: "You have 3 new applications for the Full Stack role!",
            type: "alert",
            timeDisplay: "Just now", 
            timestamp: new Date().toISOString() // Aaj ka time
        });

        // 2. Announcement (Agar API se date aayi toh wo use karenge, warna abhi ka time)
        if (updatesData && updatesData.announcement) {
            newNotifications.push({
                id: 2,
                title: "Special Announcement",
                message: updatesData.announcement,
                type: "info",
                timeDisplay: "Today",
                // Maan lo API date bhejta hai, warna fallback current time
                timestamp: updatesData.timestamp || new Date().toISOString() 
            });
        }

        // ✅ FILTER LOGIC: Sirf wo rakho jo 24 hours ke andar ke hain
        const activeNotifications = newNotifications.filter(n => isWithin24Hours(n.timestamp));

        setNotifications(activeNotifications);
        setUnreadCount(activeNotifications.length);

        setShowModal(true);
        
      } catch (err) {
        console.error("Backend error:", err);
        setTask("Review the 5 new applications for the Full Stack Developer role.");
        
        // Fallback notification with timestamp
        const errorNotif = { 
            id: 1, 
            title: "System Alert", 
            message: "Backend unreachable.", 
            type: "alert", 
            timeDisplay: "Now",
            timestamp: new Date().toISOString()
        };
        
        // Yahan bhi filter check (halanki ye abhi bana hai toh pass hoga hi)
        if(isWithin24Hours(errorNotif.timestamp)){
             setNotifications([errorNotif]);
             setUnreadCount(1);
        }
        setShowModal(true);
      }
    };

    fetchRealTimeData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
        setUnreadCount(0); 
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen relative font-sans">
      <Toaster position="top-right" />

      {/* --- NOTIFICATION BELL SECTION --- */}
      <div className="fixed top-6 right-8 z-[60]" ref={notifRef}>
        <button 
            onClick={handleBellClick}
            className="relative bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-gray-100"
        >
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse border-2 border-white">
                    {unreadCount}
                </span>
            )}
        </button>

        {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden origin-top-right transform transition-all">
                <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                    <h3 className="font-bold">Notifications</h3>
                    <span className="text-xs bg-indigo-500 px-2 py-1 rounded text-indigo-100">{notifications.length} New</span>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div key={notif.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start gap-3">
                                <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {notif.type === 'alert' ? '⚠️' : '📢'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{notif.title}</p>
                                    <p className="text-sm text-gray-600 mt-1 leading-snug">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{notif.timeDisplay}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No new notifications 🎉
                        </div>
                    )}
                </div>
                
                {/* ✅ "Clear all" wala button poora hata diya hai. Ab neeche kuch nahi dikhega. */}
            </div>
        )}
      </div>

      {/* --- POP-UP MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-110 animate-fade-in-up">
            <div className="text-center">
              <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Today's Focus</h2>
              <p className="text-gray-600 mb-6 italic font-medium">"{task}"</p>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Got it, Let's Work!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero & Cards Sections (Same as before) */}
      <div className="relative h-[550px] w-full overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80" className="w-full h-full object-cover brightness-[0.3]" alt="Office"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <h1 className="text-7xl font-black tracking-tight mb-4">PeopleConnectHR <span className="text-blue-500">Portal</span></h1>
          <p className="text-2xl font-light mb-10 max-w-3xl text-center opacity-90 italic">Efficiency is doing things right; effectiveness is doing the right things.</p>
          <a href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full text-2xl font-black transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.5)]">Open System Modules →</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-b-2 border-pink-500 hover:-translate-y-2 transition-transform">
            <div className="flex items-center gap-4 mb-4"><div className="bg-pink-100 p-3 rounded-xl text-3xl">
                <img src="data:image/jpeg;base64,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" alt="Cake" className="w-6 h-6"/>
                </div><h3 className="text-xl font-extrabold text-gray-800">Birthdays</h3></div>
            <div className="space-y-2"><p className="text-gray-700 font-bold">{homeData ? homeData.birthdays[0] : "Mansi"} (Today)</p><p className="text-gray-500 text-sm">{homeData ? homeData.birthdays[1] : "Rahul"} (Upcoming)</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-b-8 border-orange-500 hover:-translate-y-2 transition-transform">
            <div className="flex items-center gap-4 mb-4"><div className="bg-orange-100 p-3 rounded-xl text-3xl">🏮</div><h3 className="text-xl font-extrabold text-gray-800">Holidays</h3></div>
            <p className="text-gray-700 font-bold italic">{homeData ? homeData.holiday.name : "Republic Day"}</p>
            <p className="text-orange-600 text-sm font-semibold">{homeData ? homeData.holiday.date : "Jan 26"} - Office Closed</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-b-8 border-yellow-500">
             <div className="flex items-center gap-4 mb-4"><div className="bg-yellow-100 p-3 rounded-xl text-3xl">🏆</div><h3 className="text-xl font-extrabold text-gray-800">Wins</h3></div>
             <p className="text-gray-700 font-medium">{homeData ? homeData.achievement : "Sales Team hit ₹10L target!"}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-b-8 border-indigo-500">
             <div className="flex items-center gap-4 mb-4"><div className="bg-indigo-100 p-3 rounded-xl text-3xl">🚀</div><h3 className="text-xl font-extrabold text-gray-800">Updates</h3></div>
             <p className="text-gray-700">{homeData ? homeData.version : "ATS v2.1 is Live"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleConnectHRHome;
