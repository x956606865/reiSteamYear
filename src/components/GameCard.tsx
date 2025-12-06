import { Card, Image, Text, Group, Badge, Button, Stack, SegmentedControl, Rating, Center, ActionIcon, Tooltip, NumberInput, Slider } from '@mantine/core';
import type { SteamGame } from '@/lib/steam';
import { useDisclosure } from '@mantine/hooks';
import { ReviewModal } from './ReviewModal';
import { useReviewStore, GameReview } from '@/store/useReviewStore';
import { IconMessageDots, IconEyeOff } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface GameCardProps {
    game: SteamGame;
}

export function GameCard({ game }: GameCardProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const { reviews, addReview } = useReviewStore();
    const review = reviews[game.appid];

    // Local state for smooth sliding. 
    // Default to 80 if no rating, but only visually when we start interacting?
    // Actually if we initialize with 80, it might show 80.
    // We sync with review.rating.
    const [localRating, setLocalRating] = useState<number>(review?.rating ?? 80);

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

    // Helper to update review without overwriting other fields
    const handleUpdate = (updates: Partial<GameReview>) => {
        addReview(game.appid, {
            rating: review?.rating || 80, // Default to 80 on first creation
            status: review?.status || 'played',
            comment: review?.comment || '',
            excluded: review?.excluded || false,
            ...updates
        });
    };

    const handleSliderChange = (val: number) => {
        setLocalRating(val);
    };

    const handleSliderEnd = (val: number) => {
        handleUpdate({ rating: val });
    };

    return (
        <>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                    <Image
                        src={imageUrl}
                        height={160}
                        alt={game.name}
                        fallbackSrc="https://placehold.co/600x400?text=No+Image"
                    />
                </Card.Section>

                <Stack mt="md" gap="xs">
                    <Group justify="space-between" align="start" wrap="nowrap">
                        <Text fw={600} lineClamp={1} title={game.name}>{game.name}</Text>
                        <Badge color="blue" variant="light" size="sm" style={{ flexShrink: 0 }}>
                            {hoursPlayed} hrs
                        </Badge>
                    </Group>

                    <Stack gap={8}>
                        {/* Status Switcher */}
                        <SegmentedControl
                            fullWidth
                            size="xs"
                            value={review?.status || 'played'}
                            onChange={(val) => handleUpdate({ status: val as GameReview['status'] })}
                            data={[
                                { label: 'Played', value: 'played' },
                                { label: 'Beaten', value: 'beaten' },
                                { label: 'Dropped', value: 'dropped' },
                            ]}
                            color={review?.status === 'beaten' ? 'green' : review?.status === 'dropped' ? 'red' : 'blue'}
                        />

                        <Group justify="space-between" align="center" gap="xs">
                            <Slider
                                style={{ flex: 1 }}
                                size="sm"
                                // If localRating is 0 (and unreviewed), maybe we still show 0? 
                                // But user wants default 80.
                                // If we set value={localRating || 80}, it shows 80 for everything.
                                // Let's rely on the interaction:
                                // If I drag, it starts from where I clicked.
                                // If I want 80 as default base, maybe we just use 0 visually until rated?
                                value={localRating}
                                onChange={handleSliderChange}
                                onChangeEnd={handleSliderEnd}
                                min={0}
                                max={100}
                                color="yellow"
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

                            {/* Comment Trigger */}
                            <Tooltip label="Edit Comment">
                                <ActionIcon variant={review?.comment ? 'filled' : 'light'} color="gray" onClick={open}>
                                    <IconMessageDots size={18} />
                                </ActionIcon>
                            </Tooltip>

                            {/* Exclude Trigger */}
                            <Tooltip label="Exclude from Summary">
                                <ActionIcon variant="light" color="red" onClick={() => handleUpdate({ excluded: true })}>
                                    <IconEyeOff size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Stack>
                </Stack>
            </Card>
            <ReviewModal opened={opened} onClose={close} game={game} />
        </>
    );
}
