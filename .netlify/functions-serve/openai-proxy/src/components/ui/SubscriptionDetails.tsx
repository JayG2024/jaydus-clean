import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { CustomerPortalButton } from './CustomerPortalButton';
import { SubscriptionBadge } from './SubscriptionBadge';

interface SubscriptionDetailsProps {
  subscription?: string;
  subscriptionStatus?: string;
  hasStripeCustomer: boolean;
  className?: string;
}

export const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  subscription = 'free',
  subscriptionStatus = 'active',
  hasStripeCustomer,
  className = ''
}) => {
  const planFeatures = {
    free: {
      credits: '5,000',
      storage: '1 GB',
      description: 'Basic features with limited usage'
    },
    pro: {
      credits: '50,000',
      storage: '10 GB',
      description: 'Advanced features with increased limits'
    },
    business: {
      credits: '150,000',
      storage: '50 GB',
      description: 'Premium features for teams with high usage'
    },
    enterprise: {
      credits: '500,000',
      storage: '200 GB',
      description: 'Full access with enterprise-grade support'
    }
  };

  const features = planFeatures[subscription as keyof typeof planFeatures] || planFeatures.free;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscription</CardTitle>
          <SubscriptionBadge subscription={subscription} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {subscription === 'free' ? 'Free Plan' : `${subscription.charAt(0).toUpperCase() + subscription.slice(1)} Plan`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {features.description}
            </p>
          </div>

          {subscriptionStatus && subscriptionStatus !== 'active' && (
            <div className="p-3 bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-300 rounded-md text-sm">
              Subscription status: <span className="font-medium capitalize">{subscriptionStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Credits</p>
              <p className="font-medium text-gray-900 dark:text-white">{features.credits}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Storage</p>
              <p className="font-medium text-gray-900 dark:text-white">{features.storage}</p>
            </div>
          </div>

          {hasStripeCustomer && (
            <CustomerPortalButton 
              variant="outline" 
              className="w-full"
              returnUrl={window.location.origin + '/settings'}
            >
              Manage Subscription
            </CustomerPortalButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionDetails;