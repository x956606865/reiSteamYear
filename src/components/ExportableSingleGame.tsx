import { Card, Image, Text, Group, Badge, Stack, Title, Box, Grid, Progress, Avatar, Divider, Center } from '@mantine/core';
import { IconStarFilled, IconQuote } from '@tabler/icons-react';
import { forwardRef } from 'react';
import { getAttributeColor, getAttributeLabel } from '@/lib/constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

const CustomTick = ({ payload, x, y, cx, cy, ...props }: any) => {
    const textAnchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
    return (
        <text
            {...props}
            y={y + (y - cy) / 8}
            x={x + (x - cx) / 8}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            style={{ fontSize: 13, fontWeight: 'bold' }}
        >
            <tspan fill="#ffffff80">{payload.value.split(' ')[0]}</tspan>
            <tspan fill={payload.value.split(' ')[2]} dx={4}>{payload.value.split(' ')[1]}</tspan>
        </text>
    );
};

export interface SingleGameExportProps {
    listType?: 'game' | 'manga';
    chartStyle?: 'list' | 'radar';
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
        status?: 'played' | 'beaten' | 'dropped' | 'reading' | 'completed'; // For annual review
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

export const ExportableSingleGame = forwardRef<HTMLDivElement, SingleGameExportProps>(({ game, user, year, listName, listType = 'game', chartStyle = 'list' }, ref) => {
    // Determine context label
    const contextLabel = listName ? listName : (year ? `${year} 年度游戏总结` : '游戏鉴赏');

    const renderContent = () => (
        <>
            {/* Title and Rating */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                <Stack gap={4} style={{ minWidth: 0 }}>
                    <Title order={2} c="white" style={{ fontSize: listType === 'manga' ? 24 : 28, lineHeight: 1.2 }} lineClamp={2}>
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

                <div style={{ flexShrink: 0 }}>
                    <Text fw={900} style={{ fontSize: 48, lineHeight: 1 }} c={game.rating >= 90 ? 'yellow' : 'blue'}>
                        {game.rating}
                    </Text>
                </div>
            </div>

            {/* Sub Ratings */}
            {game.subRatings && (
                <>
                    {chartStyle === 'radar' && listType === 'manga' ? (() => {
                        const scores = [
                            game.subRatings.visuals,
                            game.subRatings.story,
                            game.subRatings.character || 0,
                            game.subRatings.subjective
                        ];
                        const minScore = Math.min(...scores);
                        // Start 10 points below the lowest rounded-down decade, but at least 0
                        // e.g., min 85 -> 80 -> start at 70
                        const domainMin = Math.max(0, Math.floor(minScore / 10) * 10 - 10);

                        return (
                            <Grid gutter="xl" align="center" mt="sm">
                                <Grid.Col span={6}>
                                    <div style={{ width: '100%', height: 180 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="55%" data={[
                                                { subject: `画风 ${game.subRatings.visuals} #f06595`, A: game.subRatings.visuals, fullMark: 10 },
                                                { subject: `剧情 ${game.subRatings.story} #15aabf`, A: game.subRatings.story, fullMark: 10 },
                                                { subject: `人设 ${game.subRatings.character || 0} #cc5de8`, A: game.subRatings.character || 0, fullMark: 10 },
                                                { subject: `主观 ${game.subRatings.subjective} #ff922b`, A: game.subRatings.subjective, fullMark: 10 },
                                            ]}>
                                                <PolarRadiusAxis domain={[domainMin, 100]} tick={false} axisLine={false} />
                                                <PolarGrid stroke="#ffffff" strokeOpacity={0.2} />
                                                <PolarAngleAxis
                                                    dataKey="subject"
                                                    tick={<CustomTick />}
                                                />
                                                <Radar
                                                    name="Rating"
                                                    dataKey="A"
                                                    stroke="#339af0"
                                                    strokeWidth={3}
                                                    fill="#339af0"
                                                    fillOpacity={0.4}
                                                    isAnimationActive={false}
                                                    dot={{ r: 3, fill: '#339af0', strokeWidth: 0, fillOpacity: 1 }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Stack gap={10}>
                                        {game.tags && Object.entries(game.tags).map(([key, value]) => (
                                            <Group gap={8} align="center" wrap="nowrap" key={key}>
                                                <Text size="sm" c="dimmed" w={48} lineClamp={1}>{getAttributeLabel(key)}</Text>
                                                <Progress
                                                    value={value * 10} // Convert 0-10 to 0-100
                                                    color={getAttributeColor(key)}
                                                    size="sm"
                                                    radius="xs"
                                                    style={{ flex: 1 }}
                                                />
                                                <Text size="sm" w={24} ta="right" fw={700} c="white">{value}</Text>
                                            </Group>
                                        ))}
                                    </Stack>
                                </Grid.Col>
                            </Grid>
                        );
                    })() : (
                        <>
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

                            {/* Manga Tags (Classic List Style) */}
                            {listType === 'manga' && game.tags && (
                                <>
                                    <Divider my="sm" color="white" style={{ opacity: 0.1 }} />
                                    <Grid gutter="xs">
                                        {Object.entries(game.tags).map(([key, value]) => (
                                            <Grid.Col span={6} key={key}>
                                                <Group gap={8} align="center" wrap="nowrap">
                                                    <Text size="sm" c="dimmed" w={48} lineClamp={1}>{getAttributeLabel(key)}</Text>
                                                    <Progress
                                                        value={value * 10} // Convert 0-10 to 0-100
                                                        color={getAttributeColor(key)}
                                                        size="sm"
                                                        radius="xl"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <Text size="sm" w={28} ta="right" fw={700} c="white">{value}</Text>
                                                </Group>
                                            </Grid.Col>
                                        ))}
                                    </Grid>
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Review/Reason */}
            {game.reason && (
                <Box bg="rgba(255,255,255,0.05)" p="sm" mt="md" style={{ borderRadius: 8, height: listType === 'manga' ? 140 : 120 }}>
                    <Group gap="xs" mb={4}>
                        <IconQuote size={16} color="gray" style={{ opacity: 0.5 }} />
                        <Text size="xs" fw={700} c="dimmed">评价</Text>
                    </Group>
                    <Text size="sm" c="white" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }} lineClamp={listType === 'manga' ? 4 : 3}>
                        {game.reason}
                    </Text>
                </Box>
            )}

            {/* Footer User Info - Push to bottom */}
            {listType !== 'manga' && (
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
            )}
        </>
    );

    return (
        <Box
            ref={ref}
            p={listType === 'manga' ? 20 : 32}
            style={{
                width: listType === 'manga' ? 900 : 600,
                // minHeight: 600, // Let it grow naturally but keep width fixed
                color: 'white',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#1A1B1E', // Fallback
            }}
        >
            {/* Ambient Background */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${getProxyUrl(game.coverUrl)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(60px) brightness(0.6) saturate(1.5)',
                    transform: 'scale(1.2)',
                    zIndex: 0,
                }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <Card radius="lg" bg="dark.6" padding={0} withBorder style={{ borderColor: '#2C2E33', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    {listType === 'manga' ? (
                        <Group gap={0} align="stretch">
                            <div style={{ width: 340, position: 'relative', flexShrink: 0, borderRight: '1px solid #2C2E33' }}>
                                <img
                                    src={getProxyUrl(game.coverUrl)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'block',
                                        objectFit: 'cover',
                                        objectPosition: 'top',
                                    }}
                                    alt={game.name}
                                />
                            </div>
                            <Stack p="lg" justify="flex-start" gap="md" style={{ flex: 1, minWidth: 0 }}>
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
            </div>
        </Box>
    );
});

ExportableSingleGame.displayName = 'ExportableSingleGame';
