'use client';

import OrganizationForm from '@/components/organizations/OrganizationForm';

export default function CreateOrganizationPage() {
  return (
    <OrganizationForm
      open={true} // Always open form
      onOpenChange={() => {}} // Prevent closing via toggle
    />
  );
}
