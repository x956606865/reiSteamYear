import { Card, Image, Text, Group, Badge, Stack, SegmentedControl, ActionIcon, Tooltip, Slider, Switch } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useReviewStore, MangaItem } from '@/store/useReviewStore';
import { IconMessageDots, IconTrash } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { ReviewModal } from './ReviewModal'; // Might need adaptation or standard review modal is fine if types align? 
// Actually ReviewModal expects SteamGame/GameReview. Might need a generic one or just a simple comment modal here.
// For now, I'll inline a simple comment edit or reuse if I can refactor.
// Let's assume unique modal for simpilicity or I'll just skip comment modal for now and focus on ratings.
// Wait, prompt says "add comments" implicitly via "ReviewModal" usage in GameCard? 
// No, prompt doesn't explicitly mention comments for Manga but Store has `comment`.
// I'll add a simple comment modal logic later or adapts.

export function MangaCard({ item }: { item: MangaItem }) {
    const { updateMangaItem, removeMangaItem } = useReviewStore();

    // Local state for smooth sliding
    const [ratings, setRatings] = useState(item.rating);
    const [tags, setTags] = useState(item.tags || {});

    // Sync on external change
    useEffect(() => {
        setRatings(item.rating);
        setTags(item.tags || {});
    }, [item]);

    const handleUpdate = (updates: Partial<MangaItem>) => {
        updateMangaItem({ id: item.id, ...updates });
    };

    const handleDelete = () => {
        if (confirm(`确定要删除 "${item.title}" 吗？`)) {
            removeMangaItem(item.id);
        }
    };

    const ratingConfig = [
        { label: '画风', key: 'art' as const },
        { label: '剧情', key: 'story' as const },
        { label: '人设', key: 'character' as const },
        { label: '主观', key: 'subjective' as const },
    ];

    const tagConfig = [
        { label: '百合浓度', key: 'yuri' as const, color: 'pink' },
        { label: '糖度', key: 'sweetness' as const, color: 'orange' },
        { label: '刀度', key: 'angst' as const, color: 'blue' },
    ];

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                <Image
                    src={item.cover}
                    h={180} // Manga covers are usually portrait, taller
                    fit="contain" // Or cover with top alignment? 
                    // Bangumi small/medium covers are portrait.
                    alt={item.title}
                    style={{ backgroundColor: '#f0f0f0' }}
                />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Text fw={600} lineClamp={1} title={item.title} style={{ flex: 1 }}>{item.title}</Text>
                {item.reviewStatus === 'completed' && <Badge color="green" variant="light">已看完</Badge>}
                {item.reviewStatus === 'dropped' && <Badge color="red" variant="light">已弃坑</Badge>}
            </Group>

            <Stack gap="xs">
                {/* Status Control */}
                <SegmentedControl
                    size="xs"
                    fullWidth
                    value={item.reviewStatus}
                    onChange={(val) => handleUpdate({ reviewStatus: val as any })}
                    data={[
                        { label: '在看', value: 'reading' },
                        { label: '看完', value: 'completed' },
                        { label: '弃坑', value: 'dropped' },
                    ]}
                />

                {/* Ratings */}
                <Stack gap={4} mt="xs">
                    {ratingConfig.map((conf) => (
                        <Group key={conf.key} gap="xs" align="center">
                            <Text size="xs" w={30}>{conf.label}</Text>
                            <Slider
                                style={{ flex: 1 }}
                                size="xs"
                                color="yellow"
                                value={ratings[conf.key]}
                                min={0}
                                max={10} // Prompt implies "score bar", usually 1-10 for manga/anime
                                step={0.5}
                                label={(val) => val.toFixed(1)}
                                onChange={(v) => setRatings(prev => ({ ...prev, [conf.key]: v }))}
                                onChangeEnd={(v) => {
                                    handleUpdate({ rating: { ...ratings, [conf.key]: v } });
                                }}
                            />
                            <Text size="xs" w={24} ta="right">{ratings[conf.key]}</Text>
                        </Group>
                    ))}
                </Stack>

                {/* Optional Tags */}
                <Stack gap={4} mt="xs">
                    <Text size="xs" c="dimmed">附加指标 (可选)</Text>
                    {tagConfig.map((conf) => {
                        const active = tags[conf.key] !== undefined;
                        return (
                            <Group key={conf.key} gap="xs">
                                <Switch
                                    size="xs"
                                    checked={active}
                                    color={conf.color}
                                    label={conf.label}
                                    onChange={(e) => {
                                        if (e.currentTarget.checked) {
                                            const newTags = { ...tags, [conf.key]: 5 }; // Default 5
                                            setTags(newTags);
                                            handleUpdate({ tags: newTags });
                                        } else {
                                            const { [conf.key]: _, ...rest } = tags;
                                            setTags(rest);
                                            handleUpdate({ tags: rest });
                                        }
                                    }}
                                />
                                {active && (
                                    <Slider
                                        style={{ flex: 1 }}
                                        size="xs"
                                        color={conf.color}
                                        value={tags[conf.key]}
                                        min={0}
                                        max={10}
                                        step={1}
                                        onChange={(v) => setTags(prev => ({ ...prev, [conf.key]: v }))}
                                        onChangeEnd={(v) => {
                                            handleUpdate({ tags: { ...tags, [conf.key]: v } });
                                        }}
                                    />
                                )}
                            </Group>
                        );
                    })}
                </Stack>

                <Group justify="flex-end" mt="md">
                    <Tooltip label="删除">
                        <ActionIcon variant="light" color="red" onClick={handleDelete} size="sm">
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Stack>
        </Card>
    );
}
