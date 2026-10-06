'use client';

import { useEffect } from 'react';

const DASHBOARD_HISTORY_GUARD = '__ictInventoryDashboardBackGuard';

function hasDashboardHistoryGuard(state: unknown): boolean {
  return typeof state === 'object' && state !== null && !Array.isArray(state) &&
    (state as Record<string, unknown>)[DASHBOARD_HISTORY_GUARD] === true;
}

function pushDashboardHistoryGuard(): void {
  const currentState = window.history.state;
  const nextState: Record<string, unknown> =
    typeof currentState === 'object' && currentState !== null && !Array.isArray(currentState)
      ? { ...(currentState as Record<string, unknown>) }
      : {};

  nextState[DASHBOARD_HISTORY_GUARD] = true;
  window.history.pushState(nextState, '', window.location.href);
}

/** Keep browser Back inside the authenticated app; callers close their top overlay first. */
export function useDashboardBackNavigation(onBack: () => void): void {
  useEffect(() => {
    if (!hasDashboardHistoryGuard(window.history.state)) {
      pushDashboardHistoryGuard();
    }

    const handlePopState = () => {
      onBack();
      pushDashboardHistoryGuard();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);
}
