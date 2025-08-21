'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function updateProfileAction(formData: FormData) {
    try {
        const fullName = formData.get('fullName') as string;

        if (!fullName) {
            throw new Error('Full name is required');
        }

        // Get cookies for authentication
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            throw new Error('Authentication required. Please login again.');
        }

        // Make API call to update profile with proper headers
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/profile/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Cookie': `token=${token}`,
            },
            body: JSON.stringify({ fullName }),
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        const data = await response.json();

        // Revalidate paths to update UI instantly
        revalidatePath('/profile');
        revalidatePath('/dashboard');

        return { success: true, data: data.data.user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
