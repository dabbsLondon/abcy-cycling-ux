import React from 'react';

const BarSpark = ({ series, height = 60 }) => {
  const max = Math.max(...series) || 1;
  const barWidth = 16;
  const gap = 4;
  const svgHeight = height;
  const width = series.length * (barWidth + gap);

  return (
    <svg
      className="sparkline bar"
      viewBox={`0 0 ${width} ${svgHeight}`}
      preserveAspectRatio="none"
      style={{ height: `${height}px`, marginTop: 0 }}
    >
      <line x1="0" y1={svgHeight - 1} x2={width} y2={svgHeight - 1} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2={svgHeight} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {series.map((v, i) => {
        const h = (v / max) * (svgHeight - 20);
        const x = i * (barWidth + gap) + gap / 2;
        const y = svgHeight - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} fill="var(--bar-fill, rgba(255,255,255,0.35))" rx="2" />;
      })}
    </svg>
  );
};

export default BarSpark; 