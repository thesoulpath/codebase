const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next' && file !== 'build' && !file.startsWith('.')) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      // Only include text-based files
      const ext = path.extname(file).toLowerCase();
      const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.css', '.html', '.xml', '.yml', '.yaml'];
      
      if (textExtensions.includes(ext) || !ext) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to read file content
function readFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    return `[Error reading file: ${error.message}]`;
  }
}

// Main function to export codebase
function exportCodebase() {
  const projectRoot = process.cwd();
  const outputFile = 'codebase_export.txt';
  
  console.log('Starting codebase export...');
  console.log(`Project root: ${projectRoot}`);
  
  // Get all files
  const allFiles = getAllFiles(projectRoot);
  console.log(`Found ${allFiles.length} files to export`);
  
  let output = '';
  output += '='.repeat(80) + '\n';
  output += 'CODEBASE EXPORT\n';
  output += '='.repeat(80) + '\n';
  output += `Generated on: ${new Date().toISOString()}\n`;
  output += `Project root: ${projectRoot}\n`;
  output += `Total files: ${allFiles.length}\n\n`;
  
  // Sort files for consistent output
  allFiles.sort();
  
  // Process each file
  allFiles.forEach((filePath, index) => {
    const relativePath = path.relative(projectRoot, filePath);
    const content = readFileContent(filePath);
    
    output += '-'.repeat(80) + '\n';
    output += `FILE ${index + 1}: ${relativePath}\n`;
    output += '-'.repeat(80) + '\n';
    output += `Path: ${filePath}\n`;
    output += `Size: ${content.length} characters\n`;
    output += `Lines: ${content.split('\n').length}\n\n`;
    output += content;
    output += '\n\n';
    
    console.log(`Processed: ${relativePath}`);
  });
  
  // Write to file
  try {
    fs.writeFileSync(outputFile, output, 'utf8');
    console.log(`\n✅ Codebase exported successfully to: ${outputFile}`);
    console.log(`📊 Total output size: ${(output.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Also create a summary file
    const summary = {
      timestamp: new Date().toISOString(),
      projectRoot: projectRoot,
      totalFiles: allFiles.length,
      fileTypes: {},
      totalSize: 0
    };
    
    allFiles.forEach(filePath => {
      const ext = path.extname(filePath).toLowerCase() || 'no-extension';
      summary.fileTypes[ext] = (summary.fileTypes[ext] || 0) + 1;
      
      try {
        const stats = fs.statSync(filePath);
        summary.totalSize += stats.size;
      } catch (error) {
        // Ignore errors
      }
    });
    
    summary.totalSizeMB = (summary.totalSize / 1024 / 1024).toFixed(2);
    
    fs.writeFileSync('codebase_summary.json', JSON.stringify(summary, null, 2));
    console.log(`📋 Summary saved to: codebase_summary.json`);
    
  } catch (error) {
    console.error(`❌ Error writing output file: ${error.message}`);
  }
}

// Run the export
if (require.main === module) {
  exportCodebase();
}

module.exports = { exportCodebase, getAllFiles };
