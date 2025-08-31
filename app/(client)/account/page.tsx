'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PackageIcon, ShoppingCart, Settings } from 'lucide-react';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BugReportButton } from '@/components/BugReportButton';

interface DashboardStats {
  totalBookings: number;
  activePackages: number;
  totalSpent: number;
  upcomingSessions: number;
}

export default function AccountPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activePackages: 0,
    totalSpent: 0,
    upcomingSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.access_token) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      if (!user?.access_token) {
        console.log('No access token available');
        return;
      }

      console.log('🔍 Fetching dashboard stats...');
      const response = await fetch('/api/client/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dashboard stats response:', result);
        
        if (result.success) {
          setStats(result.data);
        } else {
          console.error('API returned error:', result.error);
        }
      } else {
        console.error('Failed to fetch dashboard stats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Admin Button */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-white">Welcome to Your Account</h1>
          <p className="text-gray-400 mt-2">Manage your spiritual journey and sessions</p>
        </div>
        
        {/* Admin Dashboard Button - Only show for admin users */}
        {isAdmin && (
          <div className="flex items-center space-x-3">
            <Link href="/admin">
              <Button 
                variant="outline" 
                className="bg-[#1a1a2e] border-[#16213e] text-white hover:bg-[#16213e] hover:border-[#ffd700]"
              >
                <Settings size={16} className="mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-[#ffd700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffd700]">{stats.totalBookings}</div>
            <p className="text-xs text-gray-400">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
            <PackageIcon className="h-4 w-4 text-[#ffd700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffd700]">{stats.activePackages}</div>
            <p className="text-xs text-gray-400">Available sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#ffd700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffd700]">${stats.totalSpent}</div>
            <p className="text-xs text-gray-400">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <CalendarIcon className="h-4 w-4 text-[#ffd700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ffd700]">{stats.upcomingSessions}</div>
            <p className="text-xs text-gray-400">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-[#ffd700]" />
              <span>Book a Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-4">
              Schedule your next spiritual consultation with our experienced practitioners.
            </p>
            <Link href="/account/book">
              <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                Book Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PackageIcon className="w-5 h-5 text-[#ffd700]" />
              <span>View Packages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-4">
              Explore our available packages and choose the perfect one for your journey.
            </p>
            <Link href="/account/packages">
              <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                Browse Packages
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-[#ffd700]" />
              <span>Purchase History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-4">
              View your purchase history and manage your account transactions.
            </p>
            <Link href="/account/purchase">
              <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bug Reports Section */}
      <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PackageIcon className="w-5 h-5 text-[#ffd700]" />
            <span>Bug Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Found a bug or issue?</p>
            <p className="text-gray-500 text-sm mb-4">Report it using the bug button in the bottom right corner</p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <PackageIcon size={16} className="text-red-400" />
              <span className="text-red-400 text-sm">Click the bug icon to report issues</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">No recent activity to display</p>
            <p className="text-gray-500 text-sm mt-2">Your recent bookings and purchases will appear here</p>
          </div>
        </CardContent>
      </Card>

      {/* Bug Report Button */}
      <BugReportButton />
    </div>
  );
}
