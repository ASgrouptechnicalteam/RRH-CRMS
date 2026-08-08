import React, { useState, useEffect } from 'react';
import {
  Home,
  Building,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Sparkles,
  FileCheck,
  Tag,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Roles } from '@rrh-ems/shared';
import { AddPropertyWizard } from './AddPropertyWizard';

interface Property {
  id: number;
  property_code: string;
  title: string;
  description?: string;
  brand_type: 'SONTHILLU' | 'RADHA_REAL_HOMES';
  category: string;
  price: number;
  area_sqft: number;
  location: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  facing?: string;
  status: 'PENDING_VERIFICATION' | 'PENDING_DM_POLISH' | 'PENDING_MD_APPROVAL' | 'LIVE' | 'REJECTED';
  rejection_reason?: string;
  seo_title?: string;
  seo_keywords?: string;
  assigned_pm?: { id: number; employee_code: string; full_name: string; phone: string };
  created_by?: { id: number; employee_code: string; full_name: string };
  created_at: string;
  verification_logs?: any[];
}

const APPROVAL_STAGES = [
  { key: 'PENDING_VERIFICATION', label: '1. PM Verify', role: 'Project Manager' },
  { key: 'PENDING_DM_POLISH', label: '2. DM Polish', role: 'Digital Marketing' },
  { key: 'PENDING_MD_APPROVAL', label: '3. MD Approval', role: 'Managing Director' },
  { key: 'LIVE', label: '4. LIVE', role: 'Public' },
];

const PropertyPipelineStepper: React.FC<{ status: Property['status'] }> = ({ status }) => {
  if (status === 'REJECTED') {
    return (
      <div className="px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-[11px] inline-flex items-center gap-1.5 my-1">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Property Rejected</span>
      </div>
    );
  }

  const currentIndex = APPROVAL_STAGES.findIndex((s) => s.key === status);

  return (
    <div className="w-full my-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
        <span>Approval Workflow</span>
        <span className="text-teal-800 font-bold">
          {status === 'LIVE' ? 'Approved & LIVE' : `Stage ${currentIndex + 1} of 3`}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {APPROVAL_STAGES.map((stg, idx) => {
          const isCurrent = stg.key === status;
          const isPassed = status === 'LIVE' || (currentIndex >= 0 && idx < currentIndex);
          return (
            <div
              key={stg.key}
              className={`px-1 py-1 rounded-lg text-[9px] font-bold text-center leading-tight transition-all ${
                isCurrent
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                  : isPassed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200/70 text-slate-500'
              }`}
            >
              <div className="truncate">{stg.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PropertyManagement: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [brandTab, setBrandTab] = useState<'ALL' | 'SONTHILLU' | 'RADHA_REAL_HOMES'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Create Form State
  const [title, setTitle] = useState('');
  const [brandType, setBrandType] = useState<'SONTHILLU' | 'RADHA_REAL_HOMES'>('SONTHILLU');
  const [category, setCategory] = useState('VILLA');
  const [price, setPrice] = useState('18500000');
  const [areaSqft, setAreaSqft] = useState('2400');
  const [location, setLocation] = useState('Miyapur Main Road');
  const [address, setAddress] = useState('Plot 45, Sonthillu Luxury County, Miyapur, Hyderabad');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [facing, setFacing] = useState('EAST');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [possessionStatus, setPossessionStatus] = useState('READY_TO_MOVE');
  const [assignedPmId, setAssignedPmId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pms, setPms] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'ALL' | 'MY_PROPERTIES'>('ALL');

  // Action Inputs for Dossier
  const [actionNotes, setActionNotes] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  const isPM = user?.roles?.some((r) => ['Project Manager (Site)', 'Project Manager', 'MD', 'Admin (Technical)'].includes(r));
  const isDM = user?.roles?.some((r) => ['Digital Lead Operator', 'Digital Marketing Head', 'Marketing Director', 'MD', 'Admin (Technical)'].includes(r));
  const isMD = user?.roles?.some((r) => ['MD', 'Admin (Technical)'].includes(r));

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error('Fetch properties error:', e);
      showToast('Failed to load property inventory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPMs = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (res.ok && data.employees) {
        setPms(data.employees.filter((e: any) => e.roles?.some((r: any) => r.includes('Project Manager'))));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchProperties();
    if (isMD || isPM) fetchPMs();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          brand_type: brandType,
          category,
          price: parseFloat(price),
          area_sqft: parseFloat(areaSqft),
          location,
          address,
          bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
          bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
          facing,
          description,
          amenities,
          possession_status: possessionStatus,
          assigned_pm_id: assignedPmId ? parseInt(assignedPmId) : null,
          faqs: [], // Can be expanded in future
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Property ${data.property.property_code} submitted for PM On-Site Verification!`, 'success');
        setShowAddModal(false);
        setTitle('');
        setDescription('');
        setAmenities('');
        setAssignedPmId('');
        fetchProperties();
      } else {
        showToast(data.error || 'Failed to create property listing', 'error');
      }
    } catch (err) {
      showToast('Network error while creating property', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pipeline Action Handlers
  const handlePMVerify = async (propertyId: number, approved: boolean) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, notes: actionNotes || 'PM On-Site Check Executed' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setActionNotes('');
        setSelectedProperty(null);
        fetchProperties();
      } else {
        showToast(data.error || 'Verification failed', 'error');
      }
    } catch (err) {
      showToast('Error executing PM verification', 'error');
    }
  };

  const handleDMPolish = async (propertyId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/dm-polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo_title: seoTitle || selectedProperty?.title,
          seo_keywords: seoKeywords || 'luxury villa, miyapur real estate, hyderabad homes',
          notes: actionNotes || 'DM SEO Polish Completed',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setActionNotes('');
        setSeoTitle('');
        setSeoKeywords('');
        setSelectedProperty(null);
        fetchProperties();
      } else {
        showToast(data.error || 'DM Polish failed', 'error');
      }
    } catch (err) {
      showToast('Error executing DM polish', 'error');
    }
  };

  const handleMDApprove = async (propertyId: number, approved: boolean) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/md-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, comments: actionNotes || 'MD Decision Executed' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setActionNotes('');
        setSelectedProperty(null);
        fetchProperties();
      } else {
        showToast(data.error || 'MD approval failed', 'error');
      }
    } catch (err) {
      showToast('Error executing MD approval', 'error');
    }
  };

  const filteredProperties = properties.filter((prop) => {
    const matchesBrand = brandTab === 'ALL' || prop.brand_type === brandTab;
    const matchesStatus = statusFilter === 'ALL' || prop.status === statusFilter;
    const matchesSearch =
      prop.property_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesViewMode = viewMode === 'ALL' || (viewMode === 'MY_PROPERTIES' && prop.assigned_pm?.id === user?.id);

    return matchesBrand && matchesStatus && matchesSearch && matchesViewMode;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'PENDING_DM_POLISH':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'PENDING_MD_APPROVAL':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'LIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-teal-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Property Inventory & Verification Pipeline</h2>
          </div>
          <p className="text-xs text-teal-200/80">
            Manage your properties, inventory and approval pipelines.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property Listing</span>
        </button>
      </div>

      {/* Brand Separation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setBrandTab('ALL')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              brandTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Inventory ({properties.length})
          </button>

          <button
            onClick={() => setBrandTab('SONTHILLU')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              brandTab === 'SONTHILLU' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-teal-300" />
            <span>Sonthillu (Residential)</span>
          </button>

          <button
            onClick={() => setBrandTab('RADHA_REAL_HOMES')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              brandTab === 'RADHA_REAL_HOMES' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-300" />
            <span>Radha Real Homes (Plots & Commercial)</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          {isPM && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="py-1.5 px-3 text-xs bg-teal-50 border border-teal-200 rounded-xl font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Properties</option>
              <option value="MY_PROPERTIES">My Assigned Properties</option>
            </select>
          )}
          
          <div className="relative w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, title, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Stages</option>
            <option value="PENDING_VERIFICATION">1. PM Verification</option>
            <option value="PENDING_DM_POLISH">2. DM Polish</option>
            <option value="PENDING_MD_APPROVAL">3. MD Approval</option>
            <option value="LIVE">4. LIVE</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Property Cards Grid (Housing.com Style) */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading property portfolio...</div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No properties found in selected view.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      prop.brand_type === 'SONTHILLU'
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-slate-900 text-amber-300 border-slate-700'
                    }`}
                  >
                    {prop.brand_type === 'SONTHILLU' ? 'Sonthillu Residential' : 'Radha Real Homes Commercial'}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(prop.status)}`}>
                    {prop.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <div className="font-mono font-bold text-teal-900 text-[11px] mb-0.5">{prop.property_code}</div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1">{prop.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {prop.location}
                  </p>
                </div>

                {/* Housing.com Field Badges */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                  <div className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{prop.area_sqft} sq.ft</span>
                  </div>
                  {prop.bedrooms && (
                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Bed className="w-3.5 h-3.5 text-teal-600" />
                      <span>{prop.bedrooms} BHK</span>
                    </div>
                  )}
                  {prop.facing && (
                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Compass className="w-3.5 h-3.5 text-teal-600" />
                      <span>{prop.facing}</span>
                    </div>
                  )}
                </div>

                {/* 4-Stage Approval Workflow Stepper */}
                <PropertyPipelineStepper status={prop.status} />

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Asking Price</span>
                  <span className="text-lg font-black text-teal-950">
                    ₹{(prop.price / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  PM: {prop.assigned_pm?.full_name || prop.assigned_pm?.employee_code || 'Unassigned'}
                </span>

                <button
                  onClick={() => setSelectedProperty(prop)}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Dossier & Verify</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Wizard */}
      {showAddModal && (
        <AddPropertyWizard 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchProperties();
          }}
        />
      )}

      {/* Property Dossier & Verification Pipeline Action Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-teal-800 text-sm">{selectedProperty.property_code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedProperty.status)}`}>
                {selectedProperty.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-xl">{selectedProperty.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedProperty.location} • ₹{(selectedProperty.price / 100000).toFixed(1)} Lakhs
              </p>
            </div>

            {/* Pipeline Stage Progress Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">4-Stage Verification Workflow</span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                <div className={`p-2 rounded-xl border ${selectedProperty.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                  1. PM On-Site
                </div>
                <div className={`p-2 rounded-xl border ${selectedProperty.status === 'PENDING_DM_POLISH' ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                  2. DM Polish
                </div>
                <div className={`p-2 rounded-xl border ${selectedProperty.status === 'PENDING_MD_APPROVAL' ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                  3. MD Approval
                </div>
                <div className={`p-2 rounded-xl border ${selectedProperty.status === 'LIVE' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                  4. LIVE
                </div>
              </div>
            </div>

            {/* Action Bar based on current stage & user role */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200/60 space-y-3">
              <h4 className="font-bold text-teal-900 text-xs uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Pipeline Stage Action Bar
              </h4>

              {/* Stage 1 Action for PM */}
              {selectedProperty.status === 'PENDING_VERIFICATION' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    Project Manager (<strong className="text-slate-800">{selectedProperty.assigned_pm?.full_name || 'PM'}</strong>) must verify site boundaries, location, and photos.
                  </p>
                  <textarea
                    rows={2}
                    placeholder="Enter PM on-site inspection notes..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePMVerify(selectedProperty.id, true)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow"
                    >
                      ✅ Pass PM On-Site Verification
                    </button>
                    <button
                      onClick={() => handlePMVerify(selectedProperty.id, false)}
                      className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl border border-rose-300"
                    >
                      ❌ Reject Property
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2 Action for DM */}
              {selectedProperty.status === 'PENDING_DM_POLISH' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">Digital Marketing Team SEO & Listing Content Polish.</p>
                  <input
                    type="text"
                    placeholder="SEO Title Tag (e.g. Luxury 3BHK Villa Miyapur)"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="SEO Keywords (comma separated)"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    onClick={() => handleDMPolish(selectedProperty.id)}
                    className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Complete DM Polish $\rightarrow$ Submit to MD</span>
                  </button>
                </div>
              )}

              {/* Stage 3 Action for MD */}
              {selectedProperty.status === 'PENDING_MD_APPROVAL' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">Managing Director Final Review & Go-Live Decision.</p>
                  <textarea
                    rows={2}
                    placeholder="Enter MD final review comments..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMDApprove(selectedProperty.id, true)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow"
                    >
                      🚀 APPROVE & MAKE LIVE
                    </button>
                    <button
                      onClick={() => handleMDApprove(selectedProperty.id, false)}
                      className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl border border-rose-300"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedProperty.status === 'LIVE' && (
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  This property is LIVE and visible on public CRM portal!
                </p>
              )}
            </div>

            {/* Audit & Verification History Log */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Verification History Log</h4>
              <div className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs">
                {selectedProperty.verification_logs?.map((log: any) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{log.actor?.full_name || log.actor?.employee_code}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
