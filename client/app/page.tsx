import { redirect } from 'next/navigation';

export default function HomePage() {
  // This will be handled by middleware, but we'll redirect to login as fallback
  redirect('/login');
}
