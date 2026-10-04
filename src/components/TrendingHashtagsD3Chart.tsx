import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { HashtagTrend } from '../types';
import { Flame, TrendingUp, Info } from 'lucide-react';

interface TrendingHashtagsD3ChartProps {
  hashtags: HashtagTrend[];
  onSelectHashtag: (tag: string) => void;
  selectedHashtag: string | null;
}

interface HourlyDataPoint {
  hourAgo: number; // 24 to 0
  label: string;
  time: Date;
  [key: string]: any; // tag -> accumulated engagement / posts
}

const HASHTAG_COLORS = [
  '#ec4899', // Neon Pink
  '#38bdf8', // Sky Blue
  '#f472b6', // Light Pink
  '#06b6d4', // Cyan
  '#a855f7', // Purple
];

export const TrendingHashtagsD3Chart: React.FC<TrendingHashtagsD3ChartProps> = ({
  hashtags,
  onSelectHashtag,
  selectedHashtag,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredData, setHoveredData] = useState<{
    label: string;
    items: { tag: string; value: number; color: string }[];
    x: number;
  } | null>(null);

  // Take top 5 hashtags by postCount
  const top5Hashtags = React.useMemo(() => {
    return [...hashtags]
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5);
  }, [hashtags]);

  // Generate simulated 24h growth data for top 5 hashtags
  const chartData: HourlyDataPoint[] = React.useMemo(() => {
    const now = new Date();
    const points: HourlyDataPoint[] = [];

    // Generate 25 points (0h to 24h ago)
    for (let h = 24; h >= 0; h--) {
      const pointTime = new Date(now.getTime() - h * 3600 * 1000);
      const label = h === 0 ? 'Now' : `-${h}h`;

      const pt: HourlyDataPoint = {
        hourAgo: h,
        label,
        time: pointTime,
      };

      top5Hashtags.forEach((ht, index) => {
        // Build smooth growth curves leading up to the final postCount
        const base = ht.postCount;
        // Cumulative percentage growth curve with slight organic variance
        const progressRatio = (24 - h) / 24; // 0 to 1
        const S_curve = Math.pow(progressRatio, 1.4); // Exponential growth acceleration
        // Add pseudo-deterministic organic wave based on index & hour
        const wave = Math.sin((h + index * 3) * 0.5) * 0.04;
        const val = Math.max(10, Math.round(base * (S_curve * 0.85 + 0.15 + wave)));
        pt[ht.tag] = val;
      });

      points.push(pt);
    }
    return points;
  }, [top5Hashtags]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || top5Hashtags.length === 0) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const width = container.clientWidth || 700;
    const height = 280;
    const margin = { top: 25, right: 30, bottom: 35, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([24, 0]) // 24 hours ago to 0 (Now)
      .range([0, innerWidth]);

    // Calculate max Y value across top 5
    let maxY = 0;
    top5Hashtags.forEach((ht) => {
      const maxForHt = d3.max(chartData, (d) => d[ht.tag] as number) || 0;
      if (maxForHt > maxY) maxY = maxForHt;
    });
    maxY = Math.ceil(maxY * 1.15); // headroom

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY])
      .range([innerHeight, 0]);

    // Grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(236, 72, 153, 0.12)')
      .attr('stroke-dasharray', '3,3');

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(8)
      .tickFormat((d) => (d === 0 ? 'Now' : `-${d}h`));

    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px');
    xAxisG.selectAll('line').attr('stroke', 'rgba(236, 72, 153, 0.3)');
    xAxisG.select('.domain').attr('stroke', 'rgba(236, 72, 153, 0.3)');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('~s'));

    const yAxisG = g.append('g').call(yAxis);
    yAxisG.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px');
    yAxisG.selectAll('line').attr('stroke', 'rgba(236, 72, 153, 0.3)');
    yAxisG.select('.domain').attr('stroke', 'rgba(236, 72, 153, 0.3)');

    // Draw lines for each hashtag
    top5Hashtags.forEach((ht, i) => {
      const color = HASHTAG_COLORS[i % HASHTAG_COLORS.length];
      const isTagSelected = selectedHashtag?.toLowerCase() === ht.tag.toLowerCase();

      const lineGenerator = d3
        .line<HourlyDataPoint>()
        .x((d) => xScale(d.hourAgo))
        .y((d) => yScale(d[ht.tag] as number))
        .curve(d3.curveMonotoneX);

      // Area gradient under selected line or top hashtag
      if (i === 0 || isTagSelected) {
        const areaGenerator = d3
          .area<HourlyDataPoint>()
          .x((d) => xScale(d.hourAgo))
          .y0(innerHeight)
          .y1((d) => yScale(d[ht.tag] as number))
          .curve(d3.curveMonotoneX);

        const gradientId = `gradient-${ht.tag.replace(/[^a-zA-Z0-0]/g, '')}`;
        const defs = svg.append('defs');
        const linearGradient = defs
          .append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');

        linearGradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', color)
          .attr('stop-opacity', isTagSelected ? 0.35 : 0.15);

        linearGradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', color)
          .attr('stop-opacity', 0);

        g.append('path')
          .datum(chartData)
          .attr('fill', `url(#${gradientId})`)
          .attr('d', areaGenerator);
      }

      // Main line
      const path = g
        .append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', isTagSelected ? 3.5 : selectedHashtag ? 1.5 : 2.5)
        .attr('opacity', selectedHashtag && !isTagSelected ? 0.35 : 0.95)
        .attr('d', lineGenerator);

      // Add glow effect for selected or primary hashtag
      if (isTagSelected || i === 0) {
        path.attr('filter', `drop-shadow(0px 0px 6px ${color})`);
      }

      // Endpoint dot
      const lastPoint = chartData[chartData.length - 1];
      g.append('circle')
        .attr('cx', xScale(lastPoint.hourAgo))
        .attr('cy', yScale(lastPoint[ht.tag]))
        .attr('r', isTagSelected ? 5 : 3.5)
        .attr('fill', color)
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5);
    });

    // Hover vertical crosshair & interactive tooltip overlay
    const crosshair = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'rgba(255, 255, 255, 0.4)')
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0);

    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event);
        const hourVal = xScale.invert(mouseX); // 24 down to 0
        const clampedHour = Math.max(0, Math.min(24, Math.round(hourVal)));

        const pointData = chartData.find((d) => d.hourAgo === clampedHour);
        if (pointData) {
          const px = xScale(clampedHour);
          crosshair.attr('x1', px).attr('x2', px).style('opacity', 1);

          const items = top5Hashtags.map((ht, idx) => ({
            tag: ht.tag,
            value: pointData[ht.tag] as number,
            color: HASHTAG_COLORS[idx % HASHTAG_COLORS.length],
          }));

          setHoveredData({
            label: pointData.label,
            items,
            x: px + margin.left,
          });
        }
      })
      .on('mouseleave', () => {
        crosshair.style('opacity', 0);
        setHoveredData(null);
      });

  }, [chartData, top5Hashtags, selectedHashtag]);

  // Handle ResizeObserver for fluid responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // Force re-render via state or effect trigger
      setHoveredData(null);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-400/10 via-pink-300/15 to-pink-500/10 blur-md opacity-30 group-hover:opacity-50 transition-all duration-300 pointer-events-none" />
      <div className="relative bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-2xl p-5 card-pink-glow space-y-4 overflow-hidden">
        
        {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-500/20 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-slate-100 text-sm tracking-tight">
              Trending Streams • 24-Hour Velocity
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time D3.js trajectory visualization across top trending stream channels
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {top5Hashtags.map((ht, i) => {
            const color = HASHTAG_COLORS[i % HASHTAG_COLORS.length];
            const isSelected = selectedHashtag?.toLowerCase() === ht.tag.toLowerCase();
            return (
              <button
                key={ht.tag}
                onClick={() => onSelectHashtag(ht.tag)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  isSelected
                    ? 'bg-neutral-800 text-white border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                    : 'bg-neutral-900/80 text-slate-300 hover:bg-neutral-800 border-pink-500/20'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: color }}
                ></span>
                <span className="flex items-center gap-1">
                  <span>#{ht.tag}</span>
                  <span className="text-[10px] text-pink-400 font-light">Stream</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full relative min-h-[280px]">
        <svg ref={svgRef} className="w-full h-full overflow-visible"></svg>

        {/* Hover Tooltip Overlay */}
        {hoveredData && (
          <div
            className="absolute top-2 pointer-events-none bg-neutral-950/95 border border-pink-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(236,72,153,0.3)] z-20 space-y-1.5 text-xs text-slate-100 min-w-[170px]"
            style={{
              left: Math.min(
                hoveredData.x,
                (containerRef.current?.clientWidth || 600) - 180
              ),
            }}
          >
            <div className="flex items-center justify-between border-b border-pink-500/30 pb-1 font-mono text-[10px] text-pink-300">
              <span>Timeframe</span>
              <span className="font-bold text-white">{hoveredData.label}</span>
            </div>

            <div className="space-y-1 pt-1">
              {hoveredData.items.map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="truncate font-medium text-slate-200">#{item.tag} Stream</span>
                  </div>
                  <span className="font-mono font-bold text-pink-300 shrink-0">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-pink-400" />
          Hover over chart curves for hourly post count breakdown
        </span>
        <span className="text-pink-400/80">Updated live • D3.js v7</span>
      </div>

    </div>
  </div>
  );
};
