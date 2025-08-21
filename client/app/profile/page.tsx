import { Metadata } from 'next';
import UserProfile from '@/components/user/UserProfile';

export const metadata: Metadata = {
    title: 'Profile - WorkNest',
    description: 'View and edit your profile information',
};



// Force dynamic rendering for instant updates
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="mt-2 text-gray-600">
                        View and manage your profile information and organization membership.
                    </p>
                </div>

                <UserProfile />
            </div>
        </div>
    );
}