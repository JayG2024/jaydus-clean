import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from "../../context/FirebaseAuthContext";
import { motion } from 'framer-motion';
// import { ClerkCheckoutButton } from '../../components/ui/ClerkCheckoutButton';
// import { ClerkPortalButton } from '../../components/ui/ClerkPortalButton';
import { pricingPlans, useSubscription } from '../../components/stripe/StripeProvider';

const UpgradePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { /* subscription, plan, isSubscribed */ } = useSubscription();
  const [searchParams] = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const currentPlan = /* plan || */ 'free';
  const isSubscribed = false;
  
  // Check for redirect from Stripe
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    
    if (checkoutStatus === 'success') {
      setShowSuccessMessage(true);
      toast.success('Payment processed successfully. Your subscription has been updated.');
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkoutStatus === 'canceled') {
      toast.error('Payment was canceled. Your subscription has not changed.');
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Upgrade Plan</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the plan that's right for you and your team.
          </p>
        </div>
      </div>
      
      {/* Success message after checkout */}
      {showSuccessMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-900/30 text-success-800 dark:text-success-300 p-4 rounded-lg flex items-center"
        >
          <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment successful!</p>
            <p className="text-sm">Your subscription has been updated. New plan benefits will be available shortly.</p>
          </div>
        </motion.div>
      )}
      
      {/* Current plan info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {currentPlan === 'free' ? 'Free Plan' : `${currentPlan} Plan`}
              </span>
              {currentPlan !== 'free' && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentPlan === 'free'
                ? 'Limited features with 5,000 AI credits per month'
                : currentPlan === 'pro'
                ? '50,000 AI credits per month with premium features'
                : currentPlan === 'enterprise'
                ? '500,000 AI credits per month with enterprise features'
                : '150,000 AI credits per month with advanced features'}
            </p>
          </div>
          {currentPlan !== 'free' && isSubscribed && (
            <Button variant="outline" disabled>Manage Plan (WIP)</Button>
          )}
        </div>
      </div>
      
      {/* Billing interval toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 p-1">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              billingInterval === 'month'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setBillingInterval('month')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              billingInterval === 'year'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setBillingInterval('year')}
          >
            Yearly
            <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">
              Save 20%
            </span>
          </button>
        </div>
      </div>
      
      {/* Pricing plans */}
      <div className="grid md:grid-cols-3 gap-8">
        {pricingPlans.map((plan) => {
          const price = billingInterval === 'year' ? plan.price * 0.8 : plan.price;
          return (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden ${
                plan.popular
                  ? 'ring-2 ring-primary-600 dark:ring-primary-500'
                  : 'border border-gray-200 dark:border-gray-800'
              }`}
            >
              {plan.popular && (
                <div className="bg-primary-600 py-1.5 px-4 text-center">
                  <span className="text-xs font-medium text-white uppercase tracking-wide">Most Popular</span>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${price}</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/{billingInterval}</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  {currentPlan === plan.name.toLowerCase() ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} disabled>
                      {`Select ${plan.name} (WIP)`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Enterprise CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Need a Custom Enterprise Solution?</h2>
            <p className="text-white/90 max-w-xl">
              Contact our team for a tailored plan with custom features, dedicated support, and volume discounts.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/10 hover:text-white md:w-auto w-full"
            onClick={() => window.location.href = 'mailto:enterprise@jaydus.com'}
          >
            Contact Sales
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* FAQs */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Can I change plans later?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes will take effect at the end of your current billing period.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We accept all major credit and debit cards, including Visa, Mastercard, American Express, and Discover. We also support payment via PayPal.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, we offer a 14-day money-back guarantee for all new subscriptions. If you're not satisfied with our service, you can request a full refund within 14 days of your initial purchase.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">What happens if I exceed my plan's limits?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              If you exceed your plan's AI credit limits, you can continue using the platform but at a reduced rate until your next billing cycle. You can also purchase additional credits at any time.
            </p>
          </div>
        </div>
      </div>
      
      {/* Guarantee */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-white text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 bg-white/20 rounded-full">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">30-Day Money-Back Guarantee</h2>
        <p className="max-w-2xl mx-auto">
          If you're not completely satisfied with Jaydus Platform, let us know within 30 days of your purchase and we'll give you a full refund, no questions asked.
        </p>
      </div>
    </div>
  );
};

export default UpgradePage;