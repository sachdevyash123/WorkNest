import OrganizationList from "@/components/organizations/OrganizationList";
import { Metadata } from 'next';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: 'Organizations - WorkNest',
    description: 'Manage your organizations and users',
};
export const dynamic = "force-dynamic"; // ensures fresh fetch (optional)

async function getOrganizations() {
  try {
    const cookieStore=cookies();
    const token=(await cookieStore).get('token')?.value;
    if (!token || token === 'none' || token === 'null' || token === 'undefined') {
      redirect('/login'); // Redirect to login if no valid token
      return [];
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
      cache: "no-store", // no caching, always fresh data
      headers: {
        "Content-Type": "application/json",
        "Authorization":`Bearer ${token}`
        // Optional: If you need auth token for SSR, handle here
        // Authorization: `Bearer ${process.env.SERVER_TOKEN}`
      },
    });

    if (!res.ok) throw new Error("Failed to fetch organizations");

    const data = await res.json();
    return data?.data || [];
  } catch (err) {
    console.error("Error fetching organizations:", err);
    return [];
  }
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="p-6">
      <OrganizationList initialData={organizations} />
    </div>
  );
}
