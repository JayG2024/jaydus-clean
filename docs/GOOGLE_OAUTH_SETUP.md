# Google OAuth Setup for Clerk

## Prerequisites
1. Google Cloud Console account
2. Clerk Dashboard access
3. Production domain configured (lucky.jaydus.ai)

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `https://clerk.jaydus.ai/v1/oauth_callback`
   - Save your Client ID and Client Secret

## Step 2: Clerk Dashboard Configuration

1. Log in to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to your application
3. Go to "User & Authentication" > "Social Connections"
4. Click on "Google"
5. Configure as follows:

   **Basic Settings:**
   - ✅ Enable for sign-up and sign-in
   - ✅ Block email subaddresses (optional)
   - ✅ Use custom credentials

   **OAuth Credentials:**
   - Client ID: `[Your Google Client ID]`
   - Client Secret: `[Your Google Client Secret]`
   - Authorized Redirect URI: `https://clerk.jaydus.ai/v1/oauth_callback`

   **Scopes (should be pre-filled):**
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

   **Additional Options:**
   - ✅ Always show account selector prompt

6. Click "Save"

## Step 3: Application Code Updates (Already Completed)

The authentication pages have been updated with:
- Google OAuth button styling
- Social buttons placed at the top
- Proper button appearance configuration

## Step 4: Testing

1. Deploy to production: `git push origin main`
2. Visit https://lucky.jaydus.ai/login
3. You should see "Continue with Google" button
4. Click to test the OAuth flow

## Troubleshooting

### Google button not appearing
- Ensure Google is enabled in Clerk Dashboard
- Check browser console for errors
- Verify production deployment

### OAuth redirect errors
- Confirm redirect URI matches exactly in both Google and Clerk
- Check domain configuration in Clerk

### Authentication failures
- Verify Client ID and Secret are correct
- Ensure Google+ API is enabled
- Check Clerk logs for detailed errors

## Security Notes

- Never commit Google OAuth credentials to version control
- Use environment variables for sensitive data
- Regularly rotate OAuth secrets
- Monitor for suspicious login activity