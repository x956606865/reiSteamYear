import { Card, Image, Text, Group, Badge, Stack, Title, Avatar, SimpleGrid, RingProgress, Center, Box, Paper } from '@mantine/core';
import { IconTrophy, IconDeviceGamepad2, IconClock } from '@tabler/icons-react';
import { forwardRef } from 'react';
import { SteamGame } from '@/lib/steam';

interface SummaryData {
    user: { name: string; image: string };
    totalGames: number;
    totalPlaytime: number;
    beatenCount: number;
    droppedCount: number;
    playedCount: number;
    completionRate: number;
    topGames: (SteamGame & { rating: number })[];
}

const StatBox = ({ label, value, color = "blue", icon }: { label: string, value: string | number, color?: string, icon?: any }) => (
    <Card bg="dark.6" radius="md" p="md">
        <Stack align="center" gap="xs">
            {icon}
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
            <Title order={2} c={color === 'green' ? 'green.4' : 'white'}>{value}</Title>
        </Stack>
    </Card>
);

interface SummaryCardProps {
    data: SummaryData;
}

const getProxyUrl = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

export const SummaryCard = forwardRef<HTMLDivElement, SummaryCardProps>(({ data }, ref) => {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder ref={ref} bg="#1A1B1E" style={{ maxWidth: 800, margin: '0 auto' }}>
            <Stack gap="xl">
                <Group>
                    <Avatar src={getProxyUrl(data.user.image)} size="lg" radius="xl" />
                    <div>
                        <Text size="xl" fw={700} c="white" style={{ whiteSpace: 'nowrap' }}>{data.user.name} 的年度游戏报告</Text>
                        <Text size="sm" c="dimmed">Powered by Steam</Text>
                    </div>
                    <IconTrophy size={48} color="gold" style={{ marginLeft: 'auto' }} />
                </Group>

                <SimpleGrid cols={3}>
                    <StatBox
                        label="游戏总数"
                        value={data.totalGames}
                        icon={<IconDeviceGamepad2 size={32} color="var(--mantine-color-blue-4)" />}
                    />
                    <StatBox
                        label="游玩时长 (小时)"
                        value={Math.round(data.totalPlaytime / 60)}
                        icon={<IconClock size={32} color="var(--mantine-color-yellow-4)" />}
                    />
                    <StatBox
                        label="通关率"
                        value={`${data.completionRate}%`}
                        color="green"
                        icon={<IconTrophy size={32} color="var(--mantine-color-green-4)" />}
                    />
                </SimpleGrid>

                <Group grow>
                    <Card bg="dark.6" radius="md" p="md">
                        <Group justify="space-between">
                            <Text fw={700} c="white">已通关</Text>
                            <Badge size="lg" color="green">{data.beatenCount}</Badge>
                        </Group>
                    </Card>
                    <Card bg="dark.6" radius="md" p="md">
                        <Group justify="space-between">
                            <Text fw={700} c="white">未完成 (可通关)</Text>
                            <Badge size="lg" color="gray">{data.droppedCount}</Badge>
                        </Group>
                    </Card>
                </Group>

                {/* Top Games */}
                {data.topGames.length > 0 && (
                    <Box>
                        <Title order={3} mb="md" ta="center" c="white">年度最佳游戏</Title>
                        <SimpleGrid cols={3}>
                            {data.topGames.map(game => (
                                <Card key={game.appid} padding="sm" radius="md" bg="dark.6">
                                    <Card.Section>
                                        <Image
                                            src={getProxyUrl(`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`)}
                                            height={100}
                                            fallbackSrc="https://placehold.co/600x400"
                                            alt={game.name}
                                        />
                                    </Card.Section>
                                    <Stack mt="sm" gap={4} align="center">
                                        <Text fw={600} lineClamp={1} size="sm" c="white">{game.name}</Text>
                                        <Badge color="yellow" variant="filled">
                                            {game.rating}
                                        </Badge>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Box>
                )}

                <Text size="xs" c="dimmed" ta="center">Generated by Rei Steam Year</Text>
            </Stack>
        </Card>
    );
});

SummaryCard.displayName = 'SummaryCard';
