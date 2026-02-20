import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
  onRetry?: () => void;
  slotId?: string;
}

export default function WhatsAppQRModal({
  isOpen,
  onClose,
  onConnected,
  onRetry,
  slotId = '1',
}: WhatsAppQRModalProps) {
  const { socket } = useSocket();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generating QR code...');

  useEffect(() => {
    if (!isOpen || !socket) return;

    const qrEvent = `whatsapp:qr:${slotId}`;
    const readyEvent = `whatsapp:ready:${slotId}`;
    const disconnectedEvent = `whatsapp:disconnected:${slotId}`;
    const authFailureEvent = `whatsapp:auth_failure:${slotId}`;
    const qrRetryEvent = `whatsapp:qr_retry:${slotId}`;

    const onQr = (data: string) => {
      setQrCode(data);
      setError(null);
      setConnected(false);
      setLoadingMessage('Generating QR code...');
    };
    const onReady = () => {
      setConnected(true);
      setQrCode(null);
      setError(null);
      onConnected?.();
    };
    const onDisconnected = (reason?: string) => {
      setError(reason || 'Disconnected from WhatsApp server');
      setLoadingMessage('Connection failed');
      setQrCode(null);
    };
    const onAuthFailure = (msg: string) => {
      setError(msg || 'Authentication failed');
      setQrCode(null);
    };
    const onQrRetry = () => {
      setQrCode(null);
      setError(null);
      setLoadingMessage('Generating new QR...');
    };

    socket.on(qrEvent, onQr);
    socket.on(readyEvent, onReady);
    socket.on(disconnectedEvent, onDisconnected);
    socket.on(authFailureEvent, onAuthFailure);
    socket.on(qrRetryEvent, onQrRetry);

    return () => {
      socket.off(qrEvent, onQr);
      socket.off(readyEvent, onReady);
      socket.off(disconnectedEvent, onDisconnected);
      socket.off(authFailureEvent, onAuthFailure);
      socket.off(qrRetryEvent, onQrRetry);
    };
  }, [isOpen, socket, slotId, onConnected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Connect WhatsApp {slotId ? `- Slot ${slotId}` : ''}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {connected ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-center text-slate-600 font-medium">Connected successfully</p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        ) : error ? (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-center text-red-600 text-sm">{error}</p>
            <div className="flex gap-2">
              {onRetry && (
                <Button variant="outline" onClick={onRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button onClick={onClose} className="flex-1">Close</Button>
            </div>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-slate-600 text-center">
              Scan this QR code with WhatsApp on your phone
            </p>
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              className="w-64 h-64 border border-gray-200 rounded"
            />
            <div className="flex gap-2 w-full">
              {onRetry && (
                <Button variant="outline" onClick={onRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New QR
                </Button>
              )}
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600">{loadingMessage}</p>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
}
