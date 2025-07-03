import React, { useEffect, useState, useMemo } from 'react';
import { fetchJson } from '../api';
import { buildPath } from './spark';
import BarSpark from './BarSpark';

const sum = (arr) => arr.reduce((a,b)=>a+b,0);

const DistanceSummaryCard = () => {
  const [weeks, setWeeks] = useState(null); // km per week latest first (up to 104)
  const [days, setDays] = useState(null);  // km per day latest first 14
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchJson('/stats?period=week&count=104'),
      fetchJson('/stats?period=day&count=14'),
    ])
      .then(([weekData, dayData]) => {
        if (!mounted) return;
        if (Array.isArray(weekData)) {
          const wk = weekData.map((d) => (d.distance ?? d.totalDistance ?? 0) / 1000);
          setWeeks(wk);
        }
        if (Array.isArray(dayData)) {
          const dy = dayData.map((d) => (d.distance ?? d.totalDistance ?? 0) / 1000);
          setDays(dy);
        }
      })
      .catch((e) => mounted && setError(e.message));
    return () => { mounted = false; };
  }, []);

  const rows = useMemo(() => {
    if (!weeks || !weeks.length || !days || !days.length) return null;

    // 12 months
    const cur52 = weeks.slice(0,52);
    const prev52 = weeks.slice(52,104);
    const m12Val = sum(cur52);
    const m12Prev = sum(prev52);
    const m12Delta = m12Val - m12Prev;
    const m12Path = buildPath([...cur52].reverse(), 180, 100);

    // 6 weeks
    const cur6 = weeks.slice(0,6);
    const prev6 = weeks.slice(6,12);
    const w6Val = sum(cur6);
    const w6Prev = sum(prev6);
    const w6Delta = w6Val - w6Prev;
    const w6Path = buildPath([...cur6].reverse(), 180, 40);

    // last week (Mon-Sun) assume weeks[0] corresponds to last completed week, but we have daily latest first
    const cur7 = days.slice(0,7);
    const prev7 = days.slice(7,14);
    const w1Val = sum(cur7);
    const w1Prev = sum(prev7);
    const w1Delta = w1Val - w1Prev;
    const w1Path = buildPath([...cur7].reverse(), 180, 40);

    const status = (d)=> d>0? 'green': d<0? 'red':'blue';

    return [
      {title:'Last 12 Months', value:m12Val.toFixed(0), path:m12Path, cls:status(m12Delta), type:'line'},
      {title:'Last 6 Weeks', value:w6Val.toFixed(0), bars:[...cur6].reverse(), cls:status(w6Delta), type:'bar'},
      {title:'Last Week', value:w1Val.toFixed(0), bars:[...cur7].reverse(), cls:status(w1Delta), type:'bar'},
    ];
  }, [weeks, days]);

  if (error) return <div className="metric-card red"><div className="metric-error">Error</div></div>;
  if (!rows) return <div className="metric-card blue"><div className="metric-loading">...</div></div>;

  return (
    <div className="metric-card blue distance-summary">
      <div className="metric-heading">Distance</div>
      <div className="condition-rows" style={{ marginTop: '0.75rem' }}>
        {rows.map((r,i)=>(
          <div key={i} className={`condition-row row-${r.cls} horiz`}>
            <div style={{display:'flex', flexDirection:'column', minWidth:'100px'}}>
              <div className="metric-subheading">{r.title}</div>
              <div className="metric-value" style={{ fontSize:'1.6rem' }}>{r.value}</div>
            </div>
            {r.type==='bar' ? (
              <BarSpark series={r.bars} height={100} />
            ) : (
              <svg className="sparkline" viewBox="0 0 180 100" preserveAspectRatio="none" style={{flex:1}}>
                <path d={r.path} fill="none" stroke="var(--bar-fill, rgba(255,255,255,0.35))" strokeWidth="2" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistanceSummaryCard; 