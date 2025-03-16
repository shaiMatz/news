const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

// Copy files
async function copyFile(src, dest) {
  try {
    await fs.copyFile(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error);
  }
}

// Build the web application
async function buildWebApp() {
  console.log('Building web application...');
  
  // Ensure build directories exist
  await ensureDir(path.join(__dirname, 'public', 'assets'));
  await ensureDir(path.join(__dirname, 'public', 'src'));
  
  // Copy localization files to make them accessible
  const localesDir = path.join(__dirname, 'src', 'localization', 'locales');
  const destLocalesDir = path.join(__dirname, 'public', 'locales');
  
  await ensureDir(destLocalesDir);
  
  // Copy all locale files
  try {
    const localeFiles = await fs.readdir(localesDir);
    for (const file of localeFiles) {
      await copyFile(
        path.join(localesDir, file),
        path.join(destLocalesDir, file)
      );
    }
    console.log('Copied localization files');
  } catch (error) {
    console.error('Error copying localization files:', error);
  }
  
  // Copy the entry point
  await copyFile(
    path.join(__dirname, 'src', 'auth-app.js'),
    path.join(__dirname, 'public', 'src', 'auth-app.js')
  );
  
  console.log('Web application build complete');
}

// Run the build
buildWebApp().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});