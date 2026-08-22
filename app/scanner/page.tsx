'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, updateDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Html5Qrcode } from 'html5-qrcode';
import { Check, X, User, AlertCircle, Mail, Phone, ShieldCheck, MapPin } from 'lucide-react';
import { useScannerSession } from '../../components/scanner/ScannerSessionProvider';

export default function ScannerView() {
  const { scannerAccount } = useScannerSession();
  const [scannedData, setScannedData] = useState<any>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [cameraError, setCameraError] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(true);
  const transitionLock = useRef<Promise<any>>(Promise.resolve());

  function runSafeCameraTransition(action: () => Promise<void>) {
    transitionLock.current = transitionLock.current
      .then(action)
      .catch((err) => console.error("Camera transition error:", err));
    return transitionLock.current;
  }

  function detectCameraFacing() {
    const videoElement = document.querySelector("#qr-reader video") as HTMLVideoElement;
    if (!videoElement) return;

    const performDetection = () => {
      if (videoElement.srcObject) {
        try {
          const stream = videoElement.srcObject as MediaStream;
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            const label = videoTrack.label?.toLowerCase() || "";
            
            const isFront = 
              settings.facingMode === "user" || 
              label.includes("front") || 
              label.includes("user") || 
              label.includes("selfie") || 
              label.includes("facetime");
            
            setIsFrontCamera(isFront);
            console.log(`Camera detected - Label: "${videoTrack.label}", Front-facing: ${isFront}`);
          }
        } catch (err) {
          console.error("Error detecting camera facing mode:", err);
        }
      }
    };

    performDetection();
    videoElement.addEventListener("loadedmetadata", performDetection, { once: true });
  }

  const forceReleaseCameraHardware = () => {
    try {
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video) => {
        if (video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach((track) => {
            track.stop();
            console.log("Forced hardware track release:", track.label);
          });
          video.srcObject = null;
        }
      });
    } catch (err) {
      console.error("Error forced releasing camera hardware:", err);
    }
  };

  async function startCameraInternal(deviceIdOverride?: string) {
    if (!scannerAccount || scannedData || !cameraActive) return;

    if (scannerRef.current?.isScanning) {
      return;
    }

    // Force release any existing camera hardware locks before starting a new one
    forceReleaseCameraHardware();

    const element = document.getElementById("qr-reader");
    if (!element) return;
    element.innerHTML = ""; // Clear duplicate/stray elements

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      
      const targetDevice = deviceIdOverride || selectedCameraId || { facingMode: "environment" };
      
      await scanner.start(
        targetDevice,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
      
      isScanning.current = true;
      setCameraError(false);
      detectCameraFacing();
      await fetchCameras(deviceIdOverride || selectedCameraId);
    } catch (e) {
      console.error("Failed to start camera:", e);
      setCameraError(true);
    }
  }

  async function stopCameraInternal() {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.error("Failed to stop camera via html5-qrcode:", e);
      }
      scannerRef.current = null;
    }
    
    // Explicitly release all media stream tracks to guarantee the camera indicator light turns off
    forceReleaseCameraHardware();
    
    isScanning.current = false;
    setIsFrontCamera(false);
  }

  async function fetchCameras(activeDeviceId?: string) {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        
        if (activeDeviceId) {
          setSelectedCameraId(activeDeviceId);
        } else {
          const videoElement = document.querySelector("#qr-reader video") as HTMLVideoElement;
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack?.getSettings();
            if (settings && settings.deviceId) {
              setSelectedCameraId(settings.deviceId);
              return;
            }
          }
          setSelectedCameraId(devices[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching cameras:", err);
    }
  }

  // 1. Global Interceptors to prevent uncaught AbortErrors from crashing Next.js dev overlay
  useEffect(() => {
    // Override HTMLVideoElement.prototype.play to cleanly swallow play() AbortErrors at the source
    const originalPlay = HTMLVideoElement.prototype.play;
    
    HTMLVideoElement.prototype.play = function (...args) {
      const promise = originalPlay.apply(this, args);
      if (promise && typeof promise.catch === 'function') {
        return promise.catch((err: any) => {
          if (err && err.name === 'AbortError') {
            console.warn('Muted browser play() AbortError inside HTMLVideoElement:', err);
            return;
          }
          throw err;
        });
      }
      return promise;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason && 
        (event.reason.name === 'AbortError' || 
         event.reason.message?.includes('play() request was interrupted') ||
         event.reason.message?.includes('The play() request was interrupted'))
      ) {
        event.preventDefault();
        console.warn('Prevented unhandled play() AbortError:', event.reason);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.error &&
        (event.error.name === 'AbortError' ||
         event.error.message?.includes('play() request was interrupted') ||
         event.error.message?.includes('The play() request was interrupted'))
      ) {
        event.preventDefault();
        console.warn('Prevented global AbortError:', event.error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
      // Restore original play method on unmount
      HTMLVideoElement.prototype.play = originalPlay;
      runSafeCameraTransition(stopCameraInternal);
    };
  }, []);

  // 2. Camera Trigger Effect when account/active-state/scannedData changes
  useEffect(() => {
    if (scannerAccount && cameraActive && !scannedData) {
      runSafeCameraTransition(startCameraInternal);
    } else {
      runSafeCameraTransition(stopCameraInternal);
    }
  }, [scannerAccount, cameraActive, scannedData]);

  async function onScanSuccess(decodedText: string) {
    if (!isScanning.current) return;
    isScanning.current = false;

    // Stop camera cleanly BEFORE updating the state to avoid interrupting .play()
    await runSafeCameraTransition(stopCameraInternal);

    try {
      const regID = decodedText.trim();
      const regDoc = await getDoc(doc(db, 'registrations', regID));

      if (!regDoc.exists()) {
        setStatus({ type: 'error', message: 'INVALID QR CODE' });
        setTimeout(() => {
          setStatus({ type: 'idle', message: '' });
          // Restart camera because registration was invalid
          runSafeCameraTransition(startCameraInternal);
        }, 2000);
      } else {
        const data = regDoc.data();
        setScannedData({ ...data, id: regID });
      }
    } catch (error) {
      console.error("Scan fetch error:", error);
      setStatus({ type: 'error', message: 'FETCH ERROR' });
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
        // Restart camera on fetch error
        runSafeCameraTransition(startCameraInternal);
      }, 2000);
    }
  }

  const handleAction = async (approved: boolean) => {
    if (processingAction || !scannedData) return;
    setProcessingAction(true);

    try {
      if (approved) {
        if (scannedData.hasEntered) {
          setStatus({ type: 'error', message: 'ALREADY ENTERED' });
        } else {
          const res = await fetch('/api/check-in/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationID: scannedData.id,
              scannerId: scannerAccount.scannerId,
              volunteerName: scannerAccount.volunteerName
            })
          });

          const result = await res.json();
          if (res.ok && result.success) {
            setStatus({ type: 'success', message: 'ENTRY APPROVED' });
          } else {
            setStatus({ type: 'error', message: result.error || 'ACTION FAILED' });
          }
        }
      } else {
        await addDoc(collection(db, 'scanLogs'), {
          scannerId: scannerAccount.scannerId,
          volunteerName: scannerAccount.volunteerName,
          registrationID: scannedData.id,
          attendeeName: scannedData.name,
          timestamp: serverTimestamp(),
          result: 'declined'
        });

        try {
          const { logAdminAction } = await import('../../lib/audit');
          await logAdminAction('SCANNER_DECLINE', `registrations/${scannedData.id}`, `Declined entry for attendee ${scannedData.name}`, scannerAccount.volunteerName || scannerAccount.scannerId);
        } catch (err) {
          console.error("Failed to log scanner decline:", err);
        }

        setStatus({ type: 'idle', message: 'ENTRY DECLINED' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'ACTION FAILED' });
    }

    setTimeout(() => {
      setScannedData(null);
      setStatus({ type: 'idle', message: '' });
      setProcessingAction(false);
    }, 2000);
  };

  const toggleCamera = () => {
    setCameraActive(prev => !prev);
  };

  const dismissDossier = () => {
    setScannedData(null);
    setStatus({ type: 'idle', message: '' });
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedCameraId(deviceId);
    
    runSafeCameraTransition(async () => {
      await stopCameraInternal();
      await startCameraInternal(deviceId);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] select-none font-adminBody animate-in fade-in duration-200">
      
      {/* Centered Work Container */}
      <div className="w-full max-w-lg">
        
        {/* Status Banners */}
        {status.message && (
          <div className={`w-full p-4 mb-6 border-4 border-brand-ink flex items-center gap-3 animate-in fade-in shadow-[4px_4px_0px_0px_#030404] rounded-md ${
            status.type === 'success' ? 'bg-green-50 text-green-800 border-green-700' :
            status.type === 'error' ? 'bg-red-50 text-red-800 border-red-700' : 'bg-white text-brand-ink'
          }`}>
            {status.type === 'success' ? <Check size={20} className="stroke-[3]" /> : <AlertCircle size={20} className="stroke-[3]" />}
            <span className="font-bold uppercase text-xs tracking-widest leading-none font-adminBody">{status.message}</span>
          </div>
        )}

        {/* Viewfinder Card - Always mounted to prevent DOM unmount race-conditions and camera resource leaks */}
        <div className={`bg-white border-4 border-brand-ink p-6 rounded-md shadow-[6px_6px_0px_0px_#030404] flex-col items-center gap-6 justify-center w-full ${scannedData ? 'hidden' : 'flex'}`}>
          {/* QR Scanner view box wrapper */}
          <div className="w-full max-w-sm aspect-square bg-white border-4 border-brand-ink overflow-hidden relative shadow-[4px_4px_0px_0px_#030404] rounded-md">
            
            {/* Camera Viewfinder DOM element - always visible in flow to prevent Chrome AbortError play() exceptions */}
            <div 
              id="qr-reader" 
              className={`w-full h-full bg-white relative z-10 ${isFrontCamera ? 'mirrored' : ''}`}
            ></div>

            {/* Stopped Camera Placeholder overlay - positioned absolute on top (z-20) to cover the viewfinder */}
            {!cameraActive && (
              <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-6 text-center bg-brand-cloud z-20">
                <div className="p-3 border-2 border-brand-ink bg-white text-brand-ink rounded-md shadow-[2px_2px_0px_0px_#030404] mb-3 animate-in zoom-in-75">
                  <AlertCircle className="text-brand-orange" size={24} />
                </div>
                <h3 className="font-adminHeading text-lg font-black uppercase text-brand-ink">Camera Stopped</h3>
              </div>
            )}

            {/* Error Placeholder overlay - z-20 to cover the viewfinder */}
            {cameraActive && cameraError && (
              <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-8 text-center bg-white z-20">
                <AlertCircle className="text-brand-orange mb-2" size={32} />
                <p className="text-[10px] font-bold text-brand-ink uppercase tracking-widest font-adminBody">Camera Access Blocked</p>
              </div>
            )}
          </div>

          {/* Toggle Camera Button */}
          <button 
            onClick={toggleCamera}
            className="w-full max-w-sm bg-white hover:bg-brand-cloud text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-widest text-xs shadow-[3px_3px_0px_0px_#030404] rounded-md py-3.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#030404] cursor-pointer flex items-center justify-center gap-2 animate-in fade-in"
          >
            {cameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>

          {/* Camera Selection Dropdown */}
          {cameraActive && cameras.length > 1 && (
            <div className="w-full max-w-sm flex flex-col gap-1.5 animate-in fade-in mt-4">
              <label className="text-[9px] font-bold text-admin-muted uppercase tracking-widest font-adminBody">
                Select Video Camera
              </label>
              <div className="relative w-full">
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="w-full bg-white text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-[11px] rounded-md py-3 px-4 shadow-[3px_3px_0px_0px_#030404] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#030404] cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-brand-ink/20 pr-10"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-brand-ink">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dossier Verification Card (Visible when ticket is scanned) */}
        {scannedData && (
          <div className="w-full bg-white border-4 border-brand-ink p-6 flex flex-col animate-in zoom-in-95 duration-200 rounded-md shadow-[6px_6px_0px_0px_#030404] my-2">
            
            {/* Header with simple title & Status badge */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-brand-ink/10">
              <div>
                <h2 className="font-adminHeading text-xl font-black uppercase tracking-tight text-brand-ink">Verify Ticket</h2>
                <p className="text-admin-muted font-bold text-[9px] uppercase tracking-widest mt-0.5 font-adminBody">
                  ID: {scannedData.id}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {scannedData.hasEntered && (
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase border-2 border-brand-ink rounded-md shadow-[2px_2px_0px_0px_#030404] bg-red-100 text-red-800 border-red-700 font-adminBody">
                    Already Inside
                  </div>
                )}
                
                {/* Dismiss Cross Button */}
                <button
                  onClick={dismissDossier}
                  className="p-1.5 bg-white hover:bg-brand-cloud text-brand-ink border-2 border-brand-ink rounded-md shadow-[2px_2px_0px_0px_#030404] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#030404] cursor-pointer flex items-center justify-center"
                  title="Close Dossier"
                >
                  <X size={16} className="stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Main simplified details */}
            <div className="space-y-4 mb-6">
              
              {/* Attendee Name & profile detail */}
              <div className="bg-[#F5F1E5]/40 p-4 border-2 border-brand-ink rounded-md flex flex-col gap-2">
                <div>
                  <span className="text-[8px] font-bold text-admin-muted uppercase tracking-widest block mb-0.5">Attendee Name</span>
                  <span className="font-adminHeading text-xl font-black uppercase text-brand-ink leading-tight block">{scannedData.name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-brand-ink/10 pt-3">
                  <div>
                    <span className="text-[8px] font-bold text-admin-muted uppercase tracking-widest block mb-0.5">Application Number</span>
                    <span className="text-xs font-bold text-brand-ink block">{scannedData.registrationNumber || scannedData.rollNumber || scannedData.id}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-admin-muted uppercase tracking-widest block mb-0.5">Mobile</span>
                    <span className="text-xs font-bold text-brand-ink block">{scannedData.phone || scannedData.mobile || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-brand-ink/10 pt-3">
                  <div>
                    <span className="text-[8px] font-bold text-admin-muted uppercase tracking-widest block mb-0.5">Parent&apos;s Name</span>
                    <span className="text-xs font-bold text-brand-ink block">{scannedData.parentName || scannedData.fatherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-admin-muted uppercase tracking-widest block mb-0.5">Region / State</span>
                    <span className="text-xs font-bold text-brand-ink block">{scannedData.region || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Already Checked In Detail Alert */}
              {scannedData.hasEntered && (
                <div className="bg-red-50 text-red-900 border-2 border-red-700 p-3.5 rounded-md flex gap-2.5 items-start">
                  <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5 stroke-[3]" />
                  <div className="text-[10px] font-bold uppercase tracking-wide font-adminBody leading-relaxed">
                    <p className="font-extrabold text-red-800">Warning: Already Entered</p>
                    <p className="text-[8px] text-red-700/80 mt-0.5">
                      Checked in at: {scannedData.enteredAt ? new Date(scannedData.enteredAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                    </p>
                    {scannedData.enteredBy && (
                      <p className="text-[8px] text-red-700/80">Operator: {scannedData.enteredBy}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons (Decline/Approve) */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-brand-ink flex-shrink-0">
              <button 
                disabled={processingAction}
                onClick={() => handleAction(false)}
                className="bg-white hover:bg-brand-cloud text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-xs shadow-[3px_3px_0px_0px_#030404] rounded-md py-3.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#030404] cursor-pointer flex items-center justify-center gap-2"
              >
                <X size={14} className="stroke-[3]" /> Decline
              </button>
              <button 
                disabled={processingAction || scannedData.hasEntered}
                onClick={() => handleAction(true)}
                className="bg-brand-orange hover:bg-brand-orange/95 text-brand-ink border-2 border-brand-ink font-adminHeading uppercase tracking-wider text-xs shadow-[3px_3px_0px_0px_#030404] rounded-md py-3.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#030404] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={14} className="stroke-[3]" /> Approve
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        #qr-reader { border: none !important; width: 100% !important; height: 100% !important; }
        #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        #qr-reader.mirrored video { transform: scaleX(-1) !important; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(3, 4, 4, 0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
}
