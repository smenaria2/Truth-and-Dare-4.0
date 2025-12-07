import React from 'react';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './Button';

export const ToastDisplay: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={cn(
            "pointer-events-auto p-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in slide-in-from-top duration-300",
            toast.type === 'error' ? "bg-red-500 text-white" : 
            toast.type === 'success' ? "bg-green-500 text-white" : 
            "bg-slate-800 text-white"
          )}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'error' && <XCircle size={20} className="mr-3" />}
          {toast.type === 'success' && <CheckCircle size={20} className="mr-3" />}
          {toast.type === 'info' && <AlertCircle size={20} className="mr-3" />}
          <div className="flex-1">
            <div className="font-bold text-sm">{toast.title}</div>
            <div className="text-xs opacity-90">{toast.message}</div>
          </div>
          {toast.action && (
            <Button onClick={() => { toast.action?.onClick(); removeToast(toast.id); }} variant="ghost" className="ml-4 bg-white/20 px-3 py-1 rounded text-xs font-bold hover:bg-white/30 text-white">
              {toast.action.label}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};