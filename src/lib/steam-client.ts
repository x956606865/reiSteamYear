
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
    const [details, setDetails] = useState<Map<number, GameDetails>>(new Map());
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!enabled || appids.length === 0) return;

        // Reset state on new start
        setIsFetching(true);
        setProgress({ current: 0, total: appids.length });
        setError(null);
        abortControllerRef.current = new AbortController();

        const processQueue = async () => {
            const newDetails = new Map(details); // Start with existing cache if any (optional, or clear?)
            // We'll keep existing details to avoid refetching if user toggles? 
            // Better: Check if we have it already.

            for (let i = 0; i < appids.length; i++) {
                if (abortControllerRef.current?.signal.aborted) break;

                const appid = appids[i];

                // update progress
                setProgress({ current: i + 1, total: appids.length });

                // Skip if already loaded
                if (newDetails.has(appid)) continue;

                const data = await fetchGameDetails(appid);
                if (data) {
                    newDetails.set(appid, data);
                    setDetails(new Map(newDetails)); // Trigger update
                }

                // Wait 1s (Rate Limit Protection)
                // We wait even for failed/cached to keep cadence smooth, or only wait if we actually fetched?
                // To be safe, wait if we fetched.
                // But simplified: wait 800ms-1000ms always to be safe.
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
