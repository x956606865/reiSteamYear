export const PREDEFINED_ATTRIBUTES = {
    '情感': [
        { label: '糖度', value: 'sweetness', color: 'pink.4' },
        { label: '刀度', value: 'angst', color: 'grape.6' },
        { label: '治愈度', value: 'healing', color: 'teal.4' },
        { label: '致郁度', value: 'depressing', color: 'gray.6' },
        { label: '催泪度', value: 'tearjerker', color: 'blue.4' },
        { label: '搞笑度', value: 'funny', color: 'yellow.4' },
    ],
    '百合': [
        { label: '百合度', value: 'yuri', color: 'red.4' },
        { label: '扭曲度', value: 'twisted', color: 'violet.6' },
        { label: '暧昧度', value: 'ambiguous', color: 'pink.3' },
        { label: '后宫度', value: 'harem', color: 'pink.6' },
    ],
    '剧情': [
        { label: '烧脑度', value: 'brainburn', color: 'indigo.5' },
        { label: '狗血度', value: 'drama', color: 'red.8' },
        { label: '生活气息', value: 'sliceoflife', color: 'lime.6' },
        { label: '悬疑度', value: 'suspense', color: 'cyan.7' },
        { label: '热血度', value: 'hype', color: 'orange.6' },
        { label: '胃痛度', value: 'stomachache', color: 'orange.8' },
    ],
    '其他': [
        { label: '色气度', value: 'eroticism', color: 'red.6' }, // Replaces NSFW
        { label: '电波度', value: 'denpa', color: 'grape.5' },
        { label: '硬核度', value: 'hardcore', color: 'dark.4' },
    ]
} as const;

export type AttributeKey = string;

export const getAttributeColor = (key: string) => {
    for (const category of Object.values(PREDEFINED_ATTRIBUTES)) {
        const found = category.find(attr => attr.value === key || attr.label === key);
        if (found) return found.color;
    }
    // Deterministic random-ish color for custom tags
    const colors = ['blue.4', 'cyan.4', 'teal.4', 'green.4', 'lime.4', 'yellow.4', 'orange.4', 'red.4', 'pink.4', 'grape.4', 'violet.4', 'indigo.4'];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const getAttributeLabel = (key: string) => {
    for (const category of Object.values(PREDEFINED_ATTRIBUTES)) {
        const found = category.find(attr => attr.value === key);
        if (found) return found.label;
    }
    return key;
};
