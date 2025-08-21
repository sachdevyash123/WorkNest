import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect,notFound } from "next/navigation";
import OrganizationSettingsClient from "@/components/organization-settings/OrganizationSettingsClient";
interface User {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }
  
  interface Member {
    _id: string;
    user: User;
    role: string;
    joinedAt: string;
  }
  
  interface Organization {
    _id: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    industry?: string;
    size?: number;
    status?: 'active' | 'inactive';
    logo?: string;
    owner: {
      _id: string;
      fullName: string;
      email: string;
    };
    members: Member[];
    memberCount: number;
    createdAt: string;
  }
  
export const metadata:Metadata={
    title:"Organization Settings - WorkNest",
    description:"Manage your organizations and users"
}

async function getUserOrganization():Promise<Organization | null>{
    try {
        const cookieStore=cookies();
        const token=(await cookieStore).get('token')?.value;
        if (!token || token === 'none' || token === 'null' || token === 'undefined') {
            redirect('/login');
          }
        const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization-settings`,{
            cache:"no-store",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`
            }
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              redirect('/login');
            }
            if (res.status === 404) {
              return null;
            }
            throw new Error(`Failed to fetch organization: ${res.status}`);
          }
      
          const data = await res.json();
          return data?.data || null;
    } catch (error) {
        console.error("Error fetching user organization:", error);
        throw error;
    }
}
async function getUserOrganizationMembers(){
    try {
        const cookieStore=cookies();
        const token=(await cookieStore).get('token')?.value;
        if(!token) return [];
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization-settings/members`, {
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });
      
          if (!res.ok) return [];
      
          const data = await res.json();
          return data?.data || [];
    } catch (error) {
        console.error("Error fetching organization members:", error);
        return [];
    }
}
export const dynamic="force-dynamic";

export default async function OrganizationSettingsPage(){
    const organization=await getUserOrganization();
    if(!organization){
        notFound();
    }
    const members=await getUserOrganizationMembers();
    return(
       <OrganizationSettingsClient
       organization={organization}
       members={members}
       />
    )
}