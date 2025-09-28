// Simple script to help convert your logo to base64
// Run this with: node convert-logo.js

const fs = require('fs');
const path = require('path');

// Path to your logo file
const logoPath = path.join(__dirname, 'assets', 'Logo_with_Color.png');

try {
  // Read the logo file
  const logoBuffer = fs.readFileSync(logoPath);
  
  // Convert to base64
  const logoBase64 = logoBuffer.toString('base64');
  
  console.log('Your logo base64 string:');
  console.log(logoBase64);
  console.log('\nCopy this string and replace the placeholder in your code!');
  
} catch (error) {
  console.error('Error reading logo file:', error.message);
  console.log('Make sure the file exists at:', logoPath);
}
