
import { Modal, TextInput, Select, Button, Group, Stack, PasswordInput, Text, Anchor } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useAIConfigStore, AIModelClient, AIConfig } from '@/lib/ai-client';

interface AISettingsModalProps {
    opened: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

export function AISettingsModal({ opened, onClose, onSaveSuccess }: AISettingsModalProps) {
    const { provider, apiKey, baseUrl, model, availableModels, setConfig } = useAIConfigStore();

    // Local state for form to avoid saving invalid config directly to store?
    // Actually, persisting to store immediately is fine if we validate on "Save".
    // Or we keep local state and only persist on Save. Let's do local state.
    const [localConfig, setLocalConfig] = useState<AIConfig>({
        provider,
        apiKey,
        baseUrl,
        model,
        availableModels
    });

    const [isTesting, setIsTesting] = useState(false);
    // remove local availableModels state as it's part of config now
    // const [availableModels, setAvailableModels] = useState<string[]>([]);

    // Sync store to local on open
    // Sync store to local on open
    useEffect(() => {
        if (opened) {
            setLocalConfig({ provider, apiKey, baseUrl, model, availableModels });
        }
    }, [opened, provider, apiKey, baseUrl, model, availableModels]);

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const client = new AIModelClient(localConfig);
            // Google model listing might be different, let's just try to generate a tiny thing or list?
            // For now, only list models if supported, or just trust.
            // Client.getModels() implementation assumes OpenAI shape. 
            // If Google, we might skip listing or support it later. 

            if (localConfig.provider === 'google') {
                // Skip listing for verified Google key for now as endpoint differs, assume success if key non-empty
                alert('Google API Key saved (Verification skipped)');
                const defaultGoogle = ['gemini-1.5-flash', 'gemini-1.5-pro'];
                setLocalConfig(prev => ({ ...prev, availableModels: defaultGoogle }));
            } else {
                const models = await client.getModels();
                setLocalConfig(prev => ({ ...prev, availableModels: models }));
                alert('Connection verified! Select a model.');
            }
        } catch (e: any) {
            alert(e.message || '连接失败');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        if (!localConfig.apiKey) {
            alert('API Key 是必填项');
            return;
        }
        setConfig(localConfig);
        onSaveSuccess?.();
        onClose();
    };

    const getHelpLink = () => {
        switch (localConfig.provider) {
            case 'openai': return 'https://platform.openai.com/api-keys';
            case 'google': return 'https://aistudio.google.com/app/apikey';
            case 'custom': return '';
            default: return '';
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="AI 设置" centered>
            <Stack>
                <Select
                    label="服务提供商"
                    data={[
                        { value: 'openai', label: 'OpenAI (官方)' },
                        { value: 'google', label: 'Google Gemini' },
                        { value: 'custom', label: 'Custom (自定义/中转)' }
                    ]}
                    value={localConfig.provider}
                    onChange={(v: any) => setLocalConfig({ ...localConfig, provider: v, model: '' })}
                />

                {localConfig.provider !== 'custom' && (
                    <Text size="xs" c="dimmed">
                        从 <Anchor href={getHelpLink()} target="_blank">这里</Anchor> 获取你的 API Key。
                    </Text>
                )}

                {localConfig.provider === 'custom' && (
                    <TextInput
                        label="Base URL (接口地址)"
                        placeholder="https://api.deepseek.com/v1"
                        value={localConfig.baseUrl || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.currentTarget.value })}
                        description="API 接口地址 (通常以 /v1 结尾)"
                    />
                )}

                <PasswordInput
                    label="API Key"
                    placeholder="sk-..."
                    value={localConfig.apiKey}
                    onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.currentTarget.value })}
                />

                <Group justify="right">
                    <Button variant="light" size="xs" loading={isTesting} onClick={handleTestConnection}>
                        测试连接并获取模型
                    </Button>
                </Group>

                {localConfig.availableModels && localConfig.availableModels.length > 0 && (
                    <Select
                        label="选择模型"
                        data={localConfig.availableModels}
                        value={localConfig.model}
                        onChange={(v) => setLocalConfig({ ...localConfig, model: v || '' })}
                        searchable
                    />
                )}
                {localConfig.provider === 'google' && (!localConfig.availableModels || localConfig.availableModels.length === 0) && (
                    // Fallback manual input or default list for Google if test skipped
                    <Select
                        label="模型"
                        data={['gemini-1.5-flash', 'gemini-1.5-pro']}
                        value={localConfig.model}
                        onChange={(v) => setLocalConfig({ ...localConfig, model: v || '' })}
                    />
                )}

                {localConfig.provider === 'openai' && (!localConfig.availableModels || localConfig.availableModels.length === 0) && (
                    // Fallback if user didn't test but wants to save
                    <TextInput
                        label="模型名称 (手动输入)"
                        value={localConfig.model}
                        onChange={(e) => setLocalConfig({ ...localConfig, model: e.currentTarget.value })}
                        placeholder="gpt-4o"
                    />
                )}

                <Text size="xs" c="dimmed" mt="md">
                    注意: API Key 仅存储在你的本地浏览器中，我们无法获取。
                </Text>

                <Group justify="right" mt="md">
                    <Button onClick={handleSave}>保存设置</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
