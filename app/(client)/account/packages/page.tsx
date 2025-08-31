'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageIcon, CalendarIcon, ShoppingCart } from 'lucide-react';

import Link from 'next/link';

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/client/packages');
      const result = await response.json();
      
      if (result.success) {
        setPackages(result.data);
      } else {
        console.error('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-white">Available Packages</h1>
        <p className="text-gray-400 mt-2">Choose the perfect package for your spiritual journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="bg-[#1a1a2e] border-[#16213e] text-white hover:border-[#ffd700]/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <PackageIcon className="w-5 h-5 text-[#ffd700]" />
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#ffd700]">${pkg.price}</div>
                  <div className="text-sm text-gray-400">USD</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">{pkg.description}</p>
              
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{pkg.duration_minutes} minutes</span>
              </div>

              {pkg.features && pkg.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Features:</h4>
                  <ul className="space-y-1">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-300">• {feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <Link href={`/account/purchase?package=${pkg.id}`}>
                  <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase Package
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
