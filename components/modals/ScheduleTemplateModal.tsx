'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseButton } from '@/components/ui/BaseButton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
  session_duration_id: number;
  max_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  session_durations: SessionDuration;
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
    session_duration_id: '',
    max_capacity: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (scheduleTemplate && mode === 'edit') {
      setFormData({
        day_of_week: scheduleTemplate.day_of_week,
        start_time: scheduleTemplate.start_time,
        end_time: scheduleTemplate.end_time,
        session_duration_id: scheduleTemplate.session_duration_id.toString(),
        max_capacity: scheduleTemplate.max_capacity.toString(),
        is_active: scheduleTemplate.is_active
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
      session_duration_id: '',
      max_capacity: '',
      is_active: true
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

    if (!formData.session_duration_id) {
      newErrors.session_duration_id = 'Session duration is required';
    }

    if (!formData.max_capacity) {
      newErrors.max_capacity = 'Max capacity is required';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      
      if (start >= end) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        max_capacity: parseInt(formData.max_capacity),
        session_duration_id: parseInt(formData.session_duration_id)
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create Schedule Template' : 'Edit Schedule Template'}
      description="Configure schedule template settings"
      size="lg"
      variant="default"
    >
      <BaseModal.Header icon={<Calendar className="w-5 h-5 text-[var(--color-accent-500)]" />}>
        <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
          {mode === 'create' ? 'Create New Schedule Template' : 'Edit Schedule Template'}
        </h3>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Day of Week */}
          <div className="space-y-2">
            <Label htmlFor="day_of_week">Day of Week</Label>
            <Select
              value={formData.day_of_week}
              onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
            >
              <SelectTrigger className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]">
                <SelectValue placeholder="Select day of week" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)]">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <SelectItem key={day} value={day} className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.day_of_week && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.day_of_week}
              </p>
            )}
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <Label htmlFor="session_duration_id">Session Duration</Label>
            <Select
              value={formData.session_duration_id}
              onValueChange={(value) => setFormData({ ...formData, session_duration_id: value })}
            >
              <SelectTrigger className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]">
                <SelectValue placeholder="Select session duration" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)]">
                {sessionDurations.map((duration) => (
                  <SelectItem key={duration.id} value={duration.id.toString()} className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                    {duration.name} ({duration.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.session_duration_id && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.session_duration_id}
              </p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <BaseInput
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
              {errors.start_time && (
                <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                  {errors.start_time}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <BaseInput
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
              {errors.end_time && (
                <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                  {errors.end_time}
                </p>
              )}
            </div>
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <Label htmlFor="max_capacity">Max Capacity</Label>
            <BaseInput
              id="max_capacity"
              type="number"
              min="1"
              value={formData.max_capacity}
              onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
              placeholder="Enter maximum capacity"
              required
            />
            {errors.max_capacity && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.max_capacity}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Active
            </Label>
          </div>
        </form>
      </BaseModal.Content>

      <BaseModal.Footer>
        <div className="flex justify-end space-x-3">
          <BaseButton
            variant="outline"
            onClick={handleClose}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancel
          </BaseButton>
          
          <BaseButton
            variant="primary"
            onClick={handleSubmit}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {mode === 'create' ? 'Create Template' : 'Update Template'}
          </BaseButton>
        </div>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default ScheduleTemplateModal;
