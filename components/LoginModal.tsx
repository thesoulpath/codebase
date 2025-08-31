import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();

  // Load saved email on component mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('soulpath_admin_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      console.log('Loaded saved email from storage:', savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (data?.user) {
        console.log('Login successful for user:', data.user.email, 'Session:', !!data.session);
        // Check if user is admin
        if (data.user.email !== 'admin@soulpath.lat' && data.user.user_metadata?.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          return;
        }
        
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('soulpath_admin_email', email);
        } else {
          localStorage.removeItem('soulpath_admin_email');
        }
        
        // Successfully logged in as admin - close modal and clear form
        onClose();
        setEmail('');
        setPassword('');
        
        // Show success message before redirect
        console.log('Login successful! Redirecting to admin dashboard...');
        toast.success('Login successful! Redirecting to admin dashboard...');
        
        // The App component will automatically detect the user authentication
        // and redirect to the admin dashboard via the useEffect hook
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Only clear email if remember me is not checked
    if (!rememberMe) {
      setEmail('');
    }
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#191970]/95 to-[#0A0A23]/95 border border-[#C0C0C0]/20 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading text-[#EAEAEA] text-center flex items-center justify-center space-x-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border border-[#FFD700]/50 rounded-full"
            />
            <span>Admin Login</span>
          </DialogTitle>
          <DialogDescription className="text-[#EAEAEA]/80 text-center">
            Access the admin dashboard to manage bookings and schedules
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#EAEAEA] flex items-center space-x-2">
              <User size={16} />
              <span>Email</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@soulpath.lat"
              className="bg-[#191970]/30 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder:text-[#C0C0C0]/50 focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#EAEAEA] flex items-center space-x-2">
              <Lock size={16} />
              <span>Password</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-[#191970]/30 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder:text-[#C0C0C0]/50 focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C0C0C0] hover:text-[#FFD700] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#FFD700] bg-[#191970]/30 border-[#C0C0C0]/20 rounded focus:ring-[#FFD700]/50 focus:ring-2"
              />
              <Label 
                htmlFor="rememberMe" 
                className="text-sm text-[#C0C0C0] cursor-pointer select-none"
              >
                Remember my email address
              </Label>
            </div>
            {rememberMe && (
              <p className="text-xs text-[#C0C0C0]/60 ml-6">
                Your email will be saved locally for convenience
              </p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm p-3 bg-red-400/10 border border-red-400/20 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={handleClose}
              variant="ghost"
              className="flex-1 text-[#C0C0C0] hover:text-[#EAEAEA] hover:bg-[#C0C0C0]/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                type="submit"
                className="w-full bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 font-medium cosmic-glow flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </form>

        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#FFD700]/10 rounded-full blur-xl" />
        <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-[#C0C0C0]/10 rounded-full blur-xl" />
      </DialogContent>
    </Dialog>
  );
}