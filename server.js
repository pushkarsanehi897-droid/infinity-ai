import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/generai'; // Note: Ensure your package.json has @google/generative-ai

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve index.html at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// INITIALIZE AI
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

app.post('/generate', async (req, res) => {
    try {
        const { topic, platform, language } = req.body;
        
        // This is the specific fix for your error:
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an AI Creative Director. Create viral ${platform} content about ${topic} in ${language}. 1. HOOKS, 2. SCRIPT, 3. VISUAL DIRECTION.`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        res.json({ script: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ script: "The AI is currently calibrating. Please try again in a moment." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 INFINITY.AI READY ON PORT ${PORT}`);
});
