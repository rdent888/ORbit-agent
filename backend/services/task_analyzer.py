"""
Task Complexity Analyzer & Smart Model Router.
Analyzes user input and conversation context to categorize tasks into:
- 'heavy': Complex coding, architecture, multi-step debugging, heavy reasoning
- 'light': Quick Q&A, basic edits, formatting, small scripts, greetings
"""
import re
from typing import Tuple

HEAVY_KEYWORDS = [
    # Architecture & clone
    r"\bclone\b", r"\bbuild\b", r"\barchitect", r"\bdatabase\b", r"\bschema\b",
    r"\bmigration\b", r"\brefactor", r"\boptimize\b", r"\bconcurrency\b",
    # Complex debugging
    r"\bstack\s*trace\b", r"\btraceback\b", r"\bexception\b", r"\bmemory\s*leak\b",
    r"\bsegfault\b", r"\brace\s*condition\b", r"\bdeadlock\b",
    # Advanced logic & deep analysis
    r"\banalyze\b", r"\breview\b", r"\bcompare\b", r"\balgorithm\b", r"\bsecurity\b",
    r"\bvulnerability\b", r"\be2e\b", r"\btest\s*suite\b", r"\bdeep\s*dive\b",
    r"\bsystem\s*design\b", r"\bperformance\b", r"\bbenchmark\b",
]

LIGHT_KEYWORDS = [
    r"^hi\b", r"^halo\b", r"^hello\b", r"^ping\b", r"^tes\b", r"^test\b",
    r"\bapa\s*itu\b", r"\bjelaskan\b", r"\bexplain\b", r"\bformat\b",
    r"\btranslate\b", r"\bterjemahkan\b", r"\btypo\b", r"\brename\b",
    r"\bsyntax\b", r"\bcontoh\b", r"\bexample\b",
]

def analyze_task_complexity(prompt: str, message_count: int = 0) -> Tuple[str, str]:
    """
    Returns (complexity, reason) where complexity is 'heavy' or 'light'.
    """
    cleaned = prompt.strip().lower()
    char_len = len(cleaned)

    # 1. Very short messages (< 30 chars) without heavy keywords are usually light
    if char_len < 30 and not any(re.search(kw, cleaned) for kw in HEAVY_KEYWORDS):
        return "light", "Tugas singkat / pertanyaan dasar"

    # 2. Check explicitly light phrases
    for kw in LIGHT_KEYWORDS:
        if re.search(kw, cleaned) and char_len < 100:
            return "light", "Pertanyaan ringkas atau penjelasan sederhana"

    # 3. Check heavy indicators
    heavy_matches = [kw for kw in HEAVY_KEYWORDS if re.search(kw, cleaned)]
    if heavy_matches:
        matched_str = ", ".join(m.replace(r"\b", "").strip() for m in heavy_matches[:3])
        return "heavy", f"Tugas kompleks terdeteksi ({matched_str})"

    # 4. Long prompts or code blocks (> 400 chars or contains code blocks)
    if "```" in prompt or char_len > 400:
        return "heavy", "Instruksi panjang atau berisi blok kode/file"

    # 5. Later conversation stages often have heavier tool call loops
    if message_count > 6:
        return "heavy", "Percakapan multi-langkah mendalam"

    # Default to light/medium for standard queries
    return "light", "Tugas standar / eksekusi ringan"
