'use client';

import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;

function subscribe(onStoreChange: () => void) {
    const id = setInterval(onStoreChange, MINUTE);
    return () => clearInterval(id);
}

const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

/**
 * The current time, resolved on the client only. Prerendering returns `null`
 * so a build-time date never gets frozen into the static HTML.
 */
export function useNow(): Date | null {
    const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
    return minute === null ? null : new Date(minute * MINUTE);
}
