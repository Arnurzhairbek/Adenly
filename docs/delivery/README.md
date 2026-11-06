# Adenly — ЛЗ 10: CI/CD және DORA

**06.11.2026 · Қазақша · Жұмыс тармағы: `feature/lz10-ci-dora`**

## Дайын нәтижелер

| Нәтиже | Файл / дәлел |
|---|---|
| Node.js/React жобасына бейімделген CI | [ci.yml](../../.github/workflows/ci.yml): build, PostgreSQL integration tests, line coverage ≥50%, gitleaks, Docker, DORA unit tests, `CI required` |
| Coverage | Толық жарияланған backend scope ішінде жергілікті **68,01%**, 39 негізгі +51 кеңейтілген API тексеруі; CI coverage artifact та сақталады |
| DORA дашборды | [Нақты есеп және диаграмма](report/README.md), [metrics.json](report/metrics.json), raw deployments/status және main CI тарихы |
| Дерек жинау | [scripts/dora.py](../../scripts/dora.py), стандартты Python API client; GitHub Actions read-only token; толық pagination |
| Метрика анықтамалары және тармақ TTL | [definitions.md](definitions.md) — wiki-ге көшіруге дайын Markdown; бөлек Wiki жарияланған жоқ |
| Релиз және откат | [release-plan.md](release-plan.md), rollback-тың бірінші тармағы: жеке шешім иесі және 5 минуттық шешім шегі |
| Екі жақсарту және capacity | [improvements-capacity.md](improvements-capacity.md): сандық мақсаттар, 20.11/04.12 қайта есептеу, reliability ұсынысы 20% |
| Тұрақты staging конфигурациясы | [staging.yml](../../.github/workflows/staging.yml), [Compose](../../ops/staging.compose.yml), [release script](../../scripts/staging-release.sh), [іске қосу шарты](staging-setup.md) |
| Қолданылмаған main protection дәлелі | [protection-evidence.json](protection-evidence.json): integration 403; private rulesets үшін GitHub Pro талабы; billing/visibility өзгерген жоқ |

## CI қалай жұмыс істейді?

Push main және PR → frontend/backend/Docker/secrets/DORA calculation тесттері параллель → `CI required` барлық міндетті job success екенін тексереді. Required aggregate `always()` арқылы жүреді: failed/cancelled/skipped dependency жасылға айналмайды. Workflow job timeout-тары 1–7 минут; measured толық прогондар <10 минут. GitHub queue/infra кідірісі мен actual elapsed уақыт evidence-де бөлек түсіндіріледі.

Дәлелденген алғашқы прогондар:

- [Бастапқы checks + aggregate: 42169941103](https://github.com/Arnurzhairbek/Adenly/actions/runs/42169941103) — success, 107 секунд.
- [90 API checks + coverage gate: 42170567988](https://github.com/Arnurzhairbek/Adenly/actions/runs/42170567988) — success, 114 секунд.
- [Secret scan + DORA collector: 42170851599](https://github.com/Arnurzhairbek/Adenly/actions/runs/42170851599) — success, 114 секунд; осы job-тың `dora-dashboard` artifact-ынан есеп алынды.

Frontend/browser acceptance толық орындалды деп айтылмайды. Backend coverage — `.c8rc.json`-дағы index/routes/controllers/middleware/db/utils/config/models толық scope-ы; optional AI/legacy модульдердің орындалмаған жолдары да denominator ішінде. Тек `.tmp.js` draft-көшірмелер excluded. API тесттерінде PostgreSQL/HTTP/PDF шынайы, сыртқы SMTP тест stub-пен, Groq кілті мәжбүрлі бос: тек жергілікті fallback тексеріледі.

Known SEC-01 test submit тұтастығы backlog-та бөлек ашық; кеңейтілген happy-path тесттер оның барлық теріс/parallel критерийін жаппайды. CI green production safety certification емес.

## Нақты DORA нәтижесі

Deployments API staging тізімі толық оқылды: **0 successful deployment**. Жиілік 0/week; lead time, CFR және recovery N/A. Журнал толықтығы бекітілмеген, сондықтан бос ledger-ден «0% ақау» немесе «0 сағат шынайы жөндеу» шығарылған жоқ. Нақты DORA мәндері CI прогондарының санымен алмастырылмайды. Оқу шкаласы әр метрикаға бөлек берілген; ресми DORA ұйым рейтингі деп көрсетілмейді.

## Қалған сыртқы шарттар

1. **Тұрақты сервер жоқ.** SSH/TLS/operator/credentials қажет; оларды ойдан жасау немесе бар сияқты көрсетуге болмайды. `STAGING_ENABLED=true` тек дайындық пен review-ден кейін орнатылады. Оқшау CI release/rollback drill нақты server deployment тарихына қосылмайды.
2. **Main protection іске қосылмады.** Репозиторий private; Rulesets API Pro/public prerequisite қайтарды, branch-protection PUT integration 403 алды. Required PR/бір review/CI қағидасы жазылғанымен, GitHub-та enforce етілгені және қызыл PR merge-ті бөгейтіні расталған жоқ. Репозиторийді жариялау/тарифті ауыстыру осы жұмыста жасалмады.
3. **Адам review-і қажет.** [PR #15](https://github.com/Arnurzhairbek/Adenly/pull/15) басқа қатысушы қарап, мақұлдағаннан кейін ғана біріктіріледі; агент өз approval-ын қоспайды.

## Қайта тексеру

Backend үшін жеке synthetic PostgreSQL және NODE_ENV=test/DB_* /JWT_SECRET берілгенде:

```bash
cd lang-backend
npm ci
npm run test:coverage
```

Репозиторий түбірінен:

```bash
python -m unittest discover -s scripts/tests -v
pip install -r scripts/requirements-dora.txt
python scripts/dora.py
```

DORA API құқығы жетпесе reason және N/A сақталады; нақты token мәні код/логқа жазылмайды. `incidents.csv` нақты incident туғанда толтырылады, `incident_observation.csv` толық терезе қаралған соң ғана reviewer арқылы бекітіледі.
