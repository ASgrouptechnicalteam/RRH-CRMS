import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, User, Clock, AlertCircle, RefreshCw, XCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { ScanResult } from '../../types';

export const Kiosk: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [mode, setMode] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [scannedData, setScannedData] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on the hidden input to capture scanner keystrokes
  useEffect(() => {
    const focusInput = () => {
      if (mode === 'IDLE' && inputRef.current) {
        inputRef.current.focus();
      }
    };
    focusInput();
    const interval = setInterval(focusInput, 2000);
    return () => clearInterval(interval);
  }, [mode]);

  const resetKiosk = () => {
    setMode('IDLE');
    setScannedData('');
    setScanResult(null);
    setErrorMessage(null);
  };

  const handleScan = async (payload: string) => {
    if (!payload.trim()) return;
    setMode('PROCESSING');
    
    try {
      // First try check-in
      const res = await fetchWithAuth(`${API_BASE_URL}/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload: payload })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      // Check-in success or already checked in
      if (data.alreadyStamped) {
        // If already checked in today, perform Checkout
        const outRes = await fetchWithAuth(`${API_BASE_URL}/attendance/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrPayload: payload })
        });
        
        const outData = await outRes.json();
        
        if (!outRes.ok) {
          throw new Error(outData.error || 'Checkout failed');
        }
        
        setScanResult({
          type: 'CHECK_OUT',
          time: outData.timeIST,
          duration: outData.working_duration_minutes,
        });
      } else {
        setScanResult({
          type: 'CHECK_IN',
          time: data.timeIST,
          status: data.status
        });
      }
      
      setMode('SUCCESS');
      
      // Auto-reset after 5 seconds
      setTimeout(() => {
        resetKiosk();
      }, 5000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
      setMode('ERROR');
      setTimeout(() => resetKiosk(), 5000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan(scannedData);
    }
  };

  // Only authorized roles should run the Kiosk
  if (!user || (user.roles && !user.roles.includes('HR_MANAGER') && !user.roles.includes('ADMIN'))) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold">Unauthorized Terminal</h2>
          <p className="text-slate-400 mt-2">Only HR and Admin can operate the Attendance Kiosk.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white relative overflow-hidden">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-navy-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="z-10 p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">RRH-CRMS</h1>
          <p className="text-navy-400 font-medium text-sm tracking-widest uppercase mt-1">Smart Attendance Kiosk</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} IST</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        {mode === 'IDLE' && (
          <div className="text-center max-w-lg w-full animate-fade-in-up">
            <div className="w-32 h-32 mx-auto mb-8 bg-slate-800 rounded-3xl flex items-center justify-center border-2 border-navy-500/30 shadow-[0_0_50px_rgba(20,184,166,0.1)] relative">
              <div className="absolute inset-0 border border-navy-400/50 rounded-3xl animate-ping opacity-20" />
              <QrCode className="w-16 h-16 text-navy-400" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-slate-100">Show your QR Code</h2>
            <p className="text-slate-400 text-lg mb-8">
              Place your employee QR code in front of the scanner to check in or check out.
            </p>
            
            <div className="relative w-full max-w-sm mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scanner Input / Paste QR Token"
                className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500 text-center font-mono text-sm opacity-50 hover:opacity-100 transition-opacity"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">Physical scanner will type here automatically.</p>
            </div>
          </div>
        )}

        {mode === 'PROCESSING' && (
          <div className="text-center animate-fade-in-up">
            <RefreshCw className="w-24 h-24 mx-auto mb-6 text-navy-500 animate-spin" />
            <h2 className="text-3xl font-bold text-slate-100">Verifying Identity...</h2>
            <p className="text-slate-400 mt-2 text-lg">Please wait a moment.</p>
          </div>
        )}

        {mode === 'SUCCESS' && scanResult && (
          <div className="text-center max-w-md w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl animate-scale-up">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${scanResult.type === 'CHECK_IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-navy-500/20 text-navy-400'}`}>
              {scanResult.type === 'CHECK_IN' ? <CheckCircle2 className="w-12 h-12" /> : <LogOut className="w-12 h-12" />}
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              {scanResult.type === 'CHECK_IN' ? 'Check-In Successful' : 'Check-Out Successful'}
            </h2>
            
            <div className="mt-6 space-y-4">
              <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-700">
                <span className="text-slate-400">Time</span>
                <span className="text-white font-bold font-mono text-lg">{scanResult.time}</span>
              </div>
              
              {scanResult.type === 'CHECK_IN' && (
                <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-700">
                  <span className="text-slate-400">Status</span>
                  <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                    scanResult.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' :
                    scanResult.status === 'LATE' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {scanResult.status}
                  </span>
                </div>
              )}

              {scanResult.type === 'CHECK_OUT' && scanResult.duration !== undefined && (
                <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-700">
                  <span className="text-slate-400">Working Duration</span>
                  <span className="text-navy-400 font-bold">{Math.floor(scanResult.duration / 60)}h {scanResult.duration % 60}m</span>
                </div>
              )}
            </div>

            <p className="text-slate-500 mt-8 text-sm">Returning to home screen...</p>
          </div>
        )}

        {mode === 'ERROR' && (
          <div className="text-center max-w-md w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-red-900/50 shadow-2xl animate-shake">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Scan Failed</h2>
            <p className="text-red-400 mt-2 text-lg">{errorMessage}</p>
            <p className="text-slate-500 mt-8 text-sm">Please try again...</p>
          </div>
        )}
      </main>
      
      <footer className="z-10 p-4 text-center text-slate-500 text-xs border-t border-slate-800 bg-slate-900/50">
        Secured by RRH-CRMS Identity Engine
      </footer>
    </div>
  );
};
