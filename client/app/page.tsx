import { redirect } from 'next/navigation';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "WorkNest - HR Management System",
  description: "A complete MERN stack authentication system with role-based access control",
};
export default function HomePage() {
  // This will be handled by middleware, but we'll redirect to login as fallback
  redirect('/login');
}
