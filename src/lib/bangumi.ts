export interface BangumiSubject {
    id: number;
    url: string;
    type: number;
    name: string;
    name_cn: string;
    summary: string;
    images: {
        large: string;
        common: string;
        medium: string;
        small: string;
        grid: string;
    };
    eps: number;
    eps_count: number;
    air_date: string;
    air_weekday: number;
    rating: {
        total: number;
        count: {
            [key: string]: number;
        };
        score: number;
    };
    rank: number;
    collection: {
        wish: number;
        collect: number;
        doing: number;
        on_hold: number;
        dropped: number;
    };
}

export interface SearchResult {
    results: number;
    list: BangumiSubject[];
}

export async function searchSubject(query: string, type: 1 | 2 | 3 | 4 | 6 = 1): Promise<BangumiSubject[]> {
    const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(query)}?type=${type}&responseGroup=small&max_results=20`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error('Bangumi API Search Failed', res.statusText);
            return [];
        }

        const data: SearchResult = await res.json();
        return data.list || [];
    } catch (error) {
        console.error('Bangumi API Error', error);
        return [];
    }
}
