
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export type AIProviderId = 'openai' | 'custom' | 'google';

export interface AIConfig {
    provider: AIProviderId;
    apiKey: string;
    baseUrl?: string; // For Custom
    model: string;
}

export interface AIAnalysisResult {
    persona: string;
    summary: string;
    keywords: string[];
    radarChart: {
        action: number;
        strategy: number;
        story: number;
        artistic: number;
        social: number;
        relaxing: number;
    };
    mostPlayedGenre: string;
    hiddenGem?: string;
}

// --- Store ---

interface AIConfigStore extends AIConfig {
    setConfig: (config: Partial<AIConfig>) => void;
    isConfigured: () => boolean;
}

export const useAIConfigStore = create<AIConfigStore>()(
    persist(
        (set, get) => ({
            provider: 'openai',
            apiKey: '',
            baseUrl: '',
            model: 'gpt-4o',
            setConfig: (config) => set((state) => ({ ...state, ...config })),
            isConfigured: () => !!get().apiKey && get().apiKey.length > 5,
        }),
        {
            name: 'ai-config-storage',
        }
    )
);

// --- Client Implementation ---

export class AIModelClient {
    private config: AIConfig;

    constructor(config: AIConfig) {
        this.config = config;
    }

    private getEndpoint(): string {
        if (this.config.provider === 'custom' && this.config.baseUrl) {
            return `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
        }
        if (this.config.provider === 'google') {
            // For Google AI Studio (Gemini), endpoint structure is different
            return `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        }
        // Default OpenAI
        return 'https://api.openai.com/v1/chat/completions';
    }

    async getModels(): Promise<string[]> {
        // Basic implementation to list models
        const baseUrl = this.config.provider === 'custom' && this.config.baseUrl
            ? this.config.baseUrl
            : 'https://api.openai.com/v1';

        try {
            const targetUrl = `${baseUrl.replace(/\/$/, '')}/models`;

            if (this.config.provider === 'custom') {
                const res = await fetch('/api/ai/proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: targetUrl,
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
                    })
                });
                if (!res.ok) throw new Error('Failed to fetch models via proxy');
                const data = await res.json();
                return data.data.map((m: any) => m.id);
            }

            const res = await fetch(targetUrl, {
                headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
            });
            if (!res.ok) throw new Error('Failed to fetch models');
            const data = await res.json();
            return data.data.map((m: any) => m.id);
        } catch (e) {
            console.error("Test connection failed", e);
            throw e;
        }
    }

    async generateAnalysis(contextPrompt: string): Promise<AIAnalysisResult> {
        const endpoint = this.getEndpoint();
        const isGoogle = this.config.provider === 'google';

        const systemPrompt = `
You are a video game data analyst. 
Analyze the User's Year in Review data and output a structured JSON report.
Strictly adhere to this JSON schema:
{
  "persona": "String (e.g. 'Hardcore Tactician')",
  "summary": "String (2-3 sentences, emotional and insightful summary)",
  "keywords": ["String", "String", "String", "String", "String"],
  "radarChart": { "action": 0-100, "strategy": 0-100, "story": 0-100, "artistic": 0-100, "social": 0-100, "relaxing": 0-100 },
  "mostPlayedGenre": "String",
  "hiddenGem": "String (Optional, pick a highly rated indie game)"
}
Do not output markdown code blocks. Output ONLY raw JSON.
`;

        let body;
        let headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (isGoogle) {
            body = JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\n\n" + contextPrompt }] }]
            });
        } else {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            body = JSON.stringify({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: contextPrompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
        }

        // Use proxy for Custom provider to avoid CORS
        if (this.config.provider === 'custom') {
            const proxyBody = {
                endpoint,
                method: 'POST',
                headers,
                body: JSON.parse(body || '{}') // body was stringified above, proxy expects object in body param
            };

            const res = await fetch('/api/ai/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proxyBody)
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`AI Proxy Error: ${res.status} - ${err}`);
            }
            const data = await res.json();
            let content = data.choices?.[0]?.message?.content || "{}";
            // Clean cleanup if MD blocks exist
            content = content.replace(/```json\n/g, '').replace(/```/g, '');
            return JSON.parse(content);
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`AI API Error: ${res.status} - ${err}`);
        }

        const data = await res.json();

        let content = "";
        if (isGoogle) {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        } else {
            content = data.choices?.[0]?.message?.content || "{}";
        }

        // Clean cleanup if MD blocks exist
        content = content.replace(/```json\n/g, '').replace(/```/g, '');

        return JSON.parse(content);
    }
}
