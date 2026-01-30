'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    if (!searchParams) {
      router.push('/login?error=Invalid callback');
      return;
    }

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token && userId) {
      // Store token and redirect based on role
      const user = {
        _id: userId,
        role: role || 'STUDENT',
      };
      
      login(user as any, token);
      
      if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/exams');
      }
    } else {
      router.push('/login?error=Invalid callback parameters');
    }
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-white text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
        <p className="text-xl">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
}
