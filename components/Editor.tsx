import React from 'react';
import { Code2 } from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
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

export default Editor;