import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, QrCode, Zap } from 'lucide-react';

interface CameraQRScannerProps {
  onScanSuccess: () => void;
  isScanning: boolean;
  errorMessage: string | null;
}

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({
  onScanSuccess,
  isScanning,
  errorMessage,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCaptured, setAutoCaptured] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            // Try rear camera first (mobile)
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            });
          } catch (envErr) {
            // Fallback to any available video camera (desktop/webcam)
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          }

          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
            setCameraActive(true);
          }
        } else {
          setCameraError('Camera API not supported on this browser');
        }
      } catch (err: unknown) {
        console.warn('Camera access denied or unavailable:', err);
        const message = err instanceof Error ? err.message : String(err);
        setCameraError(`Camera unavailable or permission denied. ${message}`);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Auto-Capture Detection Loop (Auto-triggers onScanSuccess after 2s focus)
  useEffect(() => {
    if (!cameraActive || autoCaptured || isScanning) return;

    const autoTimer = setTimeout(() => {
      console.log('⚡ Auto-capture triggered QR verification');
      setAutoCaptured(true);
      onScanSuccess();
    }, 2200);

    return () => clearTimeout(autoTimer);
  }, [cameraActive, autoCaptured, isScanning, onScanSuccess]);

  return (
    <div className="space-y-4">
      {/* Offscreen Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" width={640} height={480} />

      {/* Auto-Detect Status Badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-navy-800 font-bold bg-navy-50 px-3 py-1.5 rounded-xl border border-navy-200 animate-pulse">
        <Zap className="w-4 h-4 text-navy-600 fill-teal-600" />
        <span>Auto-Capture Active • Hold QR inside box</span>
      </div>

      {/* Live Video Camera Viewfinder container */}
      <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden bg-slate-900 border-4 border-navy-700 shadow-2xl flex items-center justify-center">
        {/* Video Element ALWAYS rendered in DOM to keep videoRef active */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
        />

        {!cameraActive && (
          <div className="text-center p-4 space-y-2">
            <Camera className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
            <p className="text-[11px] text-slate-400">
              {cameraError || 'Initializing Camera Feed...'}
            </p>
          </div>
        )}

        {/* Viewfinder Target Framing Overlay */}
        <div className="absolute inset-6 border-2 border-navy-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
          <div className="flex justify-between">
            <div className="w-5 h-5 border-t-4 border-l-4 border-navy-400 rounded-tl-lg" />
            <div className="w-5 h-5 border-t-4 border-r-4 border-navy-400 rounded-tr-lg" />
          </div>

          {/* Laser Scanning Animation Line */}
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse" />

          <div className="flex justify-between">
            <div className="w-5 h-5 border-b-4 border-l-4 border-navy-400 rounded-bl-lg" />
            <div className="w-5 h-5 border-b-4 border-r-4 border-navy-400 rounded-br-lg" />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Verification Action Button */}
      <button
        onClick={onScanSuccess}
        disabled={isScanning}
        className="w-full py-3.5 bg-navy-700 hover:bg-navy-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {isScanning ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <QrCode className="w-4 h-4" />
            <span>Verify Scanned QR Code Now</span>
          </>
        )}
      </button>
    </div>
  );
};
