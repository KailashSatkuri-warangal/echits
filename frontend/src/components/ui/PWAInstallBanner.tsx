import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed recently
      const dismissed = localStorage.getItem("echits_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowBanner(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("echits_pwa_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-emerald-500/30 flex items-center justify-between gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 font-black text-xl shadow-md">
          ₹
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
            Install eChits App
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">PWA</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">Fast offline access & receipt printing</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Download size={14} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

