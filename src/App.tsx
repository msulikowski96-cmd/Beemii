import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calculator, 
  Brain, 
  TrendingUp, 
  Save, 
  Trash2, 
  ChevronRight, 
  Dumbbell, 
  Apple, 
  Zap,
  Info,
  Calendar,
  User as UserIcon,
  ArrowRight,
  History as HistoryIcon
} from 'lucide-react';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  const [activeTab, setActiveTab] = useState<'calc' | 'history'>('calc');

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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ...data, bmi, bmr, tdee }),
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Błąd formatu danych serwera.');
      }
      
      const result = await response.json();
      setAiAnalysis(result.analysis);
      
      setTimeout(() => {
        document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('AI Analysis failed:', err);
      setError("Wystąpił błąd podczas analizy AI. Spróbuj ponownie za chwilę.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveResult = () => {
    const newResult: SavedResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
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
    if(window.confirm('Czy na pewno chcesz wyczyścić historię?')) {
      setHistory([]);
      localStorage.removeItem('health_history');
    }
  };

  const chartData = {
    labels: history.map(h => h.date),
    datasets: [
      {
        fill: true,
        label: 'BMI',
        data: history.map(h => h.bmi),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14 },
        bodyFont: { size: 14 }
      }
    },
    scales: {
      y: { 
        grid: { display: false },
        ticks: { font: { size: 12 } }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { size: 12 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20 md:pb-8">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Metabolic<span className="text-blue-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('calc')} className={`text-sm font-medium ${activeTab === 'calc' ? 'text-blue-600' : 'text-slate-500'}`}>Kalkulator</button>
            <button onClick={() => setActiveTab('history')} className={`text-sm font-medium ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500'}`}>Historia</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {activeTab === 'calc' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <UserIcon size={18} className="text-blue-600" />
                  <h2 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Twoje Dane</h2>
                </div>

                <div className="space-y-5">
                  <div className="p-1 bg-slate-100 rounded-2xl flex">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setData({ ...data, gender: g as any })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          data.gender === g ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {g === 'male' ? 'Mężczyzna' : 'Kobieta'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Waga (kg)</label>
                      <input
                        type="number"
                        value={data.weight}
                        onChange={(e) => setData({ ...data, weight: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Wzrost (cm)</label>
                      <input
                        type="number"
                        value={data.height}
                        onChange={(e) => setData({ ...data, height: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Wiek</label>
                      <input
                        type="number"
                        value={data.age}
                        onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Aktywność</label>
                      <select
                        value={data.activity}
                        onChange={(e) => setData({ ...data, activity: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                      >
                        <option value={1.2}>Brak</option>
                        <option value={1.375}>Niska</option>
                        <option value={1.55}>Średnia</option>
                        <option value={1.725}>Wysoka</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Analizuję...
                        </div>
                      ) : (
                        <>
                          <Brain size={20} /> Analizuj AI
                        </>
                      )}
                    </button>
                    <button
                      onClick={saveResult}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Save size={16} /> Zapisz wynik
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">!</div>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full transition-transform group-hover:scale-125 duration-500"></div>
                  <div className="relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BMI</p>
                    <h3 className="text-4xl font-black text-slate-800">{bmi}</h3>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {getBMICategory(bmi)}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metabolizm (BMR)</p>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black text-slate-800">{bmr}</h3>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">kcal</span>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400 font-medium">Zapotrzebowanie podstawowe</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm bg-gradient-to-br from-white to-blue-50/20">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Energia (TDEE)</p>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black text-blue-600">{tdee}</h3>
                    <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">kcal</span>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400 font-medium">Całkowite dzienne spalanie</p>
                </div>
              </div>

              <div id="recommendations" className={`transition-all duration-700 ${aiAnalysis ? 'opacity-100' : 'opacity-80'}`}>
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden ring-4 ring-blue-50">
                  <div className="bg-slate-900 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white rotate-3">
                        <Brain size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Analiza AI</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Spersonalizowany plan</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {!aiAnalysis && !isAnalyzing ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                          <Zap size={32} />
                        </div>
                        <div className="max-w-xs mx-auto">
                          <h3 className="font-bold text-slate-800">Gotowy na analizę?</h3>
                          <p className="text-sm text-slate-500 mt-1">Kliknij przycisk po lewej, aby otrzymać wskazówki od AI.</p>
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap size={20} className="text-blue-600 animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800 text-lg">Przetwarzanie danych</h3>
                                <p className="text-sm text-slate-400 animate-pulse">Sztuczna inteligencja przygotowuje Twój plan...</p>
                            </div>
                        </div>
                    ) : (
                      <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {aiAnalysis}
                        </div>
                        
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                                <Apple className="text-blue-600" size={18} />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dieta</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                                <Dumbbell className="text-blue-600" size={18} />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trening</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                                <Zap className="text-blue-600" size={18} />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Energia</span>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Twoja Historia</h2>
                <p className="text-slate-500 text-sm">Monitoruj zmiany składu ciała w czasie</p>
              </div>
              <button 
                onClick={clearHistory}
                className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"
                title="Wyczyść historię"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-[400px]">
                  <div className="flex items-center gap-2 mb-8">
                    <TrendingUp size={18} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Wykres BMI</h3>
                  </div>
                  <div className="h-[280px]">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-100">
                         <tr>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waga</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">BMI</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TDEE</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {history.slice().reverse().map((h) => (
                           <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4 font-bold text-slate-800 text-sm">{h.date}</td>
                             <td className="px-6 py-4 font-bold text-slate-600 text-sm">{h.weight} kg</td>
                             <td className="px-6 py-4">
                               <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-xs">{h.bmi}</span>
                             </td>
                             <td className="px-6 py-4 font-bold text-slate-600 text-sm">{h.tdee} kcal</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-16 rounded-[32px] border border-slate-100 text-center space-y-4 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Calendar size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Brak zapisanych wyników</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Wróć do kalkulatora i kliknij "Zapisz wynik", aby zacząć budować swoją historię.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('calc')}
                  className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all"
                >
                  Przejdź do kalkulatora <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 md:hidden pb-safe">
        <div className="flex items-center h-16">
          <button 
            onClick={() => setActiveTab('calc')}
            className={`flex-1 flex flex-col items-center gap-1 ${activeTab === 'calc' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <Calculator size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Kalkulator</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <HistoryIcon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Historia</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
