import React, { useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltip?: string;
}

interface SimpleBarChartProps {
  title: string;
  subtitle?: string;
  data: BarDatum[];
  color?: string;
  secondaryColor?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  unitSuffix?: string;
  maxFixed?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  title,
  subtitle,
  data,
  color = '#4F46E5',
  secondaryColor = '#10B981',
  primaryLabel,
  secondaryLabel,
  unitSuffix = '',
  maxFixed,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal =
    maxFixed ??
    Math.max(
      1,
      ...data.map((d) => d.value + (d.secondaryValue || 0))
    );

  const height = 190;
  const paddingTop = 20;
  const paddingBottom = 28;
  const chartHeight = height - paddingTop - paddingBottom;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {secondaryLabel && (
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: color }} />
              {primaryLabel}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: secondaryColor }} />
              {secondaryLabel}
            </span>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          Aucune donnée sur cette période.
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${Math.max(360, data.length * 48)} ${height}`}
            className="w-full h-48 overflow-visible"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + chartHeight * (1 - ratio);
              const val = Math.round(maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={32}
                    x2={Math.max(360, data.length * 48) - 8}
                    y1={y}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={28}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[9px] tabular-nums"
                  >
                    {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                    {unitSuffix}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, idx) => {
              const totalW = Math.max(360, data.length * 48) - 44;
              const slotW = totalW / data.length;
              const barW = Math.min(28, slotW * 0.58);
              const x = 38 + idx * slotW + (slotW - barW) / 2;

              const h1 = (d.value / maxVal) * chartHeight;
              const h2 = ((d.secondaryValue || 0) / maxVal) * chartHeight;
              const y1 = paddingTop + chartHeight - h1;
              const y2 = y1 - h2;

              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={`${d.label}-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {d.secondaryValue ? (
                    <rect
                      x={x}
                      y={y2}
                      width={barW}
                      height={Math.max(0, h2)}
                      rx={3}
                      fill={secondaryColor}
                      opacity={isHovered ? 1 : 0.88}
                    />
                  ) : null}
                  <rect
                    x={x}
                    y={y1}
                    width={barW}
                    height={Math.max(2, h1)}
                    rx={3}
                    fill={color}
                    opacity={isHovered ? 1 : 0.9}
                  />
                  <text
                    x={x + barW / 2}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-500 text-[9px] font-medium"
                  >
                    {d.label}
                  </text>
                  {isHovered && (
                    <text
                      x={x + barW / 2}
                      y={Math.max(12, (d.secondaryValue ? y2 : y1) - 6)}
                      textAnchor="middle"
                      className="fill-slate-900 text-[10px] font-bold"
                    >
                      {d.tooltip || `${d.value + (d.secondaryValue || 0)}${unitSuffix}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

interface OccupancyLineChartProps {
  title: string;
  subtitle?: string;
  data: { label: string; rate: number; detail?: string }[];
}

export const OccupancyLineChart: React.FC<OccupancyLineChartProps> = ({
  title,
  subtitle,
  data,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = Math.max(360, data.length * 48);
  const height = 190;
  const paddingTop = 20;
  const paddingBottom = 28;
  const chartHeight = height - paddingTop - paddingBottom;
  const plotW = width - 48;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? 38 + plotW / 2 : 38 + (i / (data.length - 1)) * plotW;
    const y = paddingTop + chartHeight * (1 - d.rate / 100);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${
          paddingTop + chartHeight
        } Z`
      : '';

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          Aucune donnée sur cette période.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = paddingTop + chartHeight * (1 - pct / 100);
              return (
                <g key={pct}>
                  <line x1={34} x2={width - 8} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <text x={30} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px] tabular-nums">
                    {pct}%
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill="#14B8A6" opacity={0.14} />}
            {linePath && <path d={linePath} fill="none" stroke="#14B8A6" strokeWidth={2.5} strokeLinejoin="round" />}

            {points.map((p, idx) => (
              <g
                key={`${p.label}-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === idx ? 5.5 : 3.5}
                  fill="#14B8A6"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <text x={p.x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[9px] font-medium">
                  {p.label}
                </text>
                {hoveredIdx === idx && (
                  <text x={p.x} y={Math.max(12, p.y - 10)} textAnchor="middle" className="fill-slate-900 text-[10px] font-bold">
                    {p.rate}% {p.detail ? `(${p.detail})` : ''}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};
