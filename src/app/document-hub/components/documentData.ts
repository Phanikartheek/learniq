export type DocStatus = 'ready' | 'processing' | 'pending' | 'failed';
export type DocType = 'PDF' | 'Notes' | 'Slides' | 'Article';

export interface Document {
  id: string;
  name: string;
  type: DocType;
  topic: string;
  pages: number;
  size: string;
  uploadedAt: string;
  status: DocStatus;
  progress?: number;
  chunks?: number;
  ready: boolean;
  excerpt?: string;
}

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    name: 'System_Design_Primer.pdf',
    type: 'PDF',
    topic: 'System Design',
    pages: 124,
    size: '4.2 MB',
    uploadedAt: 'May 08, 2026',
    status: 'ready',
    chunks: 312,
    ready: true,
    excerpt: 'Covers scalable system architecture, load balancing, caching strategies, database sharding, and microservices design patterns used at top tech companies.',
  },
  {
    id: 'doc-002',
    name: 'OS_Concepts_Notes.pdf',
    type: 'PDF',
    topic: 'Operating Systems',
    pages: 48,
    size: '1.8 MB',
    uploadedAt: 'May 08, 2026',
    status: 'ready',
    chunks: 96,
    ready: true,
    excerpt: 'Comprehensive notes on process scheduling, memory management, virtual memory, file systems, and concurrency primitives.',
  },
  {
    id: 'doc-003',
    name: 'Networking_Fundamentals.pdf',
    type: 'PDF',
    topic: 'Networking',
    pages: 67,
    size: '2.4 MB',
    uploadedAt: 'May 08, 2026',
    status: 'processing',
    progress: 62,
    ready: false,
    excerpt: 'TCP/IP stack, HTTP/HTTPS protocols, DNS resolution, CDN architecture, WebSockets, and network security fundamentals.',
  },
  {
    id: 'doc-004',
    name: 'DSAL_Algorithms_Guide.pdf',
    type: 'PDF',
    topic: 'Algorithms',
    pages: 210,
    size: '7.1 MB',
    uploadedAt: 'May 07, 2026',
    status: 'ready',
    chunks: 540,
    ready: true,
    excerpt: 'In-depth coverage of sorting, searching, graph algorithms, dynamic programming, greedy algorithms, and complexity analysis.',
  },
  {
    id: 'doc-005',
    name: 'Database_Design_Patterns.pdf',
    type: 'PDF',
    topic: 'Databases',
    pages: 88,
    size: '3.0 MB',
    uploadedAt: 'May 07, 2026',
    status: 'ready',
    chunks: 224,
    ready: true,
    excerpt: 'SQL vs NoSQL trade-offs, normalization, indexing strategies, ACID vs BASE, replication, and query optimization.',
  },
  {
    id: 'doc-006',
    name: 'React_Interview_Notes.md',
    type: 'Notes',
    topic: 'Frontend',
    pages: 12,
    size: '0.2 MB',
    uploadedAt: 'May 06, 2026',
    status: 'ready',
    chunks: 28,
    ready: true,
    excerpt: 'React hooks, virtual DOM, reconciliation, state management patterns, performance optimization, and common interview questions.',
  },
  {
    id: 'doc-007',
    name: 'Cloud_Architecture_Slides.pdf',
    type: 'Slides',
    topic: 'Cloud / DevOps',
    pages: 54,
    size: '5.6 MB',
    uploadedAt: 'May 05, 2026',
    status: 'pending',
    ready: false,
    excerpt: 'AWS, GCP, and Azure service comparison, Kubernetes orchestration, CI/CD pipelines, and infrastructure-as-code.',
  },
  {
    id: 'doc-008',
    name: 'Behavioral_Interview_Guide.pdf',
    type: 'PDF',
    topic: 'Behavioral',
    pages: 32,
    size: '0.9 MB',
    uploadedAt: 'May 04, 2026',
    status: 'failed',
    ready: false,
    excerpt: 'STAR method, leadership principles, conflict resolution scenarios, and curated behavioral question bank from FAANG interviews.',
  },
];