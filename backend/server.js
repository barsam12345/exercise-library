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
    // Try to find the Excel file with different possible names
    const fs = require('fs');
    const uploadsDir = './uploads/';
    let excelFile = null;
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const excelFiles = files.filter(f => f.toLowerCase().includes('exercise') && f.toLowerCase().endsWith('.xlsx'));
      
      if (excelFiles.length > 0) {
        excelFile = uploadsDir + excelFiles[0];
        console.log('Found Excel file:', excelFile);
      }
    }
    
    if (!excelFile) {
      console.error('No Excel file found in uploads directory');
      return;
    }
    
    const workbook = XLSX.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('Available sheets:', workbook.SheetNames);
    console.log('Using sheet:', sheetName);
    
    // Get raw data to find the correct header row
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Total rows in sheet:', rawData.length);
    
    // Look for headers in first 20 rows (skip instructions/cover page)
    let headerRowIndex = -1;
    for (let rowIndex = 0; rowIndex < Math.min(20, rawData.length); rowIndex++) {
      const row = rawData[rowIndex];
      if (row && row.length > 0) {
        // Check if this row contains exercise headers
        const exerciseKeywords = ['Exercise', 'exercise', 'Name', 'Difficulty', 'Muscle', 'Equipment', 'Video'];
        const hasExerciseHeaders = row.some(cell => 
          cell && exerciseKeywords.some(keyword => 
            cell.toString().toLowerCase().includes(keyword.toLowerCase())
          )
        );
        
        if (hasExerciseHeaders) {
          headerRowIndex = rowIndex;
          console.log(`Found headers in row ${rowIndex + 1}:`, row);
          break;
        }
      }
    }
    
    if (headerRowIndex === -1) {
      console.error('Could not find exercise headers in first 20 rows');
      return;
    }
    
    const headers = rawData[headerRowIndex];
    const dataRows = rawData.slice(headerRowIndex + 1);
    
    console.log('Headers found:', headers);
    console.log('Data rows to process:', dataRows.length);
    
    // Convert to objects with ALL columns
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
    
    console.log(`Loaded ${exercises.length} exercises with ${headers.length} columns`);
    
    // Log sample exercise for debugging
    if (exercises.length > 0) {
      console.log('Sample exercise keys:', Object.keys(exercises[0]));
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
  
  console.log('File uploaded:', req.file.originalname);
  console.log('File saved as:', req.file.filename);
  
  loadExercises();
  res.json({ 
    message: 'File uploaded and processed successfully', 
    count: exercises.length,
    fileName: req.file.originalname,
    savedAs: req.file.filename
  });
});

// Simple file upload for testing (accepts any Excel file)
app.post('/api/upload-test', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('Test upload - File:', req.file.originalname);
  
  // Try to load exercises immediately
  loadExercises();
  
  res.json({
    success: true,
    message: 'File uploaded for testing',
    fileName: req.file.originalname,
    exercisesLoaded: exercises.length,
    sampleExercise: exercises[0] || null
  });
});

// Get all exercises with filtering and pagination
app.get('/api/exercises', (req, res) => {
  try {
    let filteredExercises = [...exercises];
    
    // Apply filters
    const { 
      difficulty, muscle, equipment, search, 
      posture, bodyRegion, mechanics, forceType, 
      laterality, classification, movementPattern, 
      planeOfMotion, page = 1, limit = 20 
    } = req.query;
    
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
    
    if (posture) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Posture'] && ex['Posture'].toLowerCase().includes(posture.toLowerCase())
      );
    }
    
    if (bodyRegion) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Body Region'] && ex['Body Region'].toLowerCase().includes(bodyRegion.toLowerCase())
      );
    }
    
    if (mechanics) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Mechanics'] && ex['Mechanics'].toLowerCase().includes(mechanics.toLowerCase())
      );
    }
    
    if (forceType) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Force Type'] && ex['Force Type'].toLowerCase().includes(forceType.toLowerCase())
      );
    }
    
    if (laterality) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Laterality'] && ex['Laterality'].toLowerCase().includes(laterality.toLowerCase())
      );
    }
    
    if (classification) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Primary Exercise Classification'] && ex['Primary Exercise Classification'].toLowerCase().includes(classification.toLowerCase())
      );
    }
    
    if (movementPattern) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Movement Pattern #1'] && ex['Movement Pattern #1'].toLowerCase().includes(movementPattern.toLowerCase())
      );
    }
    
    if (planeOfMotion) {
      filteredExercises = filteredExercises.filter(ex => 
        ex['Plane Of Motion #1'] && ex['Plane Of Motion #1'].toLowerCase().includes(planeOfMotion.toLowerCase())
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
    const postures = [...new Set(exercises.map(ex => ex['Posture']).filter(Boolean))];
    const bodyRegions = [...new Set(exercises.map(ex => ex['Body Region']).filter(Boolean))];
    const mechanics = [...new Set(exercises.map(ex => ex['Mechanics']).filter(Boolean))];
    const forceTypes = [...new Set(exercises.map(ex => ex['Force Type']).filter(Boolean))];
    const laterality = [...new Set(exercises.map(ex => ex['Laterality']).filter(Boolean))];
    const classifications = [...new Set(exercises.map(ex => ex['Primary Exercise Classification']).filter(Boolean))];
    const movementPatterns = [...new Set(exercises.map(ex => ex['Movement Pattern #1']).filter(Boolean))];
    const planesOfMotion = [...new Set(exercises.map(ex => ex['Plane Of Motion #1']).filter(Boolean))];
    
    res.json({
      difficulties,
      muscles,
      equipment,
      postures,
      bodyRegions,
      mechanics,
      forceTypes,
      laterality,
      classifications,
      movementPatterns,
      planesOfMotion
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug endpoint to check Excel parsing
app.get('/api/debug/excel', (req, res) => {
  try {
    // Check if file exists
    const fs = require('fs');
    const filePath = './uploads/exercise-database.xlsx';
    
    if (!fs.existsSync(filePath)) {
      return res.json({
        error: 'Excel file not found',
        message: 'Please upload an Excel file named "exercise-database.xlsx" to the uploads folder',
        availableFiles: fs.readdirSync('./uploads/').filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'))
      });
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Try multiple parsing methods
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    res.json({
      fileExists: true,
      sheets: workbook.SheetNames,
      currentSheet: sheetName,
      totalRows: rawData.length,
      firstFewRows: rawData.slice(0, 5),
      jsonDataSample: jsonData.slice(0, 3),
      exercisesLoaded: exercises.length,
      sampleExercise: exercises[0] || null,
      allExercises: exercises.slice(0, 5),
      parsingMethods: {
        rawDataLength: rawData.length,
        jsonDataLength: jsonData.length,
        hasHeaders: rawData.length > 0 && rawData[0].length > 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error reading Excel file', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Test endpoint to manually trigger exercise loading
app.post('/api/debug/load-exercises', (req, res) => {
  try {
    loadExercises();
    res.json({
      success: true,
      exercisesLoaded: exercises.length,
      sampleExercises: exercises.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error loading exercises',
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
  
  // Try to load exercises on startup
  console.log('Attempting to load exercises from Excel file...');
  loadExercises();
}); 