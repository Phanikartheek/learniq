'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { addToast } from '@/components/ui/Toast';

interface UploadFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
}

interface UploadZoneProps {
  onUploadComplete: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = ['.pdf', '.md', '.txt', '.docx', '.pptx'];

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((rawFiles: FileList | null) => {
    if (!rawFiles) return;
    const newFiles: UploadFile[] = Array.from(rawFiles).map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      size: formatBytes(f.size),
      progress: 0,
      status: 'queued',
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // BACKEND INTEGRATION: Replace simulation with real upload API using axios with JWT interceptor
    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 18) + 8;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress: 100, status: 'done' } : f))
          );
          addToast({ type: 'success', title: `${file.name} uploaded`, description: 'Now queued for text extraction.' });
          onUploadComplete();
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress, status: 'uploading' } : f))
          );
        }
      }, 200 + Math.random() * 150);
    });
  }, [onUploadComplete]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-200 group
          ${isDragging
            ? 'border-primary bg-primary/10 scale-[1.01] animate-border-pulse'
            : 'border-border hover:border-primary/50 hover:bg-primary/5 bg-card/30'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="Upload documents — click or drag and drop files here"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
          aria-hidden="true"
        />

        <div className={`mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${isDragging ? 'bg-primary/25 scale-110' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
          <Upload size={26} className={`transition-colors ${isDragging ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`} />
        </div>

        <p className="font-display font-semibold text-foreground mb-1">
          {isDragging ? 'Drop your files here' : 'Drag & drop your study materials'}
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          or <span className="text-primary font-medium">browse to upload</span>
        </p>
        <p className="text-xs text-muted-foreground/70">
          Supported: PDF, Markdown, TXT, DOCX, PPTX · Max 50 MB per file
        </p>
      </div>

      {/* Upload queue */}
      {files.length > 0 && (
        <div className="glass-card rounded-xl border border-border divide-y divide-border">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-4 px-5 py-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <FileText size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <span className="text-xs text-muted-foreground ml-3 flex-shrink-0">{file.size}</span>
                </div>
                {file.status === 'uploading' && (
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === 'queued' && (
                  <p className="text-xs text-muted-foreground">Queued…</p>
                )}
                {file.status === 'done' && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> Uploaded — processing started</p>
                )}
                {file.status === 'error' && (
                  <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> Upload failed — try again</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {file.status === 'uploading' && (
                  <Loader2 size={15} className="animate-spin text-primary" />
                )}
                {file.status === 'done' && (
                  <CheckCircle size={15} className="text-emerald-400" />
                )}
                {file.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label={`Remove ${file.name} from queue`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}