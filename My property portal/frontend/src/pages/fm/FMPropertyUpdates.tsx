import React, { useState } from 'react';

const FMPropertyUpdates = () => {
  const [propertyType, setPropertyType] = useState<'flat' | 'plot'>('plot');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">Log Property Update</h2>
        <p className="text-slate-400">
          Submit site progress, development status, and construction data directly from the field.
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2 text-white">
            <input
              type="radio"
              name="propertyType"
              checked={propertyType === 'plot'}
              onChange={() => setPropertyType('plot')}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            Plot Update
          </label>
          <label className="flex items-center gap-2 text-white">
            <input
              type="radio"
              name="propertyType"
              checked={propertyType === 'flat'}
              onChange={() => setPropertyType('flat')}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            Flat Update
          </label>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Select Property
              </label>
              <select className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500">
                <option value="">Choose property...</option>
                <option value="1">Plot 104 (East Facing)</option>
              </select>
            </div>

            {propertyType === 'plot' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Site Status
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5"
                    placeholder="Cleared, leveled, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Road & Boundary
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5"
                    placeholder="Progress percentage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Electricity & Water
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5"
                    placeholder="Connections laid"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Floor Level
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5"
                    placeholder="e.g. 5th Floor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Construction Stage
                  </label>
                  <select className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5">
                    <option>Foundation</option>
                    <option>Structure / Brickwork</option>
                    <option>Plumbing & Electrical</option>
                    <option>Flooring & Painting</option>
                    <option>Handover Ready</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Media (Photos/Videos)
            </label>
            <input
              type="file"
              className="w-full bg-slate-900 border border-slate-700 text-slate-400 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Remarks</label>
            <textarea
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5"
              placeholder="Additional observations from the field..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
            >
              Submit Field Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FMPropertyUpdates;
