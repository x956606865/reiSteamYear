import { Modal, Button, NumberInput, Stack, Group, Text } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useReviewStore, ManualGame } from '@/store/useReviewStore';
import { IconClock } from '@tabler/icons-react';

interface EditManualGameModalProps {
    opened: boolean;
    onClose: () => void;
    game: ManualGame;
}

export function EditManualGameModal({ opened, onClose, game }: EditManualGameModalProps) {
    const { updateManualGame } = useReviewStore();
    const [playtime, setPlaytime] = useState<number | string>(Math.round(game.playtime_forever / 60));

    useEffect(() => {
        if (opened) {
            setPlaytime(Math.round(game.playtime_forever / 60));
        }
    }, [opened, game]);

    const handleSave = () => {
        const minutes = Math.round(Number(playtime) * 60);
        updateManualGame({
            appid: game.appid,
            playtime_forever: minutes
        });
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`编辑游戏: ${game.name}`} centered>
            <Stack>
                <Text size="sm" c="dimmed">您只能编辑手动添加游戏的游玩时长。</Text>

                <NumberInput
                    label="总游玩时长 (小时)"
                    value={playtime}
                    onChange={setPlaytime}
                    min={0.1}
                    leftSection={<IconClock size={16} />}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>取消</Button>
                    <Button onClick={handleSave}>保存</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
