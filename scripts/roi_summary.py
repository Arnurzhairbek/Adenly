#!/usr/bin/env python3
"""Calculate measured time savings and break-even from project CSV logs."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "project-management-ai" / "measurements"


def numeric_rows(path: Path, key: str) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return [row for row in csv.DictReader(f) if row.get(key, "").strip()]


def calculate() -> dict:
    baselines = numeric_rows(BASE / "manual_baseline.csv", "minutes")
    runs = numeric_rows(BASE / "automation_runs.csv", "generation_minutes")
    dev = numeric_rows(BASE / "development_hours.csv", "hours")
    if len(baselines) < 3:
        raise ValueError(f"Need at least 3 completed manual measurements; found {len(baselines)}")
    if len(runs) < 2:
        raise ValueError(f"Need at least 2 completed automation runs; found {len(runs)}")
    incomplete = [r.get("run_id", "(unnamed run)") for r in runs
                  if not r.get("verification_minutes", "").strip() or not r.get("editing_minutes", "").strip()]
    if incomplete:
        raise ValueError("Add actual verification_minutes and editing_minutes for every run before calculating ROI: " + ", ".join(incomplete))
    if not dev:
        raise ValueError("Record actual development hours in development_hours.csv before calculating payback")
    manual_values = [float(r["minutes"]) for r in baselines]
    development_hours = sum(float(r["hours"]) for r in dev)
    avg_manual = sum(manual_values) / len(manual_values)
    summaries = []
    for run in runs:
        generation = float(run["generation_minutes"])
        verification = float(run["verification_minutes"])
        editing = float(run["editing_minutes"])
        net = avg_manual - generation - verification - editing
        summaries.append({"run_id": run["run_id"], "manual_average_minutes": round(avg_manual, 2),
                          "generation_minutes": generation, "verification_minutes": verification,
                          "editing_minutes": editing, "net_saved_minutes": round(net, 2)})
    avg_net = sum(r["net_saved_minutes"] for r in summaries) / len(summaries)
    payback_cycles = (development_hours * 60 / avg_net) if avg_net > 0 else None
    return {"manual_runs": len(baselines), "automation_runs": len(runs),
            "manual_average_minutes": round(avg_manual, 2), "development_hours": round(development_hours, 2),
            "reports": summaries, "average_net_saved_minutes": round(avg_net, 2),
            "payback_cycles_at_one_report_per_week": round(payback_cycles, 2) if payback_cycles is not None else None,
            "payback_weeks": round(payback_cycles, 2) if payback_cycles is not None else None,
            "payback_status": "calculable" if payback_cycles is not None else "not demonstrated: average net saving is not positive"}


if __name__ == "__main__":
    try:
        print(json.dumps(calculate(), ensure_ascii=False, indent=2))
    except (ValueError, FileNotFoundError) as exc:
        raise SystemExit(str(exc))
