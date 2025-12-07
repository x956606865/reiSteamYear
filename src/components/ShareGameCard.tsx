import { Card, Image, Text, Group, Badge, Stack, Rating, ActionIcon, Tooltip, Slider, Textarea, Button } from '@mantine/core';
import { useShareStore, ShareGame } from '@/store/useShareStore';
import { IconTrash, IconExternalLink, IconEyeOff } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface ShareGameCardProps {
    listId: string;
    game: ShareGame;
}

export function ShareGameCard({ listId, game }: ShareGameCardProps) {
    const { updateGame, removeGame } = useShareStore();

    // Local state for reason text to avoid sluggish typing
    const [reason, setReason] = useState(game.reason || '');

    // Local state for smooth sliding optimization
    const [localRatings, setLocalRatings] = useState({
        ratingGameplay: game.ratingGameplay ?? game.rating ?? 80,
        ratingVisuals: game.ratingVisuals ?? game.rating ?? 80,
        ratingStory: game.ratingStory ?? game.rating ?? 80,
        ratingSubjective: game.ratingSubjective ?? game.rating ?? 80,
    });

    // Sync local state when external game changes
    useEffect(() => {
        setLocalRatings({
            ratingGameplay: game.ratingGameplay ?? game.rating ?? 80,
            ratingVisuals: game.ratingVisuals ?? game.rating ?? 80,
            ratingStory: game.ratingStory ?? game.rating ?? 80,
            ratingSubjective: game.ratingSubjective ?? game.rating ?? 80,
        });
    }, [game.rating, game.ratingGameplay, game.ratingVisuals, game.ratingStory, game.ratingSubjective]);

    // Sync reason only on blur to avoid too many writes
    const handleReasonBlur = () => {
        if (reason !== game.reason) {
            updateGame(listId, { id: game.id, reason });
        }
    };

    const handleDelete = () => {
        if (confirm(`确定要从列表中移除 "${game.name}" 吗？`)) {
            removeGame(listId, game.id);
        }
    };

    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;

    // Helper to calculate average and update store
    const handleRatingChangeEnd = (key: string, value: number) => {
        const updatedRatings = { ...localRatings, [key]: value };

        const skipped = game.skippedRatings || [];
        const allKeys = ['ratingGameplay', 'ratingVisuals', 'ratingStory', 'ratingSubjective'];
        const active = allKeys.filter(k => !skipped.includes(k));
        // @ts-ignore
        const sum = active.reduce((acc, k) => acc + updatedRatings[k], 0);
        const avg = active.length ? Math.round(sum / active.length) : 0;

        updateGame(listId, {
            id: game.id,
            ...updatedRatings,
            rating: avg
        });
    };

    const toggleSkip = (key: string) => {
        if (key === 'ratingSubjective') return; // Subjective cannot be skipped (or logic choice)

        const currentSkipped = game.skippedRatings || [];
        const newSkipped = currentSkipped.includes(key)
            ? currentSkipped.filter(k => k !== key)
            : [...currentSkipped, key];

        // Recalc average
        const allKeys = ['ratingGameplay', 'ratingVisuals', 'ratingStory', 'ratingSubjective'];
        const active = allKeys.filter(k => !newSkipped.includes(k));
        // Use current local ratings
        // @ts-ignore
        const sum = active.reduce((acc, k) => acc + localRatings[k], 0);
        const avg = active.length ? Math.round(sum / active.length) : 0;

        updateGame(listId, {
            id: game.id,
            skippedRatings: newSkipped,
            rating: avg
        });
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                <Image
                    src={imageUrl}
                    h={120}
                    alt={game.name}
                    fallbackSrc="https://placehold.co/600x400?text=No+Image"
                />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Text fw={600} lineClamp={1} title={game.name} style={{ flex: 1 }}>{game.name}</Text>
                <Tooltip label="在 Steam 查看">
                    <ActionIcon
                        component="a"
                        href={`https://store.steampowered.com/app/${game.id}`}
                        target="_blank"
                        variant="subtle"
                        color="gray"
                        size="sm"
                    >
                        <IconExternalLink size={16} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <Stack gap="xs">
                <Group justify="space-between">
                    <Text size="sm" fw={700}>总分</Text>
                    <Text size="sm" fw={700} c="blue">{game.rating}</Text>
                </Group>

                {/* Multi-dimensional Sliders */}
                {[
                    { label: '游戏性', key: 'ratingGameplay' as const },
                    { label: '音画', key: 'ratingVisuals' as const },
                    { label: '剧情', key: 'ratingStory' as const },
                    { label: '主观', key: 'ratingSubjective' as const },
                ].map((item) => {
                    const val = localRatings[item.key];
                    const isSkipped = game.skippedRatings?.includes(item.key);
                    const canSkip = item.key !== 'ratingSubjective';

                    return (
                        <Group key={item.key} gap="xs" align="center">
                            <Text size="xs" w={45} c={isSkipped ? "dimmed" : undefined} td={isSkipped ? "line-through" : undefined}>
                                {item.label}
                            </Text>
                            <Slider
                                style={{ flex: 1, opacity: isSkipped ? 0.3 : 1 }}
                                size="xs"
                                color="yellow" // Matching GameCard style
                                value={val}
                                min={0}
                                max={100}
                                label={null}
                                disabled={isSkipped}
                                onChange={(v) => {
                                    setLocalRatings(prev => ({ ...prev, [item.key]: v }));
                                }}
                                onChangeEnd={(v) => handleRatingChangeEnd(item.key, v)}
                            />
                            <Text size="xs" w={28} ta="right" c={isSkipped ? "dimmed" : undefined}>
                                {isSkipped ? '-' : val}
                            </Text>

                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                style={{ opacity: canSkip && !isSkipped ? 0.3 : (isSkipped ? 1 : 0), cursor: canSkip ? 'pointer' : 'default' }}
                                onClick={() => canSkip && toggleSkip(item.key)}
                            >
                                <IconEyeOff size={12} />
                            </ActionIcon>
                        </Group>
                    );
                })}

                <Textarea
                    placeholder="写下你的安利理由..."
                    label="推荐理由"
                    autosize
                    minRows={3}
                    maxRows={6}
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    onBlur={handleReasonBlur}
                    mt="xs"
                />

                <Group justify="flex-end" mt="xs">
                    <Tooltip label="移除游戏">
                        <ActionIcon variant="light" color="red" onClick={handleDelete} size="sm">
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Stack>
        </Card>
    );
}
