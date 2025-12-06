import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term');

    if (!term) {
        return NextResponse.json({ items: [] });
    }

    try {
        const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=schinese&cc=CN`);
        const data = await response.json();

        // Transform to lighter manual game format
        const items = data.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
            tiny_image: item.tiny_image
        })) || [];

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Failed to search steam' }, { status: 500 });
    }
}
