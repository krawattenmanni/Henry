import React, { useState } from 'react';
import { ProjectFile } from '../types';
import JSZip from 'jszip';
import { ComplexityPrism } from './ComplexityPrism';
import {
  X,
  Plus,
  Trash2,
  Upload,
  FileCode,
  Save,
  Check,
  FolderArchive,
} from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSaveFiles: (files: ProjectFile[]) => void;
}

export const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({
  isOpen,
  onClose,
  files,
  onSaveFiles,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [editingContent, setEditingContent] = useState<string>(files[0]?.content || '');
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileUploadRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];

  const handleSelectFile = (file: ProjectFile) => {
    triggerHaptic(10);
    setSelectedFileId(file.id);
    setEditingContent(file.content);
    setIsCreating(false);
  };

  const handleSaveCurrentFile = () => {
    if (!currentFile) return;
    triggerHaptic(15);
    const updated = files.map((f) =>
      f.id === currentFile.id
        ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now() }
        : f
    );
    onSaveFiles(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    triggerHaptic(15);
    const name = newFileName.trim();
    const ext = name.split('.').pop() || 'txt';
    const langMap: { [key: string]: string } = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      sql: 'sql',
    };
    const language = langMap[ext] || 'text';

    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name,
      language,
      content: `// ${name}\n`,
      size: name.length,
      lastModified: Date.now(),
    };

    const updated = [...files, newFile];
    onSaveFiles(updated);
    setSelectedFileId(newFile.id);
    setEditingContent(newFile.content);
    setNewFileName('');
    setIsCreating(false);
  };

  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) {
      alert('You must keep at least one project file.');
      return;
    }
    triggerHaptic(15);
    const updated = files.filter((f) => f.id !== id);
    onSaveFiles(updated);
    if (selectedFileId === id) {
      setSelectedFileId(updated[0].id);
      setEditingContent(updated[0].content);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    triggerHaptic(15);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ext = uploaded.name.split('.').pop() || 'txt';
      const langMap: { [key: string]: string } = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        py: 'python',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        sql: 'sql',
      };

      const newFile: ProjectFile = {
        id: `file-${Date.now()}`,
        name: uploaded.name,
        language: langMap[ext] || 'text',
        content: text || '',
        size: text?.length || 0,
        lastModified: Date.now(),
      };

      const updated = [...files, newFile];
      onSaveFiles(updated);
      setSelectedFileId(newFile.id);
      setEditingContent(newFile.content);
    };
    reader.readAsText(uploaded);
  };

  const handleExportZip = async () => {
    triggerHaptic(20);
    const zip = new JSZip();
    files.forEach((f) => {
      zip.file(f.name, f.content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complexity-project-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-200">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <ComplexityPrism className="w-5 h-5" size={20} />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Complexity Workspace Files</h2>
              <p className="text-[11px] text-zinc-400">Offline files attached to conversation context</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131314] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#3c4043] text-xs font-medium transition"
              title="Download project as ZIP"
            >
              <FolderArchive className="w-3.5 h-3.5 text-[#a8c7fa]" />
              <span className="hidden sm:inline">Export ZIP</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-60 bg-[#131314] border-b md:border-b-0 md:border-r border-[#3c4043]/60 flex flex-col shrink-0">
            <div className="p-2.5 border-b border-[#3c4043]/40 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8e918f]">Explorer</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-1 rounded-md text-[#8e918f] hover:text-white hover:bg-[#1e1f20]"
                  title="New File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => fileUploadRef.current?.click()}
                  className="p-1 rounded-md text-[#8e918f] hover:text-white hover:bg-[#1e1f20]"
                  title="Upload from device"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileUploadRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Create file input */}
            {isCreating && (
              <div className="p-2 bg-[#1e1f20] border-b border-[#3c4043] space-y-1.5">
                <input
                  type="text"
                  placeholder="filename.ext"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#131314] border border-[#3c4043] rounded-lg text-xs text-white focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-0.5 text-[10px] text-[#8e918f] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFile}
                    className="px-2.5 py-0.5 text-[10px] bg-gradient-to-r from-[#4285F4] to-[#9B72CF] text-white rounded-md font-medium"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* Files List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-36 md:max-h-full">
              {files.map((file) => {
                const isSelected = file.id === currentFile?.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#1e1f20] text-white font-medium border border-[#3c4043]'
                        : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#a8c7fa]' : 'text-[#8e918f]'}`} />
                      <span className="truncate font-mono text-[11px]">{file.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#8e918f] hover:text-rose-400 rounded transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Editor Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#1e1f20]">
            {currentFile ? (
              <>
                <div className="px-4 py-2.5 border-b border-[#3c4043]/50 flex items-center justify-between shrink-0 bg-[#1e1f20]">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-white font-semibold">{currentFile.name}</span>
                    <span className="text-[10px] text-[#8e918f]">
                      ({editingContent.length} bytes · {editingContent.split('\n').length} lines)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {savedSuccess && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                    <button
                      onClick={handleSaveCurrentFile}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#4285F4] to-[#9B72CF] hover:opacity-90 text-white text-xs font-medium transition active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-2.5 min-h-0 bg-[#131314]">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full h-full bg-[#1e1f20] text-[#e3e3e3] font-mono text-xs p-3.5 rounded-2xl border border-[#3c4043] focus:outline-none focus:border-[#52565a] resize-none leading-relaxed select-text"
                    spellCheck={false}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#8e918f] text-xs">
                Select or create a file to view code
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
