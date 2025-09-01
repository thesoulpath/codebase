'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import PackageDefinitionModal from './modals/PackageDefinitionModal';
import PackagePriceModal from './modals/PackagePriceModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';


interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  exchange_rate: number;
}

interface SessionDuration {
  id: number;
  name: string;
  duration_minutes: number;
  description: string;
  is_active: boolean;
}

interface PackageDefinition {
  id: number;
  name: string;
  description: string;
  sessions_count: number;
  session_duration_id: number;
  package_type: 'individual' | 'group' | 'mixed';
  max_group_size: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  session_durations: SessionDuration;
  package_prices: PackagePrice[];
}

interface PackagePrice {
  id: number;
  package_definition_id: number;
  currency_id: number;
  price: number;
  pricing_mode: 'custom' | 'calculated';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  package_definitions: PackageDefinition;
  currencies: Currency;
}

const PackagesAndPricing: React.FC = () => {
  const { user } = useAuth();
  const [packageDefinitions, setPackageDefinitions] = useState<PackageDefinition[]>([]);
  const [packagePrices, setPackagePrices] = useState<PackagePrice[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [sessionDurations, setSessionDurations] = useState<SessionDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('definitions');
  
  // Filters
  const [definitionFilters, setDefinitionFilters] = useState({
    package_type: 'all',
    is_active: 'all',
    session_duration_id: 'all'
  });

  const [priceFilters, setPriceFilters] = useState({
    package_definition_id: 'all',
    currency_id: 'all',
    pricing_mode: 'all',
    is_active: 'all'
  });

  // Modal states
  const [showCreateDefinitionModal, setShowCreateDefinitionModal] = useState(false);
  const [showEditDefinitionModal, setShowEditDefinitionModal] = useState(false);
  const [showCreatePriceModal, setShowCreatePriceModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PackageDefinition | PackagePrice | null>(null);
  const [deleteType, setDeleteType] = useState<'definition' | 'price'>('definition');

  // Form states
  const [definitionFormData, setDefinitionFormData] = useState({
    name: '',
    description: '',
    sessions_count: '',
    session_duration_id: '',
    package_type: 'individual' as const,
    max_group_size: '',
    is_active: true
  });

  const [priceFormData, setPriceFormData] = useState({
    package_definition_id: '',
    currency_id: '',
    price: '',
    pricing_mode: 'calculated' as const,
    is_active: true
  });

  useEffect(() => {
    if (user?.access_token) {
      fetchCurrencies();
      fetchSessionDurations();
      fetchPackageDefinitions();
      fetchPackagePrices();
    }
  }, [user?.access_token]);

  const fetchPackageDefinitions = async () => {
    if (!user?.access_token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(definitionFilters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/admin/package-definitions?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setPackageDefinitions(data.data);
      } else {
        toast.error('Failed to fetch package definitions');
      }
    } catch (error) {
      toast.error('Error fetching package definitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackagePrices = async () => {
    if (!user?.access_token) return;
    
    try {
      const params = new URLSearchParams();
      
      Object.entries(priceFilters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/admin/package-prices?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setPackagePrices(data.data);
      } else {
        toast.error('Failed to fetch package prices');
      }
    } catch (error) {
      toast.error('Error fetching package prices');
    }
  };

  const fetchCurrencies = async () => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/currencies', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCurrencies(data.data);
      }
    } catch (error) {
      toast.error('Error fetching currencies');
    }
  };

  const fetchSessionDurations = async () => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/session-durations', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSessionDurations(data.data);
      }
    } catch (error) {
      toast.error('Error fetching session durations');
    }
  };

  const handleCreateDefinition = async () => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/package-definitions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...definitionFormData,
          sessions_count: parseInt(definitionFormData.sessions_count),
          session_duration_id: parseInt(definitionFormData.session_duration_id),
          max_group_size: definitionFormData.max_group_size ? parseInt(definitionFormData.max_group_size) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Package definition created successfully');
        setShowCreateDefinitionModal(false);
        resetDefinitionForm();
        fetchPackageDefinitions();
      } else {
        toast.error(data.message || 'Failed to create package definition');
      }
    } catch (error) {
      toast.error('Error creating package definition');
    }
  };

  const handleCreatePrice = async () => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/package-prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...priceFormData,
          package_definition_id: parseInt(priceFormData.package_definition_id),
          currency_id: parseInt(priceFormData.currency_id),
          price: parseFloat(priceFormData.price)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Package price created successfully');
        setShowCreatePriceModal(false);
        resetPriceForm();
        fetchPackagePrices();
      } else {
        toast.error(data.message || 'Failed to create package price');
      }
    } catch (error) {
      toast.error('Error creating package price');
    }
  };

  const handleEditDefinition = async (data: any) => {
    if (!user?.access_token || !selectedItem || 'package_prices' in selectedItem) return;
    
    try {
      const response = await fetch('/api/admin/package-definitions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedItem.id,
          ...data
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success('Package definition updated successfully');
        setShowEditDefinitionModal(false);
        setSelectedItem(null);
        fetchPackageDefinitions();
      } else {
        toast.error(responseData.message || 'Failed to update package definition');
      }
    } catch (error) {
      toast.error('Error updating package definition');
    }
  };

  const handleEditPrice = async (data: any) => {
    if (!user?.access_token || !selectedItem || !('package_prices' in selectedItem)) return;
    
    try {
      const response = await fetch('/api/admin/package-prices', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedItem.id,
          ...data
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success('Package price updated successfully');
        setShowEditPriceModal(false);
        setSelectedItem(null);
        fetchPackagePrices();
      } else {
        toast.error(responseData.message || 'Failed to update package price');
      }
    } catch (error) {
      toast.error('Error updating package price');
    }
  };

  const handleDelete = async () => {
    if (!user?.access_token || !selectedItem) return;
    
    try {
      const endpoint = deleteType === 'definition' ? 'package-definitions' : 'package-prices';
      const response = await fetch(`/api/admin/${endpoint}?id=${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${deleteType === 'definition' ? 'Package definition' : 'Package price'} deleted successfully`);
        setShowDeleteModal(false);
        setSelectedItem(null);
        if (deleteType === 'definition') {
          fetchPackageDefinitions();
        } else {
          fetchPackagePrices();
        }
      } else {
        toast.error(data.message || `Failed to delete ${deleteType}`);
      }
    } catch (error) {
      toast.error(`Error deleting ${deleteType}`);
    }
  };

  const resetDefinitionForm = () => {
    setDefinitionFormData({
      name: '',
      description: '',
      sessions_count: '',
      session_duration_id: '',
      package_type: 'individual',
      max_group_size: '',
      is_active: true
    });
  };

  const resetPriceForm = () => {
    setPriceFormData({
      package_definition_id: '',
      currency_id: '',
      price: '',
      pricing_mode: 'calculated',
      is_active: true
    });
  };

  const getPackageTypeBadge = (type: string) => {
    const variants = {
      individual: 'dashboard-badge-info',
      group: 'dashboard-badge-success',
      mixed: 'dashboard-badge-warning'
    };
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  const getPricingModeBadge = (mode: string) => {
    const variants = {
      custom: 'dashboard-badge-gold',
      calculated: 'dashboard-badge-info'
    };
    return <Badge className={variants[mode as keyof typeof variants]}>{mode}</Badge>;
  };

  if (loading) {
    return (
      <div className="dashboard-container p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-dashboard-text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Packages & Pricing</h1>
          <p className="dashboard-text-secondary">Manage package definitions and multi-currency pricing</p>
        </div>
        <div className="flex gap-2">
          <BaseButton 
            className="dashboard-button-primary"
            onClick={() => setShowCreateDefinitionModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Package
          </BaseButton>
          <BaseButton 
            variant="outline" 
            className="dashboard-button-outline"
            onClick={() => setShowCreatePriceModal(true)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            New Price
          </BaseButton>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="dashboard-tabs">
          <TabsTrigger value="definitions" className="dashboard-tab">
            <Package className="w-4 h-4 mr-2" />
            Package Definitions
          </TabsTrigger>
          <TabsTrigger value="pricing" className="dashboard-tab">
            <DollarSign className="w-4 h-4 mr-2" />
            Package Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="space-y-4">
          {/* Package Definitions Tab Content */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Package Definitions</CardTitle>
              <CardDescription className="dashboard-card-description">
                Core package configurations and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="dashboard-label">Package Type</Label>
                  <Select 
                    value={definitionFilters.package_type} 
                    onValueChange={(value) => setDefinitionFilters(prev => ({ ...prev, package_type: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Types</SelectItem>
                      <SelectItem value="individual" className="dashboard-dropdown-item">Individual</SelectItem>
                      <SelectItem value="group" className="dashboard-dropdown-item">Group</SelectItem>
                      <SelectItem value="mixed" className="dashboard-dropdown-item">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Session Duration</Label>
                  <Select 
                    value={definitionFilters.session_duration_id} 
                    onValueChange={(value) => setDefinitionFilters(prev => ({ ...prev, session_duration_id: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Durations</SelectItem>
                      {sessionDurations.map((duration) => (
                        <SelectItem key={duration.id} value={duration.id.toString()} className="dashboard-dropdown-item">
                          {duration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Status</Label>
                  <Select 
                    value={definitionFilters.is_active} 
                    onValueChange={(value) => setDefinitionFilters(prev => ({ ...prev, is_active: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Status</SelectItem>
                      <SelectItem value="true" className="dashboard-dropdown-item">Active</SelectItem>
                      <SelectItem value="false" className="dashboard-dropdown-item">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <BaseButton 
                  variant="outline" 
                  className="dashboard-button-outline"
                  onClick={fetchPackageDefinitions}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </BaseButton>
              </div>

              {/* Package Definitions Table */}
              <div className="overflow-x-auto">
                <table className="dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Sessions</th>
                      <th>Duration</th>
                      <th>Group Size</th>
                      <th>Prices</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageDefinitions.map((pkg) => (
                      <tr key={pkg.id} className="dashboard-table-row">
                        <td className="font-medium">{pkg.name}</td>
                        <td>{getPackageTypeBadge(pkg.package_type)}</td>
                        <td>{pkg.sessions_count}</td>
                        <td>{pkg.session_durations?.name || 'N/A'}</td>
                        <td>{pkg.max_group_size || '-'}</td>
                        <td>
                          <Badge className="dashboard-badge">
                            {pkg.package_prices?.length || 0} prices
                          </Badge>
                        </td>
                        <td>
                          <Badge className={pkg.is_active ? 'dashboard-badge-success' : 'dashboard-badge-error'}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-outline"
                              onClick={() => {
                                setSelectedItem(pkg);
                                setShowEditDefinitionModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </BaseButton>
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-danger"
                              onClick={() => {
                                setSelectedItem(pkg);
                                setDeleteType('definition');
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </BaseButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          {/* Package Pricing Tab Content */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Package Pricing</CardTitle>
              <CardDescription className="dashboard-card-description">
                Multi-currency pricing with custom and calculated modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="dashboard-label">Package</Label>
                  <Select 
                    value={priceFilters.package_definition_id} 
                    onValueChange={(value) => setPriceFilters(prev => ({ ...prev, package_definition_id: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Packages</SelectItem>
                      {packageDefinitions.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()} className="dashboard-dropdown-item">
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Currency</Label>
                  <Select 
                    value={priceFilters.currency_id} 
                    onValueChange={(value) => setPriceFilters(prev => ({ ...prev, currency_id: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Currencies</SelectItem>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id.toString()} className="dashboard-dropdown-item">
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Pricing Mode</Label>
                  <Select 
                    value={priceFilters.pricing_mode} 
                    onValueChange={(value) => setPriceFilters(prev => ({ ...prev, pricing_mode: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Modes</SelectItem>
                      <SelectItem value="custom" className="dashboard-dropdown-item">Custom</SelectItem>
                      <SelectItem value="calculated" className="dashboard-dropdown-item">Calculated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <BaseButton 
                  variant="outline" 
                  className="dashboard-button-outline"
                  onClick={fetchPackagePrices}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </BaseButton>
              </div>

              {/* Package Prices Table */}
              <div className="overflow-x-auto">
                <table className="dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Package</th>
                      <th>Currency</th>
                      <th>Price</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packagePrices.map((price) => (
                      <tr key={price.id} className="dashboard-table-row">
                        <td className="font-medium">{price.package_definitions.name}</td>
                        <td>
                          <Badge className="dashboard-badge">
                            {price.currencies.code} {price.currencies.symbol}
                          </Badge>
                        </td>
                        <td className="font-mono">
                          {price.currencies.symbol}{price.price.toFixed(2)}
                        </td>
                        <td>{getPricingModeBadge(price.pricing_mode)}</td>
                        <td>
                          <Badge className={price.is_active ? 'dashboard-badge-success' : 'dashboard-badge-error'}>
                            {price.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-outline"
                              onClick={() => {
                                setSelectedItem(price);
                                setShowEditPriceModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </BaseButton>
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-danger"
                              onClick={() => {
                                setSelectedItem(price);
                                setDeleteType('price');
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </BaseButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PackageDefinitionModal
        isOpen={showCreateDefinitionModal}
        onClose={() => setShowCreateDefinitionModal(false)}
        onSubmit={handleCreateDefinition}
        sessionDurations={sessionDurations}
        mode="create"
      />

      <PackageDefinitionModal
        isOpen={showEditDefinitionModal}
        onClose={() => setShowEditDefinitionModal(false)}
        onSubmit={handleEditDefinition}
        packageDefinition={selectedItem && !('package_prices' in selectedItem) ? selectedItem as unknown as PackageDefinition : null}
        sessionDurations={sessionDurations}
        mode="edit"
      />

      <PackagePriceModal
        isOpen={showCreatePriceModal}
        onClose={() => setShowCreatePriceModal(false)}
        onSubmit={handleCreatePrice}
        packageDefinitions={packageDefinitions}
        currencies={currencies}
        mode="create"
      />

      <PackagePriceModal
        isOpen={showEditPriceModal}
        onClose={() => setShowEditPriceModal(false)}
        onSubmit={handleEditPrice}
        packagePrice={selectedItem && 'package_prices' in selectedItem ? selectedItem as unknown as PackagePrice : null}
        packageDefinitions={packageDefinitions}
        currencies={currencies}
        mode="edit"
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'definition' ? 'Package Definition' : 'Package Price'}`}
        description={`Are you sure you want to delete this ${deleteType === 'definition' ? 'package definition' : 'package price'}?`}
        itemName={selectedItem ? ('package_prices' in selectedItem ? (selectedItem as unknown as PackagePrice).package_definitions.name : (selectedItem as unknown as PackageDefinition).name) : undefined}
        itemType={deleteType}
      />
    </div>
  );
};

export default PackagesAndPricing;
