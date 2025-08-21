'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt:string
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function EditUserModal({ isOpen, onClose, user, onUserUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'employee',
    isActive:true,
    newPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const roles = ['employee', 'hr', 'admin'];

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || 'employee',
        isActive: user.isActive !== undefined ? user.isActive : true,
        newPassword: ''
      });
      setErrors({});
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the update data
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      };

      // Only include password if it's provided
      if (formData.newPassword.trim()) {
        updateData.password = formData.newPassword;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('You are not authorized to update this user');
        } else if (response.status === 400) {
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((error: string) => toast.error(error));
          } else {
            toast.error(data.message || 'Failed to update user');
          }
        } else if (response.status === 404) {
          toast.error('User not found');
        } else {
          toast.error(data.message || 'Failed to update user');
        }
        return;
      }

      toast.success('User updated successfully');
      
      // Call the callback function if provided
      if (onUserUpdate && data.data) {
        onUserUpdate(data.data);
      }

      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleStatusChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Leave password field empty to keep current password.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter full name"
              disabled={isLoading}
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <span className="text-sm text-red-500">{errors.fullName}</span>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-600">Email (Read-only)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              readOnly
              disabled
              className="bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200"
            />
            <span className="text-xs text-gray-500">
              Email cannot be modified for security reasons
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.isActive}
                onCheckedChange={handleStatusChange}
                disabled={isLoading}
              />
              <Label htmlFor="status" className="text-sm">
                {formData.isActive 
                ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password (Optional)</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter new password"
              disabled={isLoading}
              className={errors.newPassword ? 'border-red-500' : ''}
            />
            {errors.newPassword && (
              <span className="text-sm text-red-500">{errors.newPassword}</span>
            )}
            <span className="text-xs text-gray-500">
              Leave empty to keep current password
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className='cursor-pointer'
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className='cursor-pointer'
          >
            {isLoading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}