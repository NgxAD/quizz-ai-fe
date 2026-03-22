import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect, useState } from 'react';

export const useProtectedRoute = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Wait a tick to ensure store is hydrated
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        router.push('/login');
      }
      setIsChecked(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);

  return { isChecked };
};

export const useTeacherRoute = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Wait a tick to ensure store is hydrated
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        router.push('/login');
      } else if (!user?.roles?.includes('teacher')) {
        router.push('/student/exams');
      }
      setIsChecked(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user?.roles, router]);

  return { isChecked };
};

export const useStudentRoute = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Wait a tick to ensure store is hydrated
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        router.push('/login');
      } else if (!user?.roles?.includes('student')) {
        // Redirect to appropriate page if not a student
        if (user?.roles?.includes('teacher')) {
          router.push('/teacher/dashboard');
        } else if (user?.roles?.includes('admin')) {
          router.push('/admin/dashboard');
        }
      }
      setIsChecked(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user?.roles, router]);

  return { isChecked };
};

export const useAdminRoute = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Wait a tick to ensure store is hydrated
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        router.push('/login');
      } else if (!user?.roles?.includes('admin')) {
        router.push('/student/exams');
      }
      setIsChecked(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user?.roles, router]);

  return { isChecked };
};
