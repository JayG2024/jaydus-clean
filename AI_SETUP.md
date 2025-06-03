# AI Functionality Setup

This document provides instructions for setting up and using the AI functionality in the application.

## Setup

1. **API Keys**: You need to obtain API keys for the AI providers you want to use:
   - OpenAI API key: https://platform.openai.com/api-keys
   - Anthropic API key: https://console.anthropic.com/

2. **Environment Variables**: Add your API keys to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

3. **Disable Mock Mode**: Ensure mock mode is disabled in the `.env` file:
   ```
   VITE_ENABLE_MOCK_MODE=false
   ```

## Available Models

### OpenAI Models
- **GPT-4o**: Latest multimodal model with advanced reasoning
- **GPT-4 Turbo**: Powerful model with strong reasoning capabilities
- **GPT-3.5 Turbo**: Fast and cost-effective for most tasks

### Anthropic Models
- **Claude 3 Opus**: Most powerful Claude model with exceptional understanding
- **Claude 3 Sonnet**: Balanced performance and intelligence
- **Claude 3 Haiku**: Fast and efficient for straightforward tasks

## Usage

1. **Chat Interface**: Navigate to the Chat page to interact with AI models
   - Select your preferred model from the dropdown
   - Type your message and press Enter or click Send
   - The AI will respond in real-time with streaming text

2. **Model Selection**: Different models have different capabilities and costs
   - Premium models (marked with "Pro") generally provide better responses but cost more
   - Choose models based on your specific needs and budget

3. **File Uploads**: You can upload files to include in your conversation
   - Supported file types include images, PDFs, and text files
   - The AI will reference the uploaded files in its responses

## Troubleshooting

If you encounter issues with the AI functionality:

1. **Check API Keys**: Ensure your API keys are correctly set in the `.env` file
2. **Check Console**: Look for error messages in the browser console
3. **API Limits**: You might be hitting rate limits or usage quotas from the providers
4. **Network Issues**: Ensure you have a stable internet connection

## Cost Management

Be aware that using AI models incurs costs based on your usage:

- OpenAI charges based on input and output tokens
- Anthropic charges based on input and output tokens
- Premium models cost more than standard models
- Monitor your usage to avoid unexpected charges

## Further Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)