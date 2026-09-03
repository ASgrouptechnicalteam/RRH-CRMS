import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-navy-950 text-white rounded-3xl p-4 shadow-2xl border border-navy-500/30 flex items-center justify-between gap-3 backdrop-blur-xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-navy-500/20 border border-navy-500/40 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-navy-400" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-white flex items-center gap-1">
            Install RS CRM PWA
            <Sparkles className="w-3 h-3 text-amber-400" />
          </h4>
          <p className="text-[10px] text-slate-300">Add to home screen for offline work log dictation & quick access</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={install}
          className="px-3 py-1.5 bg-navy-500 hover:bg-navy-400 text-navy-950 font-extrabold text-[11px] rounded-xl shadow transition-all flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={dismiss}
          className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
