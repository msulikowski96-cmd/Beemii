import React, { useState, useEffect } from 'react';
import { Activity, Calculator, History, Brain, TrendingUp, User, ArrowRight, Save, Trash2 } from 'lucide-react';
import { calculateBMI, calculateBMR, calculateTDEE, getBMICategory } from './utils/calculators';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HealthData {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activity: number;
}

interface SavedResult {
  id: string;
  date: string;
  bmi: number;
  bmr: number;
  tdee: number;
  weight: number;
}

const App = () => {
  const [data, setData] = useState<HealthData>({
    weight: 70,
    height: 175,
    age: 30,
    gender: 'male',
    activity: 1.375,
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('health_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const bmi = calculateBMI(data.weight, data.height);
  const bmr = calculateBMR(data.weight, data.height, data.age, data.gender);
  const tdee = calculateTDEE(bmr, data.activity);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      console.log('Sending data to /api/analyze:', { ...data, bmi, bmr, tdee });
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, bmi, bmr, tdee }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Błąd serwera');
      }
      
      const result = await response.json();
      setAiAnalysis(result.analysis);
    } catch (err) {
      console.error('AI Analysis failed:', err);
      setError("Wystąpił błąd podczas analizy AI. Upewnij się, że serwer działa poprawnie.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveResult = () => {
    const newResult: SavedResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      bmi,
      bmr,
      tdee,
      weight: data.weight
    };
    const newHistory = [...history, newResult].slice(-10);
    setHistory(newHistory);
    localStorage.setItem('health_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('health_history');
  };

  const chartData = {
    labels: history.map(h => h.date),
    datasets: [
      {
        label: 'Twoje BMI',
        data: history.map(h => h.bmi),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Activity size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MetabolicAI</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calculator className="text-blue-600" size={20} /> Wprowadź Dane
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Płeć</label>
              <div className="flex gap-2">
                {['male', 'female'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setData({ ...data, gender: g as any })}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                      data.gender === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {g === 'male' ? 'Mężczyzna' : 'Kobieta'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waga (kg)</label>
                <input
                  type="number"
                  value={data.weight}
                  onChange={(e) => setData({ ...data, weight: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wzrost (cm)</label>
                <input
                  type="number"
                  value={data.height}
                  onChange={(e) => setData({ ...data, height: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wiek</label>
                <input
                  type="number"
                  value={data.age}
                  onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aktywność</label>
                <select
                  value={data.activity}
                  onChange={(e) => setData({ ...data, activity: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value={1.2}>Brak (Siedzący)</option>
                  <option value={1.375}>Niska (1-2 razy)</option>
                  <option value={1.55}>Średnia (3-5 razy)</option>
                  <option value={1.725}>Wysoka (codziennie)</option>
                  <option value={1.9}>Bardzo wysoka</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              <Brain size={20} /> {isAnalyzing ? 'Analizowanie...' : 'Analizuj AI'}
            </button>
            <button
              onClick={saveResult}
              className="w-full mt-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-200"
            >
              <Save size={18} /> Zapisz Wynik
            </button>
          </div>
        </section>

        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <span className="font-medium">!</span> {error}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-sm font-medium text-gray-500 mb-1">Twoje BMI</p>
              <h3 className="text-3xl font-bold text-blue-600">{bmi}</h3>
              <p className="text-xs font-semibold mt-2 text-blue-500 uppercase tracking-wider">{getBMICategory(bmi)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">BMR (Metabolizm)</p>
              <h3 className="text-3xl font-bold text-gray-800">{bmr} <span className="text-sm font-normal text-gray-400">kcal</span></h3>
              <p className="text-xs mt-2 text-gray-400">Energia spoczynkowa</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-white to-blue-50/30">
              <p className="text-sm font-medium text-gray-500 mb-1">TDEE (Dzienne)</p>
              <h3 className="text-3xl font-bold text-gray-800">{tdee} <span className="text-sm font-normal text-gray-400">kcal</span></h3>
              <p className="text-xs mt-2 text-gray-400">Energia całkowita</p>
            </div>
          </section>

          <section className={`bg-white rounded-2xl shadow-sm border-2 border-blue-100 overflow-hidden transition-all duration-500 ${aiAnalysis ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Brain size={20} /> Rekomendacje MetabolicAI
              </h2>
              {aiAnalysis && <div className="text-xs bg-white/20 px-2 py-1 rounded">Model: GPT-4o</div>}
            </div>
            <div className="p-6">
              {!aiAnalysis ? (
                <div className="text-center py-8">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-blue-600 font-medium">Sztuczna inteligencja analizuje Twoje dane...</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Kliknij "Analizuj AI", aby otrzymać spersonalizowane wskazówki</p>
                  )}
                </div>
              ) : (
                <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis}
                </div>
              )}
            </div>
          </section>

          {history.length > 0 && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} /> Historia Postępów
                </h2>
                <button onClick={clearHistory} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> Wyczyść
                </button>
              </div>
              <div className="h-64">
                <Line 
                  data={chartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: false } }
                  }} 
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
