import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';
import MapThumbnail from './MapThumbnail';

// Helper conversions
const metersToKm = (m) => m / 1000;
const metersToFeet = (m) => m * 3.28084;

// Ride summaries include a `trend` object describing how each metric
// compares to the rider's recent history. Values are strings such as
// 'very_high', 'high', 'normal', 'low' and 'very_low' calculated using
// the past 90 days of data. Older boolean `highlight` fields are still
// handled for backward compatibility.

const statusClass = (val) => {
  if (val === true || val === 'high' || val === 'very_high') return 'metric-high';
  if (val === 'low' || val === 'very_low') return 'metric-low';
  return '';
};

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
  const [summaries, setSummaries] = useState({}); // {id: summaryObj}

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

  // Fetch full summaries for each ride
  useEffect(() => {
    if (!rides || !rides.length) return;
    const idsToFetch = rides
      .map((r) => r.id ?? r.activity_id ?? r._id)
      .filter((id) => id && !summaries[id]);

    if (!idsToFetch.length) return;

    Promise.all(
      idsToFetch.map((id) =>
        fetchJson(`/activity/${id}/summary`)
          .then((s) => ({ id, summary: s }))
          .catch(() => ({ id, summary: null }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ id, summary }) => {
        if (summary) map[id] = summary;
      });
      if (Object.keys(map).length) {
        setSummaries((prev) => ({ ...prev, ...map }));
      }
    });
  }, [rides, summaries]);

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
        const rideData = { ...ride, ...(summaries[id] || {}) };

        const name = rideData.name ?? 'Ride';
        const distanceKm = metersToKm(rideData.distance ?? rideData.total_distance ?? 0);
        const elevFt = metersToFeet(rideData.total_elevation_gain ?? rideData.elevation_gain ?? 0);
        const moveSec = rideData.duration ?? rideData.moving_time ?? rideData.movingTime ?? rideData.elapsed_time ?? 0;
        const movingTimeStr = moveSec
          ? new Date(moveSec * 1000).toISOString().substring(11, 19)
          : null;
        const avgSpeedKph = rideData.average_speed ? rideData.average_speed * 3.6 : (moveSec ? distanceKm / (moveSec / 3600) : null);
        const maxSpeedKph = rideData.max_speed ? (rideData.max_speed * 3.6) : null;
        const tss = rideData.training_stress_score ?? rideData.tss;
        const ifVal = rideData.intensity_factor ?? rideData.intensity;
        const weightedPower = rideData.normalized_power ?? rideData.weighted_average_power ?? rideData.weighted_average_watts;
        const trend = rideData.trend ?? rideData.highlight ?? rideData.high ?? {};
        const desc = rideData.description ?? rideData.summary ?? '';
        const dateStr = (() => {
          const dateRaw = rideData.date ?? rideData.start_date ?? rideData.startTime ?? rideData.timestamp;
          if (!dateRaw) return '';
          const d = new Date(dateRaw);
          return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        })();

        // Map path
        let coords = null;
        try {
          const poly = rideData.map?.summary_polyline ?? rideData.summary_polyline ?? rideData.summaryPolyline ?? rideData.polyline;
          if (poly) {
            coords = decodePolyline(poly);
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
                {avgSpeedKph && (
                  <span className={statusClass(trend.avg_speed)}>
                    AvgSpd {avgSpeedKph.toFixed(1)} km/h
                  </span>
                )}
                {maxSpeedKph && (
                  <span className={statusClass(trend.max_speed)}>
                    Max {maxSpeedKph.toFixed(1)} km/h
                  </span>
                )}
                {tss && (
                  <span className={statusClass(trend.tss)}>
                    TSS {tss.toFixed?.(0) ?? tss}
                  </span>
                )}
                {ifVal && (
                  <span className={statusClass(trend.intensity)}>
                    Int {ifVal.toFixed?.(2) ?? ifVal}
                  </span>
                )}
                {weightedPower && (
                  <span className={statusClass(trend.power)}>
                    Pow {weightedPower} W
                  </span>
                )}
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