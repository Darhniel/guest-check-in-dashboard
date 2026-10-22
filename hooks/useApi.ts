'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Snapshot<T> = {
    /** The endpoint the data below belongs to. */
    endpoint: string | null;
    data: T | null;
    error: string | null;
    pending: boolean;
};

type Updater<T> = T | null | ((previous: T | null) => T | null);

function errorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';
}

/**
 * Small data-fetching hook. Keeps the last successful payload on screen while
 * a refetch is in flight so mutations never blank out the page, and only shows
 * a loading state when there is nothing to render yet.
 */
export function useApiQuery<T>(endpoint: string | null) {
    const [snapshot, setSnapshot] = useState<Snapshot<T>>({
        endpoint: null,
        data: null,
        error: null,
        pending: false,
    });
    const requestId = useRef(0);

    useEffect(() => {
        if (!endpoint) return;

        const id = ++requestId.current;

        void api<T>(endpoint).then(
            (result) => {
                if (id !== requestId.current) return;
                setSnapshot({
                    endpoint,
                    data: result,
                    error: null,
                    pending: false,
                });
            },
            (error: unknown) => {
                if (id !== requestId.current) return;
                setSnapshot((previous) => ({
                    endpoint,
                    data: previous.endpoint === endpoint ? previous.data : null,
                    error: errorMessage(error),
                    pending: false,
                }));
            }
        );
    }, [endpoint]);

    const refetch = useCallback(async () => {
        if (!endpoint) return;

        const id = ++requestId.current;
        setSnapshot((previous) => ({ ...previous, pending: true }));

        try {
            const result = await api<T>(endpoint);
            if (id !== requestId.current) return;
            setSnapshot({
                endpoint,
                data: result,
                error: null,
                pending: false,
            });
        } catch (error) {
            if (id !== requestId.current) return;
            setSnapshot((previous) => ({
                endpoint,
                data: previous.endpoint === endpoint ? previous.data : null,
                error: errorMessage(error),
                pending: false,
            }));
        }
    }, [endpoint]);

    const setData = useCallback(
        (updater: Updater<T>) => {
            setSnapshot((previous) => {
                const base =
                    previous.endpoint === endpoint ? previous.data : null;
                return {
                    endpoint,
                    data:
                        typeof updater === 'function'
                            ? (updater as (value: T | null) => T | null)(base)
                            : updater,
                    error:
                        previous.endpoint === endpoint ? previous.error : null,
                    pending: previous.pending,
                };
            });
        },
        [endpoint]
    );

    const settled = snapshot.endpoint === endpoint;
    const data = settled ? snapshot.data : null;
    const error = settled ? snapshot.error : null;
    const loading =
        Boolean(endpoint) && (!settled || (snapshot.pending && data === null));

    return { data, loading, error, refetch, setData };
}
