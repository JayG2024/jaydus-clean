# Microsoft OAuth Setup for Clerk

## Prerequisites
1. Microsoft Azure account
2. Clerk Dashboard access
3. Production domain configured (lucky.jaydus.ai)

## Step 1: Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Configure as follows:
   - **Name**: Jaydus Platform (or your app name)
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web - `https://clerk.jaydus.ai/v1/oauth_callback`
5. Click "Register"

## Step 2: Configure Azure App

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description and select expiry
4. **Copy the secret value immediately** (you won't see it again)
5. Go to "Overview" and copy the "Application (client) ID"

## Step 3: Clerk Dashboard Configuration

1. Log in to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to your application
3. Go to "User & Authentication" > "Social Connections"
4. Click on "Microsoft"
5. Configure as follows:

   **Basic Settings:**
   - ✅ Enable for sign-up and sign-in
   - ✅ Use custom credentials

   **OAuth Credentials:**
   - Client ID: `[Your Azure Application ID]`
   - Client Secret: `[Your Azure Client Secret]`
   - Authorized Redirect URI: `https://clerk.jaydus.ai/v1/oauth_callback`

6. Click "Save"

## Step 4: Test the Integration

1. Deploy to production
2. Visit https://lucky.jaydus.ai/login
3. You should see "Continue with Microsoft" button
4. Click to test the OAuth flow

## Troubleshooting

### Microsoft button not appearing
- Ensure Microsoft is enabled in Clerk Dashboard
- Check browser console for errors
- Verify production deployment

### OAuth redirect errors
- Confirm redirect URI matches exactly in both Azure and Clerk
- Check that the app registration is not in a restricted tenant

### Authentication failures
- Verify Client ID and Secret are correct
- Ensure the Azure app has proper permissions
- Check Clerk logs for detailed errors

## Security Notes

- Rotate client secrets regularly
- Monitor sign-in logs in Azure AD
- Review app permissions periodically
- Never commit credentials to version control