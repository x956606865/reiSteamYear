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
    sk?: number[];  // skipped indexes (0:gameplay, 1:visuals, 2:story, 3:subjective)
    c?: string;     // comment/reason
}

interface MinList {
    t: string;      // title
    g: MinGame[];   // games
}

const SKIP_MAP = ['ratingGameplay', 'ratingVisuals', 'ratingStory', 'ratingSubjective'];

export const encodeShareList = (list: ShareList): string => {
    const minList: MinList = {
        t: list.title,
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
            if (game.reason) minGame.c = game.reason;

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

        // Handle legacy format (full format) if user somehow used old link?
        // Simple check: does it look like MinList?
        const parsed = JSON.parse(json);

        // Legacy support: if it has 'games' and 'title' (full names), it's legacy.
        if (parsed.games && parsed.title) return parsed as ShareList;

        const minList = parsed as MinList;
        if (!minList.g || !minList.t) return null;

        return {
            id: 'imported', // Placeholder
            title: minList.t,
            createdAt: Date.now(),
            games: minList.g.map(mg => {
                const game: ShareGame = {
                    id: mg.i,
                    name: mg.n,
                    rating: mg.r,
                    coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${mg.i}/header.jpg`,
                    reason: mg.c,
                    ratingGameplay: mg.rg,
                    ratingVisuals: mg.rv,
                    ratingStory: mg.rs,
                    ratingSubjective: mg.rj,
                    skippedRatings: mg.sk?.map(i => SKIP_MAP[i])
                };
                return game;
            })
        };
    } catch (e) {
        console.error('Failed to decode list', e);
        return null;
    }
};
