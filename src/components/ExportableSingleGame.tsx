import { Card, Image, Text, Group, Badge, Stack, Title, Box, Grid, Progress, Avatar } from '@mantine/core';
import { IconStarFilled, IconQuote } from '@tabler/icons-react';
import { forwardRef } from 'react';

export interface SingleGameExportProps {
    listType?: 'game' | 'manga';
    game: {
        id: number | string;
        name: string;
        coverUrl: string;
        rating: number;
        reason?: string; // For recommendations
        subRatings?: {
            gameplay?: number;
            visuals: number;
            story: number;
            subjective: number;
            character?: number;
        };
        skippedRatings?: string[];
        status?: 'beaten' | 'played' | 'dropped'; // For annual review
        playtime?: number; // For annual review
        tags?: {
            yuri?: number;
            sweetness?: number;
            angst?: number;
        };
    };
    user?: {
        name: string;
        image: string;
    };
    year?: number; // For annual review context
    listName?: string; // For recommendation context
}

const getProxyUrl = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

export const ExportableSingleGame = forwardRef<HTMLDivElement, SingleGameExportProps>(({ game, user, year, listName, listType = 'game' }, ref) => {
    // Determine context label
    const contextLabel = listName ? listName : (year ? `${year} 年度游戏总结` : '游戏鉴赏');

    const renderContent = () => (
        <>
            {/* Title and Rating */}
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Title order={2} c="white" style={{ fontSize: 28, lineHeight: 1.2 }} lineClamp={2}>
                        {game.name}
                    </Title>
                    {/* Badges for status or playtime */}
                    <Group gap="xs">
                        {game.status === 'beaten' && <Badge color="green" variant="light">已通关</Badge>}
                        {game.status === 'dropped' && <Badge color="red" variant="light">已弃坑</Badge>}
                        {listType === 'game' && (game.playtime ?? 0) > 0 && (
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
                <Grid gutter={listType === 'manga' ? "xs" : "md"}>
                    {(listType === 'manga' ? [
                        { label: '画风', key: 'visuals', color: 'pink' },
                        { label: '剧情', key: 'story', color: 'cyan' },
                        { label: '人设', key: 'character', color: 'grape' },
                        { label: '主观', key: 'subjective', color: 'orange' },
                    ] : [
                        { label: '玩法', key: 'gameplay', color: 'blue' },
                        { label: '画面', key: 'visuals', color: 'pink' },
                        { label: '剧情', key: 'story', color: 'cyan' },
                        { label: '私心', key: 'subjective', color: 'orange' },
                    ]).map((item: any) => {
                        // @ts-ignore
                        const val = game.subRatings[item.key] || 0;
                        // @ts-ignore
                        const isSkipped = game.skippedRatings?.includes('rating' + item.key.charAt(0).toUpperCase() + item.key.slice(1));

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

            {/* Manga Tags */}
            {listType === 'manga' && game.tags && (
                <Group gap="xs">
                    {Object.entries(game.tags).map(([key, value]) => {
                        if (!value) return null;
                        const labelMap: any = { yuri: '百合', sweetness: '糖度', angst: '刀度' };
                        const colorMap: any = { yuri: 'red.4', sweetness: 'pink.4', angst: 'dark.4' };
                        return (
                            <Badge key={key} size="sm" variant="outline" color={colorMap[key] || 'gray'}>
                                {labelMap[key] || key}: {value}
                            </Badge>
                        )
                    })}
                </Group>
            )}

            {/* Review/Reason */}
            {game.reason && (
                <Box bg="rgba(255,255,255,0.05)" p="sm" style={{ borderRadius: 8 }}>
                    <Group gap="xs" mb={4}>
                        <IconQuote size={16} color="gray" style={{ opacity: 0.5 }} />
                        <Text size="xs" fw={700} c="dimmed">评价</Text>
                    </Group>
                    <Text size="sm" c="white" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }} lineClamp={10}>
                        {game.reason}
                    </Text>
                </Box>
            )}

            {/* Footer User Info - Push to bottom */}
            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <Group justify="space-between" style={{ borderTop: '1px solid #2C2E33', paddingTop: 12 }}>
                    <Group gap="xs">
                        {user && <Avatar src={getProxyUrl(user.image)} size={24} radius="xl" alt={user.name} />}
                        <Stack gap={0}>
                            <Text size="sm" fw={700} c="white">{user?.name || 'ReiSteamYear'}</Text>
                            <Text size="xs" c="dimmed">{contextLabel}</Text>
                        </Stack>
                    </Group>
                    {listType === 'game' && <Text size="xs" c="dimmed" fs="italic">Generated by ReiSteamYear</Text>}
                </Group>
            </div>
        </>
    );

    return (
        <Box
            ref={ref}
            bg="#1A1B1E"
            p={listType === 'manga' ? 20 : 32}
            style={{
                width: listType === 'manga' ? 800 : 600,
                // minHeight: 600, // Let it grow naturally but keep width fixed
                color: 'white',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
            }}
        >
            <Card radius="lg" bg="dark.6" padding={0} withBorder style={{ borderColor: '#2C2E33', overflow: 'hidden' }}>
                {listType === 'manga' ? (
                    <Group gap={0} align="stretch" style={{ minHeight: 400 }}>
                        <div style={{ width: 280, position: 'relative', flexShrink: 0, borderRight: '1px solid #2C2E33' }}>
                            <Image
                                src={getProxyUrl(game.coverUrl)}
                                h="100%"
                                w="100%"
                                fit="cover"
                                alt={game.name}
                                fallbackSrc="https://placehold.co/280x400?text=No+Image"
                            />
                        </div>
                        <Stack p="xl" justify="flex-start" gap="md" style={{ flex: 1, minWidth: 0 }}>
                            {renderContent()}
                        </Stack>
                    </Group>
                ) : (
                    <>
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
                            {renderContent()}
                        </Stack>
                    </>
                )}
            </Card>
        </Box>
    );
});

ExportableSingleGame.displayName = 'ExportableSingleGame';
