# Нақты стендті дайындау

`http://localhost:5173/` тек dev компьютерінде ашылады. Осы нұсқаулыққа сыртқы IP/SSH пайдаланушысы бар жеке Linux VM керек. Сервер сатып алынған жоқ; провайдер мен бюджет бекітілмеген. Бұл synthetic staging профилі, нақты студент деректеріне арналмаған.

## 1. Оператор серверді дайындайды

Ubuntu 24.04 LTS үшін әкімші Docker Engine және Compose v2, Python 3, curl орнатады. Docker daemon іске қосылған және жеке deploy пайдаланушысы `docker info` орындай алуы керек. Docker құқығы host әкімшілігіне тең; орта жеке VM болуы тиіс.

Әкімші каталогты дайындайды (`DEPLOY_USER` орнына нақты deploy login қойылады):

```bash
sudo install -d -m 700 -o DEPLOY_USER -g DEPLOY_USER /srv/adenly-staging
```

Жергілікті Adenly checkout-тан екі скриптті deploy пайдаланушысының home каталогына көшіру:

```bash
scp scripts/staging_init.py scripts/staging_preflight.py DEPLOY_USER@SERVER_IP:
ssh DEPLOY_USER@SERVER_IP
python3 staging_init.py
python3 staging_preflight.py
```

SSH host fingerprint провайдер консолі арқылы алдын ала салыстырылады. Скрипт `releases/shared/backups` каталогтарын және 600 режимді `shared/staging.env` файлын жасайды. DB/JWT құпиялары серверде генерацияланады, stdout-қа шығарылмайды. Қайта орындау құпияларды/backup-ты ауыстырмайды. Preflight файл режимін, құралдарды және Docker қолжетімділігін тексереді; сервер орнатпайды және deployment жазбасын жасамайды.

## 2. GitHub-қа қосу

Repository Settings → Secrets and variables → Actions ішінде оператор төрт secret енгізеді: `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, `STAGING_KNOWN_HOSTS`. SSH public key осы deploy аккаунтының authorized_keys файлына қойылады; private key чатқа немесе Git-ке жіберілмейді. Оператор тексерген host key known_hosts ретінде енгізіледі.

Осы сессиядағы интеграция Secrets/Variables API-ға **403** алды: олардың бар-жоғын оқу не мәндерін қауіпсіз енгізу мүмкін болмады. Бұл баптаулар енгізілді деп есептелмейді. Preflight және [релиз gate-тері](release-plan.md) өткен соң ғана Actions Variables ішінде `STAGING_ENABLED=true` қосылады.

## 3. Орналастыру және ашу

Actions → **Staging delivery → Run workflow**, branch=`main`, operation=`release`. Workflow сол SHA-ның main CI success екенін және host readiness-ті тексереді, содан кейін ғана deployment record ашады. Орындалған URL/SHA/deployment ID QA хаттамасына жазылады.

Frontend host loopback 8080-де. Алғашқы жеке QA үшін өз компьютеріңізде:

```bash
ssh -N -L 18080:127.0.0.1:8080 DEPLOY_USER@SERVER_IP
```

Содан кейін браузерде `http://localhost:18080/` ашылады: бұл нақты SSH серверінің портына туннель. Қоғамдық URL үшін бөлек HTTPS reverse proxy және firewall керек; PostgreSQL/backend порттары интернетке ашылмайды.

## 4. Қабылдау, rollback, DORA

[Қабылдау сценарийлері](acceptance.md) және [релиз/rollback чек-листі](release-plan.md) қолданылады. Нақты ақау журналында тек шынайы оқиға мен өлшенген адам-сағат жазылады.

Actions → **DORA dashboard → Run workflow → main** есебін кодты өзгертпей қайта жинайды. Нақты staging workflow аяқталғанда және STAGING_ENABLED қосылғанда да есеп автомат жиналады. Artifacts → `dora-dashboard` ішінен PNG, Markdown, metrics.json және бастапқы API деректерін қараңыз. API қатесі болса job failure, artifact-та себеп пен N/A сақталады. Бос тарихтан жасанды deployment/incident жасалмайды.
