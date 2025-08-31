'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X, Package, DollarSign, Calendar } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  itemType: 'definition' | 'price' | 'template' | 'slot' | 'booking';
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  isLoading = false
}) => {
  const getIcon = () => {
    switch (itemType) {
      case 'definition':
        return <Package className="w-5 h-5 text-red-600" />;
      case 'price':
        return <DollarSign className="w-5 h-5 text-red-600" />;
      case 'template':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'slot':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getItemTypeText = () => {
    switch (itemType) {
      case 'definition':
        return 'package definition';
      case 'price':
        return 'package price';
      case 'template':
        return 'schedule template';
      case 'slot':
        return 'schedule slot';
      case 'booking':
        return 'booking';
      default:
        return 'item';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dashboard-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="dashboard-modal-title text-red-600">
            <div className="flex items-center gap-2">
              {getIcon()}
              {title}
            </div>
          </DialogTitle>
          <DialogDescription className="dashboard-modal-description">
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-gray-900">
                "{itemName}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">This action cannot be undone.</p>
              <p className="mt-1">
                Deleting this {getItemTypeText()} will permanently remove it from the system.
                {itemType === 'definition' && ' All associated prices will also be deleted.'}
                {itemType === 'price' && ' This may affect existing user packages.'}
                {itemType === 'template' && ' All associated schedule slots will also be deleted.'}
                {itemType === 'slot' && ' This may affect existing bookings.'}
                {itemType === 'booking' && ' This will restore the session to the user package.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="dashboard-button-outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            className="dashboard-button-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
