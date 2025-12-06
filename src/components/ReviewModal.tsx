import { Modal, Button, Slider, Textarea, Select, Stack, Text, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useReviewStore, GameReview } from '@/store/useReviewStore';
import type { SteamGame } from '@/lib/steam';

interface ReviewModalProps {
    opened: boolean;
    onClose: () => void;
    game: SteamGame;
}

export function ReviewModal({ opened, onClose, game }: ReviewModalProps) {
    const { addReview, reviews } = useReviewStore();

    const [rating, setRating] = useState<number>(5);
    const [status, setStatus] = useState<string>('played');
    const [comment, setComment] = useState<string>('');

    useEffect(() => {
        if (opened && reviews[game.appid]) {
            const r = reviews[game.appid];
            setRating(r.rating);
            setStatus(r.status);
            setComment(r.comment);
        }
    }, [opened, reviews, game.appid]);

    const handleSave = () => {
        addReview(game.appid, {
            rating,
            status: status as GameReview['status'],
            comment,
        });
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`Review: ${game.name}`} centered>
            <Stack>
                <Box>
                    <Text fw={500} mb="xs">Rating ({rating}/10)</Text>
                    <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={rating}
                        onChange={setRating}
                        marks={[{ value: 1, label: '1' }, { value: 5, label: '5' }, { value: 10, label: '10' }]}
                    />
                </Box>

                <Select
                    label="Status"
                    data={[
                        { value: 'played', label: 'Played' },
                        { value: 'beaten', label: 'Beaten' },
                        { value: 'dropped', label: 'Dropped' },
                    ]}
                    value={status}
                    onChange={(val) => setStatus(val || 'played')}
                />

                <Textarea
                    label="Comment"
                    placeholder="Thoughts on the game..."
                    minRows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

import { Box } from '@mantine/core'; // Delayed import fix
