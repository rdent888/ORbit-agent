#!/usr/bin/env python3
"""
contrast.py — WCAG AA contrast checker for replica/design/tokens.json
Usage: python3 contrast.py replica/design/tokens.json
Exits 1 if any pair fails AA.

WCAG AA thresholds:
  - Normal text  (< 18px or < 14px bold): ratio >= 4.5
  - Large text   (>= 18px or >= 14px bold): ratio >= 3.0
  - UI components & borders: ratio >= 3.0
"""
import json, sys, math

def relative_luminance(hex_color: str) -> float:
    hex_color = hex_color.lstrip('#')
    r, g, b = (int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    def linearize(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = linearize(r), linearize(g), linearize(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(c1: str, c2: str) -> float:
    l1 = relative_luminance(c1)
    l2 = relative_luminance(c2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 contrast.py tokens.json")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        tokens = json.load(f)

    colors = tokens["color"]
    pairs  = tokens["pairs"]

    passed, failed = [], []
    NORMAL_THRESHOLD = 4.5
    LARGE_THRESHOLD  = 3.0

    print(f"\n{'Pair':<30} {'FG hex':<10} {'BG hex':<10} {'Ratio':>7}  {'AA?':<5} Usage")
    print("-" * 100)

    for pair in pairs:
        fg_name = pair["fg"]
        bg_name = pair["bg"]
        usage   = pair.get("usage", "")
        name    = pair["name"]

        fg_hex = colors.get(fg_name, "#ffffff")
        bg_hex = colors.get(bg_name, "#000000")

        ratio = contrast_ratio(fg_hex, bg_hex)
        aa = ratio >= NORMAL_THRESHOLD
        label = "✅ AA" if aa else "❌ FAIL"
        line  = f"{name:<30} {fg_hex:<10} {bg_hex:<10} {ratio:>7.2f}  {label:<5} {usage}"
        print(line)
        (passed if aa else failed).append((name, ratio, usage))

    print(f"\n{'='*100}")
    print(f"Passed: {len(passed)}/{len(pairs)}  |  Failed: {len(failed)}/{len(pairs)}")

    if failed:
        print("\n⚠️  Failures (fix in tokens.json, not per component):")
        for name, ratio, usage in failed:
            print(f"  - {name}: {ratio:.2f}:1  ({usage})")
        sys.exit(1)
    else:
        print("\n✅ All pairs pass WCAG AA. Design system is accessible.")
        sys.exit(0)

if __name__ == "__main__":
    main()
