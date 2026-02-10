'use client';

import React from 'react';
import toast, { Toaster, type ToastOptions } from 'react-hot-toast';
import { AlertTriangle, Info } from 'lucide-react';

export { toast };

export interface ToastProviderProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export function ToastProvider({ position = 'top-right' }: ToastProviderProps) {
  return (
    <>
      <Toaster
        position={position}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(220, 20%, 12%)',
            color: 'hsl(0, 0%, 98%)',
            border: '1px solid hsl(220, 20%, 20%)',
            borderRadius: '1rem',
            padding: '0.75rem 1rem',
            fontSize: '0.9375rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            maxWidth: '420px',
          },
          success: {
            iconTheme: {
              primary: 'hsl(142, 71%, 45%)',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'hsl(0, 72%, 51%)',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

/* Convenience wrappers with lucide icons */
export function toastSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, options);
}

export function toastError(message: string, options?: ToastOptions) {
  return toast.error(message, options);
}

export function toastWarning(message: string, options?: ToastOptions) {
  return toast(message, {
    icon: <AlertTriangle size={20} color="hsl(45, 93%, 47%)" />,
    ...options,
  });
}

export function toastInfo(message: string, options?: ToastOptions) {
  return toast(message, {
    icon: <Info size={20} color="hsl(210, 100%, 60%)" />,
    ...options,
  });
}
