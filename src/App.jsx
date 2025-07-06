import React from 'react';
import WkgCard from './components/WkgCard';
import ConditionCard from './components/ConditionCard';
import TssCard from './components/TssCard';
import IntensityCard from './components/IntensityCard';
import DistanceSummaryCard from './components/DistanceSummaryCard';
import RecentRides from './components/RecentRides';

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
        {/* RECENT RIDES – MAIN COLUMN */}
        <section className="main-column">
          <h2 className="section-title">Recent Rides</h2>
          <RecentRides />
        </section>

        {/* RIGHT SIDEBAR WITH METRICS */}
        <aside className="sidebar">
          <WkgCard />
          <ConditionCard />
          <DistanceSummaryCard />
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
        </aside>
      </div>
    </div>
  );
};

export default App; 