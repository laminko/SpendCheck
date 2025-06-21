# OAuth Configuration Guide

## Google OAuth Setup

### Common Issue: redirect_uri_mismatch (Error 400)

When implementing Google Sign-In with Supabase, you may encounter:
```
Error 400: redirect_uri_mismatch
```

### Solution

1. **Go to Google Cloud Console**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com)
   - Go to **APIs & Credentials > Credentials**
   - Find your OAuth 2.0 client ID

2. **Add Correct Redirect URIs**
   Add these URIs to your Google OAuth client:
   ```
   https://ielwsurzojvcjikzikxc.supabase.co/auth/v1/callback
   http://localhost:8100/auth/callback
   ```

3. **Get URLs from Supabase Dashboard**
   - Go to Authentication > Settings > Auth
   - Copy the exact "Site URL" and "Redirect URLs"
   - Add those to Google Cloud Console

### Important Notes

- Redirect URIs must match **exactly** (including http/https and ports)
- Development and production environments need separate redirect URIs
- Changes in Google Cloud Console may take a few minutes to propagate

### Testing

Test OAuth flows in both:
- Development: `http://localhost:8100`
- Production: Your deployed app URL

## Other OAuth Providers

Similar redirect URI configuration is required for:
- Facebook OAuth
- Apple OAuth
- Any other OAuth providers integrated with Supabase