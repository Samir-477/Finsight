"use client";

import { useState } from "react";
import {
  Download, Copy, FileText, TrendingUp, Building2, BarChart2,
  Activity, PieChart, Swords, ShieldAlert, Globe2, Telescope,
  Star, BookOpen, Check, ChevronRight, Printer, CircleDollarSign,
  Landmark, Target,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResearchJob } from "@/lib/api";

interface ReportViewerProps { report: string; job: ResearchJob | null; }

const SECTIONS = [
  { key: "executive",      label: "Executive Summary",       icon: Star,        color: "blue",    num: 1 },
  { key: "company",        label: "Company Overview",         icon: Building2,   color: "indigo",  num: 2 },
  { key: "financial",      label: "Financial Analysis",       icon: BarChart2,   color: "cyan",    num: 3 },
  { key: "stock",          label: "Stock Performance",        icon: Activity,    color: "emerald", num: 4 },
  { key: "segment",        label: "Business Segments",        icon: PieChart,    color: "violet",  num: 5 },
  { key: "competitive",    label: "Competitive Analysis",     icon: Swords,      color: "fuchsia", num: 6 },
  { key: "risk",           label: "Risk Factors",             icon: ShieldAlert, color: "rose",    num: 7 },
  { key: "macro",          label: "Macro Environment",        icon: Globe2,      color: "amber",   num: 8 },
  { key: "outlook",        label: "Outlook & Catalysts",      icon: Telescope,   color: "teal",    num: 9 },
  { key: "recommendation", label: "Investment Rec.",          icon: TrendingUp,  color: "green",   num: 10 },
  { key: "references",     label: "References",               icon: BookOpen,    color: "slate",   num: 11 },
];

const C: Record<string, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  blue:    { bg: "bg-blue-500/8",    border: "border-blue-500/25",    text: "text-blue-300",    badge: "bg-blue-500/15 text-blue-300",    dot: "bg-blue-400" },
  indigo:  { bg: "bg-indigo-500/8",  border: "border-indigo-500/25",  text: "text-indigo-300",  badge: "bg-indigo-500/15 text-indigo-300",  dot: "bg-indigo-400" },
  cyan:    { bg: "bg-cyan-500/8",    border: "border-cyan-500/25",    text: "text-cyan-300",    badge: "bg-cyan-500/15 text-cyan-300",    dot: "bg-cyan-400" },
  emerald: { bg: "bg-emerald-500/8", border: "border-emerald-500/25", text: "text-emerald-300", badge: "bg-emerald-500/15 text-emerald-300", dot: "bg-emerald-400" },
  violet:  { bg: "bg-violet-500/8",  border: "border-violet-500/25",  text: "text-violet-300",  badge: "bg-violet-500/15 text-violet-300",  dot: "bg-violet-400" },
  fuchsia: { bg: "bg-fuchsia-500/8", border: "border-fuchsia-500/25", text: "text-fuchsia-300", badge: "bg-fuchsia-500/15 text-fuchsia-300", dot: "bg-fuchsia-400" },
  rose:    { bg: "bg-rose-500/8",    border: "border-rose-500/25",    text: "text-rose-300",    badge: "bg-rose-500/15 text-rose-300",    dot: "bg-rose-400" },
  amber:   { bg: "bg-amber-500/8",   border: "border-amber-500/25",   text: "text-amber-300",   badge: "bg-amber-500/15 text-amber-300",   dot: "bg-amber-400" },
  teal:    { bg: "bg-teal-500/8",    border: "border-teal-500/25",    text: "text-teal-300",    badge: "bg-teal-500/15 text-teal-300",    dot: "bg-teal-400" },
  green:   { bg: "bg-green-500/8",   border: "border-green-500/25",   text: "text-green-300",   badge: "bg-green-500/15 text-green-300",   dot: "bg-green-400" },
  slate:   { bg: "bg-slate-500/8",   border: "border-slate-500/25",   text: "text-slate-300",   badge: "bg-slate-500/15 text-slate-300",   dot: "bg-slate-500" },
};

function getSec(title: string) {
  const t = title.toLowerCase();
  if (t.includes("executive")) return SECTIONS[0];
  if (t.includes("company") || t.includes("overview")) return SECTIONS[1];
  if (t.includes("financial") || t.includes("income") || t.includes("balance")) return SECTIONS[2];
  if (t.includes("stock") || t.includes("performance")) return SECTIONS[3];
  if (t.includes("segment") || t.includes("business segment")) return SECTIONS[4];
  if (t.includes("competitive") || t.includes("peer")) return SECTIONS[5];
  if (t.includes("risk")) return SECTIONS[6];
  if (t.includes("macro") || t.includes("environment")) return SECTIONS[7];
  if (t.includes("outlook") || t.includes("catalyst")) return SECTIONS[8];
  if (t.includes("recommendation") || t.includes("investment rec")) return SECTIONS[9];
  if (t.includes("reference") || t.includes("data source")) return SECTIONS[10];
  return null;
}

function extractMetrics(md: string) {
  const get = (p: RegExp) => { const m = md.match(p); return m ? m[1] : null; };
  return {
    ticker:    get(/\(([A-Z]{2,5})\)/) || "—",
    price:     get(/Current Price[:\*]+\s*\$?([\d,\.]+)/) || "—",
    marketCap: get(/Market Cap[:\*]+\s*([\$\d\.]+[BKMB]*)/) || "—",
    consensus: get(/Analyst Consensus[:\*]+\s*([A-Z_]+)/) || "—",
    target:    get(/Price Target[:\*]+\s*\$?([\d,\.]+)/) || "—",
  };
}

function makeComponents() {
  return {
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <div className="my-8 group">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] shadow-2xl shadow-black/50 transition-all group-hover:border-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt || "Chart"} className="w-full object-contain max-h-[480px]" loading="lazy" />
          {alt && (
            <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.07] bg-white/[0.02]">
              <BarChart2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <p className="text-[12px] text-slate-300 font-medium">{alt}</p>
            </div>
          )}
        </div>
      </div>
    ),

    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02]">
        <table className="w-full text-[12px]">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-white/[0.06] text-slate-300 text-[11px] uppercase tracking-wider">{children}</thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr className="hover:bg-white/[0.04] transition-colors">{children}</tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="px-4 py-3 text-left text-slate-400 font-semibold">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="px-4 py-3 text-slate-300">{children}</td>
    ),

    h1: ({ children }: { children?: React.ReactNode }) => {
      const title = String(children ?? "");
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const sec = getSec(title);
      const c = sec ? C[sec.color] : C.slate;
      const Icon = sec?.icon ?? FileText;
      return (
        <div id={id} className={`flex items-center gap-3 mt-10 mb-5 pt-5 pb-4 px-5 rounded-2xl border ${c.border} ${c.bg} scroll-mt-24`}>
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${c.badge} shrink-0`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <h1 className={`text-[17px] font-black ${c.text} leading-tight`}>{children}</h1>
        </div>
      );
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const title = String(children ?? "");
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const sec = getSec(title);
      const c = sec ? C[sec.color] : C.slate;
      const Icon = sec?.icon ?? FileText;
      return (
        <div id={id} className={`flex items-center gap-3 mt-8 mb-4 pt-4 pb-3.5 px-5 rounded-xl border ${c.border} ${c.bg} scroll-mt-24`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${c.badge} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className={`text-[15px] font-bold ${c.text}`}>{children}</h2>
        </div>
      );
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const title = String(children ?? "");
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return (
        <h3 id={id} className="flex items-center gap-2 text-white font-bold text-[14px] mt-6 mb-3 scroll-mt-24">
          <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
          {children}
        </h3>
      );
    },

    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-slate-300 leading-[1.8] mb-4 text-[13.5px]">{children}</p>
    ),

    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="space-y-2 mb-4">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="flex items-start gap-2.5 text-slate-300 leading-[1.7] text-[13px]">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        <span>{children}</span>
      </li>
    ),

    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="text-slate-300 italic">{children}</em>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[12px] font-mono border border-blue-500/20">{children}</code>
    ),
    hr: () => <hr className="my-8 border-white/[0.07]" />,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-blue-500/60 pl-4 my-4 py-2 bg-blue-500/5 rounded-r-xl text-slate-300 italic text-[13px]">{children}</blockquote>
    ),
  };
}

export function ReportViewer({ report, job }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const metrics = extractMetrics(report);
  const wordCount = report ? report.split(/\s+/).filter(Boolean).length : 0;
  const shortJobId = job?.job_id ? job.job_id.slice(0, 8) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = report
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^---$/gim, "<hr>")
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g,
        '<figure><img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:16px 0;border:1px solid #e5e7eb;"><figcaption style="text-align:center;color:#6b7280;font-size:11px;margin-top:6px;font-style:italic;">$1</figcaption></figure>')
      .replace(/\|(.+)\|/g, line => {
        const cells = line.split("|").filter(Boolean).map(c => `<td>${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      })
      .replace(/^- (.+)$/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[hHuUtT])(.+)$/gim, "<p>$1</p>");

    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>FinSight — ${metrics.ticker} Research Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a2e; background: #fff;
               font-size: 11pt; line-height: 1.75; padding: 48px 64px; max-width: 900px; margin: 0 auto; }
        h1 { font-size: 20pt; color: #1a1a2e; margin: 28px 0 14px;
             border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h2 { font-size: 15pt; color: #1e3a5f; margin: 22px 0 10px;
             border-left: 4px solid #3b82f6; padding-left: 14px; }
        h3 { font-size: 12pt; color: #374151; margin: 16px 0 8px; font-weight: 700; }
        p { margin-bottom: 10px; }
        strong { color: #111827; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 10pt; }
        th { background: #1e3a5f; color: #fff; padding: 9px 13px; text-align: left; font-size: 9.5pt; }
        td { padding: 8px 13px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
        tr:nth-child(even) td { background: #f9fafb; }
        ul, ol { margin: 8px 0 14px 22px; }
        li { margin-bottom: 5px; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
        figure { text-align: center; margin: 22px 0; page-break-inside: avoid; }
        img { max-width: 100%; height: auto; }
        figcaption { color: #6b7280; font-size: 9.5pt; margin-top: 8px; }
        .cover { text-align: center; padding: 64px 0 44px; border-bottom: 3px solid #3b82f6; margin-bottom: 36px; }
        .cover h1 { border: none; font-size: 26pt; }
        .cover .meta { color: #6b7280; margin-top: 14px; font-size: 11pt; }
        .cover .badge { display: inline-block; background: #dbeafe; color: #1e40af;
                        padding: 5px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; font-size: 12pt; }
        @media print { body { padding: 24px 40px; } h2 { page-break-before: auto; } figure { page-break-inside: avoid; } }
      </style></head><body>
      <div class="cover">
        <h1>${metrics.ticker} Investment Research Report</h1>
        <p class="meta">FinSight AI Research &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p class="meta">Price: <strong>$${metrics.price}</strong> &nbsp;|&nbsp; Market Cap: <strong>${metrics.marketCap}</strong> &nbsp;|&nbsp; Target: <strong>$${metrics.target}</strong></p>
        <div class="badge">${metrics.consensus.replace("_", " ")}</div>
      </div>
      ${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 1200);
  };

  const scrollToSection = (label: string) => {
    const elems = document.querySelectorAll("h1, h2, h3");
    const lower = label.toLowerCase();
    for (const el of Array.from(elems)) {
      if ((el.textContent ?? "").toLowerCase().includes(lower)) {
        let sp: Element | null = el.parentElement;
        while (sp) {
          const s = window.getComputedStyle(sp);
          if (s.overflowY === "auto" || s.overflowY === "scroll") break;
          sp = sp.parentElement;
        }
        if (sp) {
          sp.scrollTo({ top: el.getBoundingClientRect().top - sp.getBoundingClientRect().top + sp.scrollTop - 72, behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
    }
  };

  const consensusColor =
    metrics.consensus.includes("BUY") ? "text-emerald-400" :
    metrics.consensus.includes("SELL") ? "text-rose-400" : "text-amber-400";

  const METRIC_CARDS = [
    { label: "Current Price", value: `$${metrics.price}`, sub: "Live market", icon: CircleDollarSign, accent: "text-white" },
    { label: "Market Cap",    value: metrics.marketCap,   sub: "Total value",  icon: Landmark, accent: "text-white" },
    { label: "Price Target",  value: `$${metrics.target}`, sub: "Analyst mean", icon: Target, accent: "text-emerald-300" },
    { label: "Consensus",     value: metrics.consensus.replace("_", " "), sub: "Wall Street", icon: Activity, accent: consensusColor },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-[#050a18] relative overflow-hidden"
    >
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-45" />
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#050a18]/95 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 font-mono font-black text-[13px] tracking-wider">
              {metrics.ticker}
            </span>
            <span className="text-slate-500 text-[12px] hidden sm:inline">{wordCount.toLocaleString()} words</span>
            {shortJobId && (
              <span className="text-slate-600 text-[11px] hidden md:inline font-mono">#{shortJobId}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.06] hover:bg-white/10 border border-white/10 text-slate-300 text-[12px] rounded-lg transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[12px] rounded-lg transition-all font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-blue-950/30 via-transparent to-cyan-950/15">
        <div className="max-w-screen-2xl mx-auto px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {METRIC_CARDS.map((m, index) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] px-5 py-4 hover:border-white/15 hover:bg-white/[0.07] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.1em] font-bold mb-1">{m.label}</p>
                      <p className={`text-xl font-black ${m.accent} tabular-nums leading-none`}>{m.value}</p>
                      <p className="text-[10px] text-slate-600 mt-1.5">{m.sub}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-cyan-300">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8 flex gap-8">
        {/* TOC sidebar */}
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-24 space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600 font-bold mb-3 px-3">Contents</p>
            {SECTIONS.map(sec => {
              const c = C[sec.color];
              const Icon = sec.icon;
              return (
                <button
                  key={sec.key}
                  onClick={() => scrollToSection(sec.label)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12px] transition-all group hover:bg-white/[0.06] border border-transparent hover:border-white/[0.07]"
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${c.text} opacity-55 group-hover:opacity-100 transition-opacity`} />
                  <span className="text-slate-500 group-hover:text-slate-200 truncate transition-colors">
                    {sec.num}. {sec.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Report content */}
        <main className="flex-1 min-w-0">
          {/* Mobile TOC pills */}
          <div className="xl:hidden flex flex-wrap gap-1.5 mb-6">
            {SECTIONS.map(sec => {
              const c = C[sec.color];
              return (
                <button
                  key={sec.key}
                  onClick={() => scrollToSection(sec.label)}
                  className={`px-2.5 py-1 text-[10px] rounded-full border ${c.badge} ${c.border} transition-all hover:opacity-80 font-medium`}
                >
                  {sec.num}. {sec.label}
                </button>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40"
          >
            <div className="p-8 md:p-10">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={makeComponents() as Components}
              >
                {report}
              </ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.07] px-8 py-5 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">FinSight AI Research</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {wordCount.toLocaleString()} words
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-2 text-[12px] bg-white/[0.06] hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Markdown"}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 text-[12px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}
