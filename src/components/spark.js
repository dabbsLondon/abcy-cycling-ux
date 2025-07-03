export const buildPath = (points, width, height, padding = 4) => {
  if (!points.length) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (points.length - 1 || 1);
  return points
    .map((v, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}; 