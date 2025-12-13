
import { Modal, Button, Text, Progress, Stack, Group, Badge, Card, SimpleGrid, Title, LoadingOverlay, ScrollArea, Loader } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import { useAIConfigStore, AIModelClient, AIAnalysisResult } from '@/lib/ai-client';
import { useGameDetailsQueue, GameDetails } from '@/lib/steam-client';
import { AISettingsModal } from './AISettingsModal';
import { SteamGame } from '@/lib/steam';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface AIReportModalProps {
    opened: boolean;
    onClose: () => void;
    year: number;
    games: SteamGame[]; // All games played this year
    reviews: Record<number, any>; // To identify rated games
}

export function AIReportModal({ opened, onClose, year, games, reviews }: AIReportModalProps) {
    const aiConfig = useAIConfigStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

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

        return {
            tier1Ids: t1Array,
            tier2List: t2List,
            stats: { totalGames, shortGames, longGames, medianPlaytime: Math.round(medianPlaytime / 60) }
        };
    }, [games, reviews]);

    // 2. Fetch Queue (Only runs when step === 'fetching')
    const { details, progress, isFetching } = useGameDetailsQueue(tier1Ids, step === 'fetching');

    // Load cached result on mount
    useEffect(() => {
        const cached = localStorage.getItem(`ai-report-${year}`);
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

    const generateReport = async () => {
        setStep('generating');
        try {
            const client = new AIModelClient(aiConfig);

            // Construct Prompt
            let prompt = `User Play History (${year}):\n`;
            prompt += `Stats: Total ${stats.totalGames} games. Short(<5h): ${stats.shortGames}, Long(>20h): ${stats.longGames}. Median Playtime: ${stats.medianPlaytime}h.\n\n`;

            prompt += `[Detailed Games (High Priority)]:\n`;

            // Helper to format review
            const formatReview = (r: any) => {
                if (!r) return '';
                let s = `UserScore:${r.rating} (Play:${r.ratingGameplay} Vis:${r.ratingVisuals} Story:${r.ratingStory})`;
                if (r.comment) s += ` Comment:"${r.comment}"`;
                if (r.status === 'beaten') s += ` [Beaten]`;
                if (r.status === 'dropped') s += ` [Dropped]`;
                return s;
            };

            tier1Ids.forEach(id => {
                const g = games.find(x => x.appid === id);
                const d = details.get(id); // from queue cache
                const r = reviews[id];
                const hours = Math.round((g?.playtime_forever || 0) / 60);

                const reviewText = formatReview(r);

                if (d) {
                    prompt += `- ${d.name || g?.name} (${hours}h): [${d.genres.slice(0, 3).join(', ')}] ${d.categories.slice(0, 3).join(', ')}. Desc: "${d.short_description?.slice(0, 150)}..." ${reviewText}\n`;
                } else {
                    prompt += `- ${g?.name} (${hours}h) ${reviewText}\n`;
                }
            });

            prompt += `\n[Other Games (Context Only)]:\n`;
            prompt += tier2List.map(g => {
                const r = reviews[g.id];
                // For Tier 2, we keep it slightly more compact but still include key signals
                // If comment exists, it's valuable.
                let context = '';
                if (r) {
                    context += `[Score:${r.rating}`;
                    // Only add sub-ratings if they differ significantly from main rating? Or just add them if space allows.
                    // Let's add them compact: P/V/S
                    context += ` P:${r.ratingGameplay} V:${r.ratingVisuals} S:${r.ratingStory}`;
                    if (r.status === 'beaten') context += ' Beaten';
                    if (r.status === 'dropped') context += ' Dropped';
                    context += ']';
                    if (r.comment) context += ` "${r.comment.slice(0, 50)}..."`; // Truncate comments for Tier 2
                }
                return `${g.name} (${g.hours}h${context ? ' ' + context : ''})`;
            }).slice(0, 50).join(', '); // Cap at 50 to save tokens

            const res = await client.generateAnalysis(prompt);
            setResult(res);
            localStorage.setItem(`ai-report-${year}`, JSON.stringify(res));
            setStep('done');
        } catch (e: any) {
            console.error(e);
            alert(`Generation Failed: ${e.message}`);
            setStep('idle');
        }
    };

    // Visualization
    const radarData = useMemo(() => {
        if (!result?.radarChart) return [];
        return Object.entries(result.radarChart).map(([key, value]) => ({
            subject: key.charAt(0).toUpperCase() + key.slice(1),
            A: value,
            fullMark: 100
        }));
    }, [result]);

    return (
        <>
            <Modal opened={opened} onClose={onClose} title={`AI 年度游戏报告 ${year}`} size="lg" centered>

                {step === 'idle' && (
                    <Stack>
                        <Text>使用 AI 生成你的年度游戏总结。我们将分析你的游戏时长、类型偏好和评分数据。</Text>
                        <Group grow>
                            <Button variant="default" onClick={() => setSettingsOpen(true)}>AI 设置</Button>
                            <Button onClick={startProcess}>开始生成</Button>
                        </Group>
                    </Stack>
                )}

                {step === 'fetching' && (
                    <Stack>
                        <Text size="sm">正在获取游戏元数据... ({progress.current}/{progress.total})</Text>
                        <Progress value={(progress.current / progress.total) * 100} animated />
                        <Text size="xs" c="dimmed">为了遵守 Steam API 限制，我们需要按顺序获取数据。</Text>
                    </Stack>
                )}

                {step === 'generating' && (
                    <Stack align="center" py="xl">
                        <Loader size="xl" type="dots" />
                        <Text fw={700} mt="md">AI 正在分析你的游戏基因...</Text>
                        <Text size="sm" c="dimmed">这可能需要几十秒，请耐心等待</Text>
                    </Stack>
                )}

                {step === 'done' && result && (
                    <Stack>
                        <Group justify="space-between">
                            <Title order={3}>{result.persona}</Title>
                            <Button size="xs" variant="subtle" color="gray" onClick={() => {
                                // Clear cache and restart
                                localStorage.removeItem(`ai-report-${year}`);
                                setResult(null);
                                setStep('fetching'); // Go back to fetching (which will be fast if cached) -> then generate
                            }}>
                                重新生成
                            </Button>
                        </Group>
                        <Text>{result.summary}</Text>

                        <Group>
                            {result.keywords.map(k => <Badge key={k} variant="dot">{k}</Badge>)}
                            <Badge color="pink">{result.mostPlayedGenre}</Badge>
                        </Group>

                        <SimpleGrid cols={2}>
                            <Card withBorder padding="xs">
                                <Text fw={700} mb="xs" ta="center">游戏基因</Text>
                                <div style={{ height: 200, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                            <Radar name="My Stats" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                            <Card withBorder padding="xs">
                                <Text fw={700} mb="xs">沧海遗珠</Text>
                                <Text size="sm" c="dimmed">AI 推荐的冷门佳作:</Text>
                                <Text size="lg" fw={700} c="blue">{result.hiddenGem || '无'}</Text>
                            </Card>
                        </SimpleGrid>
                    </Stack>
                )}
            </Modal>

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
