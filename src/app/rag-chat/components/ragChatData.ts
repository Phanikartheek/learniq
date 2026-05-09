export interface Citation {
  id: string;
  docId: string;
  docName: string;
  page: number;
  section: string;
  excerpt: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  docIds: string[];
  messageCount: number;
}

export interface SelectedDoc {
  id: string;
  name: string;
  topic: string;
  chunks: number;
}

export const AVAILABLE_DOCS: SelectedDoc[] = [
  { id: 'doc-001', name: 'System_Design_Primer.pdf', topic: 'System Design', chunks: 312 },
  { id: 'doc-002', name: 'OS_Concepts_Notes.pdf', topic: 'Operating Systems', chunks: 96 },
  { id: 'doc-004', name: 'DSAL_Algorithms_Guide.pdf', topic: 'Algorithms', chunks: 540 },
  { id: 'doc-005', name: 'Database_Design_Patterns.pdf', topic: 'Databases', chunks: 224 },
  { id: 'doc-006', name: 'React_Interview_Notes.md', topic: 'Frontend', chunks: 28 },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-001',
    title: 'Consistent hashing & load balancing',
    lastMessage: 'How does consistent hashing reduce cache misses during server failures?',
    timestamp: 'Today, 3:42 PM',
    docIds: ['doc-001'],
    messageCount: 8,
  },
  {
    id: 'conv-002',
    title: 'Process scheduling algorithms',
    lastMessage: 'What is the difference between preemptive and non-preemptive scheduling?',
    timestamp: 'Today, 11:20 AM',
    docIds: ['doc-002'],
    messageCount: 12,
  },
  {
    id: 'conv-003',
    title: 'Graph algorithms deep dive',
    lastMessage: 'Explain Dijkstra\'s algorithm with a practical example',
    timestamp: 'Yesterday',
    docIds: ['doc-004'],
    messageCount: 6,
  },
  {
    id: 'conv-004',
    title: 'Database indexing strategies',
    lastMessage: 'When should I use a composite index vs. a covering index?',
    timestamp: 'May 07, 2026',
    docIds: ['doc-005'],
    messageCount: 9,
  },
  {
    id: 'conv-005',
    title: 'React hooks & performance',
    lastMessage: 'Explain the difference between useMemo and useCallback',
    timestamp: 'May 06, 2026',
    docIds: ['doc-006'],
    messageCount: 5,
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-001',
    role: 'user',
    content: 'Explain consistent hashing and when you would use it in a distributed system.',
    timestamp: '3:38 PM',
  },
  {
    id: 'msg-002',
    role: 'assistant',
    content: `**Consistent hashing** is a distributed hashing technique designed to minimize key remapping when nodes are added or removed from a cluster.

**How it works:**
1. Both nodes and keys are mapped to positions on a virtual ring (hash ring) using the same hash function
2. Each key is assigned to the first node encountered when traversing the ring clockwise
3. When a node is added or removed, only the keys mapped to that node's segment need to be redistributed — not the entire keyspace

**Why it matters:**
In a naive modular hashing scheme (\`key % N\`), removing one server from a 10-server pool forces remapping ~90% of keys. With consistent hashing, only ~1/N keys (≈10%) need to move.

**Virtual nodes (vnodes):**
Real-world implementations (like Cassandra, DynamoDB) assign each physical node multiple virtual positions on the ring. This improves load distribution and makes rebalancing more granular.

**When to use it:**
- Distributed caches (Redis Cluster, Memcached)
- Sharding databases across multiple nodes
- Load balancing with session affinity requirements
- Content delivery networks for routing requests`,
    timestamp: '3:38 PM',
    citations: [
      {
        id: 'cite-001',
        docId: 'doc-001',
        docName: 'System_Design_Primer.pdf',
        page: 47,
        section: '4.2 — Consistent Hashing',
        excerpt: 'Consistent hashing maps both servers and objects to a ring. When a server is removed, only the objects on that server need to be redistributed to the next server on the ring.',
        relevance: 0.97,
      },
      {
        id: 'cite-002',
        docId: 'doc-001',
        docName: 'System_Design_Primer.pdf',
        page: 49,
        section: '4.3 — Virtual Nodes',
        excerpt: 'To avoid uneven distribution, each server is mapped to multiple virtual nodes. This spreads load more evenly and reduces the impact of a single node failure.',
        relevance: 0.91,
      },
    ],
  },
  {
    id: 'msg-003',
    role: 'user',
    content: 'How does consistent hashing reduce cache misses during server failures?',
    timestamp: '3:42 PM',
  },
  {
    id: 'msg-004',
    role: 'assistant',
    content: `When a cache node fails in a consistent hashing setup, only the keys that were mapped to that node need to be re-fetched from the origin. Here's the exact mechanism:

**Without consistent hashing:**
If you have 10 cache servers and one fails, \`key % 10\` becomes \`key % 9\` — virtually every key maps to a different server, causing a **thundering herd** of cache misses that hammers your database.

**With consistent hashing:**
Only the ~10% of keys assigned to the failed node's ring segment become cache misses. The remaining ~90% of keys still resolve to their correct nodes with zero disruption.

**The thundering herd problem:**
Even with consistent hashing, a sudden influx of misses for the failed node's keys can still spike database load. Mitigations include:
- **Replication:** Each key is stored on K successor nodes (e.g., DynamoDB replication factor = 3)
- **Jittered backoff:** Stagger cache-fill requests to avoid synchronized DB hits
- **Lease-based cache fill:** Only one client fills a missing key; others wait

This is why systems like Cassandra use a replication factor alongside consistent hashing — the hash ring determines *where* data lives, while replication ensures availability when nodes go down.`,
    timestamp: '3:42 PM',
    citations: [
      {
        id: 'cite-003',
        docId: 'doc-001',
        docName: 'System_Design_Primer.pdf',
        page: 52,
        section: '4.5 — Failure Handling',
        excerpt: 'When a node fails, consistent hashing ensures that only the keys assigned to that node are remapped to the next node in the ring, minimizing cache invalidation.',
        relevance: 0.95,
      },
    ],
  },
];

export const SUGGESTED_QUESTIONS = [
  'What is the CAP theorem and how does it apply to distributed databases?',
  'Explain the difference between SQL and NoSQL sharding strategies',
  'How does a message queue like Kafka differ from a traditional database?',
  'Walk me through designing a URL shortener at scale',
];