'use client';

import { Title, Group, Button, Grid, Card, Text, ActionIcon, Menu, Modal, TextInput } from '@mantine/core';
import { useShareStore } from '@/store/useShareStore';
import { IconPlus, IconDots, IconTrash, IconPencil } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';

export default function ShareDictionary() {
    const { lists, createList, deleteList, updateListTitle } = useShareStore();
    const router = useRouter();

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [editingList, setEditingList] = useState<{ id: string, title: string } | null>(null);

    const handleCreate = () => {
        if (!newListTitle.trim()) return;
        createList(newListTitle);
        setNewListTitle('');
        closeCreate();
    };

    const handleEdit = () => {
        if (!editingList || !editingList.title.trim()) return;
        updateListTitle(editingList.id, editingList.title);
        setEditingList(null);
        closeEdit();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('确定要删除这个安利列表吗？')) {
            deleteList(id);
        }
    };

    const openEditModal = (id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingList({ id, title });
        openEdit();
    };

    return (
        <>
            <Group justify="space-between" mb="xl">
                <Title order={2}>我的安利列表</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    新建列表
                </Button>
            </Group>

            {lists.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                    还没有创建任何列表，点击右上方按钮开始吧！
                </Text>
            ) : (
                <Grid>
                    {lists.map((list) => (
                        <Grid.Col key={list.id} span={{ base: 12, sm: 6, md: 4 }}>
                            <Card
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                style={{ cursor: 'pointer', height: '100%' }}
                                onClick={() => router.push(`/share/${list.id}`)}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Text fw={500} lineClamp={1} title={list.title}>{list.title}</Text>
                                    <Menu position="bottom-end" withinPortal>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" onClick={(e) => e.stopPropagation()}>
                                                <IconDots size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item
                                                leftSection={<IconPencil size={14} />}
                                                onClick={(e) => openEditModal(list.id, list.title, e)}
                                            >
                                                重命名
                                            </Menu.Item>
                                            <Menu.Item
                                                leftSection={<IconTrash size={14} />}
                                                color="red"
                                                onClick={(e) => handleDelete(list.id, e)}
                                            >
                                                删除
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {list.games.length} 个游戏
                                </Text>
                                <Text size="xs" c="dimmed" mt="auto" pt="sm">
                                    创建于 {new Date(list.createdAt).toLocaleDateString()}
                                </Text>
                            </Card>
                        </Grid.Col>
                    ))}
                </Grid>
            )}

            {/* Create Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="新建安利列表">
                <TextInput
                    label="列表名称"
                    placeholder="例如：2024必玩神作"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.currentTarget.value)}
                    data-autofocus
                    mb="md"
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeCreate}>取消</Button>
                    <Button onClick={handleCreate}>创建</Button>
                </Group>
            </Modal>

            {/* Edit Modal */}
            <Modal opened={editOpened} onClose={closeEdit} title="重命名列表">
                <TextInput
                    label="列表名称"
                    value={editingList?.title || ''}
                    onChange={(e) => setEditingList(prev => prev ? { ...prev, title: e.currentTarget.value } : null)}
                    data-autofocus
                    mb="md"
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeEdit}>取消</Button>
                    <Button onClick={handleEdit}>保存</Button>
                </Group>
            </Modal>
        </>
    );
}
