# WeTravel API Setup

## Installation

The WeTravel API SDK is installed using the `api` CLI tool, not npm. Run this command in your project root:

\`\`\`bash
npx api install "@wetravelapi/v2#6q19891xmfeha7jm"
\`\`\`

This will generate SDK files in your project that should be committed to version control.

## Configuration

After installation, add the following environment variables to your Vercel project:

- `WETRAVEL_REFRESH_TOKEN` - Your WeTravel API refresh token from your WeTravel account

## Usage

The WeTravel integration is already configured in the following files:
- `lib/wetravel/client.ts` - Authentication and API client
- `lib/wetravel/trips.ts` - Trip management functions
- `app/api/wetravel/sync/route.ts` - Sync endpoint to pull trips from WeTravel

Once configured, admins can sync trips from WeTravel via the admin dashboard.
