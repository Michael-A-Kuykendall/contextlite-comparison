import fetch from 'node-fetch';

async function testPinecone() {
  console.log('Testing Pinecone API integration...');
  
  const API_KEY = 'pcsk_6emnSp_Cj8GXBMBXTbM3qudCLezVrWPmqWjb2Agd79FAgWocGZsq63vPvMXYomfr3tDEf5';
  
  try {
    console.log('Step 1: Testing embedding endpoint...');
    const embedResponse = await fetch('https://api.pinecone.io/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY
      },
      body: JSON.stringify({
        model: 'multilingual-e5-large',
        inputs: ['test query'],
        parameters: { input_type: 'query' }
      })
    });
    
    console.log('Embed response status:', embedResponse.status);
    if (!embedResponse.ok) {
      const errorText = await embedResponse.text();
      console.log('Embed error:', errorText);
      return;
    }
    
    const embedData = await embedResponse.json();
    console.log('✅ Embedding success, vector length:', embedData.data[0].values.length);
    
    console.log('Step 2: Testing index query...');
    const queryResponse = await fetch('https://contextlite-demo-ex6pti6.svc.aped-4627-b74a.pinecone.io/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY
      },
      body: JSON.stringify({
        vector: embedData.data[0].values,
        topK: 3,
        includeMetadata: true,
        namespace: 'default'
      })
    });
    
    console.log('Query response status:', queryResponse.status);
    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.log('Query error:', errorText);
      return;
    }
    
    const queryData = await queryResponse.json();
    console.log('✅ Query success, matches:', queryData.matches?.length || 0);
    if (queryData.matches?.length > 0) {
      console.log('Sample match:', queryData.matches[0].metadata?.content?.substring(0, 100));
    }
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
  }
}

testPinecone();