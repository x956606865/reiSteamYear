import { Box, Title, Text, SimpleGrid, Card, Image, Group, Stack, Badge, Grid, Progress, Divider } from '@mantine/core';
import { IconStarFilled, IconTrophy } from '@tabler/icons-react';
import { ShareList } from '@/store/useShareStore';
import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import { encodeShareList } from '@/utils/shareData';
import { getAttributeColor, getAttributeLabel } from '@/lib/constants';

interface ExportableShareListProps {
    list: ShareList;
    shareUrl?: string; // Short URL for QR code
}

export const ExportableShareList = forwardRef<HTMLDivElement, ExportableShareListProps>(({ list, shareUrl }, ref) => {
    // Default to long URL if short URL isn't ready/failed
    const finalUrl = shareUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/share/view?data=${encodeShareList(list)}`;

    return (
        <Box
            ref={ref}
            style={{
                width: 1200, // Fixed width for export
                backgroundColor: '#1A1B1E', // Dark background
                color: 'white',
                padding: 40,
                // font-family?
            }}
        >
            {/* Header */}
            <Stack mb={60} align="center" gap={0}>
                <Title c="white" order={1} style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{list.title}</Title>
                <Text size="xl" c="dimmed" mt="xs" style={{ whiteSpace: 'nowrap' }}>安利列表 • 共 {list.games.length} {list.type === 'manga' ? '部漫画' : '款游戏'}</Text>
            </Stack>

            {/* List Header */}
            <Grid mb="md" px="md" visibleFrom="xs">
                <Grid.Col span={4}><Text size="sm" fw={700} c="dimmed">{list.type === 'manga' ? 'MANGA' : 'GAME'}</Text></Grid.Col>
                <Grid.Col span={4}><Text size="sm" fw={700} c="dimmed">RATINGS</Text></Grid.Col>
                <Grid.Col span={4}><Text size="sm" fw={700} c="dimmed">COMMENT</Text></Grid.Col>
            </Grid>

            <Stack gap="xl">
                {[...list.games].sort((a, b) => b.rating - a.rating).map((game, index) => {
                    const isHighRank = list.games.length > 3 && index < 3;
                    const rankColors = ['#FFD700', '#E0E0E0', '#CD7F32']; // Gold, Silver, Bronze
                    const rankColor = isHighRank ? rankColors[index] : undefined;

                    return (
                        <Card
                            key={game.id}
                            radius="lg"
                            bg="dark.6"
                            p="lg"
                            withBorder
                            style={{
                                borderColor: rankColor || '#2C2E33',
                                borderWidth: isHighRank ? 2 : 1,
                                position: 'relative',
                                overflow: 'visible' // Allow badge to pop out if we wanted, but keeping inside for now
                            }}
                        >
                            {/* Rank Glow for Top 3 */}
                            {isHighRank && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, bottom: 0, width: 4,
                                    background: rankColor,
                                    borderTopLeftRadius: 16,
                                    borderBottomLeftRadius: 16
                                }} />
                            )}

                            <Grid align="flex-start" gutter="xl">
                                {/* Game Info */}
                                <Grid.Col span={4}>
                                    <Group wrap="nowrap" align="flex-start">
                                        <Stack align="center" gap={4} w={40} mt={4}>
                                            {isHighRank ? (
                                                <>
                                                    <IconTrophy size={24} color={rankColor} style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }} />
                                                    <Text size="xl" fw={900} c={rankColor} style={{ lineHeight: 1 }}>#{index + 1}</Text>
                                                </>
                                            ) : (
                                                <Text size="xl" fw={900} c="dimmed" style={{ opacity: 0.3 }}>#{index + 1}</Text>
                                            )}
                                        </Stack>

                                        <Stack gap="xs">
                                            <img
                                                src={`/api/image-proxy?url=${encodeURIComponent(game.coverUrl || '')}&gid=${game.id}`}
                                                style={{
                                                    width: list.type === 'manga' ? 140 : 200,
                                                    height: list.type === 'manga' ? 200 : 94,
                                                    borderRadius: 8,
                                                    objectFit: 'cover',
                                                    border: isHighRank ? `1px solid ${rankColor}` : 'none'
                                                }}
                                                alt={game.name}
                                                crossOrigin="anonymous"
                                            />
                                            <Title order={3} c={isHighRank ? "white" : "gray.3"} lineClamp={2} style={{ fontSize: 20 }}>
                                                {game.name}
                                            </Title>
                                            {list.type === 'game' && game.playtime && game.playtime > 0 && (
                                                <Text size="sm" c="dimmed">
                                                    已游玩 {Math.round(game.playtime / 60)} 小时
                                                </Text>
                                            )}
                                        </Stack>
                                    </Group>
                                </Grid.Col>

                                {/* Sub Ratings */}
                                <Grid.Col span={4}>
                                    <Stack gap={4}>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap={6} align="center">
                                                <IconStarFilled size={18} color={isHighRank ? rankColor : "gold"} />
                                                <Text fw={900} size="lg" c={isHighRank ? rankColor : "white"}>TOTAL SCORE</Text>
                                            </Group>
                                            <Badge
                                                size="lg"
                                                variant={isHighRank ? "gradient" : "filled"}
                                                gradient={isHighRank ? { from: rankColor!, to: 'orange', deg: 45 } : undefined}
                                                color={!isHighRank ? (game.rating >= 90 ? 'yellow' : 'blue') : undefined}
                                                style={{
                                                    color: isHighRank ? '#000' : undefined, // Black text on bright metals
                                                    border: isHighRank ? `1px solid ${rankColor}` : 'none'
                                                }}
                                            >
                                                {game.rating}
                                            </Badge>
                                        </Group>

                                        <Grid gutter="xs">
                                            {(list.type === 'manga' ? [
                                                { label: '画风', key: 'ratingVisuals', color: 'pink' },
                                                { label: '剧情', key: 'ratingStory', color: 'cyan' },
                                                { label: '人设', key: 'ratingCharacter', color: 'grape' },
                                                { label: '主观', key: 'ratingSubjective', color: 'orange' },
                                            ] : [
                                                { label: '玩法', key: 'ratingGameplay', color: 'blue' },
                                                { label: '画面', key: 'ratingVisuals', color: 'pink' },
                                                { label: '剧情', key: 'ratingStory', color: 'cyan' },
                                                { label: '私心', key: 'ratingSubjective', color: 'orange' },
                                            ]).map((item: any) => {
                                                // @ts-ignore
                                                // Fallback to total rating if individual rating is not set (same behavior as GameCard)
                                                const val = game[item.key] ?? game.rating ?? 80;
                                                // @ts-ignore
                                                const isSkipped = game.skippedRatings?.includes(item.key);

                                                if (isSkipped) return null;

                                                return (
                                                    <Grid.Col span={12} key={item.key}>
                                                        <Group gap={8} align="center" wrap="nowrap">
                                                            <Text size="xs" c="dimmed" w={32}>{item.label}</Text>
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

                                        {/* Manga Tags (Progress Bar Style) */}
                                        {list.type === 'manga' && game.tags && Object.keys(game.tags).length > 0 && (
                                            <>
                                                <Divider my="xs" color="white" style={{ opacity: 0.1 }} />
                                                <Grid gutter="xs">
                                                    {Object.entries(game.tags).map(([key, value]) => {
                                                        if (!value) return null;
                                                        return (
                                                            <Grid.Col span={12} key={key}>
                                                                <Group gap={8} align="center" wrap="nowrap">
                                                                    <Text size="xs" c="dimmed" w={32}>{getAttributeLabel(key)}</Text>
                                                                    <Progress
                                                                        value={value * 10} // 0-10 -> 0-100
                                                                        color={getAttributeColor(key)}
                                                                        size="sm"
                                                                        radius="xl"
                                                                        style={{ flex: 1 }}
                                                                    />
                                                                    <Text size="xs" w={24} ta="right" fw={700} c="white">{value}</Text>
                                                                </Group>
                                                            </Grid.Col>
                                                        )
                                                    })}
                                                </Grid>
                                            </>
                                        )}
                                    </Stack>
                                </Grid.Col>

                                {/* Comment */}
                                <Grid.Col span={4}>
                                    <Text size="xs" fw={700} c="dimmed" mb={8} tt="uppercase">Recommendation</Text>
                                    <Text
                                        size="sm"
                                        c="white"
                                        lineClamp={10}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.6,
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            padding: 12,
                                            borderRadius: 8
                                        }}
                                    >
                                        {game.reason || '无推荐语'}
                                    </Text>
                                </Grid.Col>
                            </Grid>
                        </Card>
                    );
                })}
            </Stack>

            {/* Footer with QR Code */}
            <Card radius="lg" bg="dark.6" p="lg" withBorder style={{ borderColor: '#2C2E33', marginTop: 80 }}>
                <Stack align="center" gap="sm">
                    <Text size="sm" c="dimmed" fw={700} tt="uppercase">Scan to Import List</Text>
                    <div style={{ background: 'white', padding: 8, borderRadius: 8 }}>
                        <QRCodeSVG
                            value={finalUrl}
                            size={120}
                            level="M"
                            fgColor="#000000"
                            bgColor="#ffffff"
                        />
                    </div>
                    <Text size="xs" c="dimmed">Generated by ReiSteamYear</Text>
                </Stack>
            </Card>
        </Box>
    );
});

ExportableShareList.displayName = 'ExportableShareList';
