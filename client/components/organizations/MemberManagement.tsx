'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Member {
    user: {
        _id: string;
        fullName: string;
        email: string;
        role: string;
    };
    role: string;
    joinedAt: string;
}

interface Owner {
    _id: string;
    fullName: string;
    email: string;
    role: string;
}

interface MemberManagementProps {
    organizationId: string;
    canManageMembers: boolean;
}

export default function MemberManagement({ organizationId, canManageMembers }: MemberManagementProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [owner, setOwner] = useState<Owner | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
    }, [organizationId]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            // const response = await organizationAPI.getMembers(organizationId);
            // setOwner(response.data.owner);
            // setMembers(response.data.members);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch members');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        try {
            setUpdatingRole(userId);
            // await organizationAPI.updateMemberRole(organizationId, userId, newRole);
            toast.success('Member role updated successfully');
            fetchMembers(); // Refresh the list
        } catch (error: any) {
            toast.error(error.message || 'Failed to update member role');
        } finally {
            setUpdatingRole(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'hr':
                return 'bg-blue-100 text-blue-800';
            case 'employee':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Organization Members</h3>
                {canManageMembers && (
                    <Button
                        onClick={() => window.location.href = `/organizations/${organizationId}/invite`}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Invite Member
                    </Button>
                )}
            </div>

            {/* Owner Section */}
            {owner && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Organization Owner</h4>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {owner.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{owner.fullName}</p>
                                <p className="text-sm text-gray-500">{owner.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                Owner
                            </span>
                            <span className="text-sm text-gray-500">
                                {/* Joined: {new Date(owner.createdAt || Date.now()).toLocaleDateString()} */}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Section */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-md font-medium text-gray-900">
                        Members ({members.length})
                    </h4>
                </div>
                {members.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">No members yet.</p>
                        {canManageMembers && (
                            <Button
                                onClick={() => window.location.href = `/organizations/${organizationId}/invite`}
                                className="mt-2 bg-blue-600 hover:bg-blue-700"
                            >
                                Invite Your First Member
                            </Button>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {members.map((member) => (
                            <li key={member.user._id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {member.user.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {member.user.fullName}
                                            </p>
                                            <p className="text-sm text-gray-500">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                        </span>
                                        {canManageMembers && (
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleUpdate(member.user._id, e.target.value)}
                                                    disabled={updatingRole === member.user._id}
                                                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="employee">Employee</option>
                                                    <option value="hr">HR</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                {updatingRole === member.user._id && (
                                                    <span className="text-xs text-gray-500">Updating...</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

