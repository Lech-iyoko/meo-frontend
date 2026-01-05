'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, Stethoscope, Upload, Sun, Moon, User, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
                  // User Message - styled bubble with light green background
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-medical-primary">
                    <p className="text-sm leading-relaxed text-primary-foreground">{msg.content}</p>
                  </div>
                ) : (
                  // Assistant Message - no background, direct text
                  <div className="max-w-[85%]">
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
              <h1 className="text-3xl font-bold text-foreground">Metabolic Analysis</h1>
              <p className="text-sm text-muted-foreground">Based on your latest data</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="text-3xl font-bold text-orange-500">65</p>
              </div>
              <RiskScoreGauge score={65} />
            </div>
          </div>

          {/* Main Card */}
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

            {/* Chart Section */}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="insulinGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="var(--medical-border)" 
                    strokeOpacity={0.3} 
                  />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 180]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Insulin', angle: 90, position: 'insideRight', fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--medical-border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="glucose"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#glucoseGradient)"
                    name="Glucose"
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="insulin"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#insulinGradient)"
                    name="Insulin"
                    dot={{ fill: '#f97316', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
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
        </div>
      </div>
    </div>
  );
}