'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { organizationAPI } from '@/lib/api/organizations';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface InviteFormData {
    email: string;
    role: string;
}

interface InviteFormProps {
    organizationId: string;
    organizationName: string;
}

export default function InviteForm({ organizationId, organizationName }: InviteFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<InviteFormData>({
        defaultValues: {
            role: 'employee'
        }
    });

    const onSubmit = async (data: InviteFormData) => {
        setIsLoading(true);
        try {
            await organizationAPI.inviteMember(organizationId, data);
            toast.success('Invitation sent successfully!');
            reset(); // Reset form for next invite
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Invite Member</h1>
                <p className="mt-2 text-gray-600">
                    Invite a new member to join <strong>{organizationName}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                    </label>
                    <input
                        {...register('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                        type="email"
                        id="email"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter email address"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role *
                    </label>
                    <select
                        {...register('role', {
                            required: 'Role is required'
                        })}
                        id="role"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="employee">Employee</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                    </select>
                    {errors.role && (
                        <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                        The invited user will receive an email with a link to join the organization.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Invitation Process</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>An invitation email will be sent to the specified email address</li>
                                    <li>The invitation includes a secure link to join the organization</li>
                                    <li>Invitations expire after 7 days for security</li>
                                    <li>The user can accept the invitation and create their account</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

