'use client';
import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Eye, Trash2, RefreshCw, MessageSquare,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  FileText, FileCode, PresentationIcon, BookOpen,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusVariant } from '@/components/ui/StatusBadge';
import { MOCK_DOCUMENTS } from './documentData';
import type { Document, DocStatus } from './documentData';
import { addToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

interface DocumentTableProps {
  onPreview: (doc: Document) => void;
}

type SortKey = 'name' | 'topic' | 'pages' | 'size' | 'uploadedAt' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_FILTER_OPTIONS: { value: DocStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  PDF: FileText,
  Notes: FileCode,
  Slides: PresentationIcon,
  Article: BookOpen,
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function DocumentTable({ onPreview }: DocumentTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('uploadedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);

  const filtered = useMemo(() => {
    let result = [...documents];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.topic.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    result.sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (sortKey === 'pages') { av = a.pages; bv = b.pages; }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [documents, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((d) => d.id)));
    }
  };

  const handleDelete = (doc: Document) => setDeleteTarget(doc);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setSelected((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
    addToast({ type: 'success', title: 'Document deleted', description: `${deleteTarget.name} has been removed.` });
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    const count = selected.size;
    setDocuments((prev) => prev.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
    addToast({ type: 'success', title: `${count} document${count > 1 ? 's' : ''} deleted` });
  };

  const handleRetry = (doc: Document) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: 'processing', progress: 0 } : d))
    );
    addToast({ type: 'info', title: 'Reprocessing started', description: `${doc.name} is being re-extracted.` });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-primary" />
      : <ChevronDown size={13} className="text-primary" />;
  };

  return (
    <>
      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-border">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or topic…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Filter size={14} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as DocStatus | 'all'); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              aria-label="Filter by status"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={`filter-${o.value}`} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 border-b border-primary/20 animate-slide-up">
            <span className="text-sm font-medium text-primary">{selected.size} selected</span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-medium hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={13} /> Delete selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-ring"
                    aria-label="Select all visible rows"
                  />
                </th>
                {[
                  { key: 'name', label: 'Document', width: '' },
                  { key: 'type', label: 'Type', width: 'w-20' },
                  { key: 'topic', label: 'Topic', width: 'w-36' },
                  { key: 'pages', label: 'Pages', width: 'w-20' },
                  { key: 'size', label: 'Size', width: 'w-20' },
                  { key: 'uploadedAt', label: 'Uploaded', width: 'w-32' },
                  { key: 'status', label: 'Status', width: 'w-28' },
                  { key: 'ready', label: 'RAG Ready', width: 'w-24' },
                ].map((col) => (
                  <th
                    key={`th-${col.key}`}
                    className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider ${col.width}`}
                  >
                    {['name', 'topic', 'pages', 'uploadedAt', 'status'].includes(col.key) ? (
                      <button
                        onClick={() => toggleSort(col.key as SortKey)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {col.label} <SortIcon col={col.key as SortKey} />
                      </button>
                    ) : col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <FileText size={28} className="text-muted-foreground" />
                      </div>
                      <p className="font-display font-semibold text-foreground">No documents found</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {search || statusFilter !== 'all' ?'Try adjusting your search or filter to find what you\'re looking for.'
                          : 'Upload your first study material above to get started with AI-powered Q&A.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((doc) => {
                  const TypeIcon = TYPE_ICONS[doc.type] ?? FileText;
                  const isSelected = selected.has(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className={`group transition-colors hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(doc.id)}
                          className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-ring"
                          aria-label={`Select ${doc.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                            <TypeIcon size={14} className="text-primary" />
                          </div>
                          <span className="font-medium text-foreground max-w-[200px] truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">{doc.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{doc.topic}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{doc.pages}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{doc.size}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.uploadedAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={doc.status as StatusVariant} />
                          {doc.status === 'processing' && doc.progress !== undefined && (
                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${doc.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {doc.ready ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Ready
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="relative group/btn">
                            <button
                              onClick={() => onPreview(doc)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              aria-label={`Preview ${doc.name}`}
                            >
                              <Eye size={15} />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-card border border-border text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity z-10">
                              Preview
                            </span>
                          </div>
                          {doc.ready && (
                            <div className="relative group/btn">
                              <button
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                                aria-label={`Chat with ${doc.name}`}
                              >
                                <MessageSquare size={15} />
                              </button>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-card border border-border text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity z-10">
                                Ask AI
                              </span>
                            </div>
                          )}
                          {doc.status === 'failed' && (
                            <div className="relative group/btn">
                              <button
                                onClick={() => handleRetry(doc)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                                aria-label={`Retry processing ${doc.name}`}
                              >
                                <RefreshCw size={15} />
                              </button>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-card border border-border text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity z-10">
                                Retry extraction
                              </span>
                            </div>
                          )}
                          <div className="relative group/btn">
                            <button
                              onClick={() => handleDelete(doc)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              aria-label={`Delete ${doc.name} — this cannot be undone`}
                            >
                              <Trash2 size={15} />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-card border border-border text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity z-10">
                              Delete document
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of{' '}
              <span className="font-medium text-foreground tabular-nums">{filtered.length}</span> documents
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 rounded-lg bg-input border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={`ps-${s}`} value={s}>{s} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={`page-${p}`}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-primary/20 text-primary border border-primary/30' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                aria-label={`Go to page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete document"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all associated conversations and quiz data. This cannot be undone.`}
        size="md"
      >
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-150"
          >
            Delete document
          </button>
        </div>
      </Modal>
    </>
  );
}