const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Simple Test - ContextLite Demo</h1><p>This confirms the server is working!</p>');
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Simple test server running on port ${PORT}`);
});