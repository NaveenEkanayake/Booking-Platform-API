const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Try to load JWT_SECRET from .env
let jwtSecret = 'fallback-secret-key-12345';
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path.resolve(__dirname, '../../.env'));
    if (process.env.JWT_SECRET) {
      jwtSecret = process.env.JWT_SECRET;
    }
  }
} catch (err) {
  try {
    const envContent = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');
    const match = envContent.match(/^JWT_SECRET=(.*)$/m);
    if (match && match[1]) {
      jwtSecret = match[1].trim();
    }
  } catch (e) {
    // Ignored
  }
}

// 2. Helper functions for base64url encoding
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(header, payload, secret) {
  const data = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return data + '.' + signature;
}

// 3. Parse arguments
const args = process.argv.slice(2);
let role = 'ADMIN';
let email = 'admin@entwoh.com';
let name = 'Platform Administrator';
let userId = '00000000-0000-0000-0000-000000000000';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--role' && args[i + 1]) {
    role = args[i + 1].toUpperCase();
    i++;
  } else if (args[i] === '--email' && args[i + 1]) {
    email = args[i + 1];
    i++;
  } else if (args[i] === '--name' && args[i + 1]) {
    name = args[i + 1];
    i++;
  } else if (args[i] === '--id' && args[i + 1]) {
    userId = args[i + 1];
    i++;
  }
}

// 4. Create payload
const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
  sub: userId,
  email: email,
  role: role,
  name: name,
  iat: now,
  exp: now + 24 * 60 * 60,
};

// 5. Generate token
const token = sign(header, payload, jwtSecret);

console.log('--------------------------------------------------');
console.log('🔑 JWT Generator Tool');
console.log('--------------------------------------------------');
console.log(`Email:   ${email}`);
console.log(`Role:    ${role}`);
console.log(`Name:    ${name}`);
console.log(`Secret:  ${jwtSecret}`);
console.log(`Expires: 24 hours from now`);
console.log('--------------------------------------------------');
console.log('Generated JWT Token (Bearer token):');
console.log(token);
console.log('--------------------------------------------------');
console.log('\nUsage Examples:');
console.log('  node backend/scripts/generate-jwt.js --role ADMIN --email admin@entwoh.com');
console.log('  node backend/scripts/generate-jwt.js --role CUSTOMER --email customer@example.com --name "John Doe"');
