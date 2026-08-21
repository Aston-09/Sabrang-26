"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCaptchaContextType {
  executeRecaptcha: (action: string) => Promise<string | null>;
  isLoaded: boolean;
}

const ReCaptchaContext = createContext<ReCaptchaContextType>({
  executeRecaptcha: async () => null,
  isLoaded: false,
});

export const useReCaptcha = () => useContext(ReCaptchaContext);

interface ReCaptchaProviderProps {
  children: React.ReactNode;
}

export function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Hide any dynamically injected badge directly on the DOM
    const hideBadges = () => {
      const badges = document.querySelectorAll<HTMLElement>(
        ".grecaptcha-badge, div[style*='z-index: 2000000000']",
      );
      badges.forEach((b) => {
        b.style.setProperty("visibility", "hidden", "important");
        b.style.setProperty("opacity", "0", "important");
        b.style.setProperty("pointer-events", "none", "important");
        b.style.setProperty("display", "none", "important");
      });
    };

    hideBadges();
    const interval = setInterval(hideBadges, 800);
    const observer = new MutationObserver(hideBadges);
    observer.observe(document.body, { childList: true, subtree: true });

    if (!siteKey) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. Skipping reCAPTCHA script injection.",
        );
      }
      return () => {
        clearInterval(interval);
        observer.disconnect();
      };
    }

    if (typeof window !== "undefined" && window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsLoaded(true);
        hideBadges();
      });
    }

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [siteKey]);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (!siteKey) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[reCAPTCHA] Simulated execution for action: "${action}" (NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set).`,
          );
          return "dev-mock-recaptcha-token";
        }
        return null;
      }

      if (typeof window === "undefined" || !window.grecaptcha) {
        console.warn("[reCAPTCHA] grecaptcha is not available yet.");
        return null;
      }

      try {
        return await new Promise<string | null>((resolve) => {
          window.grecaptcha!.ready(async () => {
            try {
              const token = await window.grecaptcha!.execute(siteKey, {
                action: action.replace(/[^a-zA-Z0-9_/]/g, "_"),
              });
              resolve(token);
            } catch (err) {
              console.error("[reCAPTCHA] Execution failed:", err);
              resolve(null);
            }
          });
        });
      } catch (err) {
        console.error("[reCAPTCHA] Unexpected error executing reCAPTCHA:", err);
        return null;
      }
    },
    [siteKey],
  );

  return (
    <ReCaptchaContext.Provider value={{ executeRecaptcha, isLoaded }}>
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="lazyOnload"
          onLoad={() => {
            if (window.grecaptcha) {
              window.grecaptcha.ready(() => {
                setIsLoaded(true);
              });
            }
          }}
        />
      )}
      {children}
    </ReCaptchaContext.Provider>
  );
}

export default ReCaptchaProvider;
