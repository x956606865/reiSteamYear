import { ShareList, ShareGame } from '@/store/useShareStore';
import LZString from 'lz-string';

// Minified interfaces for URL sharing
interface MinGame {
    i: number;      // id
    n: string;      // name
    r: number;      // rating
    rg?: number;    // gameplay
    rv?: number;    // visuals
    rs?: number;    // story
    rj?: number;    // subjective
    rc?: number;    // character (manga)
    tg?: Record<string, number>; // tags (manga)
    cv?: string;    // cover url (needed for manga/non-steam)
    sk?: number[];  // skipped indexes
    c?: string;     // comment/reason
}

interface MinList {
    t: string;      // title
    tp?: 'g' | 'm'; // type: game | manga
    g: MinGame[];   // games
}

const SKIP_MAP = ['ratingGameplay', 'ratingVisuals', 'ratingStory', 'ratingSubjective', 'ratingCharacter'];

export const encodeShareList = (list: ShareList): string => {
    const minList: MinList = {
        t: list.title,
        tp: list.type === 'manga' ? 'm' : 'g',
        g: list.games.map(game => {
            const minGame: MinGame = {
                i: game.id,
                n: game.name,
                r: game.rating,
            };

            // Optional fields
            if (game.ratingGameplay) minGame.rg = game.ratingGameplay;
            if (game.ratingVisuals) minGame.rv = game.ratingVisuals;
            if (game.ratingStory) minGame.rs = game.ratingStory;
            if (game.ratingSubjective) minGame.rj = game.ratingSubjective;
            if (game.ratingCharacter) minGame.rc = game.ratingCharacter;

            if (game.tags && Object.keys(game.tags).length > 0) {
                minGame.tg = game.tags;
            }

            if (game.reason) minGame.c = game.reason;

            // Store cover URL for non-steam (Manga) or if explicitly set and strictly different?
            // For simplicity/safety, if it's manga, ALWAYS store cover.
            // If it's game, we assume Steam ID is enough, unless it's a manual game with custom cover?
            // For now, let's just save cover if it's manga.
            if (list.type === 'manga' && game.coverUrl) {
                minGame.cv = game.coverUrl;
            }

            if (game.skippedRatings && game.skippedRatings.length > 0) {
                minGame.sk = game.skippedRatings
                    .map(k => SKIP_MAP.indexOf(k))
                    .filter(i => i !== -1);
            }

            return minGame;
        })
    };

    return LZString.compressToEncodedURIComponent(JSON.stringify(minList));
};

export const decodeShareList = (str: string): ShareList | null => {
    try {
        const json = LZString.decompressFromEncodedURIComponent(str);
        if (!json) return null;

        const parsed = JSON.parse(json);

        // Legacy compatibility
        if (parsed.games && parsed.title) {
            const legacyList = parsed as ShareList;
            return {
                ...legacyList,
                type: legacyList.type || 'game'
            };
        }

        const minList = parsed as MinList;
        if (!minList.g || !minList.t) return null;

        const listType = minList.tp === 'm' ? 'manga' : 'game';

        return {
            id: 'imported', // Placeholder
            title: minList.t,
            type: listType,
            createdAt: Date.now(),
            games: minList.g.map(mg => {
                let coverUrl = mg.cv;
                if (!coverUrl) {
                    // Fallback for games (Steam)
                    coverUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${mg.i}/header.jpg`;
                }

                const game: ShareGame = {
                    id: mg.i,
                    name: mg.n,
                    rating: mg.r,
                    coverUrl: coverUrl,
                    reason: mg.c,
                    ratingGameplay: mg.rg,
                    ratingVisuals: mg.rv,
                    ratingStory: mg.rs,
                    ratingSubjective: mg.rj,
                    ratingCharacter: mg.rc,
                    tags: mg.tg,
                    skippedRatings: mg.sk?.map(i => SKIP_MAP[i]).filter(Boolean)
                };
                return game;
            })
        };
    } catch (e) {
        console.error('Failed to decode list', e);
        return null;
    }
};
