import { Card, Image, Text, Group, Badge, Button, Stack, SegmentedControl, Rating, Center, ActionIcon, Tooltip } from '@mantine/core';
import type { SteamGame } from '@/lib/steam';
import { useDisclosure } from '@mantine/hooks';
import { ReviewModal } from './ReviewModal';
import { useReviewStore, GameReview } from '@/store/useReviewStore';
import { IconMessageDots } from '@tabler/icons-react';

interface GameCardProps {
    game: SteamGame;
}

export function GameCard({ game }: GameCardProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const { reviews, addReview } = useReviewStore();
    const review = reviews[game.appid];

    // Steam image URL format
    // appid needs to be used to construct URL if img_icon_url is icon
    // Header image: https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg
    // Library hero: https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/library_600x900.jpg

    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
    const hoursPlayed = Math.round(game.playtime_forever / 60);

    // Helper to update review without overwriting other fields
    const handleUpdate = (updates: Partial<GameReview>) => {
        addReview(game.appid, {
            rating: review?.rating || 0,
            status: review?.status || 'played',
            comment: review?.comment || '',
            ...updates
        });
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

                        <Group justify="space-between" align="center">
                            {/* Direct Rating */}
                            <Rating
                                value={review?.rating || 0}
                                onChange={(val) => handleUpdate({ rating: val })}
                                fractions={1}
                            />

                            {/* Comment Trigger */}
                            <Tooltip label="Edit Comment">
                                <ActionIcon variant={review?.comment ? 'filled' : 'light'} color="gray" onClick={open}>
                                    <IconMessageDots size={18} />
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
