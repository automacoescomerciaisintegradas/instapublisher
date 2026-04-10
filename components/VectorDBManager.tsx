'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Upload, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  Loader2, 
  Tag, 
  Clock, 
  File,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { getEmbedding, describeContent } from '@/lib/vector-db/gemini-service';
import { VectorEntry, SearchResult, ContentType } from '@/lib/vector-db/types';
import { cosineSimilarity } from '@/lib/vector-db/similarity';
import { chunkText } from '@/lib/vector-db/content-processor';

export default function VectorDBManager() {
  const [activeTab, setActiveTab] = useState<'ingest' | 'search' | 'list'>('ingest');
  const [contentType, setContentType] = useState<ContentType>('text');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [vectors, setVectors] = useState<VectorEntry[]>([]);
  const [isLoadingVectors, setIsLoadingVectors] = useState(false);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchVectors();
    }
  }, [activeTab]);

  const fetchVectors = async () => {
    setIsLoadingVectors(true);
    try {
      const response = await fetch('/api/vectors/list');
      const data = await response.json();
      if (data.success) {
        setVectors(data.vectors);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoadingVectors(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      if (!title) setTitle(e.target.files[0].name);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const ingestContent = async () => {
    if (!title) {
      setStatus({ type: 'error', message: 'Título é obrigatório' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: null, message: 'Processando conteúdo...' });

    try {
      let contentToEmbed = textContent;
      let originalContent = textContent;

      if (contentType !== 'text' && file) {
        const base64 = await fileToBase64(file);
        if (contentType === 'image' || contentType === 'video') {
          setStatus({ type: null, message: 'Gerando descrição com Gemini Vision...' });
          contentToEmbed = await describeContent(base64, file.type, contentType);
          originalContent = `[${contentType.toUpperCase()}] ${contentToEmbed}`;
        } else if (contentType === 'document') {
          // Simplificação: trata documento como texto se for .txt ou similar
          // Em produção usaria uma lib para extrair texto de PDF/DOCX
          const text = await file.text();
          contentToEmbed = text;
          originalContent = text;
        }
      }

      setStatus({ type: null, message: 'Gerando embeddings...' });
      
      // Se for documento longo, podemos fazer chunking
      const chunks = contentType === 'document' ? chunkText(contentToEmbed) : [contentToEmbed];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await getEmbedding(chunk);
        
        const entry: VectorEntry = {
          metadata: {
            id: `${Date.now()}-${i}`,
            type: contentType,
            title: chunks.length > 1 ? `${title} (Parte ${i+1})` : title,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            createdAt: new Date().toISOString(),
            originalContent: chunks.length > 1 ? chunk : originalContent,
            mimeType: file?.type
          },
          embedding
        };

        setStatus({ type: null, message: `Salvando vetor ${i+1}/${chunks.length} no R2...` });
        const response = await fetch('/api/vectors/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });

        if (!response.ok) throw new Error('Falha ao salvar no R2');
      }

      setStatus({ type: 'success', message: 'Conteúdo ingerido com sucesso!' });
      setTitle('');
      setTextContent('');
      setFile(null);
      setTags('');
    } catch (error: any) {
      console.error('Ingest error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const queryEmbedding = await getEmbedding(searchQuery);
      
      // Busca local (fetch all vectors and compare)
      const response = await fetch('/api/vectors/list');
      const data = await response.json();
      
      if (data.success) {
        const results: SearchResult[] = data.vectors.map((v: VectorEntry) => ({
          ...v,
          similarity: cosineSimilarity(queryEmbedding, v.embedding)
        }));

        // Ordenar por similaridade e filtrar
        const sortedResults = results
          .filter(r => r.similarity > 0.5)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 10);

        setSearchResults(sortedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const deleteEntry = async (type: string, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este vetor?')) return;

    try {
      const response = await fetch(`/api/vectors/delete?type=${type}&id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchVectors();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans">
      <header className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gemini Vector DB</h1>
            <p className="text-zinc-500 mt-1">Embeddings 2 + Cloudflare R2</p>
          </div>
        </div>
        
        <nav className="flex bg-zinc-100 p-1 rounded-xl">
          {[
            { id: 'ingest', label: 'Ingestão', icon: <Plus className="w-4 h-4" /> },
            { id: 'search', label: 'Busca', icon: <Search className="w-4 h-4" /> },
            { id: 'list', label: 'Explorar', icon: <Database className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'ingest' && (
              <motion.div
                key="ingest"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'text', label: 'Texto', icon: <FileText className="w-4 h-4" /> },
                    { id: 'image', label: 'Imagem', icon: <ImageIcon className="w-4 h-4" /> },
                    { id: 'video', label: 'Vídeo', icon: <Video className="w-4 h-4" /> },
                    { id: 'document', label: 'Doc', icon: <File className="w-4 h-4" /> }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setContentType(type.id as ContentType)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        contentType === type.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-zinc-100 hover:border-zinc-200 text-zinc-500'
                      }`}
                    >
                      {type.icon}
                      <span className="text-xs font-bold">{type.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Título do Conteúdo</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Relatório de Vendas Q1"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  {contentType === 'text' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Conteúdo de Texto</label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Insira o texto para gerar o embedding..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Upload de Arquivo</label>
                      <div className="relative group">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept={contentType === 'image' ? 'image/*' : contentType === 'video' ? 'video/*' : '.txt,.pdf,.docx'}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 flex flex-col items-center gap-4 group-hover:border-indigo-300 transition-all">
                          <div className="p-4 bg-zinc-50 rounded-full text-zinc-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                            <Upload className="w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-zinc-900">
                              {file ? file.name : `Clique ou arraste seu arquivo ${contentType}`}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Formatos suportados: JPG, PNG, MP4, TXT'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tags (separadas por vírgula)</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="ia, tecnologia, 2024"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={ingestContent}
                  disabled={isProcessing || (!textContent && !file)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      Gerar Embedding e Salvar no R2
                    </>
                  )}
                </button>

                {status.type && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-2xl flex items-center gap-3 ${
                      status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{status.message}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                      placeholder="O que você está procurando? (Busca Semântica)"
                      className="w-full pl-16 pr-6 py-5 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                    />
                    <button
                      onClick={performSearch}
                      disabled={isSearching || !searchQuery}
                      className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, idx) => (
                      <motion.div
                        key={result.metadata.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                              {result.metadata.type === 'text' && <FileText className="w-6 h-6" />}
                              {result.metadata.type === 'image' && <ImageIcon className="w-6 h-6" />}
                              {result.metadata.type === 'video' && <Video className="w-6 h-6" />}
                              {result.metadata.type === 'document' && <File className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-zinc-900">{result.metadata.title}</h3>
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                                  {Math.round(result.similarity * 100)}% Match
                                </span>
                              </div>
                              <p className="text-sm text-zinc-500 line-clamp-2 mt-1 italic">
                                {result.metadata.originalContent}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase">
                                  <Clock className="w-3 h-3" />
                                  {new Date(result.metadata.createdAt).toLocaleDateString()}
                                </div>
                                {result.metadata.tags?.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button className="p-2 text-zinc-300 hover:text-indigo-600 transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : searchQuery && !isSearching ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 border-dashed">
                      <Search className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                      <p className="text-zinc-500 font-medium">Nenhum resultado encontrado para sua busca.</p>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {activeTab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {isLoadingVectors ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-200">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-zinc-500 font-medium">Carregando banco de dados...</p>
                  </div>
                ) : vectors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vectors.map(vector => (
                      <div key={vector.metadata.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg ${
                            vector.metadata.type === 'text' ? 'bg-blue-50 text-blue-600' :
                            vector.metadata.type === 'image' ? 'bg-purple-50 text-purple-600' :
                            vector.metadata.type === 'video' ? 'bg-red-50 text-red-600' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                            {vector.metadata.type === 'text' && <FileText className="w-4 h-4" />}
                            {vector.metadata.type === 'image' && <ImageIcon className="w-4 h-4" />}
                            {vector.metadata.type === 'video' && <Video className="w-4 h-4" />}
                            {vector.metadata.type === 'document' && <File className="w-4 h-4" />}
                          </div>
                          <button 
                            onClick={() => deleteEntry(vector.metadata.type, vector.metadata.id)}
                            className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-bold text-zinc-900 truncate">{vector.metadata.title}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-1 h-8">
                          {vector.metadata.originalContent}
                        </p>
                        <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(vector.metadata.createdAt).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            {vector.metadata.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] font-bold text-indigo-500">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 border-dashed">
                    <Database className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">O banco de dados está vazio.</p>
                    <button onClick={() => setActiveTab('ingest')} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Começar Ingestão</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              Como Funciona
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">1</div>
                <div>
                  <p className="text-sm font-bold">Geração de Vetores</p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Textos são enviados ao Gemini Embeddings 2. Imagens e vídeos são primeiro descritos pelo Gemini Vision.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">2</div>
                <div>
                  <p className="text-sm font-bold">Armazenamento R2</p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Os vetores (arrays de 768 dimensões) e metadados são salvos como JSON no Cloudflare R2.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">3</div>
                <div>
                  <p className="text-sm font-bold">Busca Semântica</p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Sua busca é convertida em vetor e comparada com o banco usando Similaridade por Cosseno.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold uppercase">Status do Banco</span>
                <span className="flex items-center gap-1.5 text-green-400 font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Vetores</p>
                <p className="text-2xl font-black text-zinc-900">{vectors.length}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Dimensões</p>
                <p className="text-2xl font-black text-zinc-900">768</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
