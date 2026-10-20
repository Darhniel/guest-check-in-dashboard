import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side check isn't possible for localStorage,
  // so we redirect to dashboard which handles auth client-side
  redirect('/dashboard');
}