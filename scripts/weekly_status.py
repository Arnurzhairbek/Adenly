#!/usr/bin/env python3
"""Create a verifiable weekly project status draft from GitHub and Ollama."""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
PROMPTS = ROOT / "project-management-ai" / "prompts"
REPORTS = ROOT / "project-management-ai" / "reports"
FACTS = ROOT / "project-management-ai" / "facts"
RUN_LOG = ROOT / "project-management-ai" / "measurements" / "automation_runs.csv"
API = os.getenv("GH_API_URL", "https://api.github.com").rstrip("/")
GH_VERSION = "2022-11-28"


class GitHub:
    def __init__(self, token: str, repo: str, session: requests.Session | None = None):
        if not re.fullmatch(r"[^/\s]+/[^/\s]+", repo):
            raise ValueError("GH_REPO must be OWNER/REPOSITORY")
        self.repo = repo
        self.session = session or requests.Session()
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": GH_VERSION,
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self.session.headers.update(headers)

    def pages(self, path: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        url = f"{API}/repos/{self.repo}/{path.lstrip('/')}"
        query = {"per_page": 100, **(params or {})}
        results: list[dict[str, Any]] = []
        while url:
            response = self.session.get(url, params=query, timeout=30)
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list):
                raise RuntimeError(f"Unexpected GitHub response for {path}")
            results.extend(payload)
            url = response.links.get("next", {}).get("url")
            query = None
        return results

    def get(self, path: str) -> dict[str, Any]:
        response = self.session.get(f"{API}/repos/{self.repo}/{path.lstrip('/')}", timeout=30)
        response.raise_for_status()
        return response.json()


def parse_date(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def collect_facts(gh: GitHub, since: datetime, until: datetime) -> dict[str, Any]:
    start, end = iso(since), iso(until)
    all_items = gh.pages("issues", {"state": "all", "sort": "created", "direction": "asc"})
    issues = [i for i in all_items if "pull_request" not in i]
    # Periods are half-open [since, until), so boundary events belong to one period only.
    opened_period = [i for i in issues if start <= i.get("created_at", "") < end]
    closed_period = [i for i in issues if i.get("closed_at") and start <= i["closed_at"] < end]
    # Reconstruct state just before the exclusive period end from creation/closure timestamps.
    open_at_end = [i for i in issues if i.get("created_at", "") < end and
                   (not i.get("closed_at") or i["closed_at"] >= end)]

    def compact(issue: dict[str, Any]) -> dict[str, Any]:
        return {
            "number": issue["number"], "title": issue["title"], "url": issue["html_url"],
            "labels": [label["name"] for label in issue.get("labels", [])],
            "updated_at": issue.get("updated_at"),
        }

    in_progress_labels = {v.strip().casefold() for v in os.getenv("IN_PROGRESS_LABELS", "in progress,in-progress,doing").split(",") if v.strip()}
    blocked_labels = {v.strip().casefold() for v in os.getenv("BLOCKED_LABELS", "blocked,заблокировано").split(",") if v.strip()}
    in_progress = [i for i in open_at_end if in_progress_labels.intersection({l["name"].casefold() for l in i.get("labels", [])})]
    blocked = [i for i in open_at_end if blocked_labels.intersection({l["name"].casefold() for l in i.get("labels", [])})]

    deployments_in_period = []
    for deployment in gh.pages("deployments", {"per_page": 100}):
        created = deployment.get("created_at", "")
        if not start <= created <= end:
            continue
        statuses = gh.pages(f"deployments/{deployment['id']}/statuses", {"per_page": 1})
        latest = statuses[0] if statuses else None
        deployments_in_period.append({
            "id": deployment["id"], "environment": deployment.get("environment"),
            "ref": deployment.get("ref"), "created_at": created,
            "status": latest.get("state") if latest else "no status",
            "status_at": latest.get("created_at") if latest else None,
            "url": deployment.get("statuses_url"),
        })

    return {
        "repository": gh.repo, "period": {"since": start, "until": end},
        "facts_collected_at": iso(datetime.now(timezone.utc)),
        "snapshot_as_of": end,
        "counts": {
            "issues_opened": len(opened_period), "issues_closed": len(closed_period),
            "issues_open_at_period_end": len(open_at_end), "issues_in_progress": len(in_progress),
            "issues_blocked": len(blocked), "deployments": len(deployments_in_period),
        },
        "issues_opened": [compact(i) for i in opened_period],
        "issues_closed": [compact(i) for i in closed_period],
        "issues_open_at_period_end": [compact(i) for i in open_at_end],
        "issues_in_progress": [compact(i) for i in in_progress],
        "issues_blocked": [compact(i) for i in blocked],
        "deployments": deployments_in_period,
        "source_note": "Counts are computed by Python from GitHub REST API responses; the language model does not calculate metrics. Issue open/closed state is reconstructed at the period boundary from created_at/closed_at. Labels are current at collection time because GitHub's issues list does not provide historical label state.",
    }


def build_prompt(facts: dict[str, Any], version: str) -> str:
    path = PROMPTS / f"{version}.txt"
    if not path.exists():
        raise FileNotFoundError(f"Prompt not found: {path}")
    model_facts = facts
    if version == "v3":
        # Keep model input to aggregate metrics only; issue titles are not sent to Ollama.
        model_facts = {"repository": facts["repository"], "period": facts["period"],
                       "snapshot_as_of": facts["snapshot_as_of"], "counts": facts["counts"],
                       "source_note": facts["source_note"]}
    return path.read_text(encoding="utf-8").replace("{{FACTS_JSON}}", json.dumps(model_facts, ensure_ascii=False, indent=2))


def generate(prompt: str) -> str:
    endpoint = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/") + "/api/generate"
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    response = requests.post(endpoint, json={"model": model, "prompt": prompt, "stream": False,
                                               "options": {"temperature": 0.2}}, timeout=300)
    response.raise_for_status()
    result = response.json().get("response", "").strip()
    if not result:
        raise RuntimeError("Ollama returned an empty report")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--since", help="Period start (ISO date/time; defaults to 7 days ago UTC)")
    parser.add_argument("--until", help="Period end (ISO date/time; defaults to now UTC)")
    parser.add_argument("--facts-file", type=Path, help="Use a previously collected facts JSON (for prompt comparison/audit)")
    parser.add_argument("--prompt-version", choices=("v1", "v2", "v3"), default=os.getenv("PROMPT_VERSION", "v3"))
    parser.add_argument("--output-dir", type=Path, default=REPORTS)
    parser.add_argument("--facts-dir", type=Path, default=FACTS)
    parser.add_argument("--facts-only", action="store_true", help="Collect and save real GitHub facts without calling Ollama")
    parser.add_argument("--no-record-run", action="store_true", help="Do not append timing to automation_runs.csv (for prompt experiments)")
    args = parser.parse_args()
    run_started = time.monotonic()

    if args.facts_file:
        if args.since or args.until:
            parser.error("Do not combine --facts-file with --since/--until")
        facts = json.loads(args.facts_file.read_text(encoding="utf-8"))
        since, until = parse_date(facts["period"]["since"]), parse_date(facts["period"]["until"])
    else:
        token, repo = os.getenv("GH_TOKEN"), os.getenv("GH_REPO")
        if not repo:
            parser.error("Set GH_REPO=OWNER/REPOSITORY; GH_TOKEN is optional for public repositories")
        until = parse_date(args.until) if args.until else datetime.now(timezone.utc)
        since = parse_date(args.since) if args.since else until - timedelta(days=7)
        if since >= until:
            parser.error("--since must be earlier than --until")
        facts = collect_facts(GitHub(token, repo), since, until)
    args.facts_dir.mkdir(parents=True, exist_ok=True)
    stamp = since.strftime("%Y%m%d") + "_" + until.strftime("%Y%m%d")
    facts_path = args.facts_dir / f"facts_{stamp}.json"
    facts_path.write_text(json.dumps(facts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.facts_only:
        print(f"Facts: {facts_path}")
        print(json.dumps(facts["counts"], ensure_ascii=False))
        return 0
    report = generate(build_prompt(facts, args.prompt_version))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.output_dir / f"weekly_status_{stamp}.md"
    disclosure = (f"\n\n---\n\n**Раскрытие использования ИИ:** черновик сформирован {os.getenv('OLLAMA_MODEL', 'qwen2.5:3b')} "
                  f"через Ollama по данным GitHub за {facts['period']['since']} — {facts['period']['until']}. "
                  "Факты должен проверить ответственный менеджер проекта: ____________________. "
                  "До этой проверки документ не является утверждённым отчётом.\n")
    period_header = (f"# Еженедельный статус проекта\n\n"
                     f"**Период (UTC):** [{facts['period']['since']}, {facts['period']['until']})\n\n")
    report_path.write_text(f"{period_header}{report}{disclosure}", encoding="utf-8")
    generation_minutes = (time.monotonic() - run_started) / 60
    if not args.no_record_run:
        RUN_LOG.parent.mkdir(parents=True, exist_ok=True)
        with RUN_LOG.open("a", encoding="utf-8", newline="") as log:
            writer = csv.DictWriter(log, fieldnames=["run_id", "period_start", "period_end", "generation_minutes",
                                                     "verification_minutes", "editing_minutes", "prompt_version",
                                                     "reviewer", "notes"])
            writer.writerow({"run_id": iso(datetime.now(timezone.utc)), "period_start": facts["period"]["since"],
                             "period_end": facts["period"]["until"], "generation_minutes": f"{generation_minutes:.3f}",
                             "verification_minutes": "", "editing_minutes": "", "prompt_version": args.prompt_version,
                             "reviewer": "", "notes": "Generation time auto-recorded; reviewer fills verification/editing."})
    github_output = os.getenv("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as output:
            output.write(f"report={report_path}\n")
            output.write(f"facts={facts_path}\n")
    print(f"Draft: {report_path}\nFacts: {facts_path}\nGeneration minutes: {generation_minutes:.3f}")
    print(json.dumps(facts["counts"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except requests.HTTPError as exc:
        print(f"GitHub/Ollama HTTP error: {exc}", file=sys.stderr)
        raise SystemExit(2)
