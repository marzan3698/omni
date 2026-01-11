import { useState, useRef, useCallback } from 'react';
import { Upload, X, Link as LinkIcon, Image, FileText, Video, Music, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AttachmentUploaderProps {
  onFileSelect?: (file: File) => void;
  onLinkAdd?: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  taskId?: number;
  subTaskId?: number;
}

export function AttachmentUploader({
  onFileSelect,
  onLinkAdd,
  onRemove,
  accept = 'image/*,application/pdf,video/*,audio/*',
  maxSize = 50 * 1024 * 1024, // 50MB default
  className,
  taskId,
  subTaskId,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    // Validate file type
    const validTypes = accept.split(',').map((type) => type.trim());
    const isValidType = validTypes.some((type) => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(`${category}/`);
      }
      return file.type === type;
    });

    if (!isValidType) {
      alert(`Invalid file type. Allowed types: ${accept}`);
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    try {
      new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`);
      onLinkAdd?.(linkUrl);
      setLinkUrl('');
      setUploadMode('file');
    } catch {
      alert('Please enter a valid URL');
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload mode toggle */}
      <div className="flex gap-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUploadMode('file')}
          className={cn(
            'rounded-none border-b-2 border-transparent',
            uploadMode === 'file' && 'border-indigo-600 text-indigo-600'
          )}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUploadMode('link')}
          className={cn(
            'rounded-none border-b-2 border-transparent',
            uploadMode === 'link' && 'border-indigo-600 text-indigo-600'
          )}
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* File upload mode */}
      {uploadMode === 'file' && (
        <div>
          {!selectedFile ? (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 mb-1">
                Drag and drop a file here, or click to select
              </p>
              <p className="text-xs text-slate-500">
                Images, PDFs, Videos, Audio (max {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-indigo-100 rounded flex items-center justify-center">
                    {getFileIcon(selectedFile)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link upload mode */}
      {uploadMode === 'link' && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="link-url" className="text-sm font-medium text-slate-700">
              Link URL
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1">
                <Input
                  ref={linkInputRef}
                  id="link-url"
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddLink();
                    }
                  }}
                />
              </div>
              <Button onClick={handleAddLink} className="bg-indigo-600 hover:bg-indigo-700">
                <Globe className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

