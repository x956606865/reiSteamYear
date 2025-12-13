
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { endpoint, method, headers, body: upstreamBody } = body;

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
        }

        const res = await fetch(endpoint, {
            method: method || 'POST',
            headers: filterHeaders(headers),
            body: upstreamBody ? JSON.stringify(upstreamBody) : undefined
        });

        // Forward status and headers
        const responseText = await res.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            // Not JSON (e.g., XML error or plain text)
            // If response is not OK, this is likely an error page
            // If response IS OK but not JSON, we might want to return text structure
            if (!res.ok) {
                return NextResponse.json({
                    error: `Upstream Error (${res.status}): ${responseText.slice(0, 500)}`
                }, { status: res.status });
            }
            // If success but not JSON? Probably unexpected for this specific proxy which expects JSON
            return NextResponse.json({
                error: `Invalid JSON from provider: ${responseText.slice(0, 200)}...`
            }, { status: 502 });
        }

        return NextResponse.json(data, { status: res.status });

    } catch (e: any) {
        console.error("AI Proxy Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Ensure strict filtering if needed, but for general proxying we just need standard auth
function filterHeaders(headers: any) {
    if (!headers) return {};
    const safe = { ...headers };
    // Potentially strip host or restricted headers? Fetch does this automatically mostly.
    return safe;
}
