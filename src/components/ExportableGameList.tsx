import { Card, Image, Text, Group, Badge, Stack, Title, Avatar, Box, Progress, Grid, ThemeIcon } from '@mantine/core';
import { IconTrophy, IconStarFilled } from '@tabler/icons-react';
import { forwardRef } from 'react';

export interface ExportableGame {
    appid: number;
    name: string;
    rating: number;
    subRatings?: {
        gameplay: number;
        visuals: number;
        story: number;
        subjective: number;
    };
    skippedRatings?: string[];
}

export interface ExportableGameListProps {
    user: { name: string; image: string };
    games: ExportableGame[];
    year: number;
}

const getProxyUrl = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

export const ExportableGameList = forwardRef<HTMLDivElement, ExportableGameListProps>(({ user, games, year }, ref) => {
    return (
        <Box
            ref={ref}
            bg="#1A1B1E"
            p="xl"
            style={{
                width: 1000,
                minHeight: '100vh',
                margin: '0 auto',
                color: 'white',
            }}
        >
            {/* Header */}
            <Group justify="space-between" mb="xl" align="flex-end">
                <Group>
                    <Avatar src={getProxyUrl(user.image)} size={84} radius="xl" />
                    <div>
                        <Title c="white" order={1} style={{ fontSize: 48, lineHeight: 1 }}>{year} 年度游戏榜单</Title>
                        <Text size="xl" c="dimmed" mt="xs">{user.name} 的游戏鉴赏</Text>
                    </div>
                </Group>
                <Group gap="xs">
                    <IconTrophy size={64} color="gold" />
                    <Stack gap={0} align="flex-end">
                        <Text size="xl" fw={900} c="yellow">TOP RATED</Text>
                        <Text size="sm" c="dimmed">COLLECTION</Text>
                    </Stack>
                </Group>
            </Group>

            {/* List Header */}
            <Grid mb="md" px="md" visibleFrom="xs">
                <Grid.Col span={5}><Text size="sm" fw={700} c="dimmed">GAME</Text></Grid.Col>
                <Grid.Col span={5}><Text size="sm" fw={700} c="dimmed">BREAKDOWN</Text></Grid.Col>
                <Grid.Col span={2}><Text size="sm" fw={700} c="dimmed" ta="right">SCORE</Text></Grid.Col>
            </Grid>

            <Stack gap="sm">
                {games.map((game, index) => (
                    <Card key={game.appid} radius="lg" bg="dark.6" p="md" withBorder style={{ borderColor: '#2C2E33' }}>
                        <Grid align="center" gutter="xl">
                            {/* Game Info */}
                            <Grid.Col span={5}>
                                <Group wrap="nowrap">
                                    <Text size="xl" fw={900} c="dimmed" w={40} ta="center" style={{ opacity: 0.3 }}>#{index + 1}</Text>
                                    <img
                                        src={getProxyUrl(`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`)}
                                        style={{
                                            width: 160,
                                            height: 75,
                                            borderRadius: 8, // radius="md" approx
                                            objectFit: 'cover'
                                        }}
                                        alt={game.name}
                                        crossOrigin="anonymous"
                                    />
                                    <Text size="lg" fw={700} lineClamp={2} c="white" style={{ flex: 1 }}>
                                        {game.name}
                                    </Text>
                                </Group>
                            </Grid.Col>

                            {/* Sub Ratings */}
                            <Grid.Col span={5}>
                                {game.subRatings ? (
                                    <Grid gutter="xs">
                                        {[
                                            { label: '玩法', key: 'gameplay', color: 'blue' },
                                            { label: '画面', key: 'visuals', color: 'pink' },
                                            { label: '剧情', key: 'story', color: 'cyan' },
                                            { label: '私心', key: 'subjective', color: 'orange' },
                                        ].map((item) => {
                                            // @ts-ignore
                                            const val = game.subRatings[item.key] || 0;
                                            // @ts-ignore
                                            const isSkipped = game.skippedRatings?.includes(`rating${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`);

                                            // Handle special key mapping if needed. 
                                            // In our store it is ratingGameplay etc.
                                            // But passed prop might be simplified. 
                                            // Let's assume prop passed is normalized. => Actually check skipped logic below carefully.

                                            if (isSkipped) return null;

                                            return (
                                                <Grid.Col span={6} key={item.key}>
                                                    <Group gap={6} align="center" wrap="nowrap">
                                                        <Text size="xs" c="dimmed" w={28}>{item.label}</Text>
                                                        <Progress
                                                            value={val}
                                                            color={item.color}
                                                            size="sm"
                                                            radius="xl"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <Text size="xs" w={24} ta="right" fw={700} c="white">{val}</Text>
                                                    </Group>
                                                </Grid.Col>
                                            )
                                        })}
                                    </Grid>
                                ) : (
                                    <Text size="sm" c="dimmed" fs="italic">No detailed detail ratings</Text>
                                )}
                            </Grid.Col>

                            {/* Total Score */}
                            <Grid.Col span={2}>
                                <Group justify="flex-end" gap={4}>
                                    <Title order={2} c={game.rating >= 90 ? 'yellow' : 'white'} style={{ fontSize: 42 }}>
                                        {game.rating}
                                    </Title>
                                    <IconStarFilled size={20} color="var(--mantine-color-yellow-5)" style={{ marginTop: -10 }} />
                                </Group>
                            </Grid.Col>
                        </Grid>
                    </Card>
                ))}
            </Stack>

            <Text size="sm" c="dimmed" ta="center" mt="xl" pt="xl">
                Generated by Rei Steam Year • Powered by Steam
            </Text>
        </Box>
    );
});

ExportableGameList.displayName = 'ExportableGameList';
