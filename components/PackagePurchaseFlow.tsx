'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Users, 
  Star,
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Zap,
  Gift,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BaseButton } from './ui/BaseButton';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
// import { loadStripe } from '@stripe/stripe-js'; // Unused for now

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  sessions_count: number;
  features: string[];
  is_popular?: boolean;
  is_featured?: boolean;
  discount_percentage?: number;
  original_price?: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  currencies: {
    symbol: string;
    code: string;
  };
}

interface PurchaseStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function PackagePurchaseFlow() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  // const [purchaseComplete, setPurchaseComplete] = useState(false); // Unused for now
  // const [orderDetails, setOrderDetails] = useState<any>(null); // Unused for now

  const steps: PurchaseStep[] = [
    { id: 'package', title: 'Select Package', description: 'Choose your spiritual journey package', completed: false },
    { id: 'payment', title: 'Payment Details', description: 'Complete your purchase securely', completed: false },
    { id: 'confirmation', title: 'Order Confirmation', description: 'Review your order details', completed: false }
  ];

  useEffect(() => {
    fetchPackages();
    fetchPaymentMethods();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/client/packages');
      const result = await response.json();
      
      if (result.success) {
        setPackages(result.data);
      } else {
        toast.error('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to fetch packages');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/client/payment-methods');
      const result = await response.json();
      
      if (result.success) {
        setPaymentMethods(result.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setQuantity(1);
    setCurrentStep(1);
    updateStepCompletion(0, true);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const updateStepCompletion = (stepIndex: number, completed: boolean) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].completed = completed;
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedPaymentMethod) {
      toast.error('Please select a package and payment method');
      return;
    }

    setProcessing(true);

    try {
      // Create checkout session with Stripe
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethodId: selectedPaymentMethod,
          quantity: quantity,
          successUrl: `${window.location.origin}/account/purchase/success`,
          cancelUrl: `${window.location.origin}/account/purchase/cancel`
        })
      });

      const result = await response.json();
      
      if (result.success && result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
      } else {
        toast.error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToPackages = () => {
    setCurrentStep(0);
    setSelectedPackage(null);
    setSelectedPaymentMethod('');
    setQuantity(1);
  };

  const calculateTotal = () => {
    if (!selectedPackage) return 0;
    // const basePrice = selectedPackage.original_price || selectedPackage.price; // Unused for now
    const discountedPrice = selectedPackage.price;
    return discountedPrice * quantity;
  };

  const calculateSavings = () => {
    if (!selectedPackage || !selectedPackage.original_price) return 0;
    return (selectedPackage.original_price - selectedPackage.price) * quantity;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Package</h1>
        <p className="text-gray-400">Select the perfect package for your spiritual journey</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentStep 
                ? 'border-[#ffd700] bg-[#ffd700] text-black' 
                : 'border-gray-600 text-gray-400'
            }`}>
              {step.completed ? (
                <CheckCircle size={20} />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                index < currentStep ? 'bg-[#ffd700]' : 'bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div
            key="packages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Package Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`relative cursor-pointer transition-all ${
                    selectedPackage?.id === pkg.id 
                      ? 'ring-2 ring-[#ffd700] bg-[#1a1a2e]' 
                      : 'bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50'
                  }`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-[#ffd700] text-black px-3 py-1">
                        <Star size={12} className="mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {pkg.discount_percentage && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-red-500 text-white px-2 py-1 text-xs">
                        -{pkg.discount_percentage}%
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-[#ffd700]" />
                        <CardTitle className="text-lg text-white">{pkg.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">{pkg.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{pkg.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{pkg.sessions_count} sessions</span>
                      </div>
                    </div>

                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Features:</h4>
                        <ul className="space-y-1">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                              <CheckCircle className="w-3 h-3 text-[#ffd700]" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        {pkg.original_price && pkg.original_price > pkg.price ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-[#ffd700]">
                              {formatCurrency(pkg.price)}
                            </span>
                            <span className="text-gray-400 line-through">
                              {formatCurrency(pkg.original_price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-[#ffd700]">
                            {formatCurrency(pkg.price)}
                          </span>
                        )}
                        <span className="text-sm text-gray-400">USD</span>
                      </div>
                      
                      <BaseButton 
                        className="w-full dashboard-button-primary"
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        Select Package
                        <ArrowRight size={16} className="ml-2" />
                      </BaseButton>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 1 && selectedPackage && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Form */}
              <div className="space-y-6">
                <Card className="bg-[#1a1a2e] border-[#16213e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CreditCard size={20} className="mr-2 text-[#ffd700]" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="payment-method" className="text-gray-300">Payment Method</Label>
                      <Select value={selectedPaymentMethod} onValueChange={handlePaymentMethodSelect}>
                        <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <span>{method.name}</span>
                                {method.currencies && (
                                  <span className="text-gray-400">({method.currencies.symbol})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantity" className="text-gray-300">Quantity</Label>
                      <div className="flex items-center space-x-3">
                        <BaseButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                        >
                          -
                        </BaseButton>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max="10"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="w-20 bg-[#16213e] border-[#0a0a23] text-white text-center"
                        />
                        <BaseButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= 10}
                          className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                        >
                          +
                        </BaseButton>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Shield size={16} />
                      <span>Your payment information is secure and encrypted</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-3">
                  <BaseButton
                    variant="outline"
                    onClick={handleBackToPackages}
                    className="flex-1 border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Packages
                  </BaseButton>
                  <BaseButton
                    onClick={handlePurchase}
                    disabled={!selectedPaymentMethod || processing}
                    className="flex-1 dashboard-button-primary"
                  >
                    {processing ? (
                      <div className="flex items-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Lock size={16} />
                        <span>Complete Purchase</span>
                      </div>
                    )}
                  </BaseButton>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <Card className="bg-[#1a1a2e] border-[#16213e]">
                  <CardHeader>
                    <CardTitle className="text-white">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-[#16213e] rounded-lg">
                      <Package size={24} className="text-[#ffd700]" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{selectedPackage.name}</p>
                        <p className="text-sm text-gray-400">
                          {selectedPackage.sessions_count} sessions • {selectedPackage.duration_minutes} min each
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Package Price:</span>
                        <span className="text-white">
                          {selectedPackage.original_price && selectedPackage.original_price > selectedPackage.price ? (
                            <span className="line-through text-gray-400 mr-2">
                              {formatCurrency(selectedPackage.original_price)}
                            </span>
                          ) : null}
                          {formatCurrency(selectedPackage.price)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Quantity:</span>
                        <span className="text-white">{quantity}</span>
                      </div>

                      {selectedPackage.original_price && selectedPackage.original_price > selectedPackage.price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Savings:</span>
                          <span className="text-green-400">-{formatCurrency(calculateSavings())}</span>
                        </div>
                      )}

                      <div className="border-t border-[#2a2a4a] pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-gray-300">Total:</span>
                          <span className="text-[#ffd700]">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#2a2a4a]">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Zap size={16} />
                        <span>Instant access after payment</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Gift size={16} />
                        <span>Free consultation included</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Heart size={16} />
                        <span>30-day satisfaction guarantee</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
