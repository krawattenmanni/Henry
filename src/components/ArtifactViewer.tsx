import React, { useState, useEffect, useRef } from 'react';
import { CodeArtifact } from '../types';
import { ComplexityPrism } from './ComplexityPrism';
import {
  Play,
  Code2,
  Terminal,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface ArtifactViewerProps {
  artifact: CodeArtifact | null;
  onClose: () => void;
  isMobileSheet?: boolean;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  artifact,
  onClose,
  isMobileSheet = false,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'console'>('preview');
  const [copied, setCopied] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'log' | 'error' | 'warn'; msg: string; time: string }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (artifact) {
      if (artifact.type === 'html-preview' || artifact.type === 'svg') {
        setActiveTab('preview');
      } else {
        setActiveTab('code');
      }
      setConsoleLogs([]);
    }
  }, [artifact?.id]);

  if (!artifact) return null;

  const handleCopy = () => {
    triggerHaptic(15);
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    triggerHaptic(20);
    const extensions: { [key: string]: string } = {
      html: 'html',
      typescript: 'tsx',
      javascript: 'js',
      python: 'py',
      css: 'css',
      json: 'json',
      markdown: 'md',
      svg: 'svg',
    };
    const ext = extensions[artifact.language] || 'txt';
    const safeTitle = artifact.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const filename = `${safeTitle}.${ext}`;

    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefreshPreview = () => {
    triggerHaptic(10);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildSandboxDoc(artifact.content);
    }
  };

  const buildSandboxDoc = (content: string) => {
    if (artifact.type === 'svg') {
      return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { margin:0; background:#131314; display:flex; align-items:center; justify-content:center; height:100vh; overflow:hidden; }</style></head><body>${content}</body></html>`;
    }

    const bridgeScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          function sendLog(type, args) {
            try {
              const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: type, msg: msg }, '*');
            } catch (e) {}
          }

          console.log = function() { sendLog('log', arguments); originalLog.apply(console, arguments); };
          console.error = function() { sendLog('error', arguments); originalError.apply(console, arguments); };
          console.warn = function() { sendLog('warn', arguments); originalWarn.apply(console, arguments); };

          window.onerror = function(msg, url, line) {
            sendLog('error', [msg + ' (line ' + line + ')']);
          };
        })();
      </script>
    `;

    if (content.includes('<head>')) {
      return content.replace('<head>', `<head>${bridgeScript}`);
    } else if (content.includes('<html>')) {
      return content.replace('<html>', `<html><head>${bridgeScript}</head>`);
    } else {
      return `<!DOCTYPE html><html><head>${bridgeScript}<meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${content}</body></html>`;
    }
  };

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs((prev) => [...prev.slice(-49), { type: e.data.level, msg: e.data.msg, time }]);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const lines = artifact.content.split('\n');

  return (
    <div
      className={`flex flex-col bg-[#131314] border-[#3c4043]/60 text-[#e3e3e3] z-40 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50'
          : isMobileSheet
          ? 'fixed inset-x-0 bottom-0 top-14 md:top-0 md:relative md:inset-auto md:w-1/2 md:border-l rounded-t-3xl md:rounded-none shadow-2xl md:shadow-none'
          : 'relative w-full h-full border-l'
      }`}
    >
      {/* Top Bar (Complexity Canvas Header) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <ComplexityPrism className="w-4 h-4 shrink-0" size={18} />
          <div className="truncate">
            <h3 className="text-xs font-semibold text-zinc-100 truncate">{artifact.title}</h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              {artifact.language} · Complexity Canvas
            </span>
          </div>
        </div>

        {/* View Tabs - Clean segmented control */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {(artifact.type === 'html-preview' || artifact.type === 'svg') && (
            <button
              onClick={() => { triggerHaptic(10); setActiveTab('preview'); }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                activeTab === 'preview'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => { triggerHaptic(10); setActiveTab('code'); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Code</span>
          </button>

          {(artifact.type === 'html-preview' || artifact.type === 'svg') && (
            <button
              onClick={() => { triggerHaptic(10); setActiveTab('console'); }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                activeTab === 'console'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Logs</span>
              {consoleLogs.length > 0 && (
                <span className="text-[10px] font-mono text-cyan-400">({consoleLogs.length})</span>
              )}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {activeTab === 'preview' && (
            <button
              onClick={handleRefreshPreview}
              className="p-1.5 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition"
              title="Reload Preview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition"
            title="Download File to Android"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:inline-flex p-1.5 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition ml-1"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-[#131314]">
        {/* Preview Frame */}
        {activeTab === 'preview' && (
          <iframe
            ref={iframeRef}
            srcDoc={buildSandboxDoc(artifact.content)}
            title={artifact.title}
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full h-full border-none bg-[#131314]"
          />
        )}

        {/* Code Viewer */}
        {activeTab === 'code' && (
          <div className="w-full h-full overflow-auto font-mono text-xs leading-relaxed p-4 bg-[#131314] select-text">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-[#1e1f20]/60">
                    <td className="w-10 pr-4 text-right text-[#52565a] select-none text-[11px] align-top">
                      {idx + 1}
                    </td>
                    <td className="text-[#e3e3e3] whitespace-pre font-mono">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Console Logs */}
        {activeTab === 'console' && (
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs space-y-2 bg-[#131314]">
            <div className="flex items-center justify-between pb-2 border-b border-[#3c4043] text-[#8e918f] text-[11px]">
              <span>CANVAS RUNTIME CONSOLE</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="hover:text-white text-[11px]"
              >
                Clear
              </button>
            </div>
            {consoleLogs.length === 0 ? (
              <p className="text-[#8e918f] italic pt-2">No runtime messages recorded. Output from console.log or errors will appear here.</p>
            ) : (
              consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 py-1 px-2.5 rounded-lg ${
                    log.type === 'error'
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-900/40'
                      : log.type === 'warn'
                      ? 'bg-amber-950/40 text-amber-300 border border-amber-900/40'
                      : 'bg-[#1e1f20] text-[#c4c7c5]'
                  }`}
                >
                  <span className="text-[10px] text-[#8e918f] shrink-0">{log.time}</span>
                  <span className="font-semibold uppercase text-[10px] shrink-0 text-[#a8c7fa]">{log.type}:</span>
                  <span className="break-all whitespace-pre-wrap">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
