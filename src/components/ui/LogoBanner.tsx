interface LogoBannerProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-16 h-16 sm:w-20 sm:h-20',
  md: 'w-24 h-24 md:w-32 md:h-32',
  lg: 'w-28 h-28 md:w-40 md:h-40',
} as const;

export default function LogoBanner({ src, alt = '', size = 'md', className = '' }: LogoBannerProps) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${SIZES[size]} object-contain shrink-0 ${className}`}
    />
  );
}
