# WorkNest Organization Management Module

## Overview

The Organization Management module provides a comprehensive solution for managing multi-tenant organizations within the WorkNest HR SaaS platform. It includes organization creation, member management, role-based access control, and an invitation system.

## Features

### 🏢 Organization Management
- **Create Organizations**: Superadmins can create new organizations and assign owners
- **Organization Details**: View and edit organization information (name, description)
- **Delete Organizations**: Superadmins can delete organizations (with cleanup)
- **Multi-tenant Architecture**: Each user belongs to exactly one organization (except superadmin)

### 👥 Member Management
- **Member Roles**: employee, hr, admin, superadmin
- **Role Updates**: Admins can promote/demote members between roles
- **Member Listing**: View all organization members with their roles and join dates
- **Owner Management**: Organization owners have full administrative privileges

### 📧 Invitation System
- **Email Invitations**: Send secure invitations to join organizations
- **Role Assignment**: Assign specific roles during invitation
- **Token-based Security**: Secure invitation links with 7-day expiry
- **Invite Acceptance**: Streamlined signup process for invited users

### 🔐 Access Control
- **Role-based Permissions**: Different actions available based on user role
- **Organization Isolation**: Users can only access their own organization
- **Superadmin Override**: Superadmins can access and manage all organizations

## Technical Architecture

### Backend Structure

```
server/
├── models/
│   ├── Organization.js      # Organization data model
│   ├── Invite.js           # Invitation system model
│   └── User.js             # Updated user model with organization field
├── controllers/
│   ├── organizationController.js  # Organization CRUD operations
│   └── inviteController.js        # Invitation management
├── routes/
│   ├── organizations.js    # Organization API endpoints
│   └── invites.js          # Invitation API endpoints
├── middlewares/
│   └── auth.js             # Authentication and authorization
└── utils/
    └── email.js            # Email templates and sending
```

### Frontend Structure

```
client/
├── app/
│   └── organizations/
│       ├── page.tsx                    # Organizations list (superadmin)
│       ├── create/
│       │   └── page.tsx               # Create organization form
│       └── [id]/
│           ├── page.tsx               # Organization detail view
│           ├── settings/
│           │   └── page.tsx           # Edit organization
│           └── invite/
│               └── page.tsx           # Invite new members
├── components/
│   └── organizations/
│       ├── OrganizationList.tsx       # Organizations listing component
│       ├── OrganizationForm.tsx       # Create/edit organization form
│       ├── MemberManagement.tsx       # Member management interface
│       └── InviteForm.tsx            # Invitation form
├── lib/
│   └── api/
│       └── organizations.js           # Organization API client
└── app/invite/[token]/
    └── page.tsx                       # Invite acceptance page
```

## API Endpoints

### Organizations

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| `POST` | `/api/organizations` | Superadmin | Create new organization |
| `GET` | `/api/organizations` | Superadmin | List all organizations |
| `GET` | `/api/organizations/:id` | Members | Get organization details |
| `PATCH` | `/api/organizations/:id` | Admin/Superadmin | Update organization |
| `DELETE` | `/api/organizations/:id` | Superadmin | Delete organization |
| `GET` | `/api/organizations/:id/members` | Members | Get organization members |
| `PATCH` | `/api/organizations/:id/member/:userId/role` | Admin/Superadmin | Update member role |
| `POST` | `/api/organizations/:id/invite` | Admin/Superadmin | Invite new member |
| `GET` | `/api/organizations/:id/invites` | Admin/Superadmin | Get pending invites |

### Invitations

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| `GET` | `/api/invites/validate/:token` | Public | Validate invitation token |
| `POST` | `/api/invites/accept/:token` | Public | Accept invitation and create account |
| `GET` | `/api/invites/organization/:organizationId` | Admin/Superadmin | Get organization invites |
| `DELETE` | `/api/invites/:inviteId` | Admin/Superadmin | Cancel invitation |

## Database Models

### Organization Schema

```javascript
{
  name: String,           // Required, max 100 chars
  description: String,    // Optional, max 500 chars
  owner: ObjectId,        // Reference to User (required)
  members: [{             // Array of organization members
    user: ObjectId,       // Reference to User
    role: String,         // 'employee', 'hr', or 'admin'
    joinedAt: Date        // When member joined
  }],
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

### Invite Schema

```javascript
{
  email: String,          // Invitee's email
  organization: ObjectId, // Reference to Organization
  role: String,           // Assigned role
  invitedBy: ObjectId,    // Reference to User (inviter)
  token: String,          // Unique invitation token
  expiresAt: Date,        // 7-day expiry
  isAccepted: Boolean,    // Whether invite was accepted
  acceptedAt: Date,       // When invite was accepted
  acceptedBy: ObjectId    // Reference to User who accepted
}
```

### Updated User Schema

```javascript
{
  // ... existing fields ...
  organization: ObjectId, // Reference to Organization (nullable for superadmin)
  role: String,           // 'employee', 'hr', 'admin', or 'superadmin'
  // ... existing fields ...
}
```

## User Roles & Permissions

### Superadmin
- Create, read, update, delete any organization
- Access all organizations and their data
- Manage all users across organizations
- Cannot be assigned to an organization

### Organization Admin
- Update organization details (name, description)
- Invite new members with specific roles
- Update member roles (promote/demote)
- View all organization members
- Cannot change owner role

### HR
- View organization members
- Cannot change member roles
- Cannot invite new members
- Cannot update organization details

### Employee
- View organization information
- View organization members
- Cannot perform administrative actions

## Invitation Flow

1. **Admin sends invitation** via the invite form
2. **System generates secure token** and sends email
3. **Invitee receives email** with invitation link
4. **Invitee clicks link** and is taken to acceptance page
5. **System validates token** and shows organization details
6. **Invitee creates account** with pre-filled organization and role
7. **Account is created** and user is added to organization
8. **Invitation is marked as accepted**

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions based on user role
- **Organization Isolation**: Users can only access their own organization
- **Secure Invitation Tokens**: Cryptographically secure random tokens
- **Token Expiry**: Invitations expire after 7 days
- **Email Validation**: Invitations are tied to specific email addresses

## Email Templates

The system includes professionally designed email templates for:
- **Organization Invitations**: Welcome users to join organizations
- **Password Reset**: Secure password recovery
- **Welcome Emails**: New user onboarding

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- SendGrid API key for email functionality

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/worknest

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
CLIENT_URL=http://localhost:3000

# Server
PORT=5000
NODE_ENV=development
```

### Installation

1. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Start the backend**
   ```bash
   cd server && npm start
   ```

3. **Start the frontend**
   ```bash
   cd client && npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Testing the Module

### Create a Superadmin User

1. Register a new user through the signup form
2. Manually update the user's role to 'superadmin' in the database
3. Login with superadmin credentials

### Create an Organization

1. Navigate to `/organizations` (superadmin only)
2. Click "Create Organization"
3. Fill in organization details and owner email
4. Submit the form

### Invite Members

1. Go to organization detail page
2. Click "Invite Member"
3. Enter email and select role
4. Send invitation

### Accept Invitation

1. Check email for invitation link
2. Click the invitation link
3. Create account with organization details pre-filled
4. Login and access organization

## Future Enhancements

- **Bulk Invitations**: Send multiple invitations at once
- **Invitation Templates**: Customizable invitation emails
- **Advanced Permissions**: More granular role-based permissions
- **Organization Hierarchies**: Support for parent-child organizations
- **Audit Logging**: Track all organization changes
- **API Rate Limiting**: Protect against abuse
- **Webhook Support**: Notify external systems of changes

## Troubleshooting

### Common Issues

1. **Invitation emails not sending**
   - Check SendGrid API key configuration
   - Verify FROM_EMAIL is verified in SendGrid

2. **Organization creation fails**
   - Ensure owner email exists in the system
   - Check MongoDB connection

3. **Permission denied errors**
   - Verify user role and organization membership
   - Check authentication middleware

4. **Invitation tokens not working**
   - Check token expiry (7 days)
   - Verify token format and uniqueness

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=worknest:*
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/organization-enhancement`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add organization feature'`
5. Push to the branch: `git push origin feature/organization-enhancement`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation and troubleshooting guide















