'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store';

export default function Root() {
  const router = useRouter();
  const { user } = useAuthStore();
  useEffect(() => {
    router.replace(user ? '/dashboard' : '/auth/login');
  }, [user, router]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
    </div>
  );
}
