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
    
    // Convert to JSON, skip first few rows to find headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find header row (look for row with "Exercise" in first column)
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i][0] === 'Exercise') {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.error('Could not find header row');
      return;
    }
    
    const headers = rawData[headerRowIndex];
    const dataRows = rawData.slice(headerRowIndex + 1);
    
    // Convert to objects
    exercises = dataRows
      .filter(row => row[0] && row[0].trim()) // Filter out empty rows
      .map((row, index) => {
        const exercise = { id: index + 1 };
        headers.forEach((header, i) => {
          if (header) {
            exercise[header] = row[i] || '';
          }
        });
        return exercise;
      });
    
    console.log(`Loaded ${exercises.length} exercises`);
  } catch (error) {
    console.error('Error loading exercises:', error);
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