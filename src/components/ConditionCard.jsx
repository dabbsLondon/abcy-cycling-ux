import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

const HISTORY_COUNT = 20;

const ConditionCard = () => {
  const [enduro, setEnduro] = useState(null);
  const [fitness, setFitness] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchJson('/enduro'), fetchJson('/fitness')])
      .then(([enduroVal, fitnessVal]) => {
        if (!mounted) return;
        setEnduro(typeof enduroVal === 'number' ? enduroVal : enduroVal?.value ?? enduroVal?.enduro ?? null);
        setFitness(typeof fitnessVal === 'number' ? fitnessVal : fitnessVal?.value ?? fitnessVal?.fitness ?? null);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="metric-card blue">
      {error ? (
        <div className="metric-error">Error</div>
      ) : enduro === null || fitness === null ? (
        <div className="metric-loading">...</div>
      ) : (
        <>
          <div className="metric-heading">Condition</div>
          <div className="condition-rows">
            <div className="condition-row row-red">
              <div className="metric-value" style={{ fontSize: '2rem' }}>{Number(enduro).toFixed(0)}</div>
              <div className="metric-subheading" style={{ marginTop: '0.25rem' }}>Enduro</div>
            </div>
            <div className="condition-row row-green">
              <div className="metric-value" style={{ fontSize: '2rem' }}>{Number(fitness).toFixed(0)}</div>
              <div className="metric-subheading" style={{ marginTop: '0.25rem' }}>Fitness</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConditionCard; 