#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Cross-platform asset copying script for build process
 * Copies necessary assets to the dist folder for production deployment
 */

const log = (message) => {
  console.log(`📦 [Copy Assets] ${message}`);
};

const error = (message) => {
  console.error(`❌ [Copy Assets] ${message}`);
};

const success = (message) => {
  console.log(`✅ [Copy Assets] ${message}`);
};

/**
 * Recursively create directory if it doesn't exist
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
};

/**
 * Copy file from source to destination
 */
const copyFile = (src, dest) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    
    // Copy file
    fs.copyFileSync(src, dest);
    log(`Copied: ${src} → ${dest}`);
    return true;
  } catch (err) {
    error(`Failed to copy ${src} to ${dest}: ${err.message}`);
    return false;
  }
};

/**
 * Copy directory recursively
 */
const copyDir = (src, dest) => {
  try {
    if (!fs.existsSync(src)) {
      log(`Source directory does not exist: ${src}`);
      return false;
    }

    ensureDir(dest);
    
    const items = fs.readdirSync(src);
    let success = true;
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        if (!copyDir(srcPath, destPath)) {
          success = false;
        }
      } else {
        if (!copyFile(srcPath, destPath)) {
          success = false;
        }
      }
    }
    
    return success;
  } catch (err) {
    error(`Failed to copy directory ${src} to ${dest}: ${err.message}`);
    return false;
  }
};

/**
 * Main function to copy all necessary assets
 */
const copyAssets = () => {
  log('Starting asset copying process...');
  
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  
  // Ensure dist directory exists
  ensureDir(distDir);
  
  let allSuccess = true;
  
  // Assets to copy
  const assets = [
    {
      type: 'file',
      src: path.join(rootDir, 'openapi.yaml'),
      dest: path.join(distDir, 'openapi.yaml'),
      required: true
    },
    {
      type: 'file',
      src: path.join(rootDir, 'package.json'),
      dest: path.join(distDir, 'package.json'),
      required: false
    },
    {
      type: 'file',
      src: path.join(rootDir, 'ecosystem.config.js'),
      dest: path.join(distDir, 'ecosystem.config.js'),
      required: false
    }
  ];
  
  // Copy each asset
  for (const asset of assets) {
    if (asset.type === 'file') {
      if (fs.existsSync(asset.src)) {
        if (!copyFile(asset.src, asset.dest)) {
          if (asset.required) {
            allSuccess = false;
          }
        }
      } else if (asset.required) {
        error(`Required file not found: ${asset.src}`);
        allSuccess = false;
      } else {
        log(`Optional file not found (skipping): ${asset.src}`);
      }
    } else if (asset.type === 'dir') {
      if (fs.existsSync(asset.src)) {
        if (!copyDir(asset.src, asset.dest)) {
          if (asset.required) {
            allSuccess = false;
          }
        }
      } else if (asset.required) {
        error(`Required directory not found: ${asset.src}`);
        allSuccess = false;
      } else {
        log(`Optional directory not found (skipping): ${asset.src}`);
      }
    }
  }
  
  if (allSuccess) {
    success('All assets copied successfully!');
    process.exit(0);
  } else {
    error('Some assets failed to copy. Check the logs above.');
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  copyAssets();
}

module.exports = { copyAssets, copyFile, copyDir, ensureDir };
