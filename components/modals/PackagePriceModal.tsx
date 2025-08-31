'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, Globe, Save, X, Package } from 'lucide-react';



interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  exchange_rate: number;
}

interface PackageDefinition {
  id: number;
  name: string;
  sessions_count: number;
  package_type: 'individual' | 'group' | 'mixed';
  max_group_size: number | null;
}

interface PackagePrice {
  id: number;
  package_definition_id: number;
  currency_id: number;
  price: number;
  pricing_mode: 'custom' | 'calculated';
  is_active: boolean;
  package_definitions: PackageDefinition;
  currencies: Currency;
}

interface PackagePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  packagePrice?: PackagePrice | null;
  packageDefinitions: PackageDefinition[];
  currencies: Currency[];
  mode: 'create' | 'edit';
}

const PackagePriceModal: React.FC<PackagePriceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  packagePrice,
  packageDefinitions,
  currencies,
  mode
}) => {
  const [formData, setFormData] = useState({
    package_definition_id: '',
    currency_id: '',
    price: '',
    pricing_mode: 'calculated' as 'custom' | 'calculated',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    if (packagePrice && mode === 'edit') {
      setFormData({
        package_definition_id: packagePrice.package_definition_id.toString(),
        currency_id: packagePrice.currency_id.toString(),
        price: packagePrice.price.toString(),
        pricing_mode: packagePrice.pricing_mode,
        is_active: packagePrice.is_active
      });
    } else {
      resetForm();
    }
  }, [packagePrice, mode]);

  useEffect(() => {
    if (formData.package_definition_id && formData.currency_id && formData.pricing_mode === 'calculated') {
      calculatePrice();
    }
  }, [formData.package_definition_id, formData.currency_id, formData.pricing_mode]);

  const resetForm = () => {
    setFormData({
      package_definition_id: '',
      currency_id: '',
      price: '',
      pricing_mode: 'calculated',
      is_active: true
    });
    setErrors({});

    setCalculatedPrice(null);
    setExchangeRate(null);
  };

  const calculatePrice = () => {
    // This would implement the actual price calculation logic
    // For now, just set a placeholder
    setCalculatedPrice(99.99);
  };

  const handlePricingModeChange = (mode: 'custom' | 'calculated') => {
    setFormData(prev => ({ ...prev, pricing_mode: mode }));
    if (mode === 'calculated') {
      setFormData(prev => ({ ...prev, price: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.package_definition_id) {
      newErrors.package_definition_id = 'Package definition is required';
    }

    if (!formData.currency_id) {
      newErrors.currency_id = 'Currency is required';
    }

    if (formData.pricing_mode === 'custom' && !formData.price) {
      newErrors.price = 'Price is required for custom pricing';
    }

    if (formData.price && parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      price: formData.pricing_mode === 'calculated' ? calculatedPrice : parseFloat(formData.price)
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedPackage = packageDefinitions.find(p => p.id.toString() === formData.package_definition_id);
  const selectedCurrency = currencies.find(c => c.id.toString() === formData.currency_id);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Price' : 'Edit Package Price'}
      description={mode === 'create' 
        ? 'Set pricing for a package in a specific currency'
        : 'Update the package pricing configuration'
      }
      size="xl"
      variant="default"
    >
      <BaseModal.Header icon={<DollarSign className="w-5 h-5" />}>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-medium text-white">
            {mode === 'create' ? 'Create New Price' : 'Edit Package Price'}
          </h3>
        </div>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Package Definition *
              </Label>
              <Select
                value={formData.package_definition_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, package_definition_id: value }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {packageDefinitions.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()} className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {pkg.name} ({pkg.sessions_count} sessions)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.package_definition_id && (
                <p className="text-red-500 text-sm">
                  {errors.package_definition_id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Currency *
              </Label>
              <Select
                value={formData.currency_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency_id: value }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()} className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {currency.code} - {currency.name}
                        {currency.is_default && (
                          <Badge className="bg-blue-500 text-white">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency_id && (
                <p className="text-red-500 text-sm">
                  {errors.currency_id}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Pricing Mode *
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="calculated"
                    name="pricing_mode"
                    value="calculated"
                    checked={formData.pricing_mode === 'calculated'}
                    onChange={() => handlePricingModeChange('calculated')}
                    className="rounded-full border-gray-600 bg-gray-800"
                  />
                  <Label htmlFor="calculated" className="text-sm font-medium text-gray-300 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Calculated (from Exchange Rate)
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom"
                    name="pricing_mode"
                    value="custom"
                    checked={formData.pricing_mode === 'custom'}
                    onChange={() => handlePricingModeChange('custom')}
                    className="rounded-full border-gray-600 bg-gray-800"
                  />
                  <Label htmlFor="custom" className="text-sm font-medium text-gray-300 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Custom Price
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {formData.pricing_mode === 'custom' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Custom Price *
                </Label>
                <BaseInput
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  variant={errors.price ? 'error' : 'default'}
                  error={errors.price}
                />
              </div>
            )}

            {formData.pricing_mode === 'calculated' && calculatedPrice && (
              <div className="p-4 bg-gray-800 rounded-md border border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Calculated Price:
                  </span>
                  <span className="text-lg font-bold text-white">
                    {selectedCurrency?.symbol} {calculatedPrice}
                  </span>
                </div>
                {exchangeRate && (
                  <div className="text-xs text-gray-400 mt-1">
                    Exchange Rate: 1 USD = {exchangeRate} {selectedCurrency?.code}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active" className="text-sm font-medium text-gray-300">
              Active Price
            </Label>
          </div>

          {selectedPackage && selectedCurrency && (
            <div className="p-4 bg-gray-800 rounded-md border border-gray-600">
              <h4 className="text-sm font-medium text-white mb-2">
                Package Summary
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{selectedPackage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>{selectedPackage.sessions_count} sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{selectedCurrency.code} - {selectedCurrency.name}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </BaseModal.Content>

      <BaseModal.Footer>
        <BaseButton
          variant="outline"
          onClick={handleClose}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          onClick={handleSubmit}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {mode === 'create' ? 'Create Price' : 'Update Price'}
        </BaseButton>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default PackagePriceModal;
