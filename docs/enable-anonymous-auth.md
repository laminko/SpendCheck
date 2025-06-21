# Enable Anonymous Authentication in Supabase

To fix the authentication flow, you need to enable anonymous authentication in your Supabase project.

## Steps to Enable Anonymous Authentication

1. **Go to your Supabase Dashboard**
   - Visit [https://app.supabase.com](https://app.supabase.com)
   - Open your SpendCheck project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Settings" tab

3. **Enable Anonymous Sign-ins**
   - Scroll down to find "Anonymous sign-ins" section
   - Toggle the switch to **ON** to enable anonymous authentication

4. **Save Changes**
   - The setting should be saved automatically
   - You may see a green success message

## What This Enables

With anonymous authentication enabled:

- **All users get a Supabase user ID** (anonymous users get `is_anonymous: true`)
- **Proper data isolation** using Row Level Security (RLS) policies
- **Seamless upgrade path** from anonymous to authenticated users
- **Consistent database usage** for all users

## Authentication Flow

1. **App startup** → Creates anonymous user session with Supabase
2. **User gets unique ID** → Used for all database operations
3. **Optional sign-up/sign-in** → Converts anonymous user to authenticated user
4. **Data persists** → Anonymous user data is maintained during conversion

## After Enabling

Once you enable anonymous authentication:

1. The app will work without authentication errors
2. All users (anonymous and authenticated) will have data stored in Supabase
3. The Settings page will properly distinguish between anonymous and authenticated users
4. Users can upgrade from anonymous to authenticated seamlessly

## Troubleshooting

If you still see authentication errors after enabling:

1. **Clear browser storage** (localStorage, sessionStorage, cookies)
2. **Restart the development server** (`npm run dev`)
3. **Check browser console** for any remaining errors
4. **Verify the setting** is enabled in Supabase dashboard