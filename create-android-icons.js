#!/usr/bin/env node

/**
 * Script to create Android app icons from logo.jpeg
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// First, try to require sharp, if not available, provide instructions
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('ERROR: sharp module not found');
  console.error('Please install it with: npm install sharp');
  console.error('Or run from the rispo-app directory: npm install sharp');
  process.exit(1);
}

const logoPath = path.join(__dirname, 'logo.jpeg');
const androidResPath = path.join(__dirname, 'rispo-app', 'android', 'app', 'src', 'main', 'res');

// Icon sizes for different DPI buckets
const iconSizes = {
  'mdpi': 48,      // baseline (160 dpi)
  'hdpi': 72,      // 1.5x (240 dpi)
  'xhdpi': 96,     // 2x (320 dpi)
  'xxhdpi': 144,   // 3x (480 dpi)
  'xxxhdpi': 192   // 4x (640 dpi)
};

// Foreground and round icon sizes (for adaptive icons)
const foregroundSizes = {
  'mdpi': 81,
  'hdpi': 121,
  'xhdpi': 162,
  'xxhdpi': 243,
  'xxxhdpi': 324
};

async function createAndroidIcons() {
  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error(`ERROR: Logo file not found at ${logoPath}`);
      process.exit(1);
    }

    console.log('Starting Android icon generation...');
    console.log(`Logo path: ${logoPath}`);

    // Process each icon size
    for (const [dpi, size] of Object.entries(iconSizes)) {
      const iconDir = path.join(androidResPath, `mipmap-${dpi}`);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
        console.log(`Created directory: ${iconDir}`);
      }

      // Create ic_launcher.png
      const launcherPath = path.join(iconDir, 'ic_launcher.png');
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(launcherPath);
      console.log(`✓ Created ${launcherPath} (${size}x${size})`);

      // Create ic_launcher_round.png
      const launcherRoundPath = path.join(iconDir, 'ic_launcher_round.png');
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(launcherRoundPath);
      console.log(`✓ Created ${launcherRoundPath} (${size}x${size})`);

      // Create ic_launcher_foreground.png (for adaptive icons)
      const foregroundSize = foregroundSizes[dpi];
      const foregroundPath = path.join(iconDir, 'ic_launcher_foreground.png');
      await sharp(logoPath)
        .resize(foregroundSize, foregroundSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(foregroundPath);
      console.log(`✓ Created ${foregroundPath} (${foregroundSize}x${foregroundSize})`);
    }

    // Also create icons for anydpi-v26 (adaptive icon background)
    const anyDpiDir = path.join(androidResPath, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anyDpiDir)) {
      fs.mkdirSync(anyDpiDir, { recursive: true });
    }

    // Create ic_launcher.xml (adaptive icon definition)
    const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), launcherXml);
    console.log(`✓ Created adaptive icon definition`);

    // Create ic_launcher_round.xml
    const launcherRoundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), launcherRoundXml);
    console.log(`✓ Created adaptive round icon definition`);

    console.log('\n✅ Android icons created successfully!');
    console.log('All app icons have been generated in the mipmap directories.');
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

createAndroidIcons();
