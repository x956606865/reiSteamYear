
import { useState, useEffect, useRef } from 'react';

export interface GameDetails {
    id: number;
    name: string;
    short_description: string;
    header_image: string;
    release_date: string;
    genres: string[];
    categories: string[];
}

export async function fetchGameDetails(appid: number): Promise<GameDetails | null> {
    try {
        const res = await fetch(`/api/steam/game-details?appid=${appid}`);
        if (!res.ok) {
            console.warn(`Failed to fetch details for ${appid}: ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error(`Error fetching game details for ${appid}`, e);
        return null;
    }
}

export function useGameDetailsQueue(appids: number[], enabled: boolean = false) {
    // Initialize details from localStorage
    const savedDetailsJson = typeof window !== 'undefined' ? localStorage.getItem('steam-game-details-cache') : null;
    const initialDetails = savedDetailsJson ? new Map<number, GameDetails>(JSON.parse(savedDetailsJson)) : new Map<number, GameDetails>();

    // State
    const [details, setDetails] = useState<Map<number, GameDetails>>(initialDetails);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!enabled || appids.length === 0) return;

        setIsFetching(true);
        // We do NOT reset details here, we keep accumulating/using cached
        setProgress({ current: 0, total: appids.length });
        setError(null);
        abortControllerRef.current = new AbortController();

        const processQueue = async () => {
            const currentDetails = new Map(details); // Snapshot current state

            for (let i = 0; i < appids.length; i++) {
                if (abortControllerRef.current?.signal.aborted) break;
                const appid = appids[i];

                setProgress({ current: i + 1, total: appids.length });

                // Skip if already in memory
                if (currentDetails.has(appid)) continue;

                const data = await fetchGameDetails(appid);
                if (data) {
                    currentDetails.set(appid, data);
                    setDetails(new Map(currentDetails)); // Update UI
                    // Update LocalStorage
                    localStorage.setItem('steam-game-details-cache', JSON.stringify(Array.from(currentDetails.entries())));
                }

                // Wait 1s (Rate Limit Protection)
                await new Promise(r => setTimeout(r, 1000));
            }
            setIsFetching(false);
        };

        processQueue().catch(e => {
            console.error("Queue execution failed", e);
            console.error(e);
            setError("Analysis stopped due to error");
            setIsFetching(false);
        });

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [enabled, appids]); // Dependency on appids changed? Be careful not to restart loop if appids array reference changes but content is same.
    // User should memoize appids.

    return { details, progress, isFetching, error };
}
