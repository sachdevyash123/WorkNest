import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthLayout from '@/components/layout/AuthLayout';

interface ResetPasswordPageProps {
    params: {
        token: string;
    };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
    return (
        <AuthLayout>
            <ResetPasswordForm token={params.token} />
        </AuthLayout>
    );
}
