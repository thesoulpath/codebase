'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BaseModal } from '@/components/ui/BaseModal';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { colors, spacing, typography } from '@/lib/design-system';

interface Currency {
  id: number;
  code: string;
  symbol: string;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  currency_id: number;
  created_at: string;
  updated_at: string;
  currencies: Currency;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    currency_id: ''
  });

  // Fetch payment methods and currencies
  useEffect(() => {
    fetchPaymentMethods();
    fetchCurrencies();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods');
      const result = await response.json();
      
      if (result.success) {
        setPaymentMethods(result.data);
      } else {
        toast.error('Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/admin/currencies');
      const result = await response.json();
      
      if (result.success) {
        setCurrencies(result.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment method created successfully');
        setIsCreateModalOpen(false);
        resetForm();
        fetchPaymentMethods();
      } else {
        toast.error(result.message || 'Failed to create payment method');
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      toast.error('Failed to create payment method');
    }
  };

  const handleUpdate = async () => {
    if (!editingPaymentMethod) return;
    
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${editingPaymentMethod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment method updated successfully');
        setIsEditModalOpen(false);
        resetForm();
        setEditingPaymentMethod(null);
        fetchPaymentMethods();
      } else {
        toast.error(result.message || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment method deleted successfully');
        fetchPaymentMethods();
      } else {
        toast.error(result.message || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      currency_id: ''
    });
  };

  const openEditModal = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      name: paymentMethod.name,
      description: paymentMethod.description || '',
      is_active: paymentMethod.is_active,
      currency_id: paymentMethod.currency_id.toString()
    });
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] text-[${colors.text.secondary}]`}>
        Loading payment methods...
      </div>
    );
  }

  return (
    <div className={`space-y-[${spacing[6]}]`}>
      {/* Header */}
      <div className={`flex items-center justify-between`}>
        <div>
          <h1 className={`text-[${typography.fontSize['3xl']}] font-[${typography.fontWeight.bold}] text-[${colors.text.primary}]`}>
            Payment Methods
          </h1>
          <p className={`text-[${colors.text.secondary}] mt-[${spacing[2]}]`}>
            Manage payment methods and their associated currencies
          </p>
        </div>
        <BaseButton
          onClick={openCreateModal}
          variant="primary"
          size="lg"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Payment Method
        </BaseButton>
      </div>

      {/* Payment Methods Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[${spacing[6]}]`}>
        {paymentMethods.map((method) => (
          <Card key={method.id} className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
            <CardHeader className={`pb-[${spacing[3]}]`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-[${typography.fontSize.lg}] text-[${colors.text.primary}]`}>
                  {method.name}
                </CardTitle>
                <Badge 
                  variant={method.is_active ? "default" : "secondary"}
                  className={method.is_active ? `bg-[${colors.status.success}] text-white` : `bg-[${colors.status.error}] text-white`}
                >
                  {method.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {method.description && (
                <p className={`text-[${colors.text.secondary}] text-[${typography.fontSize.sm}]`}>
                  {method.description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className={`space-y-[${spacing[4]}]`}>
              <div className={`flex items-center space-x-[${spacing[2]}] text-[${colors.text.secondary}]`}>
                <DollarSign className="w-4 h-4" />
                <span className={`text-[${typography.fontSize.sm}]`}>
                  {method.currencies.symbol} {method.currencies.code} - {method.currencies.name}
                </span>
              </div>
              
              <div className={`flex items-center space-x-[${spacing[2]}] text-[${colors.text.secondary}]`}>
                <CreditCard className="w-4 h-4" />
                <span className={`text-[${typography.fontSize.sm}]`}>
                  Created: {new Date(method.created_at).toLocaleDateString()}
                </span>
              </div>

              <Separator className={`bg-[${colors.border[500]}]/20`} />

              <div className={`flex space-x-[${spacing[2]}]`}>
                <BaseButton
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(method)}
                  className="flex-1"
                  leftIcon={<Edit className="w-4 h-4" />}
                >
                  Edit
                </BaseButton>
                <BaseButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(method.id)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </BaseButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <BaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Payment Method"
        description="Create a new payment method with its associated currency"
        size="lg"
        variant="default"
      >
        <BaseModal.Content>
          <div className={`space-y-[${spacing[4]}]`}>
            <div>
              <Label htmlFor="name" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Name *
              </Label>
              <BaseInput
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card, PayPal"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}] placeholder:text-[${colors.text.tertiary}]`}
              />
            </div>

            <div>
              <Label htmlFor="currency" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Currency *
              </Label>
              <Select value={formData.currency_id} onValueChange={(value) => setFormData({ ...formData, currency_id: value })}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className={`bg-[${colors.semantic.surface.secondary}] border-[${colors.border[500]}]`}>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()} className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
              />
              <Label htmlFor="is_active" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Active
              </Label>
            </div>
          </div>
        </BaseModal.Content>

        <BaseModal.Footer>
          <BaseButton
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </BaseButton>
          <BaseButton
            onClick={handleCreate}
            disabled={!formData.name || !formData.currency_id}
            variant="primary"
          >
            Create
          </BaseButton>
        </BaseModal.Footer>
      </BaseModal>

      {/* Edit Modal */}
      <BaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Payment Method"
        description="Update the payment method configuration"
        size="lg"
        variant="default"
      >
        <BaseModal.Content>
          <div className={`space-y-[${spacing[4]}]`}>
            <div>
              <Label htmlFor="edit-name" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Name *
              </Label>
              <BaseInput
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card, PayPal"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}] placeholder:text-[${colors.text.tertiary}]`}
              />
            </div>

            <div>
              <Label htmlFor="edit-currency" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Currency *
              </Label>
              <Select value={formData.currency_id} onValueChange={(value) => setFormData({ ...formData, currency_id: value })}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className={`bg-[${colors.semantic.surface.secondary}] border-[${colors.border[500]}]`}>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()} className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
              />
              <Label htmlFor="edit-is_active" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Active
              </Label>
            </div>
          </div>
        </BaseModal.Content>

        <BaseModal.Footer>
          <BaseButton
            variant="outline"
            onClick={() => setIsEditModalOpen(false)}
          >
            Cancel
          </BaseButton>
          <BaseButton
            onClick={handleUpdate}
            disabled={!formData.name || !formData.currency_id}
            variant="primary"
          >
            Update
          </BaseButton>
        </BaseModal.Footer>
      </BaseModal>
    </div>
  );
}
