'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Clock, ShoppingCart, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';


interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  features: string[];
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

export default function PurchasePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);

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

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedPaymentMethod) {
      toast.error('Please select a package and payment method');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/client/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethodId: selectedPaymentMethod,
          quantity: quantity
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Purchase completed successfully!');
        // Reset form
        setSelectedPackage(null);
        setSelectedPaymentMethod('');
        setQuantity(1);
      } else {
        toast.error(result.error || 'Failed to complete purchase');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Purchase Packages</h1>
        <p className="text-gray-400 mt-2">Choose a package and complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Package Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Select Package</h2>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`cursor-pointer transition-all ${
                  selectedPackage?.id === pkg.id 
                    ? 'ring-2 ring-[#ffd700] bg-[#1a1a2e]' 
                    : 'bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50'
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-[#ffd700]" />
                      <CardTitle className="text-lg text-white">{pkg.name}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#ffd700]">${pkg.price}</div>
                      <div className="text-sm text-gray-400">USD</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-300 text-sm">{pkg.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{pkg.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>1 person</span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Purchase Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Complete Purchase</h2>
          
          {selectedPackage && (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Package:</span>
                  <span className="text-white font-medium">{selectedPackage.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Price:</span>
                  <span className="text-[#ffd700] font-bold">${selectedPackage.price}</span>
                </div>

                <div className="flex justify-between items-center">
                  <Label htmlFor="quantity" className="text-gray-300">Quantity:</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 bg-[#16213e] border-[#0a0a23] text-white text-center"
                  />
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-[#ffd700]">${(selectedPackage.price * quantity).toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="payment-method" className="text-gray-300">Payment Method:</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={!selectedPaymentMethod || processing}
                  className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                >
                  {processing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Complete Purchase</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
