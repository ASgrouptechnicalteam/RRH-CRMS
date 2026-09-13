import React, { useState } from 'react';

const PMProjectDetails = () => {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Details</h2>
          <p className="text-slate-400">
            Manage properties, pricing, and updates for this project.
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2 font-medium ${activeTab === 'properties' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Property Management & Pricing
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2 font-medium ${activeTab === 'updates' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Project Updates
        </button>
        <button
          onClick={() => setActiveTab('construction')}
          className={`px-4 py-2 font-medium ${activeTab === 'construction' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Construction Progress
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center mt-6">
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Property Inventory & Pricing</h3>
            <p className="text-slate-400">
              View property status, update prices, and view historical price changes along with the
              authorized reason and timestamps.
            </p>
            {/* Table Mockup */}
            <table className="w-full text-left mt-6 text-slate-300">
              <thead className="bg-slate-900 text-slate-400 text-sm">
                <tr>
                  <th className="p-3">Property No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Current Price</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-700">
                  <td className="p-3">A-101</td>
                  <td className="p-3">Flat</td>
                  <td className="p-3 text-emerald-400">Available</td>
                  <td className="p-3">₹ 45,000,000</td>
                  <td className="p-3">
                    <button className="text-blue-400 hover:underline">Update Price</button>
                  </td>
                </tr>
                <tr className="border-t border-slate-700">
                  <td className="p-3">A-102</td>
                  <td className="p-3">Flat</td>
                  <td className="p-3 text-red-400">Sold</td>
                  <td className="p-3">₹ 46,500,000</td>
                  <td className="p-3">
                    <button className="text-blue-400 hover:underline">View History</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'updates' && (
          <div>
            <h3 className="text-xl font-bold text-white">Project Development Updates</h3>
            <p className="text-slate-400 mb-4">
              Post official updates, photos, and remarks about overall project development.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">New Update</button>
          </div>
        )}

        {activeTab === 'construction' && (
          <div>
            <h3 className="text-xl font-bold text-white">Construction Progress Updates</h3>
            <p className="text-slate-400 mb-4">
              Post official construction percentages and phase completions.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Update Progress</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PMProjectDetails;
