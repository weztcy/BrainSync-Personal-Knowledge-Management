import { prisma } from '../src/core/infrastructure/database/prisma.client.js';
import { PrismaNoteRepository } from '../src/core/infrastructure/database/prisma-note.repository.js';
import { PrismaTagRepository } from '../src/core/infrastructure/database/prisma-tag.repository.js';
import { SaveNoteUseCase } from '../src/core/use-cases/notes/save-note.usecase.js';

interface SeedNote {
  title: string;
  content: string;
  isPinned?: boolean;
  manualTags?: string[];
}

const DUMMY_NOTES: SeedNote[] = [
  {
    title: 'BrainSync Project Overview',
    isPinned: true,
    content: `# BrainSync - Personal Knowledge Management

BrainSync is a modern, distraction-free PKM web app inspired by Obsidian and Notion.

### Key Capabilities:
- **Bi-Directional Wiki-Links**: Associative thought network with \`[[Title]]\`.
- **Auto-Save**: 1500ms debounce ensures your writing is never lost.
- **Dynamic Tagging**: Combines inline \`#hashtags\` with metadata tags.
- **Universal Omnibar**: Fast fuzzy search triggered with \`Cmd/Ctrl + K\`.
- **Global Task Dashboard**: Track all \`- [ ]\` and \`- [x]\` checklist items across the vault in \`[[Release Checklist 2026]]\`.

### Tech Stack:
- Built with [[Clean Architecture Principles]] in Fastify + Prisma.
- Powered by [[Next.js App Router Insights]] on the frontend.
- Accelerated by [[Full-Text Search vs pg_trgm]] for instant retrieval.
- Supported by [[Docker Containerization in Production]].
- Upcoming ideas are noted in the [[Future Roadmap]].

#brainsync #pkm #project #architecture`,
    manualTags: ['brainsync', 'pkm', 'project'],
  },
  {
    title: 'Clean Architecture Principles',
    content: `# Clean Architecture Principles

> "The software architecture is the set of design choices that should be made early in a project to govern system structure and behavior."

Clean Architecture emphasizes **separation of concerns** through concentric layers where the dependency rule states that dependencies must always point inwards.

### Core Layers:
1. **Domain Entities**: Enterprise business rules with zero external dependencies.
2. **Use Cases**: Application-specific business rules orchestration.
3. **Interface Adapters**: Controllers, presenters, and repositories.
4. **Frameworks & Drivers**: UI (Next.js), database (PostgreSQL/Prisma), and HTTP frameworks.

Related concepts:
- See [[Domain-Driven Design]] for structuring domain logic.
- Implemented via the [[Repository Pattern]] for database decoupling.
- Uses [[Dependency Injection]] to wire components without coupling.
- Compare with [[Event-Driven Architecture]] for distributed topologies.

#architecture #software-engineering #best-practices`,
    manualTags: ['clean-code'],
  },
  {
    title: 'Domain-Driven Design',
    content: `# Domain-Driven Design (DDD)

Domain-Driven Design focuses on solving domain complexity through collaboration between technical experts and domain stakeholders.

### Core Building Blocks:
- **Ubiquitous Language**: Shared vocabulary across team and codebase.
- **Bounded Context**: Explicit boundary within which a domain model applies.
- **Entities & Value Objects**: Distinction between identity-based objects and immutable descriptor objects.
- **Aggregates**: Clusters of domain objects treated as a single unit for data changes.

Interconnects closely with [[Clean Architecture Principles]] and [[Event-Driven Architecture]].

#architecture #ddd #design`,
  },
  {
    title: 'Repository Pattern',
    content: `# Repository Pattern

The Repository Pattern mediates between the domain and data mapping layers, acting like an in-memory collection of domain objects.

### TypeScript Example:
\`\`\`typescript
export interface INoteRepository {
  findById(id: string): Promise<Note | null>;
  save(note: Note, targetLinkIds: string[]): Promise<Note>;
  delete(id: string): Promise<void>;
}
\`\`\`

Benefits:
- Eliminates direct ORM coupling in business logic.
- Enables effortless unit testing with mock repositories.
- Facilitates database changes without touching use cases.

Used extensively in [[Clean Architecture Principles]] and optimized with [[PostgreSQL Optimization]].

#design-patterns #architecture`,
  },
  {
    title: 'Dependency Injection',
    content: `# Dependency Injection (DI)

Dependency Injection is an Inversion of Control (IoC) technique where objects receive other objects that they depend on rather than creating them internally.

### Advantages:
- High testability: Mocks can be injected effortlessly.
- Loose coupling: Components only depend on contracts (interfaces).
- Single Responsibility: Construction is separated from execution.

Essential for [[Clean Architecture Principles]] and modern [[Testing Strategies]].

#design-patterns #software-engineering`,
  },
  {
    title: 'Event-Driven Architecture',
    content: `# Event-Driven Architecture (EDA)

Event-Driven Architecture is a design pattern in which decoupled systems communicate by producing and consuming events.

### Core Elements:
- **Event Producers**: Detect state mutations and emit immutable domain events.
- **Event Broker / Bus**: RabbitMQ, Kafka, or Postgres Listen/Notify channels.
- **Event Consumers**: React asynchronously to events to update projections or trigger side-effects.

Contrasted with synchronous communication in [[Microservices vs Monolith]] and complements [[Domain-Driven Design]].

#architecture #distributed-systems #events`,
  },
  {
    title: 'Microservices vs Monolith',
    content: `# Microservices vs Modular Monolith

A pragmatic evaluation of application packaging and deployment boundaries:

| Dimension | Modular Monolith | Microservices Architecture |
| :--- | :--- | :--- |
| **Operational Overhead** | Low (single deployment artifact) | High (k8s, service mesh, tracing) |
| **Network Latency** | In-memory method calls (zero latency) | Network hops (RPC/REST/gRPC) |
| **Data Consistency** | ACID transactions supported natively | Eventual consistency / Saga pattern |
| **Team Autonomy** | Good with clear package boundaries | Maximum independent release cycles |

Read about [[Distributed Systems & CAP Theorem]] and [[API Design Best Practices]] before decomposing a monolith.

#architecture #microservices #devops`,
  },
  {
    title: 'API Design Best Practices',
    content: `# API Design Best Practices

Designing robust, developer-friendly APIs requires consistency and clear contracts:

### Core Guidelines:
1. **Idempotency**: Ensure \`PUT\` and \`DELETE\` are idempotent; use idempotency keys for critical \`POST\` operations.
2. **Predictable Status Codes**:
   - \`200 OK\`, \`201 Created\`, \`204 No Content\`
   - \`400 Bad Request\`, \`404 Not Found\`, \`409 Conflict\`, \`422 Unprocessable\`
3. **Filtering & Pagination**: Use cursor-based pagination for large data streams.
4. **Caching Headers**: Proper \`ETag\` and \`Cache-Control\` usage (see [[Caching Strategies & Redis]]).

Connected with [[Next.js App Router Insights]] and [[Clean Architecture Principles]].

#api #rest #backend`,
  },
  {
    title: 'Distributed Systems & CAP Theorem',
    content: `# Distributed Systems & CAP Theorem

The CAP theorem states that any distributed data store can only simultaneously provide two out of the following three guarantees:

- **Consistency (C)**: Every read receives the most recent write or an error.
- **Availability (A)**: Every request receives a non-error response without guarantee of recent write.
- **Partition Tolerance (P)**: The system continues to operate despite arbitrary network partitions.

In real-world networks where partitions are inevitable, systems choose between **CP** (e.g. Raft consensus) and **AP** (e.g. Cassandra / DynamoDB).

Referenced in [[Book Notes: Designing Data-Intensive Applications]] and [[Database Indexing Strategies]].

#distributed-systems #database #theory`,
  },
  {
    title: 'Caching Strategies & Redis',
    content: `# Caching Strategies & Redis

Caching is one of the highest leverage techniques for scaling read-heavy applications:

### Caching Patterns:
- **Cache-Aside (Lazy Loading)**: Application reads cache; if miss, loads from DB and updates cache.
- **Write-Through**: Application writes data to cache and DB simultaneously.
- **Write-Behind (Write-Back)**: Writes to cache first; asynchronous daemon flushes to DB.

### Pitfalls to Avoid:
- Cache stampede (thundering herd) — mitigate with probabilistic early expiration.
- Stale data — establish sensible TTLs and event-based invalidation.

See [[PostgreSQL Optimization]] and [[API Design Best Practices]].

#caching #redis #performance`,
  },
  {
    title: 'PostgreSQL Optimization',
    content: `# PostgreSQL Optimization Guide

High-performance tips for production PostgreSQL databases:

### Key Strategies:
1. **Explain Analyze**: Always examine execution plans for slow queries.
2. **Trigram Indexing (\`pg_trgm\`)**:
   \`\`\`sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX idx_notes_title_trgm ON "Note" USING gin (title gin_trgm_ops);
   \`\`\`
3. **Autovacuum Tuning**: Prevent index bloat and dead tuple accumulation.
4. **Connection Pooling**: Use PgBouncer or Fastify connection pools for high concurrency.

Explore more on [[Database Indexing Strategies]] and read [[Full-Text Search vs pg_trgm]].

#database #postgresql #performance`,
  },
  {
    title: 'Database Indexing Strategies',
    content: `# Database Indexing Strategies

Choosing the appropriate index type is crucial for query throughput:

- **B-Tree**: Default, ideal for equality and range queries (\`=\`, \`<\`, \`>\`, \`BETWEEN\`).
- **GIN (Generalized Inverted Index)**: Outstanding for array contains, full-text search, and trigram substrings.
- **GiST**: Best for geometric data, network addresses, and spatial queries.
- **BRIN**: Ideal for huge time-series tables physically clustered by timestamp.

Complements our techniques in [[PostgreSQL Optimization]] and [[Book Notes: Designing Data-Intensive Applications]].

#database #performance`,
  },
  {
    title: 'Full-Text Search vs pg_trgm',
    content: `# Full-Text Search (FTS) vs Trigram Similarity (pg_trgm)

A breakdown of search strategies in PostgreSQL:

| Feature | PostgreSQL tsvector (FTS) | PostgreSQL pg_trgm |
| :--- | :--- | :--- |
| **Typo Tolerance** | Low (requires stemming dictionaries) | **High** (Levenshtein & trigram similarity) |
| **Substrings** | Word prefixes only | **Arbitrary substrings & regex** |
| **Index Type** | GIN on \`tsvector\` | GIN on \`gin_trgm_ops\` |
| **Best For** | Massive text documents (articles) | **PKM search, Omnibar, code snippets** |

Powering the search engine in [[BrainSync Project Overview]] alongside [[PostgreSQL Optimization]].

#database #search #postgresql`,
  },
  {
    title: 'Next.js App Router Insights',
    content: `# Next.js App Router Insights

Next.js 16 with React 19 brings powerful server-first conventions:

### Architectural Highlights:
- **React Server Components (RSC)**: Server-rendered by default, zero client JavaScript for non-interactive views.
- **Server Actions**: Direct server-side mutations that eliminate boilerplate REST controllers while keeping type safety.
- **Parallel & Intercepting Routes**: Modals and route-based UI states without URL disconnects.

See [[BrainSync Project Overview]] for our real-world application and read [[React Server Components]] for deep-dive patterns.

#frontend #react #nextjs`,
  },
  {
    title: 'React Server Components',
    content: `# React Server Components (RSC)

React Server Components represent a paradigm shift in full-stack web applications:

\`\`\`tsx
// Async Server Component
export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNoteAction(id);
  return <MarkdownEditor initialNote={note} />;
}
\`\`\`

### Fundamental Rules:
1. Server components execute only on the server during request or build time.
2. Client components (\`'use client'\`) are interactive islands.
3. Pass data from server to client via props or server action closures.

Connected with [[Next.js App Router Insights]] and modern [[State Management in 2026]].

#react #frontend`,
  },
  {
    title: 'State Management in 2026',
    content: `# State Management in 2026

Modern frontend architectures favor fine-grained reactivity and external store synchronization:

- **Server-driven state**: Let React Server Components handle data fetching.
- **External stores**: Use \`useSyncExternalStore\` for local storage, media queries, and themes.
- **URL as single source of truth**: Route params and query strings for filter, pagination, and modal state.

Reference: [[React Server Components]] for server-side state hydration.

#frontend #react #architecture`,
  },
  {
    title: 'CI/CD Pipelines & DevOps Automation',
    content: `# CI/CD Pipelines & DevOps Automation

Modern continuous integration and deployment automates quality gates:

### Pipeline Stages:
1. **Lint & Static Analysis**: ESLint 9, Prettier, and strict TypeScript compilation (\`tsc --noEmit\`).
2. **Automated Testing**: Fast Vitest execution with coverage thresholds (see [[Testing Strategies]]).
3. **Container Build**: Multi-stage Docker builds ensuring lean production images.
4. **Database Migration Checks**: Dry-run Prisma migrations against disposable database instances.

Coupled with [[Docker Containerization in Production]] and [[Release Checklist 2026]].

#devops #cicd #automation`,
  },
  {
    title: 'Docker Containerization in Production',
    content: `# Docker Containerization in Production

Containerization guarantees identical execution environments across local development and cloud production.

### Best Practices:
- **Multi-Stage Builds**: Separate build-time dependencies from lean production runtime containers.
- **Non-Root Execution**: Run app under unprivileged user (\`USER node\`) to minimize attack surface.
- **Healthchecks**: Integrated \`wget -qO- /health\` probes to enable automatic restart on unresponsiveness.
- **Bind-Mounts in Dev**: Utilize Docker compose volumes for hot-reloading.

Used across our stack in [[BrainSync Project Overview]] and [[CI/CD Pipelines & DevOps Automation]].

#docker #devops #containers`,
  },
  {
    title: 'Testing Strategies',
    content: `# Testing Strategies in Modern TypeScript

A robust testing pyramid ensures rapid feedback without brittle assertions:

### Pyramid Breakdown:
1. **Unit Tests (Vitest)**: Test pure domain regex parsers, math, and snippet algorithms.
2. **Integration Tests**: Test repositories against PostgreSQL test containers.
3. **E2E Smoke Tests**: Verify end-to-end user workflows and HTTP endpoints.

\`\`\`typescript
import { describe, expect, it } from 'vitest';
import { extractWikiLinks } from './link-parser.service';

describe('extractWikiLinks', () => {
  it('extracts unique titles', () => {
    expect(extractWikiLinks('[[A]] and [[B]]')).toEqual(['A', 'B']);
  });
});
\`\`\`

Fundamental part of [[Clean Architecture Principles]] and validated in [[CI/CD Pipelines & DevOps Automation]].

#testing #quality #software-engineering`,
  },
  {
    title: 'Zettelkasten Method Explained',
    content: `# Zettelkasten Method Explained

Invented by sociologist **Niklas Luhmann**, who published 70+ books and 400+ scholarly articles using this system.

### The Three Note Types:
1. **Fleeting Notes**: Quick temporary thoughts, captured effortlessly and processed within 24 hours.
2. **Literature Notes**: Notes on books, articles, or papers, written in your own words with citations.
3. **Permanent Notes**: Self-contained, atomic ideas added to the slip-box and linked associatively.

### Core Philosophy:
Notes do not belong in rigid folders; they gain value through connections.

Read more in [[Atomic Notes Guide]], [[Building a Second Brain]], [[Evergreen Notes Concept]], and see how [[BrainSync Project Overview]] embodies this approach.

#pkm #productivity #learning`,
  },
  {
    title: 'Atomic Notes Guide',
    content: `# Atomic Notes Guide

An **atomic note** contains one single discrete idea or concept.

### Guiding Principles:
- **Singularity**: Only discuss one concept per note.
- **Autonomy**: The note makes sense on its own without requiring you to read surrounding notes.
- **Connectivity**: Link densely to related concepts using \`[[Wiki-Links]]\`.

Complements the [[Zettelkasten Method Explained]] and [[Evergreen Notes Concept]].

#pkm #productivity`,
  },
  {
    title: 'Building a Second Brain',
    isPinned: true,
    content: `# Building a Second Brain (BASB)

Based on the methodology created by **Tiago Forte**.

### The PARA Framework:
- **Projects**: Short-term efforts you are actively working on with a specific deadline.
- **Areas**: Long-term responsibilities to maintain over time (e.g., Health, Finances).
- **Resources**: Topics or interests of ongoing value.
- **Archives**: Inactive items from the previous three categories.

### The CODE Workflow:
1. **Capture**: Keep what resonates.
2. **Organize**: Save for actionability.
3. **Distill**: Find the essence with progressive summarization.
4. **Express**: Show your work and create new knowledge.

Synergizes with [[Zettelkasten Method Explained]], [[Progressive Summarization]], and integrates into the [[Weekly Review Routine]].

#books #productivity #learning`,
  },
  {
    title: 'Evergreen Notes Concept',
    content: `# Evergreen Notes Concept

Popularized by **Andy Matuschak**, Evergreen notes are written and structured to gradually accumulate and evolve over time:

### Core Properties:
1. **Atomic**: Focus on a single conceptual unit (see [[Atomic Notes Guide]]).
2. **Concept-Oriented**: Titled by concepts rather than authors or source titles.
3. **Densely Linked**: Connected to both predecessor ideas and prospective applications.
4. **Continual Refinement**: Revised as your understanding deepens over months and years.

Navigated seamlessly using [[Maps of Content (MOC)]] and rooted in the [[Zettelkasten Method Explained]].

#pkm #writing #thinking`,
  },
  {
    title: 'Maps of Content (MOC)',
    content: `# Maps of Content (MOC)

A Map of Content (MOC) is a navigational hub or index note that aggregates links to related notes within a specific theme or domain.

### Why Use MOCs?
- Prevent feeling lost in a flat graph with hundreds of notes.
- Provide curated entry points into complex subjects.
- Fluid and non-destructive: a single note can belong to multiple MOCs simultaneously.

### Key Hubs in this Vault:
- **Software Architecture**: [[Clean Architecture Principles]], [[Domain-Driven Design]], [[Event-Driven Architecture]]
- **Database Systems**: [[PostgreSQL Optimization]], [[Database Indexing Strategies]], [[Full-Text Search vs pg_trgm]]
- **Knowledge Systems**: [[Zettelkasten Method Explained]], [[Building a Second Brain]], [[Evergreen Notes Concept]]

Connected directly with [[BrainSync Project Overview]].

#pkm #navigation #index`,
  },
  {
    title: 'Progressive Summarization',
    content: `# Progressive Summarization

A multi-layered technique for distilling notes without losing original context:

### The Five Layers:
- **Layer 1**: Raw notes or original excerpt capture.
- **Layer 2**: Bold passages that stand out upon first review.
- **Layer 3**: Highlight key phrases among bolded segments.
- **Layer 4**: Executive summary written in your own words at the top of the note.
- **Layer 5**: Remix into an external creative output or essay.

Practiced within [[Building a Second Brain]] and [[Atomic Notes Guide]].

#pkm #productivity #reading`,
  },
  {
    title: 'Spaced Repetition & Active Recall',
    content: `# Spaced Repetition & Active Recall

Evidence-based learning techniques backed by cognitive neuroscience:

### 1. Active Recall:
Testing yourself forces cognitive retrieval, strengthening neural synaptic pathways far more effectively than passive re-reading.

### 2. Spaced Repetition:
Reviewing material at exponentially increasing intervals combats the **Ebbinghaus Forgetting Curve**.

### Integration with Note-Taking:
Transform permanent notes into retrieval cues. Complements [[The Feynman Technique]] and [[Zettelkasten Method Explained]].

#learning #neuroscience #productivity`,
  },
  {
    title: 'The Feynman Technique',
    content: `# The Feynman Technique

A mental model for mastering complex topics developed by Nobel laureate **Richard Feynman**:

### The 4 Steps:
1. **Choose a Concept**: Pick the topic you want to understand deeply.
2. **Teach it to a Child**: Explain it in plain, simple words without technical jargon.
3. **Identify Knowledge Gaps**: Pinpoint where you stumble or rely on buzzwords, and return to source material.
4. **Simplify & Create Analogies**: Refine the explanation until it is crystal clear.

Closely related to [[Atomic Notes Guide]], [[Evergreen Notes Concept]], and [[Spaced Repetition & Active Recall]].

#learning #mental-models #feynman`,
  },
  {
    title: 'Weekly Review Routine',
    isPinned: true,
    content: `# Weekly Review Routine

A consistent weekly review keeps your knowledge base tidy and prevents cognitive overwhelm:

### Weekly Checklist:
- [x] Clear browser inbox and temporary bookmarks.
- [ ] Process all fleeting notes into atomic permanent notes.
- [ ] Check unresolved ghost links in newly written notes.
- [ ] Verify tag health and prune redundant tags.
- [ ] Review recent backlinks to discover serendipitous connections.
- [ ] Plan priorities for the upcoming week in [[Sprint Planning & Backlog Grooming]].

Inspired by [[Building a Second Brain]] and GTD (Getting Things Done).

#productivity #habits #routine`,
  },
  {
    title: 'Sprint Planning & Backlog Grooming',
    content: `# Sprint Planning & Backlog Grooming

Sprint tasks and operational backlog for BrainSync engineering:

### Current Sprint Deliverables:
- [x] Fix theme hydration flash and dark mode mismatch.
- [x] Implement Global Task Dashboard (/tasks) with metrics.
- [x] Add Pinned Notes feature in sidebar and editor.
- [ ] Implement multi-file drag and drop vault import.
- [ ] Add bidirectional link preview hover popovers.
- [ ] Optimize GIN trigram query execution under high concurrency.

Connected to [[Release Checklist 2026]] and tracked against [[BrainSync Project Overview]].

#project #sprint #engineering`,
  },
  {
    title: 'Release Checklist 2026',
    isPinned: true,
    content: `# Release Checklist 2026

Pre-flight checklist before tagging production releases:

### Quality & Performance Gates:
- [x] Run full test suite across backend and frontend (100% passing).
- [x] Verify zero TypeScript errors (\`tsc --noEmit\`).
- [x] Audit ESLint 9 rules without warnings.
- [x] Verify Docker container dev and production build targets.
- [ ] Validate PKZIP archive export and import cycle with roundtrip tests.
- [ ] Test mobile drawer accessibility and touch tap targets.
- [ ] Inspect PostgreSQL connection pooling under synthetic traffic.

Reference [[BrainSync Project Overview]] and [[CI/CD Pipelines & DevOps Automation]].

#release #quality #checklist`,
  },
  {
    title: 'Future Roadmap',
    content: `# Future Roadmap for BrainSync

Exciting ideas and architectural milestones slated for future development:

### Short-Term (Q4 2026):
- [ ] PDF and audio attachment embedding.
- [ ] Canvas / Infinite whiteboard view for spatial thought mapping.
- [ ] Interactive 3D force-directed graph with physics controls.

### Long-Term (2027):
- [ ] End-to-end encrypted (E2EE) P2P peer synchronization using WebRTC.
- [ ] Local-first AI copilot with Ollama / WebGPU on-device embeddings.
- [ ] Semantic search via vector embeddings alongside [[Full-Text Search vs pg_trgm]].

Tracked in [[BrainSync Project Overview]] and [[Sprint Planning & Backlog Grooming]].

#roadmap #future #vision`,
  },
  {
    title: 'Book Notes: Designing Data-Intensive Applications',
    content: `# Book Notes: Designing Data-Intensive Applications

Author: **Martin Kleppmann**

Key takeaways on building reliable, scalable, and maintainable data systems:

### Core Lessons:
1. **Reliability**: Faults vs failures. Hardware faults are inevitable; software must tolerate them gracefully.
2. **Scalability**: Describing load through percentiles (p95, p99, p99.9) rather than misleading averages.
3. **Data Models**: Relational vs Document vs Graph. Use the model that matches your domain's relationship density.
4. **Storage Engines**: Log-Structured Merge-Trees (LSM-trees) vs B-Trees.
5. **Replication**: Single-leader vs Multi-leader vs Leaderless replication.

Directly informs our decisions in [[Distributed Systems & CAP Theorem]], [[PostgreSQL Optimization]], and [[Database Indexing Strategies]].

#books #database #architecture`,
  },
  {
    title: 'Book Notes: Atomic Habits',
    content: `# Book Notes: Atomic Habits

Author: **James Clear**

An operating manual for personal change and daily consistency:

### The 4 Laws of Behavior Change:
1. **Make it Obvious**: Visual cues in your environment (e.g. keeping your PKM open in a dedicated browser tab).
2. **Make it Attractive**: Pair what you want to do with what you need to do (temptation bundling).
3. **Make it Easy**: Reduce friction; 2-minute rule to start without cognitive resistance.
4. **Make it Satisfying**: Immediate reinforcement and visual tracking (like checking off items in [[Weekly Review Routine]]).

Complements [[Building a Second Brain]] and the [[Zettelkasten Method Explained]].

#books #habits #productivity`,
  },
  {
    title: 'Artificial Intelligence & LLMs in PKM',
    isPinned: true,
    content: `# Artificial Intelligence & LLMs in Personal Knowledge Management

The integration of Large Language Models (LLMs) into PKM tools transforms passive digital notebooks into active synthesis and reasoning engines.

### Key Applications:
- **Automatic Conceptual Linking**: Suggesting \`[[WikiLinks]]\` between ideas you wrote months apart.
- **Contextual Synthesis**: Synthesizing answers strictly grounded in your private vault via [[Retrieval-Augmented Generation (RAG)]].
- **Vector Association**: Finding related thoughts via [[Vector Embeddings & Semantic Search]] rather than exact keyword matches.

### Architectural Challenges:
- [x] Maintain zero telemetry for private user notes.
- [ ] Implement on-device tokenization with WebAssembly.
- [ ] Evaluate streaming completions vs background indexing.

Connects to [[BrainSync Project Overview]], [[Building a Second Brain]], and [[Local-First Software Architecture]].

#ai #llm #pkm #future`,
    manualTags: ['ai', 'pkm'],
  },
  {
    title: 'Vector Embeddings & Semantic Search',
    content: `# Vector Embeddings & Semantic Search

Vector embeddings convert unstructured text into high-dimensional numerical vectors where geometric distance corresponds to semantic similarity.

### Distance Metrics:
- **Cosine Similarity**: Measures angular orientation; invariant to vector magnitude.
- **Dot Product**: Combines angle and magnitude; efficient for normalized vectors.
- **Euclidean (L2) Distance**: Straight-line distance in Euclidean space.

### Hybrid Retrieval in Databases:
Modern knowledge engines combine BM25 / trigram index ([[Full-Text Search vs pg_trgm]]) with vector search (pgvector in [[PostgreSQL Optimization]]) for hybrid retrieval.

Related:
- Powering [[Retrieval-Augmented Generation (RAG)]].
- Explored in [[Artificial Intelligence & LLMs in PKM]].
- Connects with [[Graph Database vs Relational Models]].

#ai #vectors #search #database`,
  },
  {
    title: 'Retrieval-Augmented Generation (RAG)',
    content: `# Retrieval-Augmented Generation (RAG)

RAG grounds LLM generation on authoritative external documents retrieved at query time, drastically mitigating hallucinations.

### The Pipeline:
1. **Ingest & Chunk**: Split markdown notes into semantic passages (see [[Markdown AST Parsing with Unified & Remark]]).
2. **Embedding**: Index passages in a vector store via [[Vector Embeddings & Semantic Search]].
3. **Retrieval**: Retrieve top-k nearest neighbor passages upon user prompt.
4. **Augmented Prompt**: Supply retrieved chunks as grounded context to the model.

### Key Milestones:
- [x] Experiment with chunk size strategies (512 vs 1024 tokens).
- [ ] Implement hybrid ranking with reciprocal rank fusion (RRF).
- [ ] Measure retrieval latency against [[Web Performance Metrics]].

Complements [[Artificial Intelligence & LLMs in PKM]] and [[BrainSync Project Overview]].

#ai #rag #llm #architecture`,
  },
  {
    title: 'Knowledge Graph Theory & Network Science',
    isPinned: true,
    content: `# Knowledge Graph Theory & Network Science

Knowledge graphs model entities as vertices (nodes) and their relationships as directed edges, capturing associative reasoning.

### Network Properties in PKM:
- **Degree Centrality**: Number of direct links. High degree nodes are thematic hubs (e.g. [[Building a Second Brain]]).
- **Betweenness Centrality**: Measures how often a node falls along shortest paths between others (e.g. [[Clean Architecture Principles]]).
- **Small-World Effect**: Most notes reachable in few hops via cross-domain bridges.

### 3D Visualization:
- Force-directed layout physics balancing Coulomb repulsion and Hooke spring attraction.
- Implemented in WebGL with [[WebGPU & 3D Graphics on the Modern Web]] and [[Three.js Scene Optimization & Billboards]].

Complements [[Zettelkasten Method Explained]] and [[Maps of Content (MOC)]].

#graphs #network-science #mathematics #pkm`,
    manualTags: ['graphs', 'network-science'],
  },
  {
    title: 'Graph Database vs Relational Models',
    content: `# Graph Database vs Relational Models

Comparing graph-native databases (Neo4j, Memgraph) against relational engines (PostgreSQL with recursive CTEs).

### Trade-off Matrix:
| Capability | Relational (PostgreSQL) | Native Graph (Neo4j) |
|---|---|---|
| ACID Guarantees | Unmatched, battle-tested | Good |
| Deep Graph Traversal (n > 4) | Costly JOINs / CTEs | Pointer chasing $O(1)$ |
| Operational Simplicity | Single engine for all data | Requires dual storage |

In BrainSync, we leverage PostgreSQL with indexed \`NoteLink\` tables:
- Detailed in [[PostgreSQL Optimization]] and [[Database Indexing Strategies]].
- Conceptual theory in [[Knowledge Graph Theory & Network Science]].
- Read more in [[Book Notes: Designing Data-Intensive Applications]].

#database #graphs #postgresql #architecture`,
  },
  {
    title: 'CRDTs & Real-Time Collaborative Editing',
    content: `# CRDTs (Conflict-free Replicated Data Types)

CRDTs are data structures that can be replicated across multiple computers without centralized coordination, guaranteeing eventual consistency.

### Types of CRDTs:
- **State-based (CvRDT)**: Replicas exchange their entire state and merge monotonically via a join semilattice.
- **Operation-based (CmRDT)**: Replicas stream discrete commutative mutations.
- **Sequence CRDTs (Yjs, Automerge)**: Enable real-time rich-text editing without operational transformation (OT) server bottlenecks.

### Action Items:
- [x] Research Yjs binary encoding protocol.
- [ ] Benchmark memory footprint for 10,000-character documents.
- [ ] Prototype synchronization over [[WebSockets vs Server-Sent Events (SSE)]].

Foundational for [[Local-First Software Architecture]] and future multi-device syncing in [[BrainSync Project Overview]].

#crdt #distributed-systems #collaboration`,
  },
  {
    title: 'Local-First Software Architecture',
    content: `# Local-First Software Architecture

> "You own your data, in contrast to the cloud where the vendor controls your files." - Ink & Switch

Seven ideals of local-first software:
1. No spinners: work has to be fast and offline-capable.
2. Multi-device sync is a background service.
3. Network optionality: full functionality without Wi-Fi.
4. Seamless collaboration via [[CRDTs & Real-Time Collaborative Editing]].
5. Longevity: notes remain accessible decades into the future (plain Markdown).
6. Security and user privacy by default.
7. Retain absolute user ownership of data.

Connects directly with [[Building a Second Brain]] and [[Obsidian & Roam Research Comparison]].

#local-first #architecture #privacy #software-design`,
  },
  {
    title: 'WebSockets vs Server-Sent Events (SSE)',
    content: `# WebSockets vs Server-Sent Events (SSE)

Choosing the optimal real-time transport protocol for web applications.

### Comparison:
- **Server-Sent Events (SSE)**:
  - Unidirectional: Server to client over standard HTTP/2.
  - Built-in reconnection and event ID resumption.
  - Perfect for LLM streaming responses in [[Artificial Intelligence & LLMs in PKM]].
- **WebSockets**:
  - Full-duplex bidirectional TCP socket.
  - Lower framing overhead for high-frequency messages.
  - Necessary for collaborative peer editing in [[CRDTs & Real-Time Collaborative Editing]].

Implemented using Fastify plugins in [[Fastify Performance Tuning]] and tested in [[Testing Strategies]].

#networking #websockets #realtime #backend`,
  },
  {
    title: 'Event Sourcing & CQRS Pattern',
    content: `# Event Sourcing & CQRS Pattern

Architectural pattern where state changes are stored as an immutable append-only sequence of domain events.

### Command Query Responsibility Segregation (CQRS):
- **Command Side**: Validates business invariants, emits domain events, optimized for writes.
- **Query Side**: Subscribes to events to project denormalized read-models, optimized for lightning queries.

### Integration with BrainSync:
- Fits nicely with [[Clean Architecture Principles]] and [[Domain-Driven Design]].
- Used in conjunction with [[Event-Driven Architecture]].
- Discussed in depth in [[Book Notes: Designing Data-Intensive Applications]].

#architecture #eventsourcing #cqrs #ddd`,
  },
  {
    title: 'Microservices Communication: REST vs gRPC',
    content: `# Microservices Communication: REST vs gRPC

Protocol selection for inter-service communication in distributed topologies.

### Architectural Evaluation:
- **REST + JSON**:
  - Universal client compatibility, human-readable payloads.
  - Higher serialization CPU overhead and larger bandwidth footprint.
- **gRPC + Protocol Buffers**:
  - Binary serialization, strongly-typed contracts (\`.proto\` schema).
  - HTTP/2 multiplexing, bidirectional streaming.
  - Up to 7x higher throughput in high-concurrency microservice meshes.

Related reading:
- Compare with [[API Design Best Practices]].
- Compare architectural scopes in [[Microservices vs Monolith]].
- Tuning Fastify endpoints in [[Fastify Performance Tuning]].

#microservices #grpc #rest #protocols`,
  },
  {
    title: 'OAuth 2.0, OpenID Connect & JWT Security',
    content: `# OAuth 2.0, OpenID Connect & JWT Security

Understanding identity federation, authorization grants, and cryptographically signed tokens.

### Key Concepts:
- **OAuth 2.0**: Authorization framework (Access Tokens with granular scopes).
- **OpenID Connect (OIDC)**: Identity layer on top of OAuth 2.0 (ID Tokens containing user claims).
- **JSON Web Tokens (JWT)**: Compact, URL-safe means of representing claims between two parties.

### Hardening Checklist:
- [x] Use asymmetric signatures (RS256 / EdDSA) over symmetric shared secrets.
- [x] Store tokens in \`httpOnly\`, \`secure\`, \`SameSite=Lax\` cookies to prevent XSS exfiltration.
- [ ] Implement short-lived access tokens (15m) paired with rotating refresh tokens.
- [ ] Ensure token revocation lists are cached in Redis ([[Caching Strategies & Redis]]).

Links to [[Zero Trust Security Architecture]] and [[Release Checklist 2026]].

#security #auth #jwt #web-development`,
  },
  {
    title: 'Zero Trust Security Architecture',
    content: `# Zero Trust Security Architecture

The core tenet: **"Never trust, always verify."**

### Fundamental Principles:
1. **Verify Explicitly**: Authenticate and authorize based on all available data points (identity, device health, location).
2. **Least Privilege Access**: Just-in-time and just-enough-access (JIT/JEA) access policies.
3. **Assume Breach**: Minimize blast radius by segmenting networks, encrypting end-to-end, and continuously auditing logs.

Connected with [[OAuth 2.0, OpenID Connect & JWT Security]] and [[Docker Containerization in Production]].

#security #architecture #devops`,
  },
  {
    title: 'Kubernetes Orchestration & Container Pods',
    content: `# Kubernetes Orchestration & Container Pods

Managing containerized workloads at enterprise scale.

### Key Workloads:
- **Pods**: Smallest deployable units in Kubernetes.
- **Deployments & ReplicaSets**: Declarative rolling updates and self-healing replicas.
- **Services & Ingress**: Stable internal DNS and external reverse proxy routing.
- **ConfigMaps & Secrets**: Externalized configuration decoupled from container images.

Complements our containerization approach in [[Docker Containerization in Production]] and automated deployment in [[CI/CD Pipelines & DevOps Automation]].

#kubernetes #devops #containers #cloud`,
  },
  {
    title: 'Modern Web Performance: Core Web Vitals',
    content: `# Modern Web Performance: Core Web Vitals

Essential user-centric performance metrics defined by Google:

### The Big Three:
1. **LCP (Largest Contentful Paint)**: Loading speed. Target $\\le 2.5s$.
2. **INP (Interaction to Next Paint)**: Responsiveness to user input. Target $\\le 200ms$.
3. **CLS (Cumulative Layout Shift)**: Visual stability. Target $\\le 0.1$.

### BrainSync Optimizations:
- [x] Zero hydration layout shifts in sidebar and theme toggle.
- [x] Debounced auto-save (1500ms) to keep main thread completely unblocked.
- [ ] Lazy-load heavy Three.js 3D canvas modules until tab is activated.

Related reading:
- [[Next.js App Router Insights]]
- [[Three.js Scene Optimization & Billboards]]
- [[Web Performance Metrics]]

#performance #frontend #webvitals #optimization`,
  },
  {
    title: 'WebGPU & 3D Graphics on the Modern Web',
    content: `# WebGPU & 3D Graphics on the Modern Web

WebGPU is the next-generation web graphics API replacing WebGL with lower CPU overhead and native compute shaders.

### WebGPU vs WebGL:
- **Explicit Resource Management**: Matches modern Vulkan, Metal, and DirectX 12 graphics pipelines.
- **Compute Shaders**: Unleashes GPU general-purpose compute for physics simulations and vector math.
- **Multi-threading Ready**: Command buffers can be encoded concurrently in Web Workers.

In BrainSync:
- Currently powered by WebGL 2.0 via [[Three.js Scene Optimization & Billboards]].
- Future WebGPU migration path explored in [[Future Roadmap]].
- Supports graph physics in [[Knowledge Graph Theory & Network Science]].

#graphics #webgpu #threejs #webgl #performance`,
  },
  {
    title: 'Three.js Scene Optimization & Billboards',
    isPinned: true,
    content: `# Three.js Scene Optimization & Billboards

Techniques for rendering interactive 3D knowledge graphs at 60 FPS on modest hardware:

### Techniques Implemented:
1. **Billboard Text Sprites (\`THREE.Sprite\`)**:
   - High-DPI canvas textures rendered offscreen.
   - Automatically face camera from any orbital vantage point.
   - Depth-test tuning to eliminate z-fighting with connection geometry.
2. **BufferGeometry Sharing**:
   - Single shared line buffer for all 100+ synapse connections.
   - Cached sphere geometry instances by radius bucket.
3. **Physics Cooling (Alpha Decay)**:
   - Force-directed simulation terminates when max velocity drops below $0.04$, freezing CPU usage.

Connects directly with [[WebGPU & 3D Graphics on the Modern Web]], [[Knowledge Graph Theory & Network Science]], and [[BrainSync Project Overview]].

#threejs #3d #graphics #performance #frontend`,
    manualTags: ['threejs', 'frontend', 'graphics'],
  },
  {
    title: 'Design Systems & Semantic Design Tokens',
    content: `# Design Systems & Semantic Design Tokens

Design tokens are the visual design atoms of a design system — values for color, spacing, typography, and elevation stored in a platform-agnostic format.

### Token Hierarchy:
- **Global Tokens**: Raw values (\`slate-900\`, \`blue-600\`).
- **Semantic Tokens**: Meaning-based (\`surface-primary\`, \`border-interactive\`, \`text-muted\`).
- **Component Tokens**: Scoped to specific widgets (\`button-primary-bg\`).

Adopted seamlessly with Tailwind CSS in [[Tailwind CSS v4 Migration]] and verified for accessibility in [[Web Accessibility (WCAG 2.2 & a11y)]].

#design-systems #tokens #ui #css`,
  },
  {
    title: 'Web Accessibility (WCAG 2.2 & a11y)',
    content: `# Web Accessibility (WCAG 2.2 & a11y)

Building digital tools that are accessible to everyone regardless of ability.

### Core Principles (POUR):
1. **Perceivable**: Text alternatives for non-text content, minimum 4.5:1 contrast ratios.
2. **Operable**: Full keyboard navigability (Omnibar \`Cmd+K\`, skip-to-content links).
3. **Understandable**: Predictable UI patterns, clear error messages.
4. **Robust**: Compatible with assistive technology and screen readers.

### Audit Checklist:
- [x] All buttons have discernible \`aria-label\` or visible text.
- [x] Focus rings clearly visible on all interactive controls.
- [ ] Screen reader testing with NVDA / VoiceOver.

Linked to [[Design Systems & Semantic Design Tokens]] and [[Release Checklist 2026]].

#accessibility #a11y #wcag #frontend`,
  },
  {
    title: 'Cognitive Load Theory in Knowledge Work',
    content: `# Cognitive Load Theory in Knowledge Work

Understanding the human brain's working memory limitations to design distraction-free knowledge workspaces.

### Types of Cognitive Load:
- **Intrinsic Load**: Difficulty inherent to the subject material being studied.
- **Germane Load**: Mental processing directed at building mental schemas and long-term retention.
- **Extraneous Load**: Mental waste caused by cluttered interfaces, noisy popups, and confusing navigation.

PKM Goal:
Eliminate extraneous load so working memory can focus 100% on germane synthesis.

Read more:
- [[Building a Second Brain]]
- [[Zettelkasten Method Explained]]
- [[Time Blocking, Pomodoro & Deep Work Habits]]

#psychology #learning #cognition #productivity`,
  },
  {
    title: 'Time Blocking, Pomodoro & Deep Work Habits',
    content: `# Time Blocking, Pomodoro & Deep Work Habits

Strategies to protect mental bandwidth from the chaos of modern notification-driven work environments:

### Core Protocols:
1. **Time-Boxing**: Pre-allocating finite calendar blocks to single high-leverage tasks.
2. **Pomodoro Cycles**: 25 minutes of intense, single-task immersion followed by 5 minutes of cognitive rest.
3. **Shutdown Ritual**: Formal mental boundary between workday and personal evening.

### Daily Checklist:
- [x] Morning priority alignment (top 3 outcomes).
- [ ] Conduct 2 x 90-minute deep work blocks without email/chat.
- [ ] Perform evening shutdown and clear browser tabs.

Related:
- [[Book Notes: Deep Work by Cal Newport]]
- [[Book Notes: Atomic Habits]]
- [[Weekly Review Routine]]

#habits #productivity #focus #deepwork`,
  },
  {
    title: 'Spaced Repetition with SuperMemo & Anki',
    content: `# Spaced Repetition with SuperMemo & Anki

Overcoming Ebbinghaus's Forgetting Curve through mathematically timed retrieval intervals.

### The Algorithm:
Intervals between reviews expand exponentially as recall is repeatedly reinforced:
1. 1 day
2. 3 days
3. 7 days
4. 16 days
5. 35 days

### Synthesis with PKM:
Notes created in [[Zettelkasten Method Explained]] and summarized in [[Progressive Summarization]] can be surfaced at spaced intervals for lifelong retention.

Complemented by [[Spaced Repetition & Active Recall]].

#learning #spaced-repetition #memory #habits`,
  },
  {
    title: 'Obsidian & Roam Research Comparison',
    content: `# Obsidian & Roam Research Comparison

Analyzing the two pioneer platforms that reignited the modern PKM revolution.

### Architectural Breakdown:
- **Obsidian**:
  - Local-first plain Markdown files in your local filesystem.
  - Phenomenal plugin ecosystem, zero lock-in, complete privacy.
  - Inspires BrainSync's local Markdown vault paradigm.
- **Roam Research**:
  - Outliner-first block-level graph database in the cloud.
  - Pioneered bi-directional \`[[WikiLinks]]\` and unlinked mentions.

Directly influences the vision of [[BrainSync Project Overview]] and [[Local-First Software Architecture]].

#pkm #obsidian #roam #tools`,
  },
  {
    title: 'Markdown AST Parsing with Unified & Remark',
    content: `# Markdown AST Parsing with Unified & Remark

How BrainSync transforms raw markdown text into enriched HTML with dynamic wiki-links and task checklists.

### Processing Pipeline:
\`\`\`
Raw Markdown
    │
    ▼ (remark-parse)
mdast (Markdown Abstract Syntax Tree)
    │
    ▼ (remark-gfm, custom [[WikiLink]] transformer)
Enriched mdast
    │
    ▼ (remark-rehype)
hast (HTML Abstract Syntax Tree)
    │
    ▼ (rehype-highlight, rehype-stringify)
Sanitized HTML
\`\`\`

Connects to [[BrainSync Project Overview]], [[Retrieval-Augmented Generation (RAG)]], and [[Next.js App Router Insights]].

#markdown #ast #compiler #frontend`,
  },
  {
    title: 'Book Notes: Pragmatic Programmer',
    content: `# Book Notes: The Pragmatic Programmer

Authors: **David Thomas & Andrew Hunt**

Timeless philosophy for software craftsmanship:

### Essential Maxims:
1. **Care About Your Craft**: Why spend your life developing software unless you care about doing it well?
2. **DRY (Don't Repeat Yourself)**: Every piece of knowledge must have a single, unambiguous, authoritative representation.
3. **Orthogonality**: Eliminate effects between unrelated things. A change in a database schema should not ripple into UI rendering.
4. **Prototypes and Post-it Notes**: Code to learn; throw away exploratory throwaway experiments.

Directly embodied in our [[Clean Architecture Principles]] and [[Testing Strategies]].

#books #software-engineering #craftsmanship #best-practices`,
  },
  {
    title: 'Book Notes: Deep Work by Cal Newport',
    content: `# Book Notes: Deep Work

Author: **Cal Newport**

> "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time."

### The 4 Rules of Deep Work:
1. **Work Deeply**: Choose your depth philosophy (Monastic, Bimodal, Rhythmic, or Journalistic).
2. **Embrace Boredom**: Constant novel stimuli weakens your brain's capacity for deep concentration.
3. **Quit Social Media**: Treat network tools with the craftsman approach.
4. **Drain the Shallows**: Relentlessly cap shallow administrative work.

Pairs with [[Time Blocking, Pomodoro & Deep Work Habits]] and [[Cognitive Load Theory in Knowledge Work]].

#books #deepwork #productivity #focus`,
  },
];

async function seed(): Promise<void> {
  console.log('🌱 Starting BrainSync database seed...');

  // 1. Clean existing notes and links
  console.log('🧹 Cleaning existing data...');
  await prisma.noteLink.deleteMany();
  await prisma.noteTag.deleteMany();
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();

  // 2. Initialize repositories and use case
  const noteRepo = new PrismaNoteRepository();
  const tagRepo = new PrismaTagRepository();
  const saveNoteUseCase = new SaveNoteUseCase(noteRepo, tagRepo);

  // 3. Save notes sequentially
  console.log(`📝 Inserting ${DUMMY_NOTES.length} interconnected PKM notes...`);
  for (const item of DUMMY_NOTES) {
    const result = await saveNoteUseCase.execute({
      title: item.title,
      content: item.content,
      manualTags: item.manualTags,
    });

    if (item.isPinned) {
      await noteRepo.togglePin(result.id, true);
    }

    console.log(
      `  ✓ Saved "${result.title}" (pinned: ${item.isPinned ? '📌 yes' : 'no'}, tags: ${result.tags.join(', ') || 'none'})`,
    );
  }

  // 4. Summarize database contents
  const noteCount = await prisma.note.count();
  const tagCount = await prisma.tag.count();
  const linkCount = await prisma.noteLink.count();
  const pinnedCount = await prisma.note.count({ where: { isPinned: true } });

  console.log('\n✅ Seeding completed successfully!');
  console.log(`📊 Total Notes:  ${noteCount}`);
  console.log(`📌 Pinned Notes: ${pinnedCount}`);
  console.log(`🏷️  Total Tags:   ${tagCount}`);
  console.log(`🔗 Total Links:  ${linkCount}`);
}

seed()
  .catch((err) => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
