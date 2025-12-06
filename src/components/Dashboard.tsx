"use client";

import useSWR from 'swr';
import { SimpleGrid, Loader, Alert, Container, Text, Center, Stack, Group, Button, Card } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { GameCard } from './GameCard';
import type { SteamGame } from '@/lib/steam';
import { useReviewStore } from '@/store/useReviewStore';
import { useDisclosure } from '@mantine/hooks';
import { AddGameModal } from './AddGameModal';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.')
        // @ts-expect-error attaching status
        error.status = res.status
        throw error
    }
    return res.json();
};

export function Dashboard() {
    const { data: session } = useSession();
    const { data, error, isLoading } = useSWR(session ? '/api/games' : null, fetcher);
    const { reviews, addReview, manualGames } = useReviewStore(); // Need addReview for restore, manualGames for merge
    const [addGameOpened, { open: openAddGame, close: closeAddGame }] = useDisclosure(false);

    if (!session) {
        return (
            <Center h={400}>
                <Text c="dimmed">请登录查看您的游戏库</Text>
            </Center>
        );
    }

    if (isLoading) return <Center h={400}><Loader /></Center>;

    if (error) {
        return (
            <Container py="xl">
                <Alert color="red" title="错误">
                    {error.status === 401 ? '授权失败，请重新登录。' : '加载游戏失败。'}
                </Alert>
            </Container>
        )
    }

    // Combine API games and Manual games
    const apiGames = data?.games as SteamGame[] || [];
    const manualGamesList = Object.values(manualGames);

    // Deduplicate: If API has the game, prefer API? Or allow override?
    // Let's just append manual games that are NOT in API games.
    const apiGameIds = new Set(apiGames.map(g => g.appid));
    const uniqueManualGames = manualGamesList.filter(g => !apiGameIds.has(g.appid));

    const allGames = [...apiGames, ...uniqueManualGames];

    // Sorting: Default by playtime
    allGames.sort((a, b) => b.playtime_forever - a.playtime_forever);

    if (!allGames || allGames.length === 0) {
        return (
            <Container py="xl">
                <Text>过去一年未发现游玩记录。</Text>
            </Container>
        )
    }

    // Filter games based on exclusion
    const activeGames = allGames.filter(g => !reviews[g.appid]?.excluded);
    const excludedGames = allGames.filter(g => reviews[g.appid]?.excluded);

    // Recalculate stats
    const totalPlaytime = activeGames.reduce((acc, g) => acc + g.playtime_forever, 0);

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Text size="xl" fw={700}>
                        过去一年您游玩了 {activeGames.length} 款游戏
                        {totalPlaytime > 0 && <Text span size="md" fw={400} c="dimmed"> (总时长 {Math.round(totalPlaytime / 60)} 小时)</Text>}
                    </Text>

                    <Group>
                        <Button variant="outline" onClick={openAddGame}>
                            + 手动添加
                        </Button>
                        <Button component="a" href="/summary" variant="light">
                            查看年度报告
                        </Button>
                    </Group>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                    {activeGames.map((game: SteamGame) => (
                        <GameCard key={game.appid} game={game} />
                    ))}
                </SimpleGrid>

                {/* Excluded Games Section */}
                {excludedGames.length > 0 && (
                    <Stack mt="xl" gap="xs">
                        <Text size="sm" c="dimmed" fw={700} tt="uppercase">已排除的游戏 ({excludedGames.length})</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                            {excludedGames.map(game => (
                                <Card key={game.appid} padding="xs" radius="md" withBorder bg="var(--mantine-color-gray-0)" style={{ filter: 'grayscale(100%)', opacity: 0.7 }}>
                                    <Group wrap="nowrap">
                                        <Text size="sm" lineClamp={1} style={{ flex: 1 }}>{game.name}</Text>
                                        <Button
                                            size="compact-xs"
                                            variant="subtle"
                                            onClick={() => addReview(game.appid, { ...reviews[game.appid], excluded: false })}
                                        >
                                            恢复
                                        </Button>
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>
                )}
            </Stack>
            <AddGameModal opened={addGameOpened} onClose={closeAddGame} />
        </Container>
    );
}
