
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

async function testEnv() {
    console.log('Testing Environment Variables...');

    // Check Next.js env loading (This script runs in node, so we need to manually load or check if user ran it with env)
    // Actually, for the user to test this, they should look at the api route logs. 
    // But let's print what we can see (masking keys).

    const apiKey = process.env.GEMINI_API_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('GEMINI_API_KEY:', apiKey ? 'Set (' + apiKey.substring(0, 5) + '...)' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Set (' + serviceRoleKey.substring(0, 5) + '...)' : 'NOT SET');

    if (!apiKey) {
        console.error('ERROR: GEMINI_API_KEY is missing.');
    }

    if (!serviceRoleKey) {
        console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing.');
    }
}

testEnv();
