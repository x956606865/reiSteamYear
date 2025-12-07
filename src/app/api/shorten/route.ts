import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
    try {
        const { data } = await request.json();

        if (!data || typeof data !== 'string') {
            return new NextResponse('Missing data', { status: 400 });
        }

        const shortCode = nanoid(8); // 8 characters is enough collision resistance for this scale

        // Store in Redis with 30 days expiration (2592000 seconds)
        // Key format: "share:{shortCode}"
        await redis.setex(`share:${shortCode}`, 2592000, data);

        return NextResponse.json({ code: shortCode });
    } catch (error) {
        console.error('Shorten error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
