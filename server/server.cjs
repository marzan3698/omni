// CommonJS wrapper for cPanel Node.js launcher
// This file allows cPanel to require() the ES module

require('dotenv').config();

// Dynamically import the ES module
import('./dist/server.js')
  .then(() => {
    console.log('✅ ES Module loaded successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to load ES Module:', error);
    process.exit(1);
  });
