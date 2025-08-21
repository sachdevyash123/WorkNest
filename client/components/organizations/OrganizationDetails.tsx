'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  Mail,
  Globe,
  Users,
  Edit,
  Trash2,
  UserPlus,
  ExternalLink,
  Shield,
  Settings,
  Phone,
  MapPin,
  Briefcase,
  User,
  Send
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
import EditOrganizationModal from './EditOrganizationModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import InviteMemberModal from '../invite/InviteMemberForm';
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

export default function OrganizationDetailClient({ organization, members }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isEditBusinessOpen, setIsEditBusinessOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" })
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

   // Delete organization states
  const [isDeleteOrgDialogOpen, setIsDeleteOrgDialogOpen] = useState(false);
  const [isDeletingOrganization, setIsDeletingOrganization] = useState(false);

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
        .filter(member => member && member.user && member.user._id) // Filter out null/invalid members
        .map(member =>
          member.user._id === updatedUser._id
            ? {
                ...member,
                user: updatedUser,
                isActive: updatedUser.isActive, // Also update member's isActive status
                role: updatedUser.role // Update member role if it changed
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

      // Success - remove user from local state
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
    // Validation
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim() || !newUser.role.trim()) {
      toast.error('All fields are required');
      return;
    }
  
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
  
    // Password validation (minimum 6 characters)
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
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
          organizationId: organization._id, // Pass the current organization ID
          isActive: true
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Handle different types of errors
        if (response.status === 403) {
          toast.error('You are not authorized to create users');
        } else if (response.status === 400) {
          if (data.errors && Array.isArray(data.errors)) {
            // Handle validation errors
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

       // Success - Create new member object for local state update
       const newMember: Member = {
        _id: data.data._id, // Use the user ID as member ID temporarily
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

      // Add the new member to local state immediately
      setLocalMembers(prevMembers => [...prevMembers, newMember]);
  
      // Success
      toast.success('User created successfully');
      
      // Close the modal
      setIsAddUserOpen(false);
      
      // Reset form
      setNewUser({
        name: '',
        email: '',
        role: 'employee',
        password: ''
      });
  
      // Refresh the page or update the members list
      // Option 1: Refresh the entire page
      router.refresh();
      
      // Option 2: If you have a function to refetch organization data, call it here
      // refetchOrganizationData();
  
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
  };

  const handleCancelAddUser = () => {
    setIsAddUserOpen(false);
    // Reset form
    setNewUser({
      name: '',
      email: '',
      role: 'employee',
      password: ''
    });
  };

    // // New handler for invite success
    // const handleInviteSuccess = () => {
    //   toast.success('Invitation sent successfully');
    //   setIsInviteMemberOpen(false);
    //   // Optionally refresh pending invites here
    // };

  const handleDeleteOrganization=async()=>{
    setIsDeletingOrganization(true);

    try {
      const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organization._id}`,{
        method:'DELETE',
        headers:{
          'Content-Type':'application/json',
        },
        credentials:'include'
      })
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete organization');
      }

      // Success - show toast and redirect
      toast.success('Organization deleted successfully');
      
      // Close the dialog
      setIsDeleteOrgDialogOpen(false);
      
      // Redirect to organizations list
      router.push('/organizations');
    } catch (error) {
      console.error('Error deleting organization:',error);
      toast.error('Failed to delete organization')
    }
    finally{
      setIsDeletingOrganization(false);
    }
  }

  const getLogoUrl = (logoPath: string) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
    return `${baseUrl}/${logoPath}`;
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/organizations')}
                className="mb-4"
              >
                ← Back to Organizations
              </Button>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setIsEditBusinessOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" className='cursor-pointer' onClick={()=>setIsDeleteOrgDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">Business Information</h1>
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
                <h3 className="text-xl font-semibold">Users</h3>
                <p className="text-gray-600 text-sm">Manage organization members and their roles</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setIsInviteMemberOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
                <Button
                  className="bg-gray-900 hover:bg-gray-800 cursor-pointer"
                  onClick={() => setIsAddUserOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUserClick(member.user)}
                              className='cursor-pointer'
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
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
            console.log("Update Data", data)
          }}
        />

        <EditUserModal
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          user={selectedUser}
          onUserUpdate={handleUserUpdate}
        />

        {/* Add User Modal */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Create a new user for this business.
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
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
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
              <Button onClick={handleAddUser}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete Organization Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteOrgDialogOpen}
          onClose={() => setIsDeleteOrgDialogOpen(false)}
          onConfirm={handleDeleteOrganization}
          title="Are you sure you want to delete this organization?"
          description="This action will permanently delete the organization"
          itemName={organization.name}
          isLoading={isDeletingOrganization}
          confirmText="Yes, Delete Organization"
          warningMessage="This action cannot be undone. All members, data, and settings will be lost permanently."
        />
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
         onClose={()=>setIsInviteMemberOpen(false)}
         organizationId={organization._id}
         organizationName={organization.name}
         />
      </div>
    </div>
  );
}