'use client';

import { useEffect, useRef, useState } from 'react';
import { AppBrand } from '@/components/branding/AppBrand';

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const INSTALL_DISMISSED_UNTIL_KEY = 'ict_inventory_install_dismissed_until';
const INSTALL_DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

function isRunningAsInstalledApp() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isStandalone || isIosStandalone;
}

function usesIosInstallSteps() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) ||
    (userAgent.includes('mac') && navigator.maxTouchPoints > 1);
}

function readInstallSnooze() {
  try {
    return Number(window.localStorage.getItem(INSTALL_DISMISSED_UNTIL_KEY)) > Date.now();
  } catch {
    return false;
  }
}

function snoozeInstallOffer() {
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_UNTIL_KEY, String(Date.now() + INSTALL_DISMISS_MS));
  } catch {
    // The in-memory dismissal still works when browser storage is unavailable.
  }
}

export function AppInstallManager() {
  const [installPrompt, setInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [showInstallOffer, setShowInstallOffer] = useState(false);
  const [showInstallSteps, setShowInstallSteps] = useState(false);
  const [iosSteps, setIosSteps] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateOffer, setShowUpdateOffer] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateDismissedRef = useRef(false);
  const applyingUpdateRef = useRef(false);

  useEffect(() => {
    const installed = isRunningAsInstalledApp();
    const isSnoozed = readInstallSnooze();
    if (installed) snoozeInstallOffer();
    let showTimer: number | undefined;

    if (!installed && !isSnoozed) {
      showTimer = window.setTimeout(() => setShowInstallOffer(true), 3500);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as DeferredInstallPrompt);
      setShowInstallSteps(false);
      if (!installed && !isSnoozed) {
        if (showTimer) window.clearTimeout(showTimer);
        setShowInstallOffer(true);
      }
    };
    const handleInstalled = () => {
      if (showTimer) window.clearTimeout(showTimer);
      snoozeInstallOffer();
      setInstallPrompt(null);
      setShowInstallOffer(false);
      setShowInstallSteps(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    let updateTimer: number | undefined;

    const showWaitingUpdate = (worker: ServiceWorker | null) => {
      if (!worker || !navigator.serviceWorker.controller || updateDismissedRef.current) return;
      setWaitingWorker(worker);
      setShowUpdateOffer(true);
      setShowInstallOffer(false);
    };
    const checkForUpdates = () => {
      if (document.visibilityState === 'visible') void registration?.update().catch(() => undefined);
    };
    const handleControllerChange = () => {
      if (applyingUpdateRef.current) window.location.reload();
    };
    const handleUpdateFound = () => {
      const worker = registration?.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showWaitingUpdate(registration?.waiting ?? worker);
        }
      });
    };

    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((result) => {
      if (disposed) return;
      registration = result;
      registrationRef.current = result;
      showWaitingUpdate(result.waiting);
      result.addEventListener('updatefound', handleUpdateFound);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      window.addEventListener('focus', checkForUpdates);
      updateTimer = window.setInterval(checkForUpdates, 30 * 60 * 1000);
      void result.update().catch(() => undefined);
    }).catch(() => undefined);

    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', handleUpdateFound);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('focus', checkForUpdates);
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  const dismissInstallOffer = () => {
    snoozeInstallOffer();
    setShowInstallOffer(false);
    setShowInstallSteps(false);
  };

  const installFromBrowser = async () => {
    if (!installPrompt) {
      setIosSteps(usesIosInstallSteps());
      setShowInstallSteps(true);
      return;
    }

    const prompt = installPrompt;
    setInstallPrompt(null);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallOffer(false);
      setShowInstallSteps(false);
    } else {
      dismissInstallOffer();
    }
  };

  const handleInstallAction = () => {
    if (!installPrompt && showInstallSteps) {
      dismissInstallOffer();
      return;
    }
    void installFromBrowser();
  };

  const applyUpdate = () => {
    const worker = waitingWorker ?? registrationRef.current?.waiting ?? null;
    if (!worker) {
      window.location.reload();
      return;
    }
    applyingUpdateRef.current = true;
    setIsApplyingUpdate(true);
    worker.postMessage({ type: 'SKIP_WAITING' });
    window.setTimeout(() => {
      if (applyingUpdateRef.current) window.location.reload();
    }, 8000);
  };

  const dismissUpdateOffer = () => {
    updateDismissedRef.current = true;
    setShowUpdateOffer(false);
  };

  return (
    <>
      {showInstallOffer && !showUpdateOffer && (
        <aside aria-label="Install ICT Inventory" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl dark:border-emerald-900/70 dark:bg-zinc-900 sm:inset-x-auto sm:bottom-5 sm:right-5">
          <div className="flex items-start gap-3">
            <AppBrand variant="mark" size={42} decorative className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Install ICT Inventory</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">Add the app to your home screen for quick access.</p>
            </div>
            <button type="button" onClick={dismissInstallOffer} aria-label="Dismiss install offer" className="-mr-1 -mt-1 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-zinc-800">
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </button>
          </div>
          {showInstallSteps && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100">
              {iosSteps
                ? 'In Safari, tap Share, then choose Add to Home Screen.'
                : 'Open your browser menu, then choose Install app or Add to Home Screen.'}{' '}
              This installs the browser app; it does not download an APK.
            </p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" onClick={dismissInstallOffer} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Not now</button>
            <button type="button" onClick={handleInstallAction} className="min-h-10 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900">
              {installPrompt ? 'Install app' : showInstallSteps ? 'Done' : 'How to install'}
            </button>
          </div>
        </aside>
      )}

      {showUpdateOffer && (
        <aside aria-label="ICT Inventory update available" aria-live="polite" className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-md rounded-2xl border border-blue-200 bg-white p-4 shadow-xl dark:border-blue-900/70 dark:bg-zinc-900 sm:inset-x-auto sm:bottom-5 sm:right-5">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M20 7v5h-5M4 17v-5h5m10.2-2A7.5 7.5 0 0 0 6.4 7.4L4 10m16 4-2.4 2.6A7.5 7.5 0 0 1 4.8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">App update available</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">Refresh to get the latest app. If the home screen icon still shows the old logo, remove the app and install it again from your browser.</p>
            </div>
            <button type="button" onClick={dismissUpdateOffer} aria-label="Dismiss update notice" disabled={isApplyingUpdate} className="-mr-1 -mt-1 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:hover:bg-zinc-800">
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" onClick={dismissUpdateOffer} disabled={isApplyingUpdate} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Later</button>
            <button type="button" onClick={applyUpdate} disabled={isApplyingUpdate} className="min-h-10 rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 dark:focus-visible:ring-offset-zinc-900">{isApplyingUpdate ? 'Updating…' : 'Update now'}</button>
          </div>
        </aside>
      )}
    </>
  );
}
