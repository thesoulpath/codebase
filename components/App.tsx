'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { BookingSection } from '@/components/BookingSection';
import { AdminDashboard } from '@/components/AdminDashboard';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations, useLanguage } from '@/hooks/useTranslations';

import { Header } from './Header';
import { ConstellationBackground } from './ConstellationBackground';
import { HeroSection } from './HeroSection';
import { ApproachSection } from './ApproachSection';
import { SessionSection } from './SessionSection';
import { AboutSection } from './AboutSection';
import { MobileMenu } from './MobileMenu';
import { BugReportButton } from './BugReportButton';

export function App() {
  const { language, setLanguage } = useLanguage();
  const { t, reloadTranslations } = useTranslations(undefined, language);
  const [currentSection, setCurrentSection] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isAdmin, signIn } = useAuth();

  // Debug logging for language changes
  console.log('🌐 App Component - Current language:', language);
  console.log('🌐 App Component - Current translations:', t?.nav?.invitation);

  const sections = ['invitation', 'approach', 'session', 'about', 'apply'];

  // Fullpage scroll functionality
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      
      setCurrentSection((prev) => {
        const next = prev + direction;
        return Math.max(0, Math.min(sections.length - 1, next));
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        setCurrentSection((prev) => Math.min(sections.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        setCurrentSection((prev) => Math.max(0, prev - 1));
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      const minSwipeDistance = 50;

      if (Math.abs(diff) > minSwipeDistance) {
        if (diff > 0) {
          setCurrentSection((prev) => Math.min(sections.length - 1, prev + 1));
        } else {
          setCurrentSection((prev) => Math.max(0, prev - 1));
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showAdmin, showLoginModal, isMenuOpen, sections.length]);

  const scrollToSection = (sectionName: string) => {
    const index = sections.indexOf(sectionName);
    if (index !== -1) {
      setCurrentSection(index);
    }
    setIsMenuOpen(false);
  };

  const scrollToSectionByIndex = (index: number) => {
    setCurrentSection(index);
  };

  const handleLoginClick = () => {
    if (user && isAdmin) {
      setShowAdmin(true);
      setHasExplicitlyClosed(false); // Reset the flag when user wants to access admin again
    } else {
      setShowLoginModal(true);
    }
  };

  // Handle successful authentication - automatically redirect to admin dashboard
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { user: !!user, isAdmin, showAdmin, hasExplicitlyClosed, showLoginModal });
    
    if (user && isAdmin) {
      // If user is authenticated and is admin, automatically show admin dashboard
      if (showLoginModal) {
        setShowLoginModal(false);
      }
      
      // Only auto-redirect if not explicitly closed
      if (!hasExplicitlyClosed) {
        console.log('🚀 Auto-redirecting to dashboard...');
        // Small delay to ensure smooth transition and show loading state
        const timer = setTimeout(() => {
          console.log('⏰ Timer fired, setting showAdmin to true');
          setShowAdmin(true);
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        console.log('⛔ Auto-redirect blocked: hasExplicitlyClosed = true');
      }
    } else if (!user) {
      // If user logs out, return to main page
      console.log('🚪 User logged out, hiding dashboard');
      setShowAdmin(false);
      setHasExplicitlyClosed(false); // Reset the flag when user logs out
    }
  }, [user, isAdmin, showLoginModal, hasExplicitlyClosed]); // Removed showAdmin dependency

  // Show loading state while redirecting to admin dashboard
  if (user && isAdmin && !showAdmin && !showLoginModal && !hasExplicitlyClosed) {
    return (
      <div className="min-h-screen bg-[#0A0A23] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-[#FFD700] text-xl mb-2">Redirecting to Admin Dashboard...</div>
          <div className="text-[#C0C0C0] text-sm">Please wait while we set up your workspace</div>
        </div>
      </div>
    );
  }

  // Don't render navigation elements until translations are loaded
  // Only check for essential translations to avoid endless loading
  if (!t || !t.hero || !t.nav) {
    return (
      <div className="min-h-screen bg-[#0A0A23] flex items-center justify-center">
        <div className="text-[#FFD700] text-xl">Loading...</div>
      </div>
    );
  }

  if (showAdmin) {
    return <AdminDashboard onClose={() => {
      console.log('🔴 Close button clicked, setting hasExplicitlyClosed to true');
      setShowAdmin(false);
      setHasExplicitlyClosed(true); // Mark that user explicitly closed the dashboard
      // Reload translations when closing admin to pick up any content changes
      reloadTranslations();
    }} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#191970] to-[#0A0A23] text-[#EAEAEA] mobile-container">
      <ConstellationBackground />
      
      <Header 
        language={language}
        setLanguage={setLanguage}
        scrollToSection={scrollToSection}
        t={t}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onLoginClick={handleLoginClick}
        user={user}
        isAdmin={isAdmin}
      />
      
      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sections={sections}
        currentSection={currentSection}
        scrollToSection={scrollToSection}
        language={language}
        setLanguage={setLanguage}
        t={t}
        user={user}
        isAdmin={isAdmin}
        onLoginClick={handleLoginClick}
        onAdminClick={() => setShowAdmin(true)}
      />

      {/* Main content sections */}
      <main className="h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full"
          >
            {currentSection === 0 && <HeroSection t={t} />}
            {currentSection === 1 && <ApproachSection t={t} />}
            {currentSection === 2 && <SessionSection t={t} scrollToSection={scrollToSection} />}
            {currentSection === 3 && <AboutSection t={t} />}
            {currentSection === 4 && <BookingSection t={t} language={language} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Section Navigation Dots */}
      <div className="fixed right-2 sm:right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-2 sm:space-y-3 lg:space-y-4 navigation-dots">
        {sections.map((section, index) => (
          <motion.button
            key={section}
            onClick={() => scrollToSectionByIndex(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-300 touch-manipulation relative ${
              currentSection === index 
                ? 'bg-[#FFD700] border-[#FFD700] cosmic-glow shadow-lg shadow-[#FFD700]/30' 
                : 'bg-transparent border-[#C0C0C0]/50 hover:border-[#FFD700] hover:bg-[#FFD700]/10'
            }`}
            title={t.nav[section as keyof typeof t.nav]}
            aria-label={`Go to ${t.nav[section as keyof typeof t.nav]} section`}
          >
            {/* Active indicator ring */}
            {currentSection === index && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.3 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 bg-[#FFD700] rounded-full -z-10"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Bug Report Button */}
      <BugReportButton />

      {/* Navigation arrows */}
      {currentSection > 0 && (
        <motion.button
          onClick={() => scrollToSectionByIndex(currentSection - 1)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 left-6 w-12 h-12 rounded-full border-2 border-[#C0C0C0]/30 bg-black/20 backdrop-blur-md flex items-center justify-center text-[#C0C0C0] hover:text-[#FFD700] hover:border-[#FFD700]/50 transition-all duration-300 z-[9995] navigation-arrow touch-manipulation"
          aria-label="Previous section"
        >
          <ChevronLeft size={20} />
        </motion.button>
      )}

      {currentSection < sections.length - 1 && (
        <motion.button
          onClick={() => scrollToSectionByIndex(currentSection + 1)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full border-2 border-[#C0C0C0]/30 bg-black/20 backdrop-blur-md flex items-center justify-center text-[#C0C0C0] hover:text-[#FFD700] hover:border-[#FFD700]/50 transition-all duration-300 z-[9995] navigation-arrow touch-manipulation"
          aria-label="Next section"
        >
          <ChevronRight size={20} />
        </motion.button>
      )}

      {/* Fixed Bottom CTA Button - Shows on all pages except booking form */}
      <AnimatePresence>
        {currentSection !== 4 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-3 sm:bottom-4 lg:bottom-6 left-0 right-0 z-[9996] cta-button-container flex justify-center"
          >
            <motion.button
              onClick={() => scrollToSection('apply')}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 px-6 sm:px-8 lg:px-10 py-3 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg font-medium rounded-lg shadow-lg shadow-[#FFD700]/20 cosmic-glow touch-manipulation transition-all duration-300 whitespace-nowrap"
            >
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <span>{t.cta.bookReading}</span>
                <motion.div
                  animate={{ x: [0, 2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#0A0A23] rounded-full flex-shrink-0"
                />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={async (email: string, password: string) => {
          try {
            const { data, error } = await signIn(email, password);
            if (error) {
              console.error('Login error:', error);
              return false;
            }
            if (data) {
              setShowLoginModal(false);
              return true;
            }
            return false;
          } catch (error) {
            console.error('Login failed:', error);
            return false;
          }
        }}
      />
    </div>
  );
}
