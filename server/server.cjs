// CommonJS wrapper for cPanel Node.js Passenger launcher
// This file imports the compiled ES module from dist/

import('./dist/server.js')
  .then(() => {
    console.log('✅ ES Module loaded successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to load ES Module:', error);
    process.exit(1);
  });
