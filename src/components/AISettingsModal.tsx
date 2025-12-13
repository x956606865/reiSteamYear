
import { Modal, TextInput, Select, Button, Group, Stack, PasswordInput, Text, Anchor } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useAIConfigStore, AIModelClient, AIConfig } from '@/lib/ai-client';

interface AISettingsModalProps {
    opened: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

export function AISettingsModal({ opened, onClose, onSaveSuccess }: AISettingsModalProps) {
    const { provider, apiKey, baseUrl, model, setConfig } = useAIConfigStore();

    // Local state for form to avoid saving invalid config directly to store?
    // Actually, persisting to store immediately is fine if we validate on "Save".
    // Or we keep local state and only persist on Save. Let's do local state.
    const [localConfig, setLocalConfig] = useState<AIConfig>({
        provider,
        apiKey,
        baseUrl,
        model
    });

    const [isTesting, setIsTesting] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    // Sync store to local on open
    useEffect(() => {
        if (opened) {
            setLocalConfig({ provider, apiKey, baseUrl, model });
        }
    }, [opened, provider, apiKey, baseUrl, model]);

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
                setAvailableModels(['gemini-1.5-flash', 'gemini-1.5-pro']);
            } else {
                const models = await client.getModels();
                setAvailableModels(models);
                alert('Connection verified! Select a model.');
            }
        } catch (e: any) {
            alert(e.message || 'Connection failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        if (!localConfig.apiKey) {
            alert('API Key is required');
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
        <Modal opened={opened} onClose={onClose} title="AI Provider Settings" centered>
            <Stack>
                <Select
                    label="Provider"
                    data={[
                        { value: 'openai', label: 'OpenAI (Official)' },
                        { value: 'google', label: 'Google Gemini' },
                        { value: 'custom', label: 'Custom SDK / Proxy' }
                    ]}
                    value={localConfig.provider}
                    onChange={(v: any) => setLocalConfig({ ...localConfig, provider: v, model: '' })}
                />

                {localConfig.provider !== 'custom' && (
                    <Text size="xs" c="dimmed">
                        Get your API Key from <Anchor href={getHelpLink()} target="_blank">here</Anchor>.
                    </Text>
                )}

                {localConfig.provider === 'custom' && (
                    <TextInput
                        label="Base URL"
                        placeholder="https://api.deepseek.com/v1"
                        value={localConfig.baseUrl || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.currentTarget.value })}
                        description="Endpoint base URL (should end with /v1 usually)"
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
                        Test Connection & List Models
                    </Button>
                </Group>

                {availableModels.length > 0 && (
                    <Select
                        label="Select Model"
                        data={availableModels}
                        value={localConfig.model}
                        onChange={(v) => setLocalConfig({ ...localConfig, model: v || '' })}
                        searchable
                    />
                )}
                {localConfig.provider === 'google' && availableModels.length === 0 && (
                    // Fallback manual input or default list for Google if test skipped
                    <Select
                        label="Model"
                        data={['gemini-1.5-flash', 'gemini-1.5-pro']}
                        value={localConfig.model}
                        onChange={(v) => setLocalConfig({ ...localConfig, model: v || '' })}
                    />
                )}

                {localConfig.provider === 'openai' && availableModels.length === 0 && (
                    // Fallback if user didn't test but wants to save
                    <TextInput
                        label="Model Name (Manual)"
                        value={localConfig.model}
                        onChange={(e) => setLocalConfig({ ...localConfig, model: e.currentTarget.value })}
                        placeholder="gpt-4o"
                    />
                )}

                <Text size="xs" c="dimmed" mt="md">
                    Note: API Key is stored locally in your browser. We never see it.
                </Text>

                <Group justify="right" mt="md">
                    <Button onClick={handleSave}>Save Settings</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
