import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  warningMessage?: string;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  confirmText = "Delete",
  cancelText = "Cancel",
  destructive = true,
  warningMessage
}: DeleteConfirmDialogProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {title}
          </AlertDialogTitle>
          {/* <AlertDialogDescription className="space-y-2">
            <div>
              {description}
              {itemName && (
                <span className="font-semibold"> "{itemName}"</span>
              )}
            </div>
            {warningMessage && (
              <div className="text-sm text-red-600">
                ⚠️ {warningMessage}
              </div>
            )}
          </AlertDialogDescription> */}
          <AlertDialogDescription>
            {description}
            {itemName && <span className="font-semibold"> "{itemName}"</span>}
          </AlertDialogDescription>

          {warningMessage && (
            <div className="mt-2 text-sm text-red-600">
              ⚠️ {warningMessage}
            </div>
          )}

        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isLoading}
            onClick={handleClose}
            className='cursor-pointer'
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={onConfirm}
            className={destructive ? "bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer" : ""}
          >
            {isLoading ? 'Deleting...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}