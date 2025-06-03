# Netlify Environment Variables Setup

## 🚀 Set These in Netlify Dashboard

Go to your Netlify dashboard → Site settings → Environment variables and add:

### Required Variables:

```
OPENROUTER_API_KEY=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
MONGODB_URI=mongodb+srv://jaydus:jaydusplatform@cluster0.mongodb.net/jaydus_platform?retryWrites=true&w=majority
CLERK_SECRET_KEY=sk_live_wVpjwAjvFza8rOTgzXAmYTGEgJOgVQZyPZxY3RxmCt
```

### Already Set (from your code):
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_DOMAIN` 
- `VITE_APP_URL`
- `VITE_ENABLE_MOCK_MODE`

## ✅ After Setting Variables:

1. Trigger a new deploy in Netlify (or push any small change)
2. Test the AI Chat at: https://lucky.jaydus.ai/ai-chat
3. All streaming errors should be resolved!

Your OpenRouter-only setup is now complete and optimized.