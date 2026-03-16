import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API KEY VALIDATION
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// --- FIX FOR "CANNOT GET /" ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- CONTENT GENERATION ---
app.post('/generate', async (req, res) => {
    const { topic, platform, language } = req.body;
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const prompt = `Act as an AI Creative Director. Create viral ${platform} content about ${topic} in ${language}. STRICT FORMAT: 1. HOOKS, 2. SCRIPT, 3. VISUAL DIRECTION, 4. METADATA.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ script: response.text() });
    } catch (error) {
        console.error("❌ Gemini Error:", error);
        res.status(500).json({ script: "AI Link Down. Check API Key in Render Settings." });
    }
});

// --- IMAGE GENERATION ---
app.post('/generate-image', async (req, res) => {
    let { visualDescription } = req.body;
    try {
        const seed = Math.floor(Math.random() * 99999);
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(visualDescription)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        res.json({ imageBase64: Buffer.from(buffer).toString('base64') });
    } catch (error) {
        res.status(500).json({ error: "Image failed." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 INFINITY.AI LIVE ON PORT ${PORT}`);
});
