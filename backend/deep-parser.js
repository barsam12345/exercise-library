const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🔍 Deep Excel Parser - Looking for Exercise Data');
console.log('================================================\n');

// Check for Excel files in uploads directory
const uploadsDir = './uploads';
const files = fs.readdirSync(uploadsDir).filter(file => 
  file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')
);

if (files.length === 0) {
  console.log('❌ No Excel files found in uploads directory');
  process.exit(1);
}

console.log('📁 Found Excel files:', files);

// Test each file
files.forEach(file => {
  console.log(`\n🔍 Testing file: ${file}`);
  console.log('=' .repeat(50));
  
  const filePath = path.join(uploadsDir, file);
  
  try {
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    console.log('📊 Sheets found:', workbook.SheetNames);
    
    // Test each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n📋 Testing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Get raw data to inspect all rows
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`📈 Total rows in sheet: ${rawData.length}`);
      
      // Look for exercise-related headers in first 20 rows
      console.log('\n🔍 Searching for exercise headers in first 20 rows...');
      
      for (let rowIndex = 0; rowIndex < Math.min(20, rawData.length); rowIndex++) {
        const row = rawData[rowIndex];
        if (row && row.length > 0) {
          console.log(`Row ${rowIndex + 1}:`, row.slice(0, 6)); // Show first 6 columns
          
          // Check if this row contains exercise headers
          const exerciseKeywords = ['Exercise', 'exercise', 'Name', 'Difficulty', 'Muscle', 'Equipment', 'Video'];
          const hasExerciseHeaders = row.some(cell => 
            cell && exerciseKeywords.some(keyword => 
              cell.toString().toLowerCase().includes(keyword.toLowerCase())
            )
          );
          
          if (hasExerciseHeaders) {
            console.log(`✅ Found potential headers in row ${rowIndex + 1}!`);
            console.log('Headers:', row);
            
            // Try to parse from this row onwards
            const headers = row;
            const dataRows = rawData.slice(rowIndex + 1);
            
            console.log(`📊 Found ${dataRows.length} data rows`);
            
            // Show first few data rows
            console.log('\n📋 Sample data rows:');
            dataRows.slice(0, 3).forEach((dataRow, i) => {
              console.log(`Data row ${i + 1}:`, dataRow.slice(0, 6));
            });
            
            // Try to parse exercises
            const exercises = dataRows
              .filter(row => row && row.length > 0 && row[0] && row[0].toString().trim())
              .map((row, index) => {
                const exercise = { id: index + 1 };
                headers.forEach((header, i) => {
                  if (header && header.toString().trim()) {
                    exercise[header.toString().trim()] = (row[i] || '').toString().trim();
                  }
                });
                return exercise;
              });
            
            console.log(`\n✅ Successfully parsed ${exercises.length} exercises!`);
            
            if (exercises.length > 0) {
              console.log('\n📋 Sample exercises:');
              exercises.slice(0, 3).forEach((ex, i) => {
                console.log(`\n${i + 1}. Exercise: ${ex['Exercise'] || ex['exercise'] || 'No name'}`);
                console.log(`   Difficulty: ${ex['Difficulty Level'] || ex['Difficulty'] || 'N/A'}`);
                console.log(`   Muscle: ${ex['Target Muscle Group'] || ex['Muscle'] || 'N/A'}`);
                console.log(`   Equipment: ${ex['Primary Equipment'] || ex['Equipment'] || 'N/A'}`);
                console.log(`   Video: ${ex['Video Link'] || ex['Video'] || 'No video'}`);
              });
            }
            
            return; // Found data, stop searching
          }
        }
      }
      
      console.log('\n❌ No exercise headers found in first 20 rows');
      console.log('💡 The data might be further down or in a different format');
      
    });
    
  } catch (error) {
    console.error(`❌ Error reading ${file}:`, error.message);
  }
});

console.log('\n🎉 Deep parsing complete!'); 