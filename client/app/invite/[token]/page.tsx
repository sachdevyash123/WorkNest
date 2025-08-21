'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface InviteData {
    email: string;
    role: string;
    organization: {
        _id: string;
        name: string;
        description?: string;
    };
}

interface SignupFormData {
    fullName: string;
    password: string;
    confirmPassword: string;
}

export default function InviteAcceptancePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<SignupFormData>();

    const password = watch('password');

    useEffect(() => {
        if (token) {
            validateInvite();
        } else {
            setError('No invitation token provided');
            setLoading(false);
        }
    }, [token]);

    const validateInvite = async () => {
        try {
            setLoading(true);
            setError(null);
           

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invites/validate/${token}`, {
                method: 'GET',
                credentials: 'include'
            });

            

            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error('Non-JSON response received:', textResponse);
                throw new Error('Server returned invalid response format');
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Invalid or expired invitation');
            }

            if (result.success && result.data) {
                setInviteData(result.data);
            } else {
                throw new Error('Invalid invitation data received');
            }
        } catch (error: any) {
            console.error('Validate invite error:', error);
            setError(error.message || 'Failed to validate invitation');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: SignupFormData) => {
        if (data.password !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!inviteData) {
            toast.error('Invalid invitation data');
            return;
        }

        try {
            setIsSubmitting(true);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invites/accept/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    fullName: data.fullName,
                    password: data.password
                }),
            });
             // Check if response is actually JSON
             const contentType = response.headers.get('content-type');
             if (!contentType || !contentType.includes('application/json')) {
                 const textResponse = await response.text();
                 console.error('Non-JSON response received:', textResponse);
                 throw new Error('Server returned invalid response format');
             }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create account');
            }

            toast.success('Account created successfully! Welcome to the organization.');
            
            // Redirect to login page
            setTimeout(() => {
                router.push('/login');
            }, 1500);
            
        } catch (error: any) {
            console.error('Accept invite error:', error);
            toast.error(error.message || 'Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Validating invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !inviteData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h2>
                    <p className="text-gray-600 mb-6">
                        {error || 'This invitation link is invalid or has expired.'}
                    </p>
                    <div className="space-y-3">
                        <Link href="/login" className="block">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                Go to Login
                            </Button>
                        </Link>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-2-2m0 0l-2 2m2-2v6" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Accept Invitation</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        You've been invited to join <strong>{inviteData.organization.name}</strong>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Role: <span className="font-medium capitalize">{inviteData.role}</span>
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow rounded-lg">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={inviteData.email}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This email is associated with your invitation
                            </p>
                        </div>

                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <input
                                {...register('fullName', {
                                    required: 'Full name is required',
                                    minLength: {
                                        value: 2,
                                        message: 'Full name must be at least 2 characters'
                                    },
                                    pattern: {
                                        value: /^[a-zA-Z\s]+$/,
                                        message: 'Full name can only contain letters and spaces'
                                    }
                                })}
                                type="text"
                                id="fullName"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your full name"
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <input
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters'
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                                    }
                                })}
                                type="password"
                                id="password"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Create a password"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <input
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: value => value === password || 'Passwords do not match'
                                })}
                                type="password"
                                id="confirmPassword"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirm your password"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Organization Details</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p><strong>Name:</strong> {inviteData.organization.name}</p>
                                        {inviteData.organization.description && (
                                            <p><strong>Description:</strong> {inviteData.organization.description}</p>
                                        )}
                                        <p><strong>Your Role:</strong> <span className="capitalize">{inviteData.role}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                </div>
                            ) : (
                                'Accept Invitation & Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-800">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}