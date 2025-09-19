// Simple test using curl to isolate the issue
const { execSync } = require('child_process');

console.log('Testing Pinecone API with curl...');

const API_KEY = 'pcsk_6emnSp_Cj8GXBMBXTbM3qudCLezVrWPmqWjb2Agd79FAgWocGZsq63vPvMXYomfr3tDEf5';

try {
  console.log('Step 1: Testing embedding endpoint...');
  
  const embedCmd = `curl -s -w "HTTP_CODE:%{http_code}" -X POST "https://api.pinecone.io/embed" \\
    -H "Content-Type: application/json" \\
    -H "Api-Key: ${API_KEY}" \\
    -d '{"model": "multilingual-e5-large", "inputs": ["test query"], "parameters": {"input_type": "query"}}'`;
  
  const embedResult = execSync(embedCmd, { encoding: 'utf8' });
  console.log('Embed result:', embedResult.substring(0, 200) + '...');
  
} catch (error) {
  console.log('❌ Curl test failed:', error.message);
}