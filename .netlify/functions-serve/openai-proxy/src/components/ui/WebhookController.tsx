import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { toast } from 'sonner';
import { Copy, RefreshCw, Clipboard, Lock, Key } from 'lucide-react';

interface WebhookControllerProps {
  webhookId?: string;
  webhookUrl?: string;
  className?: string;
}

export const WebhookController: React.FC<WebhookControllerProps> = ({
  webhookId,
  webhookUrl,
  className = '',
}) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [isSecretVisible, setIsSecretVisible] = useState(false);

  // Example webhook URL based on Supabase Edge Function
  const defaultWebhookUrl = webhookUrl || `https://your-project.supabase.co/functions/v1/stripe-webhook`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(defaultWebhookUrl)
      .then(() => toast.success('Webhook URL copied to clipboard'))
      .catch(() => toast.error('Failed to copy URL'));
  };

  const handleRegenerateSecret = async () => {
    setIsRegenerating(true);
    try {
      // In a real app, this would call your API to regenerate the secret
      await new Promise(resolve => setTimeout(resolve, 1500));
      setWebhookSecret('whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
      toast.success('Webhook secret regenerated');
    } catch (error) {
      console.error('Error regenerating webhook secret:', error);
      toast.error('Failed to regenerate webhook secret');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    try {
      // In a real app, this would send a test event to your webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Webhook test successful');
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Webhook test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySecret = () => {
    if (!webhookSecret) return;
    navigator.clipboard.writeText(webhookSecret)
      .then(() => toast.success('Webhook secret copied to clipboard'))
      .catch(() => toast.error('Failed to copy secret'));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Stripe Webhook</CardTitle>
        <CardDescription>
          Configure your Stripe webhook endpoint
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Webhook URL
          </label>
          <div className="flex">
            <Input
              value={defaultWebhookUrl}
              readOnly
              className="flex-1 rounded-r-none"
            />
            <Button
              variant="outline"
              className="rounded-l-none"
              onClick={handleCopyUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Add this URL to your Stripe dashboard under Developers → Webhooks
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Webhook Secret
          </label>
          <div className="flex">
            <Input
              type={isSecretVisible ? "text" : "password"}
              value={webhookSecret || '•••••••••••••••••••••••••••••'}
              placeholder="No webhook secret set"
              readOnly
              className="flex-1 rounded-r-none font-mono"
            />
            <Button
              variant="outline"
              className="rounded-none border-l-0"
              onClick={() => setIsSecretVisible(!isSecretVisible)}
            >
              {isSecretVisible ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              className="rounded-l-none"
              onClick={handleCopySecret}
              disabled={!webhookSecret}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateSecret}
              isLoading={isRegenerating}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate Secret
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Events to Send
          </h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input id="event-checkout" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" defaultChecked />
              <label htmlFor="event-checkout" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                checkout.session.completed
              </label>
            </div>
            <div className="flex items-center">
              <input id="event-subscription-updated" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" defaultChecked />
              <label htmlFor="event-subscription-updated" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                customer.subscription.updated
              </label>
            </div>
            <div className="flex items-center">
              <input id="event-subscription-deleted" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" defaultChecked />
              <label htmlFor="event-subscription-deleted" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                customer.subscription.deleted
              </label>
            </div>
            <div className="flex items-center">
              <input id="event-invoice-failed" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" defaultChecked />
              <label htmlFor="event-invoice-failed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                invoice.payment_failed
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleTestWebhook}
            isLoading={isTesting}
          >
            Test Webhook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookController;