# Нақты GitHub деректері — Issues snapshot

Бұл каталогтағы деректер GitHub REST API-ден тікелей алынды. **Оқу симуляциясы емес. Бірақ GitHub Projects тақтасының экспорты да емес.**

- [Issues CSV](repository_issues.csv)
- [Issues JSON](repository_issues.json)
- [Нақты алынған уақыт, толықтық және SHA-256](repository_snapshot_metadata.json)
- [Projects қолжетімділігін тексеру](projects_access_check.json)

Тексеру кезінде 13 issue: 11 open, 2 closed. Pull request-тер қосылмаған; барлық API беті оқылды. Issue state (`open/closed`) — Projects бағаны емес; issue created_at — In Progress күні емес; closed_at — Projects Done күні емес. Сондықтан осы деректен екі спринттің cycle time/p85/WIP/CFD метрикалары есептелмейді. Бұрынғы SIMULATION файлдары бөлек қалдырылған.

## Projects экспорты үшін нақты қалған шарт

Желілік блок шешілді: API viewer авторизациясы сәтті. Бірақ user Projects оқу `Resource not accessible by integration` қайтарды. Adenly репозиторийіне байланыстырылған Projects тізімі бос; бұл аккаунтта басқа тақта жоқ дегенді білдірмейді — user project дерегіне рұқсат жоқ.

Орта баптауларында `GH_PROJECTS_TOKEN` құпиясына талап сақталды. Құпия мәнін чатқа немесе Git-ке бермеңіз. GitHub Projects-ке қолжетімді авторизацияны қауіпсіз енгізу қажет. GitHub PAT (classic) қолданылса, осы тапсырмадағы тақтаны оқу/баптау үшін `project` scope; private Adenly issue контентін жеке токенмен оқу қажет болса тиісті `repo` scope керек. Қолданыстағы платформалық Git/Issues авторизациясы сақталады. Жаңа құпия тек `api.github.com` HTTPS бағытына арналған.

Секретті environment settings ішінде енгізіп, сақтап және ортаны жариялағаннан кейін setup/export скрипттері Projects командалары үшін оны автомат қолданады. Issue REST экспорты бұрынғы репозиторий авторизациясын қолданады. Projects credential әлі енгізілген жоқ; live тақта бапталды немесе оның CSV-сі алынды деп көрсетілмейді.

Қайта орындау:

```bash
python docs/lz9/scripts/export_repository_issues.py
# Projects рұқсаты қолжетімді болғанда ғана:
python docs/lz9/scripts/export_current_board.py --project NUMBER --output docs/lz9/data/live/projects_board.csv
```

Current Projects snapshot та толық transition history емес. Бағандарда болу ұзақтығын есептеу үшін нақты ауысу журналын қосу қажет.
