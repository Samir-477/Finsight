"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ComponentType } from "react";
import {
  Plus, TrendingUp, Clock, CheckCircle2, XCircle,
  Loader2, Search, Building2, BarChart2, Cpu, Database,
  FileText, ChevronRight, Zap, Globe, Shield,
  ArrowRight, Activity, Sparkles, Radar,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { startResearch, getJobStatus, getReport } from "@/lib/api";
import type { ResearchJob } from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ReportViewer } from "@/components/ReportViewer";

type AppState = "selection" | "progress" | "report";

interface HistoryItem {
  jobId: string;
  ticker: string;
  companyName: string;
  date: string;
  status: "completed" | "failed" | "running";
  report?: string;
}

const LS_KEY = "finsight_history";
function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 50)));
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function PremiumBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="premium-grid absolute inset-0 opacity-80" />
      <div className="absolute inset-x-[-20%] top-20 h-px scanline" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#050a18] via-[#050a18]/70 to-transparent" />
    </div>
  );
}

/* ─── Status Badge ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  if (status === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  return <Loader2 className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin" />;
}

/* ─── Sidebar ─────────────────────────────────────────────────── */
function Sidebar({ history, activeJobId, onNew, onSelectHistory }: {
  history: HistoryItem[]; activeJobId: string | null;
  onNew: () => void; onSelectHistory: (item: HistoryItem) => void;
}) {
  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:flex w-64 shrink-0 h-screen flex-col bg-[#070d1a]/85 backdrop-blur-2xl border-r border-white/[0.09] fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.07]">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-white font-bold text-[13px] tracking-wide leading-none">FinSight</p>
          <p className="text-slate-600 text-[11px] mt-0.5 font-medium">AI Research Platform</p>
        </div>
      </div>

      {/* New Analysis */}
      <div className="px-3 pt-3 pb-2">
        <motion.button
          onClick={onNew}
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:brightness-110 text-white text-[13px] font-semibold transition-all duration-200 shadow-lg shadow-cyan-600/20 group"
        >
          <Plus className="w-4 h-4" />
          New Analysis
          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
        </motion.button>
      </div>

      <div className="px-5 pt-3 pb-1.5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600 font-bold">Recent Reports</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {history.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-slate-700" />
            </div>
            <p className="text-[11px] text-slate-600 font-medium">No reports yet</p>
            <p className="text-[10px] text-slate-700 mt-1">Run your first analysis above</p>
          </div>
        ) : (
          history.map((item) => {
            const isActive = item.jobId === activeJobId;
            return (
              <motion.button
                key={item.jobId}
                onClick={() => onSelectHistory(item)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.985 }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                  isActive
                    ? "bg-blue-600/15 border border-blue-500/25"
                    : "hover:bg-white/[0.05] border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-[12px] font-bold truncate font-mono tracking-wide ${isActive ? "text-blue-300" : "text-slate-300 group-hover:text-white"}`}>
                      {item.ticker}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{item.companyName}</p>
                    <p className="text-[10px] text-slate-700 mt-0.5">{item.date}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {["gemini","groq"].map(m => (
              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium capitalize">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

/* ─── Feature Card ─────────────────────────────────────────────── */
type IconComponent = ComponentType<{ className?: string }>;

function FeatureCard({ icon: Icon, title, desc, color }: {
  icon: IconComponent; title: string; desc: string; color: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ duration: 0.25 }}
      className="group relative p-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 cursor-default overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-lg ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-[13px] font-semibold text-white mb-1">{title}</p>
      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function MarketSignalPanel() {
  const streams = [
    { label: "SEC filings", value: "10-K", tone: "text-cyan-300", x: "left-[8%]", y: "top-[12%]" },
    { label: "Macro pulse", value: "FRED", tone: "text-emerald-300", x: "right-[10%]", y: "top-[22%]" },
    { label: "Peer map", value: "LIVE", tone: "text-violet-300", x: "left-[15%]", y: "bottom-[24%]" },
    { label: "Report engine", value: "AI", tone: "text-amber-300", x: "right-[16%]", y: "bottom-[14%]" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:block relative h-[520px] rounded-[2rem] glass-panel overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(6,182,212,0.14),transparent_35%,rgba(139,92,246,0.13)_70%,rgba(16,185,129,0.1))]" />
      <div className="absolute inset-8 rounded-[1.5rem] border border-white/[0.08]" />
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15"
      />

      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[#07111f]/85 border border-white/15 shadow-2xl shadow-cyan-500/10 flex flex-col items-center justify-center">
        <Radar className="w-8 h-8 text-cyan-300" />
        <p className="mt-2 text-[11px] font-bold text-white tracking-[0.18em]">FINSIGHT</p>
      </div>

      {streams.map((stream, index) => (
        <motion.div
          key={stream.label}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ delay: 0.18 * index, y: { duration: 5 + index, repeat: Infinity, ease: "easeInOut" } }}
          className={`absolute ${stream.x} ${stream.y} min-w-32 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 backdrop-blur-xl shadow-xl`}
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-bold">{stream.label}</p>
          <p className={`mt-1 text-xl font-black ${stream.tone}`}>{stream.value}</p>
        </motion.div>
      ))}

      <div className="absolute bottom-7 left-7 right-7 rounded-2xl bg-black/20 border border-white/[0.08] p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          Live intelligence stack
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Market", "Charts", "Thesis"].map((label, index) => (
            <div key={label} className="rounded-xl bg-white/[0.05] border border-white/[0.07] p-3">
              <div className="h-1 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${72 + index * 10}%` }} />
              <p className="mt-2 text-[11px] text-slate-300 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Selection Screen ─────────────────────────────────────────── */
function SelectionPanel({ onStart }: { onStart: (jobId: string, ticker: string, name: string) => void }) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("financial_company");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const SUGGESTIONS = [
    { ticker: "AAPL",  name: "Apple Inc.",       sector: "Tech" },
    { ticker: "MSFT",  name: "Microsoft",         sector: "Tech" },
    { ticker: "NVDA",  name: "NVIDIA Corp.",      sector: "Chips" },
    { ticker: "GOOGL", name: "Alphabet Inc.",     sector: "Tech" },
    { ticker: "AMZN",  name: "Amazon.com",        sector: "E-com" },
    { ticker: "META",  name: "Meta Platforms",    sector: "Social" },
    { ticker: "TSLA",  name: "Tesla Inc.",        sector: "EV" },
    { ticker: "JPM",   name: "JPMorgan Chase",    sector: "Finance" },
  ];

  const TYPES = [
    { value: "financial_company", label: "Public Company",    icon: Building2 },
    { value: "industry",          label: "Sector / Industry", icon: BarChart2 },
    { value: "macro",             label: "Macro / Economy",   icon: Globe },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker || !name) return;
    setLoading(true);
    setError("");
    try {
      const job = await startResearch({
        target_name: name, stock_code: ticker, target_type: type, language: "en", custom_tasks: [],
      });
      onStart(job.job_id, ticker, name);
    } catch {
      setError("Failed to connect to backend. Is the backend running?");
    } finally { setLoading(false); }
  }

  const FEATURES = [
    { icon: Database,   title: "Live Market Data",     desc: "Real-time yfinance, SEC EDGAR, FRED macro indicators",        color: "bg-blue-500/15 text-blue-400" },
    { icon: Cpu,        title: "6 Parallel Agents",    desc: "Financial, risk, competitive, macro, stock & segment analysis", color: "bg-violet-500/15 text-violet-400" },
    { icon: BarChart2,  title: "6 Pro Charts",         desc: "Price/volume, revenue, margins, peers, FCF, macro dashboard",  color: "bg-cyan-500/15 text-cyan-400" },
    { icon: FileText,   title: "15K+ Word Report",     desc: "Institutional-grade investment report with bull/base/bear",    color: "bg-emerald-500/15 text-emerald-400" },
    { icon: Activity,   title: "Real-time Progress",   desc: "WebSocket streaming — watch each pipeline stage live",         color: "bg-amber-500/15 text-amber-400" },
    { icon: Shield,     title: "LLM Fallbacks",        desc: "Gemini 2.5 Flash → Groq llama-3.3-70b → template guarantee",  color: "bg-rose-500/15 text-rose-400" },
  ];

  return (
    <div className="min-h-screen px-6 py-10 xl:py-14 relative overflow-hidden">
      <PremiumBackdrop />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_500px]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-col justify-center"
        >
          <motion.div variants={fadeUp} className="mb-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-300/20 text-cyan-200 text-[11px] font-semibold mb-5 uppercase tracking-widest shadow-lg shadow-cyan-500/10">
              <Zap className="w-3 h-3" />
              AI-Powered Financial Research
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white mb-5 leading-[1.02] tracking-tight">
              Institutional Research
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-emerald-300">
                with a live agent desk
              </span>
            </h1>
            <p className="text-slate-400 text-[15px] leading-relaxed max-w-xl">
              6-stage multi-agent pipeline, live market data, chart generation, WebSocket progress, and export-ready investment reports.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={fadeUp} className="w-full max-w-[580px] mb-7 relative">
            <div className="relative glass-panel rounded-3xl p-7">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-400/10 via-transparent to-emerald-400/5 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="relative space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
                  Stock Ticker
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${focused === "ticker" ? "ring-2 ring-blue-500/40" : ""}`}>
                  <input
                    value={ticker}
                    onChange={e => setTicker(e.target.value.toUpperCase())}
                    onFocus={() => setFocused("ticker")}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. NVDA"
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 text-[13px] font-mono font-bold tracking-widest focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
                  Company Name
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${focused === "name" ? "ring-2 ring-blue-500/40" : ""}`}>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. NVIDIA Corp."
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 text-[13px] focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Analysis Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">Analysis Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${
                        type === t.value
                          ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                          : "bg-white/[0.04] border-white/[0.07] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[12px]">
                <XCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !ticker || !name}
              whileHover={!loading && ticker && name ? { y: -2, scale: 1.01 } : undefined}
              whileTap={!loading && ticker && name ? { scale: 0.985 } : undefined}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-600/25 text-[13px] group"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Starting Pipeline…</>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Run Deep Research
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Quick picks */}
        <div className="mt-5">
          <p className="text-[10px] text-slate-600 text-center mb-3 uppercase tracking-[0.12em] font-bold">Quick picks</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map(s => (
              <motion.button
                key={s.ticker}
                onClick={() => { setTicker(s.ticker); setName(s.name); }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/15 rounded-full text-[11px] text-slate-400 hover:text-white transition-all group"
              >
                <span className="font-mono font-bold text-slate-300 group-hover:text-blue-300 tracking-wide">{s.ticker}</span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-600 hidden sm:inline">{s.sector}</span>
              </motion.button>
            ))}
          </div>
        </div>
          </motion.div>

          {/* Feature grid */}
          <motion.div variants={fadeUp} className="w-full max-w-3xl">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.12em] font-bold mb-4">What FinSight generates</p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
            </motion.div>
          </motion.div>
        </motion.div>

        <MarketSignalPanel />
      </div>
    </div>
  );
}

/* ─── Progress Panel ────────────────────────────────────────────── */
function ProgressPanel({ jobId, onComplete }: {
  jobId: string; onComplete: (report: string, job: ResearchJob) => void;
}) {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const { events } = useWebSocket(jobId);
  const fetchedReport = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const j = await getJobStatus(jobId);
        setJob(j);
        if (j.status === "done" && !fetchedReport.current) {
          fetchedReport.current = true;
          clearInterval(interval);
          const data = await getReport(jobId);
          onComplete(data.markdown, j);
        }
      } catch { /* swallow */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  return (
    <div className="flex-1 overflow-y-auto">
      <ProgressTracker job={job} events={events} />
    </div>
  );
}

/* ─── Root App ──────────────────────────────────────────────────── */
export default function App() {
  const [appState, setAppState] = useState<AppState>("selection");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeTicker, setActiveTicker] = useState("");
  const [activeName, setActiveName] = useState("");
  const [report, setReport] = useState("");
  const [activeJob, setActiveJob] = useState<ResearchJob | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const upsertHistory = useCallback((item: Partial<HistoryItem> & { jobId: string }) => {
    setHistory(prev => {
      const idx = prev.findIndex(h => h.jobId === item.jobId);
      let next: HistoryItem[];
      if (idx >= 0) next = prev.map(h => h.jobId === item.jobId ? { ...h, ...item } as HistoryItem : h);
      else next = [item as HistoryItem, ...prev];
      saveHistory(next);
      return next;
    });
  }, []);

  function handleStart(jobId: string, ticker: string, name: string) {
    setActiveJobId(jobId); setActiveTicker(ticker); setActiveName(name);
    setReport(""); setActiveJob(null); setAppState("progress");
    upsertHistory({
      jobId, ticker, companyName: name,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "running",
    });
  }

  function handleComplete(md: string, job: ResearchJob) {
    setReport(md); setActiveJob(job); setAppState("report");
    upsertHistory({
      jobId: job.job_id, ticker: activeTicker, companyName: activeName,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "completed", report: md,
    });
  }

  function handleNew() {
    setAppState("selection"); setActiveJobId(null); setReport(""); setActiveJob(null);
  }

  function handleSelectHistory(item: HistoryItem) {
    setActiveJobId(item.jobId); setActiveTicker(item.ticker); setActiveName(item.companyName);
    if (item.report) {
      setReport(item.report);
      setActiveJob({ job_id: item.jobId, status: item.status, stage: "", progress: 100, report_path: "", error: "" });
      setAppState("report");
    }
    else if (item.status === "running") setAppState("progress");
    else setAppState("selection");
  }

  return (
    <div className="flex h-screen bg-[#050a18] overflow-hidden">
      <Sidebar
        history={history} activeJobId={activeJobId}
        onNew={handleNew} onSelectHistory={handleSelectHistory}
      />
      <div className="flex-1 md:ml-64 h-screen overflow-y-auto">
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.08] bg-[#050a18]/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-black text-white">FinSight</span>
          </div>
          <button onClick={handleNew} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-slate-200">
            New
          </button>
        </div>
        <AnimatePresence mode="wait">
          {appState === "selection" && (
            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SelectionPanel onStart={handleStart} />
            </motion.div>
          )}
          {appState === "progress" && activeJobId && (
            <motion.div key="progress" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
              <ProgressPanel jobId={activeJobId} onComplete={handleComplete} />
            </motion.div>
          )}
          {appState === "report" && report && (
            <motion.div key="report" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
              <ReportViewer report={report} job={activeJob} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
