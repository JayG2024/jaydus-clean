import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { streamChatCompletion } from '../../services/streamingService';

export const StreamingTest: React.FC = () => {
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testStreaming = async () => {
    setResponse('');
    setError('');
    setLogs([]);
    setIsStreaming(true);
    
    addLog('Starting streaming test...');
    
    try {
      await streamChatCompletion(
        {
          model: 'gpt-4o',
          messages: [
            { role: 'user', content: 'Say "Hello, streaming is working!" in 5 words.' }
          ],
          temperature: 0.7,
          max_tokens: 50
        },
        (chunk) => {
          addLog(`Received chunk: "${chunk}"`);
          setResponse(prev => prev + chunk);
        },
        () => {
          addLog('Streaming completed');
          setIsStreaming(false);
        },
        (err) => {
          addLog(`Error: ${err.message}`);
          setError(err.message);
          setIsStreaming(false);
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Caught error: ${errorMessage}`);
      setError(errorMessage);
      setIsStreaming(false);
    }
  };

  const testEndpoint = async () => {
    addLog('Testing endpoint directly...');
    try {
      const response = await fetch('/api/test-streaming');
      const data = await response.json();
      addLog(`Endpoint test response: ${JSON.stringify(data)}`);
    } catch (err) {
      addLog(`Endpoint test failed: ${err}`);
    }
  };

  const testOpenAIEndpoint = async () => {
    addLog('Testing OpenAI streaming endpoint directly...');
    try {
      const response = await fetch('/api/openai-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params: {
            model: 'gpt-4o',
            messages: [
              { role: 'user', content: 'Say hello' }
            ],
            temperature: 0.7,
            max_tokens: 50
          }
        }),
      });
      
      addLog(`Direct endpoint response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response: ${errorText}`);
      } else {
        addLog('Response OK, attempting to read stream...');
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            addLog(`Raw stream data: ${text}`);
          }
        }
      }
    } catch (err) {
      addLog(`Direct endpoint test failed: ${err}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Streaming Test</h2>
      
      <div className="space-x-4">
        <Button onClick={testEndpoint} disabled={isStreaming}>
          Test Health Endpoint
        </Button>
        <Button onClick={testOpenAIEndpoint} disabled={isStreaming}>
          Test OpenAI Endpoint Directly
        </Button>
        <Button onClick={testStreaming} disabled={isStreaming}>
          Test Full Streaming
        </Button>
      </div>

      {isStreaming && (
        <div className="text-blue-600">Streaming in progress...</div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded text-red-700">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="p-4 bg-green-100 border border-green-300 rounded">
          <strong>Response:</strong> {response}
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-bold mb-2">Logs:</h3>
        <div className="bg-gray-100 p-3 rounded text-xs font-mono space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};