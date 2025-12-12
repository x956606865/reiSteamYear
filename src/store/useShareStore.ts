import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface ShareGame {
    id: number;
    name: string;
    coverUrl: string;
    rating: number; // 0-100 (Final calculated average)
    ratingGameplay?: number;
    ratingVisuals?: number; // Used for "Art" in Manga
    ratingStory?: number;
    ratingSubjective?: number;
    ratingCharacter?: number; // New for Manga
    tags?: {
        yuri?: number;
        sweetness?: number;
        angst?: number;
    };
    skippedRatings?: string[];
    reason?: string; // Recommendation reason
    playtime?: number; // Playtime in minutes (optional)
}

export interface ShareList {
    id: string; // uuid
    title: string;
    type: 'game' | 'manga';
    createdAt: number;
    games: ShareGame[];
}

interface ShareStore {
    lists: ShareList[];
    createList: (title: string, type?: 'game' | 'manga') => void;
    deleteList: (id: string) => void;
    updateListTitle: (id: string, title: string) => void;
    addGame: (listId: string, game: ShareGame) => void;
    removeGame: (listId: string, gameId: number) => void;
    updateGame: (listId: string, game: Partial<ShareGame> & { id: number }) => void;
    importList: (list: ShareList) => void;
}

export const useShareStore = create<ShareStore>()(
    persist(
        (set) => ({
            lists: [],
            importList: (importedList) =>
                set((state) => ({
                    lists: [
                        ...state.lists,
                        {
                            ...importedList,
                            type: importedList.type || 'game', // Backwards compat
                            id: uuidv4(), // Regenerate ID to avoid collisions
                            createdAt: Date.now()
                        }
                    ]
                })),
            createList: (title, type = 'game') =>
                set((state) => ({
                    lists: [
                        ...state.lists,
                        {
                            id: uuidv4(),
                            title,
                            type,
                            createdAt: Date.now(),
                            games: []
                        }
                    ]
                })),
            deleteList: (id) =>
                set((state) => ({
                    lists: state.lists.filter((l) => l.id !== id)
                })),
            updateListTitle: (id, title) =>
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === id ? { ...l, title } : l
                    )
                })),
            addGame: (listId, game) =>
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === listId
                            ? { ...l, games: [...l.games, game] }
                            : l
                    )
                })),
            removeGame: (listId, gameId) =>
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === listId
                            ? { ...l, games: l.games.filter((g) => g.id !== gameId) }
                            : l
                    )
                })),
            updateGame: (listId, game) =>
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === listId
                            ? {
                                ...l,
                                games: l.games.map((g) =>
                                    g.id === game.id ? { ...g, ...game } : g
                                )
                            }
                            : l
                    )
                }))
        }),
        {
            name: 'steam-share-lists-storage',
        }
    )
);
