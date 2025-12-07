'use client';

import { Title, Group, Button, Grid, Text, ActionIcon, Modal, TextInput, Stack, LoadingOverlay } from '@mantine/core';
import { useShareStore, ShareGame } from '@/store/useShareStore';
import { ShareGameCard } from '@/components/ShareGameCard';
import { ExportableShareList } from '@/components/ExportableShareList';
import { IconPlus, IconDownload, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { useState, useRef, use } from 'react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

// Reusing ManualGameSearch component logic would be ideal, but for now implementing a simpler search modal here or extracting if time permits.
// Let's create a simple search function here for M4.

export default function ShareListDetail({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params
    const { id } = use(params);
    const router = useRouter();
    const { lists, addGame } = useShareStore();
    const list = lists.find((l) => l.id === id);

    const [searchOpened, { open: openSearch, close: closeSearch }] = useDisclosure(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [exporting, setExporting] = useState(false);

    const exportRef = useRef<HTMLDivElement>(null);

    if (!list) {
        return (
            <Stack align="center" mt="xl">
                <Text>找不到该列表</Text>
                <Button onClick={() => router.push('/share')}>返回列表</Button>
            </Stack>
        );
    }

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/search?term=${encodeURIComponent(searchTerm)}`);
            const data = await res.json();
            if (data.items) {
                setSearchResults(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddGame = (item: any) => {
        const newGame: ShareGame = {
            id: item.id,
            name: item.name,
            coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/header.jpg`,
            rating: 80, // Default
            reason: ''
        };
        addGame(id, newGame);
        closeSearch();
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleExport = async () => {
        if (!exportRef.current) return;
        setExporting(true);
        try {
            // Unhide temporarily if strictly needed, but here we can render it off-screen or in a hidden div
            // Actually, best practice is to render it visible but absolute positioned off-screen, or z-index behind.
            // For simplicity in this iteration, we use a hidden visible container trick if needed,
            // but the ref is on a component we will put in the DOM but hidden styling.

            // Wait for images to load? The proxy should help.
            const dataUrl = await toPng(exportRef.current, {
                pixelRatio: 2,
                backgroundColor: '#1A1B1E'
            });
            download(dataUrl, `${list.title}-share.png`);
        } catch (err) {
            console.error('Export failed', err);
            alert('导出图片失败，请重试');
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Group mb="lg">
                <ActionIcon variant="subtle" onClick={() => router.push('/share')}>
                    <IconArrowLeft />
                </ActionIcon>
                <Stack gap={0}>
                    <Title order={2}>{list.title}</Title>
                    <Text size="sm" c="dimmed">共 {list.games.length} 个游戏</Text>
                </Stack>
                <Group ml="auto">
                    <Button leftSection={<IconPlus size={16} />} onClick={openSearch}>
                        添加游戏
                    </Button>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={handleExport}
                        variant="light"
                        loading={exporting}
                        disabled={list.games.length === 0}
                    >
                        导出分享图
                    </Button>
                </Group>
            </Group>

            {list.games.length === 0 ? (
                <Text c="dimmed" ta="center" py={50}>
                    列表为空，点击上方“添加游戏”开始安利！
                </Text>
            ) : (
                <Grid>
                    {list.games.map((game) => (
                        <Grid.Col key={game.id} span={{ base: 12, md: 6, lg: 4, xl: 3 }}>
                            <ShareGameCard listId={list.id} game={game} />
                        </Grid.Col>
                    ))}
                </Grid>
            )}

            {/* Hidden Export Component - Rendered behind content but visible to DOM for capturing */}
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1000, opacity: 0 }}>
                <ExportableShareList ref={exportRef} list={list} />
            </div>

            {/* Search Modal */}
            <Modal opened={searchOpened} onClose={closeSearch} title="搜索 Steam 游戏" size="lg">
                <Group mb="md">
                    <TextInput
                        placeholder="输入游戏名称..."
                        style={{ flex: 1 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} loading={searching} leftSection={<IconSearch size={16} />}>
                        搜索
                    </Button>
                </Group>

                <Stack mah={400} style={{ overflowY: 'auto' }}>
                    {searchResults.map((item) => (
                        <Group key={item.id} p="xs" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
                            <img src={item.tiny_image} alt={item.name} height={32} />
                            <Text size="sm" style={{ flex: 1 }}>{item.name}</Text>
                            <Button size="xs" variant="light" onClick={() => handleAddGame(item)}>添加</Button>
                        </Group>
                    ))}
                    {searchResults.length === 0 && !searching && searchTerm && (
                        <Text ta="center" c="dimmed" size="sm">未找到结果</Text>
                    )}
                </Stack>
            </Modal>
        </>
    );
}
