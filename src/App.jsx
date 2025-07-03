import React from 'react';
import WkgCard from './components/WkgCard';
import DistanceCard from './components/DistanceCard';
import ConditionCard from './components/ConditionCard';
import TssCard from './components/TssCard';
import IntensityCard from './components/IntensityCard';
import DistanceSummaryCard from './components/DistanceSummaryCard';

const App = () => {
  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="logo-wrapper">
          <img src="/designs/logo.png" alt="ABCY Logo" className="logo-img" />
        </div>
        <div className="user-wrapper">
          <span className="username">icker19</span>
          <div className="avatar" />
        </div>
      </nav>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <section className="main-column">
          {/* SUMMARY */}
          <h2 className="section-title">Summary</h2>
          <div className="summary-grid">
            <WkgCard />
            <ConditionCard />
            <DistanceSummaryCard />
          </div>

          {/* Metrics / Charts Grid */}
          <div className="small-charts-grid">
            <TssCard />
            <IntensityCard />
            <div className="chart-card gradient-orange">
              <div className="chart-title">Power</div>
              <div className="chart-sub">Progression over time</div>
            </div>
            <div className="chart-card gradient-pink">
              <div className="chart-title">Heart Rate</div>
              <div className="chart-sub">Progression over time</div>
            </div>
          </div>

          {/* RECENT RIDES */}
          <h2 className="section-title">Recent Rides</h2>
          <div className="rides-grid">
            <div className="ride-card gradient-orange">
              <div className="ride-title">Mountain Loop</div>
              <div className="ride-stats">25.4 mi · 1,347 ft</div>
              <div className="chart-placeholder" />
              <p className="ride-desc">Challenging loop ahead sustained climbs.</p>
              <div className="ride-date">Mar 15, 2024</div>
            </div>
            <div className="ride-card gradient-pink">
              <div className="ride-title">Valley Ride</div>
              <div className="ride-stats">32.1 mi · 1,375 ft</div>
              <div className="chart-placeholder" />
              <p className="ride-desc">Good effort at a moderate pace.</p>
              <div className="ride-date">Mar 16, 2024</div>
            </div>
            <div className="ride-card gradient-blue">
              <div className="ride-title">Coastal Route</div>
              <div className="ride-stats">21.0 mi · 567 ft</div>
              <div className="chart-placeholder" />
              <p className="ride-desc">Better test time on a segment</p>
              <div className="ride-date">Mar 14, 2024</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App; 