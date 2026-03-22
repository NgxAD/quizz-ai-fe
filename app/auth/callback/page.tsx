'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!searchParams) {
      router.push('/login?error=Invalid callback');
      return;
    }

    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      router.push('/login?error=Missing session ID');
      return;
    }

    // Prevent running twice in development mode
    if (hasAttempted.current) {
      return;
    }
    hasAttempted.current = true;

    // Fetch auth data from the session
    const fetchAuthData = async () => {
      try {
        console.log('Fetching session data for:', sessionId);
        const response = await authApi.getAuthSession(sessionId);
        
        console.log('Full response:', response);
        console.log('Response data:', response?.data);
        console.log('Response.data.user:', response?.data?.user);
        console.log('Response.data.access_token:', response?.data?.access_token);
        
        if (response?.data && response.data.access_token) {
          console.log('Login data received:', response.data.user);
          login(response.data.user, response.data.access_token);
          
          // Redirect based on roles - prioritize higher privilege roles
          const roles = response.data.user?.roles || [];
          console.log('User roles:', roles);
          console.log('Has admin:', roles.includes('admin'));
          console.log('Has teacher:', roles.includes('teacher'));
          
          if (roles.includes('admin')) {
            console.log('Redirecting to admin dashboard');
            router.push('/admin/dashboard');
          } else if (roles.includes('teacher')) {
            console.log('Redirecting to teacher dashboard');
            router.push('/teacher/dashboard');
          } else {
            console.log('Redirecting to student exams');
            router.push('/student/exams');
          }
        } else {
          console.error('Invalid session data - missing access_token or data');
          console.error('response?.data:', response?.data);
          console.error('response?.data?.access_token:', response?.data?.access_token);
          router.push('/login?error=Invalid session data');
        }
      } catch (error: any) {
        console.error('Session fetch error:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process login';
        router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    fetchAuthData();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-white text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
        <p className="text-xl">Processing login...</p>
      </div>
    </div>
  );
}
