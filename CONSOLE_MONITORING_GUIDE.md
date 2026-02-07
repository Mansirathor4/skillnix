# 📊 CONSOLE MONITORING GUIDE - UPLOAD TRACKING

## Quick Reference: What You'll See in Console

### Step 1: Start Upload
```
--- 🚀 STEP 1: API Hit & File Received ---
--- ⏱️  Upload Start Time: 2026-02-06T14:45:23.123Z ---
--- ✅ STEP 2: Excel File Read Success ---
```

### Step 2: Column Mapping Detection
```
--- 📋 Detected header row in row 1 ---
--- 🧭 Column Names: ['Name', 'Email', 'Contact', 'Position', 'Company', ...]

--- 📊 Column Assignments:
  Name column: 1
  Email column: 2
  Contact column: 3
  Position column: 4
  Company column: 5
```

### Step 3: Data Processing (Repeats)
```
⏳ Progress: 50/15000 (0.3%) - 2:45:24 PM
⏳ Progress: 100/15000 (0.7%) - 2:45:25 PM
⏳ Progress: 150/15000 (1.0%) - 2:45:27 PM
⏳ Progress: 200/15000 (1.3%) - 2:45:28 PM
... continues every 50 records ...
⏳ Progress: 15000/15000 (100.0%) - 2:45:59 PM
```

### Step 4: Duplicate Detection Examples

#### If Duplicate Email Found:
```
⚠️  DUPLICATE DETECTED - Row 245:
  Name: "John Doe"
  Email: "john@gmail.com" (DUPLICATE EMAIL)
  Contact: "9876543210"
```

#### If Duplicate Contact Found:
```
⚠️  DUPLICATE DETECTED - Row 567:
  Name: "Jane Smith"
  Email: "jane@yahoo.com"
  Contact: "9876543210" (DUPLICATE CONTACT)
```

### Step 5: Data Extraction Preview (First 3 rows only)

```
--- 🔍 ROW 2 Data Extraction (sheet 1):
  Raw Name from col 1: "John Doe"
  Company from col 5: "Tech Corp"
  Position from col 4: "Senior Developer"
  Experience from col 7: "5 years"
  CTC from col 8: "15 LPA"
  Expected CTC from col 9: "18 LPA"
  Notice from col 10: "30 days"
  Email from col 2: "john@gmail.com"
  Contact from col 3: "9876543210"

--- ✅ FINAL Candidate Data #1:
  Name: "John Doe"
  Company: "Tech Corp"
  Position: "Senior Developer"
  Experience: "5 years"
  CTC: "15 LPA"
  Expected CTC: "18 LPA"
  Notice Period: "30 days"
```

### Step 6: Final Summary Report

```
--- 📦 ✅ UPLOAD COMPLETE ---
--- ⏱️ Total Duration: 34.52 seconds ---
--- 📊 SUMMARY REPORT:
  📥 Total Rows in File: 15000
  ✅ Valid Records: 13766
  💾 Successfully Saved: 13766
  ⚠️  Duplicates in File: 1100
  ⚠️  Duplicates in DB: 134
  💯 Success Rate: 91.8%
--- ================== ---
```

---

## Understanding Each Message Type

### Progress Messages
```
⏳ Progress: 2000/15000 (13.3%) - 2:45:35 PM
│              │     │       │
│              │     │       └─ Time of update
│              │     └─ Percentage complete
│              └─ Records processed
└─ Symbol = Still uploading
```

### Duplicate Message
```
⚠️  DUPLICATE DETECTED - Row 245:
│   
└─ Yellow warning triangle = Duplicate found (will be skipped)

DUPLICATE EMAIL = This exact email exists in current file already
DUPLICATE CONTACT = This exact phone number exists in current file already
```

### Data Extract Message  
```
--- 🔍 ROW 2 Data Extraction (sheet 1):
│   │  │    
│   │  └─ Which sheet (1, 2, 3, etc.)
│   └─ Row number being processed
└─ Shows what was extracted from each column
```

### Final Report Components

| Component | Meaning |
|-----------|---------|
| 📥 Total Rows in File | All data rows (excluding headers) |
| ✅ Valid Records | Rows without duplicates in file |
| 💾 Successfully Saved | Actually inserted in database |
| ⚠️  Duplicates in File | Same file has this email/contact twice |
| ⚠️  Duplicates in DB | Already exists from previous uploads |
| 💯 Success Rate | (Valid / Total) × 100 |

---

## Time-Based Analysis

### How to Calculate Upload Speed

```
Total Duration: 34.52 seconds
Total Records: 15000 records

Speed = 15000 ÷ 34.52 = 434 records/second
```

### Expected Performance

| File Size | # Records | Time | Speed |
|-----------|-----------|------|-------|
| 1MB | 1,000 | 3-5s | 200-300/sec |
| 5MB | 5,000 | 12-15s | 330-400/sec |
| 10MB | 10,000 | 23-30s | 330-435/sec |
| 20MB | 15,000 | 35-45s | 330-430/sec |

**If slower**: Check file size, network speed, server load

---

## Duplicate Analysis

### In the Summary Report:
```
Duplicates in File: 1100
+ Duplicates in DB: 134
= Total Duplicates: 1234

Valid Records: 13766
Total Rows: 15000

Check: 13766 + 1234 = 15000 ✅
(Always should match exactly)
```

### Why Duplicates Matter

| Duplicate Type | What It Means | Action |
|---|---|---|
| **In File** | Same email appears twice in this Excel | Both copies skipped except first |
| **In DB** | Email already exists from last upload | New copy skipped |
| **None** | First time uploading this email | Record inserted |

---

## Troubleshooting Checklist

### If Console Shows Wrong Column Mapping:
```
Email from col 2: "random_text"  ← WRONG!
```
- The system detected email in wrong column
- This happens when Excel columns are not standard order
- On next upload, use "Bulk Import (Manual)" to map manually

### If Lots of Duplicates Appear:
```
⚠️  DUPLICATE DETECTED - Row 45: john@gmail.com
⚠️  DUPLICATE DETECTED - Row 89: john@gmail.com
⚠️  DUPLICATE DETECTED - Row 234: john@gmail.com
```
- Excel file has many rows with same email
- This is normal (clean your data)
- System correctly skips all duplicates

###If No Data Extracted:
```
--- ✅ FINAL Candidate Data #1:
  Name: ""  ← EMPTY!
  Company: ""
  Position: ""
```
- Name column is empty in Excel
- System couldn't find required fields
- Try "Bulk Import (Manual)" to map columns

---

## Mobile View (if needed)

You can also check  upload progress from phone by:
1. Open DevTools (F12) on the browser
2. Most of the messages will appear
3. Or open Network tab to see streaming requests

---

## What NOT to Worry About

- ✅ "Duplicates in File: 1100" - Normal! System handles it
- ✅ "Fallback Email: @ats.local" - Only if no email in Excel
- ✅ Multiple batches shown - Normal insertion pattern

---

## Key Takeaways

1. **Progress every 50 records** - You'll see updates frequently
2. **Duplicates logged** - First 10 shown with details
3. **Data preview shown** - First 3 rows extracted data
4. **Final summary clear** - Shows what went in DB
5. **Total duration reported** - Tells you how fast it was

**Look for:** ⏳ symbols during upload, ✅ at completion!

