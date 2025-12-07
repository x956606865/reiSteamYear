import { Box, Title, Text, SimpleGrid, Card, Image, Group, Stack, Badge } from '@mantine/core';
import { ShareList } from '@/store/useShareStore';
import { forwardRef } from 'react';

interface ExportableShareListProps {
    list: ShareList;
}

export const ExportableShareList = forwardRef<HTMLDivElement, ExportableShareListProps>(({ list }, ref) => {
    return (
        <Box
            ref={ref}
            style={{
                width: 1200, // Fixed width for export
                backgroundColor: '#1A1B1E', // Dark background
                color: 'white',
                padding: 40,
                // font-family?
            }}
        >
            <Stack mb={40} align="center">
                <Title order={1} style={{ fontSize: 48, fontWeight: 900 }}>{list.title}</Title>
                <Text size="xl" c="dimmed">
                    共 {list.games.length} 款游戏推荐
                </Text>
            </Stack>

            <SimpleGrid cols={2} spacing="xl">
                {list.games.map((game, index) => (
                    <Card key={game.id} radius="md" padding="lg" style={{ backgroundColor: '#25262B', display: 'flex', flexDirection: 'row', gap: 20 }}>
                        <Image
                            src={`/api/image-proxy?url=${encodeURIComponent(game.coverUrl)}`}
                            w={180}
                            h={270} // 2:3 ratio approx for cover
                            radius="sm"
                            fit="cover"
                            alt={game.name}
                        />
                        <Stack style={{ flex: 1 }} justify="space-between">
                            <Box>
                                <Group justify="space-between" align="flex-start" mb="xs">
                                    <Title order={3} lineClamp={2} style={{ flex: 1 }}>{game.name}</Title>
                                    <Badge size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                                        {game.rating}
                                    </Badge>
                                </Group>
                            </Box>

                            <Box style={{ flex: 1 }}>
                                <Text size="sm" fw={700} c="dimmed" mb={4}>推荐理由：</Text>
                                <Text lineClamp={6} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {game.reason || '这位作者很懒，什么也没写...'}
                                </Text>
                            </Box>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>

            <Group justify="center" mt={60}>
                <Text c="dimmed" size="lg">Created with ReiSteamYear</Text>
            </Group>
        </Box>
    );
});

ExportableShareList.displayName = 'ExportableShareList';
