import React, { useState } from 'react';
import { Button, ButtonProps } from './Button';
import { useAuth } from '../../context/SupabaseAuthContext';
import { createCustomerPortalSession } from '../../services/supabaseStripeService';
import { toast } from 'sonner';
import { MockPaymentForm } from './MockPaymentForm';

// Check if using mock mode (placeholder API keys)
const MOCK_MODE = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.includes('mock') || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

interface CustomerPortalButtonProps extends ButtonProps {
  returnUrl?: string;
}

export const CustomerPortalButton: React.FC<CustomerPortalButtonProps> = ({
  children,
  returnUrl,
  isLoading: externalLoading,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMockPortal, setShowMockPortal] = useState(false);
  const { userData } = useAuth();

  const handlePortalRedirect = async () => {
    if (!userData?.stripe_customer_id) {
      toast.error('No customer ID found');
      return;
    }

    setIsLoading(true);

    try {
      if (MOCK_MODE) {
        console.log('Using mock customer portal');
        // Just show a mock management dialog
        setShowMockPortal(true);
        setIsLoading(false);
        return;
      }

      // Navigate to Stripe Customer Portal
      const { url } = await createCustomerPortalSession(
        userData.stripe_customer_id,
        returnUrl
      );
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error navigating to customer portal:', error);
      toast.error(error.message || 'Failed to open customer portal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handlePortalRedirect}
        isLoading={isLoading || externalLoading}
        disabled={isLoading || externalLoading || !userData?.stripe_customer_id}
        {...props}
      >
        {children}
      </Button>

      {showMockPortal && (
        <MockPaymentForm
          amount={1900}
          productName="Subscription Management"
          onSuccess={() => {
            setShowMockPortal(false);
            window.location.href = returnUrl || window.location.origin + '/settings';
          }}
          onCancel={() => setShowMockPortal(false)}
        />
      )}
    </>
  );
};

export default CustomerPortalButton;