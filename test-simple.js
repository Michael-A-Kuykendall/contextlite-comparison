const express = require('express');
const app = express();

console.log('=== 🚀 Node.js starting at', new Date().toISOString(), '===');
console.log('PWD:', process.cwd());
console.log('PORT:', process.env.PORT || 'unset');
console.log('NODE_ENV:', process.env.NODE_ENV || 'unset');

app.get('/', (req, res) => {
    res.send('<h1>Simple Test - ContextLite Demo</h1><p>This confirms the server is working!</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, HOST, () => {
    console.log(`=== ✅ Simple test server running on ${HOST}:${PORT} ===`);
});