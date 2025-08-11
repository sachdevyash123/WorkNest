# WorkNest Setup Guide

## Environment Configuration

### Backend (.env file in server directory)

Create a `.env` file in the `server` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/worknest

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
RESET_TOKEN_EXPIRES_IN=15m

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=your-verified-sender@yourdomain.com

# Cookie Configuration
COOKIE_SECRET=your-cookie-secret-key-change-this-in-production

# Frontend URL (for password reset links)
CLIENT_URL=http://localhost:3000
```

### Frontend (.env.local file in client directory)

Create a `.env.local` file in the `client` directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## SendGrid Setup

1. Create a [SendGrid account](https://sendgrid.com/)
2. Get your API key from Settings > API Keys
3. Verify your sender email address in Settings > Sender Authentication
4. Add your API key and verified email to the backend `.env` file

## Quick Start Commands

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (in a new terminal)
cd client
npm install
npm run dev
```

## Creating a Superadmin

After registering a user, you can promote them to superadmin using MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@worknest.com" },
  { $set: { role: "superadmin" } }
)
```

## Access URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health
