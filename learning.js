// learning.js
class AdaptiveCore {
    constructor(configPath = 'config.json', memoryPath = 'memory.json') {
        this.configPath = configPath;
        this.memoryPath = memoryPath;
        this.config = null;
        this.memory = [];
    }

    async init() {
        this.config = await this.loadJSON(this.configPath);
        this.memory = await this.loadJSON(this.memoryPath, []);
        console.log('>> AdaptiveCore online. Loaded', this.memory.length, 'records.');
    }

    async loadJSON(path, fallback = {}) {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error('Fetch failed');
            return await res.json();
        } catch {
            return fallback;
        }
    }

    async saveMemory() {
        const blob = new Blob([JSON.stringify(this.memory, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.memoryPath;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    recordInteraction(userInput, aiOutput) {
        const entry = {
            input: userInput.trim(),
            output: aiOutput.trim(),
            timestamp: new Date().toISOString()
        };
        this.memory.push(entry);
        if (this.memory.length > this.config.maxRecords) this.memory.shift();
        this.saveMemory();
    }

    findSimilarInput(input) {
        let bestMatch = null;
        let bestScore = 0;
        for (const entry of this.memory) {
            const score = this.similarity(entry.input, input);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }
        return bestScore >= this.config.similarityThreshold ? bestMatch : null;
    }

    similarity(a, b) {
        const sa = a.toLowerCase().split(/\s+/);
        const sb = b.toLowerCase().split(/\s+/);
        const intersect = sa.filter(w => sb.includes(w)).length;
        return intersect / Math.max(sa.length, sb.length);
    }
}

// Integrazione con chatbot
const adaptiveCore = new AdaptiveCore();
adaptiveCore.init();

function handleAIResponse(userInput, aiOutput) {
    adaptiveCore.recordInteraction(userInput, aiOutput);
}

function getAdaptiveSuggestion(userInput) {
    const similar = adaptiveCore.findSimilarInput(userInput);
    return similar ? similar.output : null;
}
