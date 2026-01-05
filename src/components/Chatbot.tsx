'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, Stethoscope, Upload, Sun, Moon, User, BarChart3, MapPin, Star, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging Tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type GraphDataPoint = {
  time: string;
  glucose: number;
  insulin: number;
};

type Vendor = {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  price: string;
  location: string;
  tags: string[];
  available: boolean;
};

// --- Mock Vendor Data ---
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Taylor Made Rehab',
    category: 'Metabolic Recovery Specialists',
    description: 'Specialized protocol for delayed insulin response patterns. Combines targeted nutrition therapy, metabolic testing, and personalized supplementation.',
    rating: 4.9,
    reviews: 127,
    price: '$180/session',
    location: 'Austin, TX',
    tags: ['Insulin Resistance', 'Fatigue Protocol', 'Nutrition'],
    available: true,
  },
  {
    id: '2',
    name: 'Metabolic Health Institute',
    category: 'Clinical Testing & Analysis',
    description: 'Comprehensive metabolic panel testing with detailed Kraft curve analysis and personalized intervention plans.',
    rating: 4.8,
    reviews: 89,
    price: '$250/consult',
    location: 'Houston, TX',
    tags: ['Lab Testing', 'Kraft Analysis', 'Clinical'],
    available: true,
  },
  {
    id: '3',
    name: 'Glucose Optimization Clinic',
    category: 'Continuous Monitoring',
    description: 'CGM-based coaching program with real-time glucose monitoring and lifestyle optimization strategies.',
    rating: 4.7,
    reviews: 203,
    price: '$150/month',
    location: 'Dallas, TX',
    tags: ['CGM', 'Coaching', 'Lifestyle'],
    available: false,
  },
];

// --- Kraft Curve Data (from spec) ---
const kraftCurveData: GraphDataPoint[] = [
  { time: '0hr', glucose: 85, insulin: 5 },
  { time: '0.5hr', glucose: 145, insulin: 55 },
  { time: '1hr', glucose: 160, insulin: 95 },
  { time: '1.5hr', glucose: 150, insulin: 120 },
  { time: '2hr', glucose: 135, insulin: 95 },
  { time: '2.5hr', glucose: 115, insulin: 65 },
  { time: '3hr', glucose: 100, insulin: 40 },
  { time: '3.5hr', glucose: 92, insulin: 28 },
  { time: '4hr', glucose: 88, insulin: 18 },
  { time: '4.5hr', glucose: 85, insulin: 12 },
  { time: '5hr', glucose: 83, insulin: 8 },
];

// --- Risk Score Gauge Component ---
function RiskScoreGauge({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#ef4444' : score >= 50 ? '#f97316' : '#22c55e';

  return (
    <div className="relative w-20 h-20">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 80 80"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--medical-border)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <BarChart3 className="h-8 w-8 text-orange-500" />
      </div>
    </div>
  );
}

// --- Blood Droplet SVG Component ---
function BloodDroplet({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M12 2C12 2 5 10 5 15C5 19.4183 8.13401 23 12 23C15.866 23 19 19.4183 19 15C19 10 12 2 12 2Z" />
    </svg>
  );
}

// --- Logo Component ---
function Logo({ size = 'large', onClick }: { size?: 'large' | 'small'; onClick?: () => void }) {
  const content = (
    <>
      <span className={cn(
        "font-bold text-foreground",
        size === 'large' ? "text-5xl" : "text-xl"
      )}>
        Me
      </span>
      <BloodDroplet 
        className={cn(
          "text-medical-primary",
          size === 'large' ? "w-10 h-10 mt-1" : "w-5 h-5"
        )} 
      />
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="flex items-center gap-0 hover:opacity-80 transition-opacity"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {content}
    </div>
  );
}

// --- Main Component ---
export default function MeOInterface() {
  // --- State ---
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>(kraftCurveData);
  // viewMode is controlled by backend keyword detection
  const [viewMode, setViewMode] = useState<'analysis' | 'solution'>('analysis');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- Handle Send Message ---
  const handleSendMessage = async (e?: React.FormEvent, prefill?: string) => {
    e?.preventDefault();
    const messageText = prefill || input;
    if (!messageText.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setLoading(true);
    setIsActive(true);

    try {
      const res = await fetch('https://api.meo.meterbolic.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, session_id: 'demo_session' })
      });
      
      const data = await res.json();
      const botResponse = data.response;
      
      // Backend-driven mode detection via keywords
      const lowerResponse = botResponse.toLowerCase();
      if (lowerResponse.includes('specialist') || lowerResponse.includes('vendor') || lowerResponse.includes('provider') || lowerResponse.includes('clinic')) {
        setViewMode('solution');
      } else if (lowerResponse.includes('analysis') || lowerResponse.includes('glucose') || lowerResponse.includes('insulin') || lowerResponse.includes('kraft')) {
        setViewMode('analysis');
      }
      
      // Check for graph data in sources
      const retrievedSources = data.retrieved_sources || [];
      for (const source of retrievedSources) {
        if (source.type === 'graph_data' && source.gap_solved) {
          try {
            const parsedData = JSON.parse(source.gap_solved);
            if (Array.isArray(parsedData)) {
              setGraphData(parsedData);
            }
          } catch {
            console.warn('Failed to parse graph data, using defaults');
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please check your internet connection or try again later."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (text: string) => {
    handleSendMessage(undefined, text);
  };

  // Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // --- Render: Initial State (Centered Search View) ---
  if (!isActive) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-4",
        theme === 'dark' 
          ? "bg-gradient-to-b from-background via-medical-bg to-medical-accent/10" 
          : "bg-white"
      )}>
        {/* Limited Preview Badge - Fixed at top center */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full text-sm font-medium border border-medical-primary/40 bg-medical-primary/10 backdrop-blur-md text-medical-primary">
            Limited Preview
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 p-2 rounded-lg bg-background/80 backdrop-blur border border-medical-border hover:bg-medical-accent transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-foreground" />
          )}
        </button>

        <div className="w-full max-w-2xl mx-auto">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Logo size="large" onClick={handleRefresh} />
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-4">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                placeholder="Ask about your metabolic health..."
                className="w-full h-14 text-lg pl-5 pr-14 rounded-xl bg-card/80 backdrop-blur border border-medical-border shadow-lg focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary text-foreground placeholder:text-muted-foreground"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2.5 rounded-lg bg-medical-primary hover:bg-medical-primary/90 text-primary-foreground transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* Action Chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleActionClick("Analyze my Kraft Curve")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/80 backdrop-blur border border-medical-border hover:bg-medical-accent hover:text-medical-primary hover:border-medical-primary transition-all text-sm font-medium text-foreground"
              >
                <Activity className="h-4 w-4" />
                Analyze my Kraft Curve
              </button>
              <button
                onClick={() => handleActionClick("Find a Specialist")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/80 backdrop-blur border border-medical-border hover:bg-medical-accent hover:text-medical-primary hover:border-medical-primary transition-all text-sm font-medium text-foreground"
              >
                <Stethoscope className="h-4 w-4" />
                Find a Specialist
              </button>
              <button
                onClick={() => handleActionClick("Upload Lab Results")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/80 backdrop-blur border border-medical-border hover:bg-medical-accent hover:text-medical-primary hover:border-medical-primary transition-all text-sm font-medium text-foreground"
              >
                <Upload className="h-4 w-4" />
                Upload Lab Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Active State (Split-Screen Layout) ---
  return (
    <div className={cn(
      "min-h-screen",
      theme === 'dark' 
        ? "bg-gradient-to-b from-background via-medical-bg to-medical-accent/10" 
        : "bg-white"
    )}>
      {/* Limited Preview Badge - Fixed at top center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="px-4 py-2 rounded-full text-sm font-medium border border-medical-primary/40 bg-medical-primary/10 backdrop-blur-md text-medical-primary">
          Limited Preview
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-background/80 backdrop-blur border border-medical-border hover:bg-medical-accent transition-colors"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-foreground" />
        ) : (
          <Moon className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Split Layout Container */}
      <div className="min-h-screen flex">
        
        {/* Left Panel (35% Width) */}
        <div className="w-full md:w-[35%] flex flex-col bg-card/50 backdrop-blur border-r border-medical-border h-screen">
          
          {/* Header Section */}
          <div className="p-4 border-b border-medical-border flex items-center justify-between">
            <Logo size="small" onClick={handleRefresh} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-medical-border hover:bg-medical-accent transition-colors text-foreground">
              <Stethoscope className="h-4 w-4" />
              Clinician Mode
            </button>
          </div>

          {/* Action Button Section */}
          <div className="p-4">
            <button className="w-full py-3 px-4 bg-medical-primary hover:bg-medical-primary/90 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              Check Recovery
            </button>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                {msg.role === 'user' ? (
                  // User Message - darker teal bubble (matching screenshot)
                  <div 
                    className="max-w-[85%] rounded-2xl px-4 py-3"
                    style={{ backgroundColor: '#2C564C' }}
                  >
                    <p className="text-sm leading-relaxed text-white">{msg.content}</p>
                  </div>
                ) : (
                  // Assistant Message - with darker green background margin
                  <div 
                    className="max-w-[90%] rounded-lg px-4 py-3"
                    style={{ backgroundColor: 'rgba(20, 50, 50, 0.5)' }}
                  >
                    <div className="prose prose-sm max-w-none text-foreground/90">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-medical-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-medical-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-medical-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Section */}
          <div className="p-4 border-t border-medical-border">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                placeholder="Ask a follow-up..."
                className="w-full py-3 pl-4 pr-12 rounded-xl bg-card/80 backdrop-blur border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-primary/50 text-foreground placeholder:text-muted-foreground"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center rounded-lg bg-medical-primary hover:bg-medical-primary/90 text-primary-foreground transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel (65% Width - Analysis Dashboard) */}
        <div className="hidden md:flex flex-1 flex-col p-8 overflow-y-auto animate-in fade-in slide-in-from-right duration-500">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {viewMode === 'analysis' ? 'Metabolic Analysis' : 'Recommended Support'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'analysis' ? 'Based on your latest data' : 'Matched to your metabolic profile'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-medical-border overflow-hidden">
                <button
                  onClick={() => setViewMode('analysis')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    viewMode === 'analysis'
                      ? "bg-medical-primary text-primary-foreground"
                      : "bg-transparent text-foreground hover:bg-medical-accent"
                  )}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setViewMode('solution')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    viewMode === 'solution'
                      ? "bg-medical-primary text-primary-foreground"
                      : "bg-transparent text-foreground hover:bg-medical-accent"
                  )}
                >
                  Solutions
                </button>
              </div>
              {viewMode === 'analysis' && (
                <>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className="text-3xl font-bold text-orange-500">65</p>
                  </div>
                  <RiskScoreGauge score={65} />
                </>
              )}
            </div>
          </div>

          {/* Analysis View */}
          {viewMode === 'analysis' && (
            <div className="bg-card/80 backdrop-blur border border-medical-border rounded-xl shadow-lg p-6">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Kraft Curve Analysis</h2>
                  <p className="text-sm text-muted-foreground">5-Hour Glucose Tolerance Test</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  At Risk
                </span>
              </div>

              {/* Chart Section - Using LineChart for reliability */}
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      yAxisId="glucose"
                      tick={{ fill: '#3b82f6', fontSize: 12 }}
                      axisLine={{ stroke: '#3b82f6' }}
                      tickLine={{ stroke: '#3b82f6' }}
                      domain={[0, 200]}
                      label={{ value: 'Glucose (mg/dL)', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="insulin"
                      orientation="right"
                      tick={{ fill: '#f97316', fontSize: 12 }}
                      axisLine={{ stroke: '#f97316' }}
                      tickLine={{ stroke: '#f97316' }}
                      domain={[0, 150]}
                      label={{ value: 'Insulin (μIU/mL)', angle: 90, position: 'insideRight', fill: '#f97316', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                    <Line
                      yAxisId="glucose"
                      type="monotone"
                      dataKey="glucose"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Glucose"
                      dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                    <Line
                      yAxisId="insulin"
                      type="monotone"
                      dataKey="insulin"
                      stroke="#f97316"
                      strokeWidth={3}
                      name="Insulin"
                      dot={{ fill: '#f97316', r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-medical-accent/30 border border-medical-border rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-400">160</p>
                  <p className="text-xs text-muted-foreground">Peak Glucose</p>
                </div>
                <div className="bg-medical-accent/30 border border-medical-border rounded-lg p-4">
                  <p className="text-3xl font-bold text-orange-500">120</p>
                  <p className="text-xs text-muted-foreground">Peak Insulin</p>
                </div>
                <div className="bg-medical-accent/30 border border-medical-border rounded-lg p-4">
                  <p className="text-3xl font-bold text-medical-primary">2.5hr</p>
                  <p className="text-xs text-muted-foreground">Recovery Time</p>
                </div>
              </div>
            </div>
          )}

          {/* Solution View - Vendor Cards */}
          {viewMode === 'solution' && (
            <div className="space-y-4">
              {mockVendors.map((vendor) => (
                <div 
                  key={vendor.id}
                  className="bg-card/80 backdrop-blur border border-medical-border rounded-xl p-6 hover:border-medical-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    {/* Left Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-medical-primary transition-colors">
                          {vendor.name}
                        </h3>
                        {vendor.available ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            Waitlist
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-medical-primary font-medium mb-2">{vendor.category}</p>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{vendor.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {vendor.tags.map((tag, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 rounded-md text-xs bg-medical-accent/50 text-foreground border border-medical-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-foreground font-medium">{vendor.rating}</span>
                          <span>({vendor.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{vendor.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Content - Price & CTA */}
                    <div className="flex flex-col items-end gap-3 ml-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{vendor.price}</p>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-medical-primary hover:bg-medical-primary/90 text-primary-foreground font-medium rounded-lg transition-colors">
                        Book Now
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}