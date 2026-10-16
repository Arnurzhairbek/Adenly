# ЛЗ 7 — сканерлердің нәтижелері

Тексеру күні: 16.10.2026. Код HEAD: `bed4ac0da54d0e64880a8fb66c1caa530dd8bd51`.

## gitleaks

gitleaks v8.30.1: `detect --source /path --log-opts=--all --redact=100`. Exit code: 0. Runner: **24 commits scanned**, шамамен 1.62 MB, **no leaks found**. `git rev-list --count --all` 25 commit көрсетеді; бұл санды runner есептеген 24-пен алмастырмаймыз. Checkout shallow емес. Қорытынды тек жергілікті қолжетімді refs пен сканер ережелеріне қатысты; барлық ықтимал құпияның жоқтығына кепілдік емес. Дәлел: [JSON](reports/gitleaks-redacted.json). Табылған белсенді құпия жоқ болғандықтан, кілтті қайтарып алу жасалмады. Кейін табылса, дереу провайдерде revoke/rotate жасау керек: git-тен файлды өшіру жеткіліксіз.

Қосымша `gitleaks dir /path --redact=100` арқылы ағымдағы файлдар да тексерілді: exit 0, шамамен 2.71 MB, табылым жоқ. [Жұмыс каталогы есебі](reports/gitleaks-working-redacted.json). Бұл команда сканердің әдепкі ignore ережелерін сақтайды.

## Trivy

Trivy 0.76.0, `fs --scanners vuln,misconfig`, exit code 0. Алғашқы mirror.gcr.io DB сұрауы Forbidden қайтарды. ghcr.io-ға ауысқанда контейнердің CA қатесі шықты. Хосттағы `/etc/ssl/certs` сенім қоймасы read-only беріліп, TLS тексеру сақталғанда **сканерлеу сәтті аяқталды**. `--insecure` немесе сертификат тексеруін өшіру қолданылмады.

Ауқым: lockfile тәуелділіктері және Dockerfile конфигурациялары. node_modules және .git Trivy үшін өткізілді; Git тарихын gitleaks тексерді. Контейнер image OS пакеттері, динамикалық эксплуатация және production инфрақұрылымы тексерілген жоқ. `vuln,misconfig` әдейі таңдалды; secret scan gitleaks-ке бөлінді.

**13 осалдық жазбасы: 4 HIGH, 8 MEDIUM, 1 LOW. 4 конфигурация табылымы: 2 HIGH, 2 LOW.** Бұл 17 бөлек табылым жазбасы; advisory қайталануын және кодта іске жетуін жеке сараптау керек. Сканер дерегі — сараптау кірісі, эксплуатация дәлелі емес.

Дәлел: [толық Trivy JSON](reports/trivy.json). HIGH nodemailer жазбалары үшін сканер бірнеше әртүрлі FixedVersion береді; manifest пен lockfile-ды автоматты өзгертпедік. Ресми advisory мен үйлесімділікті тексеріп, барлық қолданылатын advisory-ді жабатын нұсқаны таңдау қажет.

## Әр табылымға арналған triage тапсырмасы

| ID | Target | Табылым | Пакет/орын | Деңгей | Орнатылған → сканер ұсынған түзету | Иесі | Мерзім | Күй / әрекет |
|---|---|---|---|---|---|---|---|---|
| SC-01 | lang-backend/package-lock.json | CVE-2026-82659 | nodemailer | HIGH | 7.0.13 → 9.0.1 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-02 | lang-backend/package-lock.json | CVE-2026-82662 | nodemailer | HIGH | 7.0.13 → 8.0.8 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-03 | lang-backend/package-lock.json | GHSA-2x7j-588g-ccc2 | nodemailer | HIGH | 7.0.13 → 9.1.0 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-04 | lang-backend/package-lock.json | GHSA-v53p-9fqp-m79j | nodemailer | HIGH | 7.0.13 → 10.0.6 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-05 | lang-backend/package-lock.json | GHSA-268h-hp4c-crq3 | nodemailer | MEDIUM | 7.0.13 → 8.0.9 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-06 | lang-backend/package-lock.json | GHSA-6vj9-mwq6-2f5v | nodemailer | MEDIUM | 7.0.13 → 10.0.2 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-07 | lang-backend/package-lock.json | GHSA-8m3c-c648-2xjj | nodemailer | MEDIUM | 7.0.13 → 9.1.1 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-08 | lang-backend/package-lock.json | GHSA-8vvx-rff5-p5rq | nodemailer | MEDIUM | 7.0.13 → 10.0.2 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-09 | lang-backend/package-lock.json | GHSA-cc9r-2j5m-2m83 | nodemailer | MEDIUM | 7.0.13 → 9.1.0 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-10 | lang-backend/package-lock.json | GHSA-vvjj-xcjg-gr5g | nodemailer | MEDIUM | 7.0.13 → 8.0.5 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-11 | lang-backend/package-lock.json | GHSA-wmmp-3585-3rmp | nodemailer | MEDIUM | 7.0.13 → 9.1.0 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-12 | lang-backend/package-lock.json | GHSA-wqvq-jvpq-h66f | nodemailer | MEDIUM | 7.0.13 → 8.0.9 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-13 | lang-backend/package-lock.json | GHSA-c7w3-x93f-qmm8 | nodemailer | LOW | 7.0.13 → 8.0.4 | Есеркенов Абдулазиз | 22.10.2026 | Ашық; advisory/қолданылуын тексеру, түзету нұсқасын таңдау, build/API/mail регрессиясы |
| SC-14 | lang-backend/Dockerfile | DS-0002 | Image user should not be 'root' | HIGH | — | Есеркенов Абдулазиз | 23.10.2026 | Ашық; Root емес user және файл рұқсаттарын тексеру |
| SC-15 | lang-backend/Dockerfile | DS-0026 | No HEALTHCHECK defined | LOW | — | Есеркенов Абдулазиз | 23.10.2026 | Ашық; Compose healthcheck барын ескеру; standalone image readiness саясатын анықтау |
| SC-16 | lang-frontend/Dockerfile | DS-0002 | Image user should not be 'root' | HIGH | — | Есеркенов Абдулазиз | 23.10.2026 | Ашық; Root емес user және файл рұқсаттарын тексеру |
| SC-17 | lang-frontend/Dockerfile | DS-0026 | No HEALTHCHECK defined | LOW | — | Есеркенов Абдулазиз | 23.10.2026 | Ашық; Compose healthcheck барын ескеру; standalone image readiness саясатын анықтау |

Барлық SC жазбалары — сканер хабарлаған ағымдағы табылымдар, сондықтан оларға ықтималдық қойылмайды. R07 олардан туындауы мүмкін болашақ салдарды сипаттайды. Бұл файлдағы triage тапсырмалары GitHub issues емес; трекерге енгізу API құқығын күтеді.

trivy нақты image digest: `aquasec/trivy@sha256:2416d1f74045b57274df1a340eee6b510cacd73c66a6ccb8da092b117eb7d222`.

gitleaks нақты image digest: `zricethezav/gitleaks@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f`.
