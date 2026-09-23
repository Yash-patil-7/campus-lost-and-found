import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { FileQuestion, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'ID Cards / Documents',
  'Books & Stationery',
  'Bags & Wallets',
  'Keys',
  'Clothing & Accessories',
  'Other',
];

const LOCATIONS = [
  'Computer Lab 204',
  'Central Library',
  'Campus Canteen',
  'Main Building 1st Floor',
  'Auditorium',
  'Sports Complex',
  'Science Block',
  'Admin Office',
  'Parking Area',
  'Other',
];

export const ReportLostPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('Computer Lab 204');
  const [dateLost, setDateLost] = useState(new Date().toISOString().split('T')[0]);
  const [timeLost, setTimeLost] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('brand', brand);
      formData.append('color', color);
      formData.append('location', location);
      formData.append('date_lost', dateLost);
      formData.append('time_lost', timeLost);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await apiFetch('/lost-items', {
        method: 'POST',
        body: formData,
      });

      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit lost item report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
          <FileQuestion className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white">Report Lost Item</h1>
          <p className="text-xs text-slate-400">
            Submit item details to generate an official Case ID and activate matching.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Item Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Black Casio Scientific Calculator"
              className="w-full glass-input text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full glass-input text-xs bg-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Known Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full glass-input text-xs bg-slate-900"
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand / Model</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Casio / HP / Apple"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black / Silver"
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date Lost</label>
              <input
                type="date"
                required
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Approximate Time</label>
              <input
                type="time"
                value={timeLost}
                onChange={(e) => setTimeLost(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Detailed Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide identifying features, scratches, stickers, or unique marks..."
              className="w-full glass-input text-xs resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Upload Photograph</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-1 block">
                <Upload className="w-6 h-6 mx-auto text-slate-500" />
                <span className="text-xs text-slate-300 font-semibold block">
                  {imageFile ? imageFile.name : 'Click to upload image'}
                </span>
                <span className="text-[10px] text-slate-500 block">PNG, JPG, WEBP up to 10MB</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Submitting Report...' : 'Submit Lost Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
