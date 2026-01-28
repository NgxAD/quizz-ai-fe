'use client';

import { useEffect, useState } from 'react';
import { formatTime } from '@/utils/helpers';

interface TimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

export default function Timer({ totalSeconds, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const isWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <div
      className={`text-center p-4 rounded-lg font-bold text-lg ${
        isWarning
          ? 'bg-red-100 text-red-600'
          : 'bg-blue-100 text-blue-600'
      }`}
    >
      ⏱️ Thời gian còn lại: {formatTime(timeLeft)}
    </div>
  );
}
