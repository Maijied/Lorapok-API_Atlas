import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Folder, Play, Book, Terminal, Github, Copy, ExternalLink, Code, Check, ChevronDown, ChevronRight, Download, Video } from 'lucide-react'
import apiCollection from './data/api_collection.json'
import axios from 'axios'

interface ApiItem {
  name: string;
  description?: string;
  authLink?: string;
  request?: {
    method: string;
    url: {
      raw: string;
    }
  };
  item?: ApiItem[];
}

const HtmlVisualizer = ({ html, baseUrl }: { html: string, baseUrl?: string }) => {
  // Inject <base> tag to fix relative assets like images and styles
  const processedHtml = baseUrl 
    ? html.replace('<head>', `<head><base href="${baseUrl}">`)
    : html;

  return (
    <div className="mt-4 border border-white border-opacity-10 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
          <Globe size={12} /> Web Preview
        </span>
        <span className="text-[10px] text-gray-400">Rendered HTML Content</span>
      </div>
      <iframe 
        srcDoc={processedHtml} 
        className="w-full h-[400px] border-none"
        title="HTML Preview"
        sandbox="allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

const ImagePreview = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-2 inline-flex items-center gap-2 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 text-blue-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-opacity-20 transition-all transition-colors break-all"
      >
        Open Link <ExternalLink size={12} />
      </a>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group mt-2 max-w-sm">
      <img 
        src={url} 
        alt="API Data" 
        onError={() => setError(true)}
        className="rounded-lg shadow-lg border border-white border-opacity-10 max-h-80 object-contain bg-white bg-opacity-5" 
      />
      <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
         <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    </motion.div>
  );
};

const VideoVisualizer = ({ url }: { url: string }) => {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  let embedUrl = url;
  if (isYouTube) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    }
  }

  return (
    <div className="mt-2 bg-white bg-opacity-5 p-3 rounded-lg border border-white border-opacity-10 flex flex-col gap-2 max-w-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
        <Video size={12} /> {isYouTube ? 'YouTube Embed' : 'Video Preview'}
      </div>
      {isYouTube ? (
        <iframe
          className="rounded shadow-lg w-full aspect-video border-none"
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <video controls className="rounded shadow-lg w-full">
          <source src={url} />
        </video>
      )}
    </div>
  );
};

const BinaryImageVisualizer = ({ data }: { data: string }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (typeof data !== 'string') return;
    
    // If it's already a data URL, use it directly
    if (data.startsWith('data:image/')) {
      setSrc(data);
      return;
    }

    try {
      // Basic magic byte detection for raw binary strings
      const isPng = data.includes('PNG') || data.startsWith('\x89PNG');
      const isJpg = data.includes('JFIF') || data.startsWith('\xFF\xD8\xFF');
      const isGif = data.startsWith('GIF');

      if (isPng || isJpg || isGif) {
        const bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          bytes[i] = data.charCodeAt(i) & 0xFF;
        }
        const blob = new Blob([bytes], { type: isPng ? 'image/png' : isJpg ? 'image/jpeg' : 'image/gif' });
        const url = URL.createObjectURL(blob);
        setSrc(url);
        return () => URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Binary image conversion failed", e);
    }
  }, [data]);

  if (!src) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 border border-white border-opacity-10 rounded-lg overflow-hidden bg-white p-6 flex flex-col items-center gap-4 shadow-xl">
      <div className="bg-gray-100 px-4 py-2 w-full -mt-6 -mx-6 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
           Visual Result (Image)
        </span>
      </div>
      <img src={src} alt="Visual API Result" className="max-w-full max-h-[400px] shadow-sm rounded border border-gray-100 bg-gray-50" />
      <div className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
        {data.startsWith('data:') ? 'Data URL' : 'Binary Data'} Detected
      </div>
    </motion.div>
  );
};

const DataVisualizer = ({ data, baseUrl }: { data: any, baseUrl?: string }) => {
  if (data === null || data === undefined || data === '') {
    return <span className="text-gray-500 italic text-xs">N/A</span>;
  }

  // Detect HTML string
  const isHtml = (val: any) => typeof val === 'string' && (val.trim().startsWith('<!DOCTYPE html>') || val.trim().startsWith('<html') || val.includes('<body'));
  
  // Detect Binary Image or Data URL
  const isBinaryImage = (val: any) => typeof val === 'string' && (
    val.startsWith('data:image/') || 
    val.includes('PNG') || 
    val.includes('JFIF') || 
    val.startsWith('\x89PNG') || 
    (val.length > 100 && val.includes('IHDR'))
  );

  if (isHtml(data)) {
    return <HtmlVisualizer html={data} baseUrl={baseUrl} />;
  }

  if (isBinaryImage(data)) {
    return <BinaryImageVisualizer data={data} />;
  }

  // Handle primitives directly
  if (typeof data !== 'object') {
     return renderPrimitive(data);
  }

  if (Object.keys(data).length === 0) {
    return <span className="text-gray-500 italic text-xs">Empty Object</span>;
  }

  function renderPrimitive(val: any, key?: string) {
    const isUrl = (v: any) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'));
    
    // Stricter Image Detection: Only match explicit image extensions or known image hosts
    const isImageUrl = (url: string, _k?: string) => {
      if (!isUrl(url)) return false;
      if (url.startsWith('data:image/')) return true;
      
      const isExplicitImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp|ico)$/i) != null;
      const isKnownService = url.includes('images.unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder.com') || url.includes('robohash.org') || url.includes('catfact.ninja');
      
      // Never match pages, git repos, or blobs as images
      const isForbidden = url.match(/\.(git|pdf|zip|gz|exe|dmg|html|htm|php|asp|aspx)$/i) != null || url.includes('/blob/') || url.includes('/tree/') || url.includes('curid=');
      
      return (isExplicitImage || isKnownService) && !isForbidden;
    };

    const isAudioUrl = (url: string, k?: string) => {
      if (!isUrl(url)) return false;
      const isAudioExt = url.match(/\.(mp3|wav|ogg)$/i) != null;
      const isAudioKey = k && (k.toLowerCase().includes('audio') || k.toLowerCase().includes('sound') || k.toLowerCase().includes('voice'));
      return isAudioExt || (isAudioKey && url.startsWith('http'));
    };

    const isVideoUrl = (url: string, k?: string) => {
      if (!isUrl(url)) return false;
      const isVideoExt = url.match(/\.(mp4|webm|ogg)$/i) != null;
      const isYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/embed/');
      const isVideoKey = k && (k.toLowerCase().includes('video') || k.toLowerCase().includes('movie') || k.toLowerCase().includes('clip'));
      return isVideoExt || isYouTube || (isVideoKey && url.startsWith('http'));
    };

    if (isImageUrl(val, key)) {
      return <ImagePreview url={val} />;
    }

    if (isAudioUrl(val, key)) {
      return (
        <div className="mt-2 bg-white bg-opacity-5 p-3 rounded-lg border border-white border-opacity-10 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-xs font-bold text-gray-400"><Play size={12}/> Audio Preview</div>
           <audio controls className="h-8 w-full max-w-xs">
              <source src={val} />
           </audio>
        </div>
      );
    }

    if (isVideoUrl(val, key)) {
      return <VideoVisualizer url={val} />;
    }

    if (isUrl(val)) {
      return (
        <a 
          href={val} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-1 inline-flex items-center gap-2 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 text-blue-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-opacity-20 transition-all transition-colors break-all"
        >
          Open Link <ExternalLink size={12} />
        </a>
      );
    }
    
    return <span className="text-lorapok-green font-mono break-all">{String(val)}</span>;
  }

  if (Array.isArray(data)) {
    const isPrimitiveArray = data.every(item => typeof item !== 'object' || item === null);
    if (isPrimitiveArray) {
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {data.map((item, i) => (
            <span key={i} className="bg-lorapok-green bg-opacity-10 border border-lorapok-green border-opacity-20 px-2 py-0.5 rounded text-xs font-mono text-lorapok-green">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {data.slice(0, 10).map((item, i) => (
          <div key={i} className="bg-white bg-opacity-5 p-4 rounded-lg border border-white border-opacity-10">
            <DataVisualizer data={item} baseUrl={baseUrl} />
          </div>
        ))}
        {data.length > 10 && <div className="text-xs text-gray-500 italic">... and {data.length - 10} more items</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => {
        if (typeof value === 'string' && value.length > 1500) return null;
        return (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
            <div className="text-sm">
              {typeof value === 'object' && value !== null ? (
                <div className="bg-white bg-opacity-5 p-3 rounded border border-white border-opacity-5">
                   <DataVisualizer data={value} baseUrl={baseUrl} />
                </div>
              ) : renderPrimitive(value, key)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CodeSnippets = ({ api }: { api: ApiItem }) => {
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);
  const url = api.request?.url?.raw || '';
  const method = api.request?.method || 'GET';

  const snippets: Record<string, string> = {
    curl: `curl --request ${method} \\\n  --url '${url}' \\\n  --header 'Accept: application/json'`,
    javascript: `fetch('${url}', {\n  method: '${method}',\n  headers: {\n    'Accept': 'application/json'\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`,
    python: `import requests\n\nurl = '${url}'\nheaders = {'Accept': 'application/json'}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
    go: `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n\t"io/ioutil"\n)\n\nfunc main() {\n\turl := "${url}"\n\treq, _ := http.NewRequest("${method}", url, nil)\n\treq.Header.Add("Accept", "application/json")\n\tres, _ := http.DefaultClient.Do(req)\n\tdefer res.Body.Close()\n\tbody, _ := ioutil.ReadAll(res.Body)\n\tfmt.Println(string(body))\n}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {Object.keys(snippets).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-all ${
                lang === l ? 'bg-lorapok-green text-black' : 'bg-white bg-opacity-5 text-gray-400 hover:bg-opacity-10'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={copyToClipboard} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
          {copied ? <Check size={14} className="text-lorapok-green" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-black bg-opacity-40 p-4 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto custom-scrollbar border border-white border-opacity-5">
        {snippets[lang]}
      </pre>
    </div>
  );
};

const ResponseSection = ({ data, isLoading, apiName, baseUrl }: { data: any, isLoading: boolean, apiName: string, baseUrl?: string }) => {
  const [visualizerOpen, setVisualizerOpen] = useState(true);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${apiName.replace(/\s+/g, '_').toLowerCase()}_response.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lorapok-green"></div>
        <p className="text-sm">Fetching data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <Play size={40} className="opacity-20" />
        <p className="text-sm">Click "Run Test" to see live results</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Visualizer Toggle */}
      <div className="flex flex-col border-b border-white border-opacity-10">
        <button 
          onClick={() => setVisualizerOpen(!visualizerOpen)}
          className="p-4 flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-lorapok-green" />
            <span className="text-sm font-bold uppercase tracking-wider">Live Visualizer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadJson} title="Download JSON" className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-400 hover:text-white transition-all">
               <Download size={14} />
            </button>
            {visualizerOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </button>
        <AnimatePresence>
          {visualizerOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black bg-opacity-40"
            >
              <div className="p-6 overflow-y-auto max-h-[500px] custom-scrollbar">
                <DataVisualizer data={data} baseUrl={baseUrl} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Raw JSON Toggle */}
      <div className="flex flex-col">
        <button 
          onClick={() => setJsonOpen(!jsonOpen)}
          className="p-4 flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code size={16} className="text-blue-400" />
            <span className="text-sm font-bold uppercase tracking-wider">Raw JSON Response</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={copyToClipboard} 
              title="Copy JSON" 
              className={`p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-all ${copied ? 'text-lorapok-green' : 'text-gray-400 hover:text-white'}`}
            >
               {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); downloadJson(); }} title="Download JSON" className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-400 hover:text-white transition-all">
               <Download size={14} />
            </button>
            {jsonOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </button>
        <AnimatePresence>
          {jsonOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black bg-opacity-60"
            >
              <div className="p-6 overflow-y-auto max-h-[500px] custom-scrollbar">
                <pre className="text-xs font-mono text-green-400">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function App() {
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<'idle' | 'happy' | 'thinking' | 'sad'>('idle')

  const handleTestApi = async (api: ApiItem) => {
    if (!api.request?.url?.raw) return
    
    setIsLoading(true)
    setStatus('thinking')
    setSelectedApi(api)
    setTestResult(null)
    
    try {
      const response = await axios.get(api.request.url.raw, {
        responseType: 'arraybuffer'
      })
      
      const rawContentType = response.headers['content-type'];
      const contentType = typeof rawContentType === 'string' ? rawContentType : '';
      
      if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
        const blob = new Blob([response.data], { type: contentType || 'image/png' })
        const reader = new FileReader()
        reader.onloadend = () => {
          setTestResult(reader.result)
          setStatus('happy')
        }
        reader.readAsDataURL(blob)
      } else {
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(response.data)
        try {
          setTestResult(JSON.parse(text))
        } catch {
          setTestResult(text)
        }
        setStatus('happy')
      }
    } catch (error: any) {
      setTestResult({ error: error.message })
      setStatus('sad')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-lorapok-dirt to-black flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-lorapok-green rounded-full flex items-center justify-center shadow-lg">
             <span className="text-2xl">🐛</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Lorapok <span className="text-lorapok-green">API Atlas</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-2 hover:text-lorapok-green transition-colors">
            <Github size={20} />
            <span>Star on GitHub</span>
          </a>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Explorer */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search APIs..." 
                className="w-full bg-black bg-opacity-30 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-lorapok-green transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="glass p-4 h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
            {apiCollection.item.map((category: any, idx) => {
              const filteredApis = category.item?.filter((api: any) => 
                api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.name.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (searchTerm && filteredApis?.length === 0) return null;

              return (
                <div key={idx} className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Folder size={14} />
                    {category.name}
                  </h3>
                  <div className="space-y-1">
                    {(filteredApis || category.item)?.map((api: any, apiIdx: number) => (
                      <button 
                        key={apiIdx}
                        onClick={() => {
                          setSelectedApi(api);
                          setTestResult(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between group ${
                          selectedApi?.name === api.name ? 'bg-lorapok-green bg-opacity-20 text-lorapok-green' : 'hover:bg-white hover:bg-opacity-5 text-gray-300'
                        }`}
                      >
                        <span className="truncate">{api.name}</span>
                        <Play size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedApi?.name === api.name ? 'opacity-100' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {selectedApi ? (
              <motion.div 
                key={selectedApi.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-6 flex-1"
              >
                {/* API Detail Card */}
                <div className="glass p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{selectedApi.name}</h2>
                      <p className="text-gray-400 max-w-2xl">{selectedApi.description || "A powerful open-source API for your next project."}</p>
                    </div>
                    <button 
                      onClick={() => handleTestApi(selectedApi)}
                      disabled={isLoading}
                      className="bg-lorapok-green hover:bg-lorapok-leaf text-black font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? 'Running...' : 'Run Test'}
                      <Play size={18} fill="currentColor" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="bg-black bg-opacity-30 p-4 rounded-lg flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center text-blue-400">
                        <Terminal size={20} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-bold uppercase">Method</div>
                        <div className="font-mono text-blue-400">{selectedApi.request?.method || 'GET'}</div>
                      </div>
                    </div>
                    <div className="bg-black bg-opacity-30 p-4 rounded-lg flex items-center gap-4">
                      <div className="w-10 h-10 bg-lorapok-green bg-opacity-20 rounded-lg flex items-center justify-center text-lorapok-green">
                        <Globe size={20} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs text-gray-500 font-bold uppercase">Endpoint</div>
                        <div className="font-mono text-lorapok-green truncate">{selectedApi.request?.url?.raw || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response / Results */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
                  <div className="glass flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white border-opacity-10 flex items-center justify-between bg-white bg-opacity-5">
                      <div className="flex items-center gap-2">
                        <Book size={16} className="text-lorapok-yellow" />
                        <span className="text-sm font-bold">Documentation</span>
                      </div>
                    </div>
                    {/* ... (Documentation content remains same) */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                       <h4 className="text-lg font-bold mb-4">How to use</h4>
                       <p className="text-gray-400 text-sm mb-6">Send a {selectedApi.request?.method || 'GET'} request to the endpoint to retrieve the data.</p>
                       
                       {selectedApi.authLink && (
                         <div className="bg-lorapok-yellow bg-opacity-10 border border-lorapok-yellow border-opacity-20 p-4 rounded-lg mb-6">
                            <div className="flex items-center gap-2 text-lorapok-yellow mb-2">
                               <Check size={16} />
                               <span className="text-xs font-bold uppercase">API Key Required</span>
                            </div>
                            <p className="text-xs text-gray-300 mb-3">This API requires an access token to function at full capacity.</p>
                            <a 
                              href={selectedApi.authLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-2 bg-lorapok-yellow text-black px-3 py-1.5 rounded-md text-xs font-bold hover:bg-opacity-80 transition-all"
                            >
                               Get Access Token <ExternalLink size={12} />
                            </a>
                         </div>
                       )}

                       <div className="space-y-6">
                          <div>
                             <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <Code size={14} />
                                <span>Code Snippets</span>
                             </div>
                             <CodeSnippets api={selectedApi} />
                          </div>
                          <div>
                             <div className="text-xs font-bold text-gray-500 uppercase mb-2">Request Headers</div>
                             <pre className="bg-black bg-opacity-40 p-3 rounded-md text-xs font-mono border border-white border-opacity-5">Accept: application/json</pre>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="glass flex flex-col overflow-hidden">
                    <ResponseSection 
                      data={testResult} 
                      isLoading={isLoading} 
                      apiName={selectedApi.name}
                      baseUrl={selectedApi.request?.url?.raw}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center glass text-center p-12 gap-6">
                 <motion.div 
                   animate={{ 
                     y: [0, -10, 0],
                     scale: [1, 1.05, 1]
                   }}
                   transition={{ repeat: Infinity, duration: 3 }}
                   className="text-8xl"
                 >
                   🐛
                 </motion.div>
                 <div>
                    <h2 className="text-4xl font-bold mb-4">Welcome to the Atlas</h2>
                    <p className="text-gray-400 max-w-lg mx-auto">Select an API from the sidebar to begin your journey. Lorapok is ready to help you explore the vast world of open-source data.</p>
                 </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Lorapok Mascot */}
      <div className="fixed bottom-8 right-8 pointer-events-none">
        <motion.div 
          animate={
            status === 'thinking' ? { 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1],
              transition: { repeat: Infinity, duration: 0.5 }
            } : 
            status === 'happy' ? {
              y: [0, -20, 0, -20, 0],
              scale: [1, 1.2, 1, 1.2, 1],
              transition: { duration: 1 }
            } :
            status === 'sad' ? {
              x: [0, -5, 5, -5, 5, 0],
              opacity: [1, 0.7, 1],
              transition: { duration: 0.5 }
            } :
            { 
              y: [0, -5, 0],
              transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
            }
          }
          className="relative"
        >
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              key={status}
              className="bg-lorapok-green text-black px-4 py-2 rounded-2xl rounded-br-none absolute -top-16 -left-24 text-sm font-bold shadow-xl border-2 border-black whitespace-nowrap"
            >
               {status === 'idle' && "Hey! Select an API to explore!"}
               {status === 'thinking' && "Digging into the data..."}
               {status === 'happy' && "Found it! Check the results!"}
               {status === 'sad' && "Darn! The API is acting up."}
               <div className="absolute -bottom-2 right-4 w-4 h-4 bg-lorapok-green border-r-2 border-b-2 border-black rotate-45"></div>
            </motion.div>
          </AnimatePresence>
          <div className="text-8xl pointer-events-auto cursor-pointer drop-shadow-2xl select-none" onClick={() => setStatus('idle')}>
            🐛
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
