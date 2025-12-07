import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  type?: 'info' | 'error' | 'success';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000); // Auto-dismiss after 5 seconds
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}