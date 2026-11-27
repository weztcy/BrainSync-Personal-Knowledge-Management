'use client';

import { ArrowLeft, Compass, RotateCcw, Search, Type, ZoomIn, ZoomOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { GraphCanvas3D } from './GraphCanvas3D';
import { cn } from '@/shared/lib/cn';
import type { GraphData, GraphNode } from '@/shared/types';

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface SimEdge {
  sourceId: string;
  targetId: string;
}

interface GraphCanvasProps {
  data: GraphData;
}

const ALPHA_MIN = 0.005;
const ALPHA_DECAY = 0.982;
const VELOCITY_THRESHOLD = 0.04;

class GraphSimulation {
  nodes: SimNode[] = [];
  edges: SimEdge[] = [];
  alpha = 1.0;
  isRunning = false;
  animFrameId: number | null = null;
  draggedNode: SimNode | null = null;
  canvas: HTMLCanvasElement | null = null;

  pan = { x: 0, y: 0 };
  zoom = 1;
  search = '';
  hoveredNode: SimNode | null = null;
  showLabels = true;

  init(data: GraphData, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const angleStep = (2 * Math.PI) / Math.max(1, data.nodes.length);
    const initialRadius = Math.min(width, height) * 0.35;

    this.nodes = data.nodes.map((n, i) => {
      const angle = i * angleStep;
      const radius = Math.min(22, Math.max(8, 8 + n.backlinkCount * 2.8));
      return {
        ...n,
        x: centerX + Math.cos(angle) * initialRadius + (Math.random() - 0.5) * 30,
        y: centerY + Math.sin(angle) * initialRadius + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
        radius,
      };
    });

    this.edges = data.edges.map((e) => ({
      sourceId: e.source,
      targetId: e.target,
    }));

    this.start(1.0);
  }

  updateViewState(
    pan: { x: number; y: number },
    zoom: number,
    search: string,
    hoveredNode: SimNode | null,
    showLabels: boolean = true,
  ): void {
    this.pan = pan;
    this.zoom = zoom;
    this.search = search;
    this.hoveredNode = hoveredNode;
    this.showLabels = showLabels;

    if (!this.isRunning) {
      this.draw();
    }
  }

  start(heat: number = 1.0): void {
    this.alpha = Math.max(this.alpha, heat);
    if (this.isRunning) return;
    this.isRunning = true;

    const step = (): void => {
      if (!this.canvas) {
        this.isRunning = false;
        return;
      }

      const isDragging = this.draggedNode !== null;

      if (this.alpha > ALPHA_MIN || isDragging) {
        this.tickPhysics();
        if (!isDragging) {
          this.alpha *= ALPHA_DECAY;
        }
      }

      this.draw();

      if (this.alpha > ALPHA_MIN || isDragging) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        // Simulation settled: nodes come to a complete, beautiful stop!
        this.isRunning = false;
        this.animFrameId = null;
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isRunning = false;
  }

  tickPhysics(): void {
    if (!this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const nodes = this.nodes;
    const edges = this.edges;
    const alpha = this.alpha;

    // 1. Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      if (!n1) continue;

      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        if (!n2) continue;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        if (distSq > 360000) continue;

        const dist = Math.sqrt(distSq);
        const minDist = n1.radius + n2.radius + 35;
        const force = (3600 / distSq) * (dist < minDist ? 2.5 : 1) * alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (n1 !== this.draggedNode) {
          n1.vx -= fx;
          n1.vy -= fy;
        }
        if (n2 !== this.draggedNode) {
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // 2. Spring attraction along edges
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      const source = nodeMap.get(edge.sourceId);
      const target = nodeMap.get(edge.targetId);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desiredDist = 100;
      const force = (dist - desiredDist) * 0.045 * alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (source !== this.draggedNode) {
        source.vx += fx;
        source.vy += fy;
      }
      if (target !== this.draggedNode) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // 3. Gravity to center & damping
    let maxVelocity = 0;
    for (const n of nodes) {
      if (n === this.draggedNode) continue;

      n.vx += (centerX - n.x) * 0.0012 * alpha;
      n.vy += (centerY - n.y) * 0.0012 * alpha;

      n.vx *= 0.82;
      n.vy *= 0.82;

      if (Math.abs(n.vx) < 0.02) n.vx = 0;
      if (Math.abs(n.vy) < 0.02) n.vy = 0;

      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > maxVelocity) maxVelocity = speed;

      n.x += n.vx;
      n.y += n.vy;
    }

    // When maximum velocity is below threshold, stop immediately
    if (maxVelocity < VELOCITY_THRESHOLD && !this.draggedNode) {
      this.alpha = 0;
    }
  }

  draw(): void {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const pan = this.pan;
    const zoom = this.zoom;
    const hoveredNode = this.hoveredNode;
    const query = this.search.trim().toLowerCase();
    const nodes = this.nodes;
    const edges = this.edges;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const edgeColor = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.28)';
    const activeEdgeColor = isDark ? 'rgba(96, 165, 250, 0.85)' : 'rgba(37, 99, 235, 0.85)';

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.sourceId);
      const target = nodeMap.get(edge.targetId);
      if (!source || !target) continue;

      const isConnected =
        hoveredNode &&
        (hoveredNode.id === source.id || hoveredNode.id === target.id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isConnected ? activeEdgeColor : edgeColor;
      ctx.lineWidth = isConnected ? 2.5 : 1.2;
      ctx.stroke();
    }

    // Draw nodes
    for (const n of nodes) {
      const isHovered = hoveredNode?.id === n.id;
      const isMatch = query ? n.title.toLowerCase().includes(query) : true;
      const isDimmed =
        (query && !isMatch) ||
        (hoveredNode &&
          !isHovered &&
          !edges.some(
            (e) =>
              (e.sourceId === hoveredNode.id && e.targetId === n.id) ||
              (e.targetId === hoveredNode.id && e.sourceId === n.id),
          ));

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

      if (isMatch && query) {
        ctx.fillStyle = '#10b981';
      } else if (isHovered) {
        ctx.fillStyle = '#3b82f6';
      } else if (n.backlinkCount >= 3) {
        ctx.fillStyle = isDark ? '#60a5fa' : '#2563eb';
      } else {
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      }

      ctx.globalAlpha = isDimmed ? 0.2 : 1;
      ctx.fill();

      ctx.lineWidth = isHovered ? 3 : 1.5;
      ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.stroke();

      if (this.showLabels) {
        ctx.font = `${isHovered ? 'bold 12px' : '11px'} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.fillText(n.title, n.x, n.y + n.radius + 5);
      }

      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  getNodeAt(worldX: number, worldY: number): SimNode | null {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (!node) continue;
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
        return node;
      }
    }
    return null;
  }
}

export function GraphCanvas({ data }: GraphCanvasProps): ReactNode {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<GraphSimulation | null>(null);

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // 1. Initialize 2D simulation engine only when in 2D mode
  useEffect(() => {
    if (viewMode !== '2d') {
      simRef.current?.stop();
      simRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const sim = new GraphSimulation();
    sim.canvas = canvas;
    sim.init(data, canvas.width, canvas.height);
    simRef.current = sim;

    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [data, viewMode]);

  // 2. Synchronize view state to 2D simulation engine
  useEffect(() => {
    if (viewMode === '2d') {
      simRef.current?.updateViewState(pan, zoom, search, hoveredNode, showLabels);
    }
  }, [pan, zoom, search, hoveredNode, showLabels, viewMode]);

  // 3. Handle window resize
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !simRef.current) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      simRef.current.draw();
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transform coordinates (screen to world)
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom,
      };
    },
    [pan, zoom],
  );

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !simRef.current) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const world = screenToWorld(mouseX, mouseY);
    const hitNode = simRef.current.getNodeAt(world.x, world.y);

    dragStartPosRef.current = { x: mouseX, y: mouseY };

    if (hitNode) {
      isDraggingRef.current = true;
      simRef.current.draggedNode = hitNode;
      simRef.current.start(0.25);
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: mouseX - pan.x, y: mouseY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !simRef.current) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current && simRef.current.draggedNode) {
      const world = screenToWorld(mouseX, mouseY);
      simRef.current.draggedNode.x = world.x;
      simRef.current.draggedNode.y = world.y;
      simRef.current.draggedNode.vx = 0;
      simRef.current.draggedNode.vy = 0;
      simRef.current.start(0.2);
      return;
    }

    if (isPanningRef.current) {
      setPan({
        x: mouseX - panStartRef.current.x,
        y: mouseY - panStartRef.current.y,
      });
      return;
    }

    const world = screenToWorld(mouseX, mouseY);
    const hit = simRef.current.getNodeAt(world.x, world.y);
    setHoveredNode(hit);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !simRef.current) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = Math.abs(mouseX - dragStartPosRef.current.x);
    const dy = Math.abs(mouseY - dragStartPosRef.current.y);
    const isClick = dx < 5 && dy < 5;

    if (isClick && simRef.current.draggedNode) {
      router.push(`/note/${simRef.current.draggedNode.id}`);
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      simRef.current.draggedNode = null;
      simRef.current.start(0.12);
    }

    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(3, Math.max(0.3, prev * zoomFactor)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSearch('');
    simRef.current?.start(0.25);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Notes
          </Link>

          <span className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono text-slate-500 shadow-xs">
            {data.nodes.length} Nodes • {data.edges.length} Links
          </span>

          {/* 3D / 2D Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors',
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              )}
            >
              3D Galaxy
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors',
                viewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              )}
            >
              2D Flat
            </button>
          </div>
        </div>

        {/* Search & View Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Highlight node..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 shadow-xs w-44"
            />
          </div>

          {/* Label Toggle Button (available in both 3D & 2D) */}
          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-xs',
              showLabels
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
            title="Toggle note name labels"
          >
            <Type className="w-3.5 h-3.5" />
            <span>{showLabels ? 'Labels ON' : 'Labels OFF'}</span>
          </button>

          {/* 3D Specific Controls */}
          {viewMode === '3d' && (
            <button
              type="button"
              onClick={() => setAutoRotate((prev) => !prev)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-xs',
                autoRotate
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
              title="Toggle cinematic orbital auto-rotation"
            >
              <Compass className={cn('w-3.5 h-3.5', autoRotate && 'animate-spin')} />
              <span>{autoRotate ? 'Orbiting' : 'Orbit'}</span>
            </button>
          )}

          {/* 2D Specific Controls */}
          {viewMode === '2d' && (
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs p-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-md"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-md"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-md"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="text-[11px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full text-slate-500 shadow-xs">
          {viewMode === '3d'
            ? 'Left-click & drag to orbit in 3D • Right-click to pan • Scroll to zoom • Click node to open'
            : 'Click node to open • Drag to arrange • Scroll to zoom'}
        </span>
      </div>

      {/* Render 3D Galaxy or 2D Flat Canvas */}
      {viewMode === '3d' ? (
        <GraphCanvas3D
          data={data}
          searchQuery={search}
          autoRotate={autoRotate}
          showLabels={showLabels}
        />
      ) : (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      )}
    </div>
  );
}
