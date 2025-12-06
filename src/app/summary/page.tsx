"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useReviewStore } from "@/store/useReviewStore";
import { SummaryCard } from "@/components/SummaryCard";
import { Container, Button, Center, Loader, Alert, Stack } from "@mantine/core";
import { useRef, useMemo } from "react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { Header } from "@/components/Header";
import { IconDownload } from "@tabler/icons-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SummaryPage() {
    const { data: session } = useSession();
    const { data: gamesData, isLoading } = useSWR(session ? '/api/games' : null, fetcher);
    const { reviews } = useReviewStore();
    const cardRef = useRef<HTMLDivElement>(null);

    const summaryData = useMemo(() => {
        if (!gamesData?.games || !session?.user) return null;

        let beaten = 0;
        let dropped = 0;
        let played = 0;

        // We only have reviews for some games.
        // Also we need to iterate ALL games or just reviewed ones?
        // Summary usually includes only games from the year?
        // User might review games not in the year? 
        // We only care about reviews for games IN the gamesData list (Played this year).

        const allGames = gamesData.games as any[]; // Type assertion needed or import type

        // Filter out excluded games
        const games = allGames.filter((g) => !reviews[g.appid]?.excluded);

        const ratedGames = [];

        for (const game of games) {
            const r = reviews[game.appid];
            if (r) {
                if (r.status === 'beaten') beaten++;
                if (r.status === 'dropped') dropped++;
                if (r.status === 'played') played++;
                if (r.rating > 0) {
                    ratedGames.push({ ...game, rating: r.rating });
                }
            } else {
                // Default status assumption? 
                // If they played it, count as played (unless logic differs).
                // For now, only count explicit statuses for the counters, 
                // OR count everything as 'played' if no status?
                // Let's stick to explicit reviews for "Beaten"/"Dropped", 
                // but "Total Games" covers everything.
            }
        }

        // Sort rated games
        ratedGames.sort((a, b) => b.rating - a.rating);

        // Calculate Stats based on filtered games
        const totalPlaytime = games.reduce((acc, g) => acc + g.playtime_forever, 0);

        return {
            user: { name: session.user.name || 'User', image: session.user.image || '' },
            totalGames: games.length, // Count of filtered games
            totalPlaytime: totalPlaytime,
            beatenCount: beaten,
            droppedCount: dropped,
            playedCount: played,
            topGames: ratedGames.slice(0, 3)
        };
    }, [gamesData, reviews, session]);

    const handleExport = async () => {
        if (cardRef.current) {
            try {
                const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#1A1B1E' });
                download(dataUrl, 'steam-year-summary.png');
            } catch (err) {
                console.error('Export failed', err);
                alert('Failed to generate image. Browser security restrictions might prevent cross-origin images.');
            }
        }
    };

    if (!session) return <Center h="100vh"><Header /><Alert>Please login</Alert></Center>;
    if (isLoading || !summaryData) return <Center h="100vh"><Loader /></Center>;

    return (
        <>
            <Header />
            <Container size="lg" py="xl">
                <Stack align="center" gap="xl">
                    <Button
                        rightSection={<IconDownload size={16} />}
                        size="lg"
                        onClick={handleExport}
                        variant="gradient"
                        gradient={{ from: 'indigo', to: 'cyan' }}
                    >
                        Download Summary
                    </Button>

                    <SummaryCard ref={cardRef} data={summaryData} />
                </Stack>
            </Container>
        </>
    );
}
