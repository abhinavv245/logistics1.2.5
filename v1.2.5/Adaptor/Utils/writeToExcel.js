const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Directory containing JSON payloads
const jsonDirectory = '/Users/abhinavgoel/Documents/ONDC/logistics1.2.5/v1.2.5/Adaptor/Examples'; // Change this to your directory path
const outputExcelFile = '../output.xlsx';

// Function to recursively extract all nested attributes, focusing only on the first object in arrays
function extractAttributes(obj, prefix = '', visited = new Set(), depth = 0, maxDepth = 10) {
  const attributes = [];

  // Stop recursion if depth exceeds maxDepth
  if (depth > maxDepth) {
    console.warn(`Max recursion depth reached at ${prefix}`);
    return attributes;
  }

  // Handle null or non-object values
  if (!obj || typeof obj !== 'object') return attributes;

  // Prevent circular references
  if (visited.has(obj)) {
    console.warn(`Circular reference detected at ${prefix}`);
    return attributes;
  }

  // Mark the object as visited
  visited.add(obj);

  for (const key in obj) {
    const value = obj[key];
    const currentKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        // Process only the first object in the array
        attributes.push(...extractAttributes(value[0], `${currentKey}`, visited, depth + 1, maxDepth));
      } else {
        // Treat array as a single attribute if it's not an array of objects
        attributes.push(currentKey);
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recurse for nested objects
      attributes.push(...extractAttributes(value, currentKey, visited, depth + 1, maxDepth));
    } else {
      // For primitives, add the key path
      attributes.push(currentKey);
    }
  }

  // Remove object from visited after processing
  visited.delete(obj);

  return attributes;
}

// Main function to process JSON files and create Excel
async function generateExcel() {
  console.log('Starting Excel generation...');
  const workbook = XLSX.utils.book_new();

  try {
    // Read all JSON files in the directory
    console.log(`Reading JSON files from directory: ${jsonDirectory}`);
    const files = fs.readdirSync(jsonDirectory).filter(file => file.endsWith('.json'));

    console.log(`Found ${files.length} JSON files:`, files);

    for (const file of files) {
      const filePath = path.join(jsonDirectory, file);
      console.log(`Processing file: ${filePath}`);

      // Read and parse the JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // Extract attributes from JSON
      const attributes = extractAttributes(jsonData);

      // Prepare data for Excel (add column header)
      const sheetData = [['Attribute (1.2.5)','Attribute (2.0)'], ...attributes.map(attr => [attr])];

      // Create worksheet and add to workbook
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      const sheetName = path.basename(file, '.json'); // Use filename (without extension) as sheet name
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Write the workbook to an Excel file
    console.log(`Writing data to Excel file: ${outputExcelFile}`);
    XLSX.writeFile(workbook, outputExcelFile);
    console.log(`Excel file generated successfully: ${outputExcelFile}`);
  } catch (err) {
    console.error('Error during Excel generation:', err);
  }
}

// Run the script
generateExcel().catch(err => console.error('Unhandled error:', err));