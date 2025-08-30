'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Edit, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
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
        <Label htmlFor={path} className="text-sm font-medium text-[#EAEAEA]">
          {label}
        </Label>
        {type === 'textarea' ? (
          <Textarea
            id={path}
            value={value}
            onChange={(e) => updateField(path, e.target.value)}
            className="bg-[#191970]/20 border-[#FFD700]/20 text-[#EAEAEA] placeholder:text-[#C0C0C0]/50"
            rows={3}
          />
        ) : (
          <Input
            id={path}
            value={value}
            onChange={(e) => updateField(path, e.target.value)}
            className="bg-[#191970]/20 border-[#FFD700]/20 text-[#EAEAEA] placeholder:text-[#C0C0C0]/50"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Edit className="w-6 h-6 text-[#FFD700]" />
          <h2 className="text-2xl font-heading text-[#EAEAEA]">Content Management</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadContent}
            variant="outline"
            size="sm"
            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#0a0a0a]"
          >
            <RefreshCw size={16} className="mr-2" />
            Reload
          </Button>
          <Button
            onClick={saveContent}
            disabled={isSaving}
            className="bg-[#FFD700] text-[#0a0a0a] hover:bg-[#FFA500]"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="bg-[#191970]/20 border border-[#FFD700]/20 rounded-lg p-4">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#EAEAEA] font-medium">Language:</span>
          </div>
          <div className="flex bg-[#0a0a0a] rounded-lg p-1">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'en'
                  ? 'bg-[#FFD700] text-[#0a0a0a]'
                  : 'text-[#C0C0C0] hover:text-[#EAEAEA]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLanguage('es')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'es'
                  ? 'bg-[#FFD700] text-[#0a0a0a]'
                  : 'text-[#C0C0C0] hover:text-[#EAEAEA]'
              }`}
            >
              Español
            </button>
          </div>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[#0a0a0a] border border-[#FFD700]/20">
            <TabsTrigger value="hero" className="text-[#C0C0C0] data-[state=active]:text-[#FFD700]">
              Hero
            </TabsTrigger>
            <TabsTrigger value="approach" className="text-[#C0C0C0] data-[state=active]:text-[#FFD700]">
              Approach
            </TabsTrigger>
            <TabsTrigger value="session" className="text-[#C0C0C0] data-[state=active]:text-[#FFD700]">
              Session
            </TabsTrigger>
            <TabsTrigger value="about" className="text-[#C0C0C0] data-[state=active]:text-[#FFD700]">
              About
            </TabsTrigger>
            <TabsTrigger value="booking" className="text-[#C0C0C0] data-[state=active]:text-[#FFD700]">
              Booking
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="hero" className="space-y-4">
              <Card className="bg-[#191970]/20 border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">Hero Section</CardTitle>
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
              <Card className="bg-[#191970]/20 border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">Approach Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('approach.title', 'Approach Title')}
                  {renderField('approach.subtitle', 'Approach Subtitle')}
                  {renderField('approach.description', 'Approach Description', 'textarea')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="session" className="space-y-4">
              <Card className="bg-[#191970]/20 border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">Session Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('session.title', 'Session Title')}
                  {renderField('session.subtitle', 'Session Subtitle')}
                  {renderField('session.description', 'Session Description', 'textarea')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <Card className="bg-[#191970]/20 border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">About Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('about.title', 'About Title')}
                  {renderField('about.subtitle', 'About Subtitle')}
                  {renderField('about.description', 'About Description', 'textarea')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="booking" className="space-y-4">
              <Card className="bg-[#191970]/20 border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">Booking Section</CardTitle>
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
      </div>
    </div>
  );
}
