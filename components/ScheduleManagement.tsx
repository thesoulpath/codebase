import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, Edit, Trash2, Clock, X, 
  List, Search, RefreshCw,
  CalendarCheck, CalendarX, Users,
  Repeat, UserPlus, Layers, MoreHorizontal
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { useAuth } from '../hooks/useAuth';


interface Schedule {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
  clientId?: string;
  duration: number;
  capacity?: number;
  bookedCount?: number;
  createdAt: string;
  updatedAt?: string;
  recurrenceId?: string;
  recurrencePattern?: {
    type: 'weekly' | 'monthly' | 'daily';
    frequency: number;
    endDate?: string;
    daysOfWeek?: number[];
    exceptions?: string[];
  };
}

interface ScheduleModalProps {
  schedule: Schedule | null;
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: (schedule: Partial<Schedule>) => void;
}

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedules: Partial<Schedule>[]) => void;
}

interface RecurrentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: any) => void;
}

function ScheduleModal({ schedule, isOpen, mode, onClose, onSave }: ScheduleModalProps) {
  const [formData, setFormData] = useState<Partial<Schedule>>({
    date: '',
    time: '',
    duration: 60,
    capacity: 1,
    isAvailable: true
  });

  useEffect(() => {
    if (schedule && mode !== 'create') {
      setFormData(schedule);
    } else {
      setFormData({
        date: '',
        time: '',
        duration: 60,
        capacity: 1,
        isAvailable: true
      });
    }
  }, [schedule, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#191970]/95 backdrop-blur-lg border border-[#C0C0C0]/20 rounded-xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading text-[#EAEAEA]">
                {mode === 'create' ? 'Add Time Slot' : mode === 'edit' ? 'Edit Time Slot' : 'Time Slot Details'}
              </h2>
              <p className="text-sm text-[#C0C0C0] mt-1">
                {mode === 'create' ? 'Create a new available time slot' : mode === 'edit' ? 'Update time slot details' : 'View time slot information'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date" className="text-[#C0C0C0]">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                disabled={mode === 'view'}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="time" className="text-[#C0C0C0]">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                disabled={mode === 'view'}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-[#C0C0C0]">Duration (minutes)</Label>
              <Select
                value={formData.duration?.toString() || '60'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="30" className="text-black hover:bg-gray-100 focus:bg-gray-100">30 minutes</SelectItem>
                  <SelectItem value="60" className="text-black hover:bg-gray-100 focus:bg-gray-100">60 minutes</SelectItem>
                  <SelectItem value="90" className="text-black hover:bg-gray-100 focus:bg-gray-100">90 minutes</SelectItem>
                  <SelectItem value="120" className="text-black hover:bg-gray-100 focus:bg-gray-100">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capacity" className="text-[#C0C0C0]">Capacity (max clients)</Label>
              <Select
                value={formData.capacity?.toString() || '1'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: parseInt(value) }))}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="1" className="text-black hover:bg-gray-100 focus:bg-gray-100">1 client</SelectItem>
                  <SelectItem value="2" className="text-black hover:bg-gray-100 focus:bg-gray-100">2 clients</SelectItem>
                  <SelectItem value="3" className="text-black hover:bg-gray-100 focus:bg-gray-100">3 clients</SelectItem>
                  <SelectItem value="4" className="text-black hover:bg-gray-100 focus:bg-gray-100">4 clients</SelectItem>
                  <SelectItem value="5" className="text-black hover:bg-gray-100 focus:bg-gray-100">5 clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable || false}
                onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                className="w-4 h-4 text-[#FFD700] bg-[#0A0A23]/50 border-[#C0C0C0]/30 rounded focus:ring-[#FFD700] focus:ring-2"
                disabled={mode === 'view'}
              />
              <Label htmlFor="isAvailable" className="text-[#C0C0C0]">Available for booking</Label>
            </div>

            {schedule?.recurrencePattern && (
              <div className="p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Repeat size={16} className="text-[#FFD700]" />
                  <span className="text-sm font-medium text-[#FFD700]">Recurring Schedule</span>
                </div>
                <p className="text-sm text-[#C0C0C0]">
                  Repeats {schedule.recurrencePattern.type} every {schedule.recurrencePattern.frequency} 
                  {schedule.recurrencePattern.frequency === 1 ? '' : 's'}
                  {schedule.recurrencePattern.endDate && ` until ${new Date(schedule.recurrencePattern.endDate).toLocaleDateString()}`}
                </p>
              </div>
            )}

            {mode !== 'view' && (
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
                >
                  {mode === 'create' ? 'Add Time Slot' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function BulkScheduleModal({ isOpen, onClose, onSave }: BulkScheduleModalProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    times: [''],
    duration: 60,
    capacity: 1,
    daysOfWeek: [] as number[],
    skipWeekends: true
  });

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, '']
    }));
  };

  const updateTime = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.map((time, i) => i === index ? value : time)
    }));
  };

  const removeTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const schedules: Partial<Schedule>[] = [];
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Skip weekends if enabled
      if (formData.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }
      
      // Check specific days if selected
      if (formData.daysOfWeek.length > 0 && !formData.daysOfWeek.includes(dayOfWeek)) {
        continue;
      }
      
      // Create schedules for each time slot
      formData.times.filter(time => time).forEach(time => {
        schedules.push({
          date: date.toISOString().split('T')[0],
          time,
          duration: formData.duration,
          capacity: formData.capacity,
          isAvailable: true
        });
      });
    }
    
    onSave(schedules);
  };

  const reset = () => {
    setFormData({
      startDate: '',
      endDate: '',
      times: [''],
      duration: 60,
      capacity: 1,
      daysOfWeek: [],
      skipWeekends: true
    });
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const daysOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#191970]/95 backdrop-blur-lg border border-[#C0C0C0]/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading text-[#EAEAEA]">Bulk Schedule Creation</h2>
              <p className="text-sm text-[#C0C0C0] mt-1">Create multiple time slots at once</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-[#C0C0C0]">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-[#C0C0C0]">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Days of Week */}
            <div>
              <Label className="text-[#C0C0C0] mb-3 block">Days of Week (leave empty for all days)</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeekLabels.map((day, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDayOfWeek(index)}
                    className={`border-[#C0C0C0]/30 ${
                      formData.daysOfWeek.includes(index)
                        ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]'
                        : 'text-[#C0C0C0] hover:bg-[#C0C0C0]/10'
                    }`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <input
                  type="checkbox"
                  id="skipWeekends"
                  checked={formData.skipWeekends}
                  onChange={(e) => setFormData(prev => ({ ...prev, skipWeekends: e.target.checked }))}
                  className="w-4 h-4 text-[#FFD700] bg-[#0A0A23]/50 border-[#C0C0C0]/30 rounded focus:ring-[#FFD700] focus:ring-2"
                />
                <Label htmlFor="skipWeekends" className="text-[#C0C0C0] text-sm">Skip weekends</Label>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#C0C0C0]">Time Slots *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                  className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  <Plus size={16} className="mr-1" />
                  Add Time
                </Button>
              </div>
              <div className="space-y-2">
                {formData.times.map((time, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] flex-1"
                      required
                    />
                    {formData.times.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTime(index)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Duration and Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#C0C0C0]">Duration (minutes)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#C0C0C0]">Capacity (max clients)</Label>
                <Select
                  value={formData.capacity.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: parseInt(value) }))}
                >
                  <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 client</SelectItem>
                    <SelectItem value="2">2 clients</SelectItem>
                    <SelectItem value="3">3 clients</SelectItem>
                    <SelectItem value="4">4 clients</SelectItem>
                    <SelectItem value="5">5 clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
              >
                Create Schedules
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function RecurrentScheduleModal({ isOpen, onClose, onSave }: RecurrentScheduleModalProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    time: '',
    duration: 60,
    capacity: 1,
    recurrenceType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    frequency: 1,
    endDate: '',
    daysOfWeek: [] as number[],
    exceptions: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const pattern = {
      ...formData,
      recurrencePattern: {
        type: formData.recurrenceType,
        frequency: formData.frequency,
        endDate: formData.endDate,
        daysOfWeek: formData.daysOfWeek,
        exceptions: formData.exceptions
      }
    };
    
    onSave(pattern);
  };

  const reset = () => {
    setFormData({
      startDate: '',
      time: '',
      duration: 60,
      capacity: 1,
      recurrenceType: 'weekly',
      frequency: 1,
      endDate: '',
      daysOfWeek: [],
      exceptions: []
    });
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const daysOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#191970]/95 backdrop-blur-lg border border-[#C0C0C0]/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading text-[#EAEAEA]">Recurring Schedule</h2>
              <p className="text-sm text-[#C0C0C0] mt-1">Create a recurring pattern for regular time slots</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Base Schedule Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-[#C0C0C0]">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-[#C0C0C0]">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                  required
                />
              </div>
            </div>

            {/* Recurrence Pattern */}
            <div>
              <Label className="text-[#C0C0C0] mb-3 block">Recurrence Pattern</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#C0C0C0] text-sm">Type</Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setFormData(prev => ({ ...prev, recurrenceType: value }))
                    }
                  >
                    <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#C0C0C0] text-sm">Every</Label>
                  <Select
                    value={formData.frequency.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {formData.recurrenceType}{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#C0C0C0] text-sm">End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Days of Week (for weekly recurrence) */}
            {formData.recurrenceType === 'weekly' && (
              <div>
                <Label className="text-[#C0C0C0] mb-3 block">Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeekLabels.map((day, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDayOfWeek(index)}
                      className={`border-[#C0C0C0]/30 ${
                        formData.daysOfWeek.includes(index)
                          ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]'
                          : 'text-[#C0C0C0] hover:bg-[#C0C0C0]/10'
                      }`}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration and Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#C0C0C0]">Duration (minutes)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#C0C0C0]">Capacity (max clients)</Label>
                <Select
                  value={formData.capacity.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: parseInt(value) }))}
                >
                  <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 client</SelectItem>
                    <SelectItem value="2">2 clients</SelectItem>
                    <SelectItem value="3">3 clients</SelectItem>
                    <SelectItem value="4">4 clients</SelectItem>
                    <SelectItem value="5">5 clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
              >
                Create Recurring Schedule
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export function ScheduleManagement() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [modalState, setModalState] = useState<{ 
    isOpen: boolean; 
    mode: 'create' | 'edit' | 'view'; 
  }>({ isOpen: false, mode: 'view' });
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [recurrentModalOpen, setRecurrentModalOpen] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchQuery, statusFilter, dateFilter]);

  const loadSchedules = async () => {
    try {
      if (!user?.access_token) return;

      const response = await fetch(
        `/api/admin/schedules`,
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = [...schedules];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(schedule =>
        schedule.date.includes(searchQuery) ||
        schedule.time.includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') {
        filtered = filtered.filter(schedule => schedule.isAvailable && (!schedule.clientId || (schedule.bookedCount || 0) < (schedule.capacity || 1)));
      } else if (statusFilter === 'booked') {
        filtered = filtered.filter(schedule => schedule.clientId || (schedule.bookedCount || 0) >= (schedule.capacity || 1));
      } else if (statusFilter === 'unavailable') {
        filtered = filtered.filter(schedule => !schedule.isAvailable);
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(schedule => 
            new Date(schedule.date) >= filterDate &&
            new Date(schedule.date) < new Date(filterDate.getTime() + 24 * 60 * 60 * 1000)
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - now.getDay());
          filterDate.setHours(0, 0, 0, 0);
          const nextWeek = new Date(filterDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(schedule => 
            new Date(schedule.date) >= filterDate && new Date(schedule.date) < nextWeek
          );
          break;
        case 'month':
          filterDate.setDate(1);
          filterDate.setHours(0, 0, 0, 0);
          const nextMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 1);
          filtered = filtered.filter(schedule => 
            new Date(schedule.date) >= filterDate && new Date(schedule.date) < nextMonth
          );
          break;
      }
    }

    setFilteredSchedules(filtered);
  };

  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setModalState({ isOpen: true, mode: 'create' });
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setModalState({ isOpen: true, mode: 'edit' });
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setModalState({ isOpen: true, mode: 'view' });
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (!user?.access_token) return;
    
    if (!confirm(`Are you sure you want to delete this time slot (${schedule.date} at ${schedule.time})? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/schedules/${schedule.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setSchedules(prev => prev.filter(s => s.id !== schedule.id));
      } else {
        alert('Failed to delete schedule. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule. Please try again.');
    }
  };

  const handleSaveSchedule = async (scheduleData: Partial<Schedule>) => {
    if (!user?.access_token) return;

    try {
      const isCreate = modalState.mode === 'create';
      const url = isCreate 
        ? `/api/admin/schedules`
        : `/api/admin/schedules/${selectedSchedule?.id}`;

      const response = await fetch(url, {
        method: isCreate ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isCreate) {
          setSchedules(prev => [data.schedule, ...prev]);
        } else {
          setSchedules(prev => prev.map(s => 
            s.id === selectedSchedule?.id ? { ...s, ...data.schedule } : s
          ));
        }
        
        setModalState({ isOpen: false, mode: 'view' });
        setSelectedSchedule(null);
      } else {
        alert('Failed to save schedule. Please try again.');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const handleBulkSave = async (schedules: Partial<Schedule>[]) => {
    if (!user?.access_token) return;

    try {
      const response = await fetch(
        `/api/admin/schedules/bulk`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ schedules })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSchedules(prev => [...data.schedules, ...prev]);
        setBulkModalOpen(false);
        alert(`Successfully created ${data.schedules.length} schedules!`);
      } else {
        alert('Failed to create bulk schedules. Please try again.');
      }
    } catch (error) {
      console.error('Error creating bulk schedules:', error);
      alert('Failed to create bulk schedules. Please try again.');
    }
  };

  const handleRecurrentSave = async (pattern: any) => {
    if (!user?.access_token) return;

    try {
      const response = await fetch(
        `/api/admin/schedules/recurrent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pattern)
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSchedules(prev => [...data.schedules, ...prev]);
        setRecurrentModalOpen(false);
        alert(`Successfully created recurring schedule pattern with ${data.schedules.length} instances!`);
      } else {
        alert('Failed to create recurring schedule. Please try again.');
      }
    } catch (error) {
      console.error('Error creating recurring schedule:', error);
      alert('Failed to create recurring schedule. Please try again.');
    }
  };

  const getStatusBadge = (schedule: Schedule) => {
    const capacity = schedule.capacity || 1;
    const booked = schedule.bookedCount || 0;
    
    if (!schedule.isAvailable) {
      return <Badge className="bg-red-500/20 text-red-400">Unavailable</Badge>;
    } else if (booked >= capacity) {
      return <Badge className="bg-blue-500/20 text-blue-400">Fully Booked</Badge>;
    } else if (booked > 0) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Partially Booked ({booked}/{capacity})</Badge>;
    } else {
      return <Badge className="bg-green-500/20 text-green-400">Available</Badge>;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const stats = {
    total: schedules.length,
    available: schedules.filter(s => s.isAvailable && (!s.clientId || (s.bookedCount || 0) < (s.capacity || 1))).length,
    booked: schedules.filter(s => s.clientId || (s.bookedCount || 0) >= (s.capacity || 1)).length,
    unavailable: schedules.filter(s => !s.isAvailable).length
  };

  if (isLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-[#EAEAEA] mb-2">Enhanced Schedule Management</h2>
          <p className="text-[#C0C0C0]">Manage your available consultation time slots with bulk and recurring options</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setBulkModalOpen(true)}
            variant="outline"
            className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
          >
            <Layers size={16} className="mr-2" />
            Bulk Create
          </Button>
          <Button
            onClick={() => setRecurrentModalOpen(true)}
            variant="outline"
            className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
          >
            <Repeat size={16} className="mr-2" />
            Recurring
          </Button>
          <Button
            onClick={handleCreateSchedule}
            className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
          >
            <Plus size={16} className="mr-2" />
            Add Time Slot
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#C0C0C0]">Total Slots</p>
                <p className="text-2xl font-heading text-[#EAEAEA]">{stats.total}</p>
              </div>
              <Calendar size={24} className="text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#C0C0C0]">Available</p>
                <p className="text-2xl font-heading text-green-400">{stats.available}</p>
              </div>
              <CalendarCheck size={24} className="text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#C0C0C0]">Booked</p>
                <p className="text-2xl font-heading text-blue-400">{stats.booked}</p>
              </div>
              <Users size={24} className="text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#C0C0C0]">Unavailable</p>
                <p className="text-2xl font-heading text-red-400">{stats.unavailable}</p>
              </div>
              <CalendarX size={24} className="text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label className="text-[#C0C0C0] text-sm">Search</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C0C0C0]/50" />
                <Input
                  placeholder="Search schedules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-[#C0C0C0] text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <Label className="text-[#C0C0C0] text-sm">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex space-x-2">
              <div className="flex bg-[#0A0A23]/50 rounded-lg border border-[#C0C0C0]/30">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' ? 'bg-[#FFD700] text-[#0A0A23]' : 'text-[#C0C0C0]'}
                >
                  <Calendar size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-[#FFD700] text-[#0A0A23]' : 'text-[#C0C0C0]'}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>

            {/* Refresh */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSchedules}
                className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#C0C0C0]">
          Showing {filteredSchedules.length} of {schedules.length} time slots
        </p>
      </div>

      {/* Schedule List */}
      {filteredSchedules.length === 0 ? (
        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardContent className="p-12 text-center">
            <Calendar size={48} className="mx-auto text-[#C0C0C0]/50 mb-4" />
            <h3 className="text-lg font-heading text-[#EAEAEA] mb-2">No schedules found</h3>
            <p className="text-[#C0C0C0] mb-4">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first time slot.'}
            </p>
            {!searchQuery && statusFilter === 'all' && dateFilter === 'all' && (
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={handleCreateSchedule}
                  className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
                >
                  <Plus size={16} className="mr-2" />
                  Add First Time Slot
                </Button>
                <Button
                  onClick={() => setBulkModalOpen(true)}
                  variant="outline"
                  className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  <Layers size={16} className="mr-2" />
                  Bulk Create
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#C0C0C0]/20">
                  <tr className="text-left">
                    <th className="p-4 text-sm font-medium text-[#C0C0C0]">Date & Time</th>
                    <th className="p-4 text-sm font-medium text-[#C0C0C0]">Duration</th>
                    <th className="p-4 text-sm font-medium text-[#C0C0C0]">Capacity</th>
                    <th className="p-4 text-sm font-medium text-[#C0C0C0]">Status</th>
                    <th className="p-4 text-sm font-medium text-[#C0C0C0]">Recurrence</th>
                    <th className="p-4 text-sm font-medium text-[#C0C0C0]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b border-[#C0C0C0]/10 hover:bg-[#0A0A23]/30">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                            <Clock size={16} className="text-[#FFD700]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#EAEAEA]">{formatDate(schedule.date)}</p>
                            <p className="text-sm text-[#C0C0C0]">{formatTime(schedule.time)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[#EAEAEA]">{schedule.duration} min</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <UserPlus size={14} className="text-[#FFD700]" />
                          <span className="text-[#EAEAEA]">
                            {schedule.bookedCount || 0}/{schedule.capacity || 1}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(schedule)}
                      </td>
                      <td className="p-4">
                        {schedule.recurrencePattern ? (
                          <div className="flex items-center space-x-2">
                            <Repeat size={14} className="text-[#FFD700]" />
                            <span className="text-[#EAEAEA] text-sm capitalize">
                              {schedule.recurrencePattern.type}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#C0C0C0]/60 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSchedule(schedule)}
                            className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
                          >
                            <MoreHorizontal size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSchedule(schedule)}
                            className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalState.isOpen && (
          <ScheduleModal
            key="schedule-modal"
            schedule={selectedSchedule}
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            onClose={() => {
              setModalState({ isOpen: false, mode: 'view' });
              setSelectedSchedule(null);
            }}
            onSave={handleSaveSchedule}
          />
        )}
        {bulkModalOpen && (
          <BulkScheduleModal
            key="bulk-modal"
            isOpen={bulkModalOpen}
            onClose={() => setBulkModalOpen(false)}
            onSave={handleBulkSave}
          />
        )}
        {recurrentModalOpen && (
          <RecurrentScheduleModal
            key="recurrent-modal"
            isOpen={recurrentModalOpen}
            onClose={() => setRecurrentModalOpen(false)}
            onSave={handleRecurrentSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}