import React, { useState } from 'react';
import { X, MapPin, IndianRupee, Tag } from 'lucide-react';
import { STATUS_CONFIG } from '../properties/PropertyManagement';
import { resolveImageUrl } from '../../utils/imageUtils';

interface LayoutRegion {
  id: number;
  property_id: number;
  x: number; // fractional 0-1
  y: number; // fractional 0-1
  property: {
    id: number;
    property_code: string;
    title: string;
    status: string;
    final_price: number;
    category: string;
  };
}

interface ProjectLayoutViewerProps {
  imageUrl: string;
  title?: string | null;
  regions: LayoutRegion[];
  /** Called when the user wants to act on a unit — the viewer itself never
   * mutates status (Phase 2.24 is read-only by design; the actual commercial
   * lifecycle transitions like booking creation live in their own existing
   * flows, not duplicated here). */
  onManageUnit?: (propertyId: number) => void;
}

const formatINR = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(1)} L`
      : `₹${n.toLocaleString('en-IN')}`;

/**
 * Phase 2.24: read-only interactive layout map. Pins are positioned with plain
 * CSS percentages from the stored fractional (0-1) coordinates — this is
 * resolution-independent by construction, no need to measure the rendered
 * <img> in JS. Pin color always reflects the unit's LIVE Property.status
 * (via the shared STATUS_CONFIG from PropertyManagement.tsx) — there is no
 * status stored on the region itself, so this can never drift out of sync
 * with the real unit.
 */
export const ProjectLayoutViewer: React.FC<ProjectLayoutViewerProps> = ({
  imageUrl,
  title,
  regions,
  onManageUnit,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<LayoutRegion | null>(null);

  return (
    <div className="relative">
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <img
          src={resolveImageUrl(imageUrl)}
          alt={title || 'Project layout'}
          className="w-full h-auto block select-none"
          draggable={false}
        />

        {regions.map((region) => {
          const cfg = STATUS_CONFIG[region.property.status] || {
            dot: 'bg-slate-400',
            badge: 'bg-slate-50 border-slate-200',
            text: 'text-slate-700',
            label: region.property.status,
          };
          const isSelected = selectedRegion?.id === region.id;
          return (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(isSelected ? null : region)}
              style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${cfg.dot} border-2 border-white shadow-lg transition-transform hover:scale-125 ${isSelected ? 'scale-125 ring-2 ring-offset-2 ring-navy-500' : ''} ${region.property.status === 'LIVE' ? 'animate-pulse' : ''}`}
              title={`${region.property.title} — ${cfg.label}`}
            />
          );
        })}
      </div>

      {selectedRegion &&
        (() => {
          const cfg = STATUS_CONFIG[selectedRegion.property.status] || {
            dot: 'bg-slate-400',
            badge: 'bg-slate-50 border-slate-200',
            text: 'text-slate-700',
            label: selectedRegion.property.status,
          };
          return (
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-md animate-fadeIn">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                      {selectedRegion.property.property_code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.badge} ${cfg.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {selectedRegion.property.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {selectedRegion.property.category}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <IndianRupee className="w-3 h-3" />{' '}
                      {formatINR(selectedRegion.property.final_price)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {onManageUnit && (
                <button
                  onClick={() => onManageUnit(selectedRegion.property.id)}
                  className="mt-3 w-full py-2 bg-navy-700 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" /> Manage This Unit
                </button>
              )}
            </div>
          );
        })()}
    </div>
  );
};
