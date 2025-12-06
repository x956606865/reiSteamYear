"use client";

import { Group, Button, Title, Avatar, Menu, Text, Container, Box } from '@mantine/core';
import { useSession, signIn, signOut } from 'next-auth/react';
import { IconLogout, IconBrandSteam } from '@tabler/icons-react';

export function Header() {
    const { data: session } = useSession();

    return (
        <Box component="header" py="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Container size="xl">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconBrandSteam size={32} />
                        <Title order={3}>Steam Year</Title>
                    </Group>

                    {session ? (
                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Group gap="xs" style={{ cursor: 'pointer' }}>
                                    <Avatar src={session.user?.image} radius="xl" />
                                    <div style={{ flex: 1 }}>
                                        <Text size="sm" fw={500}>
                                            {session.user?.name}
                                        </Text>
                                    </div>
                                </Group>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Item
                                    leftSection={<IconLogout size={14} />}
                                    onClick={() => signOut()}
                                    color="red"
                                >
                                    Logout
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    ) : (
                        <Button
                            leftSection={<IconBrandSteam size={20} />}
                            onClick={() => signIn('steam')}
                        >
                            Sign in with Steam
                        </Button>
                    )}
                </Group>
            </Container>
        </Box>
    );
}
