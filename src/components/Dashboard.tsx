"use client";

import useSWR from 'swr';
import { SimpleGrid, Loader, Alert, Container, Text, Center, Stack, Group, Button, Card } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { GameCard } from './GameCard';
import type { SteamGame } from '@/lib/steam';
import { useReviewStore } from '@/store/useReviewStore';

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
    const { reviews, addReview } = useReviewStore(); // Need addReview for restore

    if (!session) {
        return (
            <Center h={400}>
                <Text c="dimmed">Please sign in to view your games.</Text>
            </Center>
        );
    }

    if (isLoading) return <Center h={400}><Loader /></Center>;

    if (error) {
        return (
            <Container py="xl">
                <Alert color="red" title="Error">
                    {error.status === 401 ? 'Unauthorized. Please try logging in again.' : 'Failed to load games.'}
                </Alert>
            </Container>
        )
    }

    if (!data?.games || data.games.length === 0) {
        return (
            <Container py="xl">
                <Text>No games found played in the last year.</Text>
            </Container>
        )
    }

    const allGames = data.games as SteamGame[];

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
                        You played {activeGames.length} games in the last year
                        {totalPlaytime > 0 && <Text span size="md" fw={400} c="dimmed"> ({Math.round(totalPlaytime / 60)} hours total lifetime)</Text>}
                    </Text>
                    <Button component="a" href="/summary" variant="light" size="compact-md">
                        View Summary
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                    {activeGames.map((game: SteamGame) => (
                        <GameCard key={game.appid} game={game} />
                    ))}
                </SimpleGrid>

                {/* Excluded Games Section */}
                {excludedGames.length > 0 && (
                    <Stack mt="xl" gap="xs">
                        <Text size="sm" c="dimmed" fw={700} tt="uppercase">Excluded Games ({excludedGames.length})</Text>
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
                                            Restore
                                        </Button>
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
