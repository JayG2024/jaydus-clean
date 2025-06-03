import OpenAI from 'openai';
// Mock mode check using environment variable directly
import { logError, logApiError, ErrorSeverity } from '../utils/errorLogger';
import { toast } from 'sonner';
import { createOpenAIClient } from './realTimeClient';

// Create a mock OpenAI instance for development
class MockOpenAI {
  constructor() {
    console.log('🧪 Using mock OpenAI client');
  }

  chat = {
    completions: {
      create: async ({ messages, model }: { messages: any[], model: string }) => {
        console.log(`Mock OpenAI API call to ${model} with ${messages.length} messages`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return a mock response
        return {
          choices: [
            {
              message: {
                role: 'assistant',
                content: `This is a simulated response from the Mock OpenAI API. In production, this would be a real response from the ${model} model based on your input: "${messages[messages.length - 1]?.content?.substring(0, 50)}..."`
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: messages.reduce((sum, m) => sum + (m.content?.length || 0), 0),
            completion_tokens: 150,
            total_tokens: messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) + 150
          }
        };
      }
    }
  };

  images = {
    generate: async ({ prompt, model, n, size }: { prompt: string, model: string, n: number, size: string }) => {
      console.log(`Mock OpenAI image generation for: "${prompt}"`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate random image URLs (using Pexels random images)
      const mockImageIds = [
        '3573351', '3052361', '2387873', '1909644', 
        '2486168', '775201', '3617500', '3244513'
      ];
      
      // Return mock image data
      return {
        data: Array(n).fill(0).map(() => {
          const randomId = mockImageIds[Math.floor(Math.random() * mockImageIds.length)];
          return {
            url: `https://images.pexels.com/photos/${randomId}/pexels-photo-${randomId}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`,
            revised_prompt: prompt
          };
        })
      };
    }
  };

  audio = {
    speech: {
      create: async ({ model, voice, input }: { model: string, voice: string, input: string }) => {
        console.log(`Mock OpenAI speech generation for: "${input.substring(0, 50)}..."`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return a mock audio buffer
        const response = new Response('Mock audio data');
        return {
          arrayBuffer: async () => new ArrayBuffer(1000), // Mock audio data
        };
      }
    },
    transcriptions: {
      create: async ({ file, model }: { file: any, model: string }) => {
        console.log(`Mock OpenAI transcription with model ${model}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Return mock transcription
        return {
          text: "This is a simulated transcription of the uploaded audio file. In a real implementation, this would use the OpenAI API to convert the audio to text. The transcription would be accurate and include proper punctuation and formatting."
        };
      }
    }
  };
}

// Use mock OpenAI or real OpenAI based on environment variables
const openai = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true'
  ? (new MockOpenAI() as unknown as OpenAI) 
  : createOpenAIClient();

export default openai;