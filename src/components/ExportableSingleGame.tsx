import { Card, Image, Text, Group, Badge, Stack, Title, Box, Grid, Progress, Avatar } from '@mantine/core';
import { IconStarFilled, IconQuote } from '@tabler/icons-react';
import { forwardRef } from 'react';

export interface SingleGameExportProps {
    game: {
        id: number | string;
        name: string;
        coverUrl: string;
        rating: number;
        reason?: string; // For recommendations
        subRatings?: {
            gameplay: number;
            visuals: number;
            story: number;
            subjective: number;
        };
        skippedRatings?: string[];
        status?: 'beaten' | 'played' | 'dropped'; // For annual review
        playtime?: number; // For annual review
    };
    user?: {
        name: string;
        image: string;
    };
    year?: number; // For annual review context
    listName?: string; // For recommendation context
}

const getProxyUrl = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

export const ExportableSingleGame = forwardRef<HTMLDivElement, SingleGameExportProps>(({ game, user, year, listName }, ref) => {
    // Determine context label
    const contextLabel = listName ? listName : (year ? `${year} 年度游戏总结` : '游戏鉴赏');

    return (
        <Box
            ref={ref}
            bg="#1A1B1E"
            p={32}
            style={{
                width: 600,
                // minHeight: 600, // Let it grow naturally but keep width fixed
                color: 'white',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
            }}
        >
            <Card radius="lg" bg="dark.6" padding={0} withBorder style={{ borderColor: '#2C2E33', overflow: 'hidden' }}>
                {/* Header Image */}
                <Card.Section>
                    <Image
                        src={getProxyUrl(game.coverUrl)}
                        h={280}
                        alt={game.name}
                        fallbackSrc="https://placehold.co/600x280?text=No+Image"
                    />
                </Card.Section>

                <Stack p="lg" gap="lg">
                    {/* Title and Rating */}
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Stack gap={4} style={{ flex: 1, minWidth: 0, width: 0 }}>
                            <Title order={2} c="white" style={{ fontSize: 28, lineHeight: 1.2 }}>
                                {game.name}
                            </Title>
                            {/* Badges for status or playtime */}
                            <Group gap="xs">
                                {game.status === 'beaten' && <Badge color="green" variant="light">已通关</Badge>}
                                {game.status === 'dropped' && <Badge color="red" variant="light">已弃坑</Badge>}
                                {(game.playtime ?? 0) > 0 && (
                                    <Text size="sm" c="dimmed">
                                        已游玩 {Math.round(game.playtime! / 60)} 小时
                                    </Text>
                                )}
                            </Group>
                        </Stack>

                        <Group gap={6} align="center" style={{ flexShrink: 0 }}>
                            <Text fw={900} style={{ fontSize: 42, lineHeight: 1 }} c={game.rating >= 90 ? 'yellow' : 'blue'}>
                                {game.rating}
                            </Text>
                            <Stack gap={0}>
                                <IconStarFilled size={20} color="gold" />
                                <Text size="xs" fw={700} c="dimmed">SCORE</Text>
                            </Stack>
                        </Group>
                    </Group>

                    {/* Sub Ratings */}
                    {game.subRatings && (
                        <Grid gutter="md">
                            {[
                                { label: '玩法', key: 'gameplay', color: 'blue' },
                                { label: '画面', key: 'visuals', color: 'pink' },
                                { label: '剧情', key: 'story', color: 'cyan' },
                                { label: '私心', key: 'subjective', color: 'orange' },
                            ].map((item) => {
                                // @ts-ignore
                                const val = game.subRatings[item.key] || 0;
                                // @ts-ignore
                                const isSkipped = game.skippedRatings?.includes(item.key) || game.skippedRatings?.includes('rating' + item.key.charAt(0).toUpperCase() + item.key.slice(1));

                                if (isSkipped) return null;

                                return (
                                    <Grid.Col span={6} key={item.key}>
                                        <Group gap={8} align="center" wrap="nowrap">
                                            <Text size="sm" c="dimmed" w={32}>{item.label}</Text>
                                            <Progress
                                                value={val}
                                                color={item.color}
                                                size="sm"
                                                radius="xl"
                                                style={{ flex: 1 }}
                                            />
                                            <Text size="sm" w={28} ta="right" fw={700} c="white">{val}</Text>
                                        </Group>
                                    </Grid.Col>
                                )
                            })}
                        </Grid>
                    )}

                    {/* Review/Reason */}
                    {game.reason && (
                        <Box bg="rgba(255,255,255,0.05)" p="md" style={{ borderRadius: 8 }}>
                            <Group gap="xs" mb="xs">
                                <IconQuote size={20} color="gray" style={{ opacity: 0.5 }} />
                                <Text size="sm" fw={700} c="dimmed">评价</Text>
                            </Group>
                            <Text size="md" c="white" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {game.reason}
                            </Text>
                        </Box>
                    )}

                    {/* Footer User Info */}
                    <Group justify="space-between" mt="sm" pt="sm" style={{ borderTop: '1px solid #2C2E33' }}>
                        <Group gap="xs">
                            {user && <Avatar src={getProxyUrl(user.image)} size={32} radius="xl" alt={user.name} />}
                            <Stack gap={0}>
                                <Text size="sm" fw={700} c="white">{user?.name || 'ReiSteamYear'}</Text>
                                <Text size="xs" c="dimmed">{contextLabel}</Text>
                            </Stack>
                        </Group>
                        <Text size="xs" c="dimmed" fs="italic">Generated by ReiSteamYear</Text>
                    </Group>
                </Stack>
            </Card>
        </Box>
    );
});

ExportableSingleGame.displayName = 'ExportableSingleGame';
