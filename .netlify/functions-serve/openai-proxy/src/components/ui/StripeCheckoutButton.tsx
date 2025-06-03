import React, { useState } from 'react';
import { Button, ButtonProps } from './Button';
import { useAuth } from '../../context/SupabaseAuthContext';
import { createCheckoutSession } from '../../services/supabaseStripeService';
import { toast } from 'sonner';
import { MockPaymentForm } from './MockPaymentForm';

// Check if using mock mode (placeholder API keys)
const MOCK_MODE = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.includes('mock') || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

interface StripeCheckoutButtonProps extends ButtonProps {
  priceId: string;
  productName: string;
  amount?: number;
}

export const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  priceId,
  productName,
  amount = 1900, // Default $19.00
  children,
  isLoading: externalLoading,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  const { currentUser, userData } = useAuth();

  // Find plan price
  const getPlanAmount = () => {
    const planMap: Record<string, number> = {
      'price_real_monthly_basic': 1900,      // $19.00
      'price_real_monthly_premium': 4900,    // $49.00
      'price_real_monthly_enterprise': 9900, // $99.00
    };
    return planMap[priceId] || amount;
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to make a purchase');
      return;
    }

    setIsLoading(true);

    try {
      if (MOCK_MODE) {
        console.log('Using mock checkout for', productName);
        setShowMockCheckout(true);
        setIsLoading(false);
        return;
      }

      // Create a Stripe checkout session
      const { sessionId, url } = await createCheckoutSession(
        priceId,
        userData?.stripe_customer_id,
        { userId: currentUser.id }
      );

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        // If no URL is returned, use Stripe.js to redirect
        const stripe = await import('@stripe/stripe-js').then(module => module.loadStripe(
          import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
        ));
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        } else {
          throw new Error('Failed to load Stripe');
        }
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(error.message || `Failed to start checkout for ${productName}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleCheckout}
        isLoading={isLoading || externalLoading}
        disabled={isLoading || externalLoading}
        {...props}
      >
        {children}
      </Button>

      {showMockCheckout && (
        <MockPaymentForm
          amount={getPlanAmount()}
          productName={productName}
          onSuccess={() => setShowMockCheckout(false)}
          onCancel={() => setShowMockCheckout(false)}
          onFail={() => setShowMockCheckout(false)}
        />
      )}
    </>
  );
};

export default StripeCheckoutButton;