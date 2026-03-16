import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

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

// Use the correct API Key from Render Environment Variables
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

app.post('/generate', async (req, res) => {
    try {
        const { topic, platform, language } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Create a viral ${platform} script about ${topic} in ${language}.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ script: response.text() });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ script: "AI is currently busy. Please try again." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
