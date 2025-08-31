'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Globe } from 'lucide-react';
import { BaseButton } from './ui/BaseButton';
import { BaseInput } from './ui/BaseInput';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { defaultTranslations, getNestedValue, setNestedValue } from '../lib/data/translations';


interface ContentManagementProps {
  onClose?: () => void;
}

export function ContentManagement({ }: ContentManagementProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(defaultTranslations);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'es'>('en');
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/content`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content && Object.keys(data.content).length > 0) {
          setContent(data.content);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async () => {
    if (!user?.access_token) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (path: string, value: string) => {
    setContent(prev => setNestedValue(prev, path, value));
  };

  const renderField = (path: string, label: string, type: 'input' | 'textarea' = 'input') => {
    const value = getNestedValue(content[activeLanguage], path) || '';
    
    return (
      <div className="space-y-2">
        <Label htmlFor={path} className="dashboard-label">
          {label}
        </Label>
        {type === 'textarea' ? (
          <Textarea
            id={path}
            value={value}
            onChange={(e) => updateField(path, e.target.value)}
            className="dashboard-input"
            rows={3}
          />
        ) : (
          <BaseInput
            id={path}
            value={value}
            onChange={(e) => updateField(path, e.target.value)}
            className="dashboard-input"
          />
        )}
      </div>
    );
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
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Content Management</h1>
          <p className="dashboard-text-secondary">Manage website content and translations</p>
        </div>
        <div className="flex gap-2">
          <BaseButton
            onClick={loadContent}
            className="dashboard-button-reload"
          >
            <RefreshCw size={16} className="mr-2" />
            Reload
          </BaseButton>
          <BaseButton
            onClick={saveContent}
            disabled={isSaving}
            className="dashboard-button-primary"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </BaseButton>
        </div>
      </div>

      <Card className="dashboard-card">
        <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#EAEAEA] font-medium">Language:</span>
          </div>
          <div className="dashboard-language-tabs">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`dashboard-language-tab ${
                activeLanguage === 'en'
                  ? 'dashboard-language-tab-active'
                  : 'dashboard-language-tab-inactive'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLanguage('es')}
              className={`dashboard-language-tab ${
                activeLanguage === 'es'
                  ? 'dashboard-language-tab-active'
                  : 'dashboard-language-tab-inactive'
              }`}
            >
              Español
            </button>
          </div>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="dashboard-tabs">
            <TabsTrigger value="hero" className="dashboard-tab">
              Hero
            </TabsTrigger>
            <TabsTrigger value="approach" className="dashboard-tab">
              Approach
            </TabsTrigger>
            <TabsTrigger value="session" className="dashboard-tab">
              Session
            </TabsTrigger>
            <TabsTrigger value="about" className="dashboard-tab">
              About
            </TabsTrigger>
            <TabsTrigger value="booking" className="dashboard-tab">
              Booking
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="hero" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">Hero Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('hero.title', 'Hero Title')}
                  {renderField('hero.subtitle', 'Hero Subtitle')}
                  {renderField('hero.description', 'Hero Description', 'textarea')}
                  {renderField('hero.ctaText', 'Call to Action Text')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approach" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">Approach Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('approach.title', 'Approach Title')}
                  {renderField('approach.subtitle', 'Approach Subtitle')}
                  {renderField('approach.description', 'Approach Description', 'textarea')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="session" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">Session Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('session.title', 'Session Title')}
                  {renderField('session.subtitle', 'Session Subtitle')}
                  {renderField('session.description', 'Session Description', 'textarea')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">About Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('about.title', 'About Title')}
                  {renderField('about.subtitle', 'About Subtitle')}
                  {renderField('about.description', 'About Description', 'textarea')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="booking" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">Booking Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('booking.title', 'Booking Title')}
                  {renderField('booking.subtitle', 'Booking Subtitle')}
                  {renderField('booking.description', 'Booking Description', 'textarea')}
                  {renderField('booking.form.title', 'Form Title')}
                  {renderField('booking.form.subtitle', 'Form Subtitle')}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
