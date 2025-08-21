'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  Mail,
  Globe,
  Users,
  Edit,
  UserPlus,
  ExternalLink,
  Shield,
  Settings,
  Phone,
  MapPin,
  Briefcase,
  User,
  Send,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import EditOrganizationModal from '../organizations/EditOrganizationModal';
import EditUserModal from '../organizations/EditUserModal';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import InviteMemberModal from '../invite/InviteMemberForm';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Member {
  _id: string;
  user: User;
  role: string;
  joinedAt: string;
  isActive: boolean;
}

interface Organization {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  size?: number;
  status?: 'active' | 'inactive';
  logo?: string;
  owner: {
    _id: string;
    fullName: string;
    email: string;
  };
  members: Member[];
  memberCount: number;
  createdAt: string;
}

interface Props {
  organization: Organization;
  members?: {
    owner: {
      _id: string;
      fullName: string;
      email: string;
      role: string;
    };
    members: Member[];
  };
}

export default function OrganizationSettingsClient({ organization, members }: Props) {
  const router = useRouter();
  const { user, isAdmin, isHR, isEmployee } = useAuth();
  const [search, setSearch] = useState('');
  const [isEditBusinessOpen, setIsEditBusinessOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" })
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete user states
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Local state for members to enable real-time updates
  const [localMembers, setLocalMembers] = useState<Member[]>(
    (members?.members || []).filter(member => member && member.user && member.user._id)
  );

  const filteredMembers = localMembers.filter((member) =>
    member && 
    member.user && 
    member.user._id &&
    (
      member.user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(search.toLowerCase()) ||
      member.user.role?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'superadmin':
        return 'default';
      case 'hr':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: boolean) => {
    return status === true ? 'default' : 'destructive';
  };
  
  const getStatusBadgeVariantOrganization = (status: string) => {
    return status.toLowerCase() === 'active' ? 'default' : 'destructive';
  }
  
  const getStatusValueFromBoolean = (status: boolean) => {
    if (status === true) {
      return 'Active'
    }
    else {
      return 'Inactive'
    }
  }

  // Handler to update user after successful edit
  const handleUserUpdate = (updatedUser: User) => {
    setLocalMembers(prevMembers =>
      prevMembers
        .filter(member => member && member.user && member.user._id)
        .map(member =>
          member.user._id === updatedUser._id
            ? {
                ...member,
                user: updatedUser,
                isActive: updatedUser.isActive,
                role: updatedUser.role
              }
            : member
        )
    );
    router.refresh();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteUserDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 403) {
          toast.error('You are not authorized to delete this user');
        } else if (response.status === 404) {
          toast.error('User not found');
        } else {
          toast.error(errorData.message || 'Failed to delete user');
        }
        return;
      }

      setLocalMembers(prevMembers =>
        prevMembers.filter(member => member.user._id !== userToDelete._id)
      );

      toast.success('User deleted successfully');
      setIsDeleteUserDialogOpen(false);
      setUserToDelete(null);

    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim() || !newUser.role.trim()) {
      toast.error('All fields are required');
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
  
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
     // Check role permissions for HR users
     if (isHR() && !isAdmin() && !['employee', 'hr'].includes(newUser.role)) {
      toast.error('HR users can only create Employee and HR roles');
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          organizationId: organization._id,
          isActive: true
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('You are not authorized to create users');
        } else if (response.status === 400) {
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((error: string) => toast.error(error));
          } else {
            toast.error(data.message || 'Failed to create user');
          }
        } else if (response.status === 404) {
          toast.error('Organization not found');
        } else {
          toast.error(data.message || 'Failed to create user');
        }
        return;
      }

      const newMember: Member = {
        _id: data.data._id,
        user: {
          _id: data.data._id,
          fullName: data.data.fullName,
          email: data.data.email,
          role: data.data.role,
          isActive: data.data.status,
          createdAt: data.data.createdAt
        },
        role: data.data.role,
        joinedAt: data.data.createdAt,
        isActive: data.data.isActive
      };

      setLocalMembers(prevMembers => [...prevMembers, newMember]);
  
      toast.success('User created successfully');
      setIsAddUserOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'employee',
        password: ''
      });
  
      router.refresh();
  
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
  };

  const handleCancelAddUser = () => {
    setIsAddUserOpen(false);
    setNewUser({
      name: '',
      email: '',
      role: 'employee',
      password: ''
    });
  };

  const getLogoUrl = (logoPath: string) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
    return `${baseUrl}/${logoPath}`;
  };

  // Check permissions for UI elements
  const canEditOrganization = isAdmin();
  const canManageUsers = isAdmin() || isHR();
  const isReadOnly = isHR() && !isAdmin();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="mb-4 cursor-pointer"
              >
                ← Back to Dashboard
              </Button>
            </div>
            {canEditOrganization && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => setIsEditBusinessOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Organization
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {canEditOrganization ? 'Organization Settings' : 'Organization Information'}
            </h1>
            <p className="text-gray-600">
              {canEditOrganization 
                ? 'Manage your organization details and members' 
                : 'View your organization information and team members'
              }
            </p>
          </div>
        </div>

        {/* Business Information Cards - Three Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Section 1: Logo, Organization Name, Description, Organization Email */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold">Organization Details</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                  {organization.logo ? (
                    <img
                      src={getLogoUrl(organization.logo) || ""}
                      alt="Logo"
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Organization Name</span>
                  </div>
                  <p className="font-semibold text-gray-900">{organization.name}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Description</span>
                </div>
                <p className="text-gray-900 text-sm">{organization.description || 'No description provided'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Organization Email</span>
                </div>
                <p className="text-gray-900">{organization.email || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Phone, Address, Website */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                </div>
                <p className="text-gray-900">{organization.phone || 'Not provided'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Address</span>
                </div>
                <p className="text-gray-900">{organization.address || 'Not provided'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Website</span>
                </div>
                {organization.website ? (
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">{organization.website}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(organization.website, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-900">Not provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Industry, Size, Status */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Industry</span>
                </div>
                <Badge variant="secondary" className="bg-gray-100">
                  {organization.industry || 'Not specified'}
                </Badge>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Company Size</span>
                </div>
                <p className="text-gray-900">{organization.size ? `${organization.size} employees` : 'Not specified'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Status</span>
                </div>
                <Badge variant={getStatusBadgeVariantOrganization(organization.status || 'active')}>
                  {(organization.status || 'active').charAt(0).toUpperCase() + (organization.status || 'active').slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section with Shadcn Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Team Members</h3>
                <p className="text-gray-600 text-sm">
                  {canManageUsers 
                    ? 'Manage organization members and their roles' 
                    : 'View your team members'
                  }
                </p>
              </div>
              {canManageUsers && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setIsInviteMemberOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                  {(isAdmin() || isHR()) && (
                    <Button
                      className="bg-gray-900 hover:bg-gray-800 cursor-pointer"
                      onClick={() => setIsAddUserOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="p-6 pt-0">
            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Search users by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Table Controls */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                {filteredMembers.length} of {localMembers.length} row(s) displayed.
              </p>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                View Columns
              </Button>
            </div>

            {/* Users Table using Shadcn UI */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined At</TableHead>
                    {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell className="font-medium">
                          {member.user.fullName}
                        </TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.user.role)}>
                            {member.user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(member.isActive)}>
                            {getStatusValueFromBoolean(member.isActive)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(member.joinedAt)}</TableCell>
                        {canManageUsers && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(member.user)}
                                className='cursor-pointer'
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {(isAdmin() || (isHR() && !['admin', 'superadmin'].includes(member.user.role))) && 
                               member.user._id !== user?._id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUserClick(member.user)}
                                  className='cursor-pointer'
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={canManageUsers ? 6 : 5} className="h-24 text-center">
                        {search ? `No users found matching "${search}"` : 'No users found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Modals */}
        <EditOrganizationModal
          isOpen={isEditBusinessOpen}
          onClose={() => setIsEditBusinessOpen(false)}
          organization={organization}
          onSave={(data) => {
            router.refresh();
          }}
          isSettings={true}
        />

        <EditUserModal
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          user={selectedUser}
          onUserUpdate={handleUserUpdate}
        />

        {/* Add User Modal */}
        {isAdmin() || isHR() && (
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>
                  Create a new user for your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter user's name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter user's email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value='employee'>Employee</SelectItem>
                      {isHR() && <SelectItem value="hr">HR</SelectItem>}
                      {isAdmin() && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCancelAddUser}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className='cursor-pointer'>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete User Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteUserDialogOpen}
          onClose={() => {
            setIsDeleteUserDialogOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteUser}
          title="Are you sure you want to delete this user?"
          description="This action will permanently remove the user"
          itemName={userToDelete?.fullName}
          isLoading={isDeletingUser}
          confirmText="Yes, Delete User"
          warningMessage="This action cannot be undone. The user will lose access to the organization immediately."
        />

        {/* Invite Member Modal */}
        <InviteMemberModal
          isOpen={isInviteMemberOpen}
          onClose={() => setIsInviteMemberOpen(false)}
          organizationId={organization._id}
          organizationName={organization.name}
          isSettings={true}
        />
      </div>
    </div>
  );
}