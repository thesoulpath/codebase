'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface ClientProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  medical_conditions: string | null;
  spiritual_preferences: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    medical_conditions: '',
    spiritual_preferences: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            phone: profileData.phone || '',
            date_of_birth: profileData.date_of_birth || '',
            address: profileData.address || '',
            emergency_contact: profileData.emergency_contact || '',
            medical_conditions: profileData.medical_conditions || '',
            spiritual_preferences: profileData.spiritual_preferences || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          medical_conditions: formData.medical_conditions || null,
          spiritual_preferences: formData.spiritual_preferences || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        emergency_contact: profile.emergency_contact || '',
        medical_conditions: profile.medical_conditions || '',
        spiritual_preferences: profile.spiritual_preferences || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-400">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-2">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleCancel} variant="outline" className="border-[#0a0a23] text-white hover:bg-[#0a0a23]">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-[#16213e] border-[#0a0a23] text-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            <div>
              <Label htmlFor="date_of_birth" className="text-gray-300">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Help us provide better service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-gray-300">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact" className="text-gray-300">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            <div>
              <Label htmlFor="medical_conditions" className="text-gray-300">Medical Conditions</Label>
              <Textarea
                id="medical_conditions"
                value={formData.medical_conditions}
                onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
                rows={2}
                placeholder="Any medical conditions we should be aware of..."
              />
            </div>

            <div>
              <Label htmlFor="spiritual_preferences" className="text-gray-300">Spiritual Preferences</Label>
              <Textarea
                id="spiritual_preferences"
                value={formData.spiritual_preferences}
                onChange={(e) => setFormData({ ...formData, spiritual_preferences: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
                rows={2}
                placeholder="Your spiritual beliefs and preferences..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
