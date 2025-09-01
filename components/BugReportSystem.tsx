'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Camera, 
  Pen, 
  Type, 
  Send, 
  RotateCcw,
  Palette
} from 'lucide-react';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { FullScreenModal } from '@/components/ui/FullScreenModal';

import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Annotation {
  id: string;
  type: 'drawing' | 'text';
  points?: { x: number; y: number }[];
  text?: string;
  textPosition?: { x: number; y: number };
  color: string;
  strokeWidth: number;
  fontSize: number;
}

interface BugReportData {
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  screenshot: string | null;
  annotations: Annotation[];
  submitterDetails: {
    fullName: string;
    email: string;
    userId: string;
  };
  submittedAt: string;
}

interface BugReportSystemProps {
  children?: (props: { openReport: () => void }) => React.ReactNode;
  onSubmitSuccess?: () => void;
}

export function BugReportSystem({ children, onSubmitSuccess }: BugReportSystemProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'text'>('pen');
  const [currentColor, setCurrentColor] = useState('#ff0000'); // Default bold red
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  // const [isDrawing, setIsDrawing] = useState(false); // Unused for now
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    screenshot: null,
    annotations: [],
    submitterDetails: {
      fullName: user?.email?.split('@')[0] || 'Unknown',
      email: user?.email || '',
      userId: user?.id || ''
    },
    submittedAt: new Date().toISOString()
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const colors = [
    '#ff0000', '#ff6b6b', '#ffa500', '#ffff00', 
    '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
    '#ffffff', '#000000', '#808080', '#c0c0c0'
  ];

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current && screenshot) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        contextRef.current = context;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = currentColor;
        context.lineWidth = strokeWidth;
        
        // Load the screenshot image
        const img = new Image();
        img.onload = () => {
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the screenshot
          context.drawImage(img, 0, 0);
          
          // Redraw all annotations
          annotations.forEach(annotation => {
            if (annotation.type === 'drawing' && annotation.points) {
              context.strokeStyle = annotation.color;
              context.lineWidth = annotation.strokeWidth;
              context.beginPath();
              annotation.points.forEach((point, index) => {
                if (index === 0) {
                  context.moveTo(point.x, point.y);
                } else {
                  context.lineTo(point.x, point.y);
                }
              });
              context.stroke();
            } else if (annotation.type === 'text' && annotation.text && annotation.textPosition) {
              context.fillStyle = annotation.color;
              context.font = `${annotation.fontSize}px Arial`;
              context.fillText(annotation.text, annotation.textPosition.x, annotation.textPosition.y);
            }
          });
        };
        img.src = screenshot;
      }
    }
  }, [screenshot, currentColor, strokeWidth, annotations]);



  const handleScreenshotCapture = useCallback(async (stream: MediaStream) => {
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        video.play();
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const screenshotDataUrl = canvas.toDataURL('image/png');
          setScreenshot(screenshotDataUrl);
          setFormData(prev => ({ ...prev, screenshot: screenshotDataUrl }));
          
          // Stop the stream
          stream.getTracks().forEach(track => track.stop());
          
          toast.success('Screenshot captured successfully');
        }
      };
    } catch (error) {
      console.error('Error processing screenshot:', error);
      toast.error('Failed to process screenshot');
    }
  }, []);

  const openCaptureDialog = useCallback(async () => {
    try {
      // Hide the bug report modal temporarily
      setIsOpen(false);
      
      // Wait for the modal to fully close
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture the screen directly
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        // preferCurrentTab: true, // Not supported in all browsers
        video: { displaySurface: 'monitor' }
      });
      
      await handleScreenshotCapture(stream);
      
      // Reopen the modal after capture
      setTimeout(() => {
        setIsOpen(true);
      }, 100);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Failed to capture screenshot');
      // Ensure modal reopens even if screenshot fails
      setTimeout(() => {
        setIsOpen(true);
      }, 100);
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'pen') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    
    const context = contextRef.current;
    if (context) {
      context.strokeStyle = currentColor;
      context.lineWidth = strokeWidth;
      context.beginPath();
      context.moveTo(x, y);
    }
  }, [currentTool, currentColor, strokeWidth]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || currentTool !== 'pen') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const context = contextRef.current;
    if (context && lastPointRef.current) {
      context.lineTo(x, y);
      context.stroke();
      
      // Add point to current annotation
      const currentAnnotation = annotations[annotations.length - 1];
      if (currentAnnotation && currentAnnotation.type === 'drawing') {
        currentAnnotation.points?.push({ x, y });
      }
      
      lastPointRef.current = { x, y };
    }
  }, [currentTool, annotations]);

  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current && currentTool === 'pen') {
      isDrawingRef.current = false;
      
      // Save the current drawing as an annotation
      const currentAnnotation = annotations[annotations.length - 1];
      if (currentAnnotation && currentAnnotation.type === 'drawing' && currentAnnotation.points) {
        setAnnotations(prev => [...prev.slice(0, -1), currentAnnotation]);
      }
    }
  }, [currentTool, annotations]);

  const addText = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'text') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const text = prompt('Enter text:');
    if (text) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        text,
        textPosition: { x, y },
        color: currentColor,
        strokeWidth,
        fontSize
      };
      
      setAnnotations(prev => [...prev, newAnnotation]);
      
      // Draw the text on canvas
      const context = contextRef.current;
      if (context) {
        context.fillStyle = currentColor;
        context.font = `${fontSize}px Arial`;
        context.fillText(text, x, y);
      }
    }
  }, [currentTool, currentColor, strokeWidth, fontSize]);

  const startDrawingAnnotation = useCallback(() => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'drawing',
      points: [],
      color: currentColor,
      strokeWidth,
      fontSize
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  }, [currentColor, strokeWidth, fontSize]);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    if (canvasRef.current && screenshot) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
        };
        img.src = screenshot;
      }
    }
  }, [screenshot]);



  const submitBugReport = useCallback(async () => {
    console.log('Submit function called');
    console.log('Form data:', formData);
    console.log('User:', user);
    
    if (!formData.title.trim() || !formData.description.trim()) {
      console.log('Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      console.log('No user found');
      toast.error('You must be logged in to submit a bug report');
      return;
    }

    try {
      // Convert canvas to base64 with annotations
      let finalScreenshot = screenshot;
      if (canvasRef.current && annotations.length > 0) {
        finalScreenshot = canvasRef.current.toDataURL('image/png');
      }

      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        screenshot: finalScreenshot,
        annotations: annotations
      };

      console.log('Submitting bug report:', reportData);

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);

      if (response.ok) {
        console.log('Bug report submitted successfully, cleaning up...');
        toast.success('Bug report submitted successfully');
        
        // Reset form data
        setFormData({
          title: '',
          description: '',
          category: '',
          priority: 'MEDIUM',
          screenshot: null,
          annotations: [],
          submitterDetails: {
            fullName: user?.email?.split('@')[0] || 'Unknown',
            email: user?.email || '',
            userId: user?.id || ''
          },
          submittedAt: new Date().toISOString()
        });
        
        // Reset screenshot and annotations
        setScreenshot(null);
        setAnnotations([]);
        
        // Reset canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        
        // Reset tools
        setCurrentTool('pen');
        setCurrentColor('#ff0000');
        setStrokeWidth(3);
        setFontSize(16);
        
        // Call the success callback to refresh the bug reports list
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        
        // Close modal after a short delay to show the success toast
        setTimeout(() => {
          setIsOpen(false);
        }, 1000);
        
      } else {
        console.error('Bug report submission failed:', result);
        toast.error(result.error || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report');
    }
  }, [formData, screenshot, annotations, user]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      screenshot: null,
      annotations: [],
      submitterDetails: {
        fullName: user?.email?.split('@')[0] || 'Unknown',
        email: user?.email || '',
        userId: user?.id || ''
      },
      submittedAt: new Date().toISOString()
    });
    setScreenshot(null);
    setAnnotations([]);
    setCurrentTool('pen');
    setCurrentColor('#ff0000');
    setStrokeWidth(3);
    setFontSize(16);
    
    // Clear canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [user]);

  const openReport = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <>
      {children ? (
        children({ openReport })
      ) : (
        <BaseButton
          onClick={openReport}
          variant="primary"
          size="md"
          leftIcon={<Camera size={16} />}
        >
          Report Bug
        </BaseButton>
      )}

      <FullScreenModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Bug Report System"
      >
        <div className="flex h-full max-w-7xl mx-auto p-4">
          {/* Left Panel - Form */}
          <div className="w-1/3 p-6 border-r border-gray-600 overflow-y-auto bg-gray-900">
            <div className="space-y-6">
              {/* Submitter Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Submitter Information</h3>
                <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {formData.submitterDetails.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{formData.submitterDetails.fullName}</p>
                      <p className="text-gray-400 text-sm">{formData.submitterDetails.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">
                      <span className="font-medium">Submission Time:</span> {new Date(formData.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bug Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <BaseInput
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the bug"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the issue..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        <option value="UI/UX">UI/UX Issue</option>
                        <option value="Functionality">Functionality Problem</option>
                        <option value="Performance">Performance Issue</option>
                        <option value="Payment">Payment Problem</option>
                        <option value="Booking">Booking System</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshot Capture */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Screenshot</h3>
                <div className="space-y-4">
                  {!screenshot ? (
                    <BaseButton
                      onClick={openCaptureDialog}
                      variant="primary"
                      size="md"
                      leftIcon={<Camera size={16} />}
                      className="w-full"
                    >
                      Capture Screenshot
                    </BaseButton>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Screenshot captured successfully</p>
                      <BaseButton
                        onClick={openCaptureDialog}
                        variant="primary"
                        size="sm"
                        leftIcon={<Camera size={14} />}
                      >
                        Retake Screenshot
                      </BaseButton>
                    </div>
                  )}
                </div>
              </div>

              

              {/* Submit */}
              <div className="pt-4">
                <BaseButton
                  onClick={() => {
                    console.log('Submit button clicked');
                    submitBugReport();
                  }}
                  variant="primary"
                  size="md"
                  leftIcon={<Send size={16} />}
                  className="w-full"
                >
                  Submit Bug Report
                </BaseButton>
              </div>
            </div>
          </div>

          {/* Right Panel - Screenshot Annotation */}
          <div className="flex-1 p-6 bg-gray-900">
            {screenshot ? (
              <div className="space-y-4">
                {/* Annotation Tools */}
                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BaseButton
                      onClick={() => setCurrentTool('pen')}
                      variant={currentTool === 'pen' ? 'primary' : 'outline'}
                      size="sm"
                      leftIcon={<Pen size={16} />}
                    >
                      Draw
                    </BaseButton>
                    <BaseButton
                      onClick={() => setCurrentTool('text')}
                      variant={currentTool === 'text' ? 'primary' : 'outline'}
                      size="sm"
                      leftIcon={<Type size={16} />}
                    >
                      Text
                    </BaseButton>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Palette size={16} className="text-gray-400" />
                    <div className="flex space-x-1">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setCurrentColor(color)}
                          className={`w-6 h-6 rounded border-2 ${
                            currentColor === color ? 'border-white' : 'border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {currentTool === 'pen' && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Width:</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  )}

                  {currentTool === 'text' && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Size:</span>
                      <input
                        type="range"
                        min="12"
                        max="32"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  )}

                  <BaseButton
                    onClick={clearAnnotations}
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCcw size={16} />}
                  >
                    Clear
                  </BaseButton>
                </div>

                {/* Canvas */}
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                  <div className="flex justify-center items-center p-4">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={(e) => {
                        if (currentTool === 'pen') {
                          startDrawingAnnotation();
                          startDrawing(e);
                        } else if (currentTool === 'text') {
                          addText(e);
                        }
                      }}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="cursor-crosshair max-w-full h-auto border border-gray-600 rounded"
                      style={{ 
                        display: 'block',
                        maxHeight: '70vh',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <p>• Click and drag to draw on the screenshot</p>
                  <p>• Click anywhere to add text annotations</p>
                  <p>• Use the color palette to change annotation colors</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera size={64} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">Capture a screenshot to start annotating</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </FullScreenModal>


    </>
  );
}
