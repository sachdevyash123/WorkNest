import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Metadata } from 'next';
// Force dynamic rendering for instant updates
export const metadata:Metadata={
    title:"Dashboard - WorkNest",
    description:"HR mangement system"
}

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <DashboardContent />
        </DashboardLayout>
    );
}
