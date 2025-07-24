import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface SafeImageProps {
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallback,
  className = "w-full h-full object-cover",
  placeholder = "bg-gray-200 animate-pulse",
  loading = "lazy",
  onLoad,
  onError
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);

  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }

    setImageState('loading');
    const img = new Image();
    
    img.onload = () => {
      setImageState('loaded');
      setImageSrc(src);
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageState('error');
      onError?.();
    };
    
    img.src = src;
  }, [src, onLoad, onError]);

  // 로딩 중
  if (imageState === 'loading') {
    return (
      <div className={cn(placeholder, className)}>
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // 로딩 실패 시 폴백
  if (imageState === 'error') {
    return (
      <div className={cn("bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center", className)}>
        {fallback || (
          <span className="text-white text-xl font-bold">
            {alt ? alt.charAt(0).toUpperCase() : '?'}
          </span>
        )}
      </div>
    );
  }

  // 로딩 성공
  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
};

export default SafeImage;