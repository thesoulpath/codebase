import { createAdminClient } from './supabase/admin';
import { defaultTranslations } from './data/translations';

// Import the profile image from public assets
const joseProfileImage = '/assets/cf4f95a6cc4d03023c0e98479a93fe16d4ef06f2.png';

// Direct data fetching functions
async function fetchContent() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('content').select('*').single();
    return data && Object.keys(data).length > 0 
      ? { 
          en: { ...defaultTranslations.en, ...data.en }, 
          es: { ...defaultTranslations.en, ...data.es } 
        } 
      : defaultTranslations;
  } catch (error) {
    console.error('Error fetching content:', error);
    return defaultTranslations;
  }
}

async function fetchLogoSettings() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('logo_settings').select('*').single();
    return data || { type: 'text', text: 'SOULPATH', isActive: true };
  } catch (error) {
    console.error('Error fetching logo settings:', error);
    return { type: 'text', text: 'SOULPATH', isActive: true };
  }
}

async function fetchProfileImage() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('images').select('profileImage').single();
    return data?.profileImage || joseProfileImage;
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return joseProfileImage;
  }
}

async function fetchSchedules() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('schedules').select('*').eq('is_available', true);
    return data || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

async function fetchSeoSettings() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('seo').select('*').single();
    return data || {};
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return {};
  }
}

export async function getTranslations() {
  return await fetchContent();
}

export async function getLogoSettings() {
  return await fetchLogoSettings();
}

export async function getProfileImage() {
  return await fetchProfileImage();
}

export async function getSchedules() {
  return await fetchSchedules();
}

export async function getSeoSettings() {
  return await fetchSeoSettings();
}

export async function getInitialData() {
  try {
    const [translations, logoSettings, profileImage, schedules, seoSettings] = await Promise.all([
      fetchContent(),
      fetchLogoSettings(),
      fetchProfileImage(),
      fetchSchedules(),
      fetchSeoSettings()
    ]);

    return {
      translations,
      logoSettings,
      profileImage,
      schedules,
      seoSettings
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      translations: defaultTranslations,
      logoSettings: { type: 'text', text: 'SOULPATH', isActive: true },
      profileImage: joseProfileImage,
      schedules: [],
      seoSettings: {}
    };
  }
}
