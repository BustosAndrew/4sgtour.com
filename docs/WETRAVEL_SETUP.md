# WeTravel API Setup

This project integrates with the WeTravel API to sync trip data using direct fetch calls.

## Configuration

Add the following environment variable to your Vercel project or `.env.local` file:

- `WETRAVEL_REFRESH_TOKEN` - Your WeTravel API refresh token from your WeTravel account

**To get your refresh token:**
1. Log in to your WeTravel account
2. Go to Profile → Partner API Integration
3. Generate a refresh token
4. Copy and save it securely

## How It Works

- The integration uses direct fetch calls to the WeTravel API (no npm package needed)
- Access tokens are automatically generated from your refresh token and cached for 55 minutes
- Refresh tokens are permanent until you regenerate them
- Access tokens are passed as Bearer tokens in the Authorization header

## Usage

Once configured, admins can sync trips from WeTravel via the admin dashboard:

1. Navigate to `/admin` 
2. Click "Sync from WeTravel" button
3. Trips will be imported and displayed as "Unassigned"
4. Assign continents to make trips visible on the public site

## API Endpoints Used

- `POST /auth/tokens/access` - Get access token from refresh token
- `GET /trips` - List all trips
- `GET /trips/{uuid}` - Get single trip details

## Architecture

The WeTravel integration is implemented in:
- `lib/wetravel/client.ts` - Authentication and fetch wrapper with token caching
- `lib/wetravel/trips.ts` - Trip management functions
- `app/api/wetravel/sync/route.ts` - Sync endpoint to pull trips into Supabase

## Notes

- This is a Pro feature and requires a WeTravel Pro account
- Access tokens expire after 1 hour (we cache for 55 minutes)
- Trips are stored in Supabase for fast querying
- Users are redirected to WeTravel's booking URL when they click "Book Now"
