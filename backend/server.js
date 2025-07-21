const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'exercise-database.xlsx');
  }
});

const upload = multer({ storage: storage });

// In-memory storage for exercises
let exercises = [];

// Load exercises from Excel file
function loadExercises() {
  try {
    const workbook = XLSX.readFile('./uploads/exercise-database.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('Available sheets:', workbook.SheetNames);
    console.log('Using sheet:', sheetName);
    
    // Try different parsing approaches
    let exercisesData = [];
    
    // Method 1: Try direct JSON conversion (works if headers are in first row)
    try {
      exercisesData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Method 1 - Direct JSON conversion found', exercisesData.length, 'rows');
      
      if (exercisesData.length > 0 && exercisesData[0].Exercise) {
        // Success! Headers are in first row
        exercises = exercisesData.map((row, index) => ({
          id: index + 1,
          ...row
        }));
        console.log(`Loaded ${exercises.length} exercises using Method 1`);
        return;
      }
    } catch (error) {
      console.log('Method 1 failed, trying Method 2...');
    }
    
    // Method 2: Parse with headers option and find header row
    try {
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log('Method 2 - Raw data has', rawData.length, 'rows');
      
      // Find header row by looking for common exercise-related headers
      let headerRowIndex = -1;
      const possibleHeaders = ['Exercise', 'exercise', 'EXERCISE', 'Name', 'Exercise Name'];
      
      for (let i = 0; i < Math.min(rawData.length, 10); i++) { // Check first 10 rows
        const row = rawData[i];
        if (row && row.length > 0) {
          for (let header of possibleHeaders) {
            if (row[0] === header || row.some(cell => cell === header)) {
              headerRowIndex = i;
              console.log('Found header row at index:', i, 'with headers:', row);
              break;
            }
          }
          if (headerRowIndex !== -1) break;
        }
      }
      
      if (headerRowIndex === -1) {
        // Try to use first row as headers if it looks like headers
        const firstRow = rawData[0];
        if (firstRow && firstRow.length > 0 && firstRow.some(cell => typeof cell === 'string' && cell.length > 0)) {
          headerRowIndex = 0;
          console.log('Using first row as headers:', firstRow);
        }
      }
      
      if (headerRowIndex === -1) {
        console.error('Could not find header row. Available data:', rawData.slice(0, 3));
        return;
      }
      
      const headers = rawData[headerRowIndex];
      const dataRows = rawData.slice(headerRowIndex + 1);
      
      console.log('Headers found:', headers);
      console.log('Data rows to process:', dataRows.length);
      
      // Convert to objects
      exercises = dataRows
        .filter(row => row && row.length > 0 && row[0] && row[0].toString().trim()) // Filter out empty rows
        .map((row, index) => {
          const exercise = { id: index + 1 };
          headers.forEach((header, i) => {
            if (header && header.toString().trim()) {
              exercise[header.toString().trim()] = (row[i] || '').toString().trim();
            }
          });
          return exercise;
        });
      
      console.log(`Loaded ${exercises.length} exercises using Method 2`);
      
      // Log first few exercises for debugging
      if (exercises.length > 0) {
        console.log('Sample exercise:', exercises[0]);
      }
      
    } catch (error) {
      console.error('Method 2 failed:', error);
    }
    
    // Method 3: Try to parse with different options
    if (exercises.length === 0) {
      try {
        console.log('Trying Method 3 - Different parsing options...');
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 'A',
          defval: '',
          blankrows: false
        });
        
        console.log('Method 3 data sample:', jsonData.slice(0, 2));
        
        // Try to find headers in the data
        const firstRow = jsonData[0];
        if (firstRow) {
          const headerKeys = Object.keys(firstRow);
          const headers = headerKeys.map(key => firstRow[key]).filter(h => h && h.toString().trim());
          
          exercises = jsonData.slice(1)
            .filter(row => Object.values(row).some(val => val && val.toString().trim()))
            .map((row, index) => {
              const exercise = { id: index + 1 };
              headers.forEach((header, i) => {
                if (header) {
                  exercise[header] = row[Object.keys(row)[i]] || '';
                }
              });
              return exercise;
            });
          
          console.log(`Loaded ${exercises.length} exercises using Method 3`);
        }
      } catch (error) {
        console.error('Method 3 failed:', error);
      }
    }
    
    if (exercises.length === 0) {
      console.error('Failed to load exercises from Excel file. Please check the file format.');
      console.log('Available data in worksheet:', XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(0, 5));
    }
    
  } catch (error) {
    console.error('Error loading exercises:', error);
    console.error('Error details:', error.message);
  }
}

// Helper function to validate YouTube URL
function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

// API Routes

// Upload Excel file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  loadExercises();
  res.json({ message: 'File uploaded and processed successfully', count: exercises.length });
});

// Get all exercises with filtering and pagination
app.get('/api/exercises', (req, res) => {
  try {
    let filteredExercises = [...exercises];
    
    // Apply filters
    const { difficulty, muscle, equipment, search, page = 1, limit = 20 } = req.query;
    
    if (difficulty) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Difficulty Level'] && ex['Difficulty Level'].toLowerCase().includes(difficulty.toLowerCase())
      );
    }
    
    if (muscle) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Target Muscle Group'] && ex['Target Muscle Group'].toLowerCase().includes(muscle.toLowerCase())
      );
    }
    
    if (equipment) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Primary Equipment'] && ex['Primary Equipment'].toLowerCase().includes(equipment.toLowerCase())
      );
    }
    
    if (search) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Exercise'] && ex['Exercise'].toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Validate YouTube URLs
    filteredExercises = filteredExercises.map(ex => ({
      ...ex,
      'Short YouTube Demonstration': isValidYouTubeUrl(ex['Short YouTube Demonstration']) 
        ? ex['Short YouTube Demonstration'] : '',
      'In-Depth YouTube Explanation': isValidYouTubeUrl(ex['In-Depth YouTube Explanation']) 
        ? ex['In-Depth YouTube Explanation'] : ''
    }));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedExercises = filteredExercises.slice(startIndex, endIndex);
    
    res.json({
      exercises: paginatedExercises,
      total: filteredExercises.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredExercises.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unique filter values
app.get('/api/filters', (req, res) => {
  try {
    const difficulties = [...new Set(exercises.map(ex => ex['Difficulty Level']).filter(Boolean))];
    const muscles = [...new Set(exercises.map(ex => ex['Target Muscle Group']).filter(Boolean))];
    const equipment = [...new Set(exercises.map(ex => ex['Primary Equipment']).filter(Boolean))];
    
    res.json({
      difficulties,
      muscles,
      equipment
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug endpoint to check Excel parsing
app.get('/api/debug/excel', (req, res) => {
  try {
    const workbook = XLSX.readFile('./uploads/exercise-database.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    res.json({
      sheets: workbook.SheetNames,
      currentSheet: sheetName,
      totalRows: rawData.length,
      firstFewRows: rawData.slice(0, 5),
      exercisesLoaded: exercises.length,
      sampleExercise: exercises[0] || null
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error reading Excel file', 
      details: error.message 
    });
  }
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 