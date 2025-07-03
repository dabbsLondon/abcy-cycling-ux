import React, { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../api';
import { buildPath } from './spark';

// helper to get Monday of the week
const startOfISOWeek = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift Sunday back 6, others to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const isSameISOWeek = (a, b) => startOfISOWeek(a).getTime() === startOfISOWeek(b).getTime();

const sumDistancesKm = (items) => items.reduce((acc, v) => acc + v, 0);

// Helper to decide color class
const getClassFromDelta = (delta) => {
  if (delta > 0) return 'green';
  if (delta < 0) return 'red';
  return 'blue';
};

// Convert year & week string to date (Monday of that ISO week)
const weekStringToDate = (str) => {
  const match = str.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const [, yrStr, wkStr] = match;
  const year = Number(yrStr);
  const week = Number(wkStr);
  // ISO week algorithm
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const isoWeekStart = simple;
  if (dow <= 4) {
    isoWeekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  return isoWeekStart;
};

const periodStringToDate = (str) => {
  if (!str || typeof str !== 'string') return null;
  if (/^\d{4}-W\d{2}$/.test(str)) return weekStringToDate(str);
  if (/^\d{4}-\d{2}$/.test(str)) return new Date(`${str}-01T00:00:00Z`); // month
  if (/^\d{4}$/.test(str)) return new Date(`${str}-01-01T00:00:00Z`); // year
  const d = new Date(str);
  return isNaN(d) ? null : d;
};

// Bar sparkline component
const BarSpark = ({ series }) => {
  const max = Math.max(...series) || 1;
  const barWidth = 16;
  const gap = 4;
  const height = 100;
  const width = series.length * (barWidth + gap);

  return (
    <svg className="sparkline bar" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* axes */}
      <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2={height} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {series.map((v, i) => {
        const h = (v / max) * (height - 20);
        const x = i * (barWidth + gap) + gap / 2;
        const y = height - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            fill="var(--bar-fill, rgba(255,255,255,0.35))"
            rx="2"
          />
        );
      })}
    </svg>
  );
};

const DistanceCard = ({ label, period, count = 1, compareSpan = 1 }) => {
  const [segments, setSegments] = useState(null); // array of {date, km}
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const isWeeklyToDate = period === 'week' && count === 1 && compareSpan === 1;
    const isYearCard = period === 'year';
    const fetchPeriod = isWeeklyToDate ? 'day' : isYearCard ? 'week' : period;
    const neededDays = 30; // enough days for safety
    const fetchCount = isWeeklyToDate
      ? neededDays
      : isYearCard
      ? 104 // 52 current + 52 previous weeks
      : count + compareSpan;

    fetchJson(`/stats?period=${fetchPeriod}&count=${fetchCount}`)
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length) {
          const mapped = data
            .map((d) => {
              const meters =
                typeof d.totalDistance === 'number'
                  ? d.totalDistance
                  : typeof d.distance === 'number'
                  ? d.distance
                  : undefined;
              if (typeof meters !== 'number') return undefined;
              const km = meters / 1000;
              let date = periodStringToDate(d.period ?? d.date ?? d.day ?? d.timestamp);
              if (!date) date = new Date(); // fallback placeholder
              return { km, date };
            })
            .filter(Boolean);
          // ensure newest first sorting when dates differ
          mapped.sort((a, b) => b.date - a.date);
          setSegments(mapped);
        } else {
          setError('No data');
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });
    return () => {
      mounted = false;
    };
  }, [period, count, compareSpan]);

  const { currentSum, prevSum, delta, spark } = useMemo(() => {
    if (!segments || !segments.length) return { currentSum: null, prevSum: null, delta: 0, spark: '' };
    const isWeeklyToDate = period === 'week' && count === 1 && compareSpan === 1;
    const isYearCard = period === 'year';

    let cur = 0;
    let prev = 0;
    let path = '';
    if (isWeeklyToDate) {
      // Construct week-to-date series (Mon..Sun) ensuring zeros.
      const latestDate = segments[0].date;
      const weekStart = startOfISOWeek(latestDate);
      // arrays indexes 0=Mon .. 6=Sun
      const dailySeries = Array(7).fill(0);
      segments.forEach((it) => {
        if (it.date < weekStart) return;
        const idx = (it.date.getUTCDay() + 6) % 7; // convert Sunday to 6
        dailySeries[idx] += it.km;
      });
      // Split into current vs previous week sums for delta
      cur = sumDistancesKm(dailySeries);

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
      const prevDailySeries = Array(7).fill(0);
      segments.forEach((it) => {
        if (it.date < prevWeekStart || it.date >= weekStart) return;
        const idx = (it.date.getUTCDay() + 6) % 7;
        prevDailySeries[idx] += it.km;
      });
      prev = sumDistancesKm(prevDailySeries);

      path = [...dailySeries].reverse(); // Will use array for bar spark
    } else if (period === 'week' && count === 4) {
      // Build arrays for current 4 weeks and previous 4 weeks with zero filling.
      const latestWeekStart = startOfISOWeek(segments[0].date);
      const makeWeekValue = (start) => {
        const entry = segments.find((it) => isSameISOWeek(it.date, start));
        return entry ? entry.km : 0;
      };

      const currentWeeks = [];
      for (let i = 0; i < 4; i++) {
        const ws = new Date(latestWeekStart);
        ws.setUTCDate(ws.getUTCDate() - i * 7);
        currentWeeks.push(makeWeekValue(ws));
      }

      const prevWeeks = [];
      for (let i = 4; i < 8; i++) {
        const ws = new Date(latestWeekStart);
        ws.setUTCDate(ws.getUTCDate() - i * 7);
        prevWeeks.push(makeWeekValue(ws));
      }

      cur = sumDistancesKm(currentWeeks);
      prev = sumDistancesKm(prevWeeks);

      path = [...currentWeeks].reverse(); // Will use array for bar spark
    } else if (period === 'year') {
      // Year card now uses 52 weekly totals
      const weeklySeries = segments.slice(0, 52).map((i) => i.km);
      const prevWeeklySeries = segments.slice(52, 104).map((i) => i.km);

      cur = sumDistancesKm(weeklySeries);
      prev = prevWeeklySeries.length ? sumDistancesKm(prevWeeklySeries) : cur;

      path = buildPath([...weeklySeries].reverse(), 180, 100);
    } else {
      const currentVals = segments.slice(0, count).map((i) => i.km);
      const prevVals = segments.slice(count, count + compareSpan).map((i) => i.km);
      cur = sumDistancesKm(currentVals);
      prev = prevVals.length ? sumDistancesKm(prevVals) : cur;

      const series = segments.slice(0, count + compareSpan).map((i) => i.km);

      if (period === 'year') {
        path = buildPath([...series].reverse(), 180, 60);
      } else {
        path = [...series].reverse();
      }
    }
    const d = cur - prev;
    return { currentSum: cur.toFixed(1), prevSum: prev, delta: d, spark: path };
  }, [segments, count, compareSpan]);

  const statusClass = getClassFromDelta(delta);

  return (
    <div className={`metric-card ${statusClass}`}>
      {error ? (
        <div className="metric-error">Error</div>
      ) : currentSum === null ? (
        <div className="metric-loading">...</div>
      ) : (
        <>
          <div className="metric-heading">{label}</div>
          <div className="metric-value" style={{ marginTop: '0.25rem' }}>{currentSum} <span className="unit">km</span></div>
          {Array.isArray(spark) ? (
            <BarSpark series={spark} />
          ) : spark ? (
            <svg className="sparkline line" viewBox="0 0 180 100" preserveAspectRatio="none">
              <line x1="0" y1="99" x2="180" y2="99" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <path d={spark} fill="none" stroke="var(--bar-fill, rgba(255,255,255,0.35))" strokeWidth="2" />
            </svg>
          ) : null}
        </>
      )}
    </div>
  );
};

export default DistanceCard;