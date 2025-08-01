import React, { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../api';
import { buildPath } from './spark';

const IntensityCard = () => {
  const [weekly, setWeekly] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchJson('/stats?period=week&count=8')
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          const arr = data.map((d) => d.averageIntensityFactor ?? d.intensity_factor ?? d.if ?? 0);
          setWeekly(arr);
        } else setError('No data');
      })
      .catch((err) => mounted && setError(err.message));
    return () => {
      mounted = false;
    };
  }, []);

  const { cur, prev, linePath } = useMemo(() => {
    if (!weekly || !weekly.length) return { cur: null, prev: null, linePath: [] };
    const series = weekly.slice(0, 4);
    const prevSeries = weekly.slice(4, 8);
    const avg = series.reduce((a, b) => a + b, 0) / series.length;
    const prevAvg = prevSeries.reduce((a, b) => a + b, 0) / prevSeries.length;
    return { cur: avg, prev: prevAvg, linePath: buildPath([...weekly.slice(0,52)].reverse(), 180, 100) };
  }, [weekly]);

  const delta = cur - prev;
  const statusClass = delta > 0 ? 'green' : delta < 0 ? 'red' : 'blue';

  return (
    <div className={`metric-card ${statusClass}`}>
      {error ? (
        <div className="metric-error">Error</div>
      ) : cur === null ? (
        <div className="metric-loading">...</div>
      ) : (
        <>
          <div className="metric-heading">Intensity</div>
          <div className="metric-value" style={{ marginTop: '0.25rem' }}>{cur.toFixed(2)}</div>
          <svg className="sparkline line" viewBox="0 0 180 100" preserveAspectRatio="none">
            <line x1="0" y1="99" x2="180" y2="99" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <path d={linePath} fill="none" stroke="var(--bar-fill, rgba(255,255,255,0.35))" strokeWidth="2" />
          </svg>
        </>
      )}
    </div>
  );
};

export default IntensityCard; 