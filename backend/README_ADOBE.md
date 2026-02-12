# Adobe Lightroom Integration Guide

This guide will help you connect **your** Adobe Lightroom account to display and sell your photos in the store.

**Important:** This is a single-account integration. You (the store owner) connect your Adobe account once, and all customers will see photos from your Lightroom catalog.

## Prerequisites

1. Your Adobe account (free or paid) with photos in Lightroom
2. Access to Adobe Developer Console

## Step 1: Register Your Application

1. Go to [Adobe Developer Console](https://developer.adobe.com/console)
2. Sign in with your Adobe account
3. Click "Create new project" or select an existing project
4. Click "Add API" and search for "Lightroom API"
5. Add the Lightroom API to your project

## Step 2: Configure OAuth

1. In your project settings, configure the OAuth redirect URI:
   - Development: `http://localhost:3000/auth/adobe/callback`
   - Production: `https://yourdomain.com/auth/adobe/callback`

2. Note down your:
   - **Client ID** (also called API Key)
   - **Client Secret**

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Adobe credentials:
   ```
   ADOBE_CLIENT_ID=your_client_id_here
   ADOBE_CLIENT_SECRET=your_client_secret_here
   ADOBE_REDIRECT_URI=http://localhost:3000/auth/adobe/callback
   ```

## Step 4: Connect Your Adobe Account (One-Time Setup)

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/auth/adobe` in your browser
3. Sign in with **your** Adobe account (the account that has the photos you want to sell)
4. Authorize the application
5. You'll be redirected back and your account will be connected
6. **Tokens are automatically saved** - you won't need to reconnect unless you disconnect

## Step 5: Verify Connection

Check the connection status:
```bash
curl http://localhost:3000/api/adobe/status
```

Or check the frontend - you'll see a green indicator if connected.

## How It Works

1. **One-Time Authentication (Store Owner Only):**
   - Store owner visits `/auth/adobe` once
   - Redirects to Adobe OAuth page
   - Store owner authorizes the app
   - Adobe redirects back with authorization code
   - Backend exchanges code for access token
   - **Tokens are saved to `adobe-tokens.json`** - persists across server restarts
   - Tokens automatically refresh when expired

2. **Fetching Photos (Automatic for All Users):**
   - When any user queries `photos`, the system:
     1. Automatically loads saved tokens
     2. Fetches photos from **your** Adobe Lightroom catalog
     3. Falls back to local `photos.json` if API is unavailable
   - Photos are automatically transformed to match your GraphQL schema
   - **All customers see the same photos from your account**

## API Endpoints

- `GET /auth/adobe` - Start OAuth flow
- `GET /auth/adobe/callback` - OAuth callback (handled automatically)
- `GET /api/adobe/status` - Check connection status

## GraphQL Queries

The existing `photos` and `photo` queries work the same way, but now fetch from Adobe Lightroom:

```graphql
query {
  photos {
    id
    title
    url
    price
  }
}
```

## Production Considerations

1. **Token Storage:**
   - Tokens are stored in `adobe-tokens.json` file
   - In production, consider storing in a database or encrypted file
   - Tokens automatically refresh when expired
   - Add `adobe-tokens.json` to `.gitignore` (contains sensitive data)

2. **Security:**
   - The `adobe-tokens.json` file contains sensitive access tokens
   - Never commit this file to version control
   - Consider encrypting the tokens file in production
   - The disconnect endpoint should be protected with admin authentication

2. **Error Handling:**
   - The system gracefully falls back to local photos if Adobe API fails
   - Monitor API usage and rate limits

3. **Security:**
   - Never commit `.env` file to version control
   - Use strong, unique secrets
   - Implement proper token encryption

## Disconnecting Your Account

To disconnect your Adobe account:
```bash
curl -X POST http://localhost:3000/api/adobe/disconnect
```

Or add admin authentication and create a UI for this in production.

## Troubleshooting

**"No access token available" error:**
- Make sure you've completed the OAuth flow at `/auth/adobe` (one-time setup)
- Check that `adobe-tokens.json` exists in the backend directory
- Verify file permissions allow reading the tokens file

**"Authentication expired" error:**
- Tokens automatically refresh using the refresh token
- If refresh fails, re-authenticate by visiting `/auth/adobe` again
- Check that `adobe-tokens.json` contains both access and refresh tokens

**Photos not showing:**
- Check that your Adobe account has photos in Lightroom
- Verify API credentials are correct
- Check server logs for API errors
- System will fall back to local photos if API fails

## Additional Resources

- [Adobe Developer Console](https://developer.adobe.com/console)
- [Adobe Lightroom API Documentation](https://developer.adobe.com/lightroom/)
- [OAuth 2.0 Guide](https://oauth.net/2/)

