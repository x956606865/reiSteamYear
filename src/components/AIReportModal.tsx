
import { Modal, Button, Text, Progress, Stack, Group, Badge, Card, SimpleGrid, Title, LoadingOverlay, ScrollArea, Loader, Blockquote, RingProgress, Tooltip, ActionIcon, List, Divider, Paper, Popover, Timeline, Portal } from '@mantine/core';
import { IconHistory, IconRefresh, IconArrowRight, IconTrash, IconDownload, IconX } from '@tabler/icons-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAIConfigStore, AIModelClient, AIAnalysisResult } from '@/lib/ai-client';
import { useGameDetailsQueue, GameDetails } from '@/lib/steam-client';
import { AISettingsModal } from './AISettingsModal';
import { SteamGame } from '@/lib/steam';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import { ExportableAIReport } from './ExportableAIReport';

interface AIReportModalProps {
    opened: boolean;
    onClose: () => void;
    year: number;
    games: SteamGame[]; // All games played this year
    reviews: Record<number, any>; // To identify rated games
    user?: { name: string, image: string };
    summaryStats?: {
        totalGames: number;
        totalPlaytime: number; // minutes
        completionRate: number;
        topGame?: { name: string, rating: number };
    };
}

export function AIReportModal({ opened, onClose, year, games, reviews, user, summaryStats }: AIReportModalProps) {
    const aiConfig = useAIConfigStore();
    const [settingsOpen, setSettingsOpen] = useState(false);
    // ... (existing code) ...


    // Workflow State
    const [step, setStep] = useState<'idle' | 'fetching' | 'generating' | 'done'>('idle');
    const [result, setResult] = useState<AIAnalysisResult | null>(null);

    // 1. Prepare Game Lists (Two-Tier Context)
    const { tier1Ids, tier2List, stats } = useMemo(() => {
        // Stats
        const totalGames = games.length;
        const shortGames = games.filter(g => g.playtime_forever < 300).length; // < 5h (300 min)
        const longGames = games.filter(g => g.playtime_forever > 1200).length; // > 20h
        const medianPlaytime = games.length > 0 ? games.sort((a, b) => a.playtime_forever - b.playtime_forever)[Math.floor(games.length / 2)].playtime_forever : 0;

        // Tier 1: Detailed Context (Limit to Top 30 to save time/tokens)
        // Priority: Games with textual reviews > Games with Ratings > High Playtime
        let t1Candidates = [...games].sort((a, b) => {
            const rA = reviews[a.appid];
            const rB = reviews[b.appid];

            // 1. Has Comment? (Highest priority)
            const hasCommentA = !!rA?.comment;
            const hasCommentB = !!rB?.comment;
            if (hasCommentA !== hasCommentB) return hasCommentA ? -1 : 1;

            // 2. Has Rating?
            const hasRatingA = !!rA?.rating;
            const hasRatingB = !!rB?.rating;
            if (hasRatingA !== hasRatingB) return hasRatingA ? -1 : 1;

            // 3. Playtime
            return b.playtime_forever - a.playtime_forever;
        });

        // Strict Cap at 30
        const t1Slice = t1Candidates.slice(0, 30);
        const t1Ids = new Set(t1Slice.map(g => g.appid));
        const t1Array = Array.from(t1Ids);

        // Tier 2: The rest
        const t2List = games.filter(g => !t1Ids.has(g.appid)).map(g => ({
            id: g.appid, // Add ID to look up review later
            name: g.name,
            hours: Math.round(g.playtime_forever / 60)
        }));

        // Additional Manual Stats (Prefer props if available)
        let totalHours = 0;
        let completionRate = 0;
        let topGameName = '';

        if (summaryStats) {
            totalHours = Math.round(summaryStats.totalPlaytime / 60);
            completionRate = summaryStats.completionRate;
            topGameName = summaryStats.topGame?.name || '';
        } else {
            // Fallback calculation
            totalHours = Math.round(games.reduce((acc, g) => acc + g.playtime_forever, 0) / 60);
            let beatenCount = 0;
            let topGame = { name: '', rating: 0 };

            Object.values(reviews).forEach((r: any) => {
                if (r.status === 'beaten' || r.status === 'completed') beatenCount++;
            });

            games.forEach(g => {
                const r = reviews[g.appid];
                if (r && r.rating > topGame.rating) {
                    topGame = { name: g.name, rating: r.rating };
                }
            });
            completionRate = totalGames > 0 ? Math.round((beatenCount / totalGames) * 100) : 0;
            topGameName = topGame.name;
        }

        return {
            tier1Ids: t1Array,
            tier2List: t2List,
            stats: {
                totalGames,
                shortGames,
                longGames,
                medianPlaytime: Math.round(medianPlaytime / 60),
                totalHours,
                completionRate,
                topGameName
            }
        };
    }, [games, reviews, summaryStats]);

    // 2. Fetch Queue (Only runs when step === 'fetching')
    const { details, progress, isFetching } = useGameDetailsQueue(tier1Ids, step === 'fetching');

    // Load cached result on mount
    useEffect(() => {
        const cached = localStorage.getItem(`ai - report - ${year} `);
        if (cached) {
            try {
                setResult(JSON.parse(cached));
                setStep('done');
            } catch (e) {
                console.error("Failed to parse cached report", e);
            }
        }
    }, [year]);

    // Auto-advance to generation when fetching complete
    useEffect(() => {
        if (step === 'fetching' && !isFetching && progress.current === progress.total && progress.total > 0) {
            generateReport();
        }
    }, [step, isFetching, progress]);

    const startProcess = () => {
        if (!aiConfig.isConfigured()) {
            setSettingsOpen(true);
            return;
        }
        setStep('fetching');
    };

    // History State
    const [history, setHistory] = useState<{ date: string, data: AIAnalysisResult }[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(`ai - history - ${year} `);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, [year]);

    const addToHistory = (newData: AIAnalysisResult) => {
        const newEntry = { date: new Date().toISOString(), data: newData };
        const updated = [newEntry, ...history].slice(0, 10); // Keep last 10
        setHistory(updated);
        localStorage.setItem(`ai - history - ${year} `, JSON.stringify(updated));
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(`ai - history - ${year} `);
        setResult(null);
        setStep('idle');
    };

    const generateReport = async () => {
        setStep('generating');
        try {
            const client = new AIModelClient(aiConfig);
            // ... (Prompt generation logic same as before, keep mapped details)
            // Need to verify 'prompt' variable availability directly or copy logic.
            // COPYING PROMPT LOGIC FOR SAFETY due to scope limitations:
            let prompt = `User Play History(${year}): \n`;
            prompt += `Stats: Total ${stats.totalGames} games.Short(< 5h): ${stats.shortGames}, Long(> 20h): ${stats.longGames}. Median Playtime: ${stats.medianPlaytime} h.\n\n`;

            const formatReview = (r: any) => {
                if (!r) return '';
                let s = `UserScore:${r.rating} (Play: ${r.ratingGameplay} Vis: ${r.ratingVisuals} Story: ${r.ratingStory})`;
                if (r.comment) s += ` Comment: "${r.comment}"`;
                if (r.status === 'beaten') s += ` [Beaten]`;
                if (r.status === 'dropped') s += ` [Dropped]`;
                return s;
            };

            prompt += `[Detailed Games(High Priority)]: \n`;
            tier1Ids.forEach(id => {
                const g = games.find(x => x.appid === id);
                const d = details.get(id);
                const r = reviews[id];
                const hours = Math.round((g?.playtime_forever || 0) / 60);
                const reviewText = formatReview(r);
                if (d) {
                    prompt += `- ${d.name || g?.name} (${hours}h): [${d.genres.slice(0, 3).join(', ')}] ${d.categories.slice(0, 3).join(', ')}.Desc: "${d.short_description?.slice(0, 150)}..." ${reviewText} \n`;
                } else {
                    prompt += `- ${g?.name} (${hours}h) ${reviewText} \n`;
                }
            });

            prompt += `\n[Other Games(low usage, for breadth)]: \n`;
            prompt += tier2List.map(g => {
                const r = reviews[g.id];
                let context = '';
                if (r) {
                    context += `[Score:${r.rating} `;
                    if (r.status === 'dropped') context += ' Dropped';
                    context += ']';
                }
                return `${g.name} (${g.hours}h${context ? ' ' + context : ''})`;
            }).slice(0, 50).join(', ');

            const res = await client.generateAnalysis(prompt);
            setResult(res);
            addToHistory(res); // Save to history
            localStorage.setItem(`ai - report - ${year} `, JSON.stringify(res)); // Keep current cache
            setStep('done');
        } catch (e: any) {
            console.error(e);
            alert(`Generation Failed: ${e.message} `);
            setStep('idle');
        }
    };

    // Visualization
    const radarData = useMemo(() => {
        if (!result?.radarChart) return [];
        const translate: Record<string, string> = {
            action: '动作',
            strategy: '策略',
            story: '剧情',
            artistic: '艺术',
            social: '社交',
            relaxing: '休闲'
        };
        return Object.entries(result.radarChart).map(([key, value]) => ({
            subject: translate[key] || key,
            A: value,
            fullMark: 100
        }));
    }, [result]);

    const rpgStatsData = useMemo(() => {
        if (!result?.rpgStats) return [];
        return [
            { label: '力量 (STR)', value: result.rpgStats.STR, desc: '战斗强度/肝度' },
            { label: '敏捷 (DEX)', value: result.rpgStats.DEX, desc: '操作/反应要求' },
            { label: '智力 (INT)', value: result.rpgStats.INT, desc: '策略/解谜深度' },
            { label: '感知 (WIS)', value: result.rpgStats.WIS, desc: '剧情共情/审美' },
            { label: '魅力 (CHA)', value: result.rpgStats.CHA, desc: '联机/社交互动' },
            { label: '幸运 (LUCK)', value: result.rpgStats.LUCK, desc: '随机性/Rogue' }
        ];
    }, [result]);

    // Export
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!exportRef.current || !result) return;
        setIsExporting(true);
        try {
            // Need a slight delay to ensure rendering if visible was toggled (though here it's always rendered hidden)
            const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `rei - steam - year - ai - report - ${year}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Export failed', err);
            alert('Export failed, please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/* Hidden Export Component */}
            <div style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
                {result && (
                    <ExportableAIReport
                        ref={exportRef}
                        data={{ ...result, manualStats: { ...stats } }}
                        year={year}
                        user={user || { name: 'User', image: '' }}
                    />
                )}
            </div>

            <Modal
                opened={opened}
                onClose={onClose}
                size="xl"
                centered
                title={<Text fw={700}>AI 年度游戏报告 {year}</Text>}
            >

                {step === 'idle' && (
                    <Stack>
                        <Text>使用 AI 生成你的年度游戏总结。我们将分析你的游戏时长、类型偏好和评分数据。</Text>
                        <Group grow>
                            <Button variant="default" onClick={() => setSettingsOpen(true)}>AI 设置</Button>
                            <Button onClick={startProcess}>开始生成</Button>
                        </Group>
                    </Stack>
                )
                }

                {
                    step === 'fetching' && (
                        <Stack>
                            <Text size="sm">正在获取游戏元数据... ({progress.current}/{progress.total})</Text>
                            <Progress value={(progress.current / progress.total) * 100} animated />
                            <Text size="xs" c="dimmed">为了遵守 Steam API 限制，我们需要按顺序获取数据。</Text>
                        </Stack>
                    )
                }

                {
                    step === 'generating' && (
                        <Stack align="center" py="xl">
                            <Loader size="xl" type="dots" />
                            <Text fw={700} mt="md">AI 正在分析你的游戏基因...</Text>
                            <Text size="sm" c="dimmed">这可能需要几十秒，请耐心等待</Text>
                        </Stack>
                    )
                }

                {
                    step === 'done' && result && (
                        <ScrollArea h={600} type="auto" offsetScrollbars>
                            <Stack gap="lg" p="md">
                                <Group justify="space-between" align="start">
                                    <Stack gap={0}>
                                        <Title order={2}>{result.persona}</Title>
                                        {result.annualTitle && <Text c="blue" fw={900} size="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}>{result.annualTitle}</Text>}
                                    </Stack>
                                    <Group gap="xs">
                                        <Tooltip label="保存为图片">
                                            <Button size="xs" variant="light" color="blue" leftSection={<IconDownload size={14} />} onClick={handleExport} loading={isExporting}>
                                                保存图片
                                            </Button>
                                        </Tooltip>

                                        {history.length > 0 && (
                                            <Popover position="bottom" withArrow shadow="md">
                                                <Popover.Target>
                                                    <Button size="xs" variant="subtle" color="gray" leftSection={<IconHistory size={14} />}>
                                                        历史
                                                    </Button>
                                                </Popover.Target>
                                                <Popover.Dropdown>
                                                    <Text size="xs" fw={700} mb="xs">历史记录 (本地)</Text>
                                                    <Stack gap="xs">
                                                        {history.map((h, i) => (
                                                            <Button key={i} variant="subtle" size="compact-xs" fullWidth justify="start" onClick={() => setResult(h.data)}>
                                                                {new Date(h.date).toLocaleString()}
                                                            </Button>
                                                        ))}
                                                        <Divider />
                                                        <Button variant="light" color="red" size="compact-xs" onClick={clearHistory} leftSection={<IconTrash size={12} />}>清空历史</Button>
                                                    </Stack>
                                                </Popover.Dropdown>
                                            </Popover>
                                        )}

                                        <Button size="xs" variant="outline" leftSection={<IconRefresh size={14} />} onClick={() => {
                                            setStep('fetching');
                                        }}>
                                            重新生成
                                        </Button>
                                    </Group>
                                </Group>

                                {result.creativeReview && (
                                    <Blockquote color="violet" cite="– AI 锐评" iconSize={32}>
                                        {result.creativeReview}
                                    </Blockquote>
                                )}

                                <Text size="lg">{result.summary}</Text>

                                <Group>
                                    {result.keywords.map(k => <Badge key={k} size="lg" variant="dot">{k}</Badge>)}
                                    <Badge size="lg" color="pink">{result.mostPlayedGenre}</Badge>
                                    {result.completionistScore !== undefined && <Badge size="lg" color="yellow">全收集指数: {result.completionistScore}</Badge>}
                                </Group>

                                {/* Main Stats Grid */}
                                <SimpleGrid cols={2} spacing="lg">
                                    {/* Left: Radar & Emotions */}
                                    <Stack>
                                        <Card withBorder padding="md" radius="md">
                                            <Text fw={700} mb="sm" ta="center">游戏基因 (Radar)</Text>
                                            <div style={{ height: 250, width: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                        <PolarGrid />
                                                        <PolarAngleAxis dataKey="subject" />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                                        <Radar name="Stats" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        {/* Emotional Palette */}
                                        {result.emotionalPalette && (
                                            <Card withBorder padding="md" radius="md">
                                                <Text fw={700} mb="sm">情绪色谱</Text>
                                                <Stack gap="xs">
                                                    {result.emotionalPalette.map((e, i) => (
                                                        <Group key={i} justify="space-between">
                                                            <Text size="sm">{e.emotion}</Text>
                                                            <Group gap="xs">
                                                                <Progress value={e.percentage} w={120} color={['red', 'blue', 'green', 'orange', 'grape'][i % 5]} size="lg" />
                                                                <Text size="xs" c="dimmed" w={35} ta="right">{e.percentage}%</Text>
                                                            </Group>
                                                        </Group>
                                                    ))}
                                                </Stack>
                                            </Card>
                                        )}
                                    </Stack>

                                    {/* Right: RPG Stats & Highlights */}
                                    <Stack>
                                        {result.rpgStats && (
                                            <Card withBorder padding="md" radius="md">
                                                <Text fw={700} mb="md">RPG 角色面板</Text>
                                                <SimpleGrid cols={2}>
                                                    {rpgStatsData.map(stat => (
                                                        <Tooltip key={stat.label} label={stat.desc} withArrow>
                                                            <Paper withBorder p="xs" radius="sm">
                                                                <Group justify="space-between" mb={4}>
                                                                    <Text size="xs" c="dimmed" fw={700}>{stat.label}</Text>
                                                                    <Text fw={900} c="blue">{stat.value}</Text>
                                                                </Group>
                                                                <Progress value={stat.value} size="xs" />
                                                            </Paper>
                                                        </Tooltip>
                                                    ))}
                                                </SimpleGrid>
                                            </Card>
                                        )}

                                        {result.backlogSuggestion && (
                                            <Card withBorder padding="md" radius="md" style={{ borderColor: '#fa5252' }}>
                                                <Group mb="xs">
                                                    <Text fw={700} c="red">💔 沧海遗珠</Text>
                                                    <Badge color="red" variant="light">劝回坑</Badge>
                                                </Group>
                                                <Text fw={700} size="lg">{result.backlogSuggestion.gameName}</Text>
                                                <Text size="sm" mt="xs">{result.backlogSuggestion.reason}</Text>
                                            </Card>
                                        )}

                                        {result.contrastHighlight && (
                                            <Card withBorder padding="md" radius="md" style={{ borderColor: '#fab005' }}>
                                                <Group mb="xs">
                                                    <Text fw={700} c="orange">🏷️ 反差萌时刻</Text>
                                                </Group>
                                                <Text fw={700} size="lg">{result.contrastHighlight.gameName}</Text>
                                                <Text size="sm" mt="xs">{result.contrastHighlight.reason}</Text>
                                            </Card>
                                        )}
                                    </Stack>
                                </SimpleGrid>
                            </Stack>
                        </ScrollArea>
                    )
                }
            </Modal >

            <AISettingsModal
                opened={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onSaveSuccess={() => {
                    // User requested to click Start manually
                }}
            />
        </>
    );
}
