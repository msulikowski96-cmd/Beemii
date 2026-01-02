import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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
      model: "gpt-5.1",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1500,
    });

    res.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to analyze health data' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = 5001; // Backend on 5001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
