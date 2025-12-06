import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SteamGame } from '@/lib/steam';

export interface GameReview {
    rating: number; // Final calculated average
    ratingGameplay?: number;
    ratingVisuals?: number; // Music & Art
    ratingStory?: number;
    ratingSubjective?: number;
    status: 'played' | 'beaten' | 'dropped';
    comment?: string;
    isBeatable?: boolean;
    excluded?: boolean;
    skippedRatings?: string[]; // Keys of ratings to exclude from average
    noRating?: boolean; // If true, game is not rated (skipped)
}

export interface ManualGame extends SteamGame {
    isManual: true;
}

interface ReviewStore {
    reviews: Record<number, GameReview>;
    manualGames: Record<number, ManualGame>;
    addReview: (appid: number, review: GameReview) => void;
    addManualGame: (game: ManualGame) => void;
    updateManualGame: (game: Partial<ManualGame> & { appid: number }) => void;
    removeManualGame: (appid: number) => void;
}

export const useReviewStore = create<ReviewStore>()(
    persist(
        (set) => ({
            reviews: {},
            manualGames: {},
            addReview: (appid, review) =>
                set((state) => ({
                    reviews: { ...state.reviews, [appid]: review },
                })),
            addManualGame: (game) =>
                set((state) => ({
                    manualGames: { ...state.manualGames, [game.appid]: game }
                })),
            updateManualGame: (game: Partial<ManualGame> & { appid: number }) =>
                set((state) => ({
                    manualGames: { ...state.manualGames, [game.appid]: { ...state.manualGames[game.appid], ...game } }
                })),
            removeManualGame: (appid) =>
                set((state) => {
                    const { [appid]: _, ...rest } = state.manualGames;
                    return { manualGames: rest };
                })
        }),
        {
            name: 'steam-reviews-storage',
        }
    )
);
