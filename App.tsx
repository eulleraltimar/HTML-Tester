import React, { useState, useEffect, useCallback } from 'react';
import { Play, Rocket } from 'lucide-react';
import Editor from './components/Editor';
import StatsPanel from './components/StatsPanel';
import Preview from './components/Preview';
import { analyzeHtml } from './utils/textAnalysis';
import { generateSeoSuggestions } from './services/geminiService';
import { HTMLStats, AISuggestions, ViewMode } from './types';

// Default HTML template for better initial UX
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
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions>({
    title: '',
    description: '',
    keyword: '',
    loading: false
  });

  // Calculate real-time stats
  useEffect(() => {
    const newStats = analyzeHtml(htmlContent);
    setStats(newStats);
  }, [htmlContent]);

  const handleGenerateSuggestions = useCallback(async () => {
    if (!htmlContent.trim()) return;

    setAiSuggestions(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const result = await generateSeoSuggestions(htmlContent);
      setAiSuggestions({
        title: result.title,
        description: result.description,
        keyword: result.keyword,
        loading: false,
        error: undefined
      });
    } catch (error) {
      setAiSuggestions(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Falha ao gerar sugestões. Por favor, verifique o conteúdo ou a chave da API." 
      }));
    }
  }, [htmlContent]);

  const hasApiKey = !!process.env.API_KEY;

  if (viewMode === ViewMode.PREVIEW) {
    return <Preview content={htmlContent} onBack={() => setViewMode(ViewMode.EDITOR)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <img src="logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Testador de HTML</h1>
            <p className="text-xs text-slate-500">Codifique, Analise e Otimize</p>
          </div>
        </div>
        
        <button
          onClick={() => setViewMode(ViewMode.PREVIEW)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform active:scale-95"
        >
          <Play size={18} fill="currentColor" />
          Testar Código
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch">
        
        {/* Editor Section */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col min-h-[500px] lg:min-h-[calc(100vh-88px)]">
          <Editor value={htmlContent} onChange={setHtmlContent} />
          <div className="mt-2 text-xs text-slate-400 text-center lg:text-left flex items-center gap-1 shrink-0">
            <Rocket size={12} />
            <span>Dica Pro: Use o painel de IA para gerar tags SEO otimizadas para seu conteúdo.</span>
          </div>
        </div>

        {/* Stats Sidebar */}
        <StatsPanel 
          stats={stats} 
          suggestions={aiSuggestions} 
          onGenerateSuggestions={handleGenerateSuggestions}
          hasApiKey={hasApiKey}
        />
        
      </main>
    </div>
  );
};

export default App;