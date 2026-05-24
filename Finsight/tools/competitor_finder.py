"""Dynamic competitor discovery using Serper search + LLM extraction.

Priority chain:
  1. Serper search → LLM extracts ticker symbols from snippets
  2. Sector-based fallback table (always works, no API needed)

Usage:
    from Finsight.tools.competitor_finder import get_competitors
    peers = get_competitors("TSLA", "Tesla Inc.", "Consumer Cyclical",
                            search_client=search_client, gemini_client=gemini)
"""
from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from Finsight.tools.gemini_client import GeminiClient
    from Finsight.tools.search import SearchClient

logger = logging.getLogger(__name__)

# ─── Sector fallback table ─────────────────────────────────────────────────
SECTOR_PEERS: dict[str, List[str]] = {
    "Technology":              ["MSFT", "GOOGL", "AAPL", "META", "NVDA", "ORCL", "AMD"],
    "Communication Services":  ["GOOGL", "META", "NFLX", "DIS", "T", "CMCSA", "VZ"],
    "Consumer Cyclical":       ["AMZN", "TSLA", "NKE", "MCD", "HD", "TGT", "SBUX"],
    "Consumer Defensive":      ["PG", "KO", "PEP", "WMT", "COST", "MO", "CL"],
    "Healthcare":              ["JNJ", "PFE", "UNH", "ABBV", "MRK", "LLY", "BMY"],
    "Financial Services":      ["JPM", "BAC", "GS", "V", "MA", "WFC", "MS"],
    "Industrials":             ["GE", "HON", "CAT", "BA", "MMM", "UPS", "LMT"],
    "Energy":                  ["XOM", "CVX", "COP", "SLB", "EOG", "PXD", "MPC"],
    "Basic Materials":         ["LIN", "APD", "NEM", "FCX", "DOW", "DD", "ALB"],
    "Real Estate":             ["AMT", "PLD", "EQIX", "SPG", "O", "DLR", "CCI"],
    "Utilities":               ["NEE", "DUK", "AEP", "SO", "D", "EXC", "SRE"],
}


def get_competitors(
    ticker: str,
    company_name: str,
    sector: str = "Technology",
    search_client: "Optional[SearchClient]" = None,
    gemini_client: "Optional[GeminiClient]" = None,
    max_peers: int = 4,
) -> List[str]:
    """
    Return a list of competitor ticker symbols.

    Strategy 1 — Serper + LLM (live, accurate):
        Search for company competitors, then ask LLM to extract ticker symbols
        from the snippets. Handles niche sectors the fallback table misses.

    Strategy 2 — Sector table (instant, always works):
        Returns pre-defined peers for the company's yfinance sector.
        Excludes the target ticker from its own peer list.
    """
    ticker_upper = ticker.upper()

    # ─── Strategy 1: Live Serper + LLM ───────────────────────────────────
    if search_client is not None and gemini_client is not None:
        try:
            results = search_client.search_text(
                f"{company_name} main publicly traded competitors stock tickers 2024",
                max_results=6,
            )
            snippets = " | ".join(
                (r.get("snippet") or r.get("title") or "")
                for r in results
            )[:2500]

            if snippets.strip():
                prompt = (
                    f"You are a financial analyst. Here are web search results about "
                    f"companies competing with {company_name} (stock ticker: {ticker_upper}):\n\n"
                    f"{snippets}\n\n"
                    f"Task: Extract the US stock exchange ticker symbols of "
                    f"{company_name}'s main publicly-traded competitors.\n\n"
                    f"Rules:\n"
                    f"1. Return ONLY a JSON array of ticker strings\n"
                    f"2. Maximum {max_peers} tickers\n"
                    f"3. Do NOT include {ticker_upper} itself\n"
                    f"4. Only include companies that trade on NYSE or NASDAQ\n"
                    f"5. No markdown fences, no explanation — JSON array only\n\n"
                    f"Example valid response: [\"MSFT\", \"GOOGL\", \"AMZN\"]"
                )
                response = gemini_client.generate(prompt)
                peers = _parse_ticker_list(response, exclude=ticker_upper, max_n=max_peers)
                if peers:
                    logger.info("Dynamic competitors for %s via Serper+LLM: %s", ticker_upper, peers)
                    return peers

        except Exception as exc:
            logger.warning("Dynamic competitor lookup failed for %s: %s", ticker_upper, exc)

    # ─── Strategy 2: Sector table fallback ───────────────────────────────
    candidates = SECTOR_PEERS.get(sector, SECTOR_PEERS["Technology"])
    result = [t for t in candidates if t.upper() != ticker_upper][:max_peers]
    logger.info("Sector fallback competitors for %s (%s): %s", ticker_upper, sector, result)
    return result


def _parse_ticker_list(response: str, exclude: str, max_n: int) -> List[str]:
    """
    Parse LLM response into a clean list of uppercase ticker symbols.
    Handles: JSON arrays, comma-separated lists, markdown fences.
    """
    text = response.strip()
    # Strip markdown code fences
    text = re.sub(r"```[a-z]*\n?", "", text).replace("```", "").strip()
    # Try to find a JSON array anywhere in the text
    match = re.search(r'\[.*?\]', text, re.DOTALL)
    if match:
        text = match.group(0)

    # Parse JSON
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            tickers = [
                str(t).upper().strip().strip('"').strip("'")
                for t in parsed
                if t and isinstance(t, str) and len(str(t).strip()) <= 6
            ]
            return [t for t in tickers if t and t != exclude][:max_n]
    except (json.JSONDecodeError, ValueError):
        pass

    # Fallback: extract all uppercase 2-5 char words that look like tickers
    candidates = re.findall(r'\b([A-Z]{2,5})\b', text)
    # Filter out common English all-caps words that aren't tickers
    noise = {"AND", "OR", "THE", "FOR", "INC", "LLC", "LTD", "CO", "US", "NYSE", "NASDAQ", "ETF", "AI", "EV"}
    tickers = [t for t in candidates if t not in noise and t != exclude]
    # Deduplicate preserving order
    seen: set[str] = set()
    result: List[str] = []
    for t in tickers:
        if t not in seen:
            seen.add(t)
            result.append(t)
    return result[:max_n]
