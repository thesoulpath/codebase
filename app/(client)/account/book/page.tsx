'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';


interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function BookPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchTimeSlots();
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

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch('/api/client/time-slots');
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots(result.data);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedPackage || !selectedDate || !selectedTimeSlot) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/client/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage,
          date: selectedDate,
          timeSlotId: selectedTimeSlot,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Booking created successfully!');
        // Reset form
        setSelectedPackage('');
        setSelectedDate('');
        setSelectedTimeSlot('');
        setNotes('');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="text-[#ffd700] hover:text-[#ffd700]/80">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Book a Session</h1>
          <p className="text-gray-400 mt-2">Schedule your spiritual consultation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Package Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Select Package</h2>
          <Select value={selectedPackage} onValueChange={setSelectedPackage}>
            <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
              <SelectValue placeholder="Choose a package" />
            </SelectTrigger>
            <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{pkg.name}</span>
                    <span className="text-[#ffd700]">${pkg.price}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPackage && (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-4">
                {(() => {
                  const pkg = packages.find(p => p.id.toString() === selectedPackage);
                  if (!pkg) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-[#ffd700]" />
                        <h3 className="font-semibold text-white">{pkg.name}</h3>
                      </div>
                      <p className="text-gray-300 text-sm">{pkg.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{pkg.duration_minutes} minutes</span>
                        </div>
                        <div className="text-[#ffd700] font-bold">${pkg.price}</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Date and Time Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Select Date & Time</h2>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="date" className="text-gray-300">Date:</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            {selectedDate && (
              <div>
                <Label htmlFor="time-slot" className="text-gray-300">Time Slot:</Label>
                <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                  <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                    {timeSlots
                      .filter(slot => slot.is_available)
                      .map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.start_time} - {slot.end_time}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-gray-300">Additional Notes (Optional):</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or information..."
              className="bg-[#16213e] border-[#0a0a23] text-white"
              rows={3}
            />
          </div>

          {/* Booking Button */}
          <Button
            onClick={handleBooking}
            disabled={!selectedPackage || !selectedDate || !selectedTimeSlot || processing}
            className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Book Session</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
