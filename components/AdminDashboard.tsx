import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Settings, LogOut, Search, FileText, Type, Calendar, X, Mail, Image as ImageIcon, Database } from 'lucide-react';
import { Button } from './ui/button';


import { useAuth } from '../hooks/useAuth';
import { EmailManagement } from './EmailManagement';
import { ImageManagement } from './ImageManagement';
import { ContentManagement } from './ContentManagement';
import { ClientManagement } from './ClientManagement';
import { ScheduleManagement } from './ScheduleManagement';
import { LogoManagement } from './LogoManagement';
import { SeoManagement } from './SeoManagement';
import { SettingsManagement } from './SettingsManagement';



export function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');



  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#C0C0C0]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-lg z-50 overflow-hidden">
      {/* Header */}
      <header className="bg-[#191970]/90 backdrop-blur-lg border-b border-[#C0C0C0]/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
              <Settings size={20} className="text-[#0a0a0a]" />
            </div>
            <div>
              <h1 className="text-2xl font-heading text-[#EAEAEA]">Admin Dashboard</h1>
              <p className="text-[#C0C0C0]">Welcome back, {user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
            >
              <X size={16} className="mr-2" />
              Close
            </Button>
            
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-[#0A0A23]/30 border-r border-[#C0C0C0]/20 p-4">
          <div className="space-y-2">
            {[
              { key: 'clients', icon: Users, label: 'Client Management' },
              { key: 'schedules', icon: Calendar, label: 'Schedule Management' },
              { key: 'content', icon: FileText, label: 'Content Management' },
              { key: 'emails', icon: Mail, label: 'Email Management' },
              { key: 'images', icon: ImageIcon, label: 'Image Management' },
              { key: 'logo', icon: Type, label: 'Logo Management' },
              { key: 'seo', icon: Search, label: 'SEO Management' },
              { key: 'settings', icon: Database, label: 'Settings' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                    : 'text-[#C0C0C0] hover:text-[#EAEAEA] hover:bg-[#C0C0C0]/5'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'clients' && <ClientManagement />}

              {activeTab === 'schedules' && <ScheduleManagement />}

              {activeTab === 'content' && (
                <ContentManagement />
              )}

              {activeTab === 'emails' && (
                <EmailManagement />
              )}

              {activeTab === 'images' && (
                <ImageManagement />
              )}

              {activeTab === 'logo' && (
                <LogoManagement />
              )}

              {activeTab === 'seo' && (
                <SeoManagement />
              )}

              {activeTab === 'settings' && (
                <SettingsManagement />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>


    </div>
  );
}
