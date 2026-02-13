import React, { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PreviewProps {
  content: string;
  onBack: () => void;
}

const Preview: React.FC<PreviewProps> = ({ content, onBack }) => {
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
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Voltar ao Editor
        </button>
        <h2 className="ml-4 text-lg font-semibold">Modo de Visualização</h2>
      </div>
      <div className="flex-1 bg-slate-100 p-4 sm:p-8">
        <div className="bg-white shadow-lg rounded-lg h-[calc(100vh-140px)] min-h-[500px] overflow-hidden border border-slate-200">
          <iframe 
            ref={iframeRef} 
            title="Pré-visualização HTML" 
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin" 
          />
        </div>
      </div>
    </div>
  );
};

export default Preview;