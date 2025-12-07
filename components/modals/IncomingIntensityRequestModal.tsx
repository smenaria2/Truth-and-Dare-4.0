import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { IntensityLevel } from '../../lib/types';

interface IncomingIntensityRequestModalProps {
  pendingIntensityRequest: { level: IntensityLevel, requester: string } | null;
  hostName: string;
  guestName: string;
  handleIntensityResponse: (accepted: boolean, level?: IntensityLevel) => void;
}

export const IncomingIntensityRequestModal: React.FC<IncomingIntensityRequestModalProps> = ({
  pendingIntensityRequest,
  hostName,
  guestName,
  handleIntensityResponse,
}) => {
  if (!pendingIntensityRequest) return null;

  return (
    <div 
      className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intensity-request-title"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
         <div className="flex items-center gap-3 mb-4">
           <AlertCircle className="text-romantic-500" size={32} aria-hidden="true" />
           <div>
              <h3 id="intensity-request-title" className="text-lg font-bold text-slate-800">Intensity Change</h3>
              <p className="text-xs text-slate-500">Request from {pendingIntensityRequest.requester}</p>
           </div>
         </div>
         <p className="text-slate-600 mb-6">Change to <strong className="text-romantic-600 capitalize">{pendingIntensityRequest.level.replace('_', ' ')}</strong>?</p>
         <div className="flex gap-3">
           <Button onClick={() => handleIntensityResponse(false)} variant="secondary" className="flex-1" aria-label="Reject intensity change">Reject</Button>
           <Button onClick={() => handleIntensityResponse(true, pendingIntensityRequest.level)} variant="primary" className="flex-1" aria-label="Accept intensity change">Accept</Button>
         </div>
      </div>
    </div>
  );
};