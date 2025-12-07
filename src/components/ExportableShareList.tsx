import { Box, Title, Text, SimpleGrid, Card, Image, Group, Stack, Badge, Grid, Progress } from '@mantine/core';
import { IconStarFilled } from '@tabler/icons-react';
import { ShareList } from '@/store/useShareStore';
import { forwardRef } from 'react';

interface ExportableShareListProps {
    list: ShareList;
}

export const ExportableShareList = forwardRef<HTMLDivElement, ExportableShareListProps>(({ list }, ref) => {
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
                <Text size="xl" c="dimmed" mt="xs">安利列表 • 共 {list.games.length} 款游戏</Text>
            </Stack>

            {/* List Header */}
            <Grid mb="md" px="md" visibleFrom="xs">
                <Grid.Col span={4}><Text size="sm" fw={700} c="dimmed">GAME</Text></Grid.Col>
                <Grid.Col span={4}><Text size="sm" fw={700} c="dimmed">RATINGS</Text></Grid.Col>
                <Grid.Col span={4}><Text size="sm" fw={700} c="dimmed">COMMENT</Text></Grid.Col>
            </Grid>

            <Stack gap="xl">
                {[...list.games].sort((a, b) => b.rating - a.rating).map((game, index) => (
                    <Card key={game.id} radius="lg" bg="dark.6" p="lg" withBorder style={{ borderColor: '#2C2E33' }}>
                        <Grid align="flex-start" gutter="xl">
                            {/* Game Info */}
                            <Grid.Col span={4}>
                                <Group wrap="nowrap" align="flex-start">
                                    <Text size="xl" fw={900} c="dimmed" w={40} ta="center" style={{ opacity: 0.3, marginTop: 4 }}>#{index + 1}</Text>
                                    <Stack gap="xs">
                                        <img
                                            src={`/api/image-proxy?url=${encodeURIComponent(game.coverUrl)}&gid=${game.id}`}
                                            style={{
                                                width: 200,
                                                height: 94,
                                                borderRadius: 8,
                                                objectFit: 'cover'
                                            }}
                                            alt={game.name}
                                            crossOrigin="anonymous"
                                        />
                                        <Title order={3} c="white" lineClamp={2} style={{ fontSize: 20 }}>
                                            {game.name}
                                        </Title>
                                    </Stack>
                                </Group>
                            </Grid.Col>

                            {/* Sub Ratings */}
                            <Grid.Col span={4}>
                                <Stack gap={4}>
                                    <Group justify="space-between" mb={4}>
                                        <Group gap={6} align="center">
                                            <IconStarFilled size={18} color="gold" />
                                            <Text fw={900} size="lg" c="white">TOTAL SCORE</Text>
                                        </Group>
                                        <Badge size="lg" variant="filled" color={game.rating >= 90 ? 'yellow' : 'blue'}>
                                            {game.rating}
                                        </Badge>
                                    </Group>

                                    <Grid gutter="xs">
                                        {[
                                            { label: '玩法', key: 'ratingGameplay', color: 'blue' },
                                            { label: '画面', key: 'ratingVisuals', color: 'pink' },
                                            { label: '剧情', key: 'ratingStory', color: 'cyan' },
                                            { label: '私心', key: 'ratingSubjective', color: 'orange' },
                                        ].map((item) => {
                                            // @ts-ignore
                                            const val = game[item.key] || 0;
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
                                </Stack>
                            </Grid.Col>

                            {/* Comment */}
                            <Grid.Col span={4}>
                                <Text size="xs" fw={700} c="dimmed" mb={8} tt="uppercase">Recommendation</Text>
                                <Text
                                    size="sm"
                                    c="white"
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
                ))}
            </Stack>

            <Group justify="center" mt={80}>
                <Text c="dimmed" size="lg">Generated by Rei Steam Year</Text>
            </Group>
        </Box>
    );
});

ExportableShareList.displayName = 'ExportableShareList';
