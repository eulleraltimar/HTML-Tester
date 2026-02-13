import React, { useState } from 'react';
import { HTMLStats, AISuggestions } from '../types.ts';
import { Wand2, Loader2, AlertCircle, CheckCircle2, Palette } from 'lucide-react';

interface StatsPanelProps {
  stats: HTMLStats;
  suggestions: AISuggestions;
  onGenerateSuggestions: () => void;
  hasApiKey: boolean;
}

const StatCard: React.FC<{ label: string; value: string | number; subtext?: string; color?: string }> = ({ label, value, subtext, color = 'text-slate-900' }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    {subtext && <span className="text-xs text-slate-400 mt-1">{subtext}</span>}
  </div>
);

// 12 Colors for the Color Wheel
const COLOR_WHEEL = [
  { hex: '#FF0000', name: 'Vermelho' },          // Red
  { hex: '#FF4500', name: 'Vermelho-Laranja' },  // Red-Orange
  { hex: '#FFA500', name: 'Laranja' },           // Orange
  { hex: '#FFD700', name: 'Amarelo-Laranja' },   // Yellow-Orange
  { hex: '#FFFF00', name: 'Amarelo' },           // Yellow
  { hex: '#9ACD32', name: 'Amarelo-Verde' },     // Yellow-Green
  { hex: '#008000', name: 'Verde' },             // Green
  { hex: '#008080', name: 'Azul-Verde' },        // Blue-Green (Teal)
  { hex: '#0000FF', name: 'Azul' },              // Blue
  { hex: '#8A2BE2', name: 'Azul-Violeta' },      // Blue-Violet
  { hex: '#EE82EE', name: 'Violeta' },           // Violet
  { hex: '#C71585', name: 'Vermelho-Violeta' },  // Red-Violet
];

const ColorWheel: React.FC = () => {
  const [hoveredColor, setHoveredColor] = useState<{hex: string, name: string} | null>(null);

  // SVG Configuration
  const radius = 80;
  const center = 100;
  
  // Calculate path for each slice
  const createSlicePath = (index: number, total: number) => {
    const startAngle = (index * 360) / total - 90; // Start at top
    const endAngle = ((index + 1) * 360) / total - 90;
    
    // Convert to radians
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
          {/* Center Circle for Display */}
          <circle cx={center} cy={center} r="25" fill="white" className="shadow-sm" />
        </svg>
        
        {/* Absolute positioned info in center */}
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

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, suggestions, onGenerateSuggestions, hasApiKey }) => {
  return (
    <div className="bg-slate-50 border-l border-slate-200 p-6 space-y-6 w-full lg:w-96 flex-shrink-0">
      
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          Métricas em Tempo Real
        </h3>
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
      
      {/* Colors Section */}
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
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wand2 size={20} className="text-purple-600" />
            Sugestões de IA
          </h3>
        </div>

        <div className="space-y-4">
          {/* Keyword Insight */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
               <span className="text-xs font-bold text-slate-500 uppercase">Palavra-Chave</span>
             </div>
             {suggestions.keyword ? (
               <div className="flex items-center gap-2 text-purple-700 font-medium bg-purple-50 px-3 py-1 rounded-full w-fit">
                 <CheckCircle2 size={14} />
                 {suggestions.keyword}
               </div>
             ) : (
                <span className="text-sm text-slate-400 italic">Ainda não gerado</span>
             )}
          </div>

          {/* Title Suggestion */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Título SEO</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                suggestions.title ? (suggestions.title.length >= 45 && suggestions.title.length <= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-500'
              }`}>
                {suggestions.title ? `${suggestions.title.length} chars` : '45-60 chars'}
              </span>
            </div>
            {suggestions.title ? (
               <p className="text-sm text-slate-800 leading-snug">{suggestions.title}</p>
            ) : (
               <p className="text-sm text-slate-400 italic">Gere para ver a sugestão...</p>
            )}
          </div>

          {/* Description Suggestion */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Meta Descrição</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                suggestions.description ? (suggestions.description.length >= 145 && suggestions.description.length <= 155 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700') : 'bg-slate-100 text-slate-500'
              }`}>
                 {suggestions.description ? `${suggestions.description.length} chars` : '145-155 chars'}
              </span>
            </div>
            {suggestions.description ? (
               <p className="text-sm text-slate-700 leading-relaxed">{suggestions.description}</p>
            ) : (
               <p className="text-sm text-slate-400 italic">Gere para ver a sugestão...</p>
            )}
          </div>

          {suggestions.error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {suggestions.error}
            </div>
          )}

          <button
            onClick={onGenerateSuggestions}
            disabled={suggestions.loading || !hasApiKey}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
              suggestions.loading 
                ? 'bg-purple-100 text-purple-400 cursor-wait'
                : !hasApiKey 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg transform active:scale-95'
            }`}
          >
            {suggestions.loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analisando...
              </>
            ) : !hasApiKey ? (
               "Chave API IA Ausente"
            ) : (
              <>
                <Wand2 size={18} />
                Gerar Otimização
              </>
            )}
          </button>
          {!hasApiKey && (
             <p className="text-[10px] text-center text-slate-400">
               Configure API_KEY no ambiente para habilitar recursos de IA.
             </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;