'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Organization {
  _id: string;
  name: string;
  industry: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
const fetchThroughProxy = async (orgId: string) => {
  const response = await fetch(`/api/organizations/${orgId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
};
export const useOrganization = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      // Add null check for user and return early if user is null or doesn't have organization
      if (!user || !user.organization || user.role === 'superadmin') {
        setOrganization(null);
        setLoading(false);
        return;
      }
      
      // Check if user has organizationId field as well (some APIs use different field names)
      const orgId = user?.organization;
      if (!orgId) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
       const response = await fetchThroughProxy(orgId);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data.organization || data.data || data);
          return;
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setOrganization(null);
        
        // Additional error handling based on error type
        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch')) {
            console.error('Network error - check if API server is running');
          } else if (err.message.includes('401')) {
            console.error('Authentication failed - token may be expired');
          } else if (err.message.includes('403')) {
            console.error('Access denied - user may not have permission to access this organization');
            console.error('Check if user.organization matches the organization they belong to');
          } else if (err.message.includes('404')) {
            console.error('Organization not found - the organization ID may be invalid');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user?.organization, user?.role]);

  return { organization, loading, refetch: () => setOrganization(null) };
};