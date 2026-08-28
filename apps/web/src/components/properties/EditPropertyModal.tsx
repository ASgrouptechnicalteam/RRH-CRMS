import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Coins, Info, List, Image as ImageIcon, Globe, FileText, BedDouble, Bath, Trash2, Star, Loader2 } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';
import { EditableProperty, ProjectListItem, LocalImageItem } from '../../types';

interface EditPropertyModalProps {
  property: EditableProperty;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({ property, onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'specs' | 'media' | 'publishing'>('basic');
  
  // Basic
  const [title, setTitle] = useState(property.title || '');
  const [price, setPrice] = useState(property.price?.toString() || '');
  const [description, setDescription] = useState(property.description || '');
  const [projectId, setProjectId] = useState<string>(property.project?.id?.toString() || '');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  
  // Location
  const [location, setLocation] = useState(property.location || '');
  const [state, setState] = useState(property.state || '');
  const [city, setCity] = useState(property.city || '');
  const [locality, setLocality] = useState(property.locality || '');
  const [address, setAddress] = useState(property.address || '');
  const [pincode, setPincode] = useState(property.pincode || '');

  // Specs
  const [bedrooms, setBedrooms] = useState(property.bedrooms?.toString() || '');
  const [bathrooms, setBathrooms] = useState(property.bathrooms?.toString() || '');
  const [facing, setFacing] = useState(property.facing || '');
  const [carpetArea, setCarpetArea] = useState(property.carpet_area?.toString() || '');
  const [builtupArea, setBuiltupArea] = useState(property.builtup_area?.toString() || '');
  const [amenities, setAmenities] = useState<string>(property.amenities || '');
  
  // Details JSON parsing
  const initialDetails = property.details || {};
  const [furnishing, setFurnishing] = useState(initialDetails.furnishing || '');
  const [propertyType, setPropertyType] = useState(property.category || 'APARTMENT');
  
  // Media State
  const [localImages, setLocalImages] = useState<LocalImageItem[]>(property.images || []);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/projects`)
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects);
      })
      .catch(() => {});
  }, [fetchWithAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      showToast('Title and Price are required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const detailsPayload = {
        ...initialDetails,
        furnishing,
      };

      const payload = {
        title,
        description,
        price: parseFloat(price),
        project_id: projectId ? parseInt(projectId, 10) : null,
        category: propertyType,
        location,
        state,
        city,
        locality,
        address,
        pincode,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
        facing,
        carpet_area: carpetArea ? parseFloat(carpetArea) : null,
        builtup_area: builtupArea ? parseFloat(builtupArea) : null,
        amenities,
        details: detailsPayload,
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Property updated successfully!`, 'success');
        onSuccess();
      } else {
        showToast(data.error || 'Failed to update property', 'error');
      }
    } catch (err) {
      showToast('Network error while updating property', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: <FileText className="w-4 h-4" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'specs', label: 'Specs', icon: <List className="w-4 h-4" /> },
    { id: 'media', label: 'Media', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'publishing', label: 'Publishing', icon: <Globe className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl relative overflow-hidden animate-scaleUp flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Property Details</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">{property.property_code}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-navy-600 text-navy-700 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {activeTab === 'basic' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Property Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
                    <div className="relative">
                      <Coins className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Property Category</label>
                    <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500">
                      <option value="APARTMENT">Apartment</option>
                      <option value="INDEPENDENT_HOUSE">Independent House</option>
                      <option value="DUPLEX">Duplex</option>
                      <option value="INDEPENDENT_FLOOR">Independent Floor</option>
                      <option value="VILLA">Villa</option>
                      <option value="PENTHOUSE">Penthouse</option>
                      <option value="STUDIO">Studio</option>
                      <option value="PLOT">Plot</option>
                      <option value="FARM_HOUSE">Farm House</option>
                      <option value="AGRICULTURAL_LAND">Agricultural Land</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500"></textarea>
                </div>

                {projects.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Associated Project / Site</label>
                    <div className="relative">
                      <Building2 className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                      <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500">
                        <option value="">-- Standalone Property (No Project) --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Searchable Location (City/Area) *</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" placeholder="e.g. Miyapur, Hyderabad" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Locality / Neighborhood</label>
                    <input type="text" value={locality} onChange={e => setLocality(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                    <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500"></textarea>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {['INDEPENDENT_HOUSE', 'VILLA', 'DUPLEX'].includes(propertyType) && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bedrooms</label>
                        <div className="relative">
                          <BedDouble className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                          <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bathrooms</label>
                        <div className="relative">
                          <Bath className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                          <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Furnishing</label>
                    <select value={furnishing} onChange={e => setFurnishing(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500">
                      <option value="">Select...</option>
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facing</label>
                    <select value={facing} onChange={e => setFacing(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500">
                      <option value="">Select...</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="North-East">North-East</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Carpet Area (sq.ft)</label>
                    <input type="number" value={carpetArea} onChange={e => setCarpetArea(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Built-up Area (sq.ft)</label>
                    <input type="number" value={builtupArea} onChange={e => setBuiltupArea(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amenities (Comma separated)</label>
                  <textarea value={amenities} onChange={e => setAmenities(e.target.value)} rows={3} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-500" placeholder="e.g. Swimming Pool, Gym, 24x7 Security"></textarea>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Media Management</h3>
                  <div className="relative">
                    <input
                      type="file"
                      id={`upload-edit-img-${property.id}`}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const res = await fetchWithAuth(`${API_BASE_URL}/properties/${property.id}/images`, {
                            method: 'POST',
                            body: formData
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setLocalImages(prev => [...prev, data.image]);
                            showToast('Image uploaded successfully', 'success');
                          } else {
                            showToast('Failed to upload image', 'error');
                          }
                        } catch (err) {
                          showToast('Error uploading image', 'error');
                        } finally {
                          setIsUploading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label htmlFor={`upload-edit-img-${property.id}`} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${isUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-navy-50 text-navy-700 hover:bg-navy-100 cursor-pointer'}`}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      {isUploading ? 'Uploading...' : 'Add Photo'}
                    </label>
                  </div>
                </div>

                {localImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {localImages.map(img => (
                      <div key={img.id} className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-colors ${img.is_primary ? 'border-navy-500 shadow-md' : 'border-slate-200'}`}>
                        <img src={resolveImageUrl(img.image_url)} alt="Property" className="w-full h-full object-cover" />
                        
                        {img.is_primary && (
                          <div className="absolute top-2 left-2 bg-navy-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> COVER
                          </div>
                        )}

                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                          {!img.is_primary && (
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await fetchWithAuth(`${API_BASE_URL}/properties/${property.id}/images/${img.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ is_primary: true })
                                  });
                                  if (res.ok) {
                                    setLocalImages(prev => prev.map(i => ({ ...i, is_primary: i.id === img.id })));
                                    showToast('Cover image updated', 'success');
                                  }
                                } catch (e) {
                                  showToast('Failed to set cover', 'error');
                                }
                              }}
                              className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg hover:bg-navy-50 transition-colors"
                            >
                              Set as Cover
                            </button>
                          )}
                          <button 
                            onClick={async () => {
                              if (window.confirm('Delete this image permanently?')) {
                                try {
                                  const res = await fetchWithAuth(`${API_BASE_URL}/properties/${property.id}/images/${img.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    setLocalImages(prev => prev.filter(i => i.id !== img.id));
                                    showToast('Image deleted', 'success');
                                  }
                                } catch (e) {
                                  showToast('Failed to delete image', 'error');
                                }
                              }
                            }}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No images uploaded yet</p>
                    <p className="text-slate-400 text-xs mt-1">Upload JPEG, PNG or WebP files</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'publishing' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 animate-fadeIn flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Publishing Status</h3>
                <p className="text-slate-500 text-center max-w-sm">
                  Status changes (Draft, Available, Sold) are managed through the lifecycle actions menu in the Property Detail view to ensure proper workflow execution.
                </p>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-navy-600 hover:bg-navy-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
