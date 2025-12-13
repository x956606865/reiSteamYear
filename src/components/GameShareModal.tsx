import { Modal, Button, Group, Stack, Text, Center, Loader, SegmentedControl } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { ExportableSingleGame, SingleGameExportProps } from './ExportableSingleGame';

interface GameShareModalProps {
    opened: boolean;
    onClose: () => void;
    data: SingleGameExportProps;
}

export function GameShareModal({ opened, onClose, data }: GameShareModalProps) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);
    const [chartStyle, setChartStyle] = useState<'list' | 'radar'>('list');

    const handleExport = async () => {
        if (!exportRef.current) return;
        setExporting(true);
        try {
            // Wait a bit ensuring rendering
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(exportRef.current, {
                pixelRatio: 2,
                backgroundColor: '#1A1B1E'
            });
            download(dataUrl, `${data.game.name}-share.png`);
        } catch (err) {
            console.error('Export failed', err);
            alert('生成图片失败，请重试');
        } finally {
            setExporting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="分享游戏卡片"
            size="auto"
            centered
            styles={{ body: { overflow: 'hidden' } }}
        >
            <Stack align="center">
                <div style={{
                    border: '1px solid #333',
                    borderRadius: 8,
                    overflow: 'hidden',
                    maxHeight: '70vh',
                    overflowY: 'auto'
                }}>
                    <ExportableSingleGame ref={exportRef} {...data} chartStyle={chartStyle} />
                </div>

                <Group mt="md">
                    {data.listType === 'manga' && (
                        <SegmentedControl
                            value={chartStyle}
                            onChange={(val) => setChartStyle(val as 'list' | 'radar')}
                            data={[
                                { label: '列表', value: 'list' },
                                { label: '雷达图', value: 'radar' },
                            ]}
                        />
                    )}
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={handleExport}
                        loading={exporting}
                    >
                        保存图片
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
