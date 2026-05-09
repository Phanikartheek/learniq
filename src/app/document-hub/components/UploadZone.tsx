'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Cpu, Database, Search, Sparkles } from 'lucide-react';
import { addToast } from '@/components/ui/Toast';

interface UploadFile {
  id: string;
  name: string;
  size: string;
  rawSize: number;
  progress: number;
  status: 'queued' | 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'done' | 'error';
  pipelineStep: number;
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

const PIPELINE_STEPS = [
  { id: 0, label: 'Uploading', icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { id: 1, label: 'Extracting Text', icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  { id: 2, label: 'Chunking', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 3, label: 'Embedding', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
  { id: 4, label: 'Indexing', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { id: 5, label: 'Ready', icon: Search, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
];

const STATUS_LABELS: Record<UploadFile['status'], string> = {
  queued: 'Queued…',
  uploading: 'Uploading file…',
  extracting: 'Extracting text…',
  chunking: 'Chunking content…',
  embedding: 'Generating embeddings…',
  indexing: 'Indexing vectors…',
  done: 'Ready for RAG queries',
  error: 'Upload failed — try again',
};

function simulatePipeline(
  fileId: string,
  rawSize: number,
  setFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>,
  onComplete: () => void
) {
  const uploadDuration = Math.max(800, Math.min(rawSize / 50000, 3000));
  const stepDurations = [uploadDuration, 600, 400, 800, 500];

  // Phase 0: Upload with real progress
  let progress = 0;
  const uploadInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 8;
    if (progress >= 100) {
      progress = 100;
      clearInterval(uploadInterval);
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, progress: 100, status: 'extracting', pipelineStep: 1 } : f));
      runPipelineSteps(fileId, 1, stepDurations, setFiles, onComplete);
    } else {
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, progress, status: 'uploading', pipelineStep: 0 } : f));
    }
  }, uploadDuration / 15);
}

function runPipelineSteps(
  fileId: string,
  step: number,
  durations: number[],
  setFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>,
  onComplete: () => void
) {
  if (step >= durations.length) {
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: 'done', pipelineStep: 5 } : f));
    onComplete();
    return;
  }

  const statusMap: Record<number, UploadFile['status']> = {
    1: 'extracting',
    2: 'chunking',
    3: 'embedding',
    4: 'indexing',
  };

  setTimeout(() => {
    const nextStep = step + 1;
    const nextStatus = statusMap[nextStep] || 'done';
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: nextStatus, pipelineStep: nextStep } : f));
    runPipelineSteps(fileId, nextStep, durations, setFiles, onComplete);
  }, durations[step - 1] + Math.random() * 200);
}

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
      rawSize: f.size,
      progress: 0,
      status: 'queued',
      pipelineStep: -1,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      setTimeout(() => {
        setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: 'uploading', pipelineStep: 0 } : f));
        simulatePipeline(file.id, file.rawSize, setFiles, () => {
          addToast({ type: 'success', title: `${file.name} ready`, description: 'Document indexed and ready for RAG queries.' });
          onUploadComplete();
        });
      }, 300 + Math.random() * 400);
    });
  }, [onUploadComplete]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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

      {/* Upload queue with pipeline states */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => {
            const isActive = file.status !== 'queued' && file.status !== 'done' && file.status !== 'error';
            const isDone = file.status === 'done';
            const isError = file.status === 'error';

            return (
              <div key={file.id} className={`glass-card rounded-xl border transition-all duration-300 overflow-hidden ${
                isDone ? 'border-emerald-500/20' : isError ? 'border-red-500/20' : isActive ? 'border-primary/20' : 'border-border'
              }`}>
                {/* File header */}
                <div className="flex items-center gap-4 px-5 py-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${isDone ? 'bg-emerald-500/10' : isError ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                    <FileText size={16} className={isDone ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-primary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <span className="text-xs text-muted-foreground ml-3 flex-shrink-0">{file.size}</span>
                    </div>
                    {/* Upload progress bar */}
                    {file.status === 'uploading' && (
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                    {/* Status label */}
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                      isDone ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-muted-foreground'
                    }`}>
                      {isActive && <Loader2 size={10} className="animate-spin" />}
                      {isDone && <CheckCircle size={10} />}
                      {isError && <AlertCircle size={10} />}
                      {STATUS_LABELS[file.status]}
                      {file.status === 'uploading' && ` (${file.progress}%)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive && <Loader2 size={15} className="animate-spin text-primary" />}
                    {isDone && <CheckCircle size={15} className="text-emerald-400" />}
                    {(isDone || isError || file.status === 'queued') && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated pipeline steps */}
                {(isActive || isDone) && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-1">
                      {PIPELINE_STEPS.map((step, i) => {
                        const isCompleted = file.pipelineStep > step.id;
                        const isCurrent = file.pipelineStep === step.id;
                        const StepIcon = step.icon;
                        return (
                          <React.Fragment key={step.id}>
                            <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                              isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'
                            }`}>
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' :
                                isCurrent ? `${step.bg} animate-pulse` :
                                'bg-muted/30 border-border'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle size={12} className="text-emerald-400" />
                                ) : (
                                  <StepIcon size={12} className={isCurrent ? step.color : 'text-muted-foreground'} />
                                )}
                              </div>
                              <span className={`text-[9px] font-medium leading-tight text-center w-12 ${
                                isCurrent ? step.color : isCompleted ? 'text-emerald-400' : 'text-muted-foreground'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                            {i < PIPELINE_STEPS.length - 1 && (
                              <div className={`flex-1 h-px mb-4 transition-all duration-500 ${
                                file.pipelineStep > step.id ? 'bg-emerald-500/40' : 'bg-border'
                              }`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}