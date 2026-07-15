import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const IosInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the user is on an iOS device
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Check if the app is already installed (running in standalone mode)
    const isStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };

    // Check if the user has already dismissed the prompt
    const hasDismissed = localStorage.getItem('iosInstallPromptDismissed');

    // Only show if on iOS, NOT installed, and NOT dismissed
    if (isIos() && !isStandalone() && !hasDismissed) {
      // Delay showing the prompt slightly so it's not too aggressive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('iosInstallPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg animate-in slide-in-from-bottom-full duration-500">
      <div className="flex items-start justify-between gap-4 max-w-md mx-auto relative">
        
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 p-1 text-muted-foreground hover:text-foreground bg-background rounded-full border shadow-sm"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <img src="/icons/icon-192x192.png" alt="App Icon" className="w-10 h-10 rounded-lg object-cover" 
                 onError={(e) => {
                   // Fallback if PWA icon doesn't exist
                   (e.target as HTMLImageElement).src = '/favicon.ico';
                 }} 
            />
          </div>
        </div>

        <div className="flex-1 text-sm pt-1">
          <h4 className="font-semibold mb-1 text-foreground">Install SafetyWatch</h4>
          <p className="text-muted-foreground leading-snug">
            Install this application on your home screen for quick and easy access when you're on the go.
          </p>
          
          <div className="mt-3 bg-muted/50 rounded-md p-3 border">
            <p className="flex items-center gap-2 mb-2 text-foreground font-medium text-xs">
              1. Tap the <Share className="w-4 h-4 text-blue-500" /> icon at the bottom.
            </p>
            <p className="flex items-center gap-2 text-foreground font-medium text-xs">
              2. Scroll down and tap <PlusSquare className="w-4 h-4 text-primary" /> <strong>Add to Home Screen</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IosInstallPrompt;
