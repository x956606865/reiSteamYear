import { Card, Text, Group, Badge, Stack, Title, Box, Grid, Progress, Avatar, Divider, SimpleGrid } from '@mantine/core';
import { forwardRef, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { AIAnalysisResult } from '@/lib/ai-client';

export interface ExportableAIReportProps {
    data: AIAnalysisResult;
    year: number;
    user?: {
        name: string;
        image: string;
    };
}

const getProxyUrl = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

export const ExportableAIReport = forwardRef<HTMLDivElement, ExportableAIReportProps>(({ data, year, user }, ref) => {

    // Transform Radar Data
    const radarData = useMemo(() => {
        if (!data.radarChart) return [];
        const translate: Record<string, string> = {
            action: '动作',
            strategy: '策略',
            story: '剧情',
            artistic: '艺术',
            social: '社交',
            relaxing: '休闲'
        };
        return Object.entries(data.radarChart).map(([key, value]) => ({
            subject: translate[key] || key,
            A: value,
            fullMark: 100
        }));
    }, [data]);

    // Transform RPG Stats
    const rpgStatsData = useMemo(() => {
        if (!data.rpgStats) return [];
        return [
            { label: '力量 STR', value: data.rpgStats.STR },
            { label: '敏捷 DEX', value: data.rpgStats.DEX },
            { label: '智力 INT', value: data.rpgStats.INT },
            { label: '感知 WIS', value: data.rpgStats.WIS },
            { label: '魅力 CHA', value: data.rpgStats.CHA },
            { label: '幸运 LUCK', value: data.rpgStats.LUCK }
        ];
    }, [data]);

    return (
        <Box
            ref={ref}
            p={40}
            style={{
                width: 800,
                minHeight: 1000,
                backgroundColor: '#141517',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative Background Elements */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(51,154,240,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(204,93,232,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />

            <Stack gap="xl" style={{ position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <Group justify="space-between" align="start">
                    <Stack gap={0}>
                        <Text size="xl" fw={900} c="dimmed" style={{ letterSpacing: 2 }}>年度游戏报告 {year}</Text>
                        <Title p={0} style={{ fontSize: 48, lineHeight: 1.1 }}>{data.persona}</Title>
                        {data.annualTitle && (
                            <Text
                                fw={900}
                                style={{
                                    fontSize: 32,
                                    background: 'linear-gradient(45deg, #339af0, #22b8cf)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {data.annualTitle}
                            </Text>
                        )}
                    </Stack>

                    {/* User Info Badge */}
                    <Group bg="rgba(255,255,255,0.1)" p="xs" style={{ borderRadius: 100, paddingRight: 20 }}>
                        {user && <Avatar src={getProxyUrl(user.image)} size="md" radius="xl" />}
                        <Text fw={700}>{user?.name || 'Gamer'}</Text>
                    </Group>
                </Group>

                <Divider color="gray" style={{ opacity: 0.2 }} />

                {/* Creative Review Quote */}
                {data.creativeReview && (
                    <Box p="lg" bg="rgba(51,154,240,0.1)" style={{ borderRadius: 16, borderLeft: '4px solid #339af0' }}>
                        <Group align="start" gap="xs">
                            <Text size="xl" style={{ lineHeight: 1 }}>❝</Text>
                            <Text size="lg" fs="italic" style={{ flex: 1, lineHeight: 1.6 }}>{data.creativeReview}</Text>
                        </Group>
                        <Text ta="right" size="sm" c="dimmed" mt="xs">— AI 锐评</Text>
                    </Box>
                )}

                {/* Main Content Grid */}
                <Grid gutter="xl">
                    {/* Left Column: Charts */}
                    <Grid.Col span={6}>
                        <Stack gap="xl">
                            {/* Radar Chart */}
                            <Box bg="rgba(255,255,255,0.03)" p="md" style={{ borderRadius: 16 }}>
                                <Text fw={700} ta="center" mb="md" c="dimmed">游戏基因</Text>
                                <div style={{ height: 260, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Stats" dataKey="A" stroke="#339af0" fill="#339af0" fillOpacity={0.5} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Box>

                            {/* Emotional Palette */}
                            {data.emotionalPalette && (
                                <Box>
                                    <Text fw={700} mb="sm" size="sm" c="dimmed">情感色谱</Text>
                                    <Stack gap="xs">
                                        {data.emotionalPalette.slice(0, 4).map((e, i) => (
                                            <Group key={i} justify="space-between">
                                                <Text size="sm" fw={500}>{e.emotion}</Text>
                                                <Group gap="xs" style={{ flex: 1 }} justify="flex-end">
                                                    <Progress
                                                        value={e.percentage}
                                                        color={['red', 'blue', 'green', 'orange'][i % 4]}
                                                        size="md"
                                                        radius="xl"
                                                        w={120}
                                                    />
                                                    <Text size="xs" w={30} ta="right" c="dimmed">{e.percentage}%</Text>
                                                </Group>
                                            </Group>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Grid.Col>

                    {/* Right Column: Stats & Text */}
                    <Grid.Col span={6}>
                        <Stack gap="xl">
                            {/* Manual Stats Grid */}
                            {data.manualStats && (
                                <SimpleGrid cols={2} spacing="xs">
                                    <Box p="xs" bg="rgba(255,255,255,0.05)" style={{ borderRadius: 8 }}>
                                        <Text size="xs" c="dimmed">总游戏数</Text>
                                        <Text fw={900} size="xl">{data.manualStats.totalGames}</Text>
                                    </Box>
                                    <Box p="xs" bg="rgba(255,255,255,0.05)" style={{ borderRadius: 8 }}>
                                        <Text size="xs" c="dimmed">总时长 (小时)</Text>
                                        <Text fw={900} size="xl">{data.manualStats.totalHours}</Text>
                                    </Box>
                                    <Box p="xs" bg="rgba(255,255,255,0.05)" style={{ borderRadius: 8 }}>
                                        <Text size="xs" c="dimmed">通关率</Text>
                                        <Text fw={900} size="xl" c="green">{data.manualStats.completionRate}%</Text>
                                    </Box>
                                    <Box p="xs" bg="rgba(255,255,255,0.05)" style={{ borderRadius: 8 }}>
                                        <Text size="xs" c="dimmed">年度最高分</Text>
                                        <Text fw={900} size="md" lineClamp={1} title={data.manualStats.topGameName}>{data.manualStats.topGameName || '-'}</Text>
                                    </Box>
                                </SimpleGrid>
                            )}

                            {/* Summary Text */}
                            <Box>
                                <Text size="sm" c="dimmed" mb="xs" fw={700}>年度总结</Text>
                                <Text style={{ lineHeight: 1.6 }} c="gray.3">
                                    {data.summary}
                                </Text>
                            </Box>

                            {/* RPG Stats */}
                            {data.rpgStats && (
                                <Box>
                                    <Text size="sm" c="dimmed" mb="sm" fw={700}>RPG 属性面板</Text>
                                    <SimpleGrid cols={2} spacing="xs">
                                        {rpgStatsData.map(stat => (
                                            <Box key={stat.label} p="xs" bg="rgba(255,255,255,0.05)" style={{ borderRadius: 8 }}>
                                                <Group justify="space-between" mb={4}>
                                                    <Text size="xs" c="dimmed">{stat.label}</Text>
                                                    <Text fw={900} c={stat.value > 80 ? 'yellow' : 'white'}>{stat.value}</Text>
                                                </Group>
                                                <Progress value={stat.value} size={4} color="gray" />
                                            </Box>
                                        ))}
                                    </SimpleGrid>
                                </Box>
                            )}

                            {/* Tags */}
                            <Group gap="xs">
                                {data.keywords.map(k => (
                                    <Badge key={k} variant="outline" color="gray" size="lg" style={{ textTransform: 'none' }}>
                                        {k}
                                    </Badge>
                                ))}
                                <Badge variant="filled" color="pink" size="lg">{data.mostPlayedGenre}</Badge>
                                {data.completionistScore !== undefined && (
                                    <Badge variant="filled" color="yellow" size="lg" c="dark">全收集: {data.completionistScore}</Badge>
                                )}
                            </Group>
                        </Stack>
                    </Grid.Col>
                </Grid>

                {/* Highlights Footer */}
                <Divider color="gray" style={{ opacity: 0.2 }} />

                <SimpleGrid cols={2}>
                    {data.backlogSuggestion && (
                        <Group align="start" gap="sm">
                            <Text size="lg">💔</Text>
                            <Box>
                                <Text size="xs" c="red" fw={700} tt="uppercase">沧海遗珠</Text>
                                <Text fw={700} size="md">{data.backlogSuggestion.gameName}</Text>
                                <Text size="xs" c="dimmed" lineClamp={2}>{data.backlogSuggestion.reason}</Text>
                            </Box>
                        </Group>
                    )}
                    {data.contrastHighlight && (
                        <Group align="start" gap="sm">
                            <Text size="lg">🏷️</Text>
                            <Box>
                                <Text size="xs" c="orange" fw={700} tt="uppercase">反差萌时刻</Text>
                                <Text fw={700} size="md">{data.contrastHighlight.gameName}</Text>
                                <Text size="xs" c="dimmed" lineClamp={2}>{data.contrastHighlight.reason}</Text>
                            </Box>
                        </Group>
                    )}
                </SimpleGrid>
            </Stack>
        </Box>
    );
});

ExportableAIReport.displayName = 'ExportableAIReport';
