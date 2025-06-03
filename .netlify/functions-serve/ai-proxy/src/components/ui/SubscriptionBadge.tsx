import React from 'react';
import { Badge, BadgeProps } from './Badge';

interface SubscriptionBadgeProps extends Omit<BadgeProps, 'children'> {
  subscription?: string;
  className?: string;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  subscription = 'free',
  className = '',
  ...props
}) => {
  // Determine variant based on subscription
  let variant: BadgeProps['variant'] = 'default';
  
  if (subscription === 'pro') {
    variant = 'primary';
  } else if (subscription === 'business') {
    variant = 'secondary';
  } else if (subscription === 'enterprise') {
    variant = 'accent';
  }
  
  return (
    <Badge
      variant={variant}
      className={className}
      {...props}
    >
      {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
    </Badge>
  );
};

export default SubscriptionBadge;