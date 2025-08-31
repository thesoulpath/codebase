'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Upload, Image, HardDrive, Globe, Clock, Edit, Trash2, 
  CheckCircle, Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';



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
  const [totalSize, setTotalSize] = useState(0);
  const [lastUpload, setLastUpload] = useState<string | null>(null);



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









  const openEditModal = (image: any) => {
    setEditingImage(image);
    setEditFormData({
      name: image.name,
      alt: image.alt || '',
      category: image.category || 'general'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      const response = await fetch(`/api/admin/images/${editingImage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editFormData.name,
          alt: editFormData.alt,
          category: editFormData.category
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Update failed: ${response.status}`);
      }

      const updatedImage = { ...editingImage, ...editFormData };
      setImages(prev => ({ ...prev, [editingImage.key]: updatedImage }));
      setShowEditModal(false);
      setSuccess(`Image updated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Trigger profile image reload on the homepage
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    } catch (err: any) {
      console.error('Error updating image:', err);
      setError(`Failed to update image: ${err.message}`);
    }
  };

  const openDeleteModal = (image: any) => {
    setDeletingImage(image);
    setShowDeleteModal(true);
  };

  const handleDeleteImage = async () => {
    if (!deletingImage) return;

    try {
      setError(null);

      const response = await fetch(`/api/admin/images/${deletingImage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }

      const updatedImages = { ...images };
      delete updatedImages[deletingImage.key as keyof ImageData];
      setImages(updatedImages);
      setShowDeleteModal(false);
      setSuccess(`Image deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Trigger profile image reload on the homepage
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(`Failed to delete image: ${err.message}`);
    }
  };

  const applyFilters = () => {
            setIsLoading(true);
    setError(null);
    setSuccess(null);

    const filtered = Object.values(images).filter(image => {
      const matchesType = filters.type === 'all' || image.type === filters.type;
      const matchesStatus = filters.isPublic === 'all' || (image.isPublic ? 'true' : 'false') === filters.isPublic;
      const matchesSize = filters.size === 'all' || (image.size < 1024 * 1024 ? 'small' : image.size < 5 * 1024 * 1024 ? 'medium' : 'large') === filters.size;
      return matchesType && matchesStatus && matchesSize;
    });

    setFilteredImages(filtered);
    setIsLoading(false);
  };

  const clearFilters = () => {
    setFilters({ type: 'all', isPublic: 'all', size: 'all' });
    setFilteredImages(Object.values(images));
    setIsLoading(false);
  };

  const [filteredImages, setFilteredImages] = useState<any[]>(Object.values(images));

  useEffect(() => {
    setFilteredImages(Object.values(images));
  }, [images]);

  useEffect(() => {
    applyFilters();
  }, [filters, images]);

  // Calculate stats from images data
  useEffect(() => {
    if (images && Object.keys(images).length > 0) {
      // Calculate total size (placeholder - would need actual file sizes from database)
      const calculatedTotalSize = Object.keys(images).length * 1024 * 1024; // 1MB per image as placeholder
      setTotalSize(calculatedTotalSize);
      
      // Set last upload to current time if we have images
      setLastUpload(new Date().toISOString());
    }
  }, [images]);

  if (isLoading || !user?.access_token) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#191970]/30 rounded"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 bg-[#191970]/20 rounded-lg">
              <div className="h-6 bg-[#191970]/30 rounded mb-4"></div>
              <div className="h-32 bg-[#191970]/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-text-primary text-3xl font-bold tracking-tight">Image Management</h2>
          <p className="dashboard-text-secondary">
            Manage website images, logos, and visual assets
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="dashboard-button-primary">
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-stats-label">Total Images</CardTitle>
            <Image className="h-4 w-4 dashboard-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="dashboard-stats-value">{Object.keys(images).length}</div>
            <p className="dashboard-stats-label">
              Stored images
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-stats-label">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 dashboard-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="dashboard-stats-value">{formatFileSize(totalSize)}</div>
            <p className="dashboard-stats-label">
              Storage used
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-stats-label">Public Images</CardTitle>
            <Globe className="h-4 w-4 dashboard-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="dashboard-stats-value">
              {Object.values(images).filter(img => img.isPublic).length}
            </div>
            <p className="dashboard-stats-label">
              Publicly accessible
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-stats-label">Last Upload</CardTitle>
            <Clock className="h-4 w-4 dashboard-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="dashboard-stats-value">
              {lastUpload ? formatDate(lastUpload) : 'N/A'}
            </div>
            <p className="dashboard-stats-label">
              Last backup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error and Success Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Upload Modal Placeholder */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[#0A0A23] rounded-lg border border-[#C0C0C0]/20 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="dashboard-text-primary font-heading text-lg mb-4">Upload Image</h3>
              <p className="dashboard-text-secondary mb-4">Upload modal functionality coming soon...</p>
              <Button onClick={() => setShowUploadModal(false)} className="dashboard-button-primary">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="dashboard-filter-grid">
            <div className="dashboard-filter-item">
              <Label htmlFor="filter_type" className="dashboard-filter-label">Image Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All types" />
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

            <div className="dashboard-filter-item">
              <Label htmlFor="filter_status" className="dashboard-filter-label">Status</Label>
              <Select value={filters.isPublic} onValueChange={(value) => setFilters(prev => ({ ...prev, isPublic: value }))}>
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All statuses</SelectItem>
                  <SelectItem value="true" className="dashboard-dropdown-item">Public</SelectItem>
                  <SelectItem value="false" className="dashboard-dropdown-item">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="filter_size" className="dashboard-filter-label">File Size</Label>
              <Select value={filters.size} onValueChange={(value) => setFilters(prev => ({ ...prev, size: value }))}>
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All sizes" />
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

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} className="dashboard-button-primary">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="dashboard-button-outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">All Images</CardTitle>
          <CardDescription className="dashboard-card-description">
            Manage website images, logos, and visual assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="dashboard-loading">
              <div className="dashboard-loading-spinner">Loading images...</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredImages.map((image) => (
                <div key={image.id} className="border border-[#C0C0C0]/20 rounded-lg p-4 space-y-3 bg-[#191970]/30">
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={image.alt || image.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!image.isPublic && (
                        <Badge variant="secondary" className="dashboard-badge-error">Private</Badge>
                      )}
                      <Badge variant="secondary" className="dashboard-badge">
                        {image.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="dashboard-text-primary font-medium truncate">{image.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(image)}
                          className="dashboard-button-outline"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(image)}
                          className="dashboard-button-danger"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs dashboard-text-muted">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(image.size)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(image.uploadedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredImages.length === 0 && (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">No images found</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="dashboard-card w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Edit Image</CardTitle>
              <CardDescription className="dashboard-card-description">
                Update image details and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name" className="dashboard-filter-label">Name</Label>
                  <Input
                    id="edit_name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="dashboard-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_alt" className="dashboard-filter-label">Alt Text</Label>
                  <Input
                    id="edit_alt"
                    value={editFormData.alt || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, alt: e.target.value }))}
                    className="dashboard-input"
                    placeholder="Image description for accessibility"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_category" className="dashboard-filter-label">Category</Label>
                  <Select 
                    value={editFormData.category} 
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue placeholder="Select category" />
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

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="dashboard-button-primary flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="dashboard-button-outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="dashboard-card w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Delete Image</CardTitle>
              <CardDescription className="dashboard-card-description">
                Are you sure you want to delete this image? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border border-[#C0C0C0]/20 rounded-lg bg-[#191970]/20">
                  <img
                    src={deletingImage.url}
                    alt={deletingImage.alt || deletingImage.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <p className="dashboard-text-primary font-medium">{deletingImage.name}</p>
                    <p className="dashboard-text-muted text-sm">{deletingImage.type}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteImage}
                    className="dashboard-button-danger flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="dashboard-button-outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ImageManagement;