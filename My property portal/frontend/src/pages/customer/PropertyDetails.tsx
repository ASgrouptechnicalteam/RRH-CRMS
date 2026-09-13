import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, TrendingUp, RefreshCcw, FileUp, ArrowLeft, Clock } from 'lucide-react';
import api from '../../lib/axios';

export const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Resale Form State
  const [resalePrice, setResalePrice] = useState('');
  const [resaleReason, setResaleReason] = useState('');
  const [resaleSubmitting, setResaleSubmitting] = useState(false);
  const [resaleSuccess, setResaleSuccess] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/customers/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const submitResaleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResaleSubmitting(true);
    try {
      await api.post('/customers/resale', {
        propertyId: id,
        expectedPrice: resalePrice,
        reason: resaleReason,
      });
      setResaleSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit resale request. Please try again later.');
    } finally {
      setResaleSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading property details...</div>;
  if (!property)
    return <div className="text-rose-500">Property not found or unauthorized access.</div>;

  const allUpdates = [
    ...(property.propertyUpdates || []).map((u: any) => ({ ...u, _type: 'Property Update' })),
    ...(property.project?.projectUpdates || []).map((u: any) => ({
      ...u,
      _type: 'Project Update',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Market Value logic
  const currentMarketValue =
    property.marketValueHistory && property.marketValueHistory.length > 0
      ? property.marketValueHistory[0].value
      : property.price;
  const valueDifference = currentMarketValue - property.price;
  const valuePercentage =
    property.price > 0 ? ((valueDifference / property.price) * 100).toFixed(2) : '0.00';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          to="/customer/properties"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Properties
        </Link>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
          {property.project.name} - {property.propertyNumber}
        </h2>
        <p className="text-slate-500 mt-1">
          Manage everything related to this property from this view.
        </p>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'overview', icon: Building2, label: 'Overview' },
          { id: 'updates', icon: Clock, label: 'Updates' },
          { id: 'location', icon: MapPin, label: 'Location' },
          { id: 'market-value', icon: TrendingUp, label: 'Market Value' },
          { id: 'resale', icon: RefreshCcw, label: 'Resale' },
          { id: 'documents', icon: FileUp, label: 'Submit Documents' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Property Facts</h3>
              <dl className="space-y-3">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium text-slate-800">{property.status}</dd>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <dt className="text-slate-500">Type</dt>
                  <dd className="font-medium text-slate-800">{property.type}</dd>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <dt className="text-slate-500">Carpet Area</dt>
                  <dd className="font-medium text-slate-800">{property.carpetArea} sqft</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Purchase Price</dt>
                  <dd className="font-medium text-slate-800">₹{property.price.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* UPDATES TAB */}
        {activeTab === 'updates' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">Recent Updates</h3>
            <div className="space-y-6">
              {allUpdates.map((update: any) => (
                <div key={update.id} className="relative pl-6 border-l-2 border-blue-100">
                  <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-2 border-2 border-white shadow-sm"></div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {update._type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{update.title}</h4>
                  <p className="text-sm text-slate-600">{update.description}</p>
                </div>
              ))}
              {allUpdates.length === 0 && <p className="text-slate-500">No recent updates.</p>}
            </div>
          </div>
        )}

        {/* LOCATION TAB */}
        {activeTab === 'location' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Project Location</h3>
            <p className="text-slate-600 mb-6 flex items-start gap-2">
              <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              {property.project.location}
            </p>
            <div className="space-y-4">
              <h4 className="font-medium text-slate-700">Location Updates</h4>
              <div className="grid gap-4">
                {(property.project.locationUpdates || []).map((lu: any) => (
                  <div key={lu.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h5 className="font-semibold text-slate-800">{lu.title}</h5>
                    <p className="text-sm text-slate-600 mt-1">{lu.description}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(lu.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {(!property.project.locationUpdates ||
                  property.project.locationUpdates.length === 0) && (
                  <p className="text-sm text-slate-500">No location updates available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MARKET VALUE TAB */}
        {activeTab === 'market-value' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Company-provided / indicative market value
              </p>
              <h3 className="text-5xl font-bold text-slate-800 mb-4">
                ₹{currentMarketValue.toLocaleString()}
              </h3>
              <div className="flex justify-center items-center gap-4 text-sm font-medium">
                <span className="text-slate-500">
                  Purchase Price: ₹{property.price.toLocaleString()}
                </span>
                <span className={valueDifference >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {valueDifference >= 0 ? '+' : ''}₹{valueDifference.toLocaleString()} (
                  {valueDifference >= 0 ? '+' : ''}
                  {valuePercentage}%)
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Valuation History</h3>
              <div className="divide-y divide-slate-100">
                {(property.marketValueHistory || []).map((h: any) => (
                  <div key={h.id} className="py-3 flex justify-between">
                    <span className="text-slate-600">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-slate-800">
                      ₹{h.value.toLocaleString()}
                    </span>
                  </div>
                ))}
                {(!property.marketValueHistory || property.marketValueHistory.length === 0) && (
                  <p className="py-3 text-slate-500 text-sm">No historical data available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESALE TAB */}
        {activeTab === 'resale' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl">
            <h3 className="font-semibold text-slate-800 mb-2">Request Property Resale</h3>
            <p className="text-slate-500 text-sm mb-6">
              Submit a request to our management team to list your property for resale. The current
              indicative market value is ₹{currentMarketValue.toLocaleString()}.
            </p>

            {resaleSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                <h4 className="font-bold">Request Submitted Successfully</h4>
                <p className="text-sm mt-1">
                  Our team will review your resale request and contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={submitResaleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Expected Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={resalePrice}
                    onChange={(e) => setResalePrice(e.target.value)}
                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter expected amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason / Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={resaleReason}
                    onChange={(e) => setResaleReason(e.target.value)}
                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide additional details or contact preferences"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={resaleSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70"
                >
                  {resaleSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl">
            <h3 className="font-semibold text-slate-800 mb-2">Submit Property Documents</h3>
            <p className="text-slate-500 text-sm mb-6">
              Upload required documents strictly related to this property.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
              <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-1">Click to browse or drag files here</p>
              <p className="text-xs text-slate-400">PDF, JPG, or PNG (Max 5MB)</p>
              <button className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors">
                Select File
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
              Uploaded documents will securely attach to{' '}
              <strong>
                {property.project.name} - {property.propertyNumber}
              </strong>{' '}
              and appear in your master Documents tab after verification.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
