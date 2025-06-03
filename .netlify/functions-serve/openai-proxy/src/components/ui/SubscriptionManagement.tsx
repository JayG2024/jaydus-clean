import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { SubscriptionBadge } from './SubscriptionBadge';
import { CustomerPortalButton } from './CustomerPortalButton';
import { CreditCard, Shield, Calendar, AlertCircle } from 'lucide-react';

interface SubscriptionManagementProps {
  subscription?: string;
  subscriptionStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  subscription = 'free',
  subscriptionStatus = 'active',
  stripeCustomerId,
  stripeSubscriptionId
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
              Subscription Management
            </CardTitle>
            <CardDescription>Manage your current subscription</CardDescription>
          </div>
          <SubscriptionBadge subscription={subscription} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                {subscription} Plan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {subscription === 'free' 
                  ? 'Basic features with limited usage' 
                  : subscription === 'pro'
                  ? 'Advanced features with increased limits'
                  : subscription === 'business'
                  ? 'Premium features for teams with high usage'
                  : 'Full access with enterprise-grade support'}
              </p>
              <div className="mt-2">
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${subscriptionStatus === 'active' 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300' 
                    : subscriptionStatus === 'trialing'
                    ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                    : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300'}
                `}>
                  <span className="h-1.5 w-1.5 rounded-full mr-1 bg-current"></span>
                  <span className="capitalize">{subscriptionStatus || 'active'}</span>
                </span>
              </div>
            </div>
          </div>

          {subscription !== 'free' && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Billing Period</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Monthly</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Your Subscription</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      You can cancel or update your subscription at any time.
                    </p>
                  </div>
                  <CustomerPortalButton 
                    variant="outline"
                    size="sm"
                    disabled={!stripeCustomerId}
                  >
                    Billing Portal
                  </CustomerPortalButton>
                </div>
                
                {!stripeCustomerId && (
                  <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-warning-800 dark:text-warning-300">
                      No Stripe customer found. Please contact support if you believe this is an error.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Plan Features</h3>
            <ul className="space-y-3 text-sm">
              {subscription === 'free' && (
                <>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">5,000 AI credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">1 GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Basic AI models</span>
                  </li>
                </>
              )}
              
              {subscription === 'pro' && (
                <>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">50,000 AI credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">10 GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Access to all premium AI models</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Priority support</span>
                  </li>
                </>
              )}
              
              {subscription === 'business' && (
                <>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">150,000 AI credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">50 GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Advanced analytics and reporting</span>
                  </li>
                </>
              )}
              
              {subscription === 'enterprise' && (
                <>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">500,000 AI credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">200 GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Dedicated account manager</span>
                  </li>
                </>
              )}
            </ul>
            
            {subscription === 'free' && (
              <div className="mt-4">
                <Button 
                  onClick={() => window.location.href = '/upgrade'}
                  className="w-full"
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// CheckIcon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default SubscriptionManagement;