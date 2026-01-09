import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Activity, 
  Calculator, 
  Brain, 
  TrendingUp, 
  Save, 
  Trash2, 
  Dumbbell, 
  Apple, 
  Zap,
  Calendar,
  User as UserIcon,
  ArrowRight,
  History as HistoryIcon,
  Target,
  Scale,
  Flame
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
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
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
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 14 }
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 } }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans pb-20 md:pb-8 selection:bg-indigo-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-blue-100 rounded-full blur-[100px]"></div>
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 ring-2 ring-white">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-700">MetabolicAI</span>
          </div>
          <div className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setActiveTab('calc')} 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'calc' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Kalkulator
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Historia
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative">
        {activeTab === 'calc' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white/80 backdrop-blur-md p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/80">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <UserIcon size={20} className="text-indigo-600" />
                  </div>
                  <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">Profil Zdrowia</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-1.5 bg-slate-100/50 rounded-2xl flex gap-1 border border-slate-200/30">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setData({ ...data, gender: g as any })}
                        className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                          data.gender === g ? 'bg-white text-indigo-600 shadow-xl ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {g === 'male' ? 'Mężczyzna' : 'Kobieta'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waga</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={data.weight}
                          onChange={(e) => setData({ ...data, weight: Number(e.target.value) })}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-indigo-500 transition-all font-bold text-lg outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KG</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wzrost</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={data.height}
                          onChange={(e) => setData({ ...data, height: Number(e.target.value) })}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-indigo-500 transition-all font-bold text-lg outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">CM</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wiek</label>
                      <input
                        type="number"
                        value={data.age}
                        onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-indigo-500 transition-all font-bold text-lg outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aktywność</label>
                      <select
                        value={data.activity}
                        onChange={(e) => setData({ ...data, activity: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-indigo-500 transition-all font-bold outline-none appearance-none"
                      >
                        <option value={1.2}>Brak</option>
                        <option value={1.375}>Niska</option>
                        <option value={1.55}>Średnia</option>
                        <option value={1.725}>Wysoka</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="group relative w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-95 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      {isAnalyzing ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Analizuję Profil...</span>
                        </div>
                      ) : (
                        <>
                          <Brain size={22} /> 
                          <span>ANALIZUJ AI</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={saveResult}
                      className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border-2 border-slate-100 shadow-sm text-sm"
                    >
                      <Save size={18} className="text-indigo-600" /> Zapisz w dzienniku
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-3xl flex items-center gap-4 text-sm font-bold shadow-lg shadow-rose-100 animate-in fade-in slide-in-from-top-4">
                  <div className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center text-rose-700">!</div>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-white p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Scale size={16} className="text-indigo-400" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wskaźnik BMI</p>
                    </div>
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{bmi}</h3>
                    <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                      {getBMICategory(bmi)}
                    </div>
                  </div>
                </div>

                <div className="group bg-white p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame size={16} className="text-orange-400" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Podstawa (BMR)</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{bmr}</h3>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">kcal</span>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div className="group bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-400/20 transition-all hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={16} className="text-indigo-400" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spalanie (TDEE)</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-4xl font-black text-white tracking-tighter">{tdee}</h3>
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">kcal</span>
                    </div>
                    <p className="text-[10px] mt-4 text-slate-400 font-bold uppercase tracking-widest">Dzienny Limit</p>
                  </div>
                </div>
              </div>

              <div id="recommendations" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-8 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500 ring-4 ring-white/10 rotate-3">
                        <Brain size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">Analiza MetabolicAI</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                          <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.2em]">Live Intelligence</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-10">
                    {!aiAnalysis && !isAnalyzing ? (
                      <div className="text-center py-16 space-y-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300 border border-dashed border-slate-200">
                          <Zap size={40} className="animate-pulse" />
                        </div>
                        <div className="max-w-sm mx-auto">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">Gotowy na Personalizację?</h3>
                          <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">Nasz model AI przeanalizuje Twoje dane i przygotuje kompletny plan dietetyczno-treningowy.</p>
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-8">
                            <div className="relative">
                                <div className="w-24 h-24 border-6 border-indigo-50 border-t-indigo-600 rounded-full animate-spin shadow-inner"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain size={32} className="text-indigo-600 animate-bounce" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="font-black text-slate-800 text-2xl tracking-tight">AI Projektuje Twój Plan</h3>
                                <div className="flex gap-1 justify-center mt-2">
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="prose prose-indigo prose-lg max-w-none text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                          <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                        </div>
                        
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-indigo-100 transition-all">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Apple size={24} /></div>
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Plan Żywienia</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-indigo-100 transition-all">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Dumbbell size={24} /></div>
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Trening Siłowy</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-indigo-100 transition-all">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Target size={24} /></div>
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Cele Długofalowe</span>
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
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-end justify-between px-2">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Dziennik Postępów</h2>
                <p className="text-slate-500 font-bold mt-1 text-sm uppercase tracking-widest">Ostatnie 10 pomiarów</p>
              </div>
              <button 
                onClick={clearHistory}
                className="group p-4 bg-white text-rose-500 rounded-3xl hover:bg-rose-500 hover:text-white transition-all duration-300 border-2 border-rose-50 shadow-lg shadow-rose-100/50"
              >
                <Trash2 size={24} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50 h-[450px]">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><TrendingUp size={20} /></div>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Analiza Trendu BMI</h3>
                  </div>
                  <div className="h-[300px]">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50/80 border-b border-slate-100">
                           <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Pomiar</th>
                           <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Waga</th>
                           <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">BMI</th>
                           <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">TDEE</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {history.slice().reverse().map((h) => (
                           <tr key={h.id} className="group hover:bg-indigo-50/30 transition-all">
                             <td className="px-8 py-6">
                               <div className="flex flex-col">
                                 <span className="font-black text-slate-800 text-base">{h.date}</span>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase">Zapisano</span>
                               </div>
                             </td>
                             <td className="px-8 py-6 font-black text-slate-600 text-lg group-hover:text-indigo-600 transition-colors">{h.weight} kg</td>
                             <td className="px-8 py-6">
                               <div className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-all">
                                 {h.bmi}
                               </div>
                             </td>
                             <td className="px-8 py-6 font-black text-slate-600 text-lg">{h.tdee} <span className="text-[10px] text-slate-400">kcal</span></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[3rem] border border-white text-center space-y-6 shadow-2xl shadow-slate-200/50">
                <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 border border-dashed border-slate-300">
                  <Calendar size={48} />
                </div>
                <div className="max-w-xs mx-auto">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Pusty Dziennik</h3>
                  <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">Zrób pierwszy pomiar i zacznij budować swoją drogę do lepszego zdrowia.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('calc')}
                  className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Otwórz Kalkulator <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl w-[calc(100%-2rem)] max-w-sm md:hidden p-2">
        <div className="flex items-center">
          <button 
            onClick={() => setActiveTab('calc')}
            className={`flex-1 h-14 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'calc' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500'}`}
          >
            <Calculator size={20} strokeWidth={2.5} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Start</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 h-14 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500'}`}
          >
            <HistoryIcon size={20} strokeWidth={2.5} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Postępy</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
