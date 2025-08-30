'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';

export function SettingsManagement() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [seedMessage, setSeedMessage] = useState('');

  const handleSeedContent = async () => {
    if (!confirm('Are you sure you want to seed the homepage content? This will overwrite existing content.')) {
      return;
    }

    setIsSeeding(true);
    setSeedStatus('idle');
    setSeedMessage('');

    try {
      const response = await fetch('/api/admin/content/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await response.json();
        setSeedStatus('success');
        setSeedMessage('Homepage content seeded successfully!');
      } else {
        const error = await response.json();
        setSeedStatus('error');
        setSeedMessage(error.message || 'Failed to seed content');
      }
    } catch (error) {
      setSeedStatus('error');
      setSeedMessage('Network error occurred while seeding content');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#C0C0C0]/20 pb-4">
        <h2 className="text-2xl font-heading text-[#EAEAEA] mb-2">Settings</h2>
        <p className="text-[#C0C0C0]">Manage system settings and perform maintenance tasks</p>
      </div>

      {/* Database Management Section */}
      <div className="bg-[#191970]/20 rounded-lg p-6 border border-[#C0C0C0]/20">
        <div className="flex items-center space-x-3 mb-4">
          <Database size={24} className="text-[#FFD700]" />
          <h3 className="text-xl font-heading text-[#EAEAEA]">Database Management</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-[#0A0A23]/30 rounded-lg p-4">
            <h4 className="text-lg font-medium text-[#EAEAEA] mb-2">Seed Homepage Content</h4>
            <p className="text-[#C0C0C0] mb-4">
              This will populate your database with the default English and Spanish content for your homepage. 
              Use this when setting up the site for the first time or to reset content to defaults.
            </p>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSeedContent}
                disabled={isSeeding}
                className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full animate-spin mr-2" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    Seed Content
                  </>
                )}
              </Button>
              
              {seedStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    seedStatus === 'success' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {seedStatus === 'success' ? (
                    <CheckCircle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span className="text-sm">{seedMessage}</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="bg-[#0A0A23]/30 rounded-lg p-4">
            <h4 className="text-lg font-medium text-[#EAEAEA] mb-2">Content Structure</h4>
            <p className="text-[#C0C0C0] mb-3">
              The seed content includes the following sections:
            </p>
            <ul className="text-[#C0C0C0] space-y-1 text-sm">
              <li>• Navigation menu items (English & Spanish)</li>
              <li>• Hero section content</li>
              <li>• Approach section with 3-step process</li>
              <li>• Session details and pricing</li>
              <li>• About section content</li>
              <li>• Booking form labels and messages</li>
              <li>• Call-to-action buttons</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-medium text-yellow-400 mb-2">Important Note</h4>
                <p className="text-yellow-300/80 text-sm">
                  Seeding content will overwrite any existing content in your database. 
                  Make sure to backup any custom content before proceeding. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information Section */}
      <div className="bg-[#191970]/20 rounded-lg p-6 border border-[#C0C0C0]/20">
        <h3 className="text-xl font-heading text-[#EAEAEA] mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0A0A23]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#C0C0C0] mb-2">Database Status</h4>
            <p className="text-[#EAEAEA]">Connected</p>
          </div>
          <div className="bg-[#0A0A23]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#C0C0C0] mb-2">API Status</h4>
            <p className="text-[#EAEAEA]">Operational</p>
          </div>
          <div className="bg-[#0A0A23]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#C0C0C0] mb-2">Content Version</h4>
            <p className="text-[#EAEAEA]">v1.0.0</p>
          </div>
          <div className="bg-[#0A0A23]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#C0C0C0] mb-2">Last Updated</h4>
            <p className="text-[#EAEAEA]">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
