'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Upload, Image, HardDrive, Globe, Clock, Edit, Trash2, 
  Filter
} from 'lucide-react';
import { BaseButton } from './ui/BaseButton';
import { BaseInput } from './ui/BaseInput';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { colors, spacing, typography, borders } from '@/lib/design-system';

interface ImageData {
  profileImage?: string;
}

export function ImageManagement() {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [deletingImage, setDeletingImage] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    alt: '',
    category: 'general'
  });
  const [filters, setFilters] = useState({
    type: 'all',
    isPublic: 'all',
    size: 'all'
  });
  const [totalSize] = useState(0);
  const [lastUpload] = useState<string | null>(null);

  // Simple formatting functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    if (user?.access_token) {
      loadImages();
    }
  }, [user?.access_token]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.access_token) {
        console.error('No access token available for loading images');
        setError('Authentication required');
        return;
      }

      console.log('Loading images with auth token...');
      const response = await fetch(`/api/admin/images`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to load images:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Response text:', errorText);
        throw new Error(`Failed to load images: ${response.status}`);
      }

      const data = await response.json();
      setImages(data.images || {});
    } catch (err: any) {
      console.error('Error loading images:', err);
      setError(`Failed to load images: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (image: any) => {
    setEditingImage(image);
    setEditFormData({
      name: image.name || '',
      alt: image.alt || '',
      category: image.category || 'general'
    });
    setShowEditModal(true);
  };

  const handleDelete = (image: any) => {
    setDeletingImage(image);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingImage) return;

    try {
      const response = await fetch(`/api/admin/images?id=${deletingImage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Image deleted successfully');
        loadImages();
        setShowDeleteModal(false);
        setDeletingImage(null);
      } else {
        setError('Failed to delete image');
      }
    } catch (err: any) {
      setError(`Error deleting image: ${err.message}`);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingImage) return;

    try {
      const response = await fetch(`/api/admin/images?id=${editingImage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        setSuccess('Image updated successfully');
        loadImages();
        setShowEditModal(false);
        setEditingImage(null);
      } else {
        setError('Failed to update image');
      }
    } catch (err: any) {
      setError(`Error updating image: ${err.message}`);
    }
  };

  const applyFilters = () => {
    // Filter logic would go here
    console.log('Applying filters:', filters);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      isPublic: 'all',
      size: 'all'
    });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px]`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-[${colors.accent[500]}] border-t-transparent rounded-full animate-spin mx-auto mb-[${spacing[4]}]`}></div>
          <p className={`text-[${colors.text.secondary}]`}>Loading images...</p>
        </div>
      </div>
    );
  }

  if (error && !images || Object.keys(images).length === 0) {
    return (
      <div className={`text-center py-[${spacing[12]}]`}>
        <div className={`w-24 h-24 bg-[${colors.semantic.surface.secondary}] rounded-full flex items-center justify-center mx-auto mb-[${spacing[4]}]`}>
          <Image className={`w-12 h-12 text-[${colors.text.secondary}]`} />
        </div>
        <h3 className={`text-[${typography.fontSize.xl}] font-[${typography.fontWeight.semibold}] text-[${colors.text.primary}] mb-[${spacing[2]}]`}>
          No images found
        </h3>
        <p className={`text-[${colors.text.secondary}] mb-[${spacing[6]}]`}>
          Upload your first image to get started
        </p>
        <BaseButton
          onClick={() => setShowUploadModal(true)}
          variant="primary"
          size="lg"
          leftIcon={<Upload className="w-5 h-5" />}
        >
          Upload First Image
        </BaseButton>
      </div>
    );
  }

  return (
    <div className={`p-[${spacing[6]}] space-y-[${spacing[6]}]`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-[${typography.fontSize['3xl']}] font-[${typography.fontWeight.bold}] tracking-tight text-[${colors.text.primary}]`}>
            Image Management
          </h2>
          <p className={`text-[${colors.text.secondary}]`}>
            Manage website images, logos, and visual assets
          </p>
        </div>
        <BaseButton 
          onClick={() => setShowUploadModal(true)} 
          variant="primary"
          size="lg"
          leftIcon={<Upload className="w-4 h-4" />}
        >
          Upload Image
        </BaseButton>
      </div>

      {/* Stats Cards */}
      <div className={`grid gap-[${spacing[4]}] md:grid-cols-2 lg:grid-cols-4`}>
        <Card className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-[${spacing[2]}]`}>
            <CardTitle className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
              Total Images
            </CardTitle>
            <Image className={`h-4 w-4 text-[${colors.text.tertiary}]`} />
          </CardHeader>
          <CardContent>
            <div className={`text-[${typography.fontSize['2xl']}] font-[${typography.fontWeight.bold}] text-[${colors.text.primary}]`}>
              {Object.keys(images).length}
            </div>
            <p className={`text-[${typography.fontSize.sm}] text-[${colors.text.secondary}]`}>
              Stored images
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-[${spacing[2]}]`}>
            <CardTitle className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
              Total Size
            </CardTitle>
            <HardDrive className={`h-4 w-4 text-[${colors.text.tertiary}]`} />
          </CardHeader>
          <CardContent>
            <div className={`text-[${typography.fontSize['2xl']}] font-[${typography.fontWeight.bold}] text-[${colors.text.primary}]`}>
              {formatFileSize(totalSize)}
            </div>
            <p className={`text-[${typography.fontSize.sm}] text-[${colors.text.secondary}]`}>
              Storage used
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-[${spacing[2]}]`}>
            <CardTitle className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
              Public Images
            </CardTitle>
            <Globe className={`h-4 w-4 text-[${colors.text.tertiary}]`} />
          </CardHeader>
          <CardContent>
            <div className={`text-[${typography.fontSize['2xl']}] font-[${typography.fontWeight.bold}] text-[${colors.text.primary}]`}>
              {Object.values(images).filter((img: any) => img.isPublic).length}
            </div>
            <p className={`text-[${typography.fontSize.sm}] text-[${colors.text.secondary}]`}>
              Publicly accessible
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-[${spacing[2]}]`}>
            <CardTitle className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
              Last Upload
            </CardTitle>
            <Clock className={`h-4 w-4 text-[${colors.text.tertiary}]`} />
          </CardHeader>
          <CardContent>
            <div className={`text-[${typography.fontSize['2xl']}] font-[${typography.fontWeight.bold}] text-[${colors.text.primary}]`}>
              {lastUpload ? formatDate(lastUpload) : 'N/A'}
            </div>
            <p className={`text-[${typography.fontSize.sm}] text-[${colors.text.secondary}]`}>
              Last backup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error and Success Display */}
      {error && (
        <div className={`bg-[${colors.status.error}]/10 border border-[${colors.status.error}]/20 rounded-[${borders.radius.lg}] p-[${spacing[4]}] mb-[${spacing[4]}]`}>
          <p className={`text-[${colors.status.error}]`}>{error}</p>
        </div>
      )}
      
      {success && (
        <div className={`bg-[${colors.status.success}]/10 border border-[${colors.status.success}]/20 rounded-[${borders.radius.lg}] p-[${spacing[4]}] mb-[${spacing[4]}]`}>
          <p className={`text-[${colors.status.success}]`}>{success}</p>
        </div>
      )}

      {/* Upload Modal Placeholder */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50`}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-[${colors.semantic.surface.primary}] rounded-[${borders.radius.lg}] p-[${spacing[6]}] max-w-md w-full mx-[${spacing[4]}]`}
            >
              <h3 className={`text-[${typography.fontSize.lg}] font-[${typography.fontWeight.medium}] text-[${colors.text.primary}] mb-[${spacing[4]}]`}>
                Upload Image
              </h3>
              <p className={`text-[${colors.text.secondary}] mb-[${spacing[4]}]`}>
                Upload modal functionality coming soon...
              </p>
              <BaseButton 
                onClick={() => setShowUploadModal(false)} 
                variant="primary"
                className="w-full"
              >
                Close
              </BaseButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
        <CardHeader>
          <CardTitle className={`text-[${typography.fontSize.lg}] text-[${colors.text.primary}]`}>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-[${spacing[4]}]`}>
            <div className={`space-y-[${spacing[2]}]`}>
              <Label htmlFor="filter_type" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Image Type
              </Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All types</SelectItem>
                  <SelectItem value="logo" className="dashboard-dropdown-item">Logo</SelectItem>
                  <SelectItem value="hero" className="dashboard-dropdown-item">Hero</SelectItem>
                  <SelectItem value="gallery" className="dashboard-dropdown-item">Gallery</SelectItem>
                  <SelectItem value="icon" className="dashboard-dropdown-item">Icon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`space-y-[${spacing[2]}]`}>
              <Label htmlFor="filter_status" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Status
              </Label>
              <Select value={filters.isPublic} onValueChange={(value) => setFilters(prev => ({ ...prev, isPublic: value }))}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All statuses</SelectItem>
                  <SelectItem value="true" className="dashboard-dropdown-item">Public</SelectItem>
                  <SelectItem value="false" className="dashboard-dropdown-item">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`space-y-[${spacing[2]}]`}>
              <Label htmlFor="filter_size" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                File Size
              </Label>
              <Select value={filters.size} onValueChange={(value) => setFilters(prev => ({ ...prev, size: value }))}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All sizes</SelectItem>
                  <SelectItem value="small" className="dashboard-dropdown-item">Small (&lt; 1MB)</SelectItem>
                  <SelectItem value="medium" className="dashboard-dropdown-item">Medium (1-5MB)</SelectItem>
                  <SelectItem value="large" className="dashboard-dropdown-item">Large (&gt; 5MB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`flex justify-end space-x-[${spacing[2]}] pt-[${spacing[4]}]`}>
            <BaseButton
              onClick={applyFilters}
              variant="primary"
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Apply Filters
            </BaseButton>
            <BaseButton
              onClick={clearFilters}
              variant="outline"
              className={`border-[${colors.border[500]}] text-[${colors.text.secondary}] hover:bg-[${colors.semantic.surface.secondary}] hover:text-[${colors.text.primary}]`}
            >
              Clear
            </BaseButton>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <Card className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
        <CardHeader>
          <CardTitle className={`text-[${typography.fontSize.lg}] text-[${colors.text.primary}]`}>All Images</CardTitle>
          <CardDescription className={`text-[${colors.text.secondary}]`}>
            Manage and organize your image assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className={`text-center py-[${spacing[12]}]`}>
              <div className={`w-16 h-16 border-4 border-[${colors.accent[500]}] border-t-transparent rounded-full animate-spin mx-auto mb-[${spacing[4]}]`}></div>
              <p className={`text-[${colors.text.secondary}]`}>Loading images...</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[${spacing[4]}]`}>
              {Object.entries(images).map(([key, image]: [string, any]) => (
                <div key={key} className={`bg-[${colors.semantic.surface.secondary}] rounded-[${borders.radius.lg}] p-[${spacing[4]}] border border-[${colors.border[500]}]`}>
                  <div className={`flex items-center justify-between mb-[${spacing[3]}]`}>
                    {image.isPublic ? (
                      <Badge variant="secondary" className={`bg-[${colors.status.success}] text-white`}>Public</Badge>
                    ) : (
                      <Badge variant="secondary" className={`bg-[${colors.status.error}] text-white`}>Private</Badge>
                    )}
                  </div>
                  
                  <div className={`h-32 bg-[${colors.semantic.surface.tertiary}] rounded-[${borders.radius.md}] mb-[${spacing[3]}] flex items-center justify-center`}>
                    <Image className={`w-8 h-8 text-[${colors.text.tertiary}]`} />
                  </div>
                  
                  <div className={`space-y-[${spacing[2]}]`}>
                    <span className={`text-[${colors.text.primary}] font-[${typography.fontWeight.medium}] truncate block`}>
                      {image.name}
                    </span>
                    
                    <div className={`flex space-x-[${spacing[2]}]`}>
                      <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(image)}
                        className="flex-1"
                        leftIcon={<Edit className="w-4 h-4" />}
                      >
                        Edit
                      </BaseButton>
                      <BaseButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(image)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Delete
                      </BaseButton>
                    </div>
                    
                    <div className={`text-[${typography.fontSize.xs}] text-[${colors.text.tertiary}]`}>
                      {image.uploadedAt && `Uploaded: ${formatDate(image.uploadedAt)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && Object.keys(images).length === 0 && (
            <div className={`text-center py-[${spacing[12]}]`}>
              <div className={`w-16 h-16 bg-[${colors.semantic.surface.secondary}] rounded-full flex items-center justify-center mx-auto mb-[${spacing[4]}]`}>
                <Image className={`w-8 h-8 text-[${colors.text.tertiary}]`} />
              </div>
              <p className={`text-[${colors.text.secondary}]`}>No images found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50`}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a2e] rounded-lg p-6 w-full max-w-md mx-4"
            >
              <CardHeader>
                <CardTitle className={`text-[${typography.fontSize.lg}] text-[${colors.text.primary}]`}>Edit Image</CardTitle>
                <CardDescription className={`text-[${colors.text.secondary}]`}>
                  Update image details and settings
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleEditSubmit} className={`space-y-[${spacing[4]}]`}>
                <div className={`space-y-[${spacing[2]}]`}>
                  <Label htmlFor="edit_name" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                    Name
                  </Label>
                  <BaseInput
                    id="edit_name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Image name"
                  />
                </div>
                
                <div className={`space-y-[${spacing[2]}]`}>
                  <Label htmlFor="edit_alt" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                    Alt Text
                  </Label>
                  <BaseInput
                    id="edit_alt"
                    value={editFormData.alt}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, alt: e.target.value }))}
                    placeholder="Alternative text for accessibility"
                  />
                </div>
                
                <div className={`space-y-[${spacing[2]}]`}>
                  <Label htmlFor="edit_category" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                    Category
                  </Label>
                  <Select value={editFormData.category} onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="general" className="dashboard-dropdown-item">General</SelectItem>
                      <SelectItem value="hero" className="dashboard-dropdown-item">Hero</SelectItem>
                      <SelectItem value="gallery" className="dashboard-dropdown-item">Gallery</SelectItem>
                      <SelectItem value="logo" className="dashboard-dropdown-item">Logo</SelectItem>
                      <SelectItem value="background" className="dashboard-dropdown-item">Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className={`flex space-x-[${spacing[2]}] pt-[${spacing[4]}]`}>
                  <BaseButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </BaseButton>
                  <BaseButton
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Update
                  </BaseButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50`}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className={`text-[${typography.fontSize.lg}] font-[${typography.fontWeight.medium}] text-[${colors.text.primary}] mb-[${spacing[4]}]`}>
                Delete Image
              </h3>
              <p className={`text-[${colors.text.secondary}] mb-[${spacing[6]}]`}>
                Are you sure you want to delete "{deletingImage?.name}"? This action cannot be undone.
              </p>
              
              <div className={`flex space-x-[${spacing[2]}]`}>
                <BaseButton
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  variant="danger"
                  onClick={confirmDelete}
                  className="flex-1"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </BaseButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}