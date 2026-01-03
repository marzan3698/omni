import { useState } from 'react';
import { X, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorAlertProps {
  error: any;
  onClose: () => void;
}

export function ErrorAlert({ error, onClose }: ErrorAlertProps) {
  const [copied, setCopied] = useState(false);

  // Extract detailed error information
  const getErrorDetails = () => {
    const details: Record<string, any> = {};

    // Basic error info
    if (error.message) details.message = error.message;
    if (error.name) details.name = error.name;
    if (error.code) details.code = error.code;

    // Response data
    if (error.response) {
      if (error.response.status) details.status = error.response.status;
      if (error.response.statusText) details.statusText = error.response.statusText;
      if (error.response.data) {
        details.responseData = error.response.data;
        if (error.response.data.message) details.errorMessage = error.response.data.message;
      }
    }

    // Request info
    if (error.config) {
      if (error.config.url) details.url = error.config.url;
      if (error.config.method) details.method = error.config.method;
    }

    // Stack trace (for development)
    if (error.stack) details.stack = error.stack;

    return details;
  };

  const errorDetails = getErrorDetails();
  const errorJson = JSON.stringify(errorDetails, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getErrorMessage = () => {
    if (errorDetails.errorMessage) return errorDetails.errorMessage;
    if (errorDetails.message) return errorDetails.message;
    return 'An error occurred';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-slate-900">Error Details</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error Message */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Error Message:</h4>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{getErrorMessage()}</p>
            </div>
          </div>

          {/* Error Details */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Error Details:</h4>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <div className="space-y-2 text-sm">
                {errorDetails.status && (
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-600">Status:</span>
                    <span className="text-slate-900">{errorDetails.status} {errorDetails.statusText || ''}</span>
                  </div>
                )}
                {errorDetails.url && (
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-600">URL:</span>
                    <span className="text-slate-900 break-all">{errorDetails.url}</span>
                  </div>
                )}
                {errorDetails.method && (
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-600">Method:</span>
                    <span className="text-slate-900">{errorDetails.method.toUpperCase()}</span>
                  </div>
                )}
                {errorDetails.code && (
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-600">Code:</span>
                    <span className="text-slate-900">{errorDetails.code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Error JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700">Full Error (JSON):</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto">
              {errorJson}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Error
          </Button>
          <Button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

