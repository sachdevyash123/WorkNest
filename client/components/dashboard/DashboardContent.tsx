'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function DashboardContent() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // Simple redirect when user is null
    useEffect(() => {
        if (!loading && !user) {
            window.location.href = '/login';
        }
    }, [user, loading]);

    const handleLogout = async () => {
        try {
            toast.success('Logging out...');
            await logout();
            // Immediate client-side redirect for snappy UX
            router.replace('/login');
        } catch (error: any) {
            toast.error('Logout failed');
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'bg-red-100 text-red-800';
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'hr':
                return 'bg-blue-100 text-blue-800';
            case 'employee':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getWelcomeMessage = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'Welcome, System Administrator! You have full control over the WorkNest platform.';
            case 'admin':
                return 'Welcome, Administrator! You can manage users and oversee operations.';
            case 'hr':
                return 'Welcome, HR Manager! You can access employee information and HR tools.';
            case 'employee':
                return 'Welcome to WorkNest! You can access your workspace and collaborate with your team.';
            default:
                return 'Welcome to WorkNest!';
        }
    };

    if (loading) {
        return (
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user data...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center">
                <p className="text-gray-600">No user data available. Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-2 text-gray-600">{getWelcomeMessage(user.role)}</p>
                    </div>
                    <Button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
                    <Button
                        onClick={() => router.push('/profile')}
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                        Edit Profile
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <p className="mt-1 text-sm text-gray-900">{user.fullName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Login</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Member Since</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        onClick={() => router.push('/profile')}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>View Profile</span>
                    </Button>

                    {(user.role === 'admin' || user.role === 'superadmin') && (
                        <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span>Manage Users</span>
                        </Button>
                    )}

                    <Button
                        onClick={() => router.push('/organizations')}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Organizations</span>
                    </Button>
                </div>
            </div>

            {/* Role-specific content */}
            {(user.role === 'admin' || user.role === 'superadmin') && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrative Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            User Management
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            System Settings
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
