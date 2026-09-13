import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';

export const ContentApproval = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const fetchQueue = async () => {
    try {
      const res = await api.get('/system/content/employee?status=Pending Verification');
      const all: any[] = [];
      Object.keys(res.data).forEach((key) => all.push(...res.data[key]));

      setQueue(
        all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id: string, type: string, action: 'Approve' | 'Reject') => {
    if (action === 'Reject' && !rejectionReasons[id]) {
      alert('Rejection reason is required.');
      return;
    }

    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post('/system/content/verify', {
        type,
        id,
        action,
        reason: action === 'Reject' ? rejectionReasons[id] : undefined,
      });
      fetchQueue();
    } catch (err) {
      console.error(err);
      alert('Failed to verify content.');
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <div className="text-slate-400">Loading queue...</div>;

  return (
    <div className="max-w-6xl space-y-6">
      <h2 className="text-3xl font-bold text-white">Content Approval Queue</h2>
      <p className="text-slate-400">Verify and publish drafts created by DEM operations.</p>

      {queue.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
          The content approval queue is empty.
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side: Content Preview */}
              <div className="p-6 md:w-2/3 border-b md:border-b-0 md:border-r border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded">
                    {item._type}
                  </span>
                  <span className="text-sm text-slate-500">
                    Drafted: {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  {item.description || item.message || item.content}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {item.imageUrl && (
                    <div className="col-span-2">
                      <p className="text-slate-500 mb-1">Attached Media:</p>
                      <img
                        src={item.imageUrl}
                        alt="Content"
                        className="h-32 rounded object-cover"
                      />
                    </div>
                  )}
                  {item.targetCompanyId && (
                    <div>
                      <p className="text-slate-500">Target Company:</p>
                      <p className="text-slate-300 font-medium">{item.targetCompanyId}</p>
                    </div>
                  )}
                  {item.targetProjectId && (
                    <div>
                      <p className="text-slate-500">Target Project:</p>
                      <p className="text-slate-300 font-medium">{item.targetProjectId}</p>
                    </div>
                  )}
                  {item.actionUrl && (
                    <div className="col-span-2">
                      <p className="text-slate-500">CTA Link:</p>
                      <a
                        href={item.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {item.actionUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Verification Actions */}
              <div className="p-6 md:w-1/3 bg-slate-800/50 flex flex-col justify-center">
                <h4 className="font-semibold text-white mb-4">Verification Action</h4>

                <div className="space-y-4">
                  <button
                    disabled={processing[item.id]}
                    onClick={() => handleAction(item.id, item._type, 'Approve')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                  >
                    {processing[item.id] ? 'Processing...' : 'Approve & Publish'}
                  </button>

                  <div className="relative pt-4 border-t border-slate-700 space-y-3">
                    <label className="text-sm text-slate-400 block">Or Reject with Reason:</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm"
                      placeholder="Explain why this content needs modification..."
                      value={rejectionReasons[item.id] || ''}
                      onChange={(e) =>
                        setRejectionReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    ></textarea>

                    <button
                      disabled={processing[item.id]}
                      onClick={() => handleAction(item.id, item._type, 'Reject')}
                      className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 disabled:opacity-50 font-medium rounded-lg transition-colors"
                    >
                      Reject & Return to DEM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
