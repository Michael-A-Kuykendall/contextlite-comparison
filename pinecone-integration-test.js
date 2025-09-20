#!/usr/bin/env node

/**
 * COMPREHENSIVE PINECONE INTEGRATION TEST
 * Tests every component of the Pinecone pipeline to find what's broken
 */

const crypto = require('crypto');

// Copy the exact functions from the main demo
function createEmbedding(text, dimension = 1024) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const seed = parseInt(hash.substring(0, 8), 16);
    
    let rng = seed;
    function random() {
        rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
        return (rng / Math.pow(2, 32)) * 2 - 1;
    }
    
    const values = Array.from({length: dimension}, () => random());
    const norm = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? values.map(val => val / norm) : values;
}

function generateQueryVector(query) {
    return createEmbedding(query, 1024);
}

async function testPineconeIntegration() {
    console.log('🔍 COMPREHENSIVE PINECONE INTEGRATION TEST');
    console.log('=========================================\n');
    
    const testQueries = [
        'American',
        'technology', 
        'database',
        'artificial intelligence',
        'computer science',
        'machine learning',
        'vector search',
        'retrieval'
    ];
    
    let allPassed = true;
    
    // TEST 1: Vector Generation Uniqueness
    console.log('TEST 1: Vector Generation Uniqueness');
    console.log('-----------------------------------');
    
    const vectors = {};
    const vectorSets = {};
    
    for (const query of testQueries) {
        const vector = generateQueryVector(query);
        const vectorStr = JSON.stringify(vector.slice(0, 5)); // First 5 elements for comparison
        
        console.log(`Query: "${query}"`);
        console.log(`  Vector (first 5): [${vector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);
        console.log(`  Norm: ${Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)).toFixed(6)}`);
        
        if (vectors[query]) {
            console.log(`  ❌ DUPLICATE: Query "${query}" already tested`);
            allPassed = false;
        } else {
            vectors[query] = vector;
        }
        
        if (vectorSets[vectorStr]) {
            console.log(`  ❌ COLLISION: Vector matches query "${vectorSets[vectorStr]}"`);
            allPassed = false;
        } else {
            vectorSets[vectorStr] = query;
            console.log(`  ✅ UNIQUE: Vector is unique`);
        }
        console.log();
    }
    
    // TEST 2: Vector Consistency 
    console.log('TEST 2: Vector Consistency (Same Input = Same Output)');
    console.log('---------------------------------------------------');
    
    for (const query of ['American', 'technology']) {
        const vector1 = generateQueryVector(query);
        const vector2 = generateQueryVector(query);
        
        const identical = JSON.stringify(vector1) === JSON.stringify(vector2);
        console.log(`Query: "${query}"`);
        console.log(`  Consistent: ${identical ? '✅ YES' : '❌ NO'}`);
        if (!identical) allPassed = false;
    }
    console.log();
    
    // TEST 3: Pinecone API Integration
    console.log('TEST 3: Pinecone API Integration');
    console.log('-------------------------------');
    
    const apiKey = process.env.PINECONE_API_KEY || 'pcsk_6emnSp_Cj8GXBMBXTbM3qudCLezVrWPmqWjb2Agd79FAgWocGZsq63vPvMXYomfr3tDEf5';
    const pineconeUrl = 'https://contextlite-demo-ex6pti6.svc.aped-4627-b74a.pinecone.io/query';
    
    console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    console.log(`URL: ${pineconeUrl}`);
    console.log();
    
    const resultSets = {};
    const idSets = {};
    
    for (const query of testQueries.slice(0, 4)) { // Test first 4 to avoid rate limits
        console.log(`Testing query: "${query}"`);
        
        try {
            const vector = generateQueryVector(query);
            
            const response = await fetch(pineconeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': apiKey
                },
                body: JSON.stringify({
                    vector: vector,
                    topK: 10,
                    includeMetadata: true,
                    namespace: 'default'
                })
            });
            
            if (!response.ok) {
                console.log(`  ❌ API ERROR: ${response.status} ${response.statusText}`);
                allPassed = false;
                continue;
            }
            
            const data = await response.json();
            
            if (!data.matches || !Array.isArray(data.matches)) {
                console.log(`  ❌ INVALID RESPONSE: No matches array`);
                console.log(`  Response: ${JSON.stringify(data, null, 2)}`);
                allPassed = false;
                continue;
            }
            
            const ids = data.matches.slice(0, 3).map(m => m.id);
            const contents = data.matches.slice(0, 3).map(m => m.metadata?.content?.substring(0, 50) || 'NO CONTENT');
            const scores = data.matches.slice(0, 3).map(m => m.score);
            
            console.log(`  ✅ SUCCESS: ${data.matches.length} results`);
            console.log(`  Top 3 IDs: ${ids.join(', ')}`);
            console.log(`  Top 3 Scores: ${scores.map(s => s.toFixed(4)).join(', ')}`);
            console.log(`  Content Samples:`);
            contents.forEach((content, i) => {
                console.log(`    ${i+1}. ${content}...`);
            });
            
            // Check for uniqueness across queries
            const idsKey = ids.join('|');
            if (idSets[idsKey]) {
                console.log(`  ❌ DUPLICATE RESULTS: Same IDs as query "${idSets[idsKey]}"`);
                allPassed = false;
            } else {
                idSets[idsKey] = query;
                console.log(`  ✅ UNIQUE RESULTS: Different from other queries`);
            }
            
            resultSets[query] = { ids, contents, scores };
            
        } catch (error) {
            console.log(`  ❌ EXCEPTION: ${error.message}`);
            allPassed = false;
        }
        
        console.log();
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // TEST 4: Result Diversity Analysis
    console.log('TEST 4: Result Diversity Analysis');
    console.log('--------------------------------');
    
    const allResultIds = Object.values(resultSets).flatMap(r => r.ids);
    const uniqueIds = new Set(allResultIds);
    const duplicateRatio = (allResultIds.length - uniqueIds.size) / allResultIds.length;
    
    console.log(`Total result IDs collected: ${allResultIds.length}`);
    console.log(`Unique IDs: ${uniqueIds.size}`);
    console.log(`Duplicate ratio: ${(duplicateRatio * 100).toFixed(1)}%`);
    
    if (duplicateRatio > 0.5) {
        console.log(`❌ HIGH DUPLICATION: More than 50% duplicate results across queries`);
        allPassed = false;
    } else {
        console.log(`✅ GOOD DIVERSITY: Low duplication across different queries`);
    }
    
    console.log();
    
    // FINAL VERDICT
    console.log('FINAL VERDICT');
    console.log('=============');
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED: Pinecone integration is working correctly');
        console.log('   - Vector generation is unique for different queries');
        console.log('   - Vector generation is consistent for same queries');  
        console.log('   - Pinecone API returns valid responses');
        console.log('   - Results are diverse across different queries');
    } else {
        console.log('💥 TESTS FAILED: Pinecone integration has issues');
        console.log('   - Check the specific failures above');
        console.log('   - This explains why results appear random/irrelevant');
    }
    
    return allPassed;
}

// Run the test
if (require.main === module) {
    testPineconeIntegration()
        .then(passed => {
            process.exit(passed ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = { testPineconeIntegration };