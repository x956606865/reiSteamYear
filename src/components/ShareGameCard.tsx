import { Card, Image, Text, Group, Badge, Stack, Rating, ActionIcon, Tooltip, Slider, Textarea, Button } from '@mantine/core';
import { useShareStore, ShareGame } from '@/store/useShareStore';
import { IconTrash, IconExternalLink } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface ShareGameCardProps {
    listId: string;
    game: ShareGame;
}

export function ShareGameCard({ listId, game }: ShareGameCardProps) {
    const { updateGame, removeGame } = useShareStore();

    // Local state for reason text to avoid sluggish typing
    const [reason, setReason] = useState(game.reason || '');

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
                    <Text size="sm" fw={700}>评分</Text>
                    <Text size="sm" fw={700} c="blue">{game.rating}</Text>
                </Group>

                <Slider
                    color="blue"
                    value={game.rating}
                    min={0}
                    max={100}
                    label={(val) => val}
                    onChangeEnd={(val) => updateGame(listId, { id: game.id, rating: val })}
                    mb="xs"
                />

                <Textarea
                    placeholder="写下你的安利理由..."
                    label="推荐理由"
                    autosize
                    minRows={3}
                    maxRows={6}
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    onBlur={handleReasonBlur}
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
