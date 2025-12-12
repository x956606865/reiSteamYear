import { Modal, Tabs, Button, Group, Badge, SimpleGrid, Paper, Text, Stack, ActionIcon, NumberInput, Divider, TextInput, Box, Slider } from '@mantine/core';
import { IconX, IconPlus, IconCheck } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { PREDEFINED_ATTRIBUTES, getAttributeColor, getAttributeLabel } from '@/lib/constants';

interface AttributeManagerModalProps {
    opened: boolean;
    onClose: () => void;
    currentTags: Record<string, number>;
    onConfirm: (tags: Record<string, number>) => void;
}

export function AttributeManagerModal({ opened, onClose, currentTags, onConfirm }: AttributeManagerModalProps) {
    const [tags, setTags] = useState<Record<string, number>>(currentTags || {});
    const [customTagName, setCustomTagName] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('情感');

    useEffect(() => {
        setTags(currentTags || {});
    }, [currentTags, opened]);

    const handleAddTag = (key: string, defaultScore = 5) => {
        if (Object.keys(tags).length >= 4) {
            // Shake animation or toast could be added here
            return;
        }
        setTags(prev => ({ ...prev, [key]: defaultScore }));
    };

    const handleRemoveTag = (key: string) => {
        const newTags = { ...tags };
        delete newTags[key];
        setTags(newTags);
    };

    const handleScoreChange = (key: string, val: number | string) => {
        const score = typeof val === 'number' ? val : parseFloat(val);
        if (!isNaN(score)) {
            setTags(prev => ({ ...prev, [key]: score }));
        }
    };

    const handleAddCustomTag = () => {
        if (!customTagName.trim()) return;
        if (tags[customTagName.trim()]) return;
        handleAddTag(customTagName.trim());
        setCustomTagName('');
    };

    const handleSave = () => {
        onConfirm(tags);
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="管理属性标签 (最多4个)" size="lg" centered>
            <Stack>
                {/* Active Tags Area */}
                <Paper p="md" withBorder bg="dark.8">
                    <Text size="sm" c="dimmed" mb="xs">已选属性 ({Object.keys(tags).length}/4)</Text>
                    {Object.keys(tags).length === 0 ? (
                        <Text size="sm" c="dimmed" fs="italic">暂无属性，请从下方选择或添加</Text>
                    ) : (
                        <Stack gap="md">
                            {Object.entries(tags).map(([key, score]) => (
                                <Box key={key} bg="dark.6" p="sm" px="md" style={{ borderRadius: 8 }}>
                                    <Group justify="space-between" mb={4}>
                                        <Group gap="xs">
                                            <Badge color={getAttributeColor(key)} variant="filled" size="sm">
                                                {getAttributeLabel(key)}
                                            </Badge>
                                        </Group>
                                        <Group gap="xs">
                                            <Text size="sm" fw={700} c={getAttributeColor(key)}>{score}</Text>
                                            <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleRemoveTag(key)}>
                                                <IconX size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                    <Slider
                                        value={score}
                                        onChange={(val) => handleScoreChange(key, val)}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        label={null}
                                        color={getAttributeColor(key)}
                                        size="sm"
                                    />
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Paper>

                <Divider my="xs" />

                {/* Selection Area */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        {Object.keys(PREDEFINED_ATTRIBUTES).map(category => (
                            <Tabs.Tab key={category} value={category}>{category}</Tabs.Tab>
                        ))}
                        <Tabs.Tab value="custom">自定义</Tabs.Tab>
                    </Tabs.List>

                    <Box mt="md" style={{ minHeight: 200 }}>
                        {Object.entries(PREDEFINED_ATTRIBUTES).map(([category, items]) => (
                            <Tabs.Panel key={category} value={category}>
                                <SimpleGrid cols={3} spacing="xs">
                                    {items.map(item => {
                                        const isSelected = !!tags[item.value];
                                        return (
                                            <Button
                                                key={item.value}
                                                variant={isSelected ? "light" : "default"}
                                                color={item.color.split('.')[0]}
                                                leftSection={isSelected ? <IconCheck size={14} /> : <IconPlus size={14} />}
                                                onClick={() => isSelected ? handleRemoveTag(item.value) : handleAddTag(item.value)}
                                                disabled={!isSelected && Object.keys(tags).length >= 4}
                                                justify="start"
                                                styles={{ label: { textOverflow: 'ellipsis', overflow: 'hidden' } }}
                                            >
                                                {item.label}
                                            </Button>
                                        );
                                    })}
                                </SimpleGrid>
                            </Tabs.Panel>
                        ))}

                        <Tabs.Panel value="custom">
                            <Group align="flex-end">
                                <TextInput
                                    label="自定义属性名"
                                    placeholder="输入例如：纯爱、NTR..."
                                    value={customTagName}
                                    onChange={(e) => setCustomTagName(e.currentTarget.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    onClick={handleAddCustomTag}
                                    disabled={!customTagName.trim() || Object.keys(tags).length >= 4}
                                >
                                    添加
                                </Button>
                            </Group>
                            <Text size="xs" c="dimmed" mt="xs">自定义属性颜色将随机生成。</Text>
                        </Tabs.Panel>
                    </Box>
                </Tabs>

                <Button fullWidth mt="md" onClick={handleSave}>
                    保存更改
                </Button>
            </Stack>
        </Modal>
    );
}
