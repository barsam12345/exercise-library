const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🔧 Excel File Parser Test');
console.log('========================\n');

// Check for Excel files in uploads directory
const uploadsDir = './uploads';
const files = fs.readdirSync(uploadsDir).filter(file => 
  file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')
);

if (files.length === 0) {
  console.log('❌ No Excel files found in uploads directory');
  console.log('📁 Please place your Excel file in the backend/uploads/ directory');
  console.log('📋 Expected file name: exercise-database.xlsx');
  console.log('\n📂 Current files in uploads directory:');
  fs.readdirSync(uploadsDir).forEach(file => {
    console.log(`   - ${file}`);
  });
  process.exit(1);
}

console.log('📁 Found Excel files:');
files.forEach(file => console.log(`   - ${file}`));

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
      
      // Method 1: Direct JSON conversion
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log(`📈 JSON conversion: ${jsonData.length} rows`);
      
      if (jsonData.length > 0) {
        console.log('📝 Column headers:', Object.keys(jsonData[0]));
        console.log('📝 Sample row:', jsonData[0]);
        
        // Check for expected columns
        const expectedColumns = ['Exercise', 'Difficulty Level', 'Target Muscle Group', 'Primary Equipment', 'Video Link'];
        const foundColumns = Object.keys(jsonData[0]);
        
        console.log('\n✅ Found columns:');
        expectedColumns.forEach(col => {
          const found = foundColumns.includes(col);
          console.log(`   ${found ? '✅' : '❌'} ${col}`);
        });
        
        // Count exercises with video links
        const exercisesWithVideos = jsonData.filter(row => 
          row['Video Link'] || row['Video'] || row['VideoLink']
        );
        console.log(`\n🔗 Exercises with video links: ${exercisesWithVideos.length}/${jsonData.length}`);
        
        // Show sample exercises
        console.log('\n📋 Sample exercises:');
        jsonData.slice(0, 3).forEach((row, i) => {
          console.log(`\n${i + 1}. ${row['Exercise'] || row['exercise'] || 'No name'}`);
          console.log(`   Difficulty: ${row['Difficulty Level'] || 'N/A'}`);
          console.log(`   Muscle: ${row['Target Muscle Group'] || 'N/A'}`);
          console.log(`   Equipment: ${row['Primary Equipment'] || 'N/A'}`);
          console.log(`   Video: ${row['Video Link'] || row['Video'] || 'No video'}`);
        });
      }
      
      // Method 2: Raw data
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`📈 Raw data: ${rawData.length} rows`);
      
      if (rawData.length > 0) {
        console.log('📝 First row (headers):', rawData[0]);
        console.log('📝 Second row (sample):', rawData[1]);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error reading ${file}:`, error.message);
  }
});

console.log('\n🎉 Excel parsing test complete!');
console.log('\n📋 Next steps:');
console.log('1. If parsing looks good, update the server.js file');
console.log('2. Restart the server');
console.log('3. Test the API endpoints'); 