'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Clock, Calendar, Save, X } from 'lucide-react';

interface SessionDuration {
  id: number;
  name: string;
  duration_minutes: number;
  description: string;
  is_active: boolean;
}

interface ScheduleTemplate {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_available: boolean;
  session_duration_id: number | null;
  auto_available: boolean;
  created_at: string;
  updated_at: string;
  session_durations: SessionDuration | null;
}

interface ScheduleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  scheduleTemplate?: ScheduleTemplate | null;
  sessionDurations: SessionDuration[];
  mode: 'create' | 'edit';
}

const ScheduleTemplateModal: React.FC<ScheduleTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  scheduleTemplate,
  sessionDurations,
  mode
}) => {
  const [formData, setFormData] = useState({
    day_of_week: '',
    start_time: '',
    end_time: '',
    capacity: '3',
    is_available: true,
    session_duration_id: '',
    auto_available: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (scheduleTemplate && mode === 'edit') {
      setFormData({
        day_of_week: scheduleTemplate.day_of_week,
        start_time: scheduleTemplate.start_time,
        end_time: scheduleTemplate.end_time,
        capacity: scheduleTemplate.capacity.toString(),
        is_available: scheduleTemplate.is_available,
        session_duration_id: scheduleTemplate.session_duration_id?.toString() || '',
        auto_available: scheduleTemplate.auto_available
      });
    } else {
      resetForm();
    }
  }, [scheduleTemplate, mode]);

  const resetForm = () => {
    setFormData({
      day_of_week: '',
      start_time: '',
      end_time: '',
      capacity: '3',
      is_available: true,
      session_duration_id: '',
      auto_available: true
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.day_of_week) {
      newErrors.day_of_week = 'Day of week is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'End time must be after start time';
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      capacity: parseInt(formData.capacity),
      session_duration_id: formData.session_duration_id ? parseInt(formData.session_duration_id) : null
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dashboard-modal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="dashboard-modal-title">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {mode === 'create' ? 'Create New Schedule Template' : 'Edit Schedule Template'}
            </div>
          </DialogTitle>
          <DialogDescription className="dashboard-modal-description">
            {mode === 'create' 
              ? 'Define a recurring availability pattern for a specific day and time'
              : 'Update the schedule template configuration'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Day of Week *</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="monday" className="dashboard-dropdown-item">Monday</SelectItem>
                  <SelectItem value="tuesday" className="dashboard-dropdown-item">Tuesday</SelectItem>
                  <SelectItem value="wednesday" className="dashboard-dropdown-item">Wednesday</SelectItem>
                  <SelectItem value="thursday" className="dashboard-dropdown-item">Thursday</SelectItem>
                  <SelectItem value="friday" className="dashboard-dropdown-item">Friday</SelectItem>
                  <SelectItem value="saturday" className="dashboard-dropdown-item">Saturday</SelectItem>
                  <SelectItem value="sunday" className="dashboard-dropdown-item">Sunday</SelectItem>
                </SelectContent>
              </Select>
              {errors.day_of_week && <p className="text-red-500 text-sm">{errors.day_of_week}</p>}
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Capacity *</Label>
              <Select
                value={formData.capacity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="1" className="dashboard-dropdown-item">1 client</SelectItem>
                  <SelectItem value="2" className="dashboard-dropdown-item">2 clients</SelectItem>
                  <SelectItem value="3" className="dashboard-dropdown-item">3 clients</SelectItem>
                  <SelectItem value="4" className="dashboard-dropdown-item">4 clients</SelectItem>
                  <SelectItem value="5" className="dashboard-dropdown-item">5 clients</SelectItem>
                  <SelectItem value="6" className="dashboard-dropdown-item">6 clients</SelectItem>
                  <SelectItem value="8" className="dashboard-dropdown-item">8 clients</SelectItem>
                  <SelectItem value="10" className="dashboard-dropdown-item">10 clients</SelectItem>
                </SelectContent>
              </Select>
              {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Start Time *</Label>
              <Input
                className={`dashboard-input ${errors.start_time ? 'border-red-500' : ''}`}
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
              {errors.start_time && <p className="text-red-500 text-sm">{errors.start_time}</p>}
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">End Time *</Label>
              <Input
                className={`dashboard-input ${errors.end_time ? 'border-red-500' : ''}`}
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
              {errors.end_time && <p className="text-red-500 text-sm">{errors.end_time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="dashboard-label">Session Duration (Optional)</Label>
            <Select
              value={formData.session_duration_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, session_duration_id: value }))}
            >
              <SelectTrigger className="dashboard-select">
                <SelectValue placeholder="Any duration" />
              </SelectTrigger>
              <SelectContent className="dashboard-dropdown-content">
                <SelectItem value="" className="dashboard-dropdown-item">Any duration</SelectItem>
                {sessionDurations.map((duration) => (
                  <SelectItem key={duration.id} value={duration.id.toString()} className="dashboard-dropdown-item">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {duration.name} ({duration.duration_minutes} min)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
              />
              <Label htmlFor="is_available" className="dashboard-label">Available for Booking</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_available"
                checked={formData.auto_available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_available: checked }))}
              />
              <Label htmlFor="auto_available" className="dashboard-label">Auto-generate Available Slots</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="dashboard-button-outline"
              onClick={handleClose}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="dashboard-button-primary">
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create Template' : 'Update Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTemplateModal;
