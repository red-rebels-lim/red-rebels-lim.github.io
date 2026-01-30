import { useState, useEffect } from 'react';

export function useCountdown(targetTimestamp: number | null) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!targetTimestamp) return;

    function update() {
      const distance = targetTimestamp! - Date.now();
      if (distance < 0) {
        setText('');
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setText(`\u23F1 ${days}d ${hours}h`);
      else if (hours > 0) setText(`\u23F1 ${hours}h ${minutes}m`);
      else setText(`\u23F1 ${minutes}m`);
    }

    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  return text;
}
