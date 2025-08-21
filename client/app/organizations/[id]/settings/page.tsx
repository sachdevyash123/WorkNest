'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { organizationAPI } from '@/lib/api/organizations';
import OrganizationForm from '@/components/organizations/OrganizationForm';
import toast from 'react-hot-toast';

interface Organization {
    _id: string;
    name: string;
    description?: string;
}

export default function OrganizationSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const organizationId = params.id as string;

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrganization();
    }, [organizationId]);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            const response = await organizationAPI.getById(organizationId);
            setOrganization(response.data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch organization');
            router.push(`/organizations/${organizationId}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization not found</h2>
                        <button
                            onClick={() => router.back()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <OrganizationForm
                    organization={organization}
                    mode="edit"
                />
            </div>
        </div>
    );
}















