'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api';
import { useRouter } from 'next/navigation';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Check if user is authenticated on mount (skip on public auth pages)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const pathname = window.location.pathname || '';
        const isPublicAuthPage =
            pathname.startsWith('/login') ||
            pathname.startsWith('/signup') ||
            pathname.startsWith('/forgot-password') ||
            pathname.startsWith('/reset-password');

        if (isPublicAuthPage) {
            setLoading(false);
            return;
        }

        checkAuth();
    }, []);

    // Check authentication status
    const checkAuth = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.getMe();
            setUser(response.data.data.user);

            // Store user in localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
        } catch (error) {
            // Suppress expected 401/403 errors
            const status = error?.response?.status;
            if (status !== 401 && status !== 403) {
                console.error('Auth check error:', error);
            }
            setUser(null);

            // Clear stored data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        } finally {
            setLoading(false);
        }
    };

    // Login function
    const login = async (credentials) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.login(credentials);
            const { user: userData, token } = response.data.data;

            setUser(userData);

            // Store data in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', token);
            }

            return { success: true, data: userData };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.register(userData);
            const { user: newUser, token } = response.data.data;

            setUser(newUser);

            // Store data in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(newUser));
                localStorage.setItem('token', token);
            }

            return { success: true, data: newUser };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            setLoading(true);
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setError(null);
            setLoading(false);

            // Clear stored data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    };

    // Forgot password function
    const forgotPassword = async (email) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.forgotPassword(email);
            return { success: true, message: response.data.message };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send reset email';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Reset password function
    const resetPassword = async (token, password) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.resetPassword(token, password);
            const { user: userData, token: newToken } = response.data.data;

            setUser(userData);

            // Store data in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', newToken);
            }

            return { success: true, data: userData };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Password reset failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Check if user has specific role
    const hasRole = (role) => {
        if (!user) return false;
        return user.role === role;
    };

    // Check if user has any of the specified roles
    const hasAnyRole = (roles) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    // Check if user is admin or superadmin
    const isAdmin = () => hasAnyRole(['admin', 'superadmin']);

    // Check if user is superadmin
    const isSuperAdmin = () => hasRole('superadmin');
    //check if user is admin or hr
    const isAdminOrHR=()=>hasAnyRole(['admin','hr']);
    //check if user is hr
    const isHR=()=>hasRole('hr');
    //check if user is Employee
    const isEmployee=()=>hasRole('employee');

    // Update user data in context and localStorage
    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        hasRole,
        hasAnyRole,
        isAdmin,
        isAdminOrHR,
        isHR,
        isEmployee,
        isSuperAdmin,
        checkAuth,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
