# Bulk Upload JSON Parsing Errors - Fixes Applied

## Problem Summary
The bulk upload feature was experiencing multiple JSON parsing errors when processing large files (9,000+ records):
- "Expected ':' after property name in JSON"
- "Unterminated string in JSON"
- "Unexpected token" errors at various positions
- Connection reset errors (ERR_CONNECTION_RESET)
- Network timeouts after ~12,000 records

## Root Causes Identified
1. **Unescaped characters in data fields** - Excel data containing newlines, special characters, or quotes broke JSON serialization
2. **Memory exhaustion** - Large batch sizes (1000 records) caused memory pressure when processing 14,000+ records
3. **Incomplete lines in stream** - TextDecoder was splitting JSON objects across packet boundaries, creating incomplete/malformed lines
4. **Missing garbage collection** - No yielding to event loop, causing server memory to accumulate

## Fixes Applied

### 1. Backend Controller Fixes (`candidateController.js`)

#### A. Added Data Sanitization Function
```javascript
const sanitizeField = (value) => {
    if (!value) return '';
    let str = String(value).trim();
    // Remove control characters except spaces and tabs
    str = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    return str;
};
```
- Removes all control characters that could break JSON
- Applied to ALL field values before storing

#### B. Reduced Batch Sizes for Better Memory Management
```javascript
const STREAM_BATCH_SIZE = 50;  // Was 100 - flush more frequently
const DB_BATCH_SIZE = 500;     // Was 1000 - use less memory per batch
```
- Smaller batches reduce peak memory usage
- More frequent flushes prevent accumulation

#### C. Enhanced Stream Flushing with Error Handling
```javascript
const flushStream = () => {
    if (streamBatch.length === 0) return;
    try {
        const message = {...};
        const jsonStr = JSON.stringify(message);
        res.write(jsonStr + '\n');
    } catch (err) {
        console.error('Error serializing stream batch:', err.message);
    }
    streamBatch = [];
};
```
- Wrapped JSON serialization in try-catch
- Prevents crashes if serialization fails

#### D. Improved Database Batch Flushing with Memory Cleanup
```javascript
const flushDbBatch = async () => {
    // ... bulkWrite operations ...
    finally {
        dbBatch = [];
        bulkOps.length = 0; // Clear array references
        await new Promise(resolve => setImmediate(resolve)); // Yield to event loop
    }
};
```
- Clears array references to help garbage collection
- Yields to event loop between batches

#### E. Applied Sanitization to All Data Fields
```javascript
const candidateData = {
    name: sanitizeField(rawName) || '',
    email: sanitizeField(emailVal).toLowerCase() || '',
    contact: sanitizeField(contactVal) || '',
    date: finalDate,
    location: sanitizeField(getData('location')) || '',
    position: sanitizeField(getData('position')) || '',
    // ... all other fields sanitized ...
};
```

#### F. Added Connection Headers for Long-Running Requests
```javascript
res.setHeader('Content-Type', 'application/x-ndjson');
res.setHeader('Transfer-Encoding', 'chunked');
res.setHeader('Connection', 'keep-alive');
res.setHeader('Timeout', '3600000'); // 1 hour timeout
```

### 2. Frontend Component Fixes (`ATS.jsx`)

#### A. Implemented Line Buffer for Partial JSON Handling
```javascript
let buffer = ''; // Buffer for incomplete lines

while (!isComplete) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            // ... handle message ...
        } catch (e) {
            console.error('Parse error for line:', e.message);
        }
    }
}
```
- Handles incomplete JSON lines at chunk boundaries
- Keeps partial lines in buffer until complete
- Properly handles final buffer on stream end

#### B. Enhanced Error Logging
```javascript
} catch (e) {
    console.error('Parse error for line:', e.message);
    if (line.length > 0 && line.length < 200) {
        console.error('Problematic line:', line);
    } else if (line.length > 0) {
        console.error('Problematic line (truncated):', line.substring(0, 100), '...');
    }
}
```
- Better error debugging with line context
- Prevents massive console spam for large lines

## Expected Improvements

1. **JSON Parsing**: All fields now sanitized - control characters removed
2. **Memory Usage**: Reduced by ~50% due to smaller batch sizes
3. **Stream Handling**: Properly buffers incomplete lines
4. **Performance**: Event loop gets to process between batches
5. **Reliability**: Better handles large files (14,000+ records)

## Testing Recommendations

1. Test with large Excel files (10,000+ records)
2. Test with files containing special characters (accents, emoji, line breaks)
3. Test with slow network connections
4. Monitor server memory usage during upload
5. Verify no data corruption with sanitization

## Configuration Notes

- **Batch sizes** can be tuned based on server memory:
  - If still running out of memory: reduce to `STREAM_BATCH_SIZE = 25` and `DB_BATCH_SIZE = 250`
  - If processing too slowly: can increase batch sizes after verifying memory headroom

- **Keep-alive timeout** (1 hour) can be adjusted if needed

- **Sanitization** will strip control characters - this is safe for names/emails/positions
