import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Bell, Filter, History, BarChart3, DollarSign, Volume2, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const NasdaqNewsAnalyzer = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedNews, setExpandedNews] = useState({});
  const [selectedIndex, setSelectedIndex] = useState('NASDAQ');
  const [newsFilter, setNewsFilter] = useState('all');
  const [alertLevel, setAlertLevel] = useState('medium');
  const [newsHistory, setNewsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});
  const audioRef = useRef(null);

  const indices = [
    { name: 'NASDAQ', symbol: 'IXIC', searchQuery: 'NASDAQ Composite' },
    { name: 'S&P 500', symbol: 'GSPC', searchQuery: 'S&P 500' },
    { name: 'DOW JONES', symbol: 'DJI', searchQuery: 'Dow Jones' },
    { name: 'RUSSELL 2000', symbol: 'RUT', searchQuery: 'Russell 2000' }
  ];

  const newsCategories = [
    { value: 'all', label: 'Todas' },
    { value: 'earnings', label: 'Earnings' },
    { value: 'tech', label: 'Tech' },
    { value: 'macro', label: 'Macro' },
    { value: 'fed', label: 'Fed' },
    { value: 'geopolitical', label: 'Geopolítica' }
  ];

  // Mock chart data - En producción vendría de una API real
  const generateMockChart = (basePrice) => {
    return Array.from({ length: 30 }, (_, i) => {
      const variance = (Math.random() - 0.5) * (basePrice * 0.02);
      const trend = i * (basePrice * 0.001);
      return {
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
        price: basePrice + variance + trend,
        volume: Math.random() * 1000000000
      };
    });
  };

  // Sonido de alerta optimizado
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      audioRef.current = {
        play: () => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.3;
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
      };
    }
  }, []);

  const playAlertSound = () => {
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.play();
      } catch (e) {
        console.log('Audio play failed:', e);
      }
    }
  };

  const isMarketClosed = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getUTCHours();
    // Mercado cerrado: fines de semana o fuera de 14:30-21:00 UTC
    return day === 0 || day === 6 || hour < 14 || hour > 21;
  };

  // Función para obtener precio real (mockeado para testing)
  const fetchMarketPrice = async (indexSymbol) => {
    // Mock price info
    return {
      price: '18,000.00',
      change: '+1.2%',
      trend: 'bullish',
      isClosed: isMarketClosed()
    };
  };

  // Función optimizada para buscar noticias (mockeada)
  const fetchNews = async () => {
    const cacheKey = `${selectedIndex}-${newsFilter}`;
    const now = Date.now();
    
    // Revisar cache (5 minutos)
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < 300000) {
      setNews(cache[cacheKey].data);
      setLastUpdate(new Date(cache[cacheKey].timestamp));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentIndex = indices.find(i => i.name === selectedIndex);
      
      // Obtener precio (mock)
      const priceInfo = await fetchMarketPrice(currentIndex.symbol);
      
      // Generar datos del gráfico
      const basePrice = parseFloat(priceInfo.price.replace(/,/g, '')) || 18000;
      const chartData = generateMockChart(basePrice);
      
      // Análisis técnico básico
      const lastPrice = chartData[chartData.length - 1].price;
      const firstPrice = chartData[0].price;
      
      setMarketData({
        price: priceInfo,
        chart: chartData,
        technical: {
          trend: lastPrice > firstPrice ? 'bullish' : 'bearish',
          support: (lastPrice * 0.97).toFixed(2),
          resistance: (lastPrice * 1.03).toFixed(2),
          ma20: (lastPrice * 0.99).toFixed(2),
          ma50: (lastPrice * 0.98).toFixed(2),
          rsi: (45 + Math.random() * 20).toFixed(0)
        }
      });

      // Mock news items
      const mockNews = [
        {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title: 'Mock News Title 1',
          snippet: 'This is a mock snippet for testing.',
          url: '#',
          timestamp: new Date().toISOString(),
          index: selectedIndex,
          analysis: null
        },
        {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title: 'Mock News Title 2',
          snippet: 'Another mock snippet.',
          url: '#',
          timestamp: new Date().toISOString(),
          index: selectedIndex,
          analysis: null
        },
        {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title: 'Mock News Title 3',
          snippet: 'Yet another mock.',
          url: '#',
          timestamp: new Date().toISOString(),
          index: selectedIndex,
          analysis: null
        }
      ];

      // Filtrar por nivel de alerta (sin análisis aún)
      const filteredNews = mockNews;
      
      // Guardar en cache
      setCache({
        ...cache,
        [cacheKey]: {
          data: filteredNews,
          timestamp: now
        }
      });

      setNews(filteredNews);
      setLastUpdate(new Date());

    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Error al cargar noticias. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función separada para analizar impacto (mockeada)
  const analyzeNewsImpact = async () => {
    if (news.length === 0) return;
    
    setAnalyzing(true);
    setError(null);

    try {
      // Mock analyses
      const mockAnalyses = news.map((item, index) => ({
        newsId: item.id,
        sentiment: index % 2 === 0 ? 'bullish' : 'bearish',
        impact: ['low', 'medium', 'high'][index % 3],
        direction: index % 2 === 0 ? 'LONG' : 'SHORT',
        confidence: 80 + Math.random() * 20,
        category: newsCategories[(index + 1) % newsCategories.length].value,
        reasoning: 'This is a mock analysis reasoning.',
        entry: {
          type: 'Breakout',
          timeframe: 'Short-term',
          levels: 'Entry: 100 | Stop: 90 | Target: 120'
        },
        technicalSetup: 'Mock technical context',
        affectedSectors: ['Tech', 'Finance']
      }));

      // Asignar análisis a noticias por ID
      const updatedNews = news.map((item, index) => ({
        ...item,
        analysis: mockAnalyses[index]
      }));

      // Reproducir sonido si hay high impact
      const hasHighImpact = mockAnalyses.some(a => a.impact === 'high');
      if (hasHighImpact) {
        playAlertSound();
      }

      // Filtrar según alertLevel
      const filtered = updatedNews.filter(item => {
        if (!item.analysis) return true;
        if (alertLevel === 'all') return true;
        if (alertLevel === 'high') return item.analysis.impact === 'high';
        return ['high', 'medium'].includes(item.analysis.impact);
      });

      setNews(filtered);
      
      // Agregar al historial
      const withMeta = filtered.map(n => ({ ...n, fetchedAt: new Date().toISOString() }));
      setNewsHistory(prev => [...withMeta, ...prev].slice(0, 50));

    } catch (err) {
      console.error("Error analyzing news:", err);
      setError("Error al analizar impacto. Las noticias se muestran sin análisis.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedIndex, newsFilter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchNews, 300000); // 5 min
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedIndex, newsFilter]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'bearish': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-5 h-5" />;
      case 'bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getImpactBadge = (impact) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[impact] || colors.low;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      earnings: 'bg-purple-100 text-purple-800',
      tech: 'bg-blue-100 text-blue-800',
      macro: 'bg-orange-100 text-orange-800',
      fed: 'bg-red-100 text-red-800',
      geopolitical: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const toggleExpand = (id) => {
    setExpandedNews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 mb-4 border border-white/20">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                📊 Market Intelligence Pro
              </h1>
              <p className="text-blue-200 text-sm">
                Análisis con IA • Actualización inteligente con cache
              </p>
              {isMarketClosed() && (
                <div className="mt-2 flex items-center gap-2 text-yellow-300 text-sm">
                  <Calendar className="w-4 h-4" />
                  Mercado cerrado - Impacto para próxima apertura
                </div>
              )}
            </div>
            
            <div className="flex gap-3 items-center">
              {marketData?.price && (
                <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                  <div className="text-blue-300 text-xs mb-1">
                    {selectedIndex} {marketData.price.isClosed && '(Cerrado)'}
                  </div>
                  <div className="text-white text-2xl font-bold">{marketData.price.price}</div>
                  <div className={`text-sm font-semibold ${
                    marketData.price.trend === 'bullish' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {marketData.price.change}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                  soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chart */}
          {marketData?.chart && (
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Gráfico - {selectedIndex}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={marketData.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#60a5fa" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#60a5fa" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                  />
                  {marketData.technical && (
                    <>
                      <ReferenceLine 
                        y={marketData.technical.resistance} 
                        stroke="#ef4444" 
                        strokeDasharray="3 3"
                        label={{ value: 'R', fill: '#ef4444', fontSize: 12 }}
                      />
                      <ReferenceLine 
                        y={marketData.technical.support} 
                        stroke="#22c55e" 
                        strokeDasharray="3 3"
                        label={{ value: 'S', fill: '#22c55e', fontSize: 12 }}
                      />
                    </>
                  )}
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              {marketData.technical && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="bg-blue-900/30 rounded p-2">
                    <div className="text-blue-300 text-xs">Tendencia</div>
                    <div className={`font-bold text-sm ${marketData.technical.trend === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                      {marketData.technical.trend === 'bullish' ? '↑' : '↓'}
                    </div>
                  </div>
                  <div className="bg-blue-900/30 rounded p-2">
                    <div className="text-blue-300 text-xs">Soporte</div>
                    <div className="text-white font-semibold text-sm">{marketData.technical.support}</div>
                  </div>
                  <div className="bg-blue-900/30 rounded p-2">
                    <div className="text-blue-300 text-xs">Resistencia</div>
                    <div className="text-white font-semibold text-sm">{marketData.technical.resistance}</div>
                  </div>
                  <div className="bg-blue-900/30 rounded p-2">
                    <div className="text-blue-300 text-xs">MA20</div>
                    <div className="text-white font-semibold text-sm">{marketData.technical.ma20}</div>
                  </div>
                  <div className="bg-blue-900/30 rounded p-2">
                    <div className="text-blue-300 text-xs">RSI</div>
                    <div className={`font-semibold text-sm ${
                      marketData.technical.rsi > 70 ? 'text-red-400' : 
                      marketData.technical.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {marketData.technical.rsi}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Index Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {indices.map(index => (
              <button
                key={index.name}
                onClick={() => setSelectedIndex(index.name)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedIndex === index.name
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {index.name}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              ({newsHistory.length})
            </button>

            <button
              onClick={fetchNews}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Noticias
            </button>

            <button
              onClick={analyzeNewsImpact}
              disabled={analyzing || news.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <BarChart3 className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
              Analizar
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg ${
                autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
              }`}
            >
              Auto: {autoRefresh ? 'ON' : 'OFF'}
            </button>

            {lastUpdate && (
              <div className="text-blue-200 text-sm ml-auto">
                {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-4">
              <div>
                <label className="text-blue-200 text-sm mb-2 block">Categoría:</label>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {newsCategories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setNewsFilter(cat.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        newsFilter === cat.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-sm mb-2 block flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Nivel de Alerta:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'medium', 'high'].map(level => (
                    <button
                      key={level}
                      onClick={() => setAlertLevel(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        alertLevel === level
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      {level === 'all' ? 'Todas' : level === 'medium' ? 'Media+' : 'Solo Alta'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 mb-4 text-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* History */}
        {showHistory && newsHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {newsHistory.slice(0, 20).map((item, idx) => (
                <div key={idx} className="bg-black/30 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{item.index}</span>
                    <span className="text-blue-300 text-xs">
                      {new Date(item.fetchedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-blue-100 text-xs">{item.title}</p>
                  {item.analysis && (
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.analysis.direction === 'LONG' ? 'bg-green-600' : 
                        item.analysis.direction === 'SHORT' ? 'bg-red-600' : 'bg-gray-600'
                      } text-white`}>
                        {item.analysis.direction}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs border ${getImpactBadge(item.analysis.impact)}`}>
                        {item.analysis.impact}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Cards */}
        {loading ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-blue-200 text-lg">Cargando noticias...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {news.map(item => (
              <div key={item.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                  <button onClick={() => toggleExpand(item.id)}>
                    {expandedNews[item.id] ? <ChevronUp className="w-5 h-5 text-blue-200" /> : <ChevronDown className="w-5 h-5 text-blue-200" />}
                  </button>
                </div>
                <p className="text-blue-200 text-sm mb-4">{item.snippet}</p>
                {expandedNews[item.id] && item.analysis && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-lg flex items-center gap-2 ${getSentimentColor(item.analysis.sentiment)}`}>
                        {getSentimentIcon(item.analysis.sentiment)}
                        {item.analysis.sentiment}
                      </span>
                      <span className={`px-3 py-1 rounded-lg ${getImpactBadge(item.analysis.impact)}`}>
                        Impacto: {item.analysis.impact}
                      </span>
                      <span className={`px-3 py-1 rounded-lg ${getCategoryBadge(item.analysis.category)}`}>
                        {item.analysis.category}
                      </span>
                    </div>
                    <p className="text-blue-100 text-sm">{item.analysis.reasoning}</p>
                    <div className="bg-black/30 p-3 rounded-lg">
                      <p className="text-white font-medium mb-1">Trade Setup</p>
                      <p className="text-blue-200 text-sm">{item.analysis.entry.levels}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NasdaqNewsAnalyzer;
