'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Droplet, Moon, Sun, ShieldCheck, Activity, User, Upload, ChevronRight, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging Tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Source = {
  title: string;
  category: string;
  description?: string;
  price?: string;
  gap_solved?: string;
  type: 'vendor_card' | 'content';
  tags?: string[];
};

type Message = {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

// --- Mock Data for the Educational Graph ---
const GLUCOSE_DATA = [
  { time: '0min', glucose: 90, optimal: 90 },
  { time: '30min', glucose: 155, optimal: 120 },
  { time: '45min', glucose: 165, optimal: 115 },
  { time: '60min', glucose: 140, optimal: 105 },
  { time: '90min', glucose: 75, optimal: 95 },
  { time: '120min', glucose: 65, optimal: 90 },
];

export default function MeOInterface() {
  // --- State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [phase, setPhase] = useState<'reactive' | 'analysis' | 'solution'>('reactive');
  const [activeTab, setActiveTab] = useState<'analysis' | 'solutions'>('solutions');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [vendors, setVendors] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Theme Classes ---
  const theme = {
    // Backgrounds
    pageBg: isDarkMode 
      ? "bg-gradient-to-br from-[#0f2922] via-[#1a3c34] to-[#0f2922]" 
      : "bg-gradient-to-br from-slate-50 via-white to-slate-100",
    
    // Text
    textPrimary: isDarkMode ? "text-white" : "text-slate-900",
    textSecondary: isDarkMode ? "text-teal-200/70" : "text-slate-500",
    textMuted: isDarkMode ? "text-teal-300/50" : "text-slate-400",
    
    // Cards & Panels
    card: isDarkMode 
      ? "bg-[#112922]/80 border-teal-800/30 backdrop-blur-sm" 
      : "bg-white border-slate-200 shadow-lg",
    cardHover: isDarkMode 
      ? "hover:bg-[#1a3c34] hover:border-teal-700/50" 
      : "hover:shadow-xl hover:border-slate-300",
    
    // Input
    input: isDarkMode 
      ? "bg-[#0f241e]/80 border-teal-800/50 placeholder-teal-600 text-white focus:border-teal-500" 
      : "bg-white border-slate-200 placeholder-slate-400 text-slate-900 focus:border-teal-500",
    
    // Bubbles
    userBubble: "bg-teal-500 text-white",
    botBubble: isDarkMode 
      ? "bg-black/20 text-teal-50 border border-teal-800/30" 
      : "bg-white text-slate-800 border border-slate-200 shadow-sm",
    
    // Buttons
    chipButton: isDarkMode 
      ? "border-teal-700/50 text-teal-300 hover:bg-teal-900/50 hover:border-teal-600" 
      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
    
    // Tags
    tag: isDarkMode 
      ? "bg-teal-900/50 text-teal-300 border-teal-700/50" 
      : "bg-teal-50 text-teal-700 border-teal-200",
  };

  // --- Logic Engine ---
  const handleSendMessage = async (e?: React.FormEvent, prefill?: string) => {
    e?.preventDefault();
    const messageText = prefill || input;
    if (!messageText.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch('https://api.meo.meterbolic.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, session_id: 'demo_session' })
      });
      
      const data = await res.json();
      const botResponse = data.response;
      
      // State Machine Logic
      const foundVendors = data.retrieved_sources?.filter((s: Source) => s.type === 'vendor_card') || [];
      
      if (foundVendors.length > 0) {
        setVendors(foundVendors);
        setPhase('solution');
        setActiveTab('solutions');
      } else if (
        botResponse.toLowerCase().includes("graph") || 
        botResponse.toLowerCase().includes("chart") || 
        botResponse.toLowerCase().includes("crash") ||
        botResponse.toLowerCase().includes("spike") ||
        botResponse.toLowerCase().includes("curve") ||
        botResponse.toLowerCase().includes("pattern")
      ) {
        setPhase('analysis');
        setActiveTab('analysis');
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse, timestamp: new Date() }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm having trouble connecting. Please ensure the backend is running at localhost:8000.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (text: string) => {
    handleSendMessage(undefined, text);
  };

  // --- Render: Reactive (Initial Centered State) ---
  const renderReactiveState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-1 mb-3">
        <span className={cn("text-5xl font-bold tracking-tight", theme.textPrimary)}>Me</span>
        <Droplet className="w-10 h-10 fill-teal-500 text-teal-500" strokeWidth={1.5} />
      </div>
      
      {/* Tagline */}
      <p className={cn("text-lg mb-10", theme.textSecondary)}>
        Your Metabolic Health Partner
      </p>
      
      {/* Search Input */}
      <form onSubmit={handleSendMessage} className="w-full max-w-2xl mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your metabolic health..."
            className={cn(
              "w-full py-4 pl-5 pr-14 rounded-2xl border-2 transition-all duration-300",
              "focus:outline-none focus:ring-4 focus:ring-teal-500/20",
              theme.input
            )}
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200",
              input.trim() 
                ? "bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/25" 
                : "bg-transparent text-gray-400 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
      
      {/* Action Chips */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button 
          onClick={() => handleChipClick("Analyze my Kraft Curve")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
            theme.chipButton
          )}
        >
          <Sparkles size={16} /> Analyze my Kraft Curve
        </button>
        <button 
          onClick={() => handleChipClick("Find a Specialist for metabolic health")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
            theme.chipButton
          )}
        >
          <User size={16} /> Find a Specialist
        </button>
        <button 
          onClick={() => handleChipClick("I want to upload my lab results")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
            theme.chipButton
          )}
        >
          <Upload size={16} /> Upload Lab Results
        </button>
      </div>
    </div>
  );

  // --- Render: Split Layout (Analysis / Solution) ---
  const renderSplitLayout = () => (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* LEFT: Chat Panel (30%) */}
      <div className={cn(
        "w-full lg:w-[30%] flex flex-col border-r transition-all duration-500",
        isDarkMode ? "border-teal-800/30 bg-[#0f2922]/50" : "border-slate-200 bg-white"
      )}>
        {/* Chat Header */}
        <div className={cn(
          "px-4 py-3 border-b flex items-center justify-between",
          isDarkMode ? "border-teal-800/30" : "border-slate-200"
        )}>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-semibold", theme.textPrimary)}>Me</span>
            <Droplet className="w-4 h-4 fill-teal-500 text-teal-500" />
          </div>
          <button 
            onClick={() => handleChipClick("Find a Specialist")}
            className="px-3 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-400 transition-colors"
          >
            Find a Specialist
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' ? theme.userBubble : theme.botBubble
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={cn("px-4 py-2 rounded-full text-xs", theme.textMuted)}>
                <span className="animate-pulse">MeO is analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className={cn("p-4 border-t", isDarkMode ? "border-teal-800/30" : "border-slate-200")}>
          <form onSubmit={handleSendMessage} className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a follow-up..."
              className={cn(
                "w-full py-3 pl-4 pr-12 rounded-xl border transition-all",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30",
                theme.input
              )}
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                input.trim() ? "bg-teal-500 text-white hover:bg-teal-400" : "text-gray-400"
              )}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
      
      {/* RIGHT: Morph Panel (70%) */}
      <div className={cn(
        "hidden lg:flex lg:w-[70%] flex-col overflow-hidden",
        isDarkMode ? "bg-[#112922]/30" : "bg-slate-50"
      )}>
        {/* Tabs */}
        <div className={cn(
          "px-6 py-3 border-b flex gap-2",
          isDarkMode ? "border-teal-800/30" : "border-slate-200"
        )}>
          <button
            onClick={() => setActiveTab('analysis')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'analysis'
                ? "bg-teal-500 text-white"
                : isDarkMode ? "text-teal-300 hover:bg-teal-900/50" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'solutions'
                ? "bg-teal-500 text-white"
                : isDarkMode ? "text-teal-300 hover:bg-teal-900/50" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Solutions
          </button>
        </div>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'analysis' ? renderAnalysisPanel() : renderSolutionsPanel()}
        </div>
      </div>
    </div>
  );

  // --- Render: Analysis Panel (Graph) ---
  const renderAnalysisPanel = () => (
    <div className={cn("rounded-2xl border p-6", theme.card)}>
      <div className="mb-6">
        <h2 className={cn("text-xl font-semibold mb-2", theme.textPrimary)}>
          Glucose Response Pattern
        </h2>
        <p className={theme.textSecondary}>
          Your Kraft Curve shows a delayed insulin response pattern typical of early metabolic dysfunction.
        </p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={GLUCOSE_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              stroke={isDarkMode ? "#5eead4" : "#64748b"} 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke={isDarkMode ? "#5eead4" : "#64748b"} 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              domain={[50, 180]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#112922' : '#fff', 
                border: `1px solid ${isDarkMode ? '#2a5c50' : '#e2e8f0'}`,
                borderRadius: '8px'
              }}
              labelStyle={{ color: isDarkMode ? '#5eead4' : '#1e293b' }}
            />
            <ReferenceLine y={100} stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="optimal" 
              stroke="#22c55e" 
              strokeWidth={2} 
              dot={false} 
              name="Optimal Response"
            />
            <Line 
              type="monotone" 
              dataKey="glucose" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#ef4444' }} 
              name="Your Pattern"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className={cn("p-4 rounded-xl", isDarkMode ? "bg-red-900/20 border border-red-800/30" : "bg-red-50 border border-red-100")}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-red-300" : "text-red-700")}>Peak: 165 mg/dL</span>
          </div>
          <p className={cn("text-xs", isDarkMode ? "text-red-400/70" : "text-red-600/70")}>Above optimal range at 45 min</p>
        </div>
        <div className={cn("p-4 rounded-xl", isDarkMode ? "bg-green-900/20 border border-green-800/30" : "bg-green-50 border border-green-100")}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-green-300" : "text-green-700")}>Optimal: 115 mg/dL</span>
          </div>
          <p className={cn("text-xs", isDarkMode ? "text-green-400/70" : "text-green-600/70")}>Target peak at 45 min</p>
        </div>
      </div>
    </div>
  );

  // --- Render: Solutions Panel (Vendor Cards) ---
  const renderSolutionsPanel = () => (
    <div>
      <div className="mb-6">
        <h2 className={cn("text-2xl font-semibold mb-2", theme.textPrimary)}>
          Recommended Support
        </h2>
        <p className={theme.textSecondary}>
          Verified vendors matched to your metabolic profile
        </p>
      </div>
      
      <div className="space-y-4">
        {vendors.length > 0 ? vendors.map((vendor, i) => (
          <VendorCard key={i} vendor={vendor} isDarkMode={isDarkMode} theme={theme} />
        )) : (
          // Default mock vendors if none from API
          <>
            <VendorCard 
              vendor={{
                title: "Taylor Made Rehab",
                category: "Metabolic Recovery Specialists",
                description: "Specialized protocol for delayed insulin response patterns. Combines targeted nutrition therapy, metabolic testing, and personalized supplementation to improve glucose-insulin dynamics.",
                price: "180",
                gap_solved: "Fatigue Protocol",
                type: 'vendor_card',
                tags: ["Insulin Resistance", "Fatigue Protocol"]
              }} 
              isDarkMode={isDarkMode} 
              theme={theme} 
            />
            <VendorCard 
              vendor={{
                title: "MetaBalance Clinic",
                category: "Endocrine & Metabolic Health",
                description: "Comprehensive metabolic assessment with advanced lab work. Includes CGM setup, detailed hormone panel analysis, and 3-month guided protocol for metabolic optimization.",
                price: "250",
                gap_solved: "Lab Analysis",
                type: 'vendor_card',
                tags: ["Lab Analysis", "Continuous Monitoring"]
              }} 
              isDarkMode={isDarkMode} 
              theme={theme} 
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen h-screen flex flex-col transition-colors duration-500 font-sans",
      theme.pageBg, 
      theme.textPrimary
    )}>
      {/* --- HEADER --- */}
      <header className={cn(
        "shrink-0 px-6 py-4 flex items-center justify-between border-b transition-colors",
        isDarkMode ? "border-teal-800/30 bg-[#0f2922]/80" : "border-slate-200 bg-white/80",
        "backdrop-blur-md"
      )}>
        <div className="flex items-center gap-2">
          <span className={cn("text-xl font-bold tracking-tight", theme.textPrimary)}>Me</span>
          <Droplet className="w-5 h-5 fill-teal-500 text-teal-500" />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={cn(
              "p-2 rounded-full transition-colors",
              isDarkMode ? "hover:bg-white/10 text-teal-300" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {/* Clinician Mode Badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
            isDarkMode 
              ? "bg-teal-900/30 border-teal-700/50 text-teal-400" 
              : "bg-teal-50 border-teal-100 text-teal-700"
          )}>
            <ShieldCheck size={14} />
            <span>Clinician Mode</span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={cn(
        "flex-1 flex overflow-hidden transition-all duration-700",
        phase === 'reactive' ? '' : ''
      )}>
        {phase === 'reactive' ? renderReactiveState() : renderSplitLayout()}
      </main>
    </div>
  );
}

// --- Vendor Card Component ---
interface VendorCardProps {
  vendor: Source;
  isDarkMode: boolean;
  theme: Record<string, string>;
}

function VendorCard({ vendor, isDarkMode, theme }: VendorCardProps) {
  const tags = vendor.tags || [vendor.gap_solved, vendor.category].filter(Boolean);
  
  return (
    <div className={cn(
      "rounded-2xl border p-6 transition-all duration-300",
      theme.card,
      theme.cardHover
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={cn("text-xl font-semibold mb-1", theme.textPrimary)}>
            {vendor.title}
          </h3>
          <p className={theme.textSecondary}>{vendor.category}</p>
        </div>
        <div className="text-right">
          <span className={cn("text-2xl font-bold", theme.textPrimary)}>
            ${vendor.price}
          </span>
          <p className={cn("text-xs", theme.textMuted)}>per session</p>
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => (
          <span 
            key={i} 
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium border",
              theme.tag
            )}
          >
            {tag}
          </span>
        ))}
      </div>
      
      {/* Description */}
      {vendor.description && (
        <p className={cn("text-sm mb-6 leading-relaxed", theme.textSecondary)}>
          {vendor.description}
        </p>
      )}
      
      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20">
          Book Session
        </button>
        <button className={cn(
          "px-5 py-3 border font-medium rounded-xl transition-all flex items-center gap-1",
          isDarkMode 
            ? "border-teal-700/50 text-teal-300 hover:bg-white/5" 
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        )}>
          Learn More <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}