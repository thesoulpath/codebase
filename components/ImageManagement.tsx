import { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, Save, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageData {
  profileImage?: string;
}

export function ImageManagement() {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});
  const [editingUrl, setEditingUrl] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const imageConfig = [
    {
      key: 'profileImage',
      name: 'José Profile Image',
      description: 'The main profile image shown in the About section of the homepage'
    }
  ];

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

  const handleFileUpload = async (imageKey: string, file: File) => {
    try {
      setUploadProgress({ ...uploadProgress, [imageKey]: true });
      setError(null);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/admin/images/${imageKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setImages({ ...images, [imageKey]: result.url });
      setSuccess(`${imageConfig.find(c => c.key === imageKey)?.name} uploaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Trigger profile image reload on the homepage
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadProgress({ ...uploadProgress, [imageKey]: false });
    }
  };

  const handleUrlUpdate = async (imageKey: string, url: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/images/${imageKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Update failed: ${response.status}`);
      }

      setImages({ ...images, [imageKey]: url });
      setEditingUrl({ ...editingUrl, [imageKey]: '' });
      setSuccess(`${imageConfig.find(c => c.key === imageKey)?.name} URL updated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Trigger profile image reload on the homepage
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    } catch (err: any) {
      console.error('Error updating image URL:', err);
      setError(`Failed to update image URL: ${err.message}`);
    }
  };

  const handleDelete = async (imageKey: string) => {
    if (!confirm(`Are you sure you want to delete the ${imageConfig.find(c => c.key === imageKey)?.name}?`)) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/images/${imageKey}`, {
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
      delete updatedImages[imageKey as keyof ImageData];
      setImages(updatedImages);
      setSuccess(`${imageConfig.find(c => c.key === imageKey)?.name} deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Trigger profile image reload on the homepage
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(`Failed to delete image: ${err.message}`);
    }
  };

  const startUrlEdit = (imageKey: string) => {
    setEditingUrl({ ...editingUrl, [imageKey]: images[imageKey as keyof ImageData] || '' });
  };

  const cancelUrlEdit = (imageKey: string) => {
    const updated = { ...editingUrl };
    delete updated[imageKey];
    setEditingUrl(updated);
  };

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
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ImageIcon className="w-6 h-6 text-[#FFD700]" />
        <h2 className="text-2xl font-heading text-[#EAEAEA]">Profile Picture</h2>
      </div>

      <div className="bg-[#191970]/20 border border-[#FFD700]/20 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-heading text-[#FFD700] mb-3">Profile Picture Management</h3>
        <div className="text-sm text-[#EAEAEA]/80">
          <p className="mb-3">
            Upload or set a URL for José's profile picture that appears in the About section of the homepage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-[#EAEAEA] mb-2">Upload Image:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click "Choose Image" to upload from your computer</li>
                <li>Supports JPEG, PNG, GIF, WebP (max 5MB)</li>
                <li>Image will be automatically optimized</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#EAEAEA] mb-2">External URL:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click "Edit URL" to link to an external image</li>
                <li>Make sure the URL is publicly accessible</li>
                <li>Recommended: 400x400px or larger, square aspect ratio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        {imageConfig.map((config) => {
          const currentImage = images[config.key as keyof ImageData];
          const isUploading = uploadProgress[config.key];
          const isEditingUrl = editingUrl[config.key] !== undefined;

          return (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-[#191970]/20 rounded-lg border border-[#C0C0C0]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-heading text-[#EAEAEA]">{config.name}</h3>
                  <p className="text-sm text-[#EAEAEA]/60">{config.description}</p>
                </div>
                {currentImage && !isEditingUrl && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => startUrlEdit(config.key)}
                      size="sm"
                      variant="outline"
                      className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                    >
                      <ExternalLink size={14} />
                      Edit URL
                    </Button>
                    <Button
                      onClick={() => handleDelete(config.key)}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Current Image Display */}
              {currentImage && (
                <div className="mb-4 p-4 bg-[#0A0A23]/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={currentImage}
                      alt={config.name}
                      className="w-24 h-24 object-cover rounded-lg border border-[#FFD700]/20"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-[#EAEAEA]/70 mb-2">Current Image:</p>
                      <p className="text-xs text-[#FFD700] break-all">{currentImage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* URL Editing */}
              {isEditingUrl && (
                <div className="mb-4 p-4 bg-[#0A0A23]/30 rounded-lg">
                  <label className="block text-sm font-medium text-[#EAEAEA] mb-2">
                    Image URL
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="url"
                      value={editingUrl[config.key]}
                      onChange={(e) => setEditingUrl({ ...editingUrl, [config.key]: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 bg-[#191970]/30 border-[#C0C0C0]/20 text-[#EAEAEA]"
                    />
                    <Button
                      onClick={() => handleUrlUpdate(config.key, editingUrl[config.key])}
                      size="sm"
                      className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
                      disabled={!editingUrl[config.key]?.trim()}
                    >
                      <Save size={14} />
                      Save
                    </Button>
                    <Button
                      onClick={() => cancelUrlEdit(config.key)}
                      size="sm"
                      variant="outline"
                      className="border-[#C0C0C0]/30 text-[#C0C0C0]"
                    >
                      <X size={14} />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* File Upload */}
              {!isEditingUrl && (
                <div className="p-4 bg-[#0A0A23]/30 rounded-lg border-2 border-dashed border-[#C0C0C0]/20">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-[#C0C0C0]/50 mx-auto mb-2" />
                    <p className="text-sm text-[#EAEAEA]/70 mb-2">
                      {currentImage ? 'Upload a new image to replace the current one' : 'Upload an image'}
                    </p>
                    <p className="text-xs text-[#EAEAEA]/50 mb-4">
                      Supports: JPEG, PNG, GIF, WebP (max 5MB)
                    </p>
                    
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(config.key, file);
                        }
                      }}
                      className="hidden"
                      id={`upload-${config.key}`}
                      disabled={isUploading}
                    />
                    
                    <label htmlFor={`upload-${config.key}`}>
                      <Button
                        disabled={isUploading}
                        className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="mr-2" />
                            Choose Image
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}