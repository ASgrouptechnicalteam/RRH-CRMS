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
  ImageIcon,
  ShieldCheck,
  Sparkles,
  FileCheck,
  Tag,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  UserCheck,
  Camera,
  CheckCheck,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Permissions } from '@rrh-ems/shared';
import { Roles } from '@rrh-ems/shared';
import { AddPropertyWizard } from './AddPropertyWizard';
import { EditPropertyModal } from './EditPropertyModal';
import { Edit, Building2 } from 'lucide-react';

import { resolveImageUrl } from '../../utils/imageUtils';
import { ProjectListItem, PropertyListItem, PmListItem, VerificationLogItem, PropertyImage } from '../../types';
import { PropertyCard } from '../ui/PropertyCard';

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
  location_confirmed_by_pm?: boolean;
  assigned_pm?: { id: number; employee_code: string; full_name: string; phone: string };
  project?: { id: number; name: string };
  _count?: { interested_leads: number };
  created_by?: { id: number; employee_code: string; full_name: string };
  created_at: string;
  verification_logs?: VerificationLogItem[];
  images?: PropertyImage[];
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
        <span className="text-navy-800 font-bold">
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
  const [showEditModal, setShowEditModal] = useState(false);
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
  const [pms, setPms] = useState<PmListItem[]>([]);
  const [viewMode, setViewMode] = useState<'ALL' | 'MY_PROPERTIES'>('ALL');

  // Action Inputs for Dossier
  const [actionNotes, setActionNotes] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [dmExecutiveId, setDmExecutiveId] = useState('');
  const [dmExecutives, setDmExecutives] = useState<PmListItem[]>([]);

  const isPM = user?.roles?.some((r) => ([Roles.PROJECT_MANAGER, Roles.MD, Roles.ADMIN] as readonly string[]).includes(r));
  const isDM = user?.roles?.some((r) => ([Roles.DIGITAL_LEAD_OPERATOR, Roles.DIGITAL_MARKETING_HEAD, Roles.MARKETING_DIRECTOR, Roles.MD, Roles.ADMIN] as readonly string[]).includes(r));
  const isMD = user?.roles?.some((r) => ([Roles.MD, Roles.ADMIN] as readonly string[]).includes(r));

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
        setPms(data.employees.filter((e: PmListItem) => e.roles?.some((r: string) => r.includes(Roles.PROJECT_MANAGER))));
        setDmExecutives(data.employees.filter((e: PmListItem) => e.roles?.some((r: string) => r.toLowerCase().includes('digital marketing executive'))));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchProperties();
    if (isMD || isPM || isDM) fetchPMs();
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
    if (!dmExecutiveId) {
      showToast('Please select a Digital Marketing Executive to assign', 'error');
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/dm-polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          digital_marketing_executive_id: parseInt(dmExecutiveId, 10),
          seo_title: seoTitle || selectedProperty?.title,
          seo_keywords: seoKeywords || 'luxury villa, miyapur real estate, hyderabad homes',
          notes: actionNotes || 'DM SEO Polish Assigned',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setActionNotes('');
        setSeoTitle('');
        setSeoKeywords('');
        setDmExecutiveId('');
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
        return 'bg-navy-100 text-navy-800 border-navy-300';
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
      <div className="bg-gradient-to-r from-slate-900 via-navy-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-navy-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-navy-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Property Inventory & Verification</h2>
          </div>
          <p className="text-xs text-navy-200/80">
            Manage your properties, inventory and approval pipelines.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-navy-500 hover:bg-navy-400 text-navy-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property Listing</span>
        </button>
      </div>

      {/* Brand Separation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
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
              brandTab === 'SONTHILLU' ? 'bg-navy-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-navy-300" />
            <span>Sonthillu (Residential)</span>
          </button>

          <button
            onClick={() => setBrandTab('RADHA_REAL_HOMES')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              brandTab === 'RADHA_REAL_HOMES' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-300" />
            <span>Radha Real Homes</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          {isPM && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'ALL' | 'MY_PROPERTIES')}
              className="py-1.5 px-3 text-xs bg-navy-50 border border-navy-200 rounded-xl font-bold text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-600"
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
          {filteredProperties.map((prop) => {
            const displayImage = (prop.images && prop.images.length > 0 
              ? resolveImageUrl(prop.images.find((i) => i.is_primary)?.image_url || prop.images[0].image_url) 
              : '') || '';
              
            const actualInterestedLeads = prop._count?.interested_leads || 0;

            return (
              <PropertyCard
                key={prop.id}
                property={{
                  id: prop.id,
                  name: prop.title,
                  location: prop.location,
                  bhk: prop.bedrooms || 0,
                  sqft: prop.area_sqft,
                  price: `₹${(prop.price / 100000).toFixed(1)} L`,
                  imageUrl: displayImage,
                  interestedLeads: actualInterestedLeads,
                }}
                onClick={() => setSelectedProperty(prop)}
                brandBadge={
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border shadow-sm ${
                    prop.brand_type === 'SONTHILLU'
                      ? 'bg-navy-50 text-navy-800 border-navy-200'
                      : 'bg-slate-900 text-amber-300 border-slate-700'
                  }`}>
                    {prop.brand_type === 'SONTHILLU' ? 'Sonthillu' : 'Radha Real Homes'}
                  </span>
                }
                statusBadge={
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shadow-sm ${getStatusBadge(prop.status)}`}>
                    {prop.status.replace(/_/g, ' ')}
                  </span>
                }
              />
            );
          })}
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
              <span className="font-mono font-bold text-navy-800 text-sm">{selectedProperty.property_code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedProperty.status)}`}>
                {selectedProperty.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xl">{selectedProperty.title}</h3>
                  {selectedProperty.project && (
                    <div className="text-[11px] text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full inline-block border border-navy-100 mt-1 mb-2">
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      {selectedProperty.project.name}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedProperty.location} • ₹{(selectedProperty.price / 100000).toFixed(1)} Lakhs
                  </p>
                </div>
                {user?.permissions?.includes(Permissions.PROPERTIES_UPDATE) && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 text-navy-600 hover:text-navy-700 bg-navy-50 hover:bg-navy-100 rounded-xl transition-colors"
                    title="Edit Safe Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Pipeline Stage Progress Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">4-Stage Verification Workflow</span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                <div className={`p-2 rounded-xl border ${selectedProperty.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                  1. PM On-Site
                </div>
                <div className={`p-2 rounded-xl border ${selectedProperty.status === 'PENDING_DM_POLISH' ? 'bg-navy-100 text-navy-900 border-navy-300' : 'bg-white text-slate-400 border-slate-200'}`}>
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
            <div className="p-4 bg-navy-50/60 rounded-2xl border border-navy-200/60 space-y-3">
              <h4 className="font-bold text-navy-900 text-xs uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-navy-700" />
                Pipeline Stage Action Bar
              </h4>

              {/* Stage 1 — Guided PM Verification Wizard */}
              {selectedProperty.status === 'PENDING_VERIFICATION' && user?.permissions?.includes(Permissions.PROPERTIES_VERIFY) && (() => {
                const locConfirmed = !!selectedProperty.location_confirmed_by_pm;
                const pmUploadedImages = selectedProperty.images?.filter((img) => img.uploaded_by_id === user?.id) ?? [];
                const hasPhotos = pmUploadedImages.length > 0;
                const allReady = locConfirmed && hasPhotos;

                const stepState = (done: boolean, locked: boolean) => {
                  if (done) return 'done';
                  if (locked) return 'locked';
                  return 'active';
                };

                const stepClasses = {
                  done: 'border-emerald-300 bg-emerald-50',
                  active: 'border-navy-300 bg-navy-50/60',
                  locked: 'border-slate-200 bg-slate-50 opacity-50',
                };

                const StepBadge: React.FC<{ num: number; state: 'done' | 'active' | 'locked' }> = ({ num, state }) => (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-extrabold ${
                    state === 'done' ? 'bg-emerald-600 text-white' :
                    state === 'active' ? 'bg-navy-700 text-white' :
                    'bg-slate-300 text-slate-500'
                  }`}>
                    {state === 'done' ? <CheckCheck className="w-3.5 h-3.5" /> : num}
                  </div>
                );

                const step1State = stepState(locConfirmed, false);
                const step2State = stepState(hasPhotos, !locConfirmed);
                const step3State = stepState(false, !allReady);

                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-navy-700" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-navy-800">PM On-Site Verification — Complete all 3 steps</span>
                    </div>

                    {/* STEP 1 — Confirm Location */}
                    <div className={`rounded-xl border p-3 space-y-2 ${stepClasses[step1State]}`}>
                      <div className="flex items-center gap-2">
                        <StepBadge num={1} state={step1State} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800">Confirm Location On-Site</p>
                          <p className="text-[10px] text-slate-500">Physically verify that city, locality, and coordinates match the property record.</p>
                        </div>
                        {locConfirmed && <span className="text-[10px] text-emerald-700 font-bold">Confirmed ✓</span>}
                      </div>
                      {!locConfirmed && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetchWithAuth(`${API_BASE_URL}/properties/${selectedProperty.id}/confirm-location`, { method: 'POST' });
                              const d = await res.json();
                              if (res.ok) {
                                showToast('Location confirmed on-site', 'success');
                                fetchProperties();
                                setSelectedProperty(prev => prev ? { ...prev, location_confirmed_by_pm: true } : prev);
                              } else { showToast(d.error || 'Failed', 'error'); }
                            } catch { showToast('Network error', 'error'); }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-navy-700 hover:bg-navy-800 text-white text-xs font-bold rounded-lg"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          I Have Verified the Location On-Site
                        </button>
                      )}
                    </div>

                    {/* STEP 2 — Upload Site Photos */}
                    <div className={`rounded-xl border p-3 space-y-2 ${stepClasses[step2State]}`}>
                      <div className="flex items-center gap-2">
                        <StepBadge num={2} state={step2State} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800">Upload Site Photos</p>
                          <p className="text-[10px] text-slate-500">
                            {hasPhotos
                              ? `${pmUploadedImages.length} photo${pmUploadedImages.length > 1 ? 's' : ''} uploaded by you.`
                              : 'At least 1 photo uploaded by you is required — seller photos don\'t count.'}
                          </p>
                        </div>
                        {hasPhotos && <span className="text-[10px] text-emerald-700 font-bold">{pmUploadedImages.length} ✓</span>}
                      </div>
                      {step2State !== 'locked' && (
                        <div className="relative">
                          <input
                            type="file"
                            id={`pm-verify-img-${selectedProperty.id}`}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const res = await fetchWithAuth(`${API_BASE_URL}/properties/${selectedProperty.id}/images`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                if (res.ok) {
                                  showToast('Photo uploaded', 'success');
                                  fetchProperties();
                                  setSelectedProperty(null);
                                } else { showToast('Upload failed', 'error'); }
                              } catch { showToast('Network error', 'error'); }
                            }}
                          />
                          <label
                            htmlFor={`pm-verify-img-${selectedProperty.id}`}
                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer text-xs font-bold transition-colors ${
                              hasPhotos
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'border-navy-300 text-navy-700 hover:bg-navy-50'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {hasPhotos ? 'Upload Another Photo' : 'Upload Site Photo'}
                          </label>
                        </div>
                      )}
                    </div>

                    {/* STEP 3 — Verify or Reject */}
                    <div className={`rounded-xl border p-3 space-y-2 ${stepClasses[step3State]}`}>
                      <div className="flex items-center gap-2">
                        <StepBadge num={3} state={step3State} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800">Submit Verification Decision</p>
                          <p className="text-[10px] text-slate-500">{allReady ? 'All pre-conditions met. Ready to verify.' : 'Complete steps 1 and 2 first.'}</p>
                        </div>
                        {!allReady && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      <textarea
                        rows={2}
                        placeholder="PM on-site inspection notes (optional for approval, required for rejection)..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        disabled={!allReady}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePMVerify(selectedProperty.id, true)}
                          disabled={!allReady}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Approve — Pass Verification
                        </button>
                        <button
                          onClick={() => handlePMVerify(selectedProperty.id, false)}
                          className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl border border-rose-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Stage 2 Action for DM Head — assign executive + provide SEO hints */}
              {selectedProperty.status === 'PENDING_DM_POLISH' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">Digital Marketing Team SEO &amp; Listing Content Polish.</p>

                  {/* DMH must pick the executive who will do the work */}
                  {user?.permissions?.includes(Permissions.PROPERTIES_DM_POLISH) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assign to Digital Marketing Executive *</label>
                      <select
                        value={dmExecutiveId}
                        onChange={(e) => setDmExecutiveId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-navy-500"
                      >
                        <option value="" disabled>Select DM Executive...</option>
                        {dmExecutives.map(dm => (
                          <option key={dm.id} value={dm.id}>{dm.full_name || dm.employee_code}</option>
                        ))}
                      </select>
                    </div>
                  )}

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
                  {user?.permissions?.includes(Permissions.PROPERTIES_DM_POLISH) && (
                    <button
                      onClick={() => handleDMPolish(selectedProperty.id)}
                      disabled={!dmExecutiveId}
                      className="px-4 py-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Assign &amp; Send to DM Polish</span>
                    </button>
                  )}
                </div>
              )}

              {/* Stage 3 Action for MD */}
              {selectedProperty.status === 'PENDING_MD_APPROVAL' && user?.permissions?.includes(Permissions.PROPERTIES_MD_APPROVE) && (
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

            {/* Property Media / Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Property Images</h4>
                <div className="relative">
                  <input
                    type="file"
                    id={`upload-img-${selectedProperty.id}`}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('image', file);
                      try {
                        const res = await fetchWithAuth(`${API_BASE_URL}/properties/${selectedProperty.id}/images`, {
                          method: 'POST',
                          body: formData // browser sets content-type multipart/form-data
                        });
                        if (res.ok) {
                          // refresh property to show new image
                          fetchProperties();
                          showToast('Image uploaded successfully', 'success');
                          // Close dossier so it refreshes (or we could fetch single property, but closing is safer for beta)
                          setSelectedProperty(null); 
                        } else {
                          showToast('Failed to upload image', 'error');
                        }
                      } catch (err) {
                        showToast('Error uploading image', 'error');
                      }
                    }}
                  />
                  <label htmlFor={`upload-img-${selectedProperty.id}`} className="px-3 py-1.5 bg-navy-50 hover:bg-navy-100 text-navy-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    Upload Image
                  </label>
                </div>
              </div>
              
              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedProperty.images.map((img: PropertyImage) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                      <img src={resolveImageUrl(img.image_url)} alt="Property" className="w-full h-full object-cover" />
                      {img.is_primary && (
                        <div className="absolute top-2 left-2 bg-navy-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">COVER</div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                         <button 
                            onClick={async () => {
                              if (window.confirm('Delete this image?')) {
                                try {
                                  const res = await fetchWithAuth(`${API_BASE_URL}/properties/${selectedProperty.id}/images/${img.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    showToast('Image deleted', 'success');
                                    fetchProperties();
                                    setSelectedProperty(null);
                                  }
                                } catch (e) {}
                              }
                            }}
                            className="p-1.5 bg-white text-rose-600 rounded-full hover:bg-rose-50 shadow"
                          >
                            <X className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl text-center">No images uploaded yet.</div>
              )}
            </div>

            {/* Audit & Verification History Log */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Verification History Log</h4>
              <div className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs">
                {selectedProperty.verification_logs?.map((log: VerificationLogItem) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{log.actor?.full_name || log.actor?.employee_code}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Safe Edit Modal */}
      {showEditModal && selectedProperty && (
        <EditPropertyModal 
          property={selectedProperty}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchProperties();
            // Optional: Re-fetch or close dossier. Let's just close dossier to refresh fresh.
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
};
