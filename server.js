import express from 'express';
import cors from 'cors';
import path from 'path'; // 1. Added for path handling
import { fileURLToPath } from 'url'; // 2. Added for ES Modules path support
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

// --- PATH SETUP (Required for ES Modules) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 3. IMPROVED CORS (Restrict this to your domain later for better security)
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST"]
}));
app.use(express.json());

// 4. SERVE FRONTEND (This makes your HTML/CSS live)
// Make sure your index.html is in a folder named 'public' or 'frontend'
app.use(express.static(path.join(__dirname, 'public'))); 

// API KEY VALIDATION
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing!");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- CONTENT GENERATION ---
app.post('/generate', async (req, res) => {
    const { topic, platform, language } = req.body;
    
    // Fallback model: Using the March 2026 stable version
    const activeModel = "gemini-3.1-flash-lite-preview"; 

    try {
        const result = await ai.models.generateContent({
            model: activeModel,
            contents: `Act as an AI Creative Director. Create viral ${platform} content about ${topic} in ${language}. STRICT FORMAT: 1. HOOKS, 2. SCRIPT (Detailed), 3. VISUAL DIRECTION, 4. METADATA.`
        });

        res.json({ script: result.text });
    } catch (error) {
        console.error("❌ Gemini Error:", error.message);
        res.status(500).json({ script: "Internal Server Error: AI Link Down." });
    }
});

// --- IMAGE GENERATION ---
app.post('/generate-image', async (req, res) => {
    let { visualDescription } = req.body;
    let refinedPrompt = visualDescription;
    
    if (visualDescription.includes("VISUAL DIRECTION:")) {
        refinedPrompt = visualDescription.split("VISUAL DIRECTION:")[1].split("4.")[0];
    }

    try {
        const seed = Math.floor(Math.random() * 99999);
        const safePrompt = encodeURIComponent(refinedPrompt.trim().substring(0, 500));
        const imageUrl = `https://pollinations.ai/p/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Pollinations Unreachable");
        
        const buffer = await response.arrayBuffer();
        res.json({ imageBase64: Buffer.from(buffer).toString('base64') });
    } catch (error) {
        res.status(500).json({ error: "Image synthesis failed." });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(`🚀 INFINITY.AI - LIVE ON PORT ${PORT}`);
    console.log(`✍️  EMERGED BY PUSHKAR SANEHI`);
    console.log("-----------------------------------------");
});