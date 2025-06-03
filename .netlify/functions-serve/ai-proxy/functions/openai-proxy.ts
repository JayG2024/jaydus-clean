import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const handler: Handler = async (event) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const body = JSON.parse(event.body || '{}');
  try {
    const response = await openai.chat.completions.create(body.params);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export { handler };
