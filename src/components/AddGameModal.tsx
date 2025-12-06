import { Modal, TextInput, NumberInput, Button, Stack, Group, Text, Image, Loader, ActionIcon, ScrollArea, Avatar, Center } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconPlus, IconClock } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { ManualGame, useReviewStore } from '@/store/useReviewStore';

interface AddGameModalProps {
    opened: boolean;
    onClose: () => void;
}

export function AddGameModal({ opened, onClose }: AddGameModalProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebouncedValue(query, 1000);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGame, setSelectedGame] = useState<any>(null);
    const [playtime, setPlaytime] = useState<number | string>(10); // Default 10 hours
    const { addManualGame } = useReviewStore();

    // Search Effect
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const fetchGames = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?term=${encodeURIComponent(debouncedQuery)}`);
                const data = await res.json();
                setResults(data.items || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [debouncedQuery]);

    const handleAdd = () => {
        if (!selectedGame) return;

        const manualGame: ManualGame = {
            appid: selectedGame.id,
            name: selectedGame.name,
            img_icon_url: '', // Search doesn't return icon, we use header
            playtime_forever: Number(playtime) * 60, // Convert hours to minutes
            rtime_last_played: Math.floor(Date.now() / 1000), // Now
            playtime_windows_forever: 0,
            playtime_mac_forever: 0,
            playtime_linux_forever: 0,
            isManual: true,
        };

        // Also manually construct header url if we want consistency?
        // Actually GameCard uses: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`
        // So we just need the valid appid.

        addManualGame(manualGame);
        onClose();
        setQuery('');
        setSelectedGame(null);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Add Game Manually" size="lg">
            <Stack>
                {!selectedGame ? (
                    <>
                        <TextInput
                            placeholder="Search game by name..."
                            leftSection={<IconSearch size={16} />}
                            value={query}
                            onChange={(e) => setQuery(e.currentTarget.value)}
                            data-autofocus
                        />

                        <div style={{ minHeight: 300, position: 'relative' }}>
                            {loading && <Loader pos="absolute" top={20} left="50%" style={{ transform: 'translateX(-50%)' }} />}

                            <ScrollArea h={300}>
                                <Stack gap="xs">
                                    {results.map((game) => (
                                        <Group
                                            key={game.id}
                                            p="xs"
                                            style={{ cursor: 'pointer', borderRadius: 4 }}
                                            bg="gray.0"
                                            className="hover:bg-gray-100" // Tailwind utility might not work without setup, rely on Mantine
                                            onClick={() => setSelectedGame(game)}
                                        >
                                            <Avatar src={game.tiny_image} radius="sm" />
                                            <Text size="sm" fw={500} style={{ flex: 1 }}>{game.name}</Text>
                                            <IconPlus size={16} color="gray" />
                                        </Group>
                                    ))}
                                    {!loading && results.length === 0 && query.length > 2 && (
                                        <Text c="dimmed" ta="center" mt="xl">No results found.</Text>
                                    )}
                                </Stack>
                            </ScrollArea>
                        </div>
                    </>
                ) : (
                    <>
                        <Group justify="space-between">
                            <Text fw={700} size="lg">{selectedGame.name}</Text>
                            <Button variant="subtle" color="gray" onClick={() => setSelectedGame(null)}>Change Game</Button>
                        </Group>

                        <Center py="md">
                            <Image
                                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.id}/header.jpg`}
                                radius="md"
                                w="100%"
                                fit="cover"
                                alt={selectedGame.name}
                            />
                        </Center>

                        <NumberInput
                            label="Total Playtime (Hours)"
                            description="Enter your estimated playtime in hours."
                            value={playtime}
                            onChange={setPlaytime}
                            min={0.1}
                            leftSection={<IconClock size={16} />}
                        />

                        <Button fullWidth onClick={handleAdd} size="md" mt="md">
                            Add to Library
                        </Button>
                    </>
                )}
            </Stack>
        </Modal>
    );
}
