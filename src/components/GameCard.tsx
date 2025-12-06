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
    const [localRating, setLocalRating] = useState<number>(review?.rating ?? 80);
    const [isBeatable, setIsBeatable] = useState<boolean>(review?.isBeatable ?? true);

    // Sync local state when external review changes (e.g. from modal)
    useEffect(() => {
        if (review?.rating !== undefined) {
            setLocalRating(review.rating);
        }
    }, [review?.rating]);

    // Steam image URL format
    // appid needs to be used to construct URL if img_icon_url is icon
    // Header image: https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg
    // Library hero: https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/library_600x900.jpg

    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
    const hoursPlayed = Math.round(game.playtime_forever / 60);
    const isExcluded = review?.excluded || false;

    // Helper to update review without overwriting other fields
    const handleUpdate = (updates: Partial<GameReview>) => {
        addReview(game.appid, {
            rating: localRating,
            status: 'played',
            comment: '',
            isBeatable: true,
            excluded: false, // Default to not excluded
            ...review, // Apply existing review properties
            ...updates // Apply specific updates
        });
    };

    const handleSliderChange = (val: number) => {
        setLocalRating(val);
    };

    const handleSliderEnd = (val: number) => {
        handleUpdate({ rating: val });
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

                    <Group gap="xs" align="flex-end">
                        <Slider
                            style={{ flex: 1 }}
                            size="sm"
                            value={localRating}
                            onChange={handleSliderChange}
                            onChangeEnd={handleSliderEnd}
                            min={0}
                            max={100}
                            color="yellow"
                            mb={4}
                        />

                        <NumberInput
                            value={localRating}
                            onChange={(val) => {
                                const num = Number(val);
                                setLocalRating(num);
                                handleUpdate({ rating: num });
                            }}
                            min={0}
                            max={100}
                            allowNegative={false}
                            clampBehavior="strict"
                            size="xs"
                            w={50}
                            hideControls
                            styles={{ input: { textAlign: 'center', padding: 0 } }}
                        />
                    </Group>

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
