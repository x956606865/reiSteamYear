import { Card, Image, Text, Group, Badge, Button, Stack, SegmentedControl, Rating, Center, ActionIcon, Tooltip, NumberInput, Slider, Switch, Modal } from '@mantine/core';
import type { SteamGame } from '@/lib/steam';
import { useDisclosure } from '@mantine/hooks';
import { ReviewModal } from './ReviewModal';
import { EditManualGameModal } from './EditManualGameModal';
import { useReviewStore, GameReview } from '@/store/useReviewStore';
import { IconMessageDots, IconEyeOff, IconPencil, IconTrash } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface GameCardProps {
    game: SteamGame;
}

export function GameCard({ game }: GameCardProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const { reviews, addReview, removeManualGame } = useReviewStore();
    const review = reviews[game.appid];

    // ... logic ...

    const handleDeleteManual = () => {
        if (confirm(`确定要删除 "${game.name}" 吗？此操作无法撤销。`)) {
            removeManualGame(game.appid);
        }
    };

    // Local state for smooth sliding. 
    // Default to 80 if no rating, but only visually when we start interacting?
    // Actually if we initialize with 80, it might show 80.
    // We sync with review.rating.
    // Local state for smooth sliding optimization
    const [isBeatable, setIsBeatable] = useState<boolean>(review?.isBeatable ?? true);

    // Default to 80 if no rating, but only visually when we start interacting?
    const [localRatings, setLocalRatings] = useState({
        ratingGameplay: review?.ratingGameplay ?? review?.rating ?? 80,
        ratingVisuals: review?.ratingVisuals ?? review?.rating ?? 80,
        ratingStory: review?.ratingStory ?? review?.rating ?? 80,
        ratingSubjective: review?.ratingSubjective ?? review?.rating ?? 80,
    });

    // Sync local state when external review changes (e.g. initial load or other device)
    // Only if the external value is significantly different to avoid loop? 
    // Actually we just sync if "review" object identity changes significantly or on mount.
    // To allow local sliding without jitter, we might want to avoid syncing *while* dragging?
    // But since we lift state up on ChangeEnd, simple sync is okay if it doesn't fire on every drag.
    useEffect(() => {
        if (review) {
            setLocalRatings({
                ratingGameplay: review.ratingGameplay ?? review.rating ?? 80,
                ratingVisuals: review.ratingVisuals ?? review.rating ?? 80,
                ratingStory: review.ratingStory ?? review.rating ?? 80,
                ratingSubjective: review.ratingSubjective ?? review.rating ?? 80,
            });
        }
    }, [review?.rating, review?.ratingGameplay, review?.ratingVisuals, review?.ratingStory, review?.ratingSubjective]);

    // Steam image URL format
    // appid needs to be used to construct URL if img_icon_url is icon
    // Header image: https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg
    // Library hero: https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/library_600x900.jpg

    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
    const hoursPlayed = Math.round(game.playtime_forever / 60);
    const isExcluded = review?.excluded || false;

    // Helper to update review without overwriting other fields
    const handleUpdate = (updates: Partial<GameReview>) => {
        const currentReview = review || {
            rating: 80, // Default base
            status: 'played',
            comment: '',
            isBeatable: true,
            excluded: false
        };

        addReview(game.appid, {
            ...currentReview,
            ...updates
        });
    };


    const handleStatusChange = (val: string) => {
        handleUpdate({ status: val as GameReview['status'] });
    };

    const handleBeatableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.currentTarget.checked;
        setIsBeatable(val);
        // If switching to Not Beatable, force status to 'played'
        handleUpdate({ isBeatable: val, status: val ? review?.status || 'played' : 'played' });
    };

    return (
        <>
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ opacity: isExcluded ? 0.5 : 1 }}>
                <Card.Section>
                    <Image
                        src={imageUrl}
                        h={120}
                        alt={game.name}
                    />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={600} lineClamp={1} title={game.name} style={{ flex: 1 }}>{game.name}</Text>
                    {review?.status === 'beaten' && <Badge color="green" variant="light">已通关</Badge>}
                    {review?.status === 'dropped' && <Badge color="red" variant="light">已弃坑</Badge>}
                </Group>

                <Text size="sm" c="dimmed" mb="md">
                    游玩时长: {hoursPlayed} 小时
                </Text>

                <Stack gap="xs">
                    {/* Switch for Beatable */}
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">剧情 / 可通关？</Text>
                        <Switch
                            size="xs"
                            checked={isBeatable}
                            onChange={handleBeatableChange}
                        />
                    </Group>

                    {isBeatable ? (
                        <SegmentedControl
                            size="xs"
                            fullWidth
                            value={review?.status === 'beaten' ? 'beaten' : 'played'}
                            onChange={handleStatusChange}
                            data={[
                                { label: '已通关', value: 'beaten' },
                                { label: '未通关', value: 'played' },
                            ]}
                            color={review?.status === 'beaten' ? 'green' : 'blue'}
                        />
                    ) : (
                        <Badge variant="outline" color="gray" fullWidth radius="sm">无尽 / 不可通关</Badge>
                    )}

                    {/* Rating Section */}
                    <Stack gap={4} mt="xs">
                        {(() => {
                            const currentStatus = review?.status || 'played';
                            // Default: Unfinished (played/dropped) games have rating disabled (noRating=true) by default.
                            // Beaten games have rating enabled (noRating=false) by default.
                            // Explicit user choice (review.noRating defined) overrides default.
                            const effectiveNoRating = review?.noRating ?? (currentStatus !== 'beaten');

                            return (
                                <>
                                    <Group justify="space-between">
                                        <Group gap={6}>
                                            <Text size="sm" c="dimmed">评分？</Text>
                                            <Switch
                                                size="xs"
                                                checked={!effectiveNoRating}
                                                onChange={(e) => handleUpdate({ noRating: !e.currentTarget.checked })}
                                            />
                                        </Group>

                                        {!effectiveNoRating && (
                                            <Text size="sm" fw={700}>
                                                总分: {(() => {
                                                    const activeKeys = [
                                                        'ratingGameplay',
                                                        'ratingVisuals',
                                                        'ratingStory',
                                                        'ratingSubjective'
                                                    ].filter(k => !review?.skippedRatings?.includes(k));

                                                    if (activeKeys.length === 0) return 0;

                                                    const sum = activeKeys.reduce((acc, key) => {
                                                        // @ts-ignore
                                                        return acc + (localRatings[key] ?? 0);
                                                    }, 0);

                                                    return Math.round(sum / activeKeys.length);
                                                })()}
                                            </Text>
                                        )}
                                        {effectiveNoRating && <Text size="xs" c="dimmed">未评分</Text>}
                                    </Group>

                                    {!effectiveNoRating && (
                                        [
                                            { label: '游戏性', key: 'ratingGameplay' as const },
                                            { label: '音画', key: 'ratingVisuals' as const },
                                            { label: '剧情', key: 'ratingStory' as const },
                                            { label: '主观', key: 'ratingSubjective' as const },
                                        ].map((item) => {
                                            const val = localRatings[item.key];
                                            const isSkipped = review?.skippedRatings?.includes(item.key);
                                            const canSkip = item.key !== 'ratingSubjective';

                                            return (
                                                <Group key={item.key} gap="xs" align="center">
                                                    <Text size="xs" w={45} c={isSkipped ? "dimmed" : undefined} td={isSkipped ? "line-through" : undefined}>
                                                        {item.label}
                                                    </Text>
                                                    <Slider
                                                        style={{ flex: 1, opacity: isSkipped ? 0.3 : 1 }}
                                                        size="xs"
                                                        color="yellow"
                                                        value={val}
                                                        min={0}
                                                        max={100}
                                                        label={null}
                                                        disabled={isSkipped}
                                                        onChange={(v) => {
                                                            setLocalRatings(prev => ({ ...prev, [item.key]: v }));
                                                        }}
                                                        onChangeEnd={(v) => {
                                                            const currentReview = reviews[game.appid] || {};
                                                            const updatedRatings = { ...localRatings, [item.key]: v };

                                                            // Helper to calc average
                                                            const skipped = currentReview.skippedRatings || [];
                                                            const allKeys = ['ratingGameplay', 'ratingVisuals', 'ratingStory', 'ratingSubjective'];
                                                            const active = allKeys.filter(k => !skipped.includes(k));
                                                            // @ts-ignore
                                                            const sum = active.reduce((acc, k) => acc + updatedRatings[k], 0);
                                                            const avg = active.length ? Math.round(sum / active.length) : 0;

                                                            addReview(game.appid, {
                                                                ...currentReview,
                                                                ...updatedRatings,
                                                                rating: avg,
                                                                status: currentReview.status || 'played',
                                                                isBeatable: currentReview.isBeatable ?? true,
                                                                excluded: currentReview.excluded ?? false,
                                                                noRating: currentReview.noRating ?? false
                                                            });
                                                        }}
                                                    />
                                                    <Text size="xs" w={28} ta="right" c={isSkipped ? "dimmed" : undefined}>
                                                        {isSkipped ? '-' : val}
                                                    </Text>

                                                    <ActionIcon
                                                        size="xs"
                                                        variant="subtle"
                                                        color="gray"
                                                        style={{ opacity: canSkip && !isSkipped ? 0.3 : (isSkipped ? 1 : 0), cursor: canSkip ? 'pointer' : 'default' }}
                                                        onClick={() => {
                                                            if (!canSkip) return;
                                                            const currentReview = reviews[game.appid] || {};
                                                            const currentSkipped = currentReview.skippedRatings || [];
                                                            const newSkipped = currentSkipped.includes(item.key)
                                                                ? currentSkipped.filter(k => k !== item.key)
                                                                : [...currentSkipped, item.key];

                                                            // Recalc average
                                                            const allKeys = ['ratingGameplay', 'ratingVisuals', 'ratingStory', 'ratingSubjective'];
                                                            const active = allKeys.filter(k => !newSkipped.includes(k));
                                                            // Use current local ratings for calc
                                                            // @ts-ignore
                                                            const sum = active.reduce((acc, k) => acc + localRatings[k], 0);
                                                            const avg = active.length ? Math.round(sum / active.length) : 0;

                                                            addReview(game.appid, {
                                                                ...currentReview,
                                                                ...localRatings,
                                                                skippedRatings: newSkipped,
                                                                rating: avg,
                                                                status: currentReview.status || 'played',
                                                                isBeatable: currentReview.isBeatable ?? true,
                                                                excluded: currentReview.excluded ?? false,
                                                                noRating: currentReview.noRating ?? false
                                                            });
                                                        }}
                                                    >
                                                        <IconEyeOff size={12} />
                                                    </ActionIcon>
                                                </Group>
                                            );
                                        })
                                    )}
                                </>
                            );
                        })()}
                    </Stack>



                    <Group justify="flex-end" gap="xs">
                        {/* Comment Trigger */}
                        <Tooltip label="写评价">
                            <ActionIcon variant={review?.comment ? 'filled' : 'light'} color="gray" onClick={open} size="sm">
                                <IconMessageDots size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {/* Exclude Trigger */}
                        <Tooltip label="从统计中排除">
                            <ActionIcon variant="light" color="red" onClick={() => handleUpdate({ excluded: true })} size="sm">
                                <IconEyeOff size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {/* Manual Game Actions */}
                        {(game as any).isManual && (
                            <>
                                <Tooltip label="编辑时长">
                                    <ActionIcon variant="light" color="blue" onClick={openEdit} size="sm">
                                        <IconPencil size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="删除游戏">
                                    <ActionIcon variant="light" color="red" onClick={handleDeleteManual} size="sm">
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </>
                        )}
                    </Group>
                </Stack>
            </Card >
            <ReviewModal opened={opened} onClose={close} game={game} />
            {(game as any).isManual && (
                <EditManualGameModal
                    opened={editOpened}
                    onClose={closeEdit}
                    game={game as any}
                />
            )}
        </>
    );
}
