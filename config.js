// src/config.js
const crypto = require('crypto');
// Generate a random secret key
const generateRandomSecret = () => {
  console.log('random key generate');
  return crypto.randomBytes(32).toString('hex'); // Generate 32 bytes of random data and convert to hexadecimal
};

module.exports = {
    dbURI:  process.env.MONGO_URL,
    jwtSecret: generateRandomSecret()
  };
  