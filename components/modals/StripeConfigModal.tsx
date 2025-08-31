'use client';

import React, { useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CreditCard, Settings, Eye, EyeOff } from 'lucide-react';

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  supportedCountries: string[];
  automaticTaxes: boolean;
  allowPromotionCodes: boolean;
}

interface StripeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: StripeConfig) => void;
  initialConfig?: StripeConfig;
}

const CURRENCIES = [
  { code: 'usd', name: 'US Dollar ($)' },
  { code: 'eur', name: 'Euro (€)' },
  { code: 'gbp', name: 'British Pound (£)' },
  { code: 'cad', name: 'Canadian Dollar (C$)' },
  { code: 'aud', name: 'Australian Dollar (A$)' },
  { code: 'jpy', name: 'Japanese Yen (¥)' },
  { code: 'mxn', name: 'Mexican Peso (MXN$)' },
  { code: 'brl', name: 'Brazilian Real (R$)' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
];

const StripeConfigModal: React.FC<StripeConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [config, setConfig] = useState<StripeConfig>(
    initialConfig || {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      currency: 'usd',
      supportedCountries: ['US', 'CA', 'MX'],
      automaticTaxes: true,
      allowPromotionCodes: true,
    }
  );

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.publishableKey.trim()) {
      newErrors.publishableKey = 'Publishable key is required';
    } else if (!config.publishableKey.startsWith('pk_')) {
      newErrors.publishableKey = 'Invalid publishable key format (should start with pk_)';
    }

    if (!config.secretKey.trim()) {
      newErrors.secretKey = 'Secret key is required';
    } else if (!config.secretKey.startsWith('sk_')) {
      newErrors.secretKey = 'Invalid secret key format (should start with sk_)';
    }

    if (!config.webhookSecret.trim()) {
      newErrors.webhookSecret = 'Webhook secret is required';
    } else if (!config.webhookSecret.startsWith('whsec_')) {
      newErrors.webhookSecret = 'Invalid webhook secret format (should start with whsec_)';
    }

    if (config.supportedCountries.length === 0) {
      newErrors.supportedCountries = 'At least one country must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateConfig()) {
      onSave(config);
      onClose();
    }
  };

  const handleCountryToggle = (countryCode: string) => {
    setConfig(prev => ({
      ...prev,
      supportedCountries: prev.supportedCountries.includes(countryCode)
        ? prev.supportedCountries.filter(c => c !== countryCode)
        : [...prev.supportedCountries, countryCode],
    }));
  };

  const handleReset = () => {
    setConfig(initialConfig || {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      currency: 'usd',
      supportedCountries: ['US', 'CA', 'MX'],
      automaticTaxes: true,
      allowPromotionCodes: true,
    });
    setErrors({});
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Stripe Configuration"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Configure Stripe Payment Gateway</h3>
            <p className="text-sm text-gray-600">
              Set up your Stripe account credentials and payment preferences
            </p>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            API Configuration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey" className="text-sm font-medium text-gray-700">
                Publishable Key
              </Label>
              <BaseInput
                id="publishableKey"
                type="text"
                value={config.publishableKey}
                onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                placeholder="pk_test_..."
                className={errors.publishableKey ? 'border-red-500' : ''}
              />
              {errors.publishableKey && (
                <p className="text-sm text-red-600">{errors.publishableKey}</p>
              )}
              <p className="text-xs text-gray-500">
                Found in your Stripe Dashboard under Developers → API keys
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700">
                Secret Key
              </Label>
              <div className="relative">
                <BaseInput
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secretKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  placeholder="sk_test_..."
                  className={errors.secretKey ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.secretKey && (
                <p className="text-sm text-red-600">{errors.secretKey}</p>
              )}
              <p className="text-xs text-gray-500">
                Keep this secure and never expose it in client-side code
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret" className="text-sm font-medium text-gray-700">
              Webhook Secret
            </Label>
            <div className="relative">
              <BaseInput
                id="webhookSecret"
                type={showWebhookSecret ? 'text' : 'password'}
                value={config.webhookSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="whsec_..."
                className={errors.webhookSecret ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.webhookSecret && (
              <p className="text-sm text-red-600">{errors.webhookSecret}</p>
            )}
            <p className="text-xs text-gray-500">
              Found in your Stripe Dashboard under Developers → Webhooks
            </p>
          </div>
        </div>

        {/* Payment Preferences Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Payment Preferences</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Default Currency
              </Label>
              <Select
                value={config.currency}
                onValueChange={(value) => setConfig(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Supported Countries
              </Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                {COUNTRIES.map((country) => (
                  <label key={country.code} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={config.supportedCountries.includes(country.code)}
                      onChange={() => handleCountryToggle(country.code)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{country.name}</span>
                  </label>
                ))}
              </div>
              {errors.supportedCountries && (
                <p className="text-sm text-red-600">{errors.supportedCountries}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="automaticTaxes" className="text-sm font-medium text-gray-700">
                Enable Automatic Tax Calculation
              </Label>
              <Switch
                id="automaticTaxes"
                checked={config.automaticTaxes}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, automaticTaxes: checked }))}
              />
            </div>
            <p className="text-xs text-gray-500">
              Automatically calculate and collect sales tax based on customer location
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowPromotionCodes" className="text-sm font-medium text-gray-700">
                Allow Promotion Codes
              </Label>
              <Switch
                id="allowPromotionCodes"
                checked={config.allowPromotionCodes}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, allowPromotionCodes: checked }))}
              />
            </div>
            <p className="text-xs text-gray-500">
              Allow customers to enter Stripe promotion codes during checkout
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h5>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Get your API keys from the <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
            <li>• Set up webhooks at <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="underline">Stripe Webhooks</a></li>
            <li>• Test with <a href="https://stripe.com/docs/testing" target="_blank" rel="noopener noreferrer" className="underline">Stripe test cards</a></li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <BaseButton
            onClick={handleSave}
            variant="primary"
            className="flex-1"
          >
            Save Configuration
          </BaseButton>
          <BaseButton
            onClick={handleReset}
            variant="outline"
          >
            Reset
          </BaseButton>
          <BaseButton
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default StripeConfigModal;
