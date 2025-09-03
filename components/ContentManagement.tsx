'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, Globe, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { defaultTranslations } from '../lib/data/translations';
import { SectionConfig, DEFAULT_SECTIONS } from '@/lib/content-config';
import { CMSTabs } from './cms/CMSTabs';
import { ContentEditor } from './cms/ContentEditor';
import { SectionManager } from './cms/SectionManager';
import { TranslationManager } from './cms/TranslationManager';

// Content types (matches ContentEditor/TranslationManager)
interface ContentStructure {
  [key: string]: string | Record<string, string>;
}

interface TranslationContent {
  [key: string]: string | Record<string, string>;
}
import { useToast, ToastContainer } from './cms/Toast';
import { CMSButton } from './cms/CMSButton';

interface ContentManagementProps {
  onClose?: () => void;
}



export function ContentManagement({ }: ContentManagementProps) {
  const { user } = useAuth();
  const { toasts, showSuccess, showError, showWarning } = useToast();
  // Transform nested defaultTranslations to flat structure expected by CMS components
  const transformNestedToFlat = (nested: any): ContentStructure => {
    const flat: ContentStructure = {};
    if (nested.en) {
      Object.entries(nested.en).forEach(([section, values]) => {
        if (typeof values === 'object' && values !== null) {
          Object.entries(values as Record<string, string>).forEach(([key, value]) => {
            flat[`${section}${key.charAt(0).toUpperCase() + key.slice(1)}`] = value;
          });
        } else {
          flat[section] = values as string;
        }
      });
    }
    if (nested.es) {
      Object.entries(nested.es).forEach(([section, values]) => {
        if (typeof values === 'object' && values !== null) {
          Object.entries(values as Record<string, string>).forEach(([key, value]) => {
            flat[`${section}${key.charAt(0).toUpperCase() + key.slice(1)}Es`] = value;
          });
        } else {
          flat[`${section}Es`] = values as string;
        }
      });
    }
    return flat;
  };

  const [content, setContent] = useState<ContentStructure>(transformNestedToFlat(defaultTranslations));
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'sections' | 'i18n'>('content');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);



  const loadContent = useCallback(async () => {
    if (!user?.access_token) {
      console.log('🔐 loadContent: No access token, skipping API call');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/content`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content && Object.keys(data.content).length > 0) {
          setContent(data.content);
          setHasUnsavedChanges(false);
        }
      } else {
        showError('Load Failed', 'Failed to load content from server. Using default content.', 6000);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      showError('Load Failed', 'Failed to load content. Using default content.', 6000);
    } finally {
      setIsLoading(false);
    }
  }, [user?.access_token, showError, setContent]);

  const loadSections = useCallback(async () => {
    try {
      const response = await fetch('/api/sections');
      
      if (response.ok) {
        const data = await response.json();
        if (data.sections && Array.isArray(data.sections)) {
          setSections(data.sections);
          console.log('✅ Sections loaded from database:', data.sections.length);
        } else {
          console.warn('⚠️ No sections data, using defaults');
          setSections(DEFAULT_SECTIONS);
        }
      } else {
        console.warn('⚠️ Failed to load sections, using defaults');
        setSections(DEFAULT_SECTIONS);
        showWarning('Sections Load Warning', 'Using default section configuration.', 4000);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      setSections(DEFAULT_SECTIONS);
      showWarning('Sections Load Warning', 'Using default section configuration.', 4000);
    }
  }, [showWarning, setSections]);

  useEffect(() => {
    if (user?.access_token) {
      loadContent();
      loadSections();
    }
  }, [user?.access_token, loadContent, loadSections]);

  const saveContent = async () => {
    if (!user?.access_token) {
      showError('Authentication Error', 'Please log in to save content.', 6000);
      return;
    }
    
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save content');
      }
      
      const savedData = await response.json();
      setContent(savedData.content);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      showSuccess('Content Saved!', 'Your changes have been saved successfully and the page will be revalidated.', 4000);
      
      // Trigger revalidation of the front page
      try {
        await fetch('/api/revalidate?path=/', { method: 'POST' });
        console.log('✅ Front page revalidation triggered');
      } catch (revalError) {
        console.warn('⚠️ Revalidation failed:', revalError);
        showWarning('Revalidation Warning', 'Content saved but page revalidation failed. Changes may take time to appear.', 4000);
      }
      
    } catch (error) {
      console.error('Error saving content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Save Failed', `Failed to save content: ${errorMessage}`, 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (newContent: ContentStructure | TranslationContent) => {
    setContent(newContent as ContentStructure);
    setHasUnsavedChanges(true);
  };

  const handleSectionsChange = (newSections: SectionConfig[]) => {
    setSections(newSections);
    setHasUnsavedChanges(true);
  };

  const handleTabChange = (tabId: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs? Your changes will be lost.'
      );
      if (!confirmed) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(tabId as 'content' | 'sections' | 'i18n');
  };

  const handleRefresh = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Refreshing will discard them. Continue?'
      );
      if (!confirmed) return;
    }
    
    await loadContent();
    await loadSections();
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading content management system...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'content',
      label: 'Content Editor',
      icon: <FileText size={16} />,
      content: (
        <ContentEditor
          content={content}
          onContentChange={handleContentChange}
          onSave={saveContent}
          onRefresh={loadContent}
          isLoading={isLoading}
          isSaving={isSaving}
        />
      )
    },
    {
      id: 'sections',
      label: 'Section Management',
      icon: <Settings size={16} />,
      content: (
        <SectionManager
          sections={sections}
          onSectionsChange={handleSectionsChange}
        />
      )
    },
    {
      id: 'i18n',
      label: 'Translation Manager',
      icon: <Globe size={16} />,
      content: (
        <TranslationManager
          content={content}
          onContentChange={handleContentChange}
          onSave={saveContent}
          onRefresh={loadContent}
          isLoading={isLoading}
          isSaving={isSaving}
        />
      )
    }
  ];

  // Show loading state while user is not authenticated
  if (!user?.access_token) {
    return (
      <div className="min-h-screen bg-[#0A0A23] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAEAEA] mx-auto mb-4"></div>
          <p className="text-[#EAEAEA] text-lg">Loading content management system...</p>
          <p className="text-[#9CA3AF] text-sm mt-2">Please wait while we authenticate your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A23] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#EAEAEA] mb-2">Content Management System</h1>
              <p className="text-[#9CA3AF]">Manage your website content, sections, and translations with ISR support</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-lg">
                  <AlertCircle size={16} className="text-[#FFD700]" />
                  <span className="text-[#FFD700] text-sm font-medium">Unsaved changes</span>
                </div>
              )}
              
              {lastSaved && (
                <div className="text-right">
                  <p className="text-[#9CA3AF] text-sm">Last saved</p>
                  <p className="text-[#EAEAEA] text-sm font-medium">
                    {lastSaved.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
                  <span className="text-[#EAEAEA] text-sm">ISR Enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
                  <span className="text-[#EAEAEA] text-sm">Auto-revalidation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div>
                  <span className="text-[#EAEAEA] text-sm">Real-time updates</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CMSButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  variant="secondary"
                  size="sm"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh All
                </CMSButton>
                
                {hasUnsavedChanges && (
                  <CMSButton
                    onClick={saveContent}
                    disabled={isSaving}
                    variant="primary"
                    size="sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                  </CMSButton>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <CMSTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={() => {}} />
    </div>
  );
}
