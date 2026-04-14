require('dotenv').config();
const fetch = require('node-fetch');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

async function testConnection() {
    console.log(`Testing OpenRouter with key: ${apiKey.substring(0, 10)}...`);
    console.log(`Model: ${model}`);

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },

            
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'user', content: 'Say hello' }
                ],
                max_tokens: 10
            })
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testConnection();
