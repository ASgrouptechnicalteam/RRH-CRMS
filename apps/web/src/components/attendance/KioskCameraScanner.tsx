import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, FlipHorizontal, AlertCircle } from 'lucide-react';

interface KioskCameraScannerProps {
  onScan: (decodedText: string) => void;
  isActive: boolean;
}

export const KioskCameraScanner: React.FC<KioskCameraScannerProps> = ({ onScan, isActive }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  
  // Track mounting to prevent state updates on unmounted component
  const mounted = useRef(true);
  
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    const initCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0 && mounted.current) {
          setHasPermission(true);
          setCameras(devices);
          
          // Try to find front-facing camera first (usually contains "front" or is the first one)
          const frontCamera = devices.find(d => d.label.toLowerCase().includes('front'));
          setActiveCameraId(frontCamera ? frontCamera.id : devices[0].id);
        } else if (mounted.current) {
          setError('No cameras found on this device.');
        }
      } catch (err) {
        if (mounted.current) {
          setError('Camera permission denied. Please allow camera access.');
        }
      }
    };

    if (isActive) {
      initCameras();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !activeCameraId) return;

    const startScanner = async () => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      } else if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      try {
        await scannerRef.current.start(
          activeCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted.current) {
              onScanRef.current(decodedText);
            }
          },
          (errorMessage) => {
            // ignore continuous parse errors
          }
        );
      } catch (err) {
        if (mounted.current) {
          setError('Failed to start camera.');
        }
      }
    };

    startScanner();

  }, [activeCameraId, isActive]);

  const toggleCamera = () => {
    if (cameras.length > 1 && activeCameraId) {
      const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setActiveCameraId(cameras[nextIndex].id);
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center w-full">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      ) : (
        <div className="relative w-full aspect-square bg-slate-800 rounded-3xl overflow-hidden border-2 border-navy-500/30 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
          <div id="qr-reader" className="w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
          
          {/* Overlay to make it look premium */}
          <div className="absolute inset-0 pointer-events-none border border-navy-400/50 rounded-3xl animate-pulse opacity-30" />
          
          {/* Camera Switcher Button */}
          {cameras.length > 1 && (
            <button
              onClick={toggleCamera}
              className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md p-3 rounded-full text-white transition-colors border border-slate-700 shadow-lg"
              title="Switch Camera"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      
      <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
        <Camera className="w-4 h-4" />
        <span>Align QR code within the frame</span>
      </div>
    </div>
  );
};
