"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useReviewStore } from "@/store/useReviewStore";
import { SummaryCard } from "@/components/SummaryCard";
import { Container, Button, Center, Loader, Alert, Stack, Group } from "@mantine/core";
import { useRef, useMemo } from "react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { Header } from "@/components/Header";
import { IconDownload } from "@tabler/icons-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SummaryPage() {
    const { data: session } = useSession();
    const { data: gamesData, isLoading } = useSWR(session ? '/api/games' : null, fetcher);
    const { reviews, manualGames } = useReviewStore();
    const cardRef = useRef<HTMLDivElement>(null);

    const summaryData = useMemo(() => {
        if (!gamesData?.games || !session?.user) return null;

        let beaten = 0;
        let dropped = 0;
        let played = 0;

        const apiGames = gamesData.games as any[];
        const manualGamesList = Object.values(manualGames);

        // Deduplicate using Set same as Dashboard
        const apiGameIds = new Set(apiGames.map(g => g.appid));
        const uniqueManualGames = manualGamesList.filter(g => !apiGameIds.has(g.appid));
        const allGames = [...apiGames, ...uniqueManualGames];

        // Filter out excluded games
        const games = allGames.filter((g) => !reviews[g.appid]?.excluded);
        const ratedGames = [];

        // Completion Stats
        let beatableCount = 0;
        let beatenCount = 0;

        for (const game of games) {
            const r = reviews[game.appid];
            // Default isBeatable to true unless explicitly false
            const isBeatable = r?.isBeatable !== false;

            if (isBeatable) {
                beatableCount++;
                if (r?.status === 'beaten') {
                    beatenCount++;
                    beaten++;
                }
            }

            if (r) {
                // if (r.status === 'dropped') dropped++; // Dropped might still exist from old data - REMOVED
                if (r.status === 'played') played++;
                // Only include in ratedGames if it has a rating > 0 AND is not explicitly unrated
                if (r.rating > 0 && !r.noRating) {
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

        // Calculate Stats
        const totalPlaytime = games.reduce((acc, g) => acc + g.playtime_forever, 0);
        const completionRate = beatableCount > 0 ? Math.round((beatenCount / beatableCount) * 100) : 0;

        return {
            user: { name: session.user.name || 'User', image: session.user.image || '' },
            totalGames: games.length,
            totalPlaytime: totalPlaytime,
            beatenCount: beatenCount,
            droppedCount: beatableCount - beatenCount,
            playedCount: played,
            completionRate,
            topGames: ratedGames.slice(0, 3)
        };
    }, [gamesData, reviews, session]);

    const handleExport = async () => {
        if (cardRef.current) {
            try {
                const dataUrl = await toPng(cardRef.current, {
                    cacheBust: true,
                    backgroundColor: '#1A1B1E',
                    pixelRatio: 2, // Higher quality
                    style: {
                        margin: '0',
                        transform: 'none',
                        maxWidth: 'none',
                        width: '800px', // Force content width
                        boxSizing: 'border-box' // Ensure padding is included in width
                    },
                    // width: 800, // Let canvas auto-size to matched element width
                    height: undefined
                });
                download(dataUrl, 'steam-year-summary.png');
            } catch (err) {
                console.error('Export failed', err);
                alert('Failed to generate image. Browser security restrictions might prevent cross-origin images.');
            }
        }
    };

    const handleJsonExport = () => {
        if (!summaryData || !gamesData?.games) return;

        // Re-construct the full game list logic here or reuse memo?
        // Let's rely on the summaryData logic since we want to export the same dataset
        // But we need the full game details + review data.

        const apiGames = gamesData.games as any[];
        const manualGamesList = Object.values(manualGames);
        const apiGameIds = new Set(apiGames.map(g => g.appid));
        const uniqueManualGames = manualGamesList.filter(g => !apiGameIds.has(g.appid));
        const allGames = [...apiGames, ...uniqueManualGames];

        const exportData = {
            generatedAt: new Date().toISOString(),
            user: summaryData.user,
            summary: {
                totalGames: summaryData.totalGames,
                totalPlaytimeHours: Math.round(summaryData.totalPlaytime / 60),
                completionRate: summaryData.completionRate,
                beatenCount: summaryData.beatenCount,
                unfinishedBeatableCount: summaryData.droppedCount,
            },
            games: allGames.map(g => {
                const r = reviews[g.appid];
                return {
                    appid: g.appid,
                    name: g.name,
                    originalName: g.name_en, // Added original English name
                    playtimeMinutes: g.playtime_forever,
                    review: r ? {
                        rating: r.rating,
                        ratingGameplay: r.ratingGameplay,
                        ratingVisuals: r.ratingVisuals,
                        ratingStory: r.ratingStory,
                        ratingSubjective: r.ratingSubjective,
                        skippedRatings: r.skippedRatings,
                        status: r.status,
                        comment: r.comment,
                        isBeatable: r.isBeatable !== false, // Default true
                        excluded: !!r.excluded,
                        noRating: !!r.noRating
                    } : null
                };
            })
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        // Create a Blob with explicit UTF-8 charset
        const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
        download(blob, 'steam-year-data.json', "application/json;charset=utf-8");
    };

    if (!session) return <Center h="100vh"><Header /><Alert>请登录</Alert></Center>;
    if (isLoading || !summaryData) return <Center h="100vh"><Loader /></Center>;

    return (
        <>
            <Header />
            <Container size="lg" py="xl">
                <Stack align="center" gap="xl">
                    <Group>
                        <Button
                            rightSection={<IconDownload size={16} />}
                            size="lg"
                            onClick={handleExport}
                            variant="gradient"
                            gradient={{ from: 'indigo', to: 'cyan' }}
                        >
                            保存总结图片
                        </Button>
                        <Button
                            rightSection={<IconDownload size={16} />}
                            size="lg"
                            onClick={handleJsonExport}
                            variant="default"
                        >
                            导出数据 (JSON)
                        </Button>
                    </Group>

                    <SummaryCard ref={cardRef} data={summaryData} />
                </Stack>
            </Container>
        </>
    );
}
