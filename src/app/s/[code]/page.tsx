import { redis } from '@/lib/redis';
import { redirect } from 'next/navigation';
import { Container, Title, Text, Button, Stack } from '@mantine/core';
import Link from 'next/link';

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    let data: string | null = null;

    try {
        data = await redis.get(`share:${code}`);
    } catch (error) {
        console.error('Redis error:', error);
    }

    if (data) {
        redirect(`/share/view?data=${data}`);
    }

    // If we are here, data was not found or error occurred
    return (
        <Container size="sm" py={100}>
            <Stack align="center" gap="md">
                <Title order={1}>链接已过期或不存在</Title>
                <Text c="dimmed" ta="center">
                    该分享链接可能已超过有效期（30天），或者链接地址有误。
                </Text>
                <Link href="/">
                    <Button variant="light">返回首页</Button>
                </Link>
            </Stack>
        </Container>
    );
}
