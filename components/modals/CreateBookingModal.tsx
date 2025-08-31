'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
}

interface UserPackage {
  id: number;
  sessions_remaining: number;
  sessions_used: number;
  is_active: boolean;
  package_definition: {
    id: number;
    name: string;
    description: string;
    sessions_count: number;
    package_type: 'individual' | 'group' | 'mixed';
    max_group_size: number;
    session_durations: {
      id: number;
      name: string;
      duration_minutes: number;
    };
  };
  package_price: {
    id: number;
    price: number;
    pricing_mode: 'custom' | 'calculated';
    currencies: {
      id: number;
      code: string;
      name: string;
      symbol: string;
    };
  };
}

interface ScheduleSlot {
  id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  schedule_templates: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    session_durations: {
      id: number;
      name: string;
      duration_minutes: number;
    };
  };
}

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSuccess: () => void;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    user_package_id: '',
    schedule_slot_id: '',
    booking_type: 'individual' as 'individual' | 'group',
    group_size: 1,
    notes: '',
    total_amount: '',
    discount_amount: '0'
  });

  // Available data
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<UserPackage | null>(null);

  useEffect(() => {
    if (isOpen && user?.access_token) {
      fetchUserPackages();
    }
  }, [isOpen, user?.access_token, client.id]);

  useEffect(() => {
    if (selectedPackage && user?.access_token) {
      fetchAvailableSlots();
    }
  }, [selectedPackage, user?.access_token]);

  const fetchUserPackages = async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(`/api/admin/user-packages?client_id=${client.id}&is_active=true`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserPackages(data.data);
      } else {
        toast.error('Failed to fetch user packages');
      }
    } catch (error) {
      toast.error('Error fetching user packages');
    }
  };

  const fetchAvailableSlots = async () => {
    if (!user?.access_token || !selectedPackage) return;
    
    try {
      const sessionDurationId = selectedPackage.package_definition.session_durations.id;
      const response = await fetch(`/api/admin/schedule-slots?session_duration_id=${sessionDurationId}&is_available=true&has_capacity=true`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setScheduleSlots(data.data);
      } else {
        toast.error('Failed to fetch available slots');
      }
    } catch (error) {
      toast.error('Error fetching available slots');
    }
  };

  const handlePackageSelect = (packageId: string) => {
    const selected = userPackages.find(pkg => pkg.id.toString() === packageId);
    setSelectedPackage(selected || null);
    setFormData(prev => ({ ...prev, user_package_id: packageId }));
    setStep(2);
  };

  const handleSlotSelect = (slotId: string) => {
    setFormData(prev => ({ ...prev, schedule_slot_id: slotId }));
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!user?.access_token) return;

    // Validation
    if (!formData.user_package_id || !formData.schedule_slot_id) {
      toast.error('Please select a package and time slot');
      return;
    }

    if (formData.booking_type === 'group' && !formData.group_size) {
      toast.error('Please specify group size');
      return;
    }

    if (selectedPackage && formData.booking_type === 'group') {
      if (formData.group_size > selectedPackage.package_definition.max_group_size) {
        toast.error(`Group size cannot exceed ${selectedPackage.package_definition.max_group_size}`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: parseInt(client.id),
          schedule_slot_id: parseInt(formData.schedule_slot_id),
          user_package_id: parseInt(formData.user_package_id),
          booking_type: formData.booking_type,
          group_size: formData.booking_type === 'group' ? formData.group_size : undefined,
          notes: formData.notes || undefined,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
          discount_amount: parseFloat(formData.discount_amount) || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking created successfully');
        onSuccess();
        onClose();
        resetForm();
      } else {
        toast.error(data.message || 'Failed to create booking');
      }
    } catch (error) {
      toast.error('Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_package_id: '',
      schedule_slot_id: '',
      booking_type: 'individual',
      group_size: 1,
      notes: '',
      total_amount: '',
      discount_amount: '0'
    });
    setSelectedPackage(null);
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };



  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dashboard-modal max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dashboard-modal-title">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Create New Booking
            </div>
          </DialogTitle>
          <DialogDescription className="dashboard-modal-description">
            Create a new booking for {client.name} ({client.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <h3 className="text-lg font-semibold">Select Package</h3>
              </div>

              {userPackages.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active packages found for this client</p>
                  <p className="text-sm text-gray-500 mt-2">The client needs to purchase a package first</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {userPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                        formData.user_package_id === pkg.id.toString() ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => handlePackageSelect(pkg.id.toString())}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{pkg.package_definition.name}</h4>
                            {getPackageTypeBadge(pkg.package_definition.package_type)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{pkg.package_definition.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {pkg.package_definition.session_durations.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {pkg.sessions_remaining} of {pkg.package_definition.sessions_count} remaining
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {pkg.package_price.currencies.symbol}{pkg.package_price.price}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={pkg.is_active ? 'dashboard-badge-success' : 'dashboard-badge-error'}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Time Slot Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <h3 className="text-lg font-semibold">Select Time Slot</h3>
              </div>

              {selectedPackage && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Package:</strong> {selectedPackage.package_definition.name} 
                    ({selectedPackage.package_definition.session_durations.duration_minutes} min)
                  </p>
                </div>
              )}

              {scheduleSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No available time slots found</p>
                  <p className="text-sm text-gray-500 mt-2">All slots for this duration are currently booked or unavailable</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {scheduleSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                        formData.schedule_slot_id === slot.id.toString() ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => handleSlotSelect(slot.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatDateTime(slot.start_time)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {slot.schedule_templates.day_of_week}
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatDateTime(slot.end_time)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Duration: {slot.schedule_templates.session_durations.duration_minutes} min
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="dashboard-badge-info">
                            {slot.booked_count}/{slot.capacity} booked
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="dashboard-button-outline"
                  onClick={() => setStep(1)}
                >
                  ← Back to Packages
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Booking Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <h3 className="text-lg font-semibold">Booking Details</h3>
              </div>

              {selectedPackage && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Package:</strong> {selectedPackage.package_definition.name} | 
                    <strong>Time:</strong> {formData.schedule_slot_id && scheduleSlots.find(s => s.id.toString() === formData.schedule_slot_id)?.start_time ? 
                      formatDateTime(scheduleSlots.find(s => s.id.toString() === formData.schedule_slot_id)!.start_time) : 'Not selected'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dashboard-label">Booking Type</Label>
                  <Select
                    value={formData.booking_type}
                    onValueChange={(value: 'individual' | 'group') => setFormData(prev => ({ ...prev, booking_type: value }))}
                  >
                    <SelectTrigger className="dashboard-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Session</SelectItem>
                      <SelectItem value="group">Group Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.booking_type === 'group' && (
                  <div className="space-y-2">
                    <Label className="dashboard-label">Group Size</Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedPackage?.package_definition.max_group_size || 10}
                      className="dashboard-input"
                      value={formData.group_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, group_size: parseInt(e.target.value) || 1 }))}
                    />
                    <p className="text-xs text-gray-500">
                      Max: {selectedPackage?.package_definition.max_group_size || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dashboard-label">Total Amount (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="dashboard-input"
                    placeholder="0.00"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="dashboard-label">Discount Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="dashboard-input"
                    placeholder="0.00"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dashboard-label">Notes (Optional)</Label>
                <Textarea
                  className="dashboard-input"
                  placeholder="Add any special notes or requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="dashboard-button-outline"
                  onClick={() => setStep(2)}
                >
                  ← Back to Time Slots
                </Button>
                <Button
                  className="dashboard-button-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingModal;
