"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useReviewStore } from "@/store/useReviewStore";
import { SummaryCard } from "@/components/SummaryCard";
import { ExportableGameList, ExportableGame } from "@/components/ExportableGameList";
import { Container, Button, Center, Loader, Alert, Stack, Group, Tooltip, Box } from "@mantine/core";
import { useRef, useMemo, useState } from "react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { Header } from "@/components/Header";
import { IconDownload, IconPhoto, IconSparkles } from "@tabler/icons-react";
import { AIReportModal } from "@/components/AIReportModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SummaryPage() {
    const { data: session } = useSession();
    const { data: gamesData, isLoading } = useSWR(session ? '/api/games' : null, fetcher);
    const { reviews, manualGames } = useReviewStore();
    const cardRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [isExportingList, setIsExportingList] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);

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
        const ratedGames: (ExportableGame & { [key: string]: any })[] = [];

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
                    ratedGames.push({
                        ...game,
                        rating: r.rating,
                        subRatings: {
                            gameplay: r.ratingGameplay || r.rating,
                            visuals: r.ratingVisuals || r.rating,
                            story: r.ratingStory || r.rating,
                            subjective: r.ratingSubjective || r.rating,
                        },
                        skippedRatings: r.skippedRatings
                    });
                }
            }
        }

        // Sort rated games
        ratedGames.sort((a, b) => b.rating - a.rating);

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
            topGames: ratedGames.slice(0, 3) as any[],
            allRatedGames: ratedGames,
            allGames: games // Export for AI
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

    const handleListExport = async () => {
        if (listRef.current) {
            setIsExportingList(true);
            // Wait for render ? Actually ref is always mounted but hidden
            try {
                // Need a small timeout to ensure any state updates/images load? (Usually ok if pre-rendered)

                const dataUrl = await toPng(listRef.current, {
                    cacheBust: true,
                    backgroundColor: '#1A1B1E',
                    pixelRatio: 2,
                    // @ts-ignore - skipOnError is a valid runtime option but missing from types
                    skipOnError: true, // Ignore image loading errors
                    style: {
                        // When hidden, sometimes layout is weird. 
                        // But we put it in an absolute container with valid size.
                    }
                });
                download(dataUrl, 'steam-year-list.png');
            } catch (err: any) {
                console.error('List export failed detailed:', err);
                if (err && err.target && err.target.tagName === 'IMG') {
                    console.error('Failing image src:', err.target.src);
                }
                alert(`Failed to generate list image. Check console for details. Error: ${err?.message || 'Unknown'}`);
            } finally {
                setIsExportingList(false);
            }
        }
    };

    const handleJsonExport = () => {
        if (!summaryData || !gamesData?.games) return;

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
                            rightSection={<IconPhoto size={16} />}
                            size="lg"
                            onClick={handleListExport}
                            loading={isExportingList}
                            variant="gradient"
                            gradient={{ from: 'orange', to: 'red' }}
                        >
                            导出榜单长图
                        </Button>
                        <Button
                            rightSection={<IconDownload size={16} />}
                            size="lg"
                            onClick={handleJsonExport}
                            variant="default"
                        >
                            导出数据 (JSON)
                        </Button>
                        <Button
                            rightSection={<IconSparkles size={16} />}
                            size="lg"
                            onClick={() => setAiModalOpen(true)}
                            variant="gradient"
                            gradient={{ from: 'grape', to: 'violet' }}
                        >
                            AI 年度报告
                        </Button>
                    </Group>

                    <SummaryCard ref={cardRef} data={summaryData} />
                </Stack>
            </Container>

            {/* Hidden Export Component - simplified hiding strategy */}
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1000, opacity: 0, pointerEvents: 'none' }}>
                <ExportableGameList
                    ref={listRef}
                    user={summaryData.user}
                    games={summaryData.allRatedGames}
                    year={new Date().getFullYear()}
                />
            </div>

            <AIReportModal
                opened={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                year={2024}
                games={summaryData.allGames}
                reviews={reviews}
                summaryStats={summaryData ? {
                    totalGames: summaryData.totalGames,
                    totalPlaytime: summaryData.totalPlaytime,
                    completionRate: summaryData.completionRate,
                    topGame: summaryData.allRatedGames[0] ? {
                        name: summaryData.allRatedGames[0].name,
                        rating: summaryData.allRatedGames[0].rating
                    } : undefined
                } : undefined}
            />
        </>
    );
}
