import React, { useEffect, useState } from 'react';
import { getInitials } from '../../lib/format';

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  initialsClassName?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  className = '',
  initialsClassName = 'text-xs',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-[#141720] text-emerald-300 font-black border border-[#1e222d] overflow-hidden ${className}`}
    >
      <span className={initialsClassName}>{getInitials(name) || '?'}</span>
    </div>
  );
};
