import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameReview {
    rating: number; // 0-10
    status: 'played' | 'beaten' | 'dropped';
    comment: string;
    excluded?: boolean;
}

interface ReviewStore {
    reviews: Record<number, GameReview>;
    addReview: (appid: number, review: GameReview) => void;
}

export const useReviewStore = create<ReviewStore>()(
    persist(
        (set) => ({
            reviews: {},
            addReview: (appid, review) =>
                set((state) => ({
                    reviews: { ...state.reviews, [appid]: review },
                })),
        }),
        {
            name: 'steam-reviews-storage',
        }
    )
);
