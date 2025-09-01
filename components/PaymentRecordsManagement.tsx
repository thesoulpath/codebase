'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, DollarSign, Calendar, User, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentRecord, PaymentMethod, PaymentStatus, PaymentFilters } from '@/lib/types';
import { useAuth } from '../hooks/useAuth';


interface PaymentRecordFormData {
  clientEmail: string;
  userPackageId?: number;
  groupBookingId?: number;
  sessionUsageId?: number;
  amount: number;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string;
  notes: string;
  paymentDate: string;
}

const PaymentRecordsManagement: React.FC = () => {
  const { user } = useAuth();
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null);
  const [formData, setFormData] = useState<PaymentRecordFormData>({
    clientEmail: '',
    userPackageId: undefined,
    groupBookingId: undefined,
    sessionUsageId: undefined,
    amount: 0,
    currencyCode: 'USD',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    transactionId: '',
    notes: '',
    paymentDate: ''
  });
  const [filters, setFilters] = useState<PaymentFilters>({
    clientEmail: '',
    paymentMethod: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: undefined,
    amountMax: undefined
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    console.log('🔐 PaymentRecordsManagement: User auth state changed:', {
      hasUser: !!user,
      hasToken: !!user?.access_token,
      userEmail: user?.email
    });
    
    if (user?.access_token) {
      fetchPaymentRecords();
    }
  }, [user?.access_token]);

  useEffect(() => {
    if (user?.access_token) {
      fetchPaymentRecords();
    }
  }, [filters.clientEmail, filters.paymentMethod, filters.paymentStatus, filters.dateFrom, filters.dateTo, filters.amountMin, filters.amountMax, pagination.page, user?.access_token]);

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      const authToken = user?.access_token;
      if (!authToken) {
        console.error('No auth token available for fetching payment records');
        return;
      }

      console.log('🔐 Fetching payment records with auth token:', authToken.substring(0, 10) + '...');

      const params = new URLSearchParams();
      
      // Add filters
      if (filters.clientEmail) params.append('clientEmail', filters.clientEmail);
      if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);
      if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.amountMin !== undefined) params.append('amountMin', filters.amountMin.toString());
      if (filters.amountMax !== undefined) params.append('amountMax', filters.amountMax.toString());
      
      // Add pagination
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const url = `/api/admin/payments?${params}`;
      console.log('🌐 Making request to:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch payment records: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Payment records fetched successfully:', result);
      
      setPaymentRecords(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('❌ Error fetching payment records:', error);
      toast.error('Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const authToken = user?.access_token;
      if (!authToken) {
        toast.error('Authentication required');
        return;
      }

      const url = editingRecord 
        ? '/api/admin/payments' 
        : '/api/admin/payments';
      
      const method = editingRecord ? 'PUT' : 'POST';
      const body = editingRecord 
        ? { id: editingRecord.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save payment record');

      toast.success(editingRecord ? 'Payment record updated' : 'Payment record created');
      setShowCreateModal(false);
      setEditingRecord(null);
      resetForm();
      fetchPaymentRecords();
    } catch (error) {
      console.error('Error saving payment record:', error);
      toast.error('Failed to save payment record');
    }
  };

  const handleEdit = (record: PaymentRecord) => {
    setEditingRecord(record);
    setFormData({
      clientEmail: record.clientEmail,
      userPackageId: record.userPackageId,
      groupBookingId: record.groupBookingId,
      sessionUsageId: record.sessionUsageId,
      amount: record.amount,
      currencyCode: record.currencyCode,
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus,
      transactionId: record.transactionId || '',
      notes: record.notes || '',
      paymentDate: record.paymentDate || ''
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;

    try {
      const authToken = user?.access_token;
      if (!authToken) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/payments?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete payment record');

      toast.success('Payment record deleted');
      fetchPaymentRecords();
    } catch (error) {
      console.error('Error deleting payment record:', error);
      toast.error('Failed to delete payment record');
    }
  };

  const resetForm = () => {
    setFormData({
      clientEmail: '',
      userPackageId: undefined,
      groupBookingId: undefined,
      sessionUsageId: undefined,
      amount: 0,
      currencyCode: 'USD',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      transactionId: '',
      notes: '',
      paymentDate: ''
    });
  };

  const clearFilters = () => {
    setFilters({
      clientEmail: '',
      paymentMethod: 'all',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: undefined,
      amountMax: undefined
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'bank_transfer': return <Package className="h-4 w-4" />;
      case 'qr_payment': return <Package className="h-4 w-4" />;
      case 'credit_card': return <Package className="h-4 w-4" />;
      case 'crypto': return <Package className="h-4 w-4" />;
      case 'pay_later': return <Calendar className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="dashboard-container p-6">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner">Loading payment records...</div>
        </div>
      </div>
    );
  }

  if (!user?.access_token) {
    return (
      <div className="dashboard-container p-6">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner">Authentication required...</div>
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Debug Info:</h3>
          <p>User: {user ? 'Yes' : 'No'}</p>
          <p>Access Token: {user?.access_token ? 'Yes' : 'No'}</p>
          <p>User Email: {user?.email || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-text-primary text-3xl font-bold tracking-tight">
            Payment Records
          </h2>
          <p className="dashboard-text-secondary">
            Track and manage all payment transactions for packages and bookings
          </p>
        </div>
        <div className="flex gap-2">
          <BaseButton 
            onClick={() => {
              console.log('🧪 Manual test button clicked');
              if (user?.access_token) {
                console.log('🔐 Testing with token:', user.access_token.substring(0, 10) + '...');
                fetchPaymentRecords();
              } else {
                console.log('❌ No auth token available');
              }
            }} 
            className="dashboard-button-outline"
          >
            🧪 Test Fetch
          </BaseButton>
          <BaseButton 
            onClick={() => setShowCreateModal(true)} 
            className="dashboard-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Record
          </BaseButton>
        </div>
      </div>

      {/* Filters */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="dashboard-filter-grid">
            <div className="dashboard-filter-item">
              <Label htmlFor="client_email" className="dashboard-filter-label">Client Email</Label>
              <BaseInput
                id="client_email"
                placeholder="Filter by email"
                value={filters.clientEmail || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, clientEmail: e.target.value }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="payment_method" className="dashboard-filter-label">Payment Method</Label>
              <Select 
                value={filters.paymentMethod} 
                onValueChange={(value: PaymentMethod | 'all') => setFilters(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All payment methods" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All methods</SelectItem>
                  <SelectItem value="cash" className="dashboard-dropdown-item">Cash</SelectItem>
                  <SelectItem value="bank_transfer" className="dashboard-dropdown-item">Bank Transfer</SelectItem>
                  <SelectItem value="qr_payment" className="dashboard-dropdown-item">QR Payment</SelectItem>
                  <SelectItem value="credit_card" className="dashboard-dropdown-item">Credit Card</SelectItem>
                  <SelectItem value="crypto" className="dashboard-dropdown-item">Cryptocurrency</SelectItem>
                  <SelectItem value="pay_later" className="dashboard-dropdown-item">Pay Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="payment_status" className="dashboard-filter-label">Payment Status</Label>
              <Select 
                value={filters.paymentStatus} 
                onValueChange={(value: PaymentStatus | 'all') => setFilters(prev => ({ ...prev, paymentStatus: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All statuses</SelectItem>
                  <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                  <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                  <SelectItem value="failed" className="dashboard-dropdown-item">Failed</SelectItem>
                  <SelectItem value="refunded" className="dashboard-dropdown-item">Refunded</SelectItem>
                  <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="date_from" className="dashboard-filter-label">From Date</Label>
              <BaseInput
                id="date_from"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="date_to" className="dashboard-filter-label">To Date</Label>
              <BaseInput
                id="date_to"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="amount_min" className="dashboard-filter-label">Min Amount</Label>
              <BaseInput
                id="amount_min"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMin || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="amount_max" className="dashboard-filter-label">Max Amount</Label>
              <BaseInput
                id="amount_max"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMax || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="dashboard-input"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <BaseButton onClick={fetchPaymentRecords} className="dashboard-button-primary">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </BaseButton>
            <BaseButton 
              onClick={clearFilters}
              className="dashboard-button-outline"
            >
              Clear Filters
            </BaseButton>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Payment Records</CardTitle>
          <CardDescription className="dashboard-card-description">
            All payment transactions and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentRecords.map((record) => (
              <div key={record.id} className="border border-[#C0C0C0]/20 rounded-lg p-4 space-y-3 bg-[#191970]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 dashboard-text-muted" />
                      <span className="dashboard-text-primary font-medium">
                        {record.client?.email || record.clientEmail || 'Unknown Client'}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`dashboard-badge ${getPaymentStatusColor(record.paymentStatus)}`}
                    >
                      {record.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <BaseButton
                      size="sm"
                      onClick={() => handleEdit(record)}
                      className="dashboard-button-outline"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </BaseButton>
                    <BaseButton
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="dashboard-button-danger"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </BaseButton>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 dashboard-text-muted" />
                    <span className="dashboard-text-primary">
                      {formatCurrency(record.amount, record.currencyCode)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(record.paymentMethod)}
                    <span className="dashboard-text-primary capitalize">
                      {record.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 dashboard-text-muted" />
                    <span className="dashboard-text-primary">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 dashboard-text-muted" />
                    <span className="dashboard-text-primary">
                      {record.userPackage ? 'Package Purchase' : 
                       record.groupBooking ? 'Group Booking' : 
                       record.sessionUsage ? 'Session Usage' : 'Other'}
                    </span>
                  </div>
                </div>

                {record.transactionId && (
                  <div className="flex items-center gap-2">
                    <span className="dashboard-text-secondary text-sm">Transaction ID:</span>
                    <span className="dashboard-text-primary font-mono text-sm">{record.transactionId}</span>
                  </div>
                )}

                {record.notes && (
                  <div className="dashboard-text-muted text-sm">
                    <strong>Notes:</strong> {record.notes}
                  </div>
                )}

                {record.paymentDate && (
                  <div className="dashboard-text-muted text-xs">
                    Payment Date: {formatDate(record.paymentDate)}
                  </div>
                )}
              </div>
            ))}

            {paymentRecords.length === 0 && (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">No payment records found</div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="dashboard-text-secondary text-sm">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <BaseButton
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="dashboard-button-outline"
                >
                  Previous
                </BaseButton>
                <BaseButton
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="dashboard-button-outline"
                >
                  Next
                </BaseButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="dashboard-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="dashboard-card-title">
                {editingRecord ? 'Edit Payment Record' : 'Add Payment Record'}
              </CardTitle>
              <CardDescription className="dashboard-card-description">
                Create or update payment transaction details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="dashboard-filter-label">Client Email *</Label>
                    <BaseInput
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="client@example.com"
                      className="dashboard-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="dashboard-filter-label">Amount *</Label>
                    <BaseInput
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="dashboard-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currencyCode" className="dashboard-filter-label">Currency *</Label>
                    <Select 
                      value={formData.currencyCode} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currencyCode: value }))}
                    >
                      <SelectTrigger className="dashboard-select">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="dashboard-dropdown-content">
                        <SelectItem value="USD" className="dashboard-dropdown-item">USD</SelectItem>
                        <SelectItem value="EUR" className="dashboard-dropdown-item">EUR</SelectItem>
                        <SelectItem value="PEN" className="dashboard-dropdown-item">PEN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="dashboard-filter-label">Payment Method *</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value: PaymentMethod) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger className="dashboard-select">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="dashboard-dropdown-content">
                        <SelectItem value="cash" className="dashboard-dropdown-item">Cash</SelectItem>
                        <SelectItem value="bank_transfer" className="dashboard-dropdown-item">Bank Transfer</SelectItem>
                        <SelectItem value="qr_payment" className="dashboard-dropdown-item">QR Payment</SelectItem>
                        <SelectItem value="credit_card" className="dashboard-dropdown-item">Credit Card</SelectItem>
                        <SelectItem value="crypto" className="dashboard-dropdown-item">Cryptocurrency</SelectItem>
                        <SelectItem value="pay_later" className="dashboard-dropdown-item">Pay Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus" className="dashboard-filter-label">Payment Status *</Label>
                    <Select 
                      value={formData.paymentStatus} 
                      onValueChange={(value: PaymentStatus) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger className="dashboard-select">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="dashboard-dropdown-content">
                        <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                        <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                        <SelectItem value="failed" className="dashboard-dropdown-item">Failed</SelectItem>
                        <SelectItem value="refunded" className="dashboard-dropdown-item">Refunded</SelectItem>
                        <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDate" className="dashboard-filter-label">Payment Date</Label>
                    <BaseInput
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="dashboard-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionId" className="dashboard-filter-label">Transaction ID</Label>
                  <BaseInput
                    id="transactionId"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Transaction reference number"
                    className="dashboard-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="dashboard-filter-label">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this payment"
                    className="dashboard-input"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <BaseButton type="submit" className="dashboard-button-primary flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    {editingRecord ? 'Update' : 'Create'}
                  </BaseButton>
                  <BaseButton
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingRecord(null);
                      resetForm();
                    }}
                    className="dashboard-button-outline"
                  >
                    Cancel
                  </BaseButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentRecordsManagement;
