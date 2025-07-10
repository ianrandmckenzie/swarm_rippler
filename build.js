#!/usr/bin/env node

// Build script for Click Rippler - copies web assets to dist folder
const fs = require('fs');
const path = require('path');

console.log('Building Click Rippler...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Function to copy file
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

try {
  // Copy HTML files
  copyFile(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
  copyFile(path.join(__dirname, 'new_word.html'), path.join(distDir, 'new_word.html'));
  console.log('✅ Copied HTML files');

  // Copy directories
  copyDir(path.join(__dirname, 'css'), path.join(distDir, 'css'));
  console.log('✅ Copied CSS directory');

  copyDir(path.join(__dirname, 'js'), path.join(distDir, 'js'));
  console.log('✅ Copied JS directory');

  copyDir(path.join(__dirname, 'audio'), path.join(distDir, 'audio'));
  console.log('✅ Copied audio directory');

  // Copy other important files if they exist
  const otherFiles = ['CNAME', 'LICENSE.txt', 'favicon.ico'];
  otherFiles.forEach(file => {
    const srcPath = path.join(__dirname, file);
    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, path.join(distDir, file));
      console.log(`✅ Copied ${file}`);
    }
  });

  console.log('✅ Build completed successfully! Web assets are ready in dist/ folder.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
