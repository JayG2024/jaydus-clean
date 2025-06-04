import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MockPaymentFormProps {
  amount: number;
  currency?: string;
  productName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onFail?: () => void;
}

export const MockPaymentForm: React.FC<MockPaymentFormProps> = ({
  amount,
  currency = 'USD',
  productName = 'Subscription',
  onSuccess,
  onCancel,
  onFail
}) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/25');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('John Doe');

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formatted.substring(0, 19)); // limit to 16 digits + 3 spaces
  };

  // Format expiry date
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      setCardExpiry(value);
    } else {
      setCardExpiry(`${value.substring(0, 2)}/${value.substring(2, 4)}`);
    }
  };

  // Process the mock payment
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');

    // Simulate payment processing
    setTimeout(() => {
      // Test card numbers for different outcomes
      if (cardNumber.startsWith('4242')) {
        // Success case - 4242 4242 4242 4242
        setStatus('success');
        if (onSuccess) onSuccess();
        toast.success('Payment successful');
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = window.location.origin + '/upgrade?checkout=success';
        }, 2000);
      } else if (cardNumber.startsWith('4000')) {
        // Error case - 4000 0000 0000 0002
        setStatus('error');
        if (onFail) onFail();
        toast.error('Payment failed. Please try again.');
      } else {
        // Generic success for any other number
        setStatus('success');
        if (onSuccess) onSuccess();
        toast.success('Payment successful');
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = window.location.origin + '/upgrade?checkout=success';
        }, 2000);
      }
    }, 2000);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    window.location.href = window.location.origin + '/upgrade?checkout=canceled';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-primary-600" />
                Checkout
              </CardTitle>
              <CardDescription>
                {productName} - {formatAmount(amount / 100)}
              </CardDescription>
            </div>
            {status === 'processing' && (
              <div className="animate-pulse flex items-center text-primary-600">
                <Clock className="h-5 w-5 mr-1" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
            {status === 'success' && (
              <div className="flex items-center text-success-600">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">Approved</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center text-error-600">
                <AlertCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">Failed</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cardholder Name
              </label>
              <Input 
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                disabled={status === 'processing' || status === 'success'}
                required
              />
            </div>
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card Number
              </label>
              <Input 
                id="cardNumber"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4242 4242 4242 4242"
                disabled={status === 'processing' || status === 'success'}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use 4242 4242 4242 4242 for success, 4000 0000 0000 0002 for failure
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <Input 
                  id="cardExpiry"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  disabled={status === 'processing' || status === 'success'}
                  required
                />
              </div>
              <div>
                <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CVC
                </label>
                <Input 
                  id="cardCvc"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  disabled={status === 'processing' || status === 'success'}
                  required
                />
              </div>
            </div>
            {status === 'error' && (
              <div className="p-3 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md text-sm">
                Your card was declined. Please try a different payment method.
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={status === 'processing' || status === 'success'}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            isLoading={status === 'processing'}
            disabled={status === 'processing' || status === 'success'}
          >
            Pay {formatAmount(amount / 100)}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default MockPaymentForm;