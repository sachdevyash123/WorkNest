'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import toast from 'react-hot-toast';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  isSettings?:boolean;
}

export default function InviteMemberModal({ 
  isOpen, 
  onClose, 
  organizationId, 
  organizationName,
  isSettings=false
}: InviteMemberModalProps) {
  const [inviteData, setInviteData] = useState({ email: "", role: "employee" });
  const [isInviting, setIsInviting] = useState(false);
  // Helper function to get the appropriate API endpoint
  const getApiEndpoint = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    if (isSettings) {
      // For invite member for their organization
      return `${baseUrl}/organization-settings/invite`;
    } else {
      // For invite member through superadmin
      return `${baseUrl}/organizations/${organizationId}/invite`;
    }
  };
  const handleInviteMember = async () => {
    // Validation
    if (!inviteData.email.trim() || !inviteData.role.trim()) {
      toast.error('All fields are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsInviting(true);

    try {
      const apiEndpoint=getApiEndpoint();
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteData.email,
          role: inviteData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different types of errors
        if (response.status === 403) {
          toast.error('You are not authorized to invite members');
        } else if (response.status === 400) {
          toast.error(data.message || 'Invalid invitation data');
        } else if (response.status === 409) {
          toast.error('User is already a member of this organization');
        } else if (response.status === 404) {
          if (data.message?.includes('User not found')) {
            toast.error('No user found with this email address');
          } else {
            toast.error('Organization not found');
          }
        } else {
          toast.error(data.message || 'Failed to send invitation');
        }
        return;
      }

      // Success
      toast.success(`Invitation sent successfully to ${inviteData.email}`);

      // Close the modal and reset form
      handleClose();

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setInviteData({
      email: '',
      role: 'employee'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Invite Member</span>
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join <strong>{organizationName}</strong>. 
            The user will receive an email with instructions to join the organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="Enter email address"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              disabled={isInviting}
            />
            <p className="text-xs text-gray-500">
              The user must have an existing account to receive the invitation.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select 
              value={inviteData.role} 
              onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
              disabled={isInviting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">
                  <div className="flex flex-col">
                    <span>Employee</span>
                    <span className="text-xs text-gray-500">Standard access to organization features</span>
                  </div>
                </SelectItem>
                <SelectItem value="hr">
                  <div className="flex flex-col">
                    <span>HR</span>
                    <span className="text-xs text-gray-500">Human resources management access</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span>Admin</span>
                    <span className="text-xs text-gray-500">Full administrative access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isInviting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleInviteMember}
            disabled={isInviting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isInviting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}