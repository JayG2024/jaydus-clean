import OpenAI from 'openai';
import { trackApiUsage, checkUserCredits } from '../services/supabaseUsageService';
import { isLocalDevelopment } from '../utils/validateEnv';
import { logApiError, logError, ErrorSeverity } from '../utils/errorLogger';
import pLimit from 'p-limit';
import { toast } from 'sonner';
import { throttle } from 'lodash';
import { createOpenAIClient, executeOpenAIRequest } from './realTimeClient';

// Configure rate limits to avoid hitting API rate limits
const RATE_LIMIT_CHAT = 50; // requests per minute
const RATE_LIMIT_IMAGES = 20; // requests per minute
const RATE_LIMIT_AUDIO = 30; // requests per minute

// Create rate limiters
const chatLimit = pLimit(5); // max 5 concurrent chat requests
const imageLimit = pLimit(3); // max 3 concurrent image requests
const audioLimit = pLimit(3); // max 3 concurrent audio requests

// Create a wrapper for OpenAI API that tracks usage
class OpenAIWithUsage {
  openai: OpenAI;
  userId: string | null = null;
  
  // Rate limiting
  chatRateLimiter: ReturnType<typeof throttle>;
  imageRateLimiter: ReturnType<typeof throttle>;
  audioRateLimiter: ReturnType<typeof throttle>;

  constructor(apiKey?: string) {
    // Initialize rate limiters
    this.chatRateLimiter = throttle((callback) => callback(), (60 * 1000) / RATE_LIMIT_CHAT);
    this.imageRateLimiter = throttle((callback) => callback(), (60 * 1000) / RATE_LIMIT_IMAGES);
    this.audioRateLimiter = throttle((callback) => callback(), (60 * 1000) / RATE_LIMIT_AUDIO);
    
    // Create the OpenAI client using the proxy in browser or direct in server
    try {
      // We'll use the createOpenAIClient which handles environment detection
      this.openai = createOpenAIClient(apiKey);
      console.log('✅ OpenAI client initialized');
    } catch (error) {
      logError(
        error instanceof Error ? error : new Error('Failed to initialize OpenAI client'),
        {
          message: 'Failed to initialize OpenAI client',
          context: { apiKeyProvided: !!apiKey },
          tags: ['openai', 'initialization']
        },
        ErrorSeverity.ERROR
      );
      
      throw error;
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  async chat(params: any, options: any = {}) {
    // Only track if we have a userId
    if (this.userId) {
      try {
        // Check if user has enough credits
        const hasCredits = await checkUserCredits(this.userId, 'chat');
        if (!hasCredits) {
          toast.error('You have reached your chat credit limit. Please upgrade your plan.');
          throw new Error('Not enough credits. Please upgrade your plan.');
        }

        // Track the chat message for billing
        await trackApiUsage(this.userId, 'chat');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Not enough credits')) {
          throw error;
        }
        // If tracking fails, log the error but continue with the request
        logApiError('checkUserCredits', error, { operation: 'chat' });
      }
    }

    // If in local development, provide some simulated response
    if (isLocalDevelopment()) {
      console.log('Development mode: Simulating chat response');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a simple simulated response for development
      let response = "This is a simulated response for development purposes. In production, this would come from OpenAI.";
      
      return {
        choices: [
          {
            message: {
              role: 'assistant',
              content: response
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: params.messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0),
          completion_tokens: response.length,
          total_tokens: params.messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0) + response.length
        }
      };
    }

    // Implement rate limiting and retry logic for real API call
    return await chatLimit(async () => {
      return await new Promise((resolve, reject) => {
        this.chatRateLimiter(async () => {
          try {
            const result = await executeOpenAIRequest(
              async () => {
                // Set up timeout protection
                const abortController = new AbortController();
                const timeoutId = setTimeout(() => abortController.abort(), 60000); // 1 minute timeout
                
                try {
                  // Make the API call with proper options
                  const response = await this.openai.chat.completions.create(
                    params, 
                    { 
                      ...options, 
                      signal: abortController.signal 
                    }
                  );
                  
                  clearTimeout(timeoutId);
                  return response;
                } catch (error) {
                  clearTimeout(timeoutId);
                  throw error;
                }
              },
              {
                identifier: 'openai.chat.completions.create',
                getErrorMessage: (error) => {
                  let message = 'Failed to generate chat response';
                  if (error instanceof Error) {
                    if (error.message.includes('rate_limit') || error.message.includes('429')) {
                      message = 'OpenAI rate limit exceeded. Please try again in a moment.';
                    } else if (error.message.includes('invalid_request_error') || error.message.includes('context_length_exceeded')) {
                      message = 'Your conversation is too long. Please start a new chat.';
                    } else if (error.message.includes('authentication')) {
                      message = 'API authentication failed. Please check your API key.';
                    } else {
                      message = `Error: ${error.message}`;
                    }
                  }
                  return message;
                },
                retries: 3
              }
            );
            
            console.log(`✅ OpenAI chat completion successful with model ${params.model}`);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  async generateImage(params: any): Promise<OpenAI.Images.ImagesResponse> {
    // Only track if we have a userId
    if (this.userId) {
      try {
        // Check if user has enough credits (images cost more)
        const imageCount = params.n || 1;
        const hasCredits = await checkUserCredits(this.userId, 'image', imageCount);
        if (!hasCredits) {
          toast.error('You have reached your image generation credit limit. Please upgrade your plan.');
          throw new Error('Not enough credits. Please upgrade your plan.');
        }

        // Track the image generation for billing
        await trackApiUsage(this.userId, 'image', imageCount * 10); // 10 credits per image
      } catch (error) {
        if (error instanceof Error && error.message.includes('Not enough credits')) {
          throw error;
        }
        // If tracking fails, log the error but continue with the request
        logApiError('checkUserCredits', error, { operation: 'image', count: params.n });
      }
    }

    // In local development, return placeholder images
    if (isLocalDevelopment()) {
      console.log('Development mode: Simulating image generation');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const n = params.n || 1;
      const placeholderImages = [
        "https://images.pexels.com/photos/3573351/pexels-photo-3573351.png",
        "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg",
        "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg",
        "https://images.pexels.com/photos/1909644/pexels-photo-1909644.jpeg"
      ];
      
      return {
        created: Math.floor(Date.now() / 1000),
        data: Array(n).fill(0).map((_, index) => ({
          url: placeholderImages[index % placeholderImages.length],
          revised_prompt: params.prompt
        }))
      };
    }

    // Implement rate limiting and retry logic for image generation
    return await imageLimit(async () => {
      return await new Promise((resolve, reject) => {
        this.imageRateLimiter(async () => {
          try {
            const result = await executeOpenAIRequest(
              async () => {
                // Set up timeout protection
                const abortController = new AbortController();
                const timeoutId = setTimeout(() => abortController.abort(), 90000); // 1.5 minutes timeout (image generation can take longer)
                
                try {
                  // Make the API call with proper parameters
                  const response = await this.openai.images.generate({
                    ...params,
                    model: params.model || 'dall-e-3', // Default to latest model if not specified
                    quality: params.quality || 'standard',
                    response_format: params.response_format || 'url'
                  });
                  
                  clearTimeout(timeoutId);
                  return response;
                } catch (error) {
                  clearTimeout(timeoutId);
                  throw error;
                }
              },
              {
                identifier: 'openai.images.generate',
                getErrorMessage: (error) => {
                  let message = 'Failed to generate image';
                  if (error instanceof Error) {
                    if (error.message.includes('rate_limit') || error.message.includes('429')) {
                      message = 'OpenAI rate limit exceeded. Please try again in a moment.';
                    } else if (error.message.includes('content_policy_violation')) {
                      message = 'Your prompt violates content policy. Please modify and try again.';
                    } else if (error.message.includes('authentication')) {
                      message = 'API authentication failed. Please check your API key.';
                    } else {
                      message = `Error: ${error.message}`;
                    }
                  }
                  return message;
                },
                retries: 2 // Fewer retries for image generation to avoid excessive costs
              }
            );
            
            console.log(`✅ OpenAI image generation successful with model ${params.model || 'dall-e-3'}`);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  async generateSpeech(params: any): Promise<Response> {
    // Only track if we have a userId
    if (this.userId) {
      try {
        // Estimate minutes based on character count (rough approximation)
        const textLength = params.input.length;
        const estimatedMinutes = Math.max(1, Math.ceil(textLength / 1000)); // ~1000 characters per minute

        // Check if user has enough credits
        const hasCredits = await checkUserCredits(this.userId, 'voice', estimatedMinutes);
        if (!hasCredits) {
          toast.error('You have reached your voice generation credit limit. Please upgrade your plan.');
          throw new Error('Not enough credits. Please upgrade your plan.');
        }

        // Track the voice generation for billing
        await trackApiUsage(this.userId, 'voice', estimatedMinutes * 5); // 5 credits per minute
      } catch (error) {
        if (error instanceof Error && error.message.includes('Not enough credits')) {
          throw error;
        }
        // If tracking fails, log the error but continue with the request
        logApiError('checkUserCredits', error, { operation: 'voice', textLength: params.input.length });
      }
    }

    // If in local development, return placeholder audio
    if (isLocalDevelopment()) {
      console.log('Development mode: Simulating speech generation');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return a placeholder audio file
      try {
        const response = await fetch('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
        return response;
      } catch (error) {
        console.error('Error fetching placeholder audio:', error);
        
        // If fetching fails, create an empty audio buffer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, 44100, 44100);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        // Convert buffer to blob
        const audioData = buffer.getChannelData(0);
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        
        return new Response(blob);
      }
    }

    // Implement rate limiting and retry logic for speech generation
    return await audioLimit(async () => {
      return await new Promise((resolve, reject) => {
        this.audioRateLimiter(async () => {
          try {
            const result = await executeOpenAIRequest(
              async () => {
                // Set up timeout protection
                const abortController = new AbortController();
                const timeoutId = setTimeout(() => abortController.abort(), 60000); // 1 minute timeout
                
                try {
                  // Make the API call
                  const response = await this.openai.audio.speech.create({
                    ...params,
                    model: params.model || 'tts-1', // Default to standard model if not specified
                    voice: params.voice || 'alloy', // Default voice if not specified
                  });
                  
                  clearTimeout(timeoutId);
                  return response;
                } catch (error) {
                  clearTimeout(timeoutId);
                  throw error;
                }
              },
              {
                identifier: 'openai.audio.speech.create',
                getErrorMessage: (error) => {
                  let message = 'Failed to generate speech';
                  if (error instanceof Error) {
                    if (error.message.includes('rate_limit') || error.message.includes('429')) {
                      message = 'OpenAI rate limit exceeded. Please try again in a moment.';
                    } else if (error.message.includes('content_policy_violation')) {
                      message = 'Your text violates content policy. Please modify and try again.';
                    } else if (error.message.includes('authentication')) {
                      message = 'API authentication failed. Please check your API key.';
                    } else {
                      message = `Error: ${error.message}`;
                    }
                  }
                  return message;
                },
                retries: 2
              }
            );
            
            console.log(`✅ OpenAI speech generation successful with model ${params.model || 'tts-1'} and voice ${params.voice || 'alloy'}`);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  async transcribe(params: any): Promise<{ text: string }> {
    // Only track if we have a userId
    if (this.userId) {
      try {
        // Check if user has enough credits
        const hasCredits = await checkUserCredits(this.userId, 'voice', 1);
        if (!hasCredits) {
          toast.error('You have reached your transcription credit limit. Please upgrade your plan.');
          throw new Error('Not enough credits. Please upgrade your plan.');
        }

        // Track the transcription for billing
        await trackApiUsage(this.userId, 'voice', 5); // 5 credits per transcription
      } catch (error) {
        if (error instanceof Error && error.message.includes('Not enough credits')) {
          throw error;
        }
        // If tracking fails, log the error but continue with the request
        logApiError('checkUserCredits', error, { operation: 'transcribe' });
      }
    }

    // If in local development, return placeholder transcription
    if (isLocalDevelopment()) {
      console.log('Development mode: Simulating transcription');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return a simulated transcription
      return {
        text: "This is a simulated transcription for development purposes. In production, this would be the actual transcribed text from the audio file you uploaded."
      };
    }

    // Implement rate limiting and retry logic for transcription
    return await audioLimit(async () => {
      return await new Promise((resolve, reject) => {
        this.audioRateLimiter(async () => {
          try {
            const result = await executeOpenAIRequest(
              async () => {
                // Set up timeout protection
                const abortController = new AbortController();
                const timeoutId = setTimeout(() => abortController.abort(), 90000); // 1.5 minutes timeout (transcription can take longer)
                
                try {
                  // Make the API call
                  const formData = new FormData();
                  formData.append('file', params.file);
                  formData.append('model', params.model || 'whisper-1');
                  
                  // Use the Netlify proxy for audio transcriptions
                  const response = await fetch('/api/openai-proxy/audio/transcriptions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    },
                    body: formData,
                    signal: abortController.signal
                  });
                  
                  clearTimeout(timeoutId);
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}\n${errorText}`);
                  }
                  
                  const data = await response.json();
                  return data;
                } catch (error) {
                  clearTimeout(timeoutId);
                  throw error;
                }
              },
              {
                identifier: 'openai.audio.transcriptions.create',
                getErrorMessage: (error) => {
                  let message = 'Failed to transcribe audio';
                  if (error instanceof Error) {
                    if (error.message.includes('rate_limit') || error.message.includes('429')) {
                      message = 'OpenAI rate limit exceeded. Please try again in a moment.';
                    } else if (error.message.includes('file_too_large')) {
                      message = 'Audio file is too large. Please upload a smaller file (max 25 MB).';
                    } else if (error.message.includes('unsupported_file_type')) {
                      message = 'Unsupported audio format. Please use MP3, MP4, WAV, or WebM.';
                    } else if (error.message.includes('authentication')) {
                      message = 'API authentication failed. Please check your API key.';
                    } else {
                      message = `Error: ${error.message}`;
                    }
                  }
                  return message;
                },
                retries: 2
              }
            );
            
            console.log(`✅ OpenAI audio transcription successful with model ${params.model || 'whisper-1'}`);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }
}

export default OpenAIWithUsage;