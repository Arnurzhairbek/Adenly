# Тұрақты синтетикалық staging стендін қосу

Қазіргі тапсырмада пайдаланушы тұрақты сервер жоқ екенін растады. Workflow және Compose дайын; сыртқы сервер provision жасалған жоқ. Орналастыру үшін Ubuntu/Linux сервер, Docker Engine/Compose, Python 3, curl, SSH және оператор қажет. Бастапқы 2 vCPU/4 GiB ресурс — жоспарлық үлгі, жүктеме тестімен расталмаған.

1. Оператор `/srv/adenly-staging/releases`, `/srv/adenly-staging/shared`, `/srv/adenly-staging/backups` каталогтарын deploy пайдаланушысына дайындайды. Docker құқығы host әкімшілігіне тең болуы мүмкін; бұл аккаунт тек осы synthetic стендке арналған болуы тиіс.
2. `ops/staging.env.example` үлгісін checkout-тан тыс `/srv/adenly-staging/shared/staging.env` ретінде көшіріп, жергілікті генерацияланған DB_PASS/JWT_SECRET енгізу, `chmod 600` қою. Құпия мәндерді Git/чатқа жазбау.
3. Сервердің SSH host key fingerprint-ін сенімді арнамен тексеріп, known_hosts жазбасын сақтау. Workflow host тексеруін өшірмейді, белгісіз host key-ді автомат қабылдамайды.
4. Репозиторий Actions secrets ішінде `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, `STAGING_KNOWN_HOSTS` мәндерін қауіпсіз енгізу. Бұл төрт мәнді нақты серверсіз ойдан толтыруға болмайды. Дайындық/gate расталғаннан кейін ғана Actions repository variable `STAGING_ENABLED=true` орнату. Оған дейін deploy job skipped болады, deployment жазбасы жасалмайды.
5. Compose frontend-ті тек host loopback 8080-ге шығарады; PostgreSQL/backend host порты ашылмайды. Сыртқы браузерге қолжетімділік керек болса оператор TLS reverse proxy/firewall/доменді бөлек баптайды.
6. Бірінші release тек CI/peer review/қабылдау gate-тері өткеннен кейін. `staging.yml` manual release үшін де дәл SHA-ның successful main CI-сін тексереді. Main-ға қосылмаған workflow автомат deploy іске қоспайды.
7. `staging-release.sh` SHA-tagged images жасап, қажет болса pre-release pg_dump алады, Compose іске қосады, health/API/frontend тексереді; содан кейін ғана current көрсеткішін жаңартады. DB migration/restore автомат орындалмайды.
8. Әр сәтті release-тің source bundle және екі image-ін кемінде алдыңғы known-good нұсқамен бірге сақтау. Оператор backup retention/encryption/off-host сақтауын production талабына дейін жеке бекітеді; бұл профиль тек synthetic дерекке арналған.

Бұл CI ішіндегі уақытша Docker smoke-тен бөлек тұрақты host. Оқшау workspace-та жасалған configuration/drill тексеруі DORA deployment/incident дерегіне қосылмайды.

## Қолданылатын авторизация

CI/DORA job репозиторийге scoped қысқа мерзімді `github.token` қолданады: contents/actions/deployments **read**. Deploy job-қа ғана deployments **write** беріледі. Қосымша жеке PAT бұл read-only метрика жинауға қажет болмады. Жергілікті жинақта бар `GH_TOKEN`/`GITHUB_TOKEN` пайдаланылады; құқық жетпесе метрика N/A және нақты API қатесі сақталады. Бұрынғы Projects токені бұл workflow-ға қатыспайды.
