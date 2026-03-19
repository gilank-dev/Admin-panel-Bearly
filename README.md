# Bearly Admin Panel

Admin dashboard for managing the AI Chatbot users, usage limits, and settings.

## Features

- 🔐 **Admin Authentication** - Sign in with Google (must be added as admin)
- 👥 **User Management** - View all users, update tiers, reset usage, delete users
- ⚙️ **Admin Settings** - Add/remove admin emails
- 📊 **Analytics** - View usage statistics and tier distribution

## Running Locally

```bash
# Install dependencies
npm install

# Run development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Setup

### 1. Firebase Configuration

Make sure your `.env.local` has the correct Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Add Admin Email

Before you can access the admin panel, your Google account email must be added as an admin:

1. Go to the main chatbot app at http://localhost:3000
2. Navigate to `/setup-admin` OR
3. Manually add your email to Firestore:
   - Collection: `config`
   - Document: `admin`
   - Field: `adminEmails` (array)
   - Add your email to the array

### 3. Sign In

1. Open http://localhost:3001
2. Click "Sign in with Google"
3. If your email is registered as admin, you'll get access

## User Tiers

| Tier | Daily Limit | Description |
|------|-------------|-------------|
| Free | 10,000 tokens | Default tier for new users |
| Premium | 100,000 tokens | Upgraded tier |
| Admin | Unlimited (∞) | Full access for admins |

## Admin Actions

### Update User Tier
- Select a user from the table
- Use the dropdown to change their tier
- Changes apply immediately

### Reset User Usage
- Click the refresh icon next to a user
- This resets their daily token counter to 0

### Delete User
- Click the trash icon
- This removes the user and all their data permanently

### Add Admin
- Go to Settings tab
- Enter admin email and click "Add Admin"
- The email will receive admin access immediately

## Ports

- **Main Chatbot App**: http://localhost:3000
- **Admin Panel**: http://localhost:3001

## Tech Stack

- Next.js 14.1.0 (App Router)
- React 18.2.0
- TypeScript
- Tailwind CSS
- Framer Motion
- Firebase (Auth + Firestore)
