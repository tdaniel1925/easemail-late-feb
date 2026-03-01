#!/usr/bin/env node

/**
 * Push environment variables from .env.local to Vercel
 * Usage: node scripts/push-env-to-vercel.js [production|preview|development]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get environment type from command line argument (default: production)
const envType = process.argv[2] || 'production';

console.log(`🚀 Pushing environment variables to Vercel (${envType})...\n`);

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local not found');
  console.error('Please create .env.local with your environment variables first');
  process.exit(1);
}

// Check if vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: Vercel CLI not found');
  console.error('Install with: npm i -g vercel');
  process.exit(1);
}

console.log('📋 Reading variables from .env.local...\n');

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let count = 0;
const failed = [];

for (const line of lines) {
  // Skip empty lines and comments
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    continue;
  }

  // Parse key=value
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (!match) {
    continue;
  }

  const [, key, value] = match;
  const cleanKey = key.trim();
  const cleanValue = value.trim();

  // Skip if key or value is empty
  if (!cleanKey || !cleanValue) {
    continue;
  }

  // Skip placeholder values
  const placeholders = [
    'your_',
    'https://YOUR_PROJECT',
    'sk-ant-your_key',
    'YOUR_PROJECT',
    'your-',
  ];

  if (placeholders.some(placeholder => cleanValue.includes(placeholder))) {
    console.log(`⏭️  Skipping ${cleanKey} (placeholder value)`);
    continue;
  }

  try {
    console.log(`✅ Setting ${cleanKey}`);

    // Use echo to pipe the value to vercel env add
    const command = process.platform === 'win32'
      ? `echo ${cleanValue} | vercel env add ${cleanKey} ${envType} --force`
      : `echo "${cleanValue}" | vercel env add "${cleanKey}" ${envType} --force`;

    execSync(command, {
      stdio: 'ignore',
      shell: true,
    });

    count++;
  } catch (error) {
    console.log(`⚠️  Warning: Failed to set ${cleanKey}`);
    failed.push(cleanKey);
  }
}

console.log(`\n✨ Done! Pushed ${count} environment variables to Vercel (${envType})`);

if (failed.length > 0) {
  console.log(`\n⚠️  Failed to set ${failed.length} variables:`);
  failed.forEach(key => console.log(`   - ${key}`));
}

console.log('\nNext steps:');
console.log('1. Verify variables: vercel env ls');
console.log('2. Trigger a new deployment: vercel --prod');
