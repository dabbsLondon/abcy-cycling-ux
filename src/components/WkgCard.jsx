import React, { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../api';
import { buildPath } from './spark';

const HISTORY_COUNT = 20;

const getClassFromDelta = (delta) => {
  if (delta > 0) return 'green';
  if (delta < 0) return 'red';
  return 'blue';
};

const WkgCard = () => {
  const [history, setHistory] = useState(null); // newest first array of numbers
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchJson(`/wkg/history?count=${HISTORY_COUNT}`)
      .then((data) => {
        if (!mounted) return;
        let values = [];
        if (Array.isArray(data)) {
          // Accept: number[] | {value:number}[] | {wkg:number}[]
          values = data
            .map((d) => {
              if (typeof d === 'number') return d;
              if (d && typeof d.wkg === 'number') return d.wkg;
              if (d && typeof d.value === 'number') return d.value;
              return undefined;
            })
            .filter((v) => typeof v === 'number');
        }
        if (values.length) setHistory(values);
        else setError('No data');
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const { current, delta, pathD } = useMemo(() => {
    if (!history || !history.length) return { current: null, delta: 0, pathD: '' };
    const curRaw = history[0];
    const cur = Number(curRaw);
    const prev = history.length > 1 ? Number(history[1]) : cur;
    const d = cur - prev;

    let path = '';
    if (history.length > 1) {
      path = buildPath([...history].reverse(), 180, 60);
    }
    return { current: cur.toFixed(2), delta: d, pathD: path };
  }, [history]);

  const statusClass = getClassFromDelta(delta);

  return (
    <div className={`metric-card ${statusClass}`}>
      {error ? (
        <div className="metric-error">Error</div>
      ) : current === null ? (
        <div className="metric-loading">...</div>
      ) : (
        <>
          <div className="metric-heading">W/kg</div>
          <div className="metric-value" style={{ marginTop: '0.25rem' }}>
            {current} <span className="unit">W/kg</span>
          </div>
          <div className="metric-label">Current</div>
          {pathD && (
            <svg className="sparkline" viewBox="0 0 180 60" preserveAspectRatio="none">
              <path d={pathD} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
            </svg>
          )}
        </>
      )}
    </div>
  );
};

export default WkgCard; 