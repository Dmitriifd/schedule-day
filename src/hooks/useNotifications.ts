import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export type ScheduleItem = {
  time: string;
  description: string;
};

function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}

export function useNotifications(schedule: ScheduleItem[]) {
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestNotificationPermission();

    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentMinute === 0) {
        const scheduleItem = schedule.find((item) => {
          const [scheduleHour, scheduleMinute] = item.time.split(':').map(Number);
          return scheduleHour === currentHour && scheduleMinute === currentMinute;
        });

        if (scheduleItem) {
          const message = scheduleItem.description || 'Нет описания';
          toast(message, {
            icon: '🕒',
            duration: 5000,
          });

          if (Notification.permission === 'granted') {
            new Notification('Напоминание', { body: message });
          }
        }
      }
    };

    intervalIdRef.current = setInterval(checkTime, 60000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [schedule]);
}
