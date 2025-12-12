// ... imports
import { ActionIcon, Badge, Box, Button, Card, Divider, Group, Image, NumberInput, Paper, Progress, Rating, Slider, Stack, Text, Textarea, Tooltip, Grid } from '@mantine/core';
import { useShareStore, ShareGame } from '@/store/useShareStore';
import { IconTrash, IconExternalLink, IconEyeOff, IconShare, IconEdit } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { GameShareModal } from './GameShareModal';
import { AttributeManagerModal } from './AttributeManagerModal';
import { getAttributeColor, getAttributeLabel } from '@/lib/constants';

interface ShareGameCardProps {
    game: ShareGame;
    listId?: string; // Optional in read-only mode
    readOnly?: boolean;
    listType?: 'game' | 'manga';
}

export function ShareGameCard({ game, listId, readOnly = false, listType = 'game' }: ShareGameCardProps) {
    const { updateGame, removeGame } = useShareStore();
    const [shareOpened, setShareOpened] = useState(false);

    // Local state for reason text to avoid sluggish typing
    const [reason, setReason] = useState(game.reason || '');
    // Local state for playtime
    const [playtimeHours, setPlaytimeHours] = useState<number | string>(game.playtime ? Math.round(game.playtime / 60) : '');

    // Local state for tags
    const [localTags, setLocalTags] = useState(game.tags || {});

    // Local state for smooth sliding optimization
    const [localRatings, setLocalRatings] = useState({
        ratingGameplay: game.ratingGameplay ?? game.rating ?? 80,
        ratingVisuals: game.ratingVisuals ?? game.rating ?? 80,
        ratingStory: game.ratingStory ?? game.rating ?? 80,
        ratingSubjective: game.ratingSubjective ?? game.rating ?? 80,
        ratingCharacter: game.ratingCharacter ?? game.rating ?? 80,
    });

    // Ratings Configuration
    const ratingConfig = listType === 'manga' ? [
        { label: '画风', key: 'ratingVisuals' as const, color: 'pink' },
        { label: '剧情', key: 'ratingStory' as const, color: 'cyan' },
        { label: '人设', key: 'ratingCharacter' as const, color: 'grape' }, // Character Focus
        { label: '主观', key: 'ratingSubjective' as const, color: 'orange' },
    ] : [
        { label: '游戏性', key: 'ratingGameplay' as const, color: 'blue' },
        { label: '音画', key: 'ratingVisuals' as const, color: 'pink' },
        { label: '剧情', key: 'ratingStory' as const, color: 'cyan' },
        { label: '主观', key: 'ratingSubjective' as const, color: 'orange' },
    ];

    const [attributeModalOpen, setAttributeModalOpen] = useState(false);

    // Sync local state when external game changes
    useEffect(() => {
        setLocalRatings({
            ratingGameplay: game.ratingGameplay ?? game.rating ?? 80,
            ratingVisuals: game.ratingVisuals ?? game.rating ?? 80,
            ratingStory: game.ratingStory ?? game.rating ?? 80,
            ratingSubjective: game.ratingSubjective ?? game.rating ?? 80,
            ratingCharacter: game.ratingCharacter ?? game.rating ?? 80,
        });
        setLocalTags(game.tags || {});
    }, [game, listType]);

    // Sync reason only on blur to avoid too many writes
    const handleReasonBlur = () => {
        if (readOnly || !listId) return;
        if (reason !== game.reason) {
            updateGame(listId, { id: game.id, reason });
        }
    };

    const handlePlaytimeBlur = () => {
        if (readOnly || !listId) return;
        const val = typeof playtimeHours === 'number' ? playtimeHours : 0;
        const minutes = val > 0 ? val * 60 : undefined;
        if (minutes !== game.playtime) {
            updateGame(listId, { id: game.id, playtime: minutes });
        }
    };

    const handleDelete = () => {
        if (readOnly || !listId) return;
        if (confirm(`确定要从列表中移除 "${game.name}" 吗？`)) {
            removeGame(listId, game.id);
        }
    };

    const imageUrl = game.coverUrl || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;

    // Helper to calculate average and update store
    const handleRatingChangeEnd = (key: string, value: number) => {
        if (readOnly || !listId) return;

        const updatedRatings = { ...localRatings, [key]: value };

        const skipped = game.skippedRatings || [];
        const activeConfig = ratingConfig.filter(c => !skipped.includes(c.key));

        // @ts-ignore
        const sum = activeConfig.reduce((acc, c) => acc + updatedRatings[c.key], 0);
        const avg = activeConfig.length ? Math.round(sum / activeConfig.length) : 0;

        updateGame(listId, {
            id: game.id,
            ...updatedRatings,
            rating: avg
        });
    };

    const toggleSkip = (key: string) => {
        if (readOnly || !listId) return;
        if (key === 'ratingSubjective') return; // Subjective cannot be skipped (or logic choice)

        const currentSkipped = game.skippedRatings || [];
        const newSkipped = currentSkipped.includes(key)
            ? currentSkipped.filter(k => k !== key)
            : [...currentSkipped, key];

        // Recalc average
        const activeConfig = ratingConfig.filter(c => !newSkipped.includes(c.key));
        // Use current local ratings
        // @ts-ignore
        const sum = activeConfig.reduce((acc, c) => acc + localRatings[c.key], 0);
        const avg = activeConfig.length ? Math.round(sum / activeConfig.length) : 0;

        updateGame(listId, {
            id: game.id,
            skippedRatings: newSkipped,
            rating: avg
        });
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                <Image
                    src={imageUrl}
                    h={listType === 'manga' ? 240 : 120} // Taller for manga covers (usually vertical)
                    fit="cover" // Center/Cover
                    // objectPosition="top" // Usually faces are at top
                    alt={game.name}
                    fallbackSrc="https://placehold.co/600x400?text=No+Image"
                />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Text fw={600} lineClamp={1} title={game.name} style={{ flex: 1 }}>{game.name}</Text>
                <Group gap={4}>
                    <Tooltip label={listType === 'manga' ? "在 Bangumi 查看" : "在 Steam 查看"}>
                        <ActionIcon
                            component="a"
                            href={listType === 'manga' ? `https://bgm.tv/subject/${game.id}` : `https://store.steampowered.com/app/${game.id}`}
                            target="_blank"
                            variant="subtle"
                            color="gray"
                            size="sm"
                        >
                            <IconExternalLink size={16} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="分享单张卡片">
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => setShareOpened(true)}
                        >
                            <IconShare size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <GameShareModal
                opened={shareOpened}
                onClose={() => setShareOpened(false)}
                data={{
                    listType: listType,
                    game: {
                        id: game.id,
                        name: game.name,
                        coverUrl: imageUrl,
                        rating: game.rating,
                        reason: game.reason,
                        subRatings: {
                            gameplay: localRatings.ratingGameplay,
                            visuals: localRatings.ratingVisuals,
                            story: localRatings.ratingStory,
                            subjective: localRatings.ratingSubjective,
                            character: localRatings.ratingCharacter,
                        },
                        skippedRatings: game.skippedRatings,
                        playtime: game.playtime, // Pass minutes directly
                        tags: localTags,
                    },
                    listName: "安利详情"
                }}
            />

            <Stack gap="xs">
                <Group justify="space-between">
                    <Text size="sm" fw={700}>总分</Text>
                    <Text size="sm" fw={700} c="blue">{game.rating}</Text>
                </Group>

                {/* Multi-dimensional Sliders */}
                {ratingConfig.map((item) => {
                    const val = localRatings[item.key];
                    const isSkipped = game.skippedRatings?.includes(item.key);
                    const canSkip = item.key !== 'ratingSubjective';

                    return (
                        <Group key={item.key} gap="xs" align="center">
                            <Text size="xs" w={45} c={isSkipped ? "dimmed" : undefined} td={isSkipped ? "line-through" : undefined}>
                                {item.label}
                            </Text>

                            {readOnly ? (
                                <Progress
                                    value={isSkipped ? 0 : val}
                                    color={item.color}
                                    size="sm"
                                    radius="xl"
                                    style={{ flex: 1, opacity: isSkipped ? 0.3 : 1 }}
                                />
                            ) : (
                                <Slider
                                    style={{ flex: 1, opacity: isSkipped ? 0.3 : 1 }}
                                    size="xs"
                                    color={item.color}
                                    value={val}
                                    min={0}
                                    max={100}
                                    label={null}
                                    disabled={isSkipped}
                                    onChange={(v) => {
                                        setLocalRatings(prev => ({ ...prev, [item.key]: v }));
                                    }}
                                    onChangeEnd={(v) => handleRatingChangeEnd(item.key, v)}
                                />
                            )}

                            <Text size="xs" w={28} ta="right" c={isSkipped ? "dimmed" : undefined}>
                                {isSkipped ? '-' : val}
                            </Text>

                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                style={{ opacity: canSkip && !isSkipped && !readOnly ? 0.3 : (isSkipped ? 1 : 0), cursor: canSkip && !readOnly ? 'pointer' : 'default' }}
                                onClick={() => !readOnly && canSkip && toggleSkip(item.key)}
                                disabled={readOnly}
                            >
                                <IconEyeOff size={12} />
                            </ActionIcon>
                        </Group>
                    );
                })}

                {/* Manga Attributes (Dynamic) */}
                {listType === 'manga' && (
                    <>
                        <Divider label="属性标签" labelPosition="left" />
                        <Grid gutter="xs">
                            {Object.entries(game.tags).map(([key, value]) => (
                                <Grid.Col span={6} key={key}>
                                    <Group gap={8} align="center" wrap="nowrap">
                                        <Text size="sm" c="dimmed" w={48} lineClamp={1}>{getAttributeLabel(key)}</Text>
                                        <Progress
                                            value={value * 10}
                                            color={getAttributeColor(key)}
                                            size="sm"
                                            radius="xl"
                                            style={{ flex: 1 }}
                                        />
                                        <Text size="sm" w={28} ta="right" fw={700}>{value}</Text>
                                    </Group>
                                </Grid.Col>
                            ))}
                        </Grid>
                        <Button
                            variant="default"
                            size="xs"
                            radius="xl"
                            leftSection={<IconEdit size={12} />}
                            onClick={() => setAttributeModalOpen(true)}
                            disabled={readOnly}
                            mt="xs"
                        >
                            管理属性
                        </Button>
                        <AttributeManagerModal
                            opened={attributeModalOpen}
                            onClose={() => setAttributeModalOpen(false)}
                            currentTags={game.tags || {}}
                            onConfirm={(newTags) => {
                                if (listId) {
                                    updateGame(listId, { id: game.id, tags: newTags });
                                    setLocalTags(newTags);
                                }
                            }}
                        />
                    </>
                )}

                <Textarea
                    placeholder={readOnly ? "无评价" : "写下你的安利理由..."}
                    label="推荐理由"
                    description={!readOnly && `${reason.length}/300`}
                    maxLength={300}
                    autosize
                    minRows={3}
                    maxRows={6}
                    value={reason}
                    readOnly={readOnly}
                    variant={readOnly ? "filled" : "default"}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    onBlur={handleReasonBlur}
                    mt="xs"
                />

                {
                    listType === 'game' && (
                        <Group align="center" gap="xs">
                            <Text size="sm" fw={700}>游玩时长 (小时)</Text>
                            <NumberInput
                                placeholder="可选"
                                size="xs"
                                min={0}
                                allowNegative={false}
                                value={playtimeHours}
                                onChange={setPlaytimeHours}
                                onBlur={handlePlaytimeBlur}
                                readOnly={readOnly}
                                variant={readOnly ? "filled" : "default"}
                                style={{ width: 80 }}
                            />
                        </Group>
                    )
                }

                {
                    !readOnly && (
                        <Group justify="flex-end" mt="xs">
                            <Tooltip label="移除游戏">
                                <ActionIcon variant="light" color="red" onClick={handleDelete} size="sm">
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    )
                }
            </Stack>
        </Card >
    );
}
