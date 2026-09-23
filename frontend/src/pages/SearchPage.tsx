import React, { useState, useEffect } from 'react';
import { LostItem, FoundItem } from '../types';
import { apiFetch } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, Calendar, MapPin, Tag, FileQuestion, FileCheck2, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['All', 'Electronics', 'ID Cards / Documents', 'Books & Stationery', 'Bags & Wallets', 'Keys', 'Clothing & Accessories', 'Other'];
const LOCATIONS = ['All', 'Computer Lab 204', 'Central Library', 'Campus Canteen', 'Main Building 1st Floor', 'Auditorium', 'Sports Complex', 'Science Block', 'Admin Office', 'Parking Area', 'Other'];

export const SearchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOST' | 'FOUND'>('LOST');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      if (activeTab === 'LOST') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        if (selectedLocation !== 'All') params.append('location', selectedLocation);

        const res = await apiFetch<LostItem[]>(`/lost-items?${params.toString()}`);
        setLostItems(res);
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        if (selectedLocation !== 'All') params.append('location', selectedLocation);

        const res = await apiFetch<FoundItem[]>(`/found-items?${params.toString()}`);
        setFoundItems(res);
      }
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-400" />
            Campus Lost & Found Search Index
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search active campus lost and found cases with privacy safeguards.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('LOST')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'LOST'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" /> Lost Items Index
          </button>
          <button
            onClick={() => setActiveTab('FOUND')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'FOUND'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Found Items Index
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, brand, description, or Case ID..."
            className="w-full glass-input text-xs pl-9"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full glass-input text-xs bg-slate-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full glass-input text-xs bg-slate-900"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                Location: {l}
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Results Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading search index...</div>
      ) : activeTab === 'LOST' ? (
        lostItems.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">No lost items found matching your filters.</p>
            <p>Try adjusting your search terms or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lostItems.map((item) => (
              <div key={item.id} className="glass-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-400">{item.case_id}</span>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="font-bold text-sm text-slate-100">{item.title}</div>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>

                  <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.category} {item.brand ? `(${item.brand})` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lost on {item.date_lost}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Reporter: {item.reporter_name || 'Campus Student'}</span>
                  {item.image_url ? (
                    <span className="text-sky-400 font-semibold flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Photo Attached
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )
      ) : foundItems.length === 0 ? (
        <div className="glass-panel p-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">No found items matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foundItems.map((item) => (
            <div key={item.id} className="glass-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-400">{item.case_id}</span>
                  <StatusBadge status={item.status} />
                </div>

                <div className="font-bold text-sm text-slate-100">{item.title}</div>
                <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>

                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.category} {item.brand ? `(${item.brand})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Found on {item.date_found}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Finder: {item.finder_name || 'Campus Student'}</span>
                {item.image_url ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Photo Attached
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
