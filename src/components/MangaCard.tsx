import { Card, Image, Text, Group, Badge, Stack, SegmentedControl, ActionIcon, Tooltip, Slider, Switch } from '@mantine/core';
import { useReviewStore, ManualGame, GameReview } from '@/store/useReviewStore';
import { IconTrash } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
// Might need adaptation or standard review modal is fine if types align? 
// Actually ReviewModal expects SteamGame/GameReview. Might need a generic one or just a simple comment modal here.
// For now, I'll inline a simple comment edit or reuse if I can refactor.
// Let's assume unique modal for simpilicity or I'll just skip comment modal for now and focus on ratings.
// Wait, prompt says "add comments" implicitly via "ReviewModal" usage in GameCard? 
// No, prompt doesn't explicitly mention comments for Manga but Store has `comment`.
// I'll add a simple comment modal logic later or adapts.

export function MangaCard({ item }: { item: ManualGame }) {
    const { reviews, addReview, updateManualGame, removeManualGame } = useReviewStore();
    const review = reviews[item.appid] || {};

    // Local state for smooth sliding
    // Initialize from review data
    const [ratings, setRatings] = useState({
        art: review.ratingVisuals || 0,
        story: review.ratingStory || 0,
        character: review.ratingCharacter || 0,
        subjective: review.ratingSubjective || 0,
    });
    const [tags, setTags] = useState<Record<string, number>>(review.tags || {});

    // Sync when review changes (optional, but good for consistency)
    useEffect(() => {
        setRatings({
            art: review.ratingVisuals || 0,
            story: review.ratingStory || 0,
            character: review.ratingCharacter || 0,
            subjective: review.ratingSubjective || 0,
        });
        setTags(review.tags || {});
    }, [review.ratingVisuals, review.ratingStory, review.ratingCharacter, review.ratingSubjective, review.tags]);

    // Calculate Average
    const validRatings = Object.entries(ratings).map(([_, v]) => v).filter(v => v > 0);
    const averageScore = validRatings.length > 0
        ? Math.round(validRatings.reduce((a, b) => a + b, 0) / validRatings.length * 10) // 0-100 scale? GameReview rating is usually 0-100?
        // Wait, Slider is 0-10. GameReview.rating is 0-100 usually?
        // In GameCard: const total = ... / count.
        // Let's assume we store 0-100 int in review.rating, but usage here is 0-10 float.
        // So average * 10.
        : 0;

    const handleUpdateReview = (updates: Partial<GameReview>) => {
        // We need to merge with existing review
        addReview(item.appid, {
            ...review,
            // Ensure mandatory fields if new
            status: review.status || 'reading',
            rating: review.rating || 0,
            ...updates
        });
    };

    // When sliders change end/commit
    const commitRatings = (newRatings: typeof ratings) => {
        // Calculate new average
        const vals = Object.values(newRatings).filter(v => v > 0);
        const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) : 0;

        handleUpdateReview({
            rating: avg,
            ratingVisuals: newRatings.art,
            ratingStory: newRatings.story,
            ratingCharacter: newRatings.character,
            ratingSubjective: newRatings.subjective,
        });
    }

    const handleDelete = () => {
        if (confirm(`确定要删除 "${item.name}" 吗？`)) {
            removeManualGame(item.appid);
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
                    src={item.coverUrl || item.img_icon_url}
                    h={180} // Manga covers are usually portrait, taller
                    fit="contain" // Or cover with top alignment? 
                    // Bangumi small/medium covers are portrait.
                    alt={item.name}
                    style={{ backgroundColor: '#f0f0f0' }}
                />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Text fw={600} lineClamp={1} title={item.name} style={{ flex: 1 }}>{item.name}</Text>
                {review.status === 'completed' && <Badge color="green" variant="light">已看完</Badge>}
                {review.status === 'dropped' && <Badge color="red" variant="light">已弃坑</Badge>}
            </Group>

            <Stack gap="xs">
                {/* Status Control */}
                <SegmentedControl
                    size="xs"
                    fullWidth
                    value={review.status || 'reading'}
                    onChange={(val) => handleUpdateReview({ status: val as any })}
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
                                    const newRatings = { ...ratings, [conf.key]: v };
                                    commitRatings(newRatings);
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
                                            handleUpdateReview({ tags: newTags });
                                        } else {
                                            const { [conf.key]: _, ...rest } = tags;
                                            setTags(rest);
                                            handleUpdateReview({ tags: rest });
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
                                            const newTags = { ...tags, [conf.key]: v };
                                            handleUpdateReview({ tags: newTags });
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
