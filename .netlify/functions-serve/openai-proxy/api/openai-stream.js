// Universal OpenAI streaming endpoint that works on multiple platforms
// This can be deployed as a Vercel API route, Netlify function, or Express endpoint

import OpenAI from 'openai';

// Platform detection
const isVercel = typeof process.env.VERCEL !== 'undefined';
const isNetlify = typeof process.env.NETLIFY !== 'undefined';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract parameters from request
    const { model, messages, temperature = 0.7 } = isVercel || isNetlify ? 
      req.body : 
      await readRequestBody(req);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
    });

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create streaming completion
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages,
      temperature: parseFloat(temperature) || 0.7,
      stream: true,
    });

    // Stream the response
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // End the stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in OpenAI stream:', error);
    
    // Send error response
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}

// Helper function to read request body for Express
async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const bodyParts = [];
    req.on('data', (chunk) => {
      bodyParts.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(bodyParts).toString();
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', reject);
  });
}
