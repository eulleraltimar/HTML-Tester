import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Play, Rocket, Code2, Wand2, Loader2, AlertCircle, CheckCircle2, Palette, ArrowLeft } from 'lucide-react';

// --- TYPES ---
interface HTMLStats {
  wordCount: number;
  charCount: number;
  readabilityScore: number;
  readabilityLabel: string;
}

interface AISuggestions {
  title: string;
  description: string;
  keyword: string;
  loading: boolean;
  error?: string;
}

enum ViewMode {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
}

// --- UTILS ---
const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
};

const calculateFleschReadingEase = (text: string): { score: number; label: string } => {
  if (!text.trim()) return { score: 0, label: 'N/A' };
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g)?.length || Math.max(1, text.split('\n').length);
  const wordsArray = text.trim().split(/\s+/);
  const words = wordsArray.length;
  if (words === 0) return { score: 0, label: 'N/A' };
  let totalSyllables = 0;
  wordsArray.forEach((word) => { totalSyllables += countSyllables(word); });
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words);
  const clampedScore = Math.min(100, Math.max(0, score));
  let label = '';
  if (clampedScore >= 90) label = 'Muito Fácil';
  else if (clampedScore >= 80) label = 'Fácil';
  else if (clampedScore >= 70) label = 'Razoavelmente Fácil';
  else if (clampedScore >= 60) label = 'Padrão';
  else if (clampedScore >= 50) label = 'Razoavelmente Difícil';
  else if (clampedScore >= 30) label = 'Difícil';
  else label = 'Muito Difícil';
  return { score: Math.round(clampedScore), label };
};

const analyzeHtml = (html: string): HTMLStats => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const textContent = doc.body.textContent || '';
  const wordsArray = textContent.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = wordsArray.length;
  const charCount = html.length;
  const readability = calculateFleschReadingEase(textContent);
  return { wordCount, charCount, readabilityScore: readability.score, readabilityLabel: readability.label };
};

// --- SERVICE ---
const generateSeoSuggestions = async (htmlContent: string) => {
  // Safe check for process.env
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key não encontrada");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";
  const prompt = `
    Analise o seguinte conteúdo HTML/texto.
    Identifique a palavra-chave principal ou tópico.
    Gere uma sugestão de título SEO que tenha entre 45 e 60 caracteres, com a palavra-chave no início.
    Gere uma sugestão de meta descrição que tenha entre 145 e 155 caracteres, com a palavra-chave no início e uma Chamada para Ação (CTA) no final.
    
    Conteúdo:
    ${htmlContent.substring(0, 5000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                keyword: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["keyword", "title", "description"]
        }
      }
    });
    const jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- COMPONENTS ---

// 1. Editor
const Editor: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <Code2 size={18} className="text-slate-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código Fonte</span>
      </div>
      <textarea
        className="flex-1 w-full min-h-[640px] resize-y p-4 font-mono text-sm leading-relaxed text-slate-800 bg-white focus:outline-none custom-scrollbar"
        placeholder="Digite ou cole seu código HTML aqui..."
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

// 2. Stats & Color Wheel
const StatCard: React.FC<{ label: string; value: string | number; subtext?: string; color?: string }> = ({ label, value, subtext, color = 'text-slate-900' }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    {subtext && <span className="text-xs text-slate-400 mt-1">{subtext}</span>}
  </div>
);

const COLOR_WHEEL = [
  { hex: '#FF0000', name: 'Vermelho' },
  { hex: '#FF4500', name: 'Vermelho-Laranja' },
  { hex: '#FFA500', name: 'Laranja' },
  { hex: '#FFD700', name: 'Amarelo-Laranja' },
  { hex: '#FFFF00', name: 'Amarelo' },
  { hex: '#9ACD32', name: 'Amarelo-Verde' },
  { hex: '#008000', name: 'Verde' },
  { hex: '#008080', name: 'Azul-Verde' },
  { hex: '#0000FF', name: 'Azul' },
  { hex: '#8A2BE2', name: 'Azul-Violeta' },
  { hex: '#EE82EE', name: 'Violeta' },
  { hex: '#C71585', name: 'Vermelho-Violeta' },
];

const ColorWheel: React.FC = () => {
  const [hoveredColor, setHoveredColor] = useState<{hex: string, name: string} | null>(null);
  const radius = 80;
  const center = 100;
  
  const createSlicePath = (index: number, total: number) => {
    const startAngle = (index * 360) / total - 90;
    const endAngle = ((index + 1) * 360) / total - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[200px]">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
          {COLOR_WHEEL.map((color, index) => (
            <path
              key={color.hex}
              d={createSlicePath(index, COLOR_WHEEL.length)}
              fill={color.hex}
              stroke="white"
              strokeWidth="1"
              onMouseEnter={() => setHoveredColor(color)}
              onMouseLeave={() => setHoveredColor(null)}
              className="transition-opacity hover:opacity-90 cursor-pointer hover:scale-105 origin-center"
              style={{ transformBox: 'fill-box' }}
            />
          ))}
          <circle cx={center} cy={center} r="25" fill="white" className="shadow-sm" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center z-10">
            {hoveredColor ? (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{hoveredColor.hex}</span>
              </div>
            ) : (
              <Palette size={20} className="text-slate-300" />
            )}
          </div>
        </div>
      </div>
      <div className="h-6 mt-1 text-center">
         {hoveredColor ? (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">{hoveredColor.name}</span>
         ) : (
            <span className="text-xs text-slate-400 italic">Passe o mouse para ver o código</span>
         )}
      </div>
    </div>
  );
};

const StatsPanel: React.FC<{ stats: HTMLStats; suggestions: AISuggestions; onGenerateSuggestions: () => void; hasApiKey: boolean }> = ({ stats, suggestions, onGenerateSuggestions, hasApiKey }) => {
  return (
    <div className="bg-slate-50 border-l border-slate-200 p-6 space-y-6 w-full lg:w-96 flex-shrink-0">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">Métricas em Tempo Real</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Palavras" value={stats.wordCount} />
          <StatCard label="Caracteres" value={stats.charCount} />
          <div className="col-span-2">
            <StatCard 
              label="Legibilidade" 
              value={stats.readabilityScore} 
              subtext={stats.readabilityLabel}
              color={stats.readabilityScore > 60 ? 'text-green-600' : stats.readabilityScore > 40 ? 'text-yellow-600' : 'text-red-600'}
            />
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 self-start">
          <Palette size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase">Referência de Cores</span>
        </div>
        <ColorWheel />
      </div>
      <hr className="border-slate-200" />
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Wand2 size={20} className="text-purple-600" /> Sugestões de IA</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-slate-500 uppercase">Palavra-Chave</span></div>
             {suggestions.keyword ? (
               <div className="flex items-center gap-2 text-purple-700 font-medium bg-purple-50 px-3 py-1 rounded-full w-fit"><CheckCircle2 size={14} />{suggestions.keyword}</div>
             ) : <span className="text-sm text-slate-400 italic">Ainda não gerado</span>}
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-500 uppercase">Título SEO</span></div>
            {suggestions.title ? <p className="text-sm text-slate-800 leading-snug">{suggestions.title}</p> : <p className="text-sm text-slate-400 italic">Gere para ver a sugestão...</p>}
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-500 uppercase">Meta Descrição</span></div>
            {suggestions.description ? <p className="text-sm text-slate-700 leading-relaxed">{suggestions.description}</p> : <p className="text-sm text-slate-400 italic">Gere para ver a sugestão...</p>}
          </div>
          {suggestions.error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" />{suggestions.error}</div>
          )}
          <button
            onClick={onGenerateSuggestions}
            disabled={suggestions.loading || !hasApiKey}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
              suggestions.loading ? 'bg-purple-100 text-purple-400 cursor-wait' : !hasApiKey ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg transform active:scale-95'
            }`}
          >
            {suggestions.loading ? <><Loader2 size={18} className="animate-spin" /> Analisando...</> : !hasApiKey ? "Chave API IA Ausente" : <><Wand2 size={18} /> Gerar Otimização</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Preview
const Preview: React.FC<{ content: string; onBack: () => void }> = ({ content, onBack }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(content);
        doc.close();
      }
    }
  }, [content]);
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-slate-900 text-white p-4 flex items-center shadow-md shrink-0 sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Voltar ao Editor
        </button>
        <h2 className="ml-4 text-lg font-semibold">Modo de Visualização</h2>
      </div>
      <div className="flex-1 bg-slate-100 p-4 sm:p-8">
        <div className="bg-white shadow-lg rounded-lg h-[calc(100vh-140px)] min-h-[500px] overflow-hidden border border-slate-200">
          <iframe ref={iframeRef} title="Pré-visualização HTML" className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Minha Página Incrível</title>
    <style>
        body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
        h1 { color: #3b82f6; }
        p { color: #334155; }
        .button { background: #e11d48; color: white; padding: 10px 20px; border: none; border-radius: 4px; }
        .footer { background: #0f172a; color: #94a3b8; padding: 20px; margin-top: 40px; }
    </style>
</head>
<body>
    <header>
        <h1>Bem-vindo ao Meu Site</h1>
        <p>Comece a editar este código para ver as mudanças instantaneamente!</p>
    </header>
    <main>
        <h2>Sobre Nós</h2>
        <p>Nós fornecemos serviços excelentes para ajudar seu negócio a crescer. Nossa equipe é dedicada à qualidade e desempenho.</p>
        <p>Entre em contato conosco hoje para saber mais sobre nossas ofertas.</p>
        <button class="button">Começar Agora</button>
    </main>
    <footer class="footer">
        <p>&copy; 2024 Minha Empresa. Todos os direitos reservados.</p>
    </footer>
</body>
</html>`;

const App: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>(DEFAULT_HTML);
  const [stats, setStats] = useState<HTMLStats>({ wordCount: 0, charCount: 0, readabilityScore: 0, readabilityLabel: '' });
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDITOR);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions>({ title: '', description: '', keyword: '', loading: false });

  useEffect(() => {
    const newStats = analyzeHtml(htmlContent);
    setStats(newStats);
  }, [htmlContent]);

  const handleGenerateSuggestions = useCallback(async () => {
    if (!htmlContent.trim()) return;
    setAiSuggestions(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const result = await generateSeoSuggestions(htmlContent);
      setAiSuggestions({ title: result.title, description: result.description, keyword: result.keyword, loading: false, error: undefined });
    } catch (error) {
      setAiSuggestions(prev => ({ ...prev, loading: false, error: "Falha ao gerar sugestões. Verifique a API Key." }));
    }
  }, [htmlContent]);

  // Check process shim
  const hasApiKey = !!((window as any).process?.env?.API_KEY || process.env.API_KEY);

  if (viewMode === ViewMode.PREVIEW) {
    return <Preview content={htmlContent} onBack={() => setViewMode(ViewMode.EDITOR)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <img src="logo.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display='none'} />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Testador de HTML</h1>
            <p className="text-xs text-slate-500">Codifique, Analise e Otimize</p>
          </div>
        </div>
        <button onClick={() => setViewMode(ViewMode.PREVIEW)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform active:scale-95">
          <Play size={18} fill="currentColor" /> Testar Código
        </button>
      </header>
      <main className="flex-1 flex flex-col lg:flex-row items-stretch">
        <div className="flex-1 p-4 lg:p-6 flex flex-col min-h-[500px] lg:min-h-[calc(100vh-88px)]">
          <Editor value={htmlContent} onChange={setHtmlContent} />
          <div className="mt-2 text-xs text-slate-400 text-center lg:text-left flex items-center gap-1 shrink-0"><Rocket size={12} /><span>Dica Pro: Use o painel de IA para gerar tags SEO.</span></div>
        </div>
        <StatsPanel stats={stats} suggestions={aiSuggestions} onGenerateSuggestions={handleGenerateSuggestions} hasApiKey={hasApiKey} />
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);