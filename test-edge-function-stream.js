// Test script for Edge Function streaming
// Run this after deploying to Netlify to test the streaming fixes

const testStreamingEndpoint = async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8888';
  
  console.log('🧪 Testing Edge Function streaming...\n');
  
  // Test cases
  const testCases = [
    {
      name: 'OpenAI GPT-4 Streaming',
      endpoint: '/api/ai-stream',
      payload: {
        modelId: 'gpt-4',
        prompt: 'Say "Hello, streaming test!" in 3 words.',
        options: { temperature: 0.7 }
      }
    },
    {
      name: 'Claude 3 Streaming',
      endpoint: '/api/ai-stream',
      payload: {
        modelId: 'claude-3-sonnet',
        prompt: 'Say "Hello, Claude test!" in 3 words.',
        options: { temperature: 0.7, maxTokens: 100 }
      }
    },
    {
      name: 'OpenRouter Model Streaming',
      endpoint: '/api/ai-stream',
      payload: {
        modelId: 'openai/gpt-3.5-turbo',
        prompt: 'Say "Hello, OpenRouter!" in 2 words.',
        options: { temperature: 0.7 }
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📡 Testing: ${testCase.name}`);
    console.log(`Endpoint: ${testCase.endpoint}`);
    console.log(`Model: ${testCase.payload.modelId}`);
    
    try {
      const response = await fetch(`${baseUrl}${testCase.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error: ${response.status} ${response.statusText}`);
        console.error(`Response: ${error}`);
        continue;
      }
      
      console.log('✅ Connection established');
      console.log('📥 Receiving stream...');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('\n✅ Stream completed');
          console.log(`Full response: "${fullResponse}"`);
          break;
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                process.stdout.write(parsed.content);
                fullResponse += parsed.content;
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ All tests completed!');
};

// Run the test
testStreamingEndpoint().catch(console.error);