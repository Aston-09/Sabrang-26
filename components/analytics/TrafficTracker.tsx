'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getDeviceType(): 'Mobile' | 'Tablet' | 'Desktop' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

function getOSName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
  return 'OS';
}

export default function TrafficTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastLoggedPathRef = useRef<string>('');

  useEffect(() => {
    // Avoid tracking internal admin dashboard navigation to keep public analytics clean
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const currentFullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    // Prevent duplicate logs on same path
    if (lastLoggedPathRef.current === currentFullPath) {
      return;
    }
    lastLoggedPathRef.current = currentFullPath;

    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('sabrang_visitor_sid') || '';
      if (!sessionId) {
        sessionId = 'sid_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        sessionStorage.setItem('sabrang_visitor_sid', sessionId);
      }
    } catch {
      sessionId = 'sid_anon';
    }

    const payload = {
      path: pathname,
      fullUrl: typeof window !== 'undefined' ? window.location.href : pathname,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct / Organic',
      device: getDeviceType(),
      browser: getBrowserName(),
      os: getOSName(),
      screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown',
      sessionId,
      timestamp: new Date().toISOString(),
    };

    // Send asynchronous background tracking beacon
    try {
      fetch('/api/track-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [pathname, searchParams]);

  return null;
}
