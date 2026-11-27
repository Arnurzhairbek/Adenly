#!/usr/bin/env python3
"""Check numeric claims in a generated v3 report against its saved facts JSON."""
import argparse
import json
import re
from pathlib import Path

FIELDS = {
    "Открыто за период": "issues_opened",
    "Закрыто за период": "issues_closed",
    "Открыто на конец периода": "issues_open_at_period_end",
    "С меткой «в работе»": "issues_in_progress",
    "С меткой «заблокировано»": "issues_blocked",
    "Развёртывания": "deployments",
}


def verify(facts: dict, report: str) -> list[str]:
    errors = []
    period = f"**Период (UTC):** [{facts['period']['since']}, {facts['period']['until']})"
    if period not in report:
        errors.append("Period header does not match facts")
    for label, key in FIELDS.items():
        matches = re.findall(rf"^{re.escape(label)}:\s*(\d+)\s*$", report, flags=re.MULTILINE)
        expected = str(facts["counts"][key])
        if matches != [expected]:
            errors.append(f"{label}: expected exactly {expected}, found {matches or 'no numeric line'}")
    attention = re.findall(r"^Требует внимания:\s*(.+)\s*$", report, flags=re.MULTILINE)
    if attention != ["Нет данных"]:
        errors.append(f"Требует внимания: expected 'Нет данных', found {attention or 'no line'}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--facts-file", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    facts = json.loads(args.facts_file.read_text(encoding="utf-8"))
    errors = verify(facts, args.report.read_text(encoding="utf-8"))
    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1
    print("PASS: period and all v3 metrics match the saved facts JSON")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
