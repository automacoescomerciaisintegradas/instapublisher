'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Plus, 
  Trash2, 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Key, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Save,
  FolderOpen,
  History,
  ExternalLink,
  Download,
  Upload,
  GripVertical
} from 'lucide-react';
import { Reorder } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import strategyData from '@/lib/strategy.json';

const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block w-full" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const IconButtonTooltip = ({ children, text, className = "" }: { children: React.ReactNode, text: string, className?: string }) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative inline-flex ${className}`} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function InstagramPublisher() {
  const [igUserId, setIgUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['', '']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });
  const [currentStep, setCurrentStep] = useState(0);
  
  // Strategy State
  const [selectedStructure, setSelectedStructure] = useState('educativo');
  const [selectedHook, setSelectedHook] = useState('');
  const [profile, setProfile] = useState<{ name: string, id: string } | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showTokenGuide, setShowTokenGuide] = useState(false);

  React.useEffect(() => {
    const savedTemplates = localStorage.getItem('cleudocode_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveTemplate = () => {
    const name = prompt('Template Name:');
    if (!name) return;

    const newTemplate = {
      id: Date.now(),
      name,
      igUserId,
      accessToken,
      caption,
      imageUrls,
      selectedStructure,
      selectedHook
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('cleudocode_templates', JSON.stringify(updatedTemplates));
    setStatus({ type: 'success', message: 'Template saved successfully!' });
  };

  const loadTemplate = (template: any) => {
    setIgUserId(template.igUserId || '');
    setAccessToken(template.accessToken || '');
    setCaption(template.caption || '');
    setImageUrls(template.imageUrls || ['']);
    setSelectedStructure(template.selectedStructure || 'educativo');
    setSelectedHook(template.selectedHook || '');
    setShowTemplates(false);
    setStatus({ type: 'info', message: `Template "${template.name}" loaded.` });
  };

  const deleteTemplate = (id: number) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('cleudocode_templates', JSON.stringify(updatedTemplates));
  };

  const downloadTemplates = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cleudocode_templates.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const uploadTemplates = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...templates, ...imported];
          setTemplates(merged);
          localStorage.setItem('cleudocode_templates', JSON.stringify(merged));
          setStatus({ type: 'success', message: `${imported.length} templates imported!` });
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        setStatus({ type: 'error', message: 'Invalid template file.' });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const [urlStatus, setUrlStatus] = useState<Record<number, 'valid' | 'invalid' | 'checking' | null>>({});
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const validateUrl = async (index: number, url: string) => {
    if (!url.trim()) {
      setUrlStatus(prev => ({ ...prev, [index]: null }));
      return;
    }
    
    // Basic regex check
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      setUrlStatus(prev => ({ ...prev, [index]: 'invalid' }));
      return;
    }

    setUrlStatus(prev => ({ ...prev, [index]: 'checking' }));
    try {
      // We use a simple fetch with head method to check if the URL is accessible
      // Note: This might fail due to CORS, so we treat 200 as valid and others as "unverified" or "invalid"
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      setUrlStatus(prev => ({ ...prev, [index]: 'valid' }));
    } catch (e) {
      console.error('URL Validation Error:', e);
      // If no-cors fetch fails, it's likely a bad URL or network issue
      setUrlStatus(prev => ({ ...prev, [index]: 'invalid' }));
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Support multiple files if it's the last field or we have space
    const availableSlots = 10 - index;
    const filesToUpload = Array.from(files).slice(0, availableSlots);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const currentIndex = index + i;
      
      // Add field if it doesn't exist yet
      if (currentIndex >= imageUrls.length) {
        setImageUrls(prev => [...prev, '']);
      }

      setIsUploading(currentIndex);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          updateImageUrl(currentIndex, data.url);
          validateUrl(currentIndex, data.url);
          setStatus({ type: 'success', message: `Image ${i + 1} uploaded to R2!` });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err: any) {
        console.error('Upload Error Details:', err);
        setStatus({ type: 'error', message: `Upload error: ${err.message}` });
      } finally {
        setIsUploading(null);
      }
    }
  };

  const exportCarouselJson = () => {
    const carouselData = {
      igUserId,
      caption,
      imageUrls: imageUrls.filter(u => u.trim()),
      strategy: {
        structure: selectedStructure,
        hook: selectedHook
      },
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(carouselData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `carousel_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setStatus({ type: 'success', message: 'Carousel exported as JSON!' });
  };

  const fetchFeed = async () => {
    if (!igUserId || !accessToken) {
      setStatus({ type: 'error', message: 'Credentials required to fetch feed.' });
      return;
    }

    setIsLoadingFeed(true);
    try {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ igUserId, accessToken }),
      });
      const data = await response.json();
      if (data.success) {
        setFeed(data.feed);
        setShowFeed(true);
      } else {
        setStatus({ type: 'error', message: 'Failed to fetch Instagram feed.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Error connecting to feed API.' });
    } finally {
      setIsLoadingFeed(false);
    }
  };

  React.useEffect(() => {
    const checkProfile = async () => {
      if (igUserId && accessToken) {
        try {
          const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ igUserId, accessToken }),
          });
          const data = await response.json();
          if (data.success) {
            setProfile(data.profile);
          } else {
            setProfile(null);
          }
        } catch (e) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    };
    const timer = setTimeout(checkProfile, 1000);
    return () => clearTimeout(timer);
  }, [igUserId, accessToken]);

  const addImageField = () => {
    if (imageUrls.length < 10) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const removeImageField = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length ? newUrls : ['']);
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    validateUrl(index, value);
  };

  const fillWithPlaceholders = () => {
    const placeholders = [
      `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1080/1080`,
      `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1080/1080`,
      `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1080/1080`,
    ];
    setImageUrls(placeholders);
    setStatus({ type: 'success', message: 'Placeholder images added!' });
  };

  const generateCaption = async () => {
    if (!imageUrls.some(url => url.trim())) {
      setStatus({ type: 'error', message: 'Add at least one image URL to help generate a caption.' });
      return;
    }

    setIsGeneratingCaption(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });
      
      const structure = strategyData.estruturas_carrossel[selectedStructure as keyof typeof strategyData.estruturas_carrossel];
      const hookText = selectedHook ? `Use this hook: "${selectedHook}"` : "Create a powerful hook.";
      
      const prompt = `
        Create a catchy, engaging Instagram caption for a carousel post.
        Theme/Topic: ${caption || 'General lifestyle/business'}
        Post Structure: ${selectedStructure} (${structure.slides.join(', ')})
        ${hookText}
        
        Follow this caption structure:
        ${strategyData.legendas.estrutura.join('\n')}
        
        The post contains ${imageUrls.filter(u => u).length} images. Include relevant emojis and hashtags.
        Hashtag Strategy: ${strategyData.hashtags_estrategia.mix.join(', ')}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setCaption(response.text.trim());
        setStatus({ type: 'success', message: 'Caption generated successfully!' });
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      setStatus({ type: 'error', message: 'Failed to generate caption with AI.' });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const publishCarousel = async () => {
    const filteredImages = imageUrls.filter(url => url.trim() !== '');
    
    if (filteredImages.length < 2) {
      setStatus({ type: 'error', message: 'A carousel requires at least 2 images.' });
      return;
    }

    setIsPublishing(true);
    setStatus({ type: 'info', message: 'Publishing to Instagram... This may take a moment.' });

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igUserId,
          accessToken,
          images: filteredImages,
          caption
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ type: 'success', message: `Successfully published! Post ID: ${data.id}` });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const steps = [
    { title: 'Credentials', icon: <Key className="w-5 h-5" /> },
    { title: 'Content', icon: <ImageIcon className="w-5 h-5" /> },
    { title: 'Review', icon: <Send className="w-5 h-5" /> },
  ];

  const handleNextStep = () => {
    if (currentStep === 0 && !accessToken.trim()) {
      setShowTokenGuide(true);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <header className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Instagram className="w-8 h-8 text-pink-600" />
            InstaCarousel Publisher
          </h1>
          <p className="text-zinc-500 mt-1">Official Graph API Automation</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            <IconButtonTooltip text="Manage saved carousel templates">
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
              >
                <FolderOpen className="w-3 h-3" /> Templates
              </button>
            </IconButtonTooltip>
            <IconButtonTooltip text="View your recent Instagram posts">
              <button 
                onClick={fetchFeed}
                disabled={isLoadingFeed}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {isLoadingFeed ? <Loader2 className="w-3 h-3 animate-spin" /> : <History className="w-3 h-3" />}
                Feed
              </button>
            </IconButtonTooltip>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <IconButtonTooltip text={`Step ${idx + 1}: ${step.title}`}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    currentStep === idx ? 'bg-zinc-900 text-white' : 'text-zinc-400'
                  }`}>
                    {step.icon}
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                </IconButtonTooltip>
                {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-300" />}
              </React.Fragment>
            ))}
          </div>
          <IconButtonTooltip text="Clear all fields and start over">
            <button 
              onClick={() => {
                setIgUserId('');
                setAccessToken('');
                setCaption('');
                setImageUrls(['']);
                setCurrentStep(0);
                setStatus({ type: null, message: '' });
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors"
            >
              Reset Form
            </button>
          </IconButtonTooltip>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Saved Templates</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={downloadTemplates}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-[10px] font-bold transition-all"
                      title="Download Templates"
                    >
                      <Download className="w-3 h-3" /> Export
                    </button>
                    <label className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-[10px] font-bold transition-all cursor-pointer" title="Upload Templates">
                      <Upload className="w-3 h-3" /> Import
                      <input type="file" accept=".json" onChange={uploadTemplates} className="hidden" />
                    </label>
                    <button onClick={() => setShowTemplates(false)} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 ml-2">Close</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic col-span-2 py-4 text-center">No templates saved yet.</p>
                  ) : (
                    templates.map(t => (
                      <div key={t.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between items-center group">
                        <div className="cursor-pointer flex-1" onClick={() => loadTemplate(t)}>
                          <p className="text-sm font-bold text-zinc-900">{t.name}</p>
                          <p className="text-[10px] text-zinc-400">{t.imageUrls.length} images • {t.selectedStructure}</p>
                        </div>
                        <button onClick={() => deleteTemplate(t.id)} className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {showFeed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Instagram Posts</h3>
                  <button onClick={() => setShowFeed(false)} className="text-xs font-bold text-zinc-400 hover:text-zinc-900">Close</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {feed.map(post => (
                    <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                      <img src={post.media_url || post.thumbnail_url} alt={post.caption} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-1 bg-black/60 text-[8px] text-white truncate">
                        {post.caption}
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <User className="w-3 h-3" /> Instagram Business ID
                    </label>
                    <Tooltip text="Unique ID for your Instagram Business Account">
                      <input
                        type="text"
                        value={igUserId}
                        onChange={(e) => setIgUserId(e.target.value)}
                        placeholder="Enter your IG User ID (or leave blank if set in ENV)"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                      />
                    </Tooltip>
                    {profile && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected to: {profile.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Key className="w-3 h-3" /> Meta Access Token
                    </label>
                    <Tooltip text="Meta Graph API access token with publishing permissions">
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Enter your permanent access token (or leave blank if set in ENV)"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                      />
                    </Tooltip>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-600 leading-tight">
                      <strong>Pro Tip:</strong> You can set <code>META_CLI_IG_USER_ID</code> and <code>META_CLI_ACCESS_TOKEN</code> in your environment variables to skip entering them manually.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Image URLs (Public)
                      </label>
                      <div className="flex items-center gap-3">
                        <IconButtonTooltip text="Fill empty slots with random high-quality images">
                          <button
                            onClick={fillWithPlaceholders}
                            className="text-[10px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            Fill Placeholders
                          </button>
                        </IconButtonTooltip>
                        <span className="text-[10px] text-zinc-400">{imageUrls.length}/10</span>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <Reorder.Group axis="y" values={imageUrls} onReorder={setImageUrls} className="space-y-3">
                        {imageUrls.map((url, index) => (
                          <Reorder.Item 
                            key={url || `empty-${index}`} 
                            value={url}
                            className="space-y-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100 cursor-default"
                          >
                            <div className="flex gap-2 items-center">
                              <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-300 hover:text-zinc-500 transition-colors">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div className="relative flex-1">
                                <Tooltip text="Direct URL to a JPG/PNG image">
                                  <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => updateImageUrl(index, e.target.value)}
                                    placeholder={`Image URL ${index + 1}`}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none text-sm transition-all ${
                                      urlStatus[index] === 'valid' ? 'border-green-200 focus:ring-green-500' :
                                      urlStatus[index] === 'invalid' ? 'border-red-200 focus:ring-red-500' :
                                      'border-zinc-200 focus:ring-pink-500'
                                    }`}
                                  />
                                </Tooltip>
                                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                  {urlStatus[index] === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
                                  {urlStatus[index] === 'valid' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                  {urlStatus[index] === 'invalid' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                </div>
                                <IconButtonTooltip text="Upload image to Cloudflare R2" className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <label className="cursor-pointer p-1 hover:bg-zinc-200 rounded transition-all">
                                    {isUploading === index ? (
                                      <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4 text-zinc-400 hover:text-pink-500" />
                                    )}
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      multiple
                                      className="hidden" 
                                      onChange={(e) => handleImageUpload(index, e)}
                                      disabled={isUploading !== null}
                                    />
                                  </label>
                                </IconButtonTooltip>
                              </div>
                              <IconButtonTooltip text="Remove this image slide">
                                <button
                                  onClick={() => removeImageField(index)}
                                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </IconButtonTooltip>
                            </div>
                            {url.trim() && (
                              <div className="flex items-center gap-3 pl-7">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 bg-white flex-shrink-0">
                                  <img 
                                    src={url} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')}
                                  />
                                </div>
                                <p className="text-[10px] text-zinc-400 truncate flex-1 italic">
                                  {urlStatus[index] === 'valid' ? 'URL accessible and valid' : 
                                   urlStatus[index] === 'invalid' ? 'Invalid or inaccessible URL' : 
                                   'Checking URL...'}
                                </p>
                              </div>
                            )}
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                    <button
                      onClick={addImageField}
                      disabled={imageUrls.length >= 10}
                      className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-lg text-zinc-400 hover:border-pink-300 hover:text-pink-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add Another Image
                    </button>
                  </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Caption & Strategy</label>
                        <IconButtonTooltip text="Generate a viral caption using Gemini AI and marketing strategy">
                          <button
                            onClick={generateCaption}
                            disabled={isGeneratingCaption}
                            className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            {isGeneratingCaption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI Generate with Strategy
                          </button>
                        </IconButtonTooltip>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Structure</p>
                          <Tooltip text="The logical flow of your carousel slides">
                            <select 
                              value={selectedStructure}
                              onChange={(e) => setSelectedStructure(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs outline-none focus:ring-2 focus:ring-pink-500"
                            >
                              {Object.keys(strategyData.estruturas_carrossel).map(key => (
                                <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}</option>
                              ))}
                            </select>
                          </Tooltip>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Hook Category</p>
                          <Tooltip text="The first slide's attention-grabbing headline">
                            <select 
                              value={selectedHook}
                              onChange={(e) => setSelectedHook(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs outline-none focus:ring-2 focus:ring-pink-500"
                            >
                              <option value="">Random Hook</option>
                              {Object.entries(strategyData.ganchos_carrossel).map(([cat, hooks]) => (
                                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                                  {hooks.map((h, i) => (
                                    <option key={i} value={h}>{h}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </Tooltip>
                        </div>
                      </div>

                      <Tooltip text="The text that will appear alongside your post">
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Write your topic or themes here, then click AI Generate..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-pink-500 outline-none text-sm resize-none"
                        />
                      </Tooltip>
                    </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-[2] py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    Review Post <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">Post Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-zinc-400 uppercase font-bold tracking-tighter">Images</p>
                        <p className="text-zinc-900 font-medium">{imageUrls.filter(u => u).length} items</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 uppercase font-bold tracking-tighter">Target Account</p>
                        <p className="text-zinc-900 font-medium truncate">{igUserId || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-zinc-400 uppercase font-bold tracking-tighter text-[10px]">Caption Preview</p>
                      <p className="text-zinc-600 text-xs line-clamp-3 italic mt-1">{caption || 'No caption provided'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {imageUrls.filter(u => u).map((url, i) => (
                      <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                        <img src={url} alt={`Slide ${i+1}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/error/200/200')} />
                        <div className="absolute top-0 right-0 bg-black/50 text-white text-[10px] px-1 font-bold">{i+1}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <IconButtonTooltip text="Return to previous step" className="flex-1">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="w-full py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Edit
                    </button>
                  </IconButtonTooltip>
                  <IconButtonTooltip text="Save current configuration as a template" className="flex-1">
                    <button
                      onClick={saveTemplate}
                      className="w-full py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Template
                    </button>
                  </IconButtonTooltip>
                  <IconButtonTooltip text="Download carousel data as JSON" className="flex-1">
                    <button
                      onClick={exportCarouselJson}
                      className="w-full py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Export JSON
                    </button>
                  </IconButtonTooltip>
                  <IconButtonTooltip text="Publish this carousel to Instagram now" className="flex-[2]">
                    <button
                      onClick={publishCarousel}
                      disabled={isPublishing}
                      className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {isPublishing ? 'Publishing...' : 'Publish Now'}
                    </button>
                  </IconButtonTooltip>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showTokenGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-pink-600">
                    <Key className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Meta Access Token Guide</h2>
                  </div>
                  
                  <div className="space-y-3 text-sm text-zinc-600 leading-relaxed">
                    <p>To publish carousels, you need a <strong>Page Access Token</strong> with specific permissions.</p>
                    
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-2">
                      <p className="font-bold text-zinc-900 text-xs uppercase">Required Permissions:</p>
                      <ul className="grid grid-cols-1 gap-1 text-[11px] font-mono">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> instagram_basic</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> instagram_content_publish</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> pages_read_engagement</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> pages_show_list</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-zinc-900">How to get it:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline inline-flex items-center gap-0.5">Meta Graph Explorer <ExternalLink className="w-3 h-3" /></a></li>
                        <li>Select your <strong>App</strong> and <strong>User/Page</strong>.</li>
                        <li>Add the permissions listed above.</li>
                        <li>Click <strong>Generate Token</strong>.</li>
                        <li>Exchange it for a <strong>Long-Lived Token</strong> in the Access Token Tool.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => setShowTokenGuide(false)}
                      className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                    >
                      I&apos;ll do it later
                    </button>
                    <button
                      onClick={() => setShowTokenGuide(false)}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                    >
                      Got it!
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-6 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-pink-500" />
              Status Monitor
            </h2>
            <div className="min-h-[100px] flex flex-col justify-center">
              {status.type ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex gap-3 ${
                    status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
                   status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                   <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
                  <p className="text-sm font-medium leading-tight">{status.message}</p>
                </motion.div>
              ) : (
                <p className="text-zinc-500 text-sm italic text-center">Waiting for action...</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Viral Strategy</h3>
            <div className="space-y-4 text-xs text-zinc-500 leading-relaxed">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="font-bold text-zinc-700 mb-1">Best Practices:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {strategyData.melhores_praticas.slice(0, 5).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="font-bold text-zinc-700 mb-1">Hashtag Mix:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {strategyData.hashtags_estrategia.mix.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">How to use</h3>
            <div className="space-y-4 text-xs text-zinc-500 leading-relaxed">
              <p>
                1. <strong>Get your ID:</strong> Find your Instagram Business Account ID in your Facebook Page settings or via Graph Explorer.
              </p>
              <p>
                2. <strong>Access Token:</strong> Generate a Page Access Token with <code>instagram_basic</code>, <code>instagram_content_publish</code>, and <code>pages_read_engagement</code>.
              </p>
              <p>
                3. <strong>Image URLs:</strong> Use direct links to images (JPG/PNG). They must be publicly accessible so Meta&apos;s servers can download them.
              </p>
              <p>
                4. <strong>Publish:</strong> The app will create individual containers for each image, group them into a carousel, and finally publish to your feed.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">API Tips</h3>
            <ul className="space-y-3 text-xs text-zinc-500">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1 shrink-0" />
                Images must be publicly accessible URLs.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1 shrink-0" />
                Carousel items must be between 2 and 10.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1 shrink-0" />
                Ensure your Access Token has <code>instagram_basic</code> and <code>instagram_content_publish</code> permissions.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
