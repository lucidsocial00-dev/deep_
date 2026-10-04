import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Users,
  Flame,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  X,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Zap,
  Eye,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Post, User, ViralContagionEvent } from '../types';
import { triggerVibration } from '../utils/haptics';

export interface ViralSpreadGraphProps {
  post: Post;
  allUsers?: User[];
  currentUser?: User;
  onSimulateInfectNextProfile?: (postId: string) => void;
  onViralPostViewed?: (postId: string, viewerUser?: User) => void;
  onClose?: () => void;
  onViewProfile?: (userId: string) => void;
  height?: number;
  className?: string;
  isModal?: boolean;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'post' | 'profile';
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  location?: string;
  order?: number;
  wave?: number;
  radius: number;
  targetRadialDistance: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  order: number;
}

export const ViralSpreadGraph: React.FC<ViralSpreadGraphProps> = ({
  post,
  allUsers = [],
  currentUser,
  onSimulateInfectNextProfile,
  onViralPostViewed,
  onClose,
  onViewProfile,
  height = 560,
  className = '',
  isModal = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 700,
    height,
  });

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [layoutMode, setLayoutMode] = useState<'radial' | 'organic'>('radial');
  const [justInfectedId, setJustInfectedId] = useState<string | null>(null);
  const [showEventsDrawer, setShowEventsDrawer] = useState(false);
  const [selectedViewerId, setSelectedViewerId] = useState<string>(currentUser?.id || 'usr_me');

  const viralData = post.firePowerUps?.viral;
  const infectedIds = useMemo(() => viralData?.infectedProfileIds || [], [viralData]);
  const infectedNames = useMemo(() => viralData?.infectedProfileNames || [], [viralData]);
  const contagionEvents = useMemo(() => viralData?.contagionEvents || [], [viralData]);
  const remainingViews = viralData?.fadeAwayRemainingViews ?? 0;
  const totalInfections = viralData?.totalInfections ?? infectedIds.length;
  const isFadedAway = viralData?.fadedAway ?? false;

  // Track previous infection count to detect new additions for highlight animation
  const prevCountRef = useRef(infectedIds.length);
  useEffect(() => {
    if (infectedIds.length > prevCountRef.current) {
      const newestId = infectedIds[infectedIds.length - 1];
      setJustInfectedId(newestId);
      triggerVibration([20, 40, 30]);
      const timer = setTimeout(() => {
        setJustInfectedId(null);
      }, 2500);
      prevCountRef.current = infectedIds.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = infectedIds.length;
  }, [infectedIds]);

  // Responsive observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: h } = entry.contentRect;
        if (width > 50) {
          setDimensions({
            width: Math.floor(width),
            height: Math.max(380, Math.floor(h || height)),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Transform / Zoom refs
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  // Main D3 Rendering & Simulation Effect
  useEffect(() => {
    if (!svgRef.current || dimensions.width <= 0 || dimensions.height <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height: chartHeight } = dimensions;
    const centerX = width / 2;
    const centerY = chartHeight / 2;

    // 1. Build Nodes Data
    const centerPostNode: GraphNode = {
      id: `post_${post.id}`,
      type: 'post',
      name: post.authorName,
      handle: post.authorHandle,
      avatar: post.authorAvatar,
      bio: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
      location: post.city || 'Network Origin',
      radius: 38,
      targetRadialDistance: 0,
      fx: centerX,
      fy: centerY,
    };

    const profileNodes: GraphNode[] = infectedIds.map((userId, idx) => {
      const user = allUsers.find((u) => u.id === userId);
      const name = user?.name || infectedNames[idx] || `Visitor ${userId.slice(-4)}`;
      const handle = user?.handle || (name.startsWith('@') ? name : `@${name.toLowerCase().replace(/\s+/g, '_')}`);
      const avatar =
        user?.avatar ||
        `https://images.unsplash.com/photo-${1500000000000 + (idx * 47) % 50000000}?auto=format&fit=crop&q=80&w=150`;

      // Waves: 1st-3rd at ~110px, 4th-7th at ~175px, 8th+ at ~235px
      const wave = Math.floor(idx / 3) + 1;
      const baseDistance = 95 + wave * 45;

      return {
        id: userId,
        type: 'profile',
        name,
        handle,
        avatar,
        bio: user?.bio,
        location: user?.location,
        order: idx + 1,
        wave,
        radius: 24,
        targetRadialDistance: baseDistance,
      };
    });

    const allNodes: GraphNode[] = [centerPostNode, ...profileNodes];

    // 2. Build Links Data (Center post radiating to every infected node)
    const allLinks: GraphLink[] = profileNodes.map((pNode, idx) => ({
      id: `link_${pNode.id}`,
      source: centerPostNode.id,
      target: pNode.id,
      order: idx + 1,
    }));

    // 3. Setup SVG Defs (Filters, Patterns, Gradients)
    const defs = svg.append('defs');

    // Biohazard Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'viral-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4.5')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Heavy Pulse Filter for Center Node
    const centerFilter = defs.append('filter')
      .attr('id', 'center-glow')
      .attr('x', '-60%')
      .attr('y', '-60%')
      .attr('width', '220%')
      .attr('height', '220%');
    centerFilter.append('feGaussianBlur')
      .attr('stdDeviation', '7')
      .attr('result', 'blur');
    const centerMerge = centerFilter.append('feMerge');
    centerMerge.append('feMergeNode').attr('in', 'blur');
    centerMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gradients for links
    const linkGradient = defs.append('linearGradient')
      .attr('id', 'link-grad-viral')
      .attr('gradientUnits', 'userSpaceOnUse');
    linkGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', '0.9');
    linkGradient.append('stop').attr('offset', '50%').attr('stop-color', '#fb923c').attr('stop-opacity', '0.7');
    linkGradient.append('stop').attr('offset', '100%').attr('stop-color', '#e11d48').attr('stop-opacity', '0.85');

    // Create avatar patterns for each node
    allNodes.forEach((node) => {
      const pattern = defs
        .append('pattern')
        .attr('id', `avatar-pat-${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');

      pattern
        .append('image')
        .attr('href', node.avatar)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('width', 1)
        .attr('height', 1);
    });

    // 4. Container Group with Zoom & Pan
    const g = svg.append('g').attr('class', 'main-graph-group');
    gRef.current = g.node();

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Double click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    });

    // 5. Draw Background Concentric Wave Rings (Radioactive Radar)
    const backgroundGroup = g.append('g').attr('class', 'background-radials');
    const waveRadii = [135, 195, 255, 315];

    waveRadii.forEach((r, idx) => {
      // Dashed wave circle
      backgroundGroup
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#e11d48')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', idx % 2 === 0 ? '4 6' : '2 4')
        .attr('stroke-opacity', 0.16 + idx * 0.04);

      // Subtle Wave Label
      backgroundGroup
        .append('text')
        .attr('x', centerX + 8)
        .attr('y', centerY - r + 12)
        .attr('fill', '#f43f5e')
        .attr('fill-opacity', 0.35)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`CONTAGION WAVE ${idx + 1}`);
    });

    // Crosshair axes
    backgroundGroup
      .append('line')
      .attr('x1', centerX - 330)
      .attr('y1', centerY)
      .attr('x2', centerX + 330)
      .attr('y2', centerY)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.12)
      .attr('stroke-dasharray', '3 5');

    backgroundGroup
      .append('line')
      .attr('x1', centerX)
      .attr('y1', centerY - 330)
      .attr('x2', centerX)
      .attr('y2', centerY + 330)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.12)
      .attr('stroke-dasharray', '3 5');

    // 6. Draw Links Layer
    const linksGroup = g.append('g').attr('class', 'links-layer');
    const linkElements = linksGroup
      .selectAll<SVGLineElement, GraphLink>('.viral-link')
      .data(allLinks)
      .enter()
      .append('line')
      .attr('class', 'viral-link')
      .attr('stroke', 'url(#link-grad-viral)')
      .attr('stroke-width', 2.2)
      .attr('stroke-opacity', 0.65)
      .attr('stroke-linecap', 'round');

    // Flowing energy particle pulses along each link
    const pulsesGroup = g.append('g').attr('class', 'pulses-layer');
    const pulseElements = pulsesGroup
      .selectAll<SVGCircleElement, GraphLink>('.viral-pulse')
      .data(allLinks)
      .enter()
      .append('circle')
      .attr('class', 'viral-pulse')
      .attr('r', 3)
      .attr('fill', '#fef08a')
      .attr('filter', 'url(#viral-glow)');

    // 7. Draw Nodes Layer
    const nodesGroup = g.append('g').attr('class', 'nodes-layer');
    const nodeGroups = nodesGroup
      .selectAll<SVGGElement, GraphNode>('.node-item')
      .data(allNodes, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node-item cursor-pointer')
      .attr('data-id', (d) => d.id);

    // Dynamic Drag Behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        if (d.type !== 'post') {
          d.fx = null;
          d.fy = null;
        }
      });

    nodeGroups.call(drag);

    // Render Center Node Specific Aura & Rings
    nodeGroups.each(function (d) {
      const nodeSel = d3.select(this);

      if (d.type === 'post') {
        // Center Post Node
        // Deep pulsating outer aura
        nodeSel
          .append('circle')
          .attr('r', d.radius + 14)
          .attr('fill', 'none')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.5)
          .attr('filter', 'url(#center-glow)')
          .attr('class', 'animate-pulse');

        // Flame ring
        nodeSel
          .append('circle')
          .attr('r', d.radius + 6)
          .attr('fill', 'rgba(225, 29, 72, 0.25)')
          .attr('stroke', '#fb923c')
          .attr('stroke-width', 2.5);

        // Core Avatar Circle
        nodeSel
          .append('circle')
          .attr('r', d.radius)
          .attr('fill', `url(#avatar-pat-${d.id.replace(/[^a-zA-Z0-9_-]/g, '_')})`)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2.5)
          .attr('filter', 'url(#viral-glow)');

        // Biohazard Emblem Badge on Center Node
        const badgeG = nodeSel.append('g').attr('transform', `translate(0, ${d.radius + 2})`);
        badgeG
          .append('rect')
          .attr('x', -34)
          .attr('y', -10)
          .attr('width', 68)
          .attr('height', 18)
          .attr('rx', 9)
          .attr('fill', '#881337')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 1.2);

        badgeG
          .append('text')
          .attr('x', 0)
          .attr('y', 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#ffe4e6')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text('☣️ ORIGIN');

        // Post Author Text below badge
        nodeSel
          .append('text')
          .attr('x', 0)
          .attr('y', d.radius + 24)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f1f5f9')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .text(d.name);

        nodeSel
          .append('text')
          .attr('x', 0)
          .attr('y', d.radius + 36)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fb7185')
          .attr('font-size', '9.5px')
          .attr('font-family', 'monospace')
          .text(d.handle);
      } else {
        // Infected Profile Node
        const isRecentlyInfected = d.id === justInfectedId;

        // Outer Glow Ring
        nodeSel
          .append('circle')
          .attr('class', 'outer-ring')
          .attr('r', d.radius + 4)
          .attr('fill', isRecentlyInfected ? 'rgba(251, 146, 60, 0.4)' : 'rgba(225, 29, 72, 0.15)')
          .attr('stroke', isRecentlyInfected ? '#fbbf24' : '#f43f5e')
          .attr('stroke-width', isRecentlyInfected ? 3 : 1.8)
          .attr('stroke-opacity', 0.85)
          .attr('filter', 'url(#viral-glow)');

        // Avatar
        nodeSel
          .append('circle')
          .attr('class', 'avatar-circle')
          .attr('r', d.radius)
          .attr('fill', `url(#avatar-pat-${d.id.replace(/[^a-zA-Z0-9_-]/g, '_')})`)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5);

        // Sequence Infection Badge (#1, #2, etc.) at top-right
        const orderBadge = nodeSel.append('g').attr('transform', `translate(${d.radius - 4}, ${-d.radius + 4})`);
        orderBadge
          .append('circle')
          .attr('r', 8)
          .attr('fill', '#be123c')
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 1.2);

        orderBadge
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#fff')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(`${d.order}`);

        // Name & Handle label
        nodeSel
          .append('text')
          .attr('x', 0)
          .attr('y', d.radius + 13)
          .attr('text-anchor', 'middle')
          .attr('fill', '#e2e8f0')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .text(d.name.length > 12 ? d.name.slice(0, 11) + '…' : d.name);

        nodeSel
          .append('text')
          .attr('x', 0)
          .attr('y', d.radius + 23)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f43f5e')
          .attr('font-size', '8.5px')
          .attr('font-family', 'monospace')
          .text(d.handle.length > 13 ? d.handle.slice(0, 12) + '…' : d.handle);
      }
    });

    // 8. Hover & Click Interactivity
    nodeGroups
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        // Highlight links
        linkElements.attr('stroke-opacity', (l) => {
          const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
          const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
          return s === d.id || t === d.id ? 1 : 0.2;
        }).attr('stroke-width', (l) => {
          const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
          const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
          return s === d.id || t === d.id ? 3.5 : 1.5;
        });

        // Enlarge node ring
        d3.select(event.currentTarget)
          .select('.outer-ring')
          .transition()
          .duration(180)
          .attr('r', d.radius + 9)
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 2.8);
      })
      .on('mouseleave', (event, d) => {
        setHoveredNode(null);
        linkElements.attr('stroke-opacity', 0.65).attr('stroke-width', 2.2);

        d3.select(event.currentTarget)
          .select('.outer-ring')
          .transition()
          .duration(200)
          .attr('r', d.radius + 4)
          .attr('stroke', d.id === justInfectedId ? '#fbbf24' : '#f43f5e')
          .attr('stroke-width', 1.8);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // 9. D3 Force Simulation Setup
    const simulation = d3.forceSimulation<GraphNode>(allNodes)
      .force(
        'link',
        d3.forceLink<GraphNode, GraphLink>(allLinks)
          .id((d) => d.id)
          .distance((d) => {
            const targetNode = typeof d.target === 'object' ? (d.target as GraphNode) : profileNodes.find(p => p.id === d.target);
            return targetNode ? targetNode.targetRadialDistance : 150;
          })
          .strength(layoutMode === 'radial' ? 0.9 : 0.4)
      )
      .force('charge', d3.forceManyBody().strength(layoutMode === 'radial' ? -320 : -480))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.radius + 20).iterations(3));

    if (layoutMode === 'radial') {
      simulation.force(
        'radial',
        d3.forceRadial<GraphNode>(
          (d) => d.targetRadialDistance,
          centerX,
          centerY
        ).strength(0.85)
      );
    } else {
      simulation.force('center', d3.forceCenter(centerX, centerY));
    }

    // Tick update loop
    let pulseT = 0;
    simulation.on('tick', () => {
      // Update links
      linkElements
        .attr('x1', (d) => (d.source as GraphNode).x || centerX)
        .attr('y1', (d) => (d.source as GraphNode).y || centerY)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);

      // Update node positions
      nodeGroups.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);

      // Update pulses travelling outward along links
      pulseT = (pulseT + 0.018) % 1;
      pulseElements
        .attr('cx', (d) => {
          const sx = (d.source as GraphNode).x || centerX;
          const tx = (d.target as GraphNode).x || 0;
          const offsetT = (pulseT + (d.order * 0.2)) % 1;
          return sx + (tx - sx) * offsetT;
        })
        .attr('cy', (d) => {
          const sy = (d.source as GraphNode).y || centerY;
          const ty = (d.target as GraphNode).y || 0;
          const offsetT = (pulseT + (d.order * 0.2)) % 1;
          return sy + (ty - sy) * offsetT;
        });
    });

    // Continuous pulse motion animation timer
    const pulseTimer = d3.timer(() => {
      if (allLinks.length === 0) return;
      pulseT = (pulseT + 0.015) % 1;
      pulseElements
        .attr('cx', (d) => {
          const sx = (d.source as GraphNode).x || centerX;
          const tx = (d.target as GraphNode).x || 0;
          const offsetT = (pulseT + (d.order * 0.2)) % 1;
          return sx + (tx - sx) * offsetT;
        })
        .attr('cy', (d) => {
          const sy = (d.source as GraphNode).y || centerY;
          const ty = (d.target as GraphNode).y || 0;
          const offsetT = (pulseT + (d.order * 0.2)) % 1;
          return sy + (ty - sy) * offsetT;
        });
    });

    // Clean up
    return () => {
      simulation.stop();
      pulseTimer.stop();
    };
  }, [dimensions, infectedIds, infectedNames, allUsers, post, layoutMode, justInfectedId]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.75);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div
      className={`relative flex flex-col w-full rounded-2xl bg-neutral-950 border border-rose-500/40 text-slate-100 overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.25)] ${className}`}
    >
      {/* 1. Header Bar with Stats & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-rose-950/80 via-neutral-950 to-orange-950/70 border-b border-rose-500/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/60 flex items-center justify-center text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.5)] shrink-0">
            <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-rose-100 tracking-wide flex items-center gap-1.5">
                <span>☣️ Viral Contagion Network</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-900/60 border border-rose-400/80 text-rose-200">
                  D3 Directed Graph
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {post.authorName} ({post.authorHandle}) • Origin Post ID: #{post.id}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setLayoutMode('radial')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                layoutMode === 'radial'
                  ? 'bg-rose-600/40 text-rose-200 font-bold border border-rose-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Concentric Radar Waves layout"
            >
              Radial Orbits
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('organic')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                layoutMode === 'organic'
                  ? 'bg-rose-600/40 text-rose-200 font-bold border border-rose-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fluid Spring physics layout"
            >
              Organic Physics
            </button>
          </div>

          {/* Viewer Selection & Simulate View Contagion */}
          {!isFadedAway && remainingViews > 0 && (
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-rose-500/30">
              <select
                aria-label="Select viewer for contagion simulation"
                value={selectedViewerId}
                onChange={(e) => setSelectedViewerId(e.target.value)}
                className="bg-neutral-900 text-rose-200 text-xs py-1 px-1.5 rounded border border-neutral-800 focus:outline-none cursor-pointer"
              >
                {currentUser && <option value={currentUser.id}>Viewer: You ({currentUser.handle})</option>}
                {allUsers
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      Viewer: {u.name} ({u.handle})
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const targetViewer = allUsers.find((u) => u.id === selectedViewerId) || currentUser;
                  if (onViralPostViewed) {
                    onViralPostViewed(post.id, targetViewer);
                  } else if (onSimulateInfectNextProfile) {
                    onSimulateInfectNextProfile(post.id);
                  }
                }}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                title="When viewed, automatically spread to feeds of everyone the viewer knows"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Simulate View Spread</span>
              </button>
            </div>
          )}

          {/* Toggle Contagion Events Drawer */}
          <button
            type="button"
            onClick={() => setShowEventsDrawer((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showEventsDrawer
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-slate-300 border-neutral-700'
            }`}
            title="Inspect tracked contagion events log"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Contagion Events ({contagionEvents.length})</span>
            {showEventsDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Close Modal button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-slate-400 hover:text-slate-200 border border-neutral-700 transition-colors cursor-pointer"
              title="Close viral network graph"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 py-2 bg-black/70 border-b border-rose-500/20 text-xs font-mono">
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-950/20 border border-rose-500/20">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Infected Profiles</div>
            <div className="text-rose-300 font-bold text-sm">{totalInfections} Hosts</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Infection Bounty</div>
            <div className="text-emerald-300 font-bold text-sm">+{totalInfections * 25} pts</div>
          </div>
        </div>

        <div
          onClick={() => setShowEventsDrawer((p) => !p)}
          className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/25 border border-amber-500/30 cursor-pointer hover:bg-amber-950/40 transition-colors"
          title="Click to view contagion events"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Contagion Events</div>
            <div className="text-amber-300 font-bold text-sm">{contagionEvents.length} Recorded</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-950/20 border border-purple-500/20">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Lifespan</div>
            <div className="text-purple-300 font-bold text-sm">
              {isFadedAway ? '0 (Faded)' : `${remainingViews} views left`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-950/20 border border-rose-500/20">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Transmission Waves</div>
            <div className="text-rose-300 font-bold text-sm">
              {Math.max(1, Math.ceil(totalInfections / 3))} Waves
            </div>
          </div>
        </div>
      </div>

      {/* Contagion Events Slide-Down Drawer */}
      {showEventsDrawer && (
        <div className="bg-black/90 border-b border-rose-500/30 p-3 max-h-56 overflow-y-auto space-y-2 text-xs animate-in slide-in-from-top duration-200 z-30">
          <div className="flex items-center justify-between font-mono text-[11px] pb-1 border-b border-neutral-800">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Contagion Events History Log ({contagionEvents.length} Events)</span>
            </span>
            <span className="text-slate-400">
              Each unique infection awards +25 Spark Points
            </span>
          </div>

          {contagionEvents.length === 0 ? (
            <div className="text-center py-4 text-slate-400 font-mono text-[11px]">
              No contagion events recorded yet. Simulate or view this post to spread infections!
            </div>
          ) : (
            <div className="space-y-1.5">
              {contagionEvents.map((ev, index) => (
                <div
                  key={ev.id || `cev_${index}`}
                  className="p-2 rounded-lg bg-neutral-900/90 border border-amber-500/20 flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-400/60 flex items-center justify-center font-mono text-[10px] text-amber-300 shrink-0">
                      #{contagionEvents.length - index}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <span className="font-semibold text-white">
                          Viewed by {ev.viewerHandle || ev.viewerName}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-[10px]">{ev.timestamp}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400 text-[10px] font-bold">
                          +{ev.bountyPointsEarned} pts
                        </span>
                      </div>
                      <div className="text-slate-300 text-[10px] truncate mt-0.5">
                        {ev.newInfectionsCount > 0 ? (
                          <span className="text-emerald-300">
                            Auto-spread to feeds of: {ev.infectedUserNames?.join(', ') || `${ev.newInfectionsCount} contacts`}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            All contacts known to {ev.viewerHandle} were already infected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[10px]">
                    <span className="text-slate-400">Total hosts: {ev.totalInfectionsAfter}</span>
                    <div className="text-purple-300 text-[9px]">
                      {ev.lifespanRemainingAfter} views left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. D3 Canvas Area with Floating Zoom Controls */}
      <div ref={containerRef} className="relative flex-1 w-full bg-neutral-950/95 overflow-hidden min-h-[380px]">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full block cursor-grab active:cursor-grabbing select-none"
        />

        {/* Floating Zoom & Reset Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-xl p-1 z-20 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom & Center View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md border border-neutral-800/90 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-300 space-y-1 z-10 pointer-events-none shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
            <span>Center Node: Contagion Origin Post</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-rose-300" />
            <span>Infected Profiles: Radiating outward by contagion wave</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400" />
            <span>Pulses: Active infectious transmission links</span>
          </div>
        </div>

        {/* Empty state notice if 0 infections yet */}
        {infectedIds.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div className="p-4 rounded-2xl bg-black/85 border border-rose-500/40 max-w-sm pointer-events-auto backdrop-blur-md shadow-2xl">
              <Activity className="w-8 h-8 text-rose-400 mx-auto mb-2 animate-pulse" />
              <h4 className="text-sm font-bold text-rose-200 mb-1">Contagion Staged: Ready to Spread</h4>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                The post is primed with Viral power. Infecting other profiles will cause nodes to branch and radiate outward from the center post.
              </p>
              {onSimulateInfectNextProfile && (
                <button
                  type="button"
                  onClick={() => onSimulateInfectNextProfile(post.id)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white text-xs font-semibold shadow-[0_0_16px_rgba(244,63,94,0.6)] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Infect First Profile</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hover / Selection Detail Flyout Card */}
        {(hoveredNode || selectedNode) && (
          <div className="absolute top-4 left-4 max-w-xs bg-black/90 backdrop-blur-md border border-rose-500/60 rounded-xl p-3 shadow-[0_0_25px_rgba(244,63,94,0.4)] z-30 animate-in fade-in zoom-in-95 duration-150">
            {(() => {
              const node = hoveredNode || selectedNode!;
              const isPost = node.type === 'post';
              return (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={node.avatar}
                      alt={node.name}
                      referrerPolicy="no-referrer"
                      className={`w-10 h-10 rounded-full object-cover border-2 ${
                        isPost ? 'border-amber-400 ring-2 ring-rose-500' : 'border-rose-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate flex items-center gap-1">
                        <span>{node.name}</span>
                        {isPost && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 border border-rose-400">
                            Origin Post
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-rose-300 font-mono">{node.handle}</div>
                      {node.location && <div className="text-[10px] text-slate-400">📍 {node.location}</div>}
                    </div>
                  </div>

                  {node.bio && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 italic bg-neutral-900/60 p-1.5 rounded-lg border border-neutral-800">
                      “{node.bio}”
                    </p>
                  )}

                  <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{isPost ? 'Contagion Source' : `Infection Vector #${node.order}`}</span>
                    <span className="text-rose-400 font-semibold">
                      {isPost ? 'Center Zero' : `Wave ${node.wave} (${Math.round(node.targetRadialDistance)}px)`}
                    </span>
                  </div>

                  {!isPost && onViewProfile && (
                    <button
                      type="button"
                      onClick={() => onViewProfile(node.id)}
                      className="w-full mt-1 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Inspect Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 4. Footer Help Tip */}
      <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-rose-400" />
          <span>Click & drag nodes to test spring elasticity. Scroll to zoom. Hover over nodes for profile metadata.</span>
        </div>

        <span className="font-mono text-[10px] text-slate-500">
          D3 Force Simulation (v7) • Radial Topology
        </span>
      </div>
    </div>
  );
};

export default ViralSpreadGraph;
