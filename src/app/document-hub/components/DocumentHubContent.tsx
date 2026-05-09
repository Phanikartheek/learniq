'use client';
import React, { useState } from 'react';
import DocumentHubHeader from './DocumentHubHeader';
import UploadZone from './UploadZone';
import DocumentTable from './DocumentTable';
import DocumentPreviewDrawer from './DocumentPreviewDrawer';
import type { Document } from './documentData';

export default function DocumentHubContent() {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-8 space-y-8">
      <DocumentHubHeader />
      <UploadZone onUploadComplete={() => setRefreshKey((k) => k + 1)} />
      <DocumentTable key={refreshKey} onPreview={setPreviewDoc} />
      <DocumentPreviewDrawer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}