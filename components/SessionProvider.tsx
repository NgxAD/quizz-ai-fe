'use client';

import { useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    // Restore session from cookie
    const token = Cookies.get('accessToken');
    const userStr = Cookies.get('user');

    if (token) {
      setToken(token);
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUser(user);
      } catch (e) {
        console.error('Failed to parse user from cookie:', e);
      }
    }

    setIsHydrated(true);
  }, [setToken, setUser]);

  // Prevent rendering until hydration is complete
  if (!isHydrated) {
    return <div />;
  }

  return <>{children}</>;
}
