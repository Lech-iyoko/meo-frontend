'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Moon, Sun, ChevronRight, Activity, Stethoscope, Upload } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

// --- Mock Data for the Kraft Curve Analysis ---
const GLUCOSE_INSULIN_DATA = [
  { time: '0 min', glucose: 85, insulin: 5 },
  { time: '15 min', glucose: 120, insulin: 45 },
  { time: '30 min', glucose: 145, insulin: 85 },
  { time: '45 min', glucose: 155, insulin: 95 },
  { time: '60 min', glucose: 140, insulin: 75 },
  { time: '90 min', glucose: 110, insulin: 45 },
  { time: '120 min', glucose: 95, insulin: 25 },
  { time: '150 min', glucose: 90, insulin: 15 },
  { time: '180 min', glucose: 88, insulin: 8 },
];

export default function MeOInterface() {
  // --- State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'solutions'>('analysis');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [vendors, setVendors] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Apply theme class to document
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      
      // State Machine Logic
      const foundVendors = data.retrieved_sources?.filter((s: Source) => s.type === 'vendor_card') || [];
      
      if (foundVendors.length > 0) {
        setVendors(foundVendors);
        setActiveTab('solutions');
      } else if (
        botResponse.toLowerCase().includes("graph") || 
        botResponse.toLowerCase().includes("chart") || 
        botResponse.toLowerCase().includes("crash") ||
        botResponse.toLowerCase().includes("spike") ||
        botResponse.toLowerCase().includes("curve") ||
        botResponse.toLowerCase().includes("pattern") ||
        botResponse.toLowerCase().includes("kraft") ||
        botResponse.toLowerCase().includes("glucose") ||
        botResponse.toLowerCase().includes("insulin")
      ) {
        setActiveTab('analysis');
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

  // --- Theme Toggle Button ---
  const ThemeToggle = () => (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-background/80 backdrop-blur border border-medical-border hover:bg-medical-accent transition-colors"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-medical-primary" />
      ) : (
        <Moon className="h-5 w-5 text-medical-primary" />
      )}
    </button>
  );

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
      <div className="min-h-screen bg-gradient-to-br from-background via-medical-bg to-medical-accent/10 flex items-center justify-center p-4">
        <ThemeToggle />

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
    <div className="h-screen flex bg-gradient-to-br from-background via-medical-bg to-medical-accent/10">
      <ThemeToggle />

      {/* Left Panel - Chat Thread */}
      <div className="w-full md:w-[30%] border-r border-medical-border bg-card/50 backdrop-blur flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-medical-border bg-card/80">
          <Logo size="small" />
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
                <p className="text-sm leading-relaxed">{msg.content}</p>
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

      {/* Right Panel - Workspace with Tabs */}
      <div className="hidden md:flex flex-1 flex-col p-6 overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-card border border-medical-border rounded-lg w-fit mb-6">
          <button
            onClick={() => setActiveTab('analysis')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'analysis'
                ? "bg-medical-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-medical-accent"
            )}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'solutions'
                ? "bg-medical-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-medical-accent"
            )}
          >
            Solutions
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'analysis' ? (
            // Analysis Tab
            <div className="bg-card border border-medical-border rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-2">Kraft Curve Analysis</h3>
              <p className="text-muted-foreground mb-6">Glucose & Insulin Response Over Time</p>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={GLUCOSE_INSULIN_DATA}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-medical-border" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--color-medical-border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--color-medical-border)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-medical-border)',
                        borderRadius: '8px',
                        color: 'var(--color-card-foreground)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="glucose"
                      stroke="var(--color-medical-primary)"
                      strokeWidth={3}
                      name="Glucose (mg/dL)"
                      dot={{ fill: 'var(--color-medical-primary)', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="insulin"
                      stroke="var(--color-medical-primary-dark)"
                      strokeWidth={3}
                      name="Insulin (μIU/mL)"
                      dot={{ fill: 'var(--color-medical-primary-dark)', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-medical-accent rounded-lg border border-medical-border">
                  <p className="text-sm text-muted-foreground">Peak Glucose</p>
                  <p className="text-2xl font-bold text-foreground">155 mg/dL</p>
                  <p className="text-xs text-muted-foreground mt-1">at 45 minutes</p>
                </div>
                <div className="p-4 bg-medical-accent rounded-lg border border-medical-border">
                  <p className="text-sm text-muted-foreground">Peak Insulin</p>
                  <p className="text-2xl font-bold text-foreground">95 μIU/mL</p>
                  <p className="text-xs text-muted-foreground mt-1">at 45 minutes</p>
                </div>
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                  <p className="text-sm text-destructive">Pattern Detected</p>
                  <p className="text-lg font-bold text-destructive">Delayed Response</p>
                  <p className="text-xs text-destructive/80 mt-1">Early insulin resistance</p>
                </div>
              </div>
            </div>
          ) : (
            // Solutions Tab
            <div className="bg-card border border-medical-border rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-2">Recommended Support</h3>
              <p className="text-muted-foreground mb-6">Verified vendors matched to your metabolic profile</p>

              <div className="space-y-4">
                {vendors.length > 0 ? vendors.map((vendor, i) => (
                  <VendorCard key={i} vendor={vendor} />
                )) : (
                  <>
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
                    <VendorCard 
                      vendor={{
                        title: "MetaBalance Clinic",
                        category: "Endocrine & Metabolic Health",
                        description: "Comprehensive metabolic assessment with advanced lab work. Includes CGM setup, detailed hormone panel analysis, and 3-month guided protocol for metabolic optimization.",
                        price: "250",
                        type: 'vendor_card',
                        tags: ["Lab Analysis", "Continuous Monitoring"]
                      }} 
                    />
                  </>
                )}
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