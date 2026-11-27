# Portfolio Project Data — BrainSync - Personal Knowledge Management

- **Category:** `web-development` (`Web Development`)
- **Accent Color:** `cyan`
- **Target Assets Folder:** `public/images/projects/brainsync_personal_knowledge_management/`
- **Required Local Images:** `banner.webp`, `image01.webp` .. `image04.webp`

## TypeScript Data (`ProjectCaseStudy`)

```typescript
{
  "id": "brainsync-personal-knowledge-management",
  "code": "PRO-59 // WEB-11",
  "title": "BrainSync - Personal Knowledge Management",
  "category": "web-development",
  "categoryLabel": "Website",
  "year": "2025",
  "status": "Completed",
  "accentColor": "cyan",
  "repoUrl": "https://github.com/weztcy/BrainSync-Personal-Knowledge-Management",
  "license": "MIT License",
  "banner": "/images/projects/brainsync_personal_knowledge_management/banner.webp",
  "summary": "Full-stack Personal Knowledge Management app with bi-directional wiki links, 3D/2D knowledge graphs, fuzzy search, and Markdown task tracking.",
  "projectDescription": "BrainSync is a full-stack Personal Knowledge Management platform built with Next.js, Fastify, and PostgreSQL. It combines distraction-free Markdown editing, bi-directional wiki linking, trigram fuzzy search, GTD task aggregation, and interactive 2D/3D knowledge graphs.",
  "architectureSummary": "Next.js RSC & Server Actions -> Fastify REST API -> Clean Architecture Use Cases -> Prisma ORM & PostgreSQL",
  "techStack": [
    "TypeScript",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Three.js",
    "Fastify",
    "Prisma",
    "PostgreSQL",
    "Zod",
    "Vitest",
    "Docker"
  ],
  "telemetryMatrix": {
    "projectType": "Full-Stack Knowledge Management Platform",
    "targetPlatform": "Modern Web Browsers & Docker",
    "primaryDomain": "Personal Knowledge Management",
    "architecturePipeline": "Next.js RSC -> Fastify API -> PostgreSQL",
    "testingAndAudit": "Passed",
    "projectStatus": "Completed",
    "projectYear": "2025"
  },
  "projectInfo": {
    "projectType": "Full-Stack Web Application",
    "developmentStatus": "Completed",
    "developmentYear": "2025",
    "platform": "Web Browser & Docker",
    "projectCategory": "Web Development"
  },
  "projectBackground": "Knowledge workers often struggle with fragmented notes trapped inside rigid folder hierarchies that obscure conceptual relationships. BrainSync was engineered as a local-first, relational second brain that turns plain Markdown notes into an interconnected graph with instant recall and portable archives.",
  "problemStatements": [
    {
      "title": "Fragmented Relational Note Context",
      "description": "Traditional hierarchical folders isolate related ideas and fail to surface incoming references or contextual backlinks across notes.",
      "issueCode": "ISSUE_01"
    },
    {
      "title": "Stale Links & Tag Desynchronization",
      "description": "Renaming notes or editing inline hashtags frequently breaks graph edges or overwrites manually curated metadata tags.",
      "issueCode": "ISSUE_02"
    },
    {
      "title": "Slow Search & Scattered Action Items",
      "description": "Basic substring queries break on minor typos, while Markdown task checklists buried inside individual notes are hard to track globally.",
      "issueCode": "ISSUE_03"
    }
  ],
  "projectObjectives": [
    {
      "title": "Automated Bi-Directional Graph Sync",
      "description": "Parse [[Wiki-Links]] and sync both outgoing links and incoming backlinks atomically on every note creation, update, or rename.",
      "targetTag": "TARGET_01"
    },
    {
      "title": "Sub-Second Trigram Fuzzy Search",
      "description": "Deliver typo-tolerant global search across note titles, tags, and content snippets via PostgreSQL pg_trgm GIN indexes.",
      "targetTag": "TARGET_02"
    },
    {
      "title": "Interactive 3D/2D Graph & Task Hub",
      "description": "Render live knowledge topologies in Three.js 3D and HTML5 2D canvases alongside a vault-wide GTD task dashboard and ZIP portability.",
      "targetTag": "TARGET_03"
    }
  ],
  "coreFeatures": [
    {
      "title": "Split-Pane Markdown Editor & Live Preview",
      "description": "Provides Edit, Split, and Preview modes with formatting toolbar helpers, 1500ms debounced auto-save, [[ autocomplete, and XSS-sanitized GFM rendering.",
      "badge": "Authoring"
    },
    {
      "title": "Bi-Directional Wiki-Links & Ghost Notes",
      "description": "Resolves [[Title]] links case-insensitively while ignoring code blocks, renders dashed ghost links to create missing notes, and extracts sentence backlink snippets.",
      "badge": "Knowledge Graph"
    },
    {
      "title": "3D Galaxy & 2D Flat Graph Views",
      "description": "Visualizes note clusters using Three.js spheres, high-DPI billboard sprites, and physics cooling in 3D or draggable nodes on an interactive 2D canvas.",
      "badge": "Visualization"
    },
    {
      "title": "Cmd/Ctrl+K Fuzzy Search Omnibar",
      "description": "Keyboard-navigable command palette querying PostgreSQL trigram similarity scores weighted across note titles, hashtags, and body snippets.",
      "badge": "Search"
    },
    {
      "title": "Vault-Wide GTD Task Dashboard",
      "description": "Aggregates Markdown checkboxes across all notes with completion statistics, status tabs, grouped/list layouts, and two-way line-level toggling.",
      "badge": "Productivity"
    },
    {
      "title": "Dual Tagging, Daily Notes & ZIP Portability",
      "description": "Separates INLINE hashtags from MANUAL panel tags, supports Ctrl/Cmd+J daily notes and pinning, and imports/exports full vaults as .md or .zip files.",
      "badge": "Portability"
    }
  ],
  "interfaceShowcase": [
    {
      "imageUrl": "/images/projects/brainsync_personal_knowledge_management/image01.webp"
    },
    {
      "imageUrl": "/images/projects/brainsync_personal_knowledge_management/image02.webp"
    },
    {
      "imageUrl": "/images/projects/brainsync_personal_knowledge_management/image03.webp"
    },
    {
      "imageUrl": "/images/projects/brainsync_personal_knowledge_management/image04.webp"
    }
  ],
  "userFlow": {
    "summary": "Users capture notes in the Markdown editor or Daily Note shortcut, connect concepts with [[Wiki-Links]] and #hashtags, explore relationships via backlinks, 3D/2D graph views, or Cmd+K fuzzy search, and manage checklists or portable ZIP backups across their entire vault.",
    "steps": [
      {
        "step": "01",
        "title": "Capture & Author Markdown",
        "description": "User creates a note or opens Daily Note (Ctrl/Cmd+J) and writes Markdown with [[Wiki-Links]], #hashtags, and - [ ] task checkboxes.",
        "actorOrNode": "MarkdownEditor"
      },
      {
        "step": "02",
        "title": "Debounced Save & Link Sync",
        "description": "After 1500ms idle, a Server Action forwards the payload to Fastify, which atomically persists the note, graph edges, and tags in PostgreSQL.",
        "actorOrNode": "SaveNoteUseCase"
      },
      {
        "step": "03",
        "title": "Explore Graph & Backlinks",
        "description": "User inspects contextual incoming snippets in the Backlinks Pane or explores connected clusters in 3D Galaxy and 2D Flat graph views.",
        "actorOrNode": "GraphCanvas3D & BacklinksPane"
      },
      {
        "step": "04",
        "title": "Retrieve, Execute & Export",
        "description": "User locates notes via Cmd+K trigram search, toggles checkboxes in the GTD Task Dashboard, or exports the entire vault as a ZIP archive.",
        "actorOrNode": "Omnibar & TaskDashboard"
      }
    ]
  },
  "systemArchitecture": {
    "summary": "Decoupled two-tier TypeScript architecture pairing a Next.js App Router frontend with a Clean Architecture Fastify API server. Server Actions proxy all data operations to Fastify use cases, domain parsers, and Prisma repositories backed by PostgreSQL.",
    "layers": [
      {
        "name": "Presentation & BFF Proxy Layer",
        "role": "Renders React Server Components, interactive client views, and proxies mutations via Server Actions without exposing the backend port.",
        "components": ["Next.js App Router", "MarkdownEditor", "GraphCanvas3D", "Omnibar", "TaskDashboard"]
      },
      {
        "name": "HTTP Transport & DI Layer",
        "role": "Validates incoming requests with Zod schemas and wires repositories to use cases via an explicit composition root.",
        "components": ["Fastify Server", "Zod Validators", "Composition Root", "Central Error Handler"]
      },
      {
        "name": "Core Domain & Use-Case Layer",
        "role": "Executes framework-agnostic business workflows and pure regex/binary services for links, tags, tasks, snippets, and ZIP archives.",
        "components": ["SaveNoteUseCase", "ImportVaultUseCase", "LinkParserService", "TaskParserService", "ZipBuilderService"]
      },
      {
        "name": "Persistence & Indexing Layer",
        "role": "Executes ACID transactions, case-insensitive title resolution, and trigram similarity queries against PostgreSQL.",
        "components": ["Prisma ORM", "PrismaNoteRepository", "PrismaSearchRepository", "PostgreSQL pg_trgm"]
      }
    ]
  },
  "databaseDataFlow": {
    "type": "Database Schema / ERD",
    "summary": "Relational PostgreSQL schema storing UUIDv7-keyed notes, normalized lowercase tags, dual-origin NoteTag assignments, and a NoteLink adjacency table with cascade deletes and GIN trigram indexes.",
    "entitiesOrPipelines": [
      {
        "name": "Note",
        "type": "Table",
        "fields": ["id (UUIDv7)", "title (unique lower index)", "content (Markdown)", "isPinned (Boolean)", "createdAt", "updatedAt"]
      },
      {
        "name": "Tag",
        "type": "Table",
        "fields": ["id (UUIDv7)", "name (lowercase check constraint, GIN trigram)"]
      },
      {
        "name": "NoteTag",
        "type": "Junction Table",
        "fields": ["noteId (FK Cascade)", "tagId (FK Cascade)", "source (MANUAL | INLINE)"]
      },
      {
        "name": "NoteLink",
        "type": "Graph Edge Table",
        "fields": ["sourceNoteId (FK Cascade)", "targetNoteId (FK Cascade)"]
      }
    ]
  },
  "technicalImplementation": [
    {
      "category": "Concurrency & Data Integrity",
      "title": "Transactional Graph & Dual-Origin Tag Synchronization",
      "description": "SaveNoteUseCase wraps note persistence and NoteLink edge replacement in a Prisma transaction, refreshes incoming backlinks on title renames to resolve ghost links, and separates INLINE hashtags from MANUAL tags via TagSource.",
      "badge": "ACID Sync"
    },
    {
      "category": "Search & Indexing",
      "title": "Weighted PostgreSQL pg_trgm Similarity Ranking",
      "description": "PrismaSearchRepository leverages GIN trigram indexes and raw SQL similarity() combined with ILIKE scoring to rank exact and fuzzy matches across note titles, tag names, and content snippets.",
      "badge": "Trigram Search"
    },
    {
      "category": "Graphics Performance",
      "title": "60 FPS Three.js Billboards & Physics Cooling",
      "description": "GraphCanvas3D renders high-DPI canvas text sprites, caches sphere geometries by radius bucket, shares a single line BufferGeometry for synapse edges, and halts simulation once velocity drops below threshold.",
      "badge": "WebGL Optimization"
    },
    {
      "category": "Security & Portability",
      "title": "XSS-Sanitized Markdown & Custom ZIP Serialization",
      "description": "MarkdownViewer passes remark-gfm output through rehype-sanitize and keeps backend API calls server-side via backendFetch, while custom ZipBuilderService and ZipReaderService power dependency-free vault export and import.",
      "badge": "Hardened I/O"
    }
  ],
  "primaryTechSpecs": {
    "programmingLanguage": "TypeScript",
    "framework": "Next.js & Fastify",
    "database": "PostgreSQL"
  },
  "architectureQuality": {
    "badges": [
      "Clean Architecture",
      "XSS Sanitized Markdown",
      "ACID Transactions",
      "Trigram Search Indexed"
    ]
  }
}
```
