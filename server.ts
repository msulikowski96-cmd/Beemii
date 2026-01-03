import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// AI Configuration - OpenRouter.ai only
const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = "https://openrouter.ai/api/v1";
const model = process.env.OPENROUTER_MODEL || "qwen/qwen3-4b:free";

if (!apiKey) {
  console.warn("Brak klucza OPENROUTER_API_KEY. Analiza AI nie będzie działać.");
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  defaultHeaders: {
    "HTTP-Referer": "https://replit.com", // Wymagane przez OpenRouter
    "X-Title": "MetabolicAI",
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { weight, height, age, gender, activity, bmi, bmr, tdee } = req.body;

    const prompt = `Jesteś ekspertem ds. zdrowia metabolicznego i dietetyki. 
    Przeanalizuj poniższe dane użytkownika i podaj:
    1. AI-Score (ocena zdrowia metabolicznego 1-100).
    2. Krótkie podsumowanie obecnego stanu.
    3. Konkretne, spersonalizowane rekomendacje dotyczące:
       - Żywienia (ile białka, tłuszczu, węglowodanów)
       - Aktywności fizycznej (jaki rodzaj treningu)
       - Stylu życia

    Dane użytkownika:
    - Płeć: ${gender === 'male' ? 'Mężczyzna' : 'Kobieta'}
    - Wiek: ${age} lat
    - Waga: ${weight} kg
    - Wzrost: ${height} cm
    - BMI: ${bmi}
    - BMR: ${bmr} kcal
    - TDEE: ${tdee} kcal
    - Poziom aktywności (mnożnik): ${activity}

    Odpowiedz w języku polskim, używając profesjonalnego, ale przystępnego tonu.`;

    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to analyze health data' });
  }
});

// Serve static files in production
const publicPath = path.join(__dirname, 'dist');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Port 5000 is the main entry point
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
