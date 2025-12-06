"use client";

import useSWR from 'swr';
import { SimpleGrid, Loader, Alert, Container, Text, Center, Stack, Group, Button } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { GameCard } from './GameCard';
import type { SteamGame } from '@/lib/steam';

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

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Text size="xl" fw={700}>
                        You played {data.count} games in the last year
                        {data.total_playtime > 0 && <Text span size="md" fw={400} c="dimmed"> ({Math.round(data.total_playtime / 60)} hours total lifetime)</Text>}
                    </Text>
                    <Button component="a" href="/summary" variant="light" size="compact-md">
                        View Summary
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                    {data.games.map((game: SteamGame) => (
                        <GameCard key={game.appid} game={game} />
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
