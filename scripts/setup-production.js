#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Production setup script
 * Sets up the dist folder with production dependencies
 */

const log = (message) => {
  console.log(`🚀 [Production Setup] ${message}`);
};

const error = (message) => {
  console.error(`❌ [Production Setup] ${message}`);
};

const success = (message) => {
  console.log(`✅ [Production Setup] ${message}`);
};

const setupProduction = () => {
  try {
    log('Setting up production environment...');
    
    const rootDir = path.resolve(__dirname, '..');
    const distDir = path.join(rootDir, 'dist');
    
    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
      error('Dist directory not found. Please run "yarn build" first.');
      process.exit(1);
    }
    
    // Read the main package.json
    const mainPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    
    // Create a production package.json with only production dependencies
    const productionPackageJson = {
      name: mainPackageJson.name,
      version: mainPackageJson.version,
      description: mainPackageJson.description,
      main: 'index.js',
      engines: mainPackageJson.engines,
      dependencies: mainPackageJson.dependencies,
      scripts: {
        start: 'node index.js'
      },
      author: mainPackageJson.author,
      license: mainPackageJson.license
    };
    
    // Write production package.json to dist
    fs.writeFileSync(
      path.join(distDir, 'package.json'), 
      JSON.stringify(productionPackageJson, null, 2)
    );
    log('Created production package.json');
    
    // Copy yarn.lock if it exists
    const yarnLockPath = path.join(rootDir, 'yarn.lock');
    if (fs.existsSync(yarnLockPath)) {
      fs.copyFileSync(yarnLockPath, path.join(distDir, 'yarn.lock'));
      log('Copied yarn.lock');
    }
    
    // Install production dependencies
    log('Installing production dependencies...');
    process.chdir(distDir);
    
    try {
      execSync('yarn install --immutable', { stdio: 'inherit' });
      success('Production dependencies installed successfully');
    } catch (err) {
      // Fallback to npm if yarn fails
      log('Yarn failed, trying npm...');
      execSync('npm install --only=production', { stdio: 'inherit' });
      success('Production dependencies installed with npm');
    }
    
    success('Production setup completed successfully!');
    
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  setupProduction();
}

module.exports = { setupProduction };
