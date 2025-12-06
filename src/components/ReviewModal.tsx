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
    const [comment, setComment] = useState<string>('');

    // Load existing comment when modal opens
    useEffect(() => {
        if (opened && reviews[game.appid]) {
            setComment(reviews[game.appid].comment || '');
        }
    }, [opened, reviews, game.appid]);

    const handleSave = () => {
        const currentReview = reviews[game.appid] || {
            rating: 0,
            status: 'played',
            comment: '',
            isBeatable: true
        };

        addReview(game.appid, {
            ...currentReview,
            comment,
        });
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`评价: ${game.name}`} centered>
            <Stack>
                <Textarea
                    label="写下您的感想"
                    placeholder="这款游戏带给您什么样的体验？..."
                    minRows={5}
                    autosize
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    data-autofocus
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>取消</Button>
                    <Button onClick={handleSave}>保存评价</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

import { Box } from '@mantine/core'; // Delayed import fix
