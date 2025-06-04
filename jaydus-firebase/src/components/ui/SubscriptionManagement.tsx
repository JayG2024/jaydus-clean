import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { SubscriptionBadge } from './SubscriptionBadge';
import { ClerkPortalButton } from './ClerkPortalButton';
import { useSubscription } from '../stripe/StripeProvider';
import { CreditCard, Shield, Calendar, AlertCircle } from 'lucide-react';

interface SubscriptionManagementProps {}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = () => {
  const { subscription, isSubscribed, plan, isLoading } = useSubscription();
  
  const subscriptionStatus = subscription?.status || 'active';
  const currentPlan = plan || 'free';
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
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
          <SubscriptionBadge subscription={currentPlan} />
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
                {currentPlan} Plan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {currentPlan === 'free' 
                  ? 'Basic features with limited usage' 
                  : currentPlan === 'pro'
                  ? 'Advanced features with increased limits'
                  : currentPlan === 'business'
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

          {currentPlan !== 'free' && isSubscribed && (
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
                  <ClerkPortalButton 
                    variant="outline"
                    size="sm"
                  >
                    Billing Portal
                  </ClerkPortalButton>
                </div>
                
              </div>
            </div>
          )}
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Plan Features</h3>
            <ul className="space-y-3 text-sm">
              {currentPlan === 'free' && (
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
              
              {currentPlan === 'pro' && (
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
              
              {currentPlan === 'business' && (
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
              
              {currentPlan === 'enterprise' && (
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
            
            {currentPlan === 'free' && (
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