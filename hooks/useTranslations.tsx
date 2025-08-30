'use client';

import React, { useState, useEffect } from 'react';
import { defaultTranslations } from '@/lib/data/translations';

export function useLanguage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage as 'en' | 'es');
    }
  }, []);

  const changeLanguage = React.useCallback((newLanguage: 'en' | 'es') => {
    console.log('🔄 Changing language from', language, 'to', newLanguage);
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    console.log('💾 Language saved to localStorage:', newLanguage);
  }, [language]);

  return { language, setLanguage: changeLanguage };
}

export function useTranslations(initialContent?: any, language?: 'en' | 'es') {
  const [content, setContent] = useState(initialContent || defaultTranslations);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use provided language or fallback to default
  const currentLanguage = language || 'en';

  // Fetch translations from backend CMS
  const fetchTranslations = async () => {
    try {
      setIsLoading(true);
      // Add cache-busting parameter to ensure fresh content
      const response = await fetch(`/api/content?t=${Date.now()}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.content && Object.keys(result.content).length > 0) {
          setContent(result.content);
        } else {
          // Fallback to defaults if backend returns empty content
          setContent(defaultTranslations);
        }
      } else {
        console.warn('Failed to fetch translations from backend, using defaults');
        setContent(defaultTranslations);
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      setContent(defaultTranslations);
    } finally {
      setIsLoading(false);
    }
  };

  // Update content when initialContent changes or language changes
  useEffect(() => {
    console.log(`🔄 useEffect triggered - initialContent:`, !!initialContent, 'language:', currentLanguage);
    
    // Only set initial content if it's provided and valid
    if (initialContent && Object.keys(initialContent).length > 0) {
      console.log('✅ Using initial content for language:', currentLanguage);
      setContent(initialContent);
    } else {
      // If no initial content provided, fetch from backend
      console.log('🔄 Fetching fresh content from backend for language:', currentLanguage);
      fetchTranslations();
    }
  }, [initialContent, currentLanguage]); // Re-run when language changes

  // Force refresh content when language changes
  useEffect(() => {
    if (currentLanguage && content) {
      console.log(`🔄 Language changed to ${currentLanguage}, ensuring content is available`);
      // If content doesn't have the current language, fetch fresh content
      if (!content[currentLanguage]) {
        console.log(`⚠️ Content missing for language ${currentLanguage}, fetching fresh content`);
        fetchTranslations();
      }
    }
  }, [currentLanguage, content]);

  const updateContent = async (newContent: any) => {
    try {
      setIsLoading(true);
      
      // Update content via API
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContent),
      });

      if (response.ok) {
        const result = await response.json();
        setContent(result.content);
        return { success: true, data: result.content };
      } else {
        throw new Error('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const reloadTranslations = () => {
    fetchTranslations();
  };

  // Get the current language translations, fallback to English if current language not found
  const t = (content?.[currentLanguage as keyof typeof content] || content?.en || defaultTranslations[currentLanguage as keyof typeof defaultTranslations] || defaultTranslations.en);

  return { t, updateContent, isLoading, content, reloadTranslations };
}