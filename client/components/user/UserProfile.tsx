'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface UserProfileData {
    fullName: string;
    email: string;
    role: string;
    organization?: {
        _id: string;
        name: string;
        description?: string;
    };
}

interface ProfileFormData {
    fullName: string;
}

export default function UserProfile() {
    const { user: authUser, updateUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<ProfileFormData>();

    // Debug: Check if we have user data from localStorage or auth context
    useEffect(() => {
        const userFromStorage = localStorage.getItem('user');
        const tokenFromStorage = localStorage.getItem('token');
        // Use auth context as primary source, localStorage as fallback
        if (authUser) {
            setProfile(authUser);
            setValue('fullName', authUser.fullName);
        } else if (userFromStorage) {
            try {
                const parsedUser = JSON.parse(userFromStorage);
                setProfile(parsedUser);
                setValue('fullName', parsedUser.fullName);
            } catch (e) {
                console.error('Error parsing user from localStorage:', e);
            }
        }
    }, [setValue, authUser]);

    // Update profile display when authUser changes
    useEffect(() => {
        if (authUser) {
            setProfile(authUser);
            setValue('fullName', authUser.fullName);
        }
    }, [authUser, setValue]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);

            // First, let's check if we have authentication
            const token = localStorage.getItem('token');

            const response = await userAPI.getProfile();

            const fetchedUser = response?.data?.data?.user;
            if (fetchedUser) {
                setProfile(fetchedUser);
                setValue('fullName', fetchedUser.fullName);
            } else {
                console.error('No user data in response:', response);
                toast.error('No user data received');
            }
        } catch (error: any) {
            console.error('Profile fetch error:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);

            if (error.response?.status === 401) {
                toast.error('Please login again');
                // Redirect to login
                window.location.href = '/login';
            } else {
                toast.error(error.response?.data?.message || error.message || 'Failed to fetch profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: ProfileFormData) => {
        try {
            setIsUpdating(true);

            // Use client-side API call with enhanced revalidation
            const response = await userAPI.updateProfile(data);

            const updatedUser = response?.data?.data?.user;
            if (updatedUser) {
                toast.success('Profile updated successfully');
                setIsEditing(false);

                // Update local profile state immediately
                setProfile(updatedUser);
                setValue('fullName', updatedUser.fullName);

                // Update auth context with new user data
                updateUser(updatedUser);

                // Refresh the router to update UI instantly
                router.refresh();

                // Force re-render of components that depend on user data
                setTimeout(() => {
                    router.refresh();
                }, 100);
            } else {
                console.error('No user data in response:', response);
                toast.error('Failed to update profile');
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading && !profile && !authUser) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Use authUser as fallback if profile is not available
    const displayProfile = profile || authUser;

    if (!displayProfile) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Profile not found</p>
                <p className="text-sm text-gray-400 mt-2">Please try refreshing the page or logging in again.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
                </div>

                <div className="px-6 py-4 space-y-6">
                    {/* Profile Information */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={displayProfile.email}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    {...register('fullName', {
                                        required: 'Full name is required',
                                        minLength: {
                                            value: 2,
                                            message: 'Full name must be at least 2 characters'
                                        }
                                    })}
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="mt-1 text-sm text-gray-900">{displayProfile.fullName}</p>
                            )}
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">{displayProfile.role}</p>
                        </div>

                        {/* Organization */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Organization
                            </label>
                            {displayProfile.organization ? (
                                <div className="mt-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {displayProfile.organization.name}
                                    </p>
                                    {displayProfile.organization.description && (
                                        <p className="text-sm text-gray-500">
                                            {displayProfile.organization.description}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-1">
                                    <p className="text-sm text-gray-500">No organization assigned</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        You can join an organization through an invitation or contact your administrator.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        {isEditing ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isUpdating}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isUpdating ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Organization Information */}
            {!displayProfile.organization && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Join an Organization</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>You're not currently part of any organization. You can:</p>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    <li>Wait for an invitation from an organization admin</li>
                                    <li>Contact your administrator to be added to an organization</li>
                                    <li>Create a new organization if you have superadmin privileges</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
