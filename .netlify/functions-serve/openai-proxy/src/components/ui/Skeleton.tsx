import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Skeleton;