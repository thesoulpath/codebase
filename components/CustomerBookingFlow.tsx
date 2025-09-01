'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Package, 
  User, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  // Star, // Unused for now
  MapPin,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BaseButton } from './ui/BaseButton';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatTime } from '@/lib/utils';

interface CustomerPackage {
  id: string;
  name: string;
  description: string;
  sessionsRemaining: number;
  totalSessions: number;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed';
  purchaseDate: string;
  price: number;
  sessionDuration: number;
}

interface AvailableSchedule {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
  capacity: number;
  bookedCount: number;
  sessionType: string;
  price: number;
}

interface BookingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface BookingFormData {
  selectedPackage: CustomerPackage | null;
  selectedSchedule: AvailableSchedule | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
  specialRequests: string;
  language: string;
}

export function CustomerBookingFlow() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [schedules, setSchedules] = useState<AvailableSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState<BookingFormData>({
    selectedPackage: null,
    selectedSchedule: null,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    question: '',
    specialRequests: '',
    language: 'en'
  });

  const steps: BookingStep[] = [
    { id: 'package', title: 'Select Package', description: 'Choose your package for booking', completed: false },
    { id: 'schedule', title: 'Select Schedule', description: 'Pick your preferred date and time', completed: false },
    { id: 'details', title: 'Session Details', description: 'Provide your information and questions', completed: false },
    { id: 'confirmation', title: 'Confirm Booking', description: 'Review and confirm your booking', completed: false }
  ];

  useEffect(() => {
    if (user?.access_token) {
      loadCustomerData();
    }
  }, [user?.access_token]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPackages(),
        loadSchedules()
      ]);
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const response = await fetch('/api/client/my-packages', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const activePackages = data.data.filter((pkg: CustomerPackage) => 
            pkg.status === 'active' && pkg.sessionsRemaining > 0
          );
          setPackages(activePackages);
        }
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/schedules?available=true', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const handlePackageSelect = (pkg: CustomerPackage) => {
    setFormData(prev => ({ ...prev, selectedPackage: pkg }));
    setCurrentStep(1);
    updateStepCompletion(0, true);
  };

  const handleScheduleSelect = (schedule: AvailableSchedule) => {
    setFormData(prev => ({ ...prev, selectedSchedule: schedule }));
    setSelectedDate(schedule.date);
    setCurrentStep(2);
    updateStepCompletion(1, true);
  };

  const handleFormChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateStepCompletion = (stepIndex: number, completed: boolean) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].completed = completed;
  };

  const handleSubmitBooking = async () => {
    if (!formData.selectedPackage || !formData.selectedSchedule) {
      toast.error('Please select a package and schedule');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/client/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: formData.selectedPackage.id,
          scheduleId: formData.selectedSchedule.id,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          birthPlace: formData.birthPlace,
          question: formData.question,
          specialRequests: formData.specialRequests,
          language: formData.language
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Booking created successfully!');
        setCurrentStep(3);
        updateStepCompletion(2, true);
        // Refresh packages to update session count
        loadPackages();
      } else {
        toast.error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToPackages = () => {
    setCurrentStep(0);
    setFormData(prev => ({ ...prev, selectedPackage: null, selectedSchedule: null }));
    setSelectedDate('');
  };

  const handleBackToSchedule = () => {
    setCurrentStep(1);
    setFormData(prev => ({ ...prev, selectedSchedule: null }));
    setSelectedDate('');
  };

  const handleBackToDetails = () => {
    setCurrentStep(2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'bg-green-500/20 text-green-400', label: 'Active' },
      'expired': { color: 'bg-gray-500/20 text-gray-400', label: 'Expired' },
      'completed': { color: 'bg-blue-500/20 text-blue-400', label: 'Completed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Get available dates from schedules
  const availableDates = [...new Set(schedules
    .filter(s => s.isAvailable && s.bookedCount < s.capacity)
    .map(s => s.date)
    .sort()
  )];

  // Get available times for selected date
  const availableTimes = schedules
    .filter(s => s.date === selectedDate && s.isAvailable && s.bookedCount < s.capacity)
    .sort((a, b) => a.time.localeCompare(b.time));

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

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-400/50 mb-4" />
        <h3 className="text-lg font-heading text-white mb-2">No Active Packages</h3>
        <p className="text-gray-400 mb-4">You need to purchase a package before you can book a session</p>
        <a href="/account/packages">
          <BaseButton className="dashboard-button-primary">
            <Package size={16} className="mr-2" />
            Buy Packages
          </BaseButton>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Book Your Session</h1>
        <p className="text-gray-400">Schedule your spiritual consultation</p>
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
                  className={`cursor-pointer transition-all ${
                    formData.selectedPackage?.id === pkg.id 
                      ? 'ring-2 ring-[#ffd700] bg-[#1a1a2e]' 
                      : 'bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50'
                  }`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{pkg.name}</CardTitle>
                      {getStatusBadge(pkg.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">{pkg.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sessions Remaining:</span>
                        <span className="text-white font-medium">{pkg.sessionsRemaining}/{pkg.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Session Duration:</span>
                        <span className="text-white">{pkg.sessionDuration} minutes</span>
                      </div>
                      {pkg.expiresAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Expires:</span>
                          <span className="text-white">{formatDate(pkg.expiresAt)}</span>
                        </div>
                      )}
                    </div>

                    <BaseButton 
                      className="w-full dashboard-button-primary"
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      Use This Package
                      <ArrowRight size={16} className="ml-2" />
                    </BaseButton>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 1 && formData.selectedPackage && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Date Selection */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar size={20} className="mr-2 text-[#ffd700]" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableDates.slice(0, 12).map((date) => (
                      <BaseButton
                        key={date}
                        variant="outline"
                        onClick={() => setSelectedDate(date)}
                        className={`${
                          selectedDate === date 
                            ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]' 
                            : 'border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white'
                        }`}
                      >
                        {formatDate(date)}
                      </BaseButton>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Selection */}
              {selectedDate && (
                <Card className="bg-[#1a1a2e] border-[#16213e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Clock size={20} className="mr-2 text-[#ffd700]" />
                      Select Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {availableTimes.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle size={48} className="mx-auto text-gray-400/50 mb-4" />
                        <p className="text-gray-400">No available times for this date</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {availableTimes.map((schedule) => (
                          <BaseButton
                            key={schedule.id}
                            variant="outline"
                            onClick={() => handleScheduleSelect(schedule)}
                            className={`${
                              formData.selectedSchedule?.id === schedule.id 
                                ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]' 
                                : 'border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white'
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-medium">{formatTime(schedule.time)}</div>
                              <div className="text-xs opacity-75">
                                {schedule.bookedCount}/{schedule.capacity} booked
                              </div>
                            </div>
                          </BaseButton>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <BaseButton
                variant="outline"
                onClick={handleBackToPackages}
                className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Packages
              </BaseButton>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && formData.selectedPackage && formData.selectedSchedule && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Session Details Form */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User size={20} className="mr-2 text-[#ffd700]" />
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName" className="text-gray-300">Full Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => handleFormChange('clientName', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientEmail" className="text-gray-300">Email *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => handleFormChange('clientEmail', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientPhone" className="text-gray-300">Phone</Label>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => handleFormChange('clientPhone', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <Label htmlFor="language" className="text-gray-300">Language</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => handleFormChange('language', value)}
                      >
                        <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="birthDate" className="text-gray-300">Birth Date *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleFormChange('birthDate', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="birthTime" className="text-gray-300">Birth Time (Optional)</Label>
                      <Input
                        id="birthTime"
                        type="time"
                        value={formData.birthTime}
                        onChange={(e) => handleFormChange('birthTime', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="birthPlace" className="text-gray-300">Birth Place *</Label>
                    <Input
                      id="birthPlace"
                      value={formData.birthPlace}
                      onChange={(e) => handleFormChange('birthPlace', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
                      placeholder="City, Country"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="question" className="text-gray-300">Question/Focus Areas *</Label>
                    <Textarea
                      id="question"
                      value={formData.question}
                      onChange={(e) => handleFormChange('question', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white min-h-[100px]"
                      placeholder="What would you like to explore in your reading?"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequests" className="text-gray-300">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white min-h-[80px]"
                      placeholder="Any special requests or additional information..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              <div className="space-y-4">
                <Card className="bg-[#1a1a2e] border-[#16213e]">
                  <CardHeader>
                    <CardTitle className="text-white">Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-[#16213e] rounded-lg">
                      <Package size={24} className="text-[#ffd700]" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{formData.selectedPackage.name}</p>
                        <p className="text-sm text-gray-400">
                          {formData.selectedPackage.sessionsRemaining} sessions remaining
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-[#16213e] rounded-lg">
                      <Calendar size={24} className="text-[#ffd700]" />
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {formatDate(formData.selectedSchedule!.date)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatTime(formData.selectedSchedule!.time)} • {formData.selectedPackage.sessionDuration} min
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#2a2a4a]">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Zap size={16} />
                        <span>Instant confirmation</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <MessageSquare size={16} />
                        <span>Email reminders sent</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <MapPin size={16} />
                        <span>Online session via Zoom</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <BaseButton
                variant="outline"
                onClick={handleBackToSchedule}
                className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Schedule
              </BaseButton>
              <BaseButton
                onClick={() => setCurrentStep(3)}
                className="dashboard-button-primary"
              >
                Review Booking
                <ArrowRight size={16} className="ml-2" />
              </BaseButton>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle size={20} className="mr-2 text-[#ffd700]" />
                  Confirm Your Booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Session Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Package:</span>
                        <span className="text-white">{formData.selectedPackage?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white">{formatDate(formData.selectedSchedule!.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white">{formatTime(formData.selectedSchedule!.time)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white">{formData.selectedPackage?.sessionDuration} minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{formData.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{formData.clientEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Birth Date:</span>
                        <span className="text-white">{formatDate(formData.birthDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Birth Place:</span>
                        <span className="text-white">{formData.birthPlace}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2a2a4a]">
                  <h3 className="text-lg font-semibold text-white mb-3">Your Question</h3>
                  <p className="text-gray-300 bg-[#16213e] p-3 rounded-lg">
                    {formData.question}
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <BaseButton
                    variant="outline"
                    onClick={handleBackToDetails}
                    className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Details
                  </BaseButton>
                  <BaseButton
                    onClick={handleSubmitBooking}
                    disabled={processing}
                    className="dashboard-button-primary"
                  >
                    {processing ? (
                      <div className="flex items-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Creating Booking...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle size={16} />
                        <span>Confirm Booking</span>
                      </div>
                    )}
                  </BaseButton>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
