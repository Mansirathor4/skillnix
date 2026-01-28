// src/hooks/useParsing.js
import { useState } from 'react';
export const useParsing = (fetchCandidates) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isParsing, setIsParsing] = useState(false);

    // Selection toggle karne ka function
    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Sabko select/unselect karne ka function
    const selectAll = (allIds) => {
        if (selectedIds.length === allIds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    };

    // Backend ko call karne ka function
    const handleBulkParse = async () => {
        if (selectedIds.length === 0) return alert("Pehle candidates select karein!");
        
        setIsParsing(true);
        try {
            const res = await fetch('http://localhost:5000/candidates/bulk-parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            const data = await res.json();
            alert(data.message);
            
            setSelectedIds([]); // Selection clear karein
            if (fetchCandidates) fetchCandidates(); // List refresh karein
        } catch (err) {
            console.error("Parsing failed:", err);
            alert("Server connection failed!");
        } finally {
            setIsParsing(false);
        }
    };

    return {
        selectedIds,
        isParsing,
        toggleSelection,
        selectAll,
        handleBulkParse
    };
};