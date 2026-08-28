import React from 'react';
import { MapPin, Heart, Maximize } from 'lucide-react';

interface PropertyCardProps {
  property: {
    id: string | number;
    name: string;
    location: string;
    bhk: string | number;
    sqft: string | number;
    price: string | number;
    imageUrl: string;
    isFeatured?: boolean;
    isFavorite?: boolean;
  };
  onFavoriteToggle?: (id: string | number) => void;
  onClick?: (id: string | number) => void;
}

export function PropertyCard({ property, onFavoriteToggle, onClick }: PropertyCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
      onClick={() => onClick && onClick(property.id)}
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img 
          src={property.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={property.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-transparent to-transparent opacity-60" />
        
        {/* Top actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div>
            {property.isFeatured && (
              <span className="bg-gold-500 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide shadow-sm">
                Featured
              </span>
            )}
          </div>
          <button 
            type="button"
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all text-slate-400 hover:text-rose-500 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle && onFavoriteToggle(property.id);
            }}
          >
            <Heart className={`w-4 h-4 ${property.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
        
        {/* Bottom price tag (inside image) */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-navy-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-bold">
            {property.price}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <h4 className="font-bold text-navy-900 text-lg leading-tight mb-1 group-hover:text-action transition-colors line-clamp-1">{property.name}</h4>
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-600 border-t border-slate-100 pt-3 mt-auto">
          <div className="flex items-center font-medium">
            <span className="text-navy-900 mr-1">{property.bhk}</span> BHK
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center font-medium">
            <Maximize className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span className="text-navy-900 mr-1">{property.sqft}</span> sq.ft
          </div>
        </div>
      </div>
    </div>
  );
}
