#!/usr/bin/env python3
"""Build a clearly labelled educational DORA simulation from offline CSV fixtures."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil

from dora import compute, incidents_from, read_csv, stamp

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/delivery/simulation'
ENVIRONMENT = 'simulation-staging'
START = '2026-10-09T00:00:00Z'
END = '2026-11-06T00:00:00Z'


def build_report():
    deployments = read_csv(DATA / 'deployments.csv')
    incident_rows = read_csv(DATA / 'incidents.csv')
    if any(row['environment'] != ENVIRONMENT or not row['id'].startswith('SIM-') for row in deployments):
        raise ValueError('Simulation requires offline SIM-prefixed records in simulation-staging')
    if any(row['environment'] != ENVIRONMENT or not row['incident_id'].startswith('SIM-') for row in incident_rows):
        raise ValueError('Only simulated incidents are permitted')
    # Completeness is an explicit property of this fictional fixture, not a human
    # attestation of the real project's monitoring or GitHub deployment history.
    report = compute(deployments, incidents_from(incident_rows), stamp(START), stamp(END),
                     ENVIRONMENT, deployments_complete=True, ledger_complete=True)
    report.update(data_mode='simulation', source_kind='fabricated_for_education',
                  is_real_project_measurement=False, repository='Arnurzhairbek/Adenly',
                  collected_at=datetime.now(timezone.utc).isoformat(), errors=[],
                  assumptions=['All timestamps, release IDs and incidents are fictional.',
                               'The synthetic ledger is complete by construction; no real QA attestation.',
                               'All 12 feature releases have a full 24-hour observation window.',
                               'The separate rollback is excluded from deployment frequency and lead time.'])
    return report, deployments


def simulation_markdown(report, image=True):
    from dora_dashboard import display, METRICS
    lines = ['# Adenly — DORA оқу симуляциясы', '',
             '> **ОЙДАН ҚҰРАСТЫРЫЛҒАН ОҚУ ДЕРЕКТЕРІ.** Барлық release, commit уақыты және incident — '
             'есептеуді көрсету үшін жасалған мысал. Бұл Adenly-дің нақты GitHub көрсеткіштері емес.', '',
             '[Нақты GitHub деректеріне негізделген есепті ашу](../report/README.md)', '',
             f'**Симуляция аралығы:** {START} → {END} · **28 күн / 4 апта**.', '',
             f'**Мысал жасалған уақыт:** {report["collected_at"]} (UTC).', '']
    if image:
        lines += ['![DORA DEMO — ойдан құрастырылған оқу деректері](dora_dashboard.png)', '']
    lines += ['| Метрика | Симуляция нәтижесі | Бірлік | Оқу шкаласы | Үлгі саны |', '|---|---:|---|---|---:|']
    for key, label, english, unit in METRICS:
        metric = report['metrics'][key]
        lines.append(f'| {label} · {english} | **{display(metric["value"])}** | {unit} | {metric["level"]} | {metric["samples"]} |')
    lines += ['', '## Сандар қалай алынды?', '',
              '1. **Жиілік:** 12 feature release / 4 апта = **3 release/апта**. Апталар бойынша: **2 → 3 → 3 → 4**.',
              '2. **Lead time:** реттелген 12 мән — `2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 7, 8` сағат. Медиана = `(4 + 4) / 2` = **4 сағат**.',
              '3. **Сәтсіз өзгерістер үлесі:** 2 release-тен кейін 24 сағат ішінде түзету/rollback қажет болды. `2 / 12 × 100` = **16,67%**.',
              '4. **Қалпына келтіру уақыты:** екі incident ұзақтығы — 40 және 20 минут. Медиана = `(20 + 40) / 2` = **30 минут = 0,50 сағат**.', '',
              'Барлық release үшін ≥24 сағат бақылау бар деп алынды. Демо incident журналы есеп үшін толық деп қаралады; бұл нақты команданың мониторингін растау емес. '
              'Бөлек rollback жазбасы feature release санына және lead time-ға қосылмайды.', '',
              '## Ойдан құрастырылған екі incident', '',
              '| ID | Байланысқан release | Басталуы UTC | Қалпына келуі UTC | Уақыт | Тәсіл | Еңбек |',
              '|---|---|---|---|---:|---|---:|',
              '| SIM-INC-01 | SIM-03 | 16.10.2026 10:10 | 16.10.2026 10:50 | 40 мин | hotfix | 1,5 адам-сағат |',
              '| SIM-INC-02 | SIM-09 | 30.10.2026 10:15 | 30.10.2026 10:35 | 20 мин | rollback | 2,0 адам-сағат |', '',
              f'Симуляциядағы жөндеу еңбегі: **{report["repair_person_hours"]:g} адам-сағат**. '
              'Бірнеше адамның еңбегі elapsed recovery уақытынан бөлек есептеледі. '
              'Шартты 24 адам-сағат/апта ×4 апта =96 сағат capacity болса, жөндеу үлесі `3,5 / 96 ×100` = **3,65%**. '
              'Алдын алу жұмысымен бірге reliability-ге ұсынылатын 20% резерв — бөлек жоспарлық шешім.', '',
              '## Оқу қорытындысы', '',
              'Жиілік 3/апта — жергілікті шкалада орта; lead time 4 сағат — жоғары; CFR 16,67% — орта; recovery 30 минут — жоғары. '
              'Бұл тек осы синтетикалық жиынның бағасы; нақты команданың деңгейі деп көрсетілмейді.', '',
              'Мысалдағы келесі жүйелік өзгерістер: релиз алдындағы smoke regression арқылы CFR-ді **≤10%** нысанасына төмендету; '
              'автоматты health-check және known-good rollback арқылы recovery-ді **≤15 минутқа** жеткізу. '
              'Шартты қайта өлшеу күні: **20.11.2026**. Бұлар өлшенген жетістік емес, оқу мақсаттары.', '']
    if image:
        lines += ['## Қайта есептеу және бастапқы оқу деректері', '',
                  '- [Синтетикалық deployments.csv](deployments.csv) · [Синтетикалық incidents.csv](incidents.csv).',
                  '- [Есептелген metrics.json](metrics.json) · [Нормаланған demo жазбалар](deployments.normalized.json).',
                  '- Репозиторий түбірінде: `python scripts/dora_simulation.py`.',
                  '- Скрипт GitHub API-ға қосылмайды, deployment/incident жасамайды және нақты есепті өзгертпейді.']
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DATA)
    args = parser.parse_args()
    output = args.output.resolve()
    real_report = (ROOT / 'docs/delivery/report').resolve()
    if output == real_report or real_report in output.parents or output in real_report.parents:
        parser.error('Simulation cannot overwrite the real report directory')
    output.mkdir(parents=True, exist_ok=True)
    report, deployments = build_report()
    for name, value in [('metrics.json', report), ('deployments.normalized.json', deployments)]:
        (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if output != DATA.resolve():
        for name in ['deployments.csv', 'incidents.csv']:
            shutil.copyfile(DATA / name, output / name)
    from dora_dashboard import render
    render(report, [], output, deployments)
    print(json.dumps({'data_mode': 'simulation', 'metrics': {key: metric['value'] for key, metric in report['metrics'].items()}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
