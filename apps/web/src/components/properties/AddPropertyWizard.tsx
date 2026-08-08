import React, { useState } from 'react';
import { 
  Building2, Home, Layout, ArrowRight, ArrowLeft, Building, Warehouse, 
  MapPin, CheckCircle2, CheckSquare, Coins, Maximize, UploadCloud, X, Map,
  Trees, Tractor, Tent, Droplets
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';

interface AddPropertyWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PROPERTY_CATEGORIES = [
  { id: 'APARTMENT', label: 'Apartment', icon: Building2, group: 'RESIDENTIAL' },
  { id: 'INDEPENDENT_HOUSE', label: 'Independent House', icon: Home, group: 'RESIDENTIAL' },
  { id: 'DUPLEX', label: 'Duplex', icon: Layout, group: 'RESIDENTIAL' },
  { id: 'INDEPENDENT_FLOOR', label: 'Independent Floor', icon: Building, group: 'RESIDENTIAL' },
  { id: 'VILLA', label: 'Villa', icon: Home, group: 'RESIDENTIAL' },
  { id: 'PENTHOUSE', label: 'Penthouse', icon: Building, group: 'RESIDENTIAL' },
  { id: 'STUDIO', label: 'Studio', icon: Warehouse, group: 'RESIDENTIAL' },
  { id: 'PLOT', label: 'Plot', icon: Map, group: 'LAND' },
  { id: 'FARM_HOUSE', label: 'Farm House', icon: Tent, group: 'LAND' },
  { id: 'AGRICULTURAL_LAND', label: 'Agricultural Land', icon: Tractor, group: 'LAND' },
];

export const AddPropertyWizard: React.FC<AddPropertyWizardProps> = ({ onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [category, setCategory] = useState<string>('');
  
  // Base fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [facing, setFacing] = useState('');
  
  // Standard fields mapped to root schema if present
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  
  // The flexible JSON details
  const [details, setDetails] = useState<Record<string, any>>({});
  
  // Amenities list
  const [amenities, setAmenities] = useState<string[]>([]);
  const toggleAmenity = (am: string) => {
    setAmenities(prev => prev.includes(am) ? prev.filter(a => a !== am) : [...prev, am]);
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 6));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const updateDetail = (key: string, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!title || !price || !areaSqft || !location) {
      showToast('Please fill all required basic details', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title,
        description,
        brand_type: PROPERTY_CATEGORIES.find(c => c.id === category)?.group === 'LAND' ? 'RADHA_REAL_HOMES' : 'SONTHILLU',
        category,
        price: parseFloat(price),
        area_sqft: parseFloat(areaSqft),
        location,
        address,
        facing,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
        amenities: amenities.join(', '),
        details, // Push JSON details
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Property Listing Created Successfully!`, 'success');
        onSuccess();
      } else {
        showToast(data.error || 'Failed to create property', 'error');
      }
    } catch (e) {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = ['Property Type', 'Basic Details', 'Location', 'Amenities', 'Photos', 'Review'];
    return (
      <div className="flex flex-col gap-4 border-r border-slate-200 pr-6 hidden md:flex w-64 shrink-0">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Add Listing</h3>
        {steps.map((s, i) => {
          const isActive = step === i + 1;
          const isPassed = step > i + 1;
          return (
            <div key={s} className={`flex items-center gap-3 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
                ${isActive ? 'border-teal-600 text-teal-700 bg-teal-50' : isPassed ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 text-slate-500'}
              `}>
                {isPassed ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`font-semibold text-sm ${isActive ? 'text-teal-900' : 'text-slate-600'}`}>{s}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">What kind of property are you listing?</h2>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Residential Space-Bound Units</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROPERTY_CATEGORIES.filter(c => c.group === 'RESIDENTIAL').map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCategory(c.id); handleNext(); }}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                      category === c.id ? 'border-teal-600 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <c.icon className={`w-8 h-8 ${category === c.id ? 'text-teal-700' : 'text-slate-400'}`} />
                    <span className="text-sm font-semibold text-slate-700 text-center">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Land & Agricultural Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROPERTY_CATEGORIES.filter(c => c.group === 'LAND').map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCategory(c.id); handleNext(); }}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                      category === c.id ? 'border-amber-600 bg-amber-50 shadow-md' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                    }`}
                  >
                    <c.icon className={`w-8 h-8 ${category === c.id ? 'text-amber-700' : 'text-slate-400'}`} />
                    <span className="text-sm font-semibold text-slate-700 text-center">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Basic Details</h2>
            <p className="text-slate-500 text-sm">Tell us about this {PROPERTY_CATEGORIES.find(c=>c.id === category)?.label.toLowerCase()}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Property Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="e.g. Luxurious 3 BHK in Miyapur" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Price (₹) *</label>
                <div className="relative">
                  <Coins className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Area / Size *</label>
                <div className="relative">
                  <Maximize className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="number" value={areaSqft} onChange={e => setAreaSqft(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="Area in Sq.Ft / Acres" />
                </div>
              </div>
            </div>

            {/* DYNAMIC CATEGORY FIELDS */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">Property Specifics</h3>
              
              {category === 'APARTMENT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">BHK Configuration</label>
                    <select value={details.bhk_config || ''} onChange={e => updateDetail('bhk_config', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                      <option value="">Select...</option>
                      <option>1 RK</option><option>1 BHK</option><option>1.5 BHK</option>
                      <option>2 BHK</option><option>2.5 BHK</option><option>3 BHK</option><option>4+ BHK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bathrooms</label>
                    <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Floor Number</label>
                    <input type="text" value={details.floor_number || ''} onChange={e => updateDetail('floor_number', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Floors in Building</label>
                    <input type="number" value={details.total_floors || ''} onChange={e => updateDetail('total_floors', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="e.g. 15" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Furnishing Status</label>
                    <select value={details.furnishing || ''} onChange={e => updateDetail('furnishing', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                      <option value="">Select...</option><option>Fully Furnished</option><option>Semi-Furnished</option><option>Unfurnished</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Car Parking Spaces</label>
                    <input type="number" value={details.parking_spaces || ''} onChange={e => updateDetail('parking_spaces', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="0" />
                  </div>
                </div>
              )}

              {['INDEPENDENT_HOUSE', 'VILLA', 'DUPLEX'].includes(category) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bedrooms</label>
                    <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bathrooms</label>
                    <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Floors / Plinths</label>
                    <input type="number" value={details.total_floors || ''} onChange={e => updateDetail('total_floors', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age of Construction (Years)</label>
                    <input type="number" value={details.construction_age || ''} onChange={e => updateDetail('construction_age', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="0 for New" />
                  </div>
                  <div className="col-span-2 flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => updateDetail('gated_community', e.target.checked)} /> Gated Community</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => updateDetail('private_garden', e.target.checked)} /> Private Garden/Lawn</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => updateDetail('corner_property', e.target.checked)} /> Corner Property</label>
                  </div>
                </div>
              )}

              {category === 'PLOT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plot Dimensions (L x W ft)</label>
                    <input type="text" value={details.dimensions || ''} onChange={e => updateDetail('dimensions', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="e.g. 40x60" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Width of Facing Road (ft)</label>
                    <input type="number" value={details.road_width || ''} onChange={e => updateDetail('road_width', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="e.g. 30" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Open Sides</label>
                    <select value={details.open_sides || ''} onChange={e => updateDetail('open_sides', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                      <option value="">Select...</option><option>1</option><option>2</option><option>3</option><option>4 (Island)</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => updateDetail('boundary_wall', e.target.checked)} /> Boundary Wall Constructed</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => updateDetail('gated_community', e.target.checked)} /> Inside Gated Community</label>
                  </div>
                </div>
              )}

              {category === 'AGRICULTURAL_LAND' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Soil Classification</label>
                    <select value={details.soil_type || ''} onChange={e => updateDetail('soil_type', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                      <option value="">Select...</option><option>Black Cotton</option><option>Red Soil</option><option>Alluvial</option><option>Sandy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Approach Road</label>
                    <select value={details.approach_road || ''} onChange={e => updateDetail('approach_road', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                      <option value="">Select...</option><option>National Highway</option><option>State Highway</option><option>Village Tar Road</option><option>Mud Track / Kachha</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Irrigation Infrastructure</label>
                    <input type="text" value={details.irrigation || ''} onChange={e => updateDetail('irrigation', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="e.g. Canal, 2 Borewells" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Khata / Title Status</label>
                    <select value={details.title_status || ''} onChange={e => updateDetail('title_status', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                      <option value="">Select...</option><option>Clear Title</option><option>Litigated / Disputed</option><option>Ancestral Pending</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Description is universal */}
              <div className="col-span-2 pt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="Describe the key selling points..."></textarea>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Location & Address</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Region Area *</label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="e.g. Miyapur, Hyderabad" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Complete Address / Landmark</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="Plot No. 45, Beside Main Road..."></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property Facing</label>
              <select value={facing} onChange={e => setFacing(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500">
                <option value="">Select Facing Direction</option>
                <option value="EAST">East</option>
                <option value="WEST">West</option>
                <option value="NORTH">North</option>
                <option value="SOUTH">South</option>
                <option value="NORTH_EAST">North-East</option>
                <option value="SOUTH_EAST">South-East</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Amenities & Highlights</h2>
            <p className="text-slate-500 text-sm">Select all the amenities available for this property.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Gymnasium', 'Swimming Pool', '24/7 Security', 'Clubhouse', 'Power Backup', 'Lift / Elevator', 'Park', 'Water Supply', 'Vastu Compliant', 'Visitor Parking'].map(am => (
                <div 
                  key={am} 
                  onClick={() => toggleAmenity(am)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                    amenities.includes(am) ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 ${amenities.includes(am) ? 'text-teal-600' : 'text-slate-300'}`} />
                  <span className="text-sm">{am}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fadeIn text-center py-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Upload Photos</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Photo uploading is currently handled by the media team post-creation. You can skip this step and proceed to submit your listing.
            </p>
            <div className="mt-8 p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 max-w-lg mx-auto">
              <span className="text-slate-400 font-semibold">Drop images here (Feature Coming Soon)</span>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-800">Ready to Publish</h2>
              <p className="text-slate-500 text-sm mt-2">Please review the details below before submitting to the verification queue.</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 shadow-sm">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <div>
                  <div className="text-xs font-bold text-teal-700 bg-teal-100 inline-block px-2 py-1 rounded mb-2">{category.replace('_', ' ')}</div>
                  <h3 className="text-xl font-bold text-slate-800">{title || 'Untitled Property'}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {location}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-slate-800">₹ {Number(price).toLocaleString('en-IN')}</div>
                  <div className="text-sm text-slate-500">{areaSqft} Sq.Ft/Unit</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 text-sm gap-4">
                <div><span className="text-slate-400 block text-xs">Facing</span><span className="font-semibold">{facing || 'N/A'}</span></div>
                <div><span className="text-slate-400 block text-xs">Bed/Bath</span><span className="font-semibold">{bedrooms || 0} Beds / {bathrooms || 0} Baths</span></div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-xs">Specific Details</span>
                  <div className="font-mono text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 mt-1">
                    {Object.keys(details).length > 0 ? JSON.stringify(details, null, 2) : 'None provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-6">
      <div className="w-full h-full md:h-auto md:max-h-[90vh] max-w-5xl bg-white md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 md:hidden">Add Property Listing</h2>
          <div className="hidden md:block" /> {/* spacer for centering */}
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block p-8 bg-slate-50/50">
            {renderStepIndicator()}
          </div>
          
          <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white custom-scrollbar">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
          <button 
            onClick={handleBack} 
            disabled={step === 1}
            className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-0"
          >
            Back
          </button>
          
          {step < 6 ? (
            <button 
              onClick={handleNext}
              disabled={step === 1 && !category}
              className="px-8 py-3 bg-teal-700 text-white font-bold rounded-xl shadow-md hover:bg-teal-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Submitting...' : 'Submit Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
