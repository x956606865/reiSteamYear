'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import LZString from 'lz-string';
import { ShareList, useShareStore } from '@/store/useShareStore';
import { decodeShareList } from '@/utils/shareData';
import { Container, Title, Text, Stack, Button, Group, Grid, Alert, Loader, Card } from '@mantine/core';
import { ShareGameCard } from '@/components/ShareGameCard';
import { IconDeviceFloppy, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

function ShareViewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dataParam = searchParams.get('data');
    const [list, setList] = useState<ShareList | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { importList } = useShareStore();

    useEffect(() => {
        if (!dataParam) {
            setError('链接无效：缺少数据');
            return;
        }

        const parsedList = decodeShareList(dataParam);
        if (!parsedList || !parsedList.title || !Array.isArray(parsedList.games)) {
            setError('链接无效或数据格式错误');
            return;
        }
        setList(parsedList);
    }, [dataParam]);

    const handleImport = () => {
        if (!list) return;
        try {
            importList(list);
            alert('导入成功！已保存到你的列表。');
            router.push('/share');
        } catch (e) {
            alert('导入失败');
        }
    };

    if (error) {
        return (
            <Container size="sm" mt="xl">
                <Alert color="red" icon={<IconAlertCircle />}>
                    {error}
                </Alert>
                <Button mt="md" onClick={() => router.push('/share')}>返回</Button>
            </Container>
        );
    }

    if (!list) {
        return <Loader />;
    }

    return (
        <Container size="xl" py="xl">
            <Group mb="lg" justify="space-between">
                <Group>
                    <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/share')}>
                        返回
                    </Button>
                    <Stack gap={0}>
                        <Title order={2}>{list.title}</Title>
                        <Text size="sm" c="dimmed">来自朋友的安利 • {list.games.length} 个游戏</Text>
                    </Stack>
                </Group>

                <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={handleImport}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan' }}
                >
                    保存到我的列表
                </Button>
            </Group>

            <Grid>
                {list.games.sort((a, b) => b.rating - a.rating).map((game) => (
                    <Grid.Col key={game.id} span={{ base: 12, md: 6, lg: 4, xl: 3 }}>
                        <ShareGameCard game={game} readOnly listType={list.type} />
                    </Grid.Col>
                ))}
            </Grid>
        </Container>
    );
}

export default function ShareViewPage() {
    return (
        <Suspense fallback={<Loader />}>
            <ShareViewContent />
        </Suspense>
    );
}
