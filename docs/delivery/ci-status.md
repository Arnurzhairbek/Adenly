# CI күйі және бұрынғы қызыл белгілер

Тексерілген күн: 06.11.2026. PR #15 `main` тармағына біріктірілген, commit `d18ad6c`.

[Біріктіруден кейінгі CI](https://github.com/Arnurzhairbek/Adenly/actions/runs/42183032673): **8/8 job success** — frontend, backend, Docker, secret scan, Trivy, DORA tests, real DORA snapshot және CI required.

| Скриншоттағы коммит | Прогондағы себеп | Қазіргі шешім |
|---|---|---|
| `9f71836` | Жаңа коммит келгенде run cancelled; aggregate check аяқталмаған job-тарды success деп санамайды | Кейінгі Docker drill және толық main CI өтті |
| `6808e96` | Push run success; PR run ішінде secret scan permission failure, кейін run cancelled | `pull-requests: read` берілді; қазіргі secret scan success |
| `4cfae86`, `d6c39d9`, `2e73afa` | Жаңа коммиттерден кейін Docker/job cancelled, сондықтан aggregate failure | Соңғы коммиттің толық CI-і success |
| `15d93d6` | Trivy HIGH/CRITICAL тәуелділіктерді тапты; run кейін cancelled | `fe4c723` ішінде body-parser, multer, nodemailer, follow-redirects және Pillow жаңартылды; Trivy success |

Ескі прогон нәтижесі сол коммиттің сол кездегі кодына қатысты сақталады. Кейінгі түзету оның тарихи қызыл белгісін өзгертпейді. Қазіргі кодтың күйін `main` тармағындағы соңғы CI және PR-дың соңғы коммиті көрсетеді. Тарихты өшіру не ескі нәтиженің орнына success жазу қолданылмайды.

PR #17 қауіпсіздік сканері мен build artifact жұмысын қайталайды; оның жеке файл өзгерісі жоқ (GitHub Pulls files API: `[]`). Бұл мүмкіндіктер PR #15 арқылы main ішінде бар. Сондықтан PR #17 біріктірілмей жабылды; оның авторы жасаған қадамдар main ішінде сақталған.

`Staging delivery: skipped` — сервер дайын болмай, `STAGING_ENABLED` қосылмағандағы жоспарлы күй. Нақты deployment жасалды деп саналмайды. `localhost:5173` — жеке компьютердегі dev сервер; ол GitHub runner-іне қолжетімді тұрақты host емес.
