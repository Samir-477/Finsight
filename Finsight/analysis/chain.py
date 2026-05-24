"""Chain-of-Analysis data structures for FinSight."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class ChainStep:
    """Represents a single analytical step."""

    step_id: int
    focus: str
    code: str
    stdout: str
    stderr: str
    success: bool
    insights: List[str] = field(default_factory=list)
    evidence_uids: List[str] = field(default_factory=list)

    def add_insight(self, insight: str) -> None:
        self.insights.append(insight)

    def add_evidence(self, uid: str) -> None:
        if uid not in self.evidence_uids:
            self.evidence_uids.append(uid)


@dataclass
class ChainOfAnalysis:
    """Ordered collection of chain steps."""

    steps: List[ChainStep] = field(default_factory=list)

    def add_step(self, step: ChainStep) -> None:
        self.steps.append(step)

    def to_dict(self) -> dict:
        """Return a dict with 'steps' key so EnhancedReportWriter can call .get('steps', []).
        Previously returned a bare List which caused isinstance(value, dict) to be False,
        making chain_value always {} and CoA context always empty."""
        return {
            "steps": [
                {
                    "step_id": step.step_id,
                    "focus": step.focus,
                    "code": step.code,
                    "stdout": step.stdout,
                    "stderr": step.stderr,
                    "success": step.success,
                    "insights": step.insights,
                    "evidence_uids": step.evidence_uids,
                }
                for step in self.steps
            ]
        }
