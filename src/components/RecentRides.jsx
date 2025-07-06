import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';
import MapThumbnail from './MapThumbnail';

// Helper conversions
const metersToKm = (m) => m / 1000;
const metersToFeet = (m) => m * 3.28084;

// Polyline decoding (returns array of [lat, lng])
const decodePolyline = (str) => {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates = [];

  while (index < str.length) {
    let shift = 0,
      result = 0,
      byte = null;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat * 1e-5, lng * 1e-5]);
  }
  return coordinates;
};

/**
 * Convert lat/lng array to SVG path within given width/height
 */
const buildMapPath = (coords, width = 200, height = 120, padding = 5) => {
  if (!coords.length) return '';
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1e-5;
  const lngRange = maxLng - minLng || 1e-5;
  const scale = Math.min((width - padding * 2) / lngRange, (height - padding * 2) / latRange);

  const points = coords.map(([lat, lng]) => {
    const x = (lng - minLng) * scale + padding;
    const y = height - ((lat - minLat) * scale + padding);
    return [x.toFixed(2), y.toFixed(2)];
  });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  return d;
};

// Build vibrant gradient scaling with distance (blue->orange->pink)
const gradientStyleForDistance = (km) => {
  // Map distance 0-120 km to hue 210 (blue) -> 330 (pink)
  const capped = Math.min(km, 120);
  const hue = 210 + (capped / 120) * 120; // 210-330
  const hue2 = hue + 20;
  return {
    background: `linear-gradient(135deg, hsl(${hue.toFixed(0)}, 80%, 45%) 0%, hsl(${hue2.toFixed(0)}, 70%, 25%) 100%)`,
  };
};

// Compute center of coordinates array
const coordsCenter = (coords)=>{
  if(!coords || !coords.length) return [0,0];
  const lats = coords.map(c=>c[0]);
  const lngs = coords.map(c=>c[1]);
  const lat = (Math.min(...lats)+Math.max(...lats))/2;
  const lng = (Math.min(...lngs)+Math.max(...lngs))/2;
  return [lat.toFixed(5), lng.toFixed(5)];
};

const RecentRides = ({ count = 10 }) => {
  const [rides, setRides] = useState(null);
  const [error, setError] = useState(null);
  const [extraSummaries, setExtraSummaries] = useState({}); // {id: polyline}

  useEffect(() => {
    let mounted = true;
    fetchJson(`/activities?count=${count}`)
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length) {
          setRides(data.slice(0, count));
        } else {
          setError('No recent rides');
        }
      })
      .catch((e) => mounted && setError(e.message));
    return () => {
      mounted = false;
    };
  }, [count]);

  // Fetch summary polyline for rides lacking it
  useEffect(() => {
    if (!rides || !rides.length) return;
    const toFetch = rides.filter((r) => {
      const id = r.id ?? r.activity_id ?? r._id;
      const existingPoly = r.map?.summary_polyline || r.summary_polyline || r.summaryPolyline || extraSummaries[id];
      return !existingPoly && id;
    });
    if (!toFetch.length) return;
    Promise.all(
      toFetch.map((r) => {
        const id = r.id ?? r.activity_id ?? r._id;
        return fetchJson(`/activity/${id}/summary`)
          .then((s) => ({ id, poly: s?.map?.summary_polyline || s?.summary_polyline || s?.summaryPolyline || '' }))
          .catch(() => ({ id, poly: '' }));
      })
    ).then((results) => {
      const map = {};
      results.forEach((res) => {
        if (res.poly) map[res.id] = res.poly;
      });
      if (Object.keys(map).length) {
        setExtraSummaries((prev) => ({ ...prev, ...map }));
      }
    });
  }, [rides]);

  if (error) {
    return (
      <div className="rides-list">
        <div className="ride-card gradient-pink">
          <div className="metric-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!rides) {
    return (
      <div className="rides-list">
        <div className="ride-card gradient-blue">
          <div className="metric-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rides-list">
      {rides.map((ride) => {
        const id = ride.id ?? ride.activity_id ?? ride.start_date;
        const name = ride.name ?? 'Ride';
        const distanceKm = metersToKm(ride.distance ?? ride.total_distance ?? 0);
        const elevFt = metersToFeet(ride.total_elevation_gain ?? ride.elevation_gain ?? 0);
        const moveSec = ride.moving_time ?? ride.movingTime ?? ride.elapsed_time ?? 0;
        const movingTimeStr = moveSec
          ? new Date(moveSec * 1000).toISOString().substring(11, 19)
          : null;
        const avgSpeedKph = (ride.average_speed ? ride.average_speed * 3.6 : null) || (moveSec ? distanceKm / (moveSec / 3600) : null);
        const maxSpeedKph = ride.max_speed ? (ride.max_speed * 3.6) : null;
        const tss = ride.tss ?? ride.training_stress_score;
        const ifVal = ride.intensity_factor ?? ride.intensity;
        const weightedPower = ride.weighted_average_power ?? ride.weighted_average_watts ?? ride.weightedPower ?? ride.weighted_power ?? ride.weightedAveragePower ?? ride.weightedAverageWatts ?? ride.weighted_power_avg;
        const desc = ride.description ?? ride.summary ?? '';
        const dateStr = (() => {
          const dateRaw = ride.date ?? ride.start_date ?? ride.startTime ?? ride.timestamp;
          if (!dateRaw) return '';
          const d = new Date(dateRaw);
          return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        })();

        // Map path
        let pathD = '';
        let coords = null;
        try {
          const poly = ride.map?.summary_polyline ?? ride.summary_polyline ?? ride.summaryPolyline ?? ride.polyline ?? extraSummaries[id];
          if (poly) {
            coords = decodePolyline(poly);
            pathD = buildMapPath(coords);
          }
        } catch (e) { /* ignore */ }

        return (
          <div key={id} className="ride-card" style={gradientStyleForDistance(distanceKm)}>
            <div className="ride-info">
              <div className="ride-title">{name}</div>
              <div className="ride-stats">
                {distanceKm.toFixed(1)} km · {elevFt.toFixed(0)} ft {avgSpeedKph ? `· ${avgSpeedKph.toFixed(1)} km/h` : ''}
              </div>
              <div className="ride-metrics">
                {movingTimeStr && <span>Time {movingTimeStr}</span>}
                {avgSpeedKph && <span>AvgSpd {avgSpeedKph.toFixed(1)} km/h</span>}
                {maxSpeedKph && <span>Max {maxSpeedKph.toFixed(1)} km/h</span>}
                {tss && <span>TSS {tss.toFixed?.(0) ?? tss}</span>}
                {ifVal && <span>Int {ifVal.toFixed?.(2) ?? ifVal}</span>}
                {weightedPower && <span>Pow {weightedPower} W</span>}
              </div>
              {desc && <p className="ride-desc">{desc}</p>}
              {dateStr && <div className="ride-date">{dateStr}</div>}
            </div>
            {coords && <MapThumbnail coords={coords} />}
          </div>
        );
      })}
    </div>
  );
};

export default RecentRides; 