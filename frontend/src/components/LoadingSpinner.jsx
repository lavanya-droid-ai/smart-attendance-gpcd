import { Loader2 } from 'lucide-react';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <Loader2
      className={`animate-spin text-primary-600 ${sizes[size]} ${className}`}
    />
  );
}
