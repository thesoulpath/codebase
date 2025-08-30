'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Schedule {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
  capacity?: number;
  bookedCount?: number;
}

interface BookingSectionProps {
  t: any;
  language: string;
}

export function BookingSection({ t, language }: BookingSectionProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);

  // Fetch available schedules from backend
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoadingSchedules(true);
        const response = await fetch('/api/schedules?available=true');
        
        if (response.ok) {
          const data = await response.json();
          setSchedules(data.schedules || []);
        } else {
          console.error('Failed to fetch schedules');
          setSchedules([]);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  // Get available dates from schedules
  const availableDates = [...new Set(schedules
    .filter(s => s.isAvailable)
    .map(s => s.date)
    .sort()
  )];

  // Get available times for selected date
  const availableTimes = schedules
    .filter(s => s.date === selectedDate && s.isAvailable)
    .map(s => s.time)
    .sort();

  // Get selected schedule for capacity info
  const selectedSchedule = schedules.find(s => s.date === selectedDate && s.time === selectedTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !clientEmail) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Find the schedule ID for the selected date and time
      const schedule = schedules.find(s => s.date === selectedDate && s.time === selectedTime);
      
      if (!schedule) {
        throw new Error('Selected schedule not found');
      }

      // Check capacity
      if (schedule.capacity && schedule.bookedCount && schedule.bookedCount >= schedule.capacity) {
        throw new Error('This time slot is at full capacity');
      }

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule.id,
          clientEmail,
          clientName,
          clientPhone,
          message,
          language
        }),
      });

      if (response.ok) {
        await response.json();
        setSubmitStatus('success');
        
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setMessage('');
        
        // Refresh schedules to update availability
        const refreshResponse = await fetch('/api/schedules?available=true');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setSchedules(refreshData.schedules || []);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (isLoadingSchedules) {
    return (
      <section className="h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 safe-padding">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-[#EAEAEA]/80 text-lg">Loading available schedules...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-y-auto safe-padding">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-heading text-[#EAEAEA] mb-4 sm:mb-6 leading-tight">
            {t?.booking?.title || 'Book Your Session'}
          </h2>
          <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto"></div>
          <p className="text-sm sm:text-base md:text-lg text-[#EAEAEA]/80 max-w-2xl mx-auto mt-4">
            {t?.booking?.subtitle || 'Choose your preferred date and time for your cosmic journey'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-gradient-to-br from-[#191970]/30 to-[#0A0A23]/40 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-[#C0C0C0]/10 backdrop-blur-sm"
        >
          {submitStatus === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircle className="w-16 h-16 text-[#FFD700] mx-auto mb-6" />
              <h3 className="text-2xl font-heading text-[#EAEAEA] mb-4">
                {t?.booking?.successTitle || 'Booking Confirmed!'}
              </h3>
              <p className="text-[#EAEAEA]/80 mb-6">
                {t?.booking?.successMessage || 'You will receive a confirmation email shortly.'}
              </p>
              <Button
                onClick={() => setSubmitStatus('idle')}
                className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
              >
                {t?.booking?.bookAnother || 'Book Another Session'}
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Time Selection */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-[#EAEAEA] font-medium mb-3">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    {t?.booking?.date || 'Date'}
                  </label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="bg-[#191970]/20 border-[#C0C0C0]/20 text-[#EAEAEA]">
                      <SelectValue placeholder={t?.booking?.selectDate || 'Select a date'} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#191970] border-[#C0C0C0]/20">
                      {availableDates.map((date) => (
                        <SelectItem key={date} value={date}>
                          {formatDate(date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-[#EAEAEA] font-medium mb-3">
                    <Clock className="inline w-4 h-4 mr-2" />
                    {t?.booking?.time || 'Time'}
                  </label>
                  <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                    <SelectTrigger className="bg-[#191970]/20 border-[#C0C0C0]/20 text-[#EAEAEA]">
                      <SelectValue placeholder={t?.booking?.selectTime || 'Select a time'} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#191970] border-[#C0C0C0]/20">
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Capacity Info */}
              {selectedSchedule && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-lg p-4 text-center"
                >
                  <p className="text-[#FFD700] font-medium">
                    {t?.booking?.capacityInfo || 'Available Spots'}: {selectedSchedule.capacity ? selectedSchedule.capacity - (selectedSchedule.bookedCount || 0) : 'Unlimited'}
                  </p>
                </motion.div>
              )}

              {/* Client Information */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-[#EAEAEA] font-medium mb-3">
                    <User className="inline w-4 h-4 mr-2" />
                    {t?.booking?.name || 'Full Name'}
                  </label>
                  <Input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-[#191970]/20 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/50"
                    placeholder={t?.booking?.namePlaceholder || 'Enter your full name'}
                  />
                </div>

                <div>
                  <label className="block text-[#EAEAEA] font-medium mb-3">
                    <Mail className="inline w-4 h-4 mr-2" />
                    {t?.booking?.email || 'Email'} *
                  </label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                    className="bg-[#191970]/20 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/50"
                    placeholder={t?.booking?.emailPlaceholder || 'Enter your email'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#EAEAEA] font-medium mb-3">
                  <Phone className="inline w-4 h-4 mr-2" />
                  {t?.booking?.phone || 'Phone Number'}
                </label>
                <Input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="bg-[#191970]/20 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/50"
                  placeholder={t?.booking?.phonePlaceholder || 'Enter your phone number'}
                />
              </div>

              <div>
                <label className="block text-[#EAEAEA] font-medium mb-3">
                  <MessageSquare className="inline w-4 h-4 mr-2" />
                  {t?.booking?.message || 'Message'}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="bg-[#191970]/20 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/50 resize-none"
                  placeholder={t?.booking?.messagePlaceholder || 'Tell us about your intentions for this session...'}
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center"
                >
                  <p className="text-red-400 font-medium">
                    {t?.booking?.errorMessage || 'There was an error with your booking. Please try again.'}
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedTime || !clientEmail}
                className="w-full bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg font-medium"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-[#0A0A23] border-t-transparent rounded-full"
                  />
                ) : (
                  t?.booking?.submit || 'Confirm Booking'
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}