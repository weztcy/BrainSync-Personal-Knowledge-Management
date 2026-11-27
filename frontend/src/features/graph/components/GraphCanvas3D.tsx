'use client';

import { ExternalLink, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GraphData, GraphNode } from '@/shared/types';

interface SimNode3D extends GraphNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  mesh?: THREE.Mesh;
  sprite?: THREE.Sprite;
}

interface SimEdge3D {
  sourceId: string;
  targetId: string;
}

interface GraphCanvas3DProps {
  data: GraphData;
  searchQuery?: string;
  autoRotate?: boolean;
  showLabels?: boolean;
}

const ALPHA_MIN = 0.005;
const ALPHA_DECAY = 0.982;
const VELOCITY_THRESHOLD = 0.04;

function createTextSprite(
  text: string,
  isDark: boolean,
  backlinkCount: number,
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Sprite();

  const isHub = backlinkCount >= 3;
  const dpr = 2; // High-DPI for pin-sharp text
  const fontSize = (isHub ? 15 : 13) * dpr;
  const fontStyle = isHub ? 'bold' : '600';
  ctx.font = `${fontStyle} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const textWidth = ctx.measureText(text).width;
  const dotRadius = (isHub ? 3.5 : 2.8) * dpr;
  const dotMarginRight = 6 * dpr;
  const badgeText = backlinkCount > 0 ? `${backlinkCount}` : '';
  const badgeWidth = badgeText ? ctx.measureText(badgeText).width + 10 * dpr : 0;
  const paddingX = 10 * dpr;
  const paddingY = 5 * dpr;

  const contentWidth =
    dotRadius * 2 + dotMarginRight + textWidth + (badgeWidth > 0 ? badgeWidth + 6 * dpr : 0);
  canvas.width = Math.ceil(contentWidth + paddingX * 2);
  canvas.height = Math.ceil(fontSize + paddingY * 2);

  // Canvas resize resets state, re-apply font and text settings
  ctx.font = `${fontStyle} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';

  const w = canvas.width;
  const h = canvas.height;
  const cornerRadius = h / 2;

  // Draw pill background
  ctx.beginPath();
  ctx.arc(cornerRadius, cornerRadius, cornerRadius - 1.5 * dpr, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.arc(w - cornerRadius, cornerRadius, cornerRadius - 1.5 * dpr, (Math.PI * 3) / 2, Math.PI / 2);
  ctx.closePath();

  if (isDark) {
    ctx.fillStyle = isHub ? 'rgba(15, 23, 42, 0.94)' : 'rgba(15, 23, 42, 0.88)';
    ctx.fill();
    ctx.strokeStyle = isHub ? 'rgba(96, 165, 250, 0.85)' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = (isHub ? 2 : 1.2) * dpr;
    ctx.stroke();
  } else {
    ctx.fillStyle = isHub ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)';
    ctx.fill();
    ctx.strokeStyle = isHub ? 'rgba(37, 99, 235, 0.85)' : 'rgba(203, 213, 225, 0.9)';
    ctx.lineWidth = (isHub ? 2 : 1.2) * dpr;
    ctx.stroke();
  }

  let currentX = paddingX;

  // 1. Draw glowing dot indicator
  const dotColor = isHub
    ? isDark
      ? '#60a5fa'
      : '#2563eb'
    : isDark
      ? '#94a3b8'
      : '#64748b';
  ctx.beginPath();
  ctx.arc(currentX + dotRadius, h / 2, dotRadius, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();
  currentX += dotRadius * 2 + dotMarginRight;

  // 2. Draw Title Text
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText(text, currentX, h / 2);
  currentX += textWidth;

  // 3. Draw Backlink count chip if > 0
  if (badgeText) {
    currentX += 6 * dpr;
    const badgeH = 12 * dpr;
    const badgeW = badgeWidth;
    const badgeY = (h - badgeH) / 2;
    const bRadius = badgeH / 2;

    ctx.beginPath();
    ctx.arc(currentX + bRadius, badgeY + bRadius, bRadius, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.arc(currentX + badgeW - bRadius, badgeY + bRadius, bRadius, (Math.PI * 3) / 2, Math.PI / 2);
    ctx.closePath();

    ctx.fillStyle = isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.85)';
    ctx.fill();

    ctx.font = `600 ${9.5 * dpr}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isDark ? '#93c5fd' : '#1d4ed8';
    ctx.fillText(badgeText, currentX + badgeW / 2, h / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false, // Ensures labels are never occluded by balls or lines
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  const aspect = canvas.width / canvas.height;
  const baseH = isHub ? 7.5 : 6.0;
  const baseW = baseH * aspect;
  sprite.scale.set(baseW, baseH, 1);
  sprite.renderOrder = 999;
  sprite.userData = { baseW, baseH };

  return sprite;
}

export function GraphCanvas3D({
  data,
  searchQuery = '',
  autoRotate = false,
  showLabels = true,
}: GraphCanvas3DProps): ReactNode {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SimNode3D | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // References to preserve Three.js objects across renders
  const controlsRef = useRef<OrbitControls | null>(null);
  const simNodesRef = useRef<SimNode3D[]>([]);
  const simEdgesRef = useRef<SimEdge3D[]>([]);

  const autoRotateRef = useRef(autoRotate);
  const searchQueryRef = useRef(searchQuery);
  const showLabelsRef = useRef(showLabels);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    searchQueryRef.current = searchQuery;
    showLabelsRef.current = showLabels;
  }, [autoRotate, searchQuery, showLabels]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;

    // 1. Setup Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    scene.background = new THREE.Color(isDark ? 0x090d16 : 0xf8fafc);

    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 2000);
    camera.position.set(0, 120, 360);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    // 2. Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 60;
    controls.maxDistance = 900;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, isDark ? 1.4 : 1.6);
    dirLight1.position.set(200, 300, 250);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, isDark ? 0.8 : 0.4);
    dirLight2.position.set(-200, -200, -200);
    scene.add(dirLight2);

    // 4. Initialize 3D Nodes on a Fibonacci sphere
    const count = Math.max(1, data.nodes.length);
    const sphereRadius = Math.min(width, height) * 0.28;
    const phiIncrement = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    const sphereGeomCache = new Map<number, THREE.SphereGeometry>();
    const getSphereGeom = (rad: number): THREE.SphereGeometry => {
      const rounded = Math.round(rad * 10) / 10;
      if (!sphereGeomCache.has(rounded)) {
        sphereGeomCache.set(rounded, new THREE.SphereGeometry(rounded, 24, 24));
      }
      return sphereGeomCache.get(rounded)!;
    };

    const simNodes: SimNode3D[] = data.nodes.map((node, i) => {
      const y = 1 - (i / (count - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phiIncrement * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const visualRadius = Math.min(20, Math.max(8.5, 8.5 + node.backlinkCount * 1.6));

      // Color scheme based on hubs and connectivity
      let nodeColor = isDark ? 0x64748b : 0x94a3b8;
      if (node.backlinkCount >= 4) {
        nodeColor = isDark ? 0x60a5fa : 0x2563eb; // Core hub blue
      } else if (node.backlinkCount >= 2) {
        nodeColor = isDark ? 0x818cf8 : 0x4f46e5; // Secondary indigo
      }

      const material = new THREE.MeshStandardMaterial({
        color: nodeColor,
        roughness: 0.25,
        metalness: 0.2,
        emissive: nodeColor,
        emissiveIntensity: isDark ? 0.3 : 0.12,
      });

      const mesh = new THREE.Mesh(getSphereGeom(visualRadius), material);
      mesh.userData = { nodeId: node.id, nodeTitle: node.title, backlinkCount: node.backlinkCount };
      mesh.position.set(x * sphereRadius, y * sphereRadius, z * sphereRadius);
      scene.add(mesh);

      // Create text sprite billboard card for note title
      const sprite = createTextSprite(node.title, isDark, node.backlinkCount);
      sprite.userData.nodeId = node.id;
      sprite.userData.nodeTitle = node.title;
      sprite.position.set(
        x * sphereRadius,
        y * sphereRadius + (visualRadius + sprite.userData.baseH * 0.5 + 2.0),
        z * sphereRadius,
      );
      scene.add(sprite);

      return {
        ...node,
        x: x * sphereRadius,
        y: y * sphereRadius,
        z: z * sphereRadius,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: visualRadius,
        mesh,
        sprite,
      };
    });

    simNodesRef.current = simNodes;

    const simEdges: SimEdge3D[] = data.edges.map((e) => ({
      sourceId: e.source,
      targetId: e.target,
    }));
    simEdgesRef.current = simEdges;

    // 5. 3D Line Segments for Connections
    const linePositions = new Float32Array(simEdges.length * 6);
    const lineColors = new Float32Array(simEdges.length * 6);
    const defaultLineColor = isDark ? new THREE.Color(0x334155) : new THREE.Color(0xcbd5e1);

    for (let i = 0; i < simEdges.length * 2; i++) {
      lineColors[i * 3] = defaultLineColor.r;
      lineColors[i * 3 + 1] = defaultLineColor.g;
      lineColors[i * 3 + 2] = defaultLineColor.b;
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.45 : 0.6,
      blending: THREE.NormalBlending,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // 6. 3D Physics Simulation (Force-directed in 3D with Alpha cooling)
    let alpha = 1.0;
    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const tickPhysics3D = () => {
      // 1. 3D Repulsion between all node pairs
      for (let i = 0; i < simNodes.length; i++) {
        const n1 = simNodes[i];
        if (!n1) continue;

        for (let j = i + 1; j < simNodes.length; j++) {
          const n2 = simNodes[j];
          if (!n2) continue;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dz = n2.z - n1.z;
          const distSq = dx * dx + dy * dy + dz * dz || 1;
          if (distSq > 400000) continue;

          const dist = Math.sqrt(distSq);
          const minDist = n1.radius + n2.radius + 35;
          const force = (4200 / distSq) * (dist < minDist ? 2.5 : 1) * alpha;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;

          n1.vx -= fx;
          n1.vy -= fy;
          n1.vz -= fz;

          n2.vx += fx;
          n2.vy += fy;
          n2.vz += fz;
        }
      }

      // 2. 3D Spring attraction along links
      for (const edge of simEdges) {
        const source = nodeMap.get(edge.sourceId);
        const target = nodeMap.get(edge.targetId);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dz = target.z - source.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const desiredDist = 100;
        const force = (dist - desiredDist) * 0.045 * alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        source.vx += fx;
        source.vy += fy;
        source.vz += fz;

        target.vx -= fx;
        target.vy -= fy;
        target.vz -= fz;
      }

      // 3. Center pull & damping
      let maxVelocity = 0;
      for (const n of simNodes) {
        n.vx -= n.x * 0.0012 * alpha;
        n.vy -= n.y * 0.0012 * alpha;
        n.vz -= n.z * 0.0012 * alpha;

        n.vx *= 0.82;
        n.vy *= 0.82;
        n.vz *= 0.82;

        if (Math.abs(n.vx) < 0.02) n.vx = 0;
        if (Math.abs(n.vy) < 0.02) n.vy = 0;
        if (Math.abs(n.vz) < 0.02) n.vz = 0;

        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy + n.vz * n.vz);
        if (speed > maxVelocity) maxVelocity = speed;

        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        if (n.mesh) {
          n.mesh.position.set(n.x, n.y, n.z);
        }
        if (n.sprite) {
          n.sprite.position.set(
            n.x,
            n.y + (n.radius + n.sprite.userData.baseH * 0.5 + 2.0),
            n.z,
          );
        }
      }

      // Update lines buffer
      const posAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      let ptr = 0;

      for (const edge of simEdges) {
        const s = nodeMap.get(edge.sourceId);
        const t = nodeMap.get(edge.targetId);
        if (!s || !t) continue;

        positions[ptr++] = s.x;
        positions[ptr++] = s.y;
        positions[ptr++] = s.z;
        positions[ptr++] = t.x;
        positions[ptr++] = t.y;
        positions[ptr++] = t.z;
      }
      posAttr.needsUpdate = true;

      // When speeds settle, stop the physics engine!
      if (maxVelocity < VELOCITY_THRESHOLD) {
        alpha = 0;
      }
    };

    // 7. Raycasting for Mouse Hover & Selection (both Mesh & Sprite)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const interactiveObjects: THREE.Object3D[] = [];
    for (const n of simNodes) {
      if (n.mesh) interactiveObjects.push(n.mesh);
      if (n.sprite) interactiveObjects.push(n.sprite);
    }

    let activeHoveredNode: SimNode3D | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0 && intersects[0]?.object) {
        const hitObj = intersects[0].object;
        const hitNode =
          simNodes.find((n) => n.mesh === hitObj || n.sprite === hitObj) ?? null;

        if (activeHoveredNode !== hitNode) {
          if (activeHoveredNode) {
            activeHoveredNode.mesh?.scale.set(1, 1, 1);
            if (activeHoveredNode.sprite) {
              activeHoveredNode.sprite.scale.set(
                activeHoveredNode.sprite.userData.baseW,
                activeHoveredNode.sprite.userData.baseH,
                1,
              );
            }
          }
          activeHoveredNode = hitNode;
          if (hitNode?.mesh) {
            hitNode.mesh.scale.set(1.3, 1.3, 1.3);
          }
          if (hitNode?.sprite) {
            hitNode.sprite.scale.set(
              hitNode.sprite.userData.baseW * 1.25,
              hitNode.sprite.userData.baseH * 1.25,
              1,
            );
          }
        }

        setHoveredNode(hitNode);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        renderer.domElement.style.cursor = 'pointer';
      } else {
        if (activeHoveredNode) {
          activeHoveredNode.mesh?.scale.set(1, 1, 1);
          if (activeHoveredNode.sprite) {
            activeHoveredNode.sprite.scale.set(
              activeHoveredNode.sprite.userData.baseW,
              activeHoveredNode.sprite.userData.baseH,
              1,
            );
          }
          activeHoveredNode = null;
        }
        setHoveredNode(null);
        setTooltipPos(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0 && intersects[0]?.object) {
        const hitObj = intersects[0].object;
        const targetNode = simNodes.find((n) => n.mesh === hitObj || n.sprite === hitObj);
        if (targetNode) {
          router.push(`/note/${targetNode.id}`);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // 8. Animation & Render Loop
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Run cooling 3D physics if still warm
      if (alpha > ALPHA_MIN) {
        tickPhysics3D();
        alpha *= ALPHA_DECAY;
      }

      // Update search highlight colors and label visibility
      const query = searchQueryRef.current.trim().toLowerCase();
      const showLabelsCurrent = showLabelsRef.current;

      for (const n of simNodes) {
        if (!n.mesh) continue;
        const mat = n.mesh.material as THREE.MeshStandardMaterial;
        const isMatch = query ? n.title.toLowerCase().includes(query) : false;

        if (query && isMatch) {
          mat.color.setHex(0x10b981); // Emerald match
          mat.emissive.setHex(0x10b981);
          mat.emissiveIntensity = 0.55;
        } else if (n === activeHoveredNode) {
          mat.color.setHex(0xf59e0b); // Amber hovered
          mat.emissive.setHex(0xf59e0b);
          mat.emissiveIntensity = 0.45;
        } else if (n.backlinkCount >= 4) {
          const col = isDark ? 0x60a5fa : 0x2563eb;
          mat.color.setHex(col);
          mat.emissive.setHex(col);
          mat.emissiveIntensity = isDark ? 0.3 : 0.15;
        } else if (n.backlinkCount >= 2) {
          const col = isDark ? 0x818cf8 : 0x4f46e5;
          mat.color.setHex(col);
          mat.emissive.setHex(col);
          mat.emissiveIntensity = isDark ? 0.25 : 0.12;
        } else {
          const col = isDark ? 0x64748b : 0x94a3b8;
          mat.color.setHex(col);
          mat.emissive.setHex(col);
          mat.emissiveIntensity = isDark ? 0.2 : 0.08;
        }

        // Label visibility
        if (n.sprite) {
          if (!showLabelsCurrent) {
            n.sprite.visible = false;
          } else {
            n.sprite.visible = query ? isMatch : true;
          }
        }
      }

      controls.autoRotate = autoRotateRef.current;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      sphereGeomCache.forEach((geom) => geom.dispose());

      for (const n of simNodes) {
        if (n.sprite) {
          n.sprite.material.map?.dispose();
          n.sprite.material.dispose();
        }
      }

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [data, router]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Node Tooltip Card */}
      {hoveredNode && tooltipPos && (
        <div
          style={{
            left: Math.min(window.innerWidth - 240, tooltipPos.x + 14),
            top: Math.min(window.innerHeight - 120, tooltipPos.y + 14),
          }}
          className="fixed z-40 pointer-events-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-3 min-w-44 max-w-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
              {hoveredNode.title}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {hoveredNode.backlinkCount} backlink{hoveredNode.backlinkCount === 1 ? '' : 's'}
            </span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Click to open</span>
          </div>
        </div>
      )}
    </div>
  );
}
