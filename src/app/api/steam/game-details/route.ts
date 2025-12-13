
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs'; // Use Node.js runtime for ioredis compatibility

interface SteamAppDetailsResponse {
    [appid: string]: {
        success: boolean;
        data?: {
            name: string;
            short_description: string;
            header_image: string;
            release_date?: { date: string };
            genres?: { id: string; description: string }[];
            categories?: { id: number; description: string }[];
            [key: string]: any;
        };
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const appid = searchParams.get('appid');

    if (!appid) {
        return NextResponse.json({ error: 'appid is required' }, { status: 400 });
    }

    const cacheKey = `steam:game:${appid}`;

    try {
        // 1. Check Cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }

        // 2. Fetch from Steam
        // Note: Using 'schinese' to get Chinese metadata as requested
        const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=schinese`;
        const res = await fetch(steamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });

        if (res.status === 429) {
            return NextResponse.json({ error: 'Rate Limit Exceeded' }, { status: 429 });
        }

        if (!res.ok) {
            console.error('Steam API Error:', res.status, await res.text());
            return NextResponse.json({ error: 'Failed to fetch from Steam' }, { status: res.status });
        }

        const data: SteamAppDetailsResponse = await res.json();
        const gameData = data[appid];

        if (!gameData || !gameData.success || !gameData.data) {
            // Cache "not found" state for a shorter time (e.g., 24h) to avoid hitting Steam for invalid IDs repeatedly?
            // For now, just return 404 without caching to be safe, or cache empty.
            return NextResponse.json({ error: 'Game not found or invalid' }, { status: 404 });
        }

        const raw = gameData.data;

        // 3. Data Minimization
        const minimizedData = {
            id: appid,
            name: raw.name,
            short_description: raw.short_description,
            header_image: raw.header_image,
            release_date: raw.release_date?.date || 'Unknown',
            genres: raw.genres?.map((g) => g.description) || [],
            categories: raw.categories?.map((c) => c.description) || [],
        };

        // 4. Cache in Redis (7 days = 604800 seconds)
        await redis.set(cacheKey, JSON.stringify(minimizedData), 'EX', 604800);

        return NextResponse.json(minimizedData);

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
