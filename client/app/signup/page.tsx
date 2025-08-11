import SignupForm from '@/components/auth/SignupForm';
import AuthLayout from '@/components/layout/AuthLayout';

export default function SignupPage() {
    return (
        <AuthLayout>
            <SignupForm />
        </AuthLayout>
    );
}
