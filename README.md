# WorkNest - Complete MERN Stack Authentication System

A full-featured authentication system built with the MERN stack, featuring JWT-based authentication, role-based access control, and password reset functionality.

## 🚀 Features

### Authentication
- ✅ User registration with email validation
- ✅ Secure login with JWT tokens (HTTP-only cookies)
- ✅ Password reset via email (15-minute expiry)
- ✅ Automatic logout on token expiration
- ✅ Protected routes with middleware

### Role-Based Access Control
- ✅ **Superadmin**: Full system control
- ✅ **Admin**: User management and role updates
- ✅ **HR**: HR-related operations
- ✅ **Employee**: Basic access (default role)

### Security Features
- ✅ Password hashing with bcrypt
- ✅ JWT tokens with expiration
- ✅ HTTP-only cookies for token storage
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ Rate limiting ready

### User Experience
- ✅ Modern, responsive UI with TailwindCSS
- ✅ Form validation with React Hook Form
- ✅ Toast notifications with React Hot Toast
- ✅ Loading states and error handling
- ✅ Clean, intuitive design

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **SendGrid** for email functionality
- **Cookie-parser** for cookie handling

### Frontend
- **Next.js 14** with App Router
- **React 19** with TypeScript
- **TailwindCSS** for styling
- **React Hook Form** for form management
- **Axios** for API calls
- **React Hot Toast** for notifications

## 📁 Project Structure

```
WorkNest/
├── client/                 # Next.js Frontend
│   ├── app/               # App Router pages
│   │   ├── login/         # Login page
│   │   ├── signup/        # Registration page
│   │   ├── dashboard/     # Protected dashboard
│   │   ├── forgot-password/ # Password reset request
│   │   └── reset-password/[token]/ # Password reset
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities and hooks
│   │   ├── api.js        # API configuration
│   │   └── hooks/        # Custom hooks
│   └── middleware.ts     # Route protection
├── server/                # Express Backend
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Authentication middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WorkNest
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit the `.env` file with your configuration:

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

# Email Configuration (Ethereal for development)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your-ethereal-email@ethereal.email
EMAIL_PASS=your-ethereal-password
EMAIL_FROM=noreply@worknest.com

# Cookie Configuration
COOKIE_SECRET=your-cookie-secret-key-change-this-in-production
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

### 4. Start the Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 📧 Email Setup

For development, we use Ethereal Email (fake SMTP service):

1. Go to [Ethereal Email](https://ethereal.email/)
2. Create a new account
3. Copy the provided SMTP settings to your `.env` file
4. Check the console logs for email preview URLs

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password/:token` - Reset password

### User Management (Admin/Superadmin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PATCH /api/users/:id/role` - Update user role
- `PATCH /api/users/:id/status` - Update user status
- `DELETE /api/users/:id` - Delete user (Superadmin only)

## 👥 Role Hierarchy

1. **Superadmin** - Full system control
   - Can manage all users
   - Can promote users to any role
   - Can delete users
   - Can modify system settings

2. **Admin** - User management
   - Can view all users
   - Can promote users to admin, HR, or employee
   - Cannot promote to superadmin
   - Cannot modify superadmin accounts

3. **HR** - HR operations
   - Can view employee information
   - Limited user management capabilities

4. **Employee** - Basic access
   - Can view own profile
   - Basic dashboard access

## 🔧 Creating a Superadmin

To create the first superadmin account, you can either:

1. **Manually in MongoDB:**
```javascript
db.users.updateOne(
  { email: "admin@worknest.com" },
  { $set: { role: "superadmin" } }
)
```

2. **Using the API after registration:**
```bash
curl -X PATCH http://localhost:5000/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"role": "superadmin"}'
```

## 🛡️ Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **Token Security**: JWT with expiration and HTTP-only cookies
- **Input Validation**: Comprehensive form validation
- **CORS**: Configured for production and development
- **Rate Limiting**: Ready to implement with express-rate-limit
- **Helmet**: Ready to implement for security headers

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables for production
2. Use a production MongoDB instance
3. Configure a real SMTP service (SendGrid, AWS SES, etc.)
4. Set up proper CORS origins
5. Use PM2 or similar for process management

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Set environment variables in your hosting platform
4. Configure custom domain if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console logs for error messages
2. Verify your environment variables
3. Ensure MongoDB is running
4. Check the API endpoints with a tool like Postman

## 🔄 Future Enhancements

- [ ] Email verification on registration
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub)
- [ ] User profile management
- [ ] Activity logging
- [ ] Advanced role permissions
- [ ] API rate limiting
- [ ] File upload functionality
- [ ] Real-time notifications
- [ ] Dark mode support

---

**Happy Coding! 🎉**
