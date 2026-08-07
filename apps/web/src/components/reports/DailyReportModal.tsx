import React, { useState, useEffect } from 'react';
import { FileText, Send, AlertCircle, X, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, fetchWithAuth } = useAuth();
  const roleName = user?.roles[0] || 'Staff (generic)';

  // Form Metric State
  const [callsMade, setCallsMade] = useState('0');
  const [siteVisits, setSiteVisits] = useState('0');
  const [leadsQualified, setLeadsQualified] = useState('0');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [belowTargetReason, setBelowTargetReason] = useState('');

  // Target State
  const [activeTarget, setActiveTarget] = useState<any>(null);
  const [isBelowTarget, setIsBelowTarget] = useState(false);
  const [missedWarning, setMissedWarning] = useState<string | null>(null);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechSupport(!!SpeechRecognition);
  }, []);

  // Fetch active target on modal open
  useEffect(() => {
    if (isOpen) {
      fetchWithAuth(`${API_BASE_URL}/targets/my-target`)
        .then((res) => res.json())
        .then((data) => {
          if (data.target && data.target.targets_json) {
            setActiveTarget(data.target.targets_json);
          }
        })
        .catch(() => console.error('Failed to load target'));
    }
  }, [isOpen]);

  // Check for below target counts
  useEffect(() => {
    if (!activeTarget) return;

    const warnings: string[] = [];

    if (activeTarget.callsMade !== undefined) {
      const c = parseInt(callsMade, 10) || 0;
      if (c < activeTarget.callsMade) warnings.push(`Calls Made (${c}/${activeTarget.callsMade})`);
    }

    if (activeTarget.siteVisits !== undefined) {
      const v = parseInt(siteVisits, 10) || 0;
      if (v < activeTarget.siteVisits) warnings.push(`Site Visits (${v}/${activeTarget.siteVisits})`);
    }

    if (warnings.length > 0) {
      setIsBelowTarget(true);
      setMissedWarning(`Submitted count is below target: ${warnings.join(', ')}`);
    } else {
      setIsBelowTarget(false);
      setMissedWarning(null);
    }
  }, [callsMade, siteVisits, leadsQualified, activeTarget]);

  // Voice Dictation Toggle with Duplicate Word Prevention
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const toggleVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const baseText = summaryNotes;

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionInstance(recognition);
      };

      recognition.onend = () => {
        setIsListening(false);
        setRecognitionInstance(null);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setRecognitionInstance(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        const combined = `${baseText} ${finalTranscript} ${interimTranscript}`
          .replace(/\s+/g, ' ')
          .trim();

        setSummaryNotes(combined);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Below Target Reason Check: Minimum 15 characters required if below target
    if (isBelowTarget && belowTargetReason.trim().length < 15) {
      setErrorMessage('Your metrics are below target. A valid explanation (minimum 15 characters) is required before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      const metrics: Record<string, any> = {
        callsMade: parseInt(callsMade, 10) || 0,
        siteVisits: parseInt(siteVisits, 10) || 0,
        leadsQualified: parseInt(leadsQualified, 10) || 0,
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/reports/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_name: roleName,
          metrics,
          summary_notes: summaryNotes,
          below_target_reason: belowTargetReason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit daily report');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 animate-scaleUp relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Work Log</h2>
          <p className="text-xs text-slate-500 mt-1">Submit today's work summary to unlock your logout gate</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Reporting Role:</span>
            <span className="font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-md">{roleName}</span>
          </div>

          {/* Metric Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Calls Made</label>
              <input
                type="number"
                min="0"
                value={callsMade}
                onChange={(e) => setCallsMade(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
              />
              {activeTarget?.callsMade && (
                <span className="text-[10px] text-slate-400 font-mono">Target: {activeTarget.callsMade}</span>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Site Visits</label>
              <input
                type="number"
                min="0"
                value={siteVisits}
                onChange={(e) => setSiteVisits(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
              />
              {activeTarget?.siteVisits && (
                <span className="text-[10px] text-slate-400 font-mono">Target: {activeTarget.siteVisits}</span>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Leads Qualified</label>
              <input
                type="number"
                min="0"
                value={leadsQualified}
                onChange={(e) => setLeadsQualified(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
              />
            </div>
          </div>

          {/* Sub-Target Warning & Reason Box */}
          {isBelowTarget && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{missedWarning}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Reason for Missing Target (Minimum 15 characters required) *
                </label>
                <textarea
                  value={belowTargetReason}
                  onChange={(e) => setBelowTargetReason(e.target.value)}
                  required
                  rows={2}
                  placeholder="Explain why target was missed (e.g. Spent 3 hours on client site visit and contract review...)"
                  className="w-full p-2.5 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-amber-700 font-mono">
                  Length: {belowTargetReason.length} / 15 chars min
                </span>
              </div>
            </div>
          )}

          {/* Always-Visible Summary Text Area + Mic Dictation Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Work Accomplished Summary</label>

              {/* Silent Fallback: Mic button only renders if browser speech recognition is supported */}
              {hasSpeechSupport && (
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Speak to Dictate Notes'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                </button>
              )}
            </div>

            <textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              required
              rows={3}
              placeholder="Describe key tasks completed, follow-ups, or accomplishments today..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Report & Unlock Logout</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
