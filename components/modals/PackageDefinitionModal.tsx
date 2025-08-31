'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Package, Users, Clock, Save, X } from 'lucide-react';

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

    if (formData.package_type === 'group' && !formData.max_group_size) {
      newErrors.max_group_size = 'Max group size is required for group packages';
    }

    if (formData.max_group_size && parseInt(formData.max_group_size) <= 0) {
      newErrors.max_group_size = 'Max group size must be a positive number';
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
      sessions_count: parseInt(formData.sessions_count),
      session_duration_id: parseInt(formData.session_duration_id),
      max_group_size: formData.max_group_size ? parseInt(formData.max_group_size) : null
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
              <Package className="w-5 h-5" />
              {mode === 'create' ? 'Create New Package' : 'Edit Package'}
            </div>
          </DialogTitle>
          <DialogDescription className="dashboard-modal-description">
            {mode === 'create' 
              ? 'Define a new package with its core properties and settings'
              : 'Update the package configuration and settings'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Package Name *</Label>
              <Input
                className={`dashboard-input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Wellness Package, Single Session"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Package Type *</Label>
              <Select
                value={formData.package_type}
                onValueChange={(value: 'individual' | 'group' | 'mixed') => 
                  setFormData(prev => ({ ...prev, package_type: value }))
                }
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="individual" className="dashboard-dropdown-item">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Individual
                    </div>
                  </SelectItem>
                  <SelectItem value="group" className="dashboard-dropdown-item">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Group
                    </div>
                  </SelectItem>
                  <SelectItem value="mixed" className="dashboard-dropdown-item">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Mixed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Sessions Count *</Label>
              <Input
                className={`dashboard-input ${errors.sessions_count ? 'border-red-500' : ''}`}
                type="number"
                min="1"
                placeholder="e.g., 5"
                value={formData.sessions_count}
                onChange={(e) => setFormData(prev => ({ ...prev, sessions_count: e.target.value }))}
              />
              {errors.sessions_count && <p className="text-red-500 text-sm">{errors.sessions_count}</p>}
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Session Duration *</Label>
              <Select
                value={formData.session_duration_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, session_duration_id: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
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
              {errors.session_duration_id && <p className="text-red-500 text-sm">{errors.session_duration_id}</p>}
            </div>
          </div>

          {formData.package_type === 'group' && (
            <div className="space-y-2">
              <Label className="dashboard-label">Max Group Size *</Label>
              <Input
                className={`dashboard-input ${errors.max_group_size ? 'border-red-500' : ''}`}
                type="number"
                min="2"
                placeholder="e.g., 5"
                value={formData.max_group_size}
                onChange={(e) => setFormData(prev => ({ ...prev, max_group_size: e.target.value }))}
              />
              {errors.max_group_size && <p className="text-red-500 text-sm">{errors.max_group_size}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label className="dashboard-label">Description</Label>
            <Textarea
              className="dashboard-textarea"
              placeholder="Describe the package benefits and features..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active" className="dashboard-label">Active Package</Label>
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
              {mode === 'create' ? 'Create Package' : 'Update Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDefinitionModal;
