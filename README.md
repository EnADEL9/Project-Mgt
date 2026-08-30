# Project Management Platform

A full-stack project management platform built to manage team workflows, workspaces, and task tracking with real-time event-driven data synchronization.

## Features

- User Authentication & Management: Secure multi-tenant authentication powered by Clerk.
- Workspaces & Multi-Tenancy: Create, switch, and manage workspaces with role-based member permissions.
- Event-Driven Background Sync: Seamless database synchronization using Inngest serverless event queues for Clerk webhooks.
- Task Management: Create, update, and track project tasks with dynamic status handling.
- Email Notifications: Automated team invitation and notification system using Nodemailer and Brevo SMTP.
- Responsive UI: Built with React, Tailwind CSS, Redux Toolkit, and Lucide React icons.

## Tech Stack

- Frontend: React.js, Vite, Tailwind CSS, Redux Toolkit, Clerk React SDK
- Backend: Node.js, Express.js
- Database & ORM: PostgreSQL (Neon Serverless), Prisma ORM
- Background Queue: Inngest
- Authentication: Clerk
- Email Service: Brevo SMTP / Nodemailer
- Deployment: Vercel

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=development
INNGEST_DEV=1

# Clerk API Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Neon PostgreSQL Database
DATABASE_URL="postgresql://<user>:<password>@<neon-pooled-host>/neondb?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<neon-direct-host>/neondb?sslmode=require"

# Inngest Keys (Needed for production)
# INNGEST_EVENT_KEY=...
# INNGEST_SIGNING_KEY=...

# Email / SMTP (Brevo)
SENDER_EMAIL=your-email@example.com
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

Frontend (client/.env)

VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BACKEND_URL=http://localhost:5000

## Getting Started

1. Installation
Install server dependencies:

cd server
npm install

Install client dependencies:

Bash
cd ../client
npm install

2. Database Migration
Bash
cd ../server
npx prisma generate
npx prisma db push
3. Running Locally
Run each command in a separate terminal:

Terminal 1 - Backend Server:

Bash
cd server
npm run dev

Terminal 2 - Inngest Dev Server:

Bash
npx inngest-cli@latest dev -u http://localhost:5000/api/inngest
Terminal 3 - Frontend:

Bash
cd client
npm run dev

## Production Deployment

- Push code to your GitHub repository.

- Deploy both client and server to Vercel.

- Configure all environment variables in Vercel project settings.

- Set up your production Inngest app sync using your deployed URL (https://your-domain.vercel.app/api/inngest).

- Configure Clerk webhooks in the Clerk Dashboard to point to your live Inngest endpoint.