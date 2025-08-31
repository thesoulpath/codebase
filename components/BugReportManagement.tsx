'use client';

import React, { useState, useEffect } from 'react';

import { 
  Bug, 
  Eye, 
  MessageSquare, 
  Archive, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,

  Search
} from 'lucide-react';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseModal } from '@/components/ui/BaseModal';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface BugReport {
  id: string;
  title: string;
  description: string;
  screenshot: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  reporterId: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  archivedAt: string | null;
  reporter?: {
    fullName: string;
    email: string;
  };
  assignee?: {
    fullName: string;
    email: string;
  };
  comments?: BugComment[];
}

interface BugComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  author?: {
    fullName: string;
    email: string;
  };
}

interface BugReportFilters {
  status: string;
  priority: string;
  category: string;
  search: string;
}

export function BugReportManagement() {
  const { user } = useAuth();
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState<BugReportFilters>({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    if (user?.access_token) {
      fetchBugReports();
    }
  }, [user, filters]);

  const fetchBugReports = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/admin/bug-reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBugReports(data.bugReports || []);
      } else {
        toast.error('Failed to fetch bug reports');
      }
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      toast.error('Failed to fetch bug reports');
    } finally {
      setLoading(false);
    }
  };

  const updateBugStatus = async (bugId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/bug-reports/${bugId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('Bug status updated successfully');
        fetchBugReports();
      } else {
        toast.error('Failed to update bug status');
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
    }
  };

  const assignBug = async (bugId: string, assigneeId: string | null) => {
    try {
      const response = await fetch(`/api/admin/bug-reports/${bugId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ assigneeId }),
      });

      if (response.ok) {
        toast.success('Bug assignment updated successfully');
        fetchBugReports();
      } else {
        toast.error('Failed to update bug assignment');
      }
    } catch (error) {
      console.error('Error updating bug assignment:', error);
      toast.error('Failed to update bug assignment');
    }
  };

  const addComment = async (bugId: string) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/admin/bug-reports/${bugId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        toast.success('Comment added successfully');
        setNewComment('');
        setIsCommentModalOpen(false);
        fetchBugReports();
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const archiveBug = async (bugId: string) => {
    if (!confirm('Are you sure you want to archive this bug report?')) return;

    try {
      const response = await fetch(`/api/admin/bug-reports/${bugId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });

      if (response.ok) {
        toast.success('Bug report archived successfully');
        fetchBugReports();
      } else {
        toast.error('Failed to archive bug report');
      }
    } catch (error) {
      console.error('Error archiving bug report:', error);
      toast.error('Failed to archive bug report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'RESOLVED': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'CLOSED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'ARCHIVED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle size={16} />;
      case 'IN_PROGRESS': return <Clock size={16} />;
      case 'RESOLVED': return <CheckCircle size={16} />;
      case 'CLOSED': return <CheckCircle size={16} />;
      case 'ARCHIVED': return <Archive size={16} />;
      default: return <Bug size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading bug reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-600/20 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          Bug Report Management
        </h2>
        <p className="text-gray-400">
          Monitor and manage bug reports from users
        </p>
      </div>

      {/* Filters */}
      <BaseCard variant="default" size="md">
        <BaseCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="UI/UX">UI/UX Issue</option>
                <option value="Functionality">Functionality Problem</option>
                <option value="Performance">Performance Issue</option>
                <option value="Payment">Payment Problem</option>
                <option value="Booking">Booking System</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <BaseInput
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search bugs..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </BaseCard.Content>
      </BaseCard>

      {/* Bug Reports List */}
      <div className="space-y-4">
        {bugReports.length === 0 ? (
          <BaseCard variant="default" size="md">
            <BaseCard.Content>
              <div className="text-center py-8">
                <Bug size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">No bug reports found</p>
              </div>
            </BaseCard.Content>
          </BaseCard>
        ) : (
          bugReports.map((bug) => (
            <BaseCard key={bug.id} variant="default" size="md">
              <BaseCard.Content>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-white">{bug.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bug.status)}`}>
                        {getStatusIcon(bug.status)} {bug.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(bug.priority)}`}>
                        {bug.priority}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm line-clamp-2">{bug.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{bug.reporter?.fullName || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                      </div>
                      {bug.category && (
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">{bug.category}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <BaseButton
                      onClick={() => {
                        setSelectedBug(bug);
                        setIsDetailModalOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye size={16} />}
                    >
                      View
                    </BaseButton>
                    
                    <BaseButton
                      onClick={() => {
                        setSelectedBug(bug);
                        setIsCommentModalOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<MessageSquare size={16} />}
                    >
                      Comment
                    </BaseButton>
                    
                    {bug.status !== 'ARCHIVED' && (
                      <BaseButton
                        onClick={() => archiveBug(bug.id)}
                        variant="outline"
                        size="sm"
                        leftIcon={<Archive size={16} />}
                      >
                        Archive
                      </BaseButton>
                    )}
                  </div>
                </div>
              </BaseCard.Content>
            </BaseCard>
          ))
        )}
      </div>

      {/* Bug Detail Modal */}
      <BaseModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="xl"
        title={selectedBug?.title || 'Bug Report Details'}
      >
        {selectedBug && (
          <div className="space-y-6">
            {/* Screenshot */}
            {selectedBug.screenshot && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Screenshot</h4>
                <img
                  src={selectedBug.screenshot}
                  alt="Bug Screenshot"
                  className="max-w-full h-64 object-contain rounded-lg border border-gray-600"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-white">{selectedBug.description}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Status</h4>
                <select
                  value={selectedBug.status}
                  onChange={(e) => updateBugStatus(selectedBug.id, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Priority</h4>
                <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getPriorityColor(selectedBug.priority)}`}>
                  {selectedBug.priority}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Reporter</h4>
                <p className="text-white">{selectedBug.reporter?.fullName || 'Anonymous'}</p>
                <p className="text-gray-400 text-sm">{selectedBug.reporter?.email}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Assigned To</h4>
                <select
                  value={selectedBug.assignedTo || ''}
                  onChange={(e) => assignBug(selectedBug.id, e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {/* Add admin users here */}
                </select>
              </div>
            </div>

            {/* Comments */}
            {selectedBug.comments && selectedBug.comments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Comments</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedBug.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{comment.author?.fullName || 'Admin'}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BaseModal>

      {/* Add Comment Modal */}
      <BaseModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        size="md"
        title="Add Comment"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Comment</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <BaseButton
              onClick={() => setIsCommentModalOpen(false)}
              variant="outline"
              size="md"
            >
              Cancel
            </BaseButton>
            <BaseButton
              onClick={() => selectedBug && addComment(selectedBug.id)}
              variant="primary"
              size="md"
              leftIcon={<MessageSquare size={16} />}
            >
              Add Comment
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
