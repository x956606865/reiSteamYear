import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(url);

        // Basic security check - mainly to prevent proxying local network or sensitive endpoints if needed.
        // For now, we allow http/https.
        if (!decodedUrl.startsWith('http')) {
            return new NextResponse('Invalid URL', { status: 400 });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(decodedUrl, {
            headers: {
                // Add a user agent to avoid being blocked by some CDNs
                'User-Agent': 'Mozilla/5.0 (compatible; ReiSteamYear/1.0;)'
            },
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            // Throw to trigger catch block which serves fallback SVG
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400, mutable');
        headers.set('Access-Control-Allow-Origin', '*'); // Allow usage in canvas

        return new NextResponse(blob, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error('Proxy error:', error);
        // Return a fallback placeholder image on error to prevent canvas export failure
        // 1x1 Transparent PNG (Valid)
        const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const buffer = Buffer.from(base64Png, 'base64');

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
