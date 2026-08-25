# Work Mail - Next.js Version

Modern email management application built with Next.js and Firebase.

## Features

- 🔐 Firebase Authentication
- 📧 Email management
- 👤 User profiles with picture upload
- 🎯 Role-based access control
- 🚀 Deployed on Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Update the values with your Firebase credentials.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add your `.env.local` variables
5. Deploy

## Pages

- `/` - Home (redirects to login/dashboard)
- `/login` - Login page
- `/dashboard` - Dashboard (protected)
