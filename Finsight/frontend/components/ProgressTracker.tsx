"use client";

import { Database, FileText, CheckCircle2, Loader2, TrendingUp, Cpu, Zap } from "lucide-react";
import { ProgressEvent } from "@/lib/websocket";
import type { ResearchJob } from "@/lib/api";
import { motion } from "framer-motion";

const STAGES = [
  {
    id: "data_collection",
    label: "Data Collection",
    icon: Database,
    description: "yfinance · SEC EDGAR · FRED · Serper",
    color: "blue",
    gradient: "from-blue-600 to-blue-400",
    glow: "shadow-blue-500/40",
    bgActive: "bg-blue-500/15",
    borderActive: "border-blue-500/40",
    textActive: "text-blue-300",
  },
  {
    id: "parallel_perspectives",
    label: "Parallel Analysis",
    icon: Cpu,
    description: "6 agents · financial · risk · competitive",
    color: "violet",
    gradient: "from-violet-600 to-violet-400",
    glow: "shadow-violet-500/40",
    bgActive: "bg-violet-500/15",
    borderActive: "border-violet-500/40",
    textActive: "text-violet-300",
  },
  {
    id: "chart_generation",
    label: "Chart Generation",
    icon: TrendingUp,
    description: "6 charts · price · segments · peers · macro",
    color: "amber",
    gradient: "from-amber-500 to-orange-400",
    glow: "shadow-amber-500/40",
    bgActive: "bg-amber-500/15",
    borderActive: "border-amber-500/40",
    textActive: "text-amber-300",
  },
  {
    id: "report_generation",
    label: "Report Writing",
    icon: FileText,
    description: "Gemini 2.5 Flash · 15,000+ words",
    color: "emerald",
    gradient: "from-emerald-600 to-emerald-400",
    glow: "shadow-emerald-500/40",
    bgActive: "bg-emerald-500/15",
    borderActive: "border-emerald-500/40",
    textActive: "text-emerald-300",
  },
];

interface ProgressTrackerProps {
  job: ResearchJob | null;
  events: ProgressEvent[];
}

export function ProgressTracker({ job, events }: ProgressTrackerProps) {
  const currentStage = job?.stage || "";
  const wsProgress = events.filter(e => typeof e.progress === "number").at(-1)?.progress;
  const progress = wsProgress ?? job?.progress ?? 0;

  const completedStages = new Set(
    events.filter(e => e.type === "stage_done" && e.stage).map(e => e.stage as string)
  );

  const latestMessage = events.filter(e => e.message).at(-1)?.message;
  const stageIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="min-h-screen bg-[#050a18] px-6 py-12 relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-cyan-500/10 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto relative"
      >
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">FinSight Pipeline</h2>
              <p className="text-slate-500 text-[12px] font-medium">Multi-agent AI research in progress</p>
            </div>
          </div>
          <p className="text-slate-400 text-[13px] min-h-5 ml-0.5">
            {latestMessage || "Initialising the AI research pipeline..."}
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Overall Progress</span>
            <span className="text-[13px] font-bold text-white tabular-nums">{progress}%</span>
          </div>
          <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
            {/* Shimmer */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-32 animate-shimmer rounded-full"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isComplete = completedStages.has(stage.id);
            const isActive = !isComplete && currentStage === stage.id;
            const isPending = !isComplete && !isActive && idx > stageIndex;

            return (
              <motion.div
                key={stage.id}
                layout
                whileHover={{ y: -4 }}
                className={`relative p-5 rounded-2xl border transition-all duration-500 ${
                  isActive
                    ? `${stage.bgActive} ${stage.borderActive} shadow-lg ${stage.glow}`
                    : isComplete
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-white/[0.025] border-white/[0.07]"
                }`}
              >
                {/* Active pulse ring */}
                {isActive && (
                  <div className={`absolute inset-0 rounded-2xl border-2 ${stage.borderActive} animate-pulse opacity-50`} />
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? `bg-gradient-to-br ${stage.gradient} shadow-md ${stage.glow}`
                    : isComplete ? "bg-emerald-500/20"
                    : "bg-white/[0.05]"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive ? "text-white"
                      : isComplete ? "text-emerald-400"
                      : "text-slate-600"
                    }`} />
                  </div>
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className={`w-5 h-5 ${stage.textActive} animate-spin`} />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${isPending ? "bg-slate-700" : "bg-slate-700"}`} />
                  )}
                </div>

                <div>
                  <p className={`text-[13px] font-bold mb-1 ${
                    isActive ? stage.textActive : isComplete ? "text-emerald-300" : "text-slate-400"
                  }`}>{stage.label}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{stage.description}</p>
                </div>

                {/* Progress bar within active stage */}
                {isActive && (
                  <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${stage.gradient} rounded-full animate-pulse`} style={{ width: "60%" }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Activity log */}
        {events.length > 0 && (
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Live Activity Log</h3>
            </div>
            <div className="p-4 space-y-1.5 max-h-52 overflow-y-auto font-mono text-[11px]">
              {events.slice(-20).map((event, i) => (
                <div key={i} className="flex items-start gap-3 text-slate-400 hover:text-slate-300 transition-colors">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    event.type === "complete" ? "bg-emerald-500/20 text-emerald-400"
                    : event.type === "error"    ? "bg-rose-500/20 text-rose-400"
                    : event.type === "stage_start" ? "bg-blue-500/20 text-blue-400"
                    : "bg-white/5 text-slate-600"
                  }`}>
                    {event.type}
                  </span>
                  <span className="flex-1">{event.message || event.stage || ""}</span>
                  {typeof event.progress === "number" && (
                    <span className="shrink-0 text-blue-400 tabular-nums">{event.progress}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  );
}
