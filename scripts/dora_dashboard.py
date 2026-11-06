"""Render real DORA evidence for GitHub Markdown, Actions summaries and PNG export."""
from datetime import timedelta
import math
import os

METRICS = [
    ('deployment_frequency', 'Орналастыру жиілігі', 'Deployment frequency', 'release / апта'),
    ('lead_time', 'Коммиттен стендке дейін', 'Lead time for changes', 'сағат · медиана'),
    ('change_failure_rate', 'Сәтсіз өзгерістер үлесі', 'Change failure rate', '%'),
    ('recovery_time', 'Қалпына келтіру уақыты', 'Time to restore service', 'сағат · медиана'),
]


def display(value):
    return 'N/A' if value is None else f'{value:.2f}'


def weekly_counts(report, deployments):
    from dora import stamp
    if not report['deployments_complete']:
        return None
    start, end = stamp(report['window_start']), stamp(report['window_end'])
    count = math.ceil((end - start).total_seconds() / (7 * 86400))
    buckets = [0] * count
    for row in deployments:
        if row['environment'] != report['environment'] or row.get('operation', 'release') == 'rollback':
            continue
        if not row.get('successful_at'):
            continue
        when = stamp(row['successful_at'])
        if start <= when < end:
            buckets[int((when - start).total_seconds() // (7 * 86400))] += 1
    return [(start + timedelta(days=7 * i), value) for i, value in enumerate(buckets)]


def markdown(report, runs, image=True):
    from dora import stamp
    if report.get('data_mode') == 'simulation':
        from dora_simulation import simulation_markdown
        return simulation_markdown(report, image=image)
    lines = ['# Adenly — DORA дашборды', '',
             f'**Орта:** `{report["environment"]}` · **Терезе:** {report["window_days"]:g} күн · **Дерек:** нақты GitHub API', '',
             f'**Жаңартылған:** {report["collected_at"]} (UTC).', '',
             f'**Өлшеу аралығы:** {report["window_start"]} → {report["window_end"]}.', '']
    if report.get('source_run_url'):
        lines += [f'[Осы деректерді жинаған GitHub Actions прогоны]({report["source_run_url"]})', '']
    if image:
        lines += ['![Adenly DORA: төрт метрика және апталық deployment графигі](dora_dashboard.png)', '']
    lines += ['| Метрика | Нақты мән | Бірлік | Оқу шкаласы | Үлгі саны |',
              '|---|---:|---|---|---:|']
    for key, label, english, unit in METRICS:
        metric = report['metrics'][key]
        lines.append(f'| {label} · {english} | **{display(metric["value"])}** | {unit} | {metric["level"]} | {metric["samples"]} |')
    lines += ['', '## Деректің жеткіліктілігі', '',
              f'- Deployments API: **{"толық оқылды" if report["deployments_complete"] else "толық емес — жиілік те N/A"}**.',
              f'- Сәтті staging release: **{report["successful_deployments"] if report["deployments_complete"] else "N/A"}**; ≥24 сағат бақыланған өзгеріс: **{report["mature_changes"] if report["deployments_complete"] else "N/A"}**.',
              f'- Инцидент журналының толықтығы: **{"бекітілген" if report["incident_ledger_attested"] else "бекітілмеген"}**.',
              f'- Журналда тіркелген жабылған инцидент: **{report["resolved_incidents"]}**; ашық: **{report["open_incidents"]}**.', '']
    for key, label, _, _ in METRICS:
        if report['metrics'][key]['value'] is None:
            reasons = {
                'deployment_frequency': 'Deployments API толық оқылмады.',
                'lead_time': 'Deployment немесе оның commit timestamp дәлелі жеткіліксіз.',
                'change_failure_rate': 'Кемінде 24 сағат бақыланған өзгеріс және толық бекітілген incident ledger қажет.',
                'recovery_time': 'Қалпына келу уақыты жазылған нақты инцидент жоқ.',
            }
            lines += [f'**{label} — N/A:** {reasons[key]}', '']
    lines += ['Жасыл CI deployment болып саналмайды. Оқшауланған rollback жаттығуы нақты incident емес. '
              'Оқу шкаласы команданың жергілікті шектері; ресми DORA рейтингі емес.', '',
              '## CI күйі — DORA-дан бөлек', '',
              '| Workflow / прогон | Нәтиже | Толық elapsed, секунд |', '|---|---|---:|']
    for run in sorted(runs, key=lambda row: row['created_at'], reverse=True)[:10]:
        elapsed = None
        if run.get('status') == 'completed' and run.get('run_started_at') and run.get('updated_at'):
            elapsed = round((stamp(run['updated_at']) - stamp(run['run_started_at'])).total_seconds())
        result = run.get('conclusion') or run.get('status') or 'N/A'
        lines.append(f'| [{run["name"]} · {run["id"]}]({run["html_url"]}) | {result} | {elapsed if elapsed is not None else "N/A"} |')
    effort = report['repair_person_hours']
    lines += ['', '## Сенімділікке кететін уақыт', '',
              f'Журналдағы тіркелген жөндеу еңбегі: **{report["recorded_repair_person_hours"]:g} адам-сағат**. '
              f'Толық жөндеу шығыны: **{effort if effort is not None else "N/A — журнал толықтығы расталмаған"}**.', '',
              '## Келесі өлшемдер', '',
              '| Жүйелік өзгеріс | Күтілетін нәтиже | Қайта өлшеу |', '|---|---|---|',
              '| Жасыл CI-ден кейін нақты staging deployment | ≥1 release/апта; median lead ≤24 сағат | 20.11.2026; толық кезең 04.12.2026 |',
              '| Known-good SHA сақтау және rollback рәсімі | Drill ≤20 минут; нақты incident болса recovery ≤1 сағат | 20.11.2026; нақты incident есебі 04.12.2026 |', '',
              'Бұл — жоспарлық мақсаттар. Сервер қосылмайынша мақсат орындалды деп есептелмейді.']
    if image:
        lines += ['', '## Бастапқы деректер және қайта жинау', '',
                  '- [Метрикалар JSON](metrics.json) · [Deployments API snapshot](deployments.raw.json) · [Нормаланған deployments](deployments.normalized.json) · [CI тарихы](ci_runs.json).',
                  '- [Метрика анықтамалары](../definitions.md) · [Инцидент журналы](../incidents.csv) · [Жақсартулар және capacity](../improvements-capacity.md).',
                  '- [DORA dashboard workflow](https://github.com/Arnurzhairbek/Adenly/actions/workflows/dora.yml) → **Run workflow → main**.',
                  '- Әр прогонның **Summary** бөлімінде жаңа кесте көрінеді; **Artifacts → dora-dashboard** ішінде график пен толық деректер бар.',
                  '- Осы репозиторий беті — көрсетілген уақыттағы сақталған snapshot. Жаңа workflow нәтижесі Summary/Artifact ішінде; бұл бет өздігінен жаңармайды.']
    if report['errors']:
        lines += ['', '## API деректерін жинау қателері', '']
        lines += ['- ' + error['operation'] + ': ' + error['error'] for error in report['errors']]
    return '\n'.join(lines) + '\n'


def render(report, runs, output, deployments):
    from dora import stamp
    os.environ.setdefault('MPLCONFIGDIR', '/tmp/adenly-dora-mpl')
    os.environ.setdefault('XDG_CACHE_HOME', '/tmp/adenly-dora-cache')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.ticker import MaxNLocator
    plt.rcParams['font.family'] = 'DejaVu Sans'
    background, panel, foreground, muted = '#0b1324', '#17243b', '#f1f5f9', '#a8b9d0'
    simulation = report.get('data_mode') == 'simulation'
    fig = plt.figure(figsize=(15, 8.4), facecolor=background)
    fig.text(.045, .925, 'Adenly / DORA' + (' · DEMO' if simulation else ''), color=foreground, fontsize=28, weight='bold')
    fig.text(.045, .875, 'ОЙДАН ҚҰРАСТЫРЫЛҒАН ОҚУ ДЕРЕКТЕРІ' if simulation else 'Инженерлік жеткізудің төрт метрикасы', color='#fbbf24' if simulation else muted, fontsize=13)
    fig.text(.955, .93, 'ОҚУ СИМУЛЯЦИЯСЫ' if simulation else report['environment'].upper() + '  /  НАҚТЫ ДЕРЕК', ha='right', color='#fbbf24' if simulation else '#5eead4', fontsize=11)
    start, end = stamp(report['window_start']), stamp(report['window_end'])
    fig.text(.955, .88, f'{start:%d.%m.%Y} — {end:%d.%m.%Y}  ·  {report["window_days"]:g} күн', ha='right', color=muted, fontsize=10)
    for index, (key, label, english, unit) in enumerate(METRICS):
        metric = report['metrics'][key]
        ax = fig.add_axes([.045 + index * .235, .565, .22, .255], facecolor=panel)
        ax.set_xticks([]); ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_visible(False)
        ax.text(.07, .85, label, color=foreground, fontsize=11, transform=ax.transAxes)
        ax.text(.07, .72, english, color=muted, fontsize=9, transform=ax.transAxes)
        ax.text(.07, .37, display(metric['value']), color='#fbbf24' if metric['value'] is None else '#5eead4', fontsize=35, weight='bold', transform=ax.transAxes)
        ax.text(.07, .21, unit, color=muted, fontsize=10, transform=ax.transAxes)
        ax.text(.07, .07, f'Үлгі: {metric["samples"]}  ·  {metric["level"]}', color=muted, fontsize=9, transform=ax.transAxes)
    ax = fig.add_axes([.075, .19, .55, .26], facecolor=background)
    ax.set_title('Сәтті release саны · 7 күндік аралықтар', loc='left', color=foreground, fontsize=12, pad=18)
    weekly = weekly_counts(report, deployments)
    if weekly is None:
        ax.text(.5, .5, 'N/A — Deployments API толық емес', ha='center', color='#fbbf24', transform=ax.transAxes)
        ax.set_xticks([]); ax.set_yticks([])
    else:
        labels = [date.strftime('%d.%m') for date, _ in weekly]
        counts = [value for _, value in weekly]
        ax.bar(range(len(counts)), counts, color='#2dd4bf', width=.4, zorder=3)
        ax.set_xticks(range(len(labels)), labels)
        ax.set_ylim(0, max(1, max(counts)) * 1.4)
        ax.yaxis.set_major_locator(MaxNLocator(integer=True))
        for index, value in enumerate(counts):
            ax.annotate(str(value), (index, value), xytext=(0, 9), textcoords='offset points', ha='center', color=foreground, fontsize=12)
        ax.grid(axis='y', color='#334155', alpha=.55, zorder=0)
        ax.tick_params(colors=muted)
        ax.set_xlabel('Аралықтың басталуы · UTC', color=muted, labelpad=10)
    for spine in ax.spines.values():
        spine.set_visible(False)
    info = fig.add_axes([.69, .16, .265, .33], facecolor=panel)
    info.set_xticks([]); info.set_yticks([])
    for spine in info.spines.values():
        spine.set_visible(False)
    info.text(.08, .87, 'Дерек жағдайы', color=foreground, fontsize=13, weight='bold')
    rows = [('Демо жиыны: толық' if simulation else f'API: {"толық" if report["deployments_complete"] else "толық емес"}'),
            f'Сәтті release: {report["successful_deployments"] if report["deployments_complete"] else "N/A"}',
            f'≥24 сағат бақыланған: {report["mature_changes"] if report["deployments_complete"] else "N/A"}',
            ('Журнал: оқу мысалы' if simulation else f'Журнал: {"бекітілген" if report["incident_ledger_attested"] else "бекітілмеген"}'),
            'GitHub тарихынан алынбаған' if simulation else 'N/A = дерек жеткіліксіз']
    for index, text in enumerate(rows):
        info.text(.08, .69 - .13 * index, text, color=muted, fontsize=11)
    fig.text(.045, .07, 'Барлық release пен incident ойдан құрастырылған. Бұл Adenly-дің нақты нәтижесі емес.' if simulation else 'CI прогондары deployment ретінде саналмайды. Оқу drill-і нақты incident емес.', color='#fbbf24' if simulation else muted, fontsize=10)
    collected = stamp(report['collected_at'])
    source = 'синтетикалық CSV журналдары' if simulation else 'GitHub Deployments + incident ledger'
    timestamp_label = 'Жасалған' if simulation else 'Жаңартылған'
    fig.text(.045, .035, f'{timestamp_label}: {collected:%d.%m.%Y %H:%M UTC}  ·  Дереккөз: {source}  ·  Шкала: жергілікті оқу шектері', color=muted, fontsize=9)
    fig.savefig(output / 'dora_dashboard.png', dpi=160, facecolor=background)
    plt.close(fig)
    (output / 'README.md').write_text(markdown(report, runs), encoding='utf-8')
