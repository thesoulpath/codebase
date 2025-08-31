'use client';

import React, { useState, useEffect } from 'react';
import { Package, Users, Clock, Save, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseButton } from '@/components/ui/BaseButton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
}

interface PackageDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  packageDefinition?: PackageDefinition | null;
  sessionDurations: SessionDuration[];
  mode: 'create' | 'edit';
}

const PackageDefinitionModal: React.FC<PackageDefinitionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  packageDefinition,
  sessionDurations,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessions_count: '',
    session_duration_id: '',
    package_type: 'individual' as 'individual' | 'group' | 'mixed',
    max_group_size: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (packageDefinition && mode === 'edit') {
      setFormData({
        name: packageDefinition.name,
        description: packageDefinition.description || '',
        sessions_count: packageDefinition.sessions_count.toString(),
        session_duration_id: packageDefinition.session_duration_id.toString(),
        package_type: packageDefinition.package_type,
        max_group_size: packageDefinition.max_group_size?.toString() || '',
        is_active: packageDefinition.is_active
      });
    } else {
      resetForm();
    }
  }, [packageDefinition, mode]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sessions_count: '',
      session_duration_id: '',
      package_type: 'individual',
      max_group_size: '',
      is_active: true
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    }

    if (!formData.sessions_count || parseInt(formData.sessions_count) <= 0) {
      newErrors.sessions_count = 'Sessions count must be a positive number';
    }

    if (!formData.session_duration_id) {
      newErrors.session_duration_id = 'Session duration is required';
    }

    if (formData.package_type === 'group' && (!formData.max_group_size || parseInt(formData.max_group_size) <= 1)) {
      newErrors.max_group_size = 'Group size must be greater than 1 for group packages';
    }

    if (formData.package_type === 'mixed' && (!formData.max_group_size || parseInt(formData.max_group_size) <= 1)) {
      newErrors.max_group_size = 'Group size must be greater than 1 for mixed packages';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        ...formData,
        sessions_count: parseInt(formData.sessions_count),
        session_duration_id: parseInt(formData.session_duration_id),
        max_group_size: formData.max_group_size ? parseInt(formData.max_group_size) : null
      };
      
      onSubmit(submitData);
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
      title={mode === 'create' ? 'Create Package Definition' : 'Edit Package Definition'}
      description="Define package settings and configuration"
      size="lg"
      variant="default"
    >
      <BaseModal.Header icon={<Package className="w-5 h-5 text-[var(--color-accent-500)]" />}>
        <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
          {mode === 'create' ? 'Create New Package Definition' : 'Edit Package Definition'}
        </h3>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Package Name</Label>
            <BaseInput
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter package name"
              required
            />
            {errors.name && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.name}
              </p>
            )}
          </div>

          {/* Package Type */}
          <div className="space-y-2">
            <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Package Type
            </Label>
            <Select
              value={formData.package_type}
              onValueChange={(value: 'individual' | 'group' | 'mixed') => 
                setFormData({ ...formData, package_type: value })
              }
            >
              <SelectTrigger className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]">
                <SelectValue placeholder="Select package type" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)]">
                <SelectItem value="individual" className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Individual Sessions
                  </div>
                </SelectItem>
                <SelectItem value="group" className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Group Sessions
                  </div>
                </SelectItem>
                <SelectItem value="mixed" className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Mixed (Individual + Group)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Group Size (conditional) */}
          {(formData.package_type === 'group' || formData.package_type === 'mixed') && (
            <div className="space-y-2">
              <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
                Maximum Group Size
              </Label>
              <BaseInput
                type="number"
                min="2"
                value={formData.max_group_size}
                onChange={(e) => setFormData({ ...formData, max_group_size: e.target.value })}
                placeholder="Enter maximum group size"
                required
              />
              {errors.max_group_size && (
                <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                  {errors.max_group_size}
                </p>
              )}
            </div>
          )}

          {/* Session Duration */}
          <div className="space-y-2">
            <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Session Duration
            </Label>
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
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {duration.name} ({duration.duration_minutes} min)
                    </div>
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

          {/* Sessions Count */}
          <div className="space-y-2">
            <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Number of Sessions
            </Label>
            <BaseInput
              type="number"
              min="1"
              value={formData.sessions_count}
              onChange={(e) => setFormData({ ...formData, sessions_count: e.target.value })}
              placeholder="Enter number of sessions"
              required
            />
            {errors.sessions_count && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.sessions_count}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter package description (optional)"
              className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Active Package
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
            {mode === 'create' ? 'Create Package' : 'Update Package'}
          </BaseButton>
        </div>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default PackageDefinitionModal;
