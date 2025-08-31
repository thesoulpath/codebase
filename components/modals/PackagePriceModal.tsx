'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, Globe, Save, X, Info, Package } from 'lucide-react';
import { toast } from 'sonner';

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
  const [basePrice, setBasePrice] = useState<number | null>(null);
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
    setBasePrice(null);
    setCalculatedPrice(null);
    setExchangeRate(null);
  };

  const calculatePrice = async () => {
    if (!formData.package_definition_id || !formData.currency_id) return;

    try {
      // Get the base currency (USD)
      const baseCurrency = currencies.find(c => c.is_default);
      if (!baseCurrency) {
        toast.error('No default currency found');
        return;
      }

      // Get the base price for this package
      const response = await fetch(`/api/admin/package-prices?package_definition_id=${formData.package_definition_id}&currency_id=${baseCurrency.id}&pricing_mode=custom&is_active=true`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const basePriceData = data.data[0];
        setBasePrice(basePriceData.price);

        // Get target currency
        const targetCurrency = currencies.find(c => c.id.toString() === formData.currency_id);
        if (targetCurrency) {
          const calculated = basePriceData.price * (targetCurrency.exchange_rate / baseCurrency.exchange_rate);
          setCalculatedPrice(Math.round(calculated * 100) / 100);
          setExchangeRate(targetCurrency.exchange_rate / baseCurrency.exchange_rate);
          
          // Update the price field with calculated value
          setFormData(prev => ({ ...prev, price: calculated.toFixed(2) }));
        }
      } else {
        setBasePrice(null);
        setCalculatedPrice(null);
        setExchangeRate(null);
        toast.warning('No base price found for this package. Please create a price in the base currency first.');
      }
    } catch (error) {
      console.error('Error calculating price:', error);
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

    if (formData.pricing_mode === 'custom' && (!formData.price || parseFloat(formData.price) <= 0)) {
      newErrors.price = 'Price must be a positive number for custom pricing';
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
      package_definition_id: parseInt(formData.package_definition_id),
      currency_id: parseInt(formData.currency_id),
      price: parseFloat(formData.price)
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePricingModeChange = (mode: 'custom' | 'calculated') => {
    setFormData(prev => ({ ...prev, pricing_mode: mode }));
    
    if (mode === 'calculated') {
      calculatePrice();
    } else {
      setFormData(prev => ({ ...prev, price: '' }));
      setCalculatedPrice(null);
      setExchangeRate(null);
    }
  };

  const selectedPackage = packageDefinitions.find(p => p.id.toString() === formData.package_definition_id);
  const selectedCurrency = currencies.find(c => c.id.toString() === formData.currency_id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dashboard-modal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="dashboard-modal-title">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {mode === 'create' ? 'Create New Price' : 'Edit Package Price'}
            </div>
          </DialogTitle>
          <DialogDescription className="dashboard-modal-description">
            {mode === 'create' 
              ? 'Set pricing for a package in a specific currency'
              : 'Update the package pricing configuration'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Package Definition *</Label>
              <Select
                value={formData.package_definition_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, package_definition_id: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  {packageDefinitions.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()} className="dashboard-dropdown-item">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {pkg.name} ({pkg.sessions_count} sessions)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.package_definition_id && <p className="text-red-500 text-sm">{errors.package_definition_id}</p>}
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Currency *</Label>
              <Select
                value={formData.currency_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency_id: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()} className="dashboard-dropdown-item">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {currency.code} - {currency.name}
                        {currency.is_default && <Badge className="dashboard-badge-info">Default</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency_id && <p className="text-red-500 text-sm">{errors.currency_id}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Pricing Mode *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="calculated"
                    name="pricing_mode"
                    value="calculated"
                    checked={formData.pricing_mode === 'calculated'}
                    onChange={() => handlePricingModeChange('calculated')}
                    className="dashboard-radio"
                  />
                  <Label htmlFor="calculated" className="dashboard-label cursor-pointer">
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
                    className="dashboard-radio"
                  />
                  <Label htmlFor="custom" className="dashboard-label cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Custom Price
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {formData.pricing_mode === 'calculated' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800 font-medium">Automatic Price Calculation</p>
                    {basePrice && calculatedPrice && exchangeRate && (
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>Base Price (USD): ${basePrice.toFixed(2)}</p>
                        <p>Exchange Rate: {exchangeRate.toFixed(4)}</p>
                        <p className="font-semibold">Calculated Price: {selectedCurrency?.symbol}{calculatedPrice.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="dashboard-label">Price *</Label>
              <Input
                className={`dashboard-input ${errors.price ? 'border-red-500' : ''}`}
                type="number"
                step="0.01"
                min="0"
                placeholder={formData.pricing_mode === 'calculated' ? 'Auto-calculated' : 'Enter price'}
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                disabled={formData.pricing_mode === 'calculated'}
              />
              {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
              {formData.pricing_mode === 'calculated' && (
                <p className="text-sm text-gray-600">
                  Price is automatically calculated based on exchange rates
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active" className="dashboard-label">Active Price</Label>
          </div>

          {selectedPackage && selectedCurrency && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Price Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Package:</span> {selectedPackage.name}
                </div>
                <div>
                  <span className="font-medium">Currency:</span> {selectedCurrency.code} ({selectedCurrency.symbol})
                </div>
                <div>
                  <span className="font-medium">Sessions:</span> {selectedPackage.sessions_count}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedPackage.package_type}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="dashboard-button-outline"
              onClick={handleClose}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="dashboard-button-primary">
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create Price' : 'Update Price'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackagePriceModal;
