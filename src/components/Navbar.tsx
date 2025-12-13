'use client';

import { Group, Box, Title, UnstyledButton, Text, Container } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import classes from './Navbar.module.css';

const links = [
    { link: '/', label: '年度总结' },
    { link: '/share', label: '安利列表' },
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Hide navbar on share domain
        if (typeof window !== 'undefined' && window.location.hostname === 'share.moukeer.com') {
            setVisible(false);
        }
    }, []);

    if (!visible) return null;

    const items = links.map((link) => (
        <UnstyledButton
            key={link.label}
            className={classes.link}
            data-active={pathname === link.link || (link.link !== '/' && pathname.startsWith(link.link)) || undefined}
            onClick={(event) => {
                event.preventDefault();
                router.push(link.link);
            }}
        >
            {link.label}
        </UnstyledButton>
    ));

    return (
        <Box className={classes.header} mb={20}>
            <Container size="md" className={classes.inner}>
                <Group gap={5} visibleFrom="xs">
                    {items}
                </Group>
            </Container>
        </Box>
    );
}
