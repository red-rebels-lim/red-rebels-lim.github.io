import { useState } from 'react';
import { User } from 'lucide-react';

interface PlayerAvatarProps {
  photoUrl?: string;
  size: 'sm' | 'lg';
}

const VARIANTS = {
  sm: { container: 'size-9', icon: 20, dim: 36 },
  lg: { container: 'size-16', icon: 32, dim: 64 },
} as const;

export function PlayerAvatar({ photoUrl, size }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const { container, icon, dim } = VARIANTS[size];
  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <div
      className={`${container} shrink-0 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500`}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          width={dim}
          height={dim}
          className="size-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <User size={icon} strokeWidth={2} />
      )}
    </div>
  );
}
