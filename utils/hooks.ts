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
    }, 0);

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
      } else if (user?.role !== 'teacher') {
        router.push('/student/exams');
      }
      setIsChecked(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user, router]);

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
      } else if (user?.role !== 'student') {
        router.push('/teacher/dashboard');
      }
      setIsChecked(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user, router]);

  return { isChecked };
};
