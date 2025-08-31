import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  X, 
  LogOut, 
  Users, 
  Calendar, 
  Clock, 
  Package, 
  FileText, 
  Mail, 
  ImageIcon, 
  // Type, 
  Search, 
  CreditCard, 
  Receipt, 
  History, 
  Database,
  Bug,
  User
} from 'lucide-react';
import { BaseButton } from '@/components/ui/BaseButton';
import { useAuth } from '../hooks/useAuth';
import { sidebarButtonStyles, combineStyles } from '@/lib/styles/common';
import { ClientManagement } from './ClientManagement';
import BookingsManagement from './BookingsManagement';
import ScheduleManagement from './ScheduleManagement';
import PackagesAndPricing from './PackagesAndPricing';
import { ContentManagement } from './ContentManagement';
import { EmailManagement } from './EmailManagement';
import { ImageManagement } from './ImageManagement';
// import { LogoManagement } from './LogoManagement';
import { SeoManagement } from './SeoManagement';
import PaymentMethodManagement from './PaymentMethodManagement';
import PaymentRecordsManagement from './PaymentRecordsManagement';
import PurchaseHistoryManagement from './PurchaseHistoryManagement';
import { SettingsManagement } from './SettingsManagement';
import { BugReportManagement } from './BugReportManagement';
import Link from 'next/link';

interface AdminDashboardProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function AdminDashboard({ onClose, isModal = true }: AdminDashboardProps) {
  const { user, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const containerClasses = isModal 
    ? "fixed inset-0 bg-[var(--color-background-primary)] z-50 overflow-hidden"
    : "min-h-screen bg-[var(--color-background-primary)]";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <header className="bg-[var(--color-sidebar-800)] border-b border-[var(--color-border-500)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[var(--color-accent-500)] rounded-full flex items-center justify-center">
              <Settings size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
                Admin Dashboard
              </h1>
              <p className="text-[var(--color-text-secondary)]">Welcome back, {user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Admin Account Button - Only show for admin users */}
            {isAdmin && (
              <Link href="/account">
                <BaseButton
                  size="sm"
                  variant="outline"
                  leftIcon={<User size={16} />}
                >
                  My Account
                </BaseButton>
              </Link>
            )}
            
            {/* Close button - only show in modal mode */}
            {isModal && onClose && (
              <BaseButton
                onClick={onClose}
                size="sm"
                variant="secondary"
                leftIcon={<X size={16} />}
              >
                Close
              </BaseButton>
            )}
            
            <BaseButton
              onClick={signOut}
              size="sm"
              variant="danger"
              leftIcon={<LogOut size={16} />}
            >
              Sign Out
            </BaseButton>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <nav className="w-56 bg-[var(--color-sidebar-800)] border-r border-[var(--color-border-500)] p-3 overflow-y-auto">
          <div className="space-y-1">
            {[
              { key: 'clients', icon: Users, label: 'Client Management' },
              { key: 'bookings', icon: Calendar, label: 'Bookings Management' },
              { key: 'schedules', icon: Clock, label: 'Schedule Management' },
              { key: 'packages', icon: Package, label: 'Packages & Pricing' },
              { key: 'content', icon: FileText, label: 'Content Management' },
              { key: 'email', icon: Mail, label: 'Email Management' },
              { key: 'images', icon: ImageIcon, label: 'Image Management' },
              // { key: 'logo', icon: Type, label: 'Logo Management' },
              { key: 'seo', icon: Search, label: 'SEO Management' },
              { key: 'payment-methods', icon: CreditCard, label: 'Payment Methods' },
              { key: 'payment-records', icon: Receipt, label: 'Payment Records' },
              { key: 'purchase-history', icon: History, label: 'Purchase History' },
              { key: 'settings', icon: Database, label: 'Settings' },
              { key: 'bug-reports', icon: Bug, label: 'Bug Reports' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={combineStyles(
                  sidebarButtonStyles.base,
                  activeTab === key ? sidebarButtonStyles.variants.active : sidebarButtonStyles.variants.inactive
                )}
              >
                <Icon size={18} className={sidebarButtonStyles.icon} />
                <span className={sidebarButtonStyles.label}>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-background-primary)]">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'clients' && <ClientManagement />}
                {activeTab === 'bookings' && <BookingsManagement />}
                {activeTab === 'schedules' && <ScheduleManagement />}
                {activeTab === 'packages' && <PackagesAndPricing />}
                {activeTab === 'content' && <ContentManagement />}
                {activeTab === 'email' && <EmailManagement />}
                {activeTab === 'images' && <ImageManagement />}
                {/* {activeTab === 'logo' && <LogoManagement />} */}
                {activeTab === 'seo' && <SeoManagement />}
                {activeTab === 'payment-methods' && <PaymentMethodManagement />}
                {activeTab === 'payment-records' && <PaymentRecordsManagement />}
                {activeTab === 'purchase-history' && <PurchaseHistoryManagement />}
                {activeTab === 'settings' && <SettingsManagement />}
                {activeTab === 'bug-reports' && <BugReportManagement />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
