import React, { useState, useEffect } from 'react';
import { AnalyticsData } from '../types';
import { apiFetch } from '../api/client';
import { BarChart3, TrendingUp, Clock, Tag, MapPin, CheckCircle2 } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AnalyticsData>('/admin/analytics')
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load analytics', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Calculating campus recovery metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Campus Lost & Found Recovery Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Measured metrics calculated directly from system of record database entries.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Overall Recovery Rate <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{data.recovery_rate_percent}%</div>
          <p className="text-[10px] text-slate-500">Items returned / total reported lost</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Avg Recovery Time <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-sky-400">{data.avg_recovery_time_days} days</div>
          <p className="text-[10px] text-slate-500">From lost report to final handover</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Avg Time to Handover <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{data.avg_time_to_handover_hours} hrs</div>
          <p className="text-[10px] text-slate-500">From found report to admin receipt</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Total Returned <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{data.total_returned} items</div>
          <p className="text-[10px] text-slate-500">Verified and handed over to owner</p>
        </div>
      </div>

      {/* Category & Location Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Tag className="w-4 h-4 text-sky-400" /> Category Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(data.category_distribution).map(([cat, count]) => {
              const pct = data.total_lost > 0 ? Math.round((count / data.total_lost) * 100) : 0;
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{cat}</span>
                    <span className="font-mono text-slate-400">{count} items ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" /> Location Concentration Heatmap
          </h2>
          <div className="space-y-3">
            {Object.entries(data.location_distribution).map(([loc, count]) => {
              const pct = data.total_lost > 0 ? Math.round((count / data.total_lost) * 100) : 0;
              return (
                <div key={loc} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{loc}</span>
                    <span className="font-mono text-slate-400">{count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
