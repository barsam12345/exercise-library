const XLSX = require('xlsx');
const fs = require('fs');

function parseExcelFile(filePath) {
  try {
    console.log('🔍 Reading Excel file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      return null;
    }
    
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    console.log('📊 Available sheets:', workbook.SheetNames);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log('📋 Using sheet:', sheetName);
    
    // Method 1: Direct JSON conversion (most reliable)
    console.log('\n🔄 Method 1: Direct JSON conversion');
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('📈 Found', jsonData.length, 'rows');
    
    if (jsonData.length > 0) {
      console.log('📝 First row keys:', Object.keys(jsonData[0]));
      console.log('📝 Sample data:', jsonData[0]);
      
      // Process the data
      const exercises = jsonData.map((row, index) => {
        const exercise = {
          id: index + 1,
          Exercise: row['Exercise'] || row['exercise'] || '',
          'Difficulty Level': row['Difficulty Level'] || row['DifficultyLevel'] || '',
          'Target Muscle Group': row['Target Muscle Group'] || row['TargetMuscleGroup'] || '',
          'Primary Equipment': row['Primary Equipment'] || row['PrimaryEquipment'] || '',
          'Video Link': row['Video Link'] || row['VideoLink'] || row['Video'] || '',
          // Add any other columns you have
          ...row
        };
        return exercise;
      });
      
      console.log('\n✅ Successfully parsed', exercises.length, 'exercises');
      console.log('📊 Sample exercise:', exercises[0]);
      
      return exercises;
    }
    
    // Method 2: Raw data parsing (fallback)
    console.log('\n🔄 Method 2: Raw data parsing');
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('📈 Raw data rows:', rawData.length);
    
    if (rawData.length > 0) {
      console.log('📝 First few rows:');
      rawData.slice(0, 3).forEach((row, i) => {
        console.log(`Row ${i}:`, row);
      });
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error parsing Excel file:', error.message);
    return null;
  }
}

// Test the parser
if (require.main === module) {
  const filePath = './uploads/exercise-database.xlsx';
  const exercises = parseExcelFile(filePath);
  
  if (exercises) {
    console.log('\n🎉 Parsing successful!');
    console.log('📊 Total exercises:', exercises.length);
    console.log('🔗 Exercises with video links:', exercises.filter(ex => ex['Video Link']).length);
    
    // Show first few exercises
    console.log('\n📋 First 3 exercises:');
    exercises.slice(0, 3).forEach((ex, i) => {
      console.log(`\n${i + 1}. ${ex.Exercise}`);
      console.log(`   Difficulty: ${ex['Difficulty Level']}`);
      console.log(`   Muscle: ${ex['Target Muscle Group']}`);
      console.log(`   Equipment: ${ex['Primary Equipment']}`);
      console.log(`   Video: ${ex['Video Link']}`);
    });
  } else {
    console.log('❌ Failed to parse Excel file');
  }
}

module.exports = { parseExcelFile }; 