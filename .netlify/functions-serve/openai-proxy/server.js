import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// OpenAI streaming endpoint
app.post('/api/openai-stream', async (req, res) => {
  try {
    const { model, messages, temperature, stream } = req.body;
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create streaming completion
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages,
      temperature: temperature || 0.7,
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
    res.status(500).json({ error: error.message });
  }
});

// Transcription endpoint (if you need it)
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    // Implementation for audio transcription
    // ...
    
    res.status(200).json({ result: "Audio transcription would go here" });
  } catch (error) {
    console.error('Error in transcription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
