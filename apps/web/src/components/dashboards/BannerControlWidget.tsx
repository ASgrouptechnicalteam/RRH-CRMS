import React, { useState, useEffect } from 'react';
import { Image, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

export const BannerControlWidget: React.FC = () => {
  const { accessToken } = useAuth();
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/announcement`)
      .then((res) => res.json())
      .then((data) => {
        if (data.imageUrl) setImageUrl(data.imageUrl);
        if (data.active !== undefined) setActive(data.active);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ imageUrl, active }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-5 h-5 text-indigo-500" />
        <h3 className="font-extrabold text-slate-900 text-lg">Global Announcement Banner</h3>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Configure the image banner that appears at the top of every dashboard. Recommended dimensions: <strong>1200x200 pixels</strong> (or similar wide aspect ratio without compression).
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
          <input
            type="text"
            placeholder="https://example.com/banner.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="block text-sm font-bold text-slate-900">Banner Status</span>
            <span className="text-[10px] text-slate-500">Toggle visibility across all apps</span>
          </div>
          <button
            onClick={() => setActive(!active)}
            className={`p-1 rounded-full transition-colors ${active ? 'text-emerald-500' : 'text-slate-400'}`}
          >
            {active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>

        {imageUrl && active && (
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 border-b border-slate-200">Preview</div>
            <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-[150px] object-cover" />
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving...' : saveSuccess ? <><Check className="w-4 h-4" /> Saved Successfully</> : 'Save Banner Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
