# BrainSync - Personal Knowledge Management

![Project Banner](screenshots/banner.webp)

![Project Type](https://img.shields.io/badge/Project_Type-Full--Stack-blue)
![Primary Language](https://img.shields.io/badge/Primary_Language-TypeScript-blue)
![Framework](https://img.shields.io/badge/Framework-Next.js_%26_Fastify-orange)
![Runtime / Platform](https://img.shields.io/badge/Runtime_%2F_Platform-Node.js-green)
![Package Manager](https://img.shields.io/badge/Package_Manager-npm-red)
![Build Tool](https://img.shields.io/badge/Build_Tool-Next.js_%26_tsc-purple)
![Database](https://img.shields.io/badge/Database-PostgreSQL-informational)
![Project Status](https://img.shields.io/badge/Project_Status-Production--Ready-success)
![Project Year](https://img.shields.io/badge/Project_Year-2025-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Project Overview

BrainSync is a full-stack Personal Knowledge Management (PKM) platform designed to eliminate information fragmentation across notes, tasks, and interconnected ideas. Built on a decoupled Clean Architecture separating a Next.js App Router frontend from a Fastify REST backend and PostgreSQL database, it provides distraction-free Markdown authoring, bi-directional `[[Wiki-Links]]` with live backlink context snippets, trigram-indexed fuzzy search, unified GTD task aggregation, and interactive 2D/3D knowledge graph visualization. Users maintain complete portability over their knowledge vault through ZIP and Markdown import/export workflows.

## Key Features

- **Distraction-Free Markdown Editor & Live Preview**: Supports `Edit`, `Split`, and `Preview` modes with formatting toolbar helpers, syntax-highlighted code blocks, XSS-sanitized rendering (`rehype-sanitize` + `remark-gfm`), and 1500ms debounced auto-save.
- **Bi-Directional `[[Wiki-Links]]` & Backlinks Pane**: Automatically extracts `[[Title]]` references (ignoring code blocks), offers real-time `[[` autocomplete suggestions, renders clickable ghost links for uncreated notes, and displays contextual backlink snippets.
- **Interactive 3D & 2D Knowledge Graph**: Visualizes the entire note network in both a Three.js `3D Galaxy` view (high-DPI billboard text sprites, degree-scaled spheres, orbital camera, physics cooling) and an interactive HTML5 `2D Flat` force-directed canvas.
- **Typo-Tolerant Global Search (Omnibar)**: Accessible via `Ctrl+K` / `Cmd+K` with keyboard navigation, powered by PostgreSQL `pg_trgm` GIN indexes scoring title matches, `#tag` matches, and content snippets.
- **Dual-Source Tagging & Daily Notes**: Combines automatic `#hashtag` extraction (`INLINE`) with manual tag management (`MANUAL`), note pinning, tag archive pages, and one-click Daily Note creation (`Ctrl+J` / `Cmd+J`).
- **Vault-Wide GTD Task Dashboard**: Extracts Markdown checkboxes (`- [ ]`, `- [x]`) across all notes into a unified dashboard with completion metrics, status filters, grouped/list views, and instant two-way checkbox toggling.
- **Portable Vault Import & Export**: Imports individual `.md` files or `.zip` archives with optional overwrite handling and exports the entire knowledge vault as a clean `brainsync-vault-export.zip` archive.
- **Responsive Theme-Aware Workspace**: Features a collapsible sidebar, mobile drawer support, and persistent Dark/Light theme switching synchronized with system preferences.

## Tech Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| Frontend Framework | Next.js (App Router) | Server Components, Server Actions, routing, and API export proxy |
| UI Library | React & Tailwind CSS | Component rendering, typography styling, and dark/light theme UI |
| 3D Visualization | Three.js | Interactive 3D Galaxy force-directed knowledge graph with OrbitControls |
| Markdown Engine | react-markdown, remark-gfm, rehype-sanitize | GFM Markdown rendering with XSS sanitization and custom wiki-link nodes |
| Backend Framework | Fastify | High-performance REST API server and composition root |
| Validation | Zod | Request parameter, query, and payload schema validation |
| ORM & Database | Prisma ORM & PostgreSQL (`pg_trgm`) | Relational storage for notes, tags, links, and trigram fuzzy search |
| Language & Tooling | TypeScript & ESLint | End-to-end static typing across domain, use-case, API, and UI layers |
| Testing | Vitest | Unit and route integration tests with in-memory repositories |
| Containerization | Docker & Docker Compose | Multi-service orchestration for PostgreSQL, Fastify API, and Next.js |

## Application Architecture

BrainSync enforces a strict Clean Architecture in the backend alongside a server-proxied Next.js frontend. The browser communicates exclusively with Next.js Server Components, Server Actions, and Next.js Route Handlers (`backendFetch`), never calling the Fastify API directly. Inside the Fastify backend, HTTP route handlers validate payloads with Zod and delegate to dependency-injected Use Cases (`src/core/use-cases/`), which orchestrate pure TypeScript Domain Services (wiki-link, hashtag, task, snippet, and ZIP parsers) and Prisma repositories backed by PostgreSQL.

```mermaid
flowchart LR
    User["Browser Client (React UI, 3D/2D Graph, Omnibar)"] -->|"RSC / Server Actions / GET /api/export"| NextJS["Next.js App Router Frontend (:3000)"]
    NextJS -->|"Server-side HTTP (BACKEND_URL)"| Fastify["Fastify REST API (:4000)"]
    Fastify -->|"Zod Validation & Composition Root"| UseCases["Application Use Cases"]
    UseCases -->|"Pure Regex & Parsers"| Domain["Domain Entities & Services"]
    UseCases -->|"Repository Interfaces"| Infra["Prisma Repositories"]
    Infra -->|"ACID Transactions & pg_trgm SQL"| DB[("PostgreSQL 16 (:5434)")]
```

## Screenshots / Preview

### 1. 3D Galaxy Knowledge Graph View
![3D Galaxy Knowledge Graph View](screenshots/image1.webp)
Interactive Three.js `3D Galaxy` visualization displaying 58 note nodes and 163 synaptic links scaled by backlink degree. Users can orbit, pan, zoom, toggle high-DPI billboard labels, filter specific nodes via `Highlight node...`, or switch between `3D Galaxy` and `2D Flat` modes.

### 2. 2D Flat Force-Directed Graph View
![2D Flat Force-Directed Graph View](screenshots/image2.webp)
Interactive HTML5 Canvas `2D Flat` graph view showing the force-directed topology of interconnected notes. Users can drag nodes to rearrange clusters, scroll to zoom, toggle labels, and click any node to open the corresponding note directly.

### 3. Split-Pane Markdown Editor & Live Preview
![Split-Pane Markdown Editor and Live Preview](screenshots/image3.webp)
Workspace editor operating in `Split` mode with inline tag pills, formatting toolbar (`B`, `I`, `</>`, task list, `[[ ]]` wiki-link insertion), raw Markdown input, and synchronized XSS-sanitized `LIVE PREVIEW` rendering clickable resolved and ghost `[[Wiki-Links]]`.

### 4. GTD Task Dashboard
![GTD Task Dashboard](screenshots/image4.webp)
Aggregated task management dashboard parsing Markdown checklists (`- [ ]` / `- [x]`) across every note in the vault. Displays total, pending, and completed counters, overall completion progress, status filters, search, and grouped per-note cards with two-way checkbox synchronization.

## Prerequisites

- **Node.js**: v22.0.0 or higher (`engines.node >= 22`)
- **npm**: v10 or higher
- **PostgreSQL**: v16+ with the `pg_trgm` extension enabled (or **Docker** & **Docker Compose** for containerized setup)

## Installation & Setup

### Option A: Docker Compose (Recommended)

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone https://github.com/weztcy/BrainSync-Personal-Knowledge-Management.git
   cd "BrainSync - Personal Knowledge Management"
   ```
2. Create a local environment file from the example template:
   ```bash
   cp .env.example .env
   ```
3. Build and start PostgreSQL, the Fastify backend (which automatically applies Prisma migrations), and the Next.js frontend:
   ```bash
   docker compose up --build
   ```
4. Optionally seed the database with sample notes, links, and tasks inside the running backend container:
   ```bash
   docker compose exec backend npm run db:seed
   ```

### Option B: Local Development (Without Docker)

1. Install backend dependencies and configure database environment variables:
   ```bash
   cd backend
   npm install
   ```
   Set `DATABASE_URL` in your shell or `backend/.env` pointing to a running PostgreSQL instance (e.g., `postgresql://brainsync:brainsync@localhost:5434/brainsync?schema=public`).
2. Run Prisma migrations, generate the Prisma client, and seed sample data:
   ```bash
   npm run db:deploy
   npm run db:seed
   ```
3. Install frontend dependencies from the `frontend/` directory:
   ```bash
   cd ../frontend
   npm install
   ```

## Usage

After completing setup, start both services (if running locally without Docker) and access BrainSync in your browser at `http://localhost:3000`.

1. Start the Fastify backend API server in development mode:
   ```bash
   cd backend
   npm run dev
   ```
2. In a separate terminal, start the Next.js frontend server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Use keyboard shortcuts inside the workspace for rapid navigation:
   - `Ctrl+N` / `Cmd+N`: Create a new note.
   - `Ctrl+J` / `Cmd+J`: Open or create today's Daily Note.
   - `Ctrl+K` / `Cmd+K`: Open the Global Search Omnibar.
   - Type `[[` inside the editor to trigger wiki-link autocomplete suggestions.

## Environment Variables

Environment variables configure database connectivity, service ports, and server-side communication between the Next.js frontend and Fastify backend.

| Variable | Description | Example |
| --- | --- | --- |
| `POSTGRES_USER` | PostgreSQL database username used by Docker Compose | `brainsync` |
| `POSTGRES_PASSWORD` | PostgreSQL database password used by Docker Compose | `brainsync` |
| `POSTGRES_DB` | PostgreSQL database name | `brainsync` |
| `DB_PORT` | Host port mapped to PostgreSQL container port `5432` | `5434` |
| `BACKEND_PORT` | Host port mapped to the Fastify backend server | `4000` |
| `FRONTEND_PORT` | Host port mapped to the Next.js frontend server | `3000` |
| `DATABASE_URL` | PostgreSQL connection string required by Fastify & Prisma | `postgresql://brainsync:brainsync@db:5432/brainsync?schema=public` |
| `PORT` | Internal HTTP port bound by the Fastify backend | `4000` |
| `HOST` | Network interface bound by Fastify | `0.0.0.0` |
| `BACKEND_URL` | Server-side base URL used by Next.js `backendFetch` | `http://backend:4000` |

```env
POSTGRES_USER=brainsync
POSTGRES_PASSWORD=brainsync
POSTGRES_DB=brainsync

DB_PORT=5434
BACKEND_PORT=4000
FRONTEND_PORT=3000
```

## API Documentation

The Fastify backend exposes a RESTful JSON API consumed server-side by Next.js Server Actions and Components, while Next.js exposes a browser-facing download proxy for ZIP exports.

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/health` | Backend service health check | None |
| `GET` | `/notes` | List recent notes (`?limit=1..200`) | None |
| `GET` | `/notes/titles` | List all note IDs and titles for autocomplete | None |
| `GET` | `/notes/by-title` | Resolve a note by case-insensitive title (`?title=...`) | None |
| `GET` | `/notes/:id` | Fetch note detail, resolved links, tags, and backlinks | None |
| `POST` | `/notes` | Create a note and sync wiki-links and tags | None |
| `PUT` | `/notes/:id` | Update a note, refresh links, and sync tags | None |
| `PATCH` | `/notes/:id/pin` | Pin or unpin a note in the sidebar | None |
| `DELETE` | `/notes/:id` | Delete a note (cascades links and tag relations) | None |
| `GET` | `/tags` | List all tags with associated note counts | None |
| `GET` | `/tags/:name/notes` | List notes tagged with `:name` | None |
| `GET` | `/search` | Trigram fuzzy search across titles, tags, and content (`?q=...`) | None |
| `GET` | `/graph` | Fetch graph nodes with backlink counts and directed edges | None |
| `GET` | `/tasks` | Aggregate Markdown checklist tasks across all notes | None |
| `PATCH` | `/tasks/toggle` | Toggle a task checkbox at a specific note line index | None |
| `POST` | `/import/notes` | Batch import Markdown notes (`overwrite` optional) | None |
| `POST` | `/import/zip` | Import notes from a base64-encoded `.zip` archive | None |
| `GET` | `/export/zip` | Export all vault notes as `brainsync-vault-export.zip` | None |
| `GET` | `/api/export` | Next.js Route Handler proxying `/export/zip` to the browser | None |

Example request to create a note with wiki-links and tags:

```http
POST /notes HTTP/1.1
Content-Type: application/json

{
  "title": "Knowledge Graph Notes",
  "content": "Connected to [[Zettelkasten Method Explained]] #pkm #graph",
  "manualTags": ["architecture"]
}
```

## Database Configuration

BrainSync uses PostgreSQL 16 managed through Prisma ORM (`backend/prisma/schema.prisma`) with custom SQL migrations enabling the `pg_trgm` extension, GIN trigram indexes on note titles/content and tag names, a case-insensitive unique index on `lower(title)`, and normalization check constraints.

1. Ensure PostgreSQL is running and `DATABASE_URL` is configured.
2. Apply the initial migration and generate the ESM Prisma client:
   ```bash
   cd backend
   npm run db:deploy
   ```
3. Populate initial sample notes, tags, wiki-links, and tasks if desired:
   ```bash
   npm run db:seed
   ```

## Testing

The backend includes a Vitest unit and HTTP integration test suite covering domain parsers (`link-parser`, `tag-parser`, `task-parser`, `zip-builder`, `zip-reader`), all application use cases using in-memory repository doubles, and Fastify route handlers.

- **Domain & Use-Case Unit Tests**: Verify regex parsing, code-block masking, link/backlink reconciliation, task toggling, and ZIP archive handling without requiring a live database.
- **HTTP Route Integration Tests**: Exercise Fastify routes (`/notes`, `/search`, `/tags`) via `buildApp()` with injected in-memory repositories.

Run the backend test suite, linter, and TypeScript checks:

```bash
cd backend
npm test
npm run typecheck
npm run lint
```

## Build & Deployment

Both the Fastify backend and Next.js frontend include production `Dockerfile` definitions and TypeScript build scripts.

1. Build and run the full stack via Docker Compose:
   ```bash
   docker compose up -d --build
   ```
2. Or build each service manually for Node.js production deployment:
   ```bash
   cd backend && npm run build && npm run start
   cd ../frontend && npm run build && npm run start
   ```

## Contributing

Contributions are welcome to improve features, fix bugs, or enhance documentation.

1. Fork the repository.
2. Create a branch for the change.
3. Make and test the changes.
4. Commit and push the branch.
5. Open a pull request with a clear explanation.

## License

This project is licensed under the MIT License.
See the [LICENSE](LICENSE) file for details.

## Author & Contact

**Yohanes Dimas Pratama**

- GitHub: [github.com/weztcy](https://github.com/weztcy)
- Portfolio: [yohanesdimas.com](https://yohanesdimas.com)
- LinkedIn: [linkedin.com/in/yohanes-dimas](https://www.linkedin.com/in/yohanes-dimas)
