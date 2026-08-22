'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, updateDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { Html5Qrcode } from 'html5-qrcode';
import { Check, X, User, AlertCircle, Mail, Phone, Loader2 } from 'lucide-react';

export default function AdminScannerView() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // States for scanner console
  const [scannedData, setScannedData] = useState<any>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [cameraError, setCameraError] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedScanEvent, setSelectedScanEvent] = useState<string>('all');
  const [availableEvents, setAvailableEvents] = useState<string[]>([
    'PANACHE - RAMPWALK',
    'BANDJAM - BATTLE OF BANDS',
    'STEP UP - SOLO DANCE',
    'SYNC - GROUP DANCE',
    'ECHOES OF NOOR - SUFI NIGHT',
    'VERSEVAAD - SLAM POETRY',
    'VALORANT SHOWDOWN',
    'GENERAL FEST ENTRY'
  ]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(true);
  const transitionLock = useRef<Promise<any>>(Promise.resolve());

  // 1. Session Guard and Role Authorization Check
  useEffect(() => {
    // Check session fallback first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sabrang_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role === 'admin' || parsed.role === 'scanner') {
            setAdminEmail(parsed.email || 'Admin');
            setAuthorized(true);
            setLoadingSession(false);
            return;
          }
        } catch {}
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (typeof window !== 'undefined' && sessionStorage.getItem('sabrang_auth')) {
          setAuthorized(true);
          setLoadingSession(false);
          return;
        }
        router.push('/login');
        return;
      }

      setAdminEmail(user.email || 'Admin');
      setAuthorized(true);
      setLoadingSession(false);
    });

    return () => unsubscribe();
  }, [router]);

  function runSafeCameraTransition(action: () => Promise<void>) {
    transitionLock.current = transitionLock.current
      .then(action)
      .catch((err) => console.error("Camera transition error:", err));
    return transitionLock.current;
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

  async function startCameraInternal(deviceIdOverride?: string) {
    if (!authorized || scannedData || !cameraActive) return;

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

  // 2. Global Interceptors to prevent uncaught AbortErrors from crashing Next.js dev overlay
  useEffect(() => {
    if (!authorized) return;

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
  }, [authorized]);

  // 3. Camera Trigger Effect when account/active-state/scannedData changes
  useEffect(() => {
    if (authorized && cameraActive && !scannedData) {
      runSafeCameraTransition(startCameraInternal);
    } else {
      runSafeCameraTransition(stopCameraInternal);
    }
  }, [authorized, cameraActive, scannedData]);

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
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationID: scannedData.id,
            eventId: selectedScanEvent === 'all' ? undefined : selectedScanEvent,
            eventTitle: selectedScanEvent === 'all' ? undefined : selectedScanEvent,
            scannerId: 'ADMIN',
            volunteerName: adminEmail
          })
        });

        const result = await res.json();
        if (res.ok && result.success) {
          setStatus({ 
            type: 'success', 
            message: `ENTRY SUCCESSFUL • ${result.attendee?.name || scannedData.name}` 
          });
        } else {
          setStatus({ 
            type: 'error', 
            message: result.error || result.code || 'ENTRY VALIDATION FAILED' 
          });
        }
      } else {
        await addDoc(collection(db, 'scanLogs'), {
          scannerId: 'ADMIN',
          volunteerName: adminEmail,
          registrationID: scannedData.id,
          attendeeName: scannedData.name,
          eventTitle: selectedScanEvent,
          timestamp: serverTimestamp(),
          result: 'declined'
        });

        try {
          const { logAdminAction } = await import('../../../lib/audit');
          await logAdminAction('SCANNER_DECLINE_ADMIN', `registrations/${scannedData.id}`, `Declined entry for attendee ${scannedData.name} via admin scanner console`, adminEmail);
        } catch (err) {
          console.error("Failed to log admin scanner decline:", err);
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

  if (loadingSession) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-ink mx-auto" size={48} />
          <p className="text-admin-muted text-xs font-bold uppercase tracking-widest font-adminBody">
            Verifying Admin Scanner Access...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)]  font-adminBody animate-in fade-in duration-200">
      
      {/* Centered Work Container */}
      <div className="w-full max-w-lg">
        
        {/* Status Banners */}
        {status.message && (
          <div className={`w-full p-4 mb-4 border rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            status.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-white text-slate-800 border-slate-200'
          }`}>
            {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span className="font-semibold text-xs leading-none">{status.message}</span>
          </div>
        )}

        {/* Event Selector for Event-Specific Entry Scanning */}
        <div className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-xs mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Scanning For Event
          </label>
          <select
            value={selectedScanEvent}
            onChange={(e) => setSelectedScanEvent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-lg py-2.5 px-3 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">All Events (Global Fest Entry)</option>
            {availableEvents.map((evt) => (
              <option key={evt} value={evt}>{evt}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Tickets for other events will be rejected with "WRONG EVENT" when a specific event is selected.
          </p>
        </div>

        {/* Viewfinder Card - Always mounted to prevent DOM unmount race-conditions and camera resource leaks */}
        <div className={`bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex-col items-center gap-5 justify-center w-full ${scannedData ? 'hidden' : 'flex'}`}>
          {/* QR Scanner view box wrapper */}
          <div className="w-full max-w-sm aspect-square bg-slate-900 border border-slate-200 overflow-hidden relative rounded-xl shadow-inner">
            
            {/* Camera Viewfinder DOM element */}
            <div 
              id="qr-reader" 
              className={`w-full h-full bg-slate-900 relative z-10 ${isFrontCamera ? 'mirrored' : ''}`}
            ></div>

            {/* Stopped Camera Placeholder overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 z-20">
                <div className="p-3 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-xs mb-3">
                  <AlertCircle className="text-purple-600" size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Camera Inactive</h3>
                <p className="text-xs text-slate-500 mt-1">Click Start Camera to begin scanning</p>
              </div>
            )}

            {/* Error Placeholder overlay */}
            {cameraActive && cameraError && (
              <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-8 text-center bg-white z-20">
                <AlertCircle className="text-rose-600 mb-2" size={32} />
                <p className="text-xs font-semibold text-slate-700">Camera Access Blocked</p>
              </div>
            )}
          </div>

          {/* Toggle Camera Button */}
          <button 
            onClick={toggleCamera}
            className={`w-full max-w-sm font-semibold text-xs rounded-lg py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
              cameraActive 
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {cameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>

          {/* Camera Selection Dropdown */}
          {cameraActive && cameras.length > 1 && (
            <div className="w-full max-w-sm flex flex-col gap-1.5 mt-2">
              <label className="text-[11px] font-medium text-slate-500">
                Select Video Camera
              </label>
              <div className="relative w-full">
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="w-full bg-white text-slate-800 border border-slate-200 text-xs rounded-lg py-2.5 px-3 focus:outline-none cursor-pointer pr-10 shadow-xs"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Dossier Verification Card (Visible when ticket is scanned) */}
        {scannedData && (
          <div className="w-full bg-white border border-slate-200 p-6 flex flex-col animate-in zoom-in-95 duration-200 rounded-xl shadow-sm my-2">
            
            {/* Header with simple title & Status badge */}
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Verify Ticket</h2>
                <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                  ID: {scannedData.id}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {scannedData.hasEntered && (
                  <div className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    Already Inside
                  </div>
                )}
                
                {/* Dismiss Cross Button */}
                <button
                  onClick={dismissDossier}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Main details */}
            <div className="space-y-4 mb-6">
              
              {/* Attendee Name & profile detail */}
              <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl flex flex-col gap-2">
                <div>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-0.5">Attendee Name</span>
                  <span className="text-lg font-bold text-slate-900 leading-tight block">{scannedData.name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-0.5">Application Number</span>
                    <span className="text-xs font-semibold text-slate-800 block font-mono">{scannedData.registrationNumber || scannedData.rollNumber || scannedData.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-0.5">Mobile</span>
                    <span className="text-xs font-semibold text-slate-800 block">{scannedData.phone || scannedData.mobile || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-0.5">Parent&apos;s Name</span>
                    <span className="text-xs font-semibold text-slate-800 block">{scannedData.parentName || scannedData.fatherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-0.5">Region / State</span>
                    <span className="text-xs font-semibold text-slate-800 block">{scannedData.region || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Already Checked In Detail Alert */}
              {scannedData.hasEntered && (
                <div className="bg-rose-50 text-rose-900 border border-rose-200 p-3.5 rounded-xl flex gap-2.5 items-start">
                  <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-rose-800">Warning: Already Entered</p>
                    <p className="text-[11px] text-rose-700/80 mt-0.5">
                      Checked in at: {scannedData.enteredAt ? new Date(scannedData.enteredAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                    </p>
                    {scannedData.enteredBy && (
                      <p className="text-[11px] text-rose-700/80">Operator: {scannedData.enteredBy}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons (Decline/Approve) */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 shrink-0">
              <button 
                disabled={processingAction}
                onClick={() => handleAction(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <X size={14} /> Decline
              </button>
              <button 
                disabled={processingAction || scannedData.hasEntered}
                onClick={() => handleAction(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Check size={14} /> Approve Check-In
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
