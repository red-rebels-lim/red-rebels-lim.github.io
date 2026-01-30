import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  timestamp: number;
}

export function CountdownTimer({ timestamp }: CountdownTimerProps) {
  const text = useCountdown(timestamp);
  if (!text) return null;
  return (
    <div className="text-[0.65rem] font-semibold text-yellow-300 mt-1 opacity-90 text-center">
      {text}
    </div>
  );
}
