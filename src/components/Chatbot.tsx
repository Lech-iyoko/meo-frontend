'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, Activity, Stethoscope, Upload } from 'lucide-react';
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
type Phase = 'reactive' | 'analysis' | 'solution';

type Source = {
  title: string;
  category: string;
  description?: string;
  price?: string;
  gap_solved?: string;
  type: 'vendor_card' | 'content' | 'graph_data';
  tags?: string[];
};

type GraphDataPoint = {
  time: string;
  glucose: number;
  insulin: number;
  Glucose?: number;
  Insulin?: number;
};

type Message = {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

// --- Default Mock Data for the Kraft Curve Analysis ---
const DEFAULT_GRAPH_DATA: GraphDataPoint[] = [
  { time: '0hr', glucose: 85, insulin: 5, Glucose: 85, Insulin: 5 },
  { time: '0.5hr', glucose: 140, insulin: 80, Glucose: 140, Insulin: 80 },
  { time: '1hr', glucose: 160, insulin: 120, Glucose: 160, Insulin: 120 },
  { time: '1.5hr', glucose: 130, insulin: 100, Glucose: 130, Insulin: 100 },
  { time: '2hr', glucose: 105, insulin: 75, Glucose: 105, Insulin: 75 },
  { time: '2.5hr', glucose: 90, insulin: 55, Glucose: 90, Insulin: 55 },
  { time: '3hr', glucose: 95, insulin: 45, Glucose: 95, Insulin: 45 },
  { time: '3.5hr', glucose: 95, insulin: 35, Glucose: 95, Insulin: 35 },
  { time: '4hr', glucose: 95, insulin: 25, Glucose: 95, Insulin: 25 },
  { time: '4.5hr', glucose: 95, insulin: 18, Glucose: 95, Insulin: 18 },
  { time: '5hr', glucose: 90, insulin: 10, Glucose: 90, Insulin: 10 },
];

export default function MeOInterface() {
  // --- State ---
  const [phase, setPhase] = useState<Phase>('reactive');
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>(DEFAULT_GRAPH_DATA);
  const [vendorData, setVendorData] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Logic Engine ---
  const handleSendMessage = async (e?: React.FormEvent, prefill?: string) => {
    e?.preventDefault();
    const messageText = prefill || input;
    if (!messageText.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText, timestamp: new Date() }]);
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
      
      // Backend-driven State Machine Logic - Trust backend tags only
      const retrievedSources = data.retrieved_sources || [];
      
      for (const source of retrievedSources) {
        if (source.type === 'graph_data') {
          // Set phase to analysis and parse graph data
          setPhase('analysis');
          if (source.gap_solved) {
            try {
              const parsedData = JSON.parse(source.gap_solved);
              if (Array.isArray(parsedData)) {
                setGraphData(parsedData);
              }
            } catch {
              // If parsing fails, keep default graph data
              console.warn('Failed to parse graph data, using defaults');
            }
          }
        } else if (source.type === 'vendor_card') {
          // Set phase to solution and store vendor data
          setPhase('solution');
          setVendorData(source);
        }
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse, timestamp: new Date() }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm having trouble connecting. Please check your internet connection or try again later.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (text: string) => {
    handleSendMessage(undefined, text);
  };

  // --- Status Badge Component ---
  const StatusBadge = () => {
    const statusConfig = {
      reactive: { label: 'Reactive', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
      analysis: { label: 'Analysis', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      solution: { label: 'Solution', color: 'bg-medical-primary/20 text-medical-primary border-medical-primary/30' },
    };
    const config = statusConfig[phase];
    
    return (
      <div className={cn(
        "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300",
        config.color
      )}>
        Status: {config.label}
      </div>
    );
  };

  // --- Blood Droplet SVG Component ---
  const BloodDroplet = ({ className }: { className?: string }) => (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M12 2C12 2 5 10 5 15C5 19.4183 8.13401 23 12 23C15.866 23 19 19.4183 19 15C19 10 12 2 12 2Z" />
    </svg>
  );

  // --- Logo Component ---
  const Logo = ({ size = 'large' }: { size?: 'large' | 'small' }) => (
    <div className="flex items-center gap-0">
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
    </div>
  );

  // --- Render: Initial State (View 1) ---
  if (!isActive) {
    return (
      <div className="min-h-screen dark bg-gradient-to-br from-background via-medical-bg to-medical-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Logo & Tagline */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Logo size="large" />
            </div>
            <p className="text-muted-foreground text-lg">Your Metabolic Health Partner</p>
          </div>

          {/* Search Input */}
          <div className="space-y-4">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                placeholder="Ask about your metabolic health..."
                className="w-full h-14 text-lg pl-5 pr-14 rounded-xl bg-card/80 backdrop-blur border border-medical-border shadow-lg shadow-medical-primary/5 focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary text-foreground placeholder:text-muted-foreground"
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

  // --- Render: Active State - Split Screen (View 2) ---
  return (
    <div className="h-screen dark flex bg-gradient-to-br from-background via-medical-bg to-medical-accent/10">
      {/* Left Panel - Chat Thread */}
      <div className="w-full md:w-[30%] border-r border-medical-border bg-card/50 backdrop-blur flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-medical-border bg-card/80 flex items-center justify-between">
          <Logo size="small" />
          <StatusBadge />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-lg p-3",
                msg.role === 'user'
                  ? "bg-medical-primary text-primary-foreground"
                  : "bg-card border border-medical-border text-card-foreground"
              )}>
                {msg.role === 'bot' ? (
                  <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-medical-border rounded-lg p-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-medical-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-medical-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-medical-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-medical-border bg-card/80">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              placeholder="Ask a follow-up..."
              className="w-full py-3 pl-4 pr-12 rounded-xl bg-card border border-medical-border focus:outline-none focus:ring-2 focus:ring-medical-primary/50 text-foreground placeholder:text-muted-foreground"
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

      {/* Right Panel - The Morph Area */}
      <div className="hidden md:flex flex-1 flex-col p-6 overflow-hidden">
        {/* Header with Title and Status */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Meterbolic</h2>
          <StatusBadge />
        </div>

        {/* Morph Content Area with Transitions */}
        <div className="flex-1 overflow-y-auto transition-all duration-500 ease-in-out">
          {phase === 'analysis' ? (
            // Analysis Phase - AG Dashboard
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right duration-500">
              {/* Card A: Metabolic Analysis */}
              <div className="bg-card border border-medical-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Metabolic Analysis</h3>
                    <p className="text-sm text-muted-foreground">Based on your latest data</p>
                  </div>
                  {/* Risk Score Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <p className="text-2xl font-bold text-foreground">65</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C12 2 5 10 5 15C5 19.4183 8.13401 23 12 23C15.866 23 19 19.4183 19 15C19 10 12 2 12 2Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Risk Status Pill */}
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    At Risk
                  </span>
                </div>

                {/* Analysis Text */}
                <div className="bg-medical-accent/50 rounded-lg p-4 border border-medical-border">
                  <p className="text-sm text-foreground leading-relaxed">
                    Your metabolic recovery score is currently at <strong>72/100</strong>. Based on your 
                    HRV data and glucose variability, your body is showing moderate stress response. 
                    Key factors: sleep efficiency was <strong>84%</strong>, glycemic variability index 
                    was elevated at <strong>28%</strong>, and your morning cortisol pattern suggests 
                    adrenal fatigue. Consider implementing the morning light exposure protocol to 
                    optimize circadian rhythm.
                  </p>
                </div>
              </div>

              {/* Card B: Kraft Curve Analysis */}
              <div className="bg-card border border-medical-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Kraft Curve Analysis</h3>
                    <p className="text-sm text-muted-foreground">5-Hour Glucose Tolerance Test</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    At Risk
                  </span>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        domain={[0, 180]}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        domain={[0, 140]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="Glucose"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Glucose"
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="Insulin"
                        stroke="#f97316"
                        strokeWidth={2}
                        name="Insulin"
                        dot={{ fill: '#f97316', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Cards */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-medical-accent/50 rounded-lg border border-medical-border">
                    <p className="text-2xl font-bold text-blue-400">160</p>
                    <p className="text-xs text-muted-foreground">Peak Glucose (mg/dL)</p>
                  </div>
                  <div className="text-center p-3 bg-medical-accent/50 rounded-lg border border-medical-border">
                    <p className="text-2xl font-bold text-orange-400">120</p>
                    <p className="text-xs text-muted-foreground">Peak Insulin (μIU/mL)</p>
                  </div>
                  <div className="text-center p-3 bg-medical-accent/50 rounded-lg border border-medical-border">
                    <p className="text-2xl font-bold text-foreground">2.5hr</p>
                    <p className="text-xs text-muted-foreground">Recovery Time</p>
                  </div>
                </div>
              </div>
            </div>
          ) : phase === 'solution' ? (
            // Solution Phase - Vendor Card
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <div className="bg-card border border-medical-border rounded-xl p-6 shadow-lg max-w-2xl">
                <h3 className="text-xl font-bold text-foreground mb-2">Recommended Solution</h3>
                <p className="text-muted-foreground mb-6">Matched to your metabolic profile</p>

                {vendorData ? (
                  <VendorCard vendor={vendorData} />
                ) : (
                  <VendorCard 
                    vendor={{
                      title: "Taylor Made Rehab",
                      category: "Metabolic Recovery Specialists",
                      description: "Specialized protocol for delayed insulin response patterns. Combines targeted nutrition therapy, metabolic testing, and personalized supplementation to improve glucose-insulin dynamics.",
                      price: "180",
                      type: 'vendor_card',
                      tags: ["Insulin Resistance", "Fatigue Protocol"]
                    }} 
                  />
                )}
              </div>
            </div>
          ) : (
            // Reactive Phase - Welcome State
            <div className="flex items-center justify-center h-full animate-in fade-in duration-500">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-medical-accent border border-medical-border flex items-center justify-center">
                  <Activity className="w-10 h-10 text-medical-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground">
                  Ask me about your metabolic health, and I&apos;ll provide personalized insights 
                  based on your data. Try asking about your Kraft Curve or finding a specialist.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Vendor Card Component ---
interface VendorCardProps {
  vendor: Source;
}

function VendorCard({ vendor }: VendorCardProps) {
  const tags = vendor.tags || [vendor.gap_solved, vendor.category].filter(Boolean);
  
  return (
    <div className="border border-medical-border rounded-lg p-6 hover:border-medical-primary transition-colors bg-medical-accent/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-xl font-bold text-foreground mb-1">{vendor.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{vendor.category}</p>
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag, i) => (
              <span 
                key={i}
                className="text-xs bg-medical-primary/10 text-medical-primary px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">${vendor.price}</p>
          <p className="text-xs text-muted-foreground">per session</p>
        </div>
      </div>

      {/* Description */}
      {vendor.description && (
        <p className="text-sm text-foreground mb-4 leading-relaxed">
          {vendor.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-medical-primary hover:bg-medical-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors">
          Book Session
        </button>
        <button className="px-4 py-3 border border-medical-border bg-transparent hover:bg-medical-accent rounded-lg transition-colors flex items-center gap-1 text-foreground">
          Learn More
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}