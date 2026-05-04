from __future__ import annotations

import json
import sys

from report.generator import generate_report


def main() -> None:
    raw = sys.stdin.read()
    if not raw.strip():
        raise SystemExit(2)
    data = json.loads(raw)
    pdf = generate_report(data)
    sys.stdout.buffer.write(pdf)


if __name__ == "__main__":
    main()

