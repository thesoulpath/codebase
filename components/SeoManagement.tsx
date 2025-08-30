import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Search, Globe, RefreshCw, Eye, EyeOff, Upload, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

import { useAuth } from '../hooks/useAuth';


interface SeoSettings {
  // Basic SEO
  title: string;
  description: string;
  keywords: string;
  author: string;
  
  // Open Graph / Social Media
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  ogImageFile?: string;
  
  // Twitter Card
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;
  twitterImageFile?: string;
  
  // Technical SEO
  robots: string;
  canonical: string;
  language: string;
  
  // Analytics
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  
  // Structured Data
  organizationName: string;
  organizationType: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  // Verification
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

const defaultSeoSettings: SeoSettings = {
  title: 'SoulPath - Professional Astrology Consultations with José Garfias',
  description: 'Discover your cosmic blueprint with personalized astrology readings. Professional consultations with certified astrologer José Garfias. Book your session today.',
  keywords: 'astrology, birth chart, horoscope, zodiac, natal chart, astrology reading, astrology consultation, cosmic guidance, spiritual guidance',
  author: 'José Garfias',
  
  ogTitle: 'SoulPath - Professional Astrology Consultations',
  ogDescription: 'Discover your cosmic blueprint with personalized astrology readings. Professional consultations with certified astrologer José Garfias.',
  
  twitterTitle: 'SoulPath - Professional Astrology Consultations',
  twitterDescription: 'Discover your cosmic blueprint with personalized astrology readings. Professional consultations with certified astrologer José Garfias.',
  
  robots: 'index, follow',
  canonical: 'https://soulpath.lat',
  language: 'en',
  
  organizationName: 'SoulPath Astrology',
  organizationType: 'ProfessionalService',
  contactEmail: 'info@soulpath.lat',
  contactPhone: '',
  address: ''
};

export function SeoManagement() {
  const { user } = useAuth();
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(defaultSeoSettings);
  const [originalSettings, setOriginalSettings] = useState<SeoSettings>(defaultSeoSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'social' | 'technical' | 'analytics' | 'structured'>('basic');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'og' | 'twitter' | null>(null);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(seoSettings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [seoSettings, originalSettings]);

  // Load SEO settings on mount
  useEffect(() => {
    loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading SEO settings...');
      const response = await fetch(`/api/seo`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // If no settings exist in database, use default
        const loadedSettings = { ...defaultSeoSettings, ...data.seo };
        
        console.log('SEO settings loaded successfully:', loadedSettings);
        setSeoSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } else {
        console.log('SEO endpoint returned non-OK status:', response.status, response.statusText);
        // Use default settings on server error
        setSeoSettings(defaultSeoSettings);
        setOriginalSettings(defaultSeoSettings);
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      // Use default settings on error - this is not a critical failure
      setSeoSettings(defaultSeoSettings);
      setOriginalSettings(defaultSeoSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSeoSettings = async () => {
    if (!user?.access_token) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/seo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seo: seoSettings })
      });

      if (!response.ok) {
        throw new Error('Failed to save SEO settings');
      }
      
      setOriginalSettings(seoSettings);
      setHasUnsavedChanges(false);
      alert('SEO settings saved successfully!');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      alert('Failed to save SEO settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'og' | 'twitter') => {
    if (!user?.access_token) return;
    
    try {
      setUploadingImage(type);
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', `seo-${type}`);
      
      const response = await fetch(`/api/admin/images/seo-${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      if (type === 'og') {
        setSeoSettings(prev => ({
          ...prev,
          ogImage: data.url,
          ogImageFile: data.filename
        }));
      } else {
        setSeoSettings(prev => ({
          ...prev,
          twitterImage: data.url,
          twitterImageFile: data.filename
        }));
      }
      
      alert(`${type === 'og' ? 'Open Graph' : 'Twitter'} image uploaded successfully!`);
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(null);
    }
  };

  const resetToDefault = () => {
    if (confirm('This will reset all SEO settings to default values. Are you sure?')) {
      setSeoSettings(defaultSeoSettings);
    }
  };

  const discardChanges = () => {
    if (confirm('This will discard all unsaved changes. Are you sure?')) {
      setSeoSettings(originalSettings);
    }
  };

  const updateSetting = (key: keyof SeoSettings, value: string) => {
    setSeoSettings(prev => ({ ...prev, [key]: value }));
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

  const sections = [
    { id: 'basic', label: 'Basic SEO', icon: Search },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'technical', label: 'Technical', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: Search },
    { id: 'structured', label: 'Structured Data', icon: Search }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-[#EAEAEA] mb-2">SEO Management</h2>
          <p className="text-[#C0C0C0]">Optimize your website for search engines and social media</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-400">Unsaved changes</span>
            </div>
          )}
          
          <Button
            onClick={discardChanges}
            variant="outline"
            size="sm"
            disabled={!hasUnsavedChanges}
            className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
          >
            <RefreshCw size={16} className="mr-2" />
            Discard
          </Button>
          
          <Button
            onClick={resetToDefault}
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={16} className="mr-2" />
            Reset All
          </Button>
          
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            size="sm"
            className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
          >
            {showPreview ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
            Preview
          </Button>
          
          <Button
            onClick={saveSeoSettings}
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* SEO Score Card */}
      <Card className="bg-[#191970]/20 border-[#FFD700]/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.title ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Title Tag</p>
            </div>
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.description ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Meta Description</p>
            </div>
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.ogImage ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Social Image</p>
            </div>
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.organizationName ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Structured Data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Selector */}
        <div className="lg:col-span-1">
          <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
            <CardHeader>
              <CardTitle className="text-[#EAEAEA] text-lg">SEO Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                          : 'text-[#C0C0C0] hover:text-[#EAEAEA] hover:bg-[#C0C0C0]/5'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon size={14} />
                        <span className="text-sm">{section.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Editor */}
        <div className="lg:col-span-3">
          <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
            <CardHeader>
              <CardTitle className="text-[#EAEAEA] text-lg">
                {sections.find(s => s.id === activeSection)?.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Basic SEO */}
                {activeSection === 'basic' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[#C0C0C0]">Page Title</Label>
                      <Input
                        id="title"
                        value={seoSettings.title}
                        onChange={(e) => updateSetting('title', e.target.value)}
                        placeholder="Enter page title..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                      <p className="text-xs text-[#C0C0C0]/70">
                        Length: {seoSettings.title.length}/60 characters (recommended: 50-60)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-[#C0C0C0]">Meta Description</Label>
                      <Textarea
                        id="description"
                        value={seoSettings.description}
                        onChange={(e) => updateSetting('description', e.target.value)}
                        placeholder="Enter meta description..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] min-h-[80px]"
                      />
                      <p className="text-xs text-[#C0C0C0]/70">
                        Length: {seoSettings.description.length}/155 characters (recommended: 150-155)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keywords" className="text-[#C0C0C0]">Keywords</Label>
                      <Textarea
                        id="keywords"
                        value={seoSettings.keywords}
                        onChange={(e) => updateSetting('keywords', e.target.value)}
                        placeholder="Enter keywords separated by commas..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-[#C0C0C0]">Author</Label>
                      <Input
                        id="author"
                        value={seoSettings.author}
                        onChange={(e) => updateSetting('author', e.target.value)}
                        placeholder="Enter author name..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>
                  </>
                )}

                {/* Social Media */}
                {activeSection === 'social' && (
                  <>
                    <h3 className="text-lg font-heading text-[#FFD700]">Open Graph (Facebook)</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ogTitle" className="text-[#C0C0C0]">OG Title</Label>
                      <Input
                        id="ogTitle"
                        value={seoSettings.ogTitle}
                        onChange={(e) => updateSetting('ogTitle', e.target.value)}
                        placeholder="Enter Open Graph title..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ogDescription" className="text-[#C0C0C0]">OG Description</Label>
                      <Textarea
                        id="ogDescription"
                        value={seoSettings.ogDescription}
                        onChange={(e) => updateSetting('ogDescription', e.target.value)}
                        placeholder="Enter Open Graph description..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#C0C0C0]">OG Image</Label>
                      {seoSettings.ogImage && (
                        <div className="p-3 bg-[#0A0A23]/30 border border-[#C0C0C0]/20 rounded-lg">
                          <img src={seoSettings.ogImage} alt="OG Preview" className="max-h-32 object-contain" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="og-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'og');
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => document.getElementById('og-upload')?.click()}
                        variant="outline"
                        disabled={uploadingImage === 'og'}
                        className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        {uploadingImage === 'og' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Upload size={16} className="mr-2" />
                        )}
                        Upload OG Image
                      </Button>
                      <p className="text-xs text-[#C0C0C0]/70">
                        Recommended: 1200x630px JPG or PNG
                      </p>
                    </div>

                    <h3 className="text-lg font-heading text-[#FFD700] mt-6">Twitter Card</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twitterTitle" className="text-[#C0C0C0]">Twitter Title</Label>
                      <Input
                        id="twitterTitle"
                        value={seoSettings.twitterTitle}
                        onChange={(e) => updateSetting('twitterTitle', e.target.value)}
                        placeholder="Enter Twitter title..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitterDescription" className="text-[#C0C0C0]">Twitter Description</Label>
                      <Textarea
                        id="twitterDescription"
                        value={seoSettings.twitterDescription}
                        onChange={(e) => updateSetting('twitterDescription', e.target.value)}
                        placeholder="Enter Twitter description..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#C0C0C0]">Twitter Image</Label>
                      {seoSettings.twitterImage && (
                        <div className="p-3 bg-[#0A0A23]/30 border border-[#C0C0C0]/20 rounded-lg">
                          <img src={seoSettings.twitterImage} alt="Twitter Preview" className="max-h-32 object-contain" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="twitter-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'twitter');
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => document.getElementById('twitter-upload')?.click()}
                        variant="outline"
                        disabled={uploadingImage === 'twitter'}
                        className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        {uploadingImage === 'twitter' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Upload size={16} className="mr-2" />
                        )}
                        Upload Twitter Image
                      </Button>
                    </div>
                  </>
                )}

                {/* Technical SEO */}
                {activeSection === 'technical' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="robots" className="text-[#C0C0C0]">Robots Meta Tag</Label>
                      <Input
                        id="robots"
                        value={seoSettings.robots}
                        onChange={(e) => updateSetting('robots', e.target.value)}
                        placeholder="e.g., index, follow"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="canonical" className="text-[#C0C0C0]">Canonical URL</Label>
                      <Input
                        id="canonical"
                        value={seoSettings.canonical}
                        onChange={(e) => updateSetting('canonical', e.target.value)}
                        placeholder="https://soulpath.lat"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-[#C0C0C0]">Language Code</Label>
                      <Input
                        id="language"
                        value={seoSettings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                        placeholder="en"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleSiteVerification" className="text-[#C0C0C0]">Google Site Verification</Label>
                      <Input
                        id="googleSiteVerification"
                        value={seoSettings.googleSiteVerification || ''}
                        onChange={(e) => updateSetting('googleSiteVerification', e.target.value)}
                        placeholder="Enter verification code..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bingSiteVerification" className="text-[#C0C0C0]">Bing Site Verification</Label>
                      <Input
                        id="bingSiteVerification"
                        value={seoSettings.bingSiteVerification || ''}
                        onChange={(e) => updateSetting('bingSiteVerification', e.target.value)}
                        placeholder="Enter verification code..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>
                  </>
                )}

                {/* Analytics */}
                {activeSection === 'analytics' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="googleAnalyticsId" className="text-[#C0C0C0]">Google Analytics ID</Label>
                      <Input
                        id="googleAnalyticsId"
                        value={seoSettings.googleAnalyticsId || ''}
                        onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                        placeholder="GA4-XXXXXXXXX"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleTagManagerId" className="text-[#C0C0C0]">Google Tag Manager ID</Label>
                      <Input
                        id="googleTagManagerId"
                        value={seoSettings.googleTagManagerId || ''}
                        onChange={(e) => updateSetting('googleTagManagerId', e.target.value)}
                        placeholder="GTM-XXXXXXX"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebookPixelId" className="text-[#C0C0C0]">Facebook Pixel ID</Label>
                      <Input
                        id="facebookPixelId"
                        value={seoSettings.facebookPixelId || ''}
                        onChange={(e) => updateSetting('facebookPixelId', e.target.value)}
                        placeholder="Enter Facebook Pixel ID..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>
                  </>
                )}

                {/* Structured Data */}
                {activeSection === 'structured' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName" className="text-[#C0C0C0]">Organization Name</Label>
                      <Input
                        id="organizationName"
                        value={seoSettings.organizationName}
                        onChange={(e) => updateSetting('organizationName', e.target.value)}
                        placeholder="SoulPath Astrology"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationType" className="text-[#C0C0C0]">Organization Type</Label>
                      <Input
                        id="organizationType"
                        value={seoSettings.organizationType}
                        onChange={(e) => updateSetting('organizationType', e.target.value)}
                        placeholder="ProfessionalService"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="text-[#C0C0C0]">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        value={seoSettings.contactEmail}
                        onChange={(e) => updateSetting('contactEmail', e.target.value)}
                        placeholder="info@soulpath.lat"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-[#C0C0C0]">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={seoSettings.contactPhone}
                        onChange={(e) => updateSetting('contactPhone', e.target.value)}
                        placeholder="+1-XXX-XXX-XXXX"
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-[#C0C0C0]">Business Address</Label>
                      <Textarea
                        id="address"
                        value={seoSettings.address}
                        onChange={(e) => updateSetting('address', e.target.value)}
                        placeholder="Enter business address..."
                        className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] min-h-[60px]"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardHeader>
            <CardTitle className="text-[#EAEAEA] text-lg">SEO Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Google Search Result Preview */}
              <div>
                <h3 className="text-lg font-heading text-[#FFD700] mb-3">Google Search Result</h3>
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">{seoSettings.title}</div>
                  <div className="text-green-700 text-sm">{seoSettings.canonical}</div>
                  <div className="text-gray-600 text-sm mt-1">{seoSettings.description}</div>
                </div>
              </div>

              {/* Social Media Preview */}
              {seoSettings.ogImage && (
                <div>
                  <h3 className="text-lg font-heading text-[#FFD700] mb-3">Facebook Preview</h3>
                  <div className="border border-gray-300 rounded-lg bg-white max-w-md">
                    <img src={seoSettings.ogImage} alt="OG Preview" className="w-full h-48 object-cover rounded-t-lg" />
                    <div className="p-3">
                      <div className="font-semibold text-black">{seoSettings.ogTitle}</div>
                      <div className="text-gray-600 text-sm">{seoSettings.ogDescription}</div>
                      <div className="text-gray-500 text-xs uppercase">{seoSettings.canonical}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className="bg-[#191970]/90 backdrop-blur-lg border-[#FFD700]/30 shadow-lg shadow-[#FFD700]/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-[#EAEAEA] text-sm">You have unsaved changes</span>
                <div className="flex space-x-2">
                  <Button
                    onClick={discardChanges}
                    variant="outline"
                    size="sm"
                    className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={saveSeoSettings}
                    disabled={isSaving}
                    size="sm"
                    className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
                  >
                    {isSaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-[#0A0A23] border-t-transparent rounded-full"
                      />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}