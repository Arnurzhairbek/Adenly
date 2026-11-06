# Adenly — DORA дашборды

**Орта:** `staging` · **Терезе:** 28 күн · **Дерек:** нақты GitHub API

**Жаңартылған:** 2026-11-06T08:35:39.910737+00:00 (UTC).

**Өлшеу аралығы:** 2026-10-09T08:35:37.835009+00:00 → 2026-11-06T08:35:37.835009+00:00.

[Осы деректерді жинаған GitHub Actions прогоны](https://github.com/Arnurzhairbek/Adenly/actions/runs/42188755191)

![Adenly DORA: төрт метрика және апталық deployment графигі](dora_dashboard.png)

| Метрика | Нақты мән | Бірлік | Оқу шкаласы | Үлгі саны |
|---|---:|---|---|---:|
| Орналастыру жиілігі · Deployment frequency | **0.00** | release / апта | Төмен | 0 |
| Коммиттен стендке дейін · Lead time for changes | **N/A** | сағат · медиана | Бағаланбайды | 0 |
| Сәтсіз өзгерістер үлесі · Change failure rate | **N/A** | % | Бағаланбайды | 0 |
| Қалпына келтіру уақыты · Time to restore service | **N/A** | сағат · медиана | Бағаланбайды | 0 |

## Деректің жеткіліктілігі

- Deployments API: **толық оқылды**.
- Сәтті staging release: **0**; ≥24 сағат бақыланған өзгеріс: **0**.
- Инцидент журналының толықтығы: **бекітілмеген**.
- Журналда тіркелген жабылған инцидент: **0**; ашық: **0**.

**Коммиттен стендке дейін — N/A:** Deployment немесе оның commit timestamp дәлелі жеткіліксіз.

**Сәтсіз өзгерістер үлесі — N/A:** Кемінде 24 сағат бақыланған өзгеріс және толық бекітілген incident ledger қажет.

**Қалпына келтіру уақыты — N/A:** Қалпына келу уақыты жазылған нақты инцидент жоқ.

Жасыл CI deployment болып саналмайды. Оқшауланған rollback жаттығуы нақты incident емес. Оқу шкаласы команданың жергілікті шектері; ресми DORA рейтингі емес.

## CI күйі — DORA-дан бөлек

| Workflow / прогон | Нәтиже | Толық elapsed, секунд |
|---|---|---:|
| [DORA dashboard · 42188755191](https://github.com/Arnurzhairbek/Adenly/actions/runs/42188755191) | in_progress | N/A |
| [DORA dashboard · 42186623670](https://github.com/Arnurzhairbek/Adenly/actions/runs/42186623670) | skipped | 1 |
| [Staging delivery · 42186616976](https://github.com/Arnurzhairbek/Adenly/actions/runs/42186616976) | skipped | 1 |
| [DORA dashboard · 42186333724](https://github.com/Arnurzhairbek/Adenly/actions/runs/42186333724) | success | 26 |
| [CI · 42186274162](https://github.com/Arnurzhairbek/Adenly/actions/runs/42186274162) | success | 170 |
| [Staging delivery · 42183350152](https://github.com/Arnurzhairbek/Adenly/actions/runs/42183350152) | skipped | 7 |
| [CI · 42183032673](https://github.com/Arnurzhairbek/Adenly/actions/runs/42183032673) | success | 174 |
| [.github/workflows/main.yml · 42181277307](https://github.com/Arnurzhairbek/Adenly/actions/runs/42181277307) | failure | 0 |
| [Adenly CI · 42024795594](https://github.com/Arnurzhairbek/Adenly/actions/runs/42024795594) | success | 106 |
| [Adenly CI · 42023961386](https://github.com/Arnurzhairbek/Adenly/actions/runs/42023961386) | success | 102 |

## Сенімділікке кететін уақыт

Журналдағы тіркелген жөндеу еңбегі: **0 адам-сағат**. Толық жөндеу шығыны: **N/A — журнал толықтығы расталмаған**.

## Келесі өлшемдер

| Жүйелік өзгеріс | Күтілетін нәтиже | Қайта өлшеу |
|---|---|---|
| Жасыл CI-ден кейін нақты staging deployment | ≥1 release/апта; median lead ≤24 сағат | 20.11.2026; толық кезең 04.12.2026 |
| Known-good SHA сақтау және rollback рәсімі | Drill ≤20 минут; нақты incident болса recovery ≤1 сағат | 20.11.2026; нақты incident есебі 04.12.2026 |

Бұл — жоспарлық мақсаттар. Сервер қосылмайынша мақсат орындалды деп есептелмейді.

## Бастапқы деректер және қайта жинау

- [Метрикалар JSON](metrics.json) · [Deployments API snapshot](deployments.raw.json) · [Нормаланған deployments](deployments.normalized.json) · [CI тарихы](ci_runs.json).
- [Метрика анықтамалары](../definitions.md) · [Инцидент журналы](../incidents.csv) · [Жақсартулар және capacity](../improvements-capacity.md).
- [DORA dashboard workflow](https://github.com/Arnurzhairbek/Adenly/actions/workflows/dora.yml) → **Run workflow → main**.
- Әр прогонның **Summary** бөлімінде жаңа кесте көрінеді; **Artifacts → dora-dashboard** ішінде график пен толық деректер бар.
- Осы репозиторий беті — көрсетілген уақыттағы сақталған snapshot. Жаңа workflow нәтижесі Summary/Artifact ішінде; бұл бет өздігінен жаңармайды.
