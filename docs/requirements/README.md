# Adenly — техникалық тапсырма (ТЗ)

**ADENLY-TZ-01 · 1.0 · 05.11.2026 · Қазақша · Бекітуге арналған жоба**

Тіл үйрену платформасының мақсаты, пайдаланушылар/рөлдер, көлем шекарасы, функционалдық талаптар, бизнес ережелері, БД моделі, API, қауіпсіздік, өнімділік, backup/restore, кезеңдер және қабылдау тәртібі бір құжатқа жиналды.

## Оқу және жүктеу

| Құжат | GitHub-та ашу | Жүктеу |
|---|---|---|
| Техникалық тапсырма | [Браузерде оқу](Adenly_TZ_kk.md) | [Markdown](https://github.com/Arnurzhairbek/Adenly/raw/refs/heads/main/docs/requirements/Adenly_TZ_kk.md) |
| Өңделетін есеп | [Word](Adenly_TZ_kk.docx) | [DOCX](https://github.com/Arnurzhairbek/Adenly/raw/refs/heads/main/docs/requirements/Adenly_TZ_kk.docx) |
| Басып шығаруға | [PDF](Adenly_TZ_kk.pdf) | [PDF жүктеу](https://github.com/Arnurzhairbek/Adenly/raw/refs/heads/main/docs/requirements/Adenly_TZ_kk.pdf) |
| Толық пакет | [ZIP](Adenly_TZ_Paket.zip) | [ZIP жүктеу](https://github.com/Arnurzhairbek/Adenly/raw/refs/heads/main/docs/requirements/Adenly_TZ_Paket.zip) |
| Талаптар тізілімі | [requirements.csv](requirements.csv) | Excel/LibreOffice Calc-та ашылады |
| Қабылдау матрицасы | [acceptance_tests.csv](acceptance_tests.csv) | Expected/actual/evidence/tester/date өрістері бар |

## Құжатты қалай қолдану керек?

**32 талап:** 20 функционалдық және 12 функционалдық емес. **31 қабылдау сценарийі:** AT-22 екі UI/platform талабын бірге тексереді, сондықтан CSV матрицасында 32 байланыс жолы бар. Әр талаптың тұрақты ID-і және сынаққа сілтемесі сақталған. Сынақтардың бастапқы күйі **Not run**: бұл құжат сынақ нәтижесі емес.

- **D** — 10.12.2026 мерзіміне арналған жабық synthetic демо: бір курс, сабақ, тест, прогресс, негізгі сертификат, қауіпсіздік және тапсыру.
- **M** — бөлек күн/еңбек/оператор бекітілетін толық MVP және нақты дерек пилоты. Демоның 54 сағаттық бағасына барлық MVP талабы автомат қосылмайды.
- **O** — сыртқы ЖИ және өзге кеңейтулер, бөлек scope/қауіпсіздік келісімімен.

Команда: Жайрбек Арнұр — PM; Байғұл Шыңғыс — Business / System Analyst; Есеркенов Абдулазиз — Technical Lead / Developer; Әшімбай Қайсар — Data / QA Analyst. Оқытушы — Некесова А.А. Тапсырыс беруші ұйым/өкілетті қабылдаушы/оператор үшін толтыру өрістері қалдырылған.

Тапсыру алдында: тараптарды, тіл жұбы/курс контентін, D көлемінің қалдық бағасын, M мерзімін, нақты дерек саясаты мен операторды бекіту; матрицаны нақты тест дәлелімен толтыру. Талаптың құжатта болуы кодтың оған толық сай екенін білдірмейді.

[Тексеру мәліметі](validation.json) · [SHA-256 тізімі](manifest.json) · [Бастапқы SoW](../lz8/01_SoW.md) · [Нақты backlog](../plan/real-backlog.md)

## Қайта құру

Python 3.12, python-docx, reportlab және `/usr/share/fonts/truetype/dejavu/` қаріптері бар ортада репозиторий түбірінен:

```bash
python docs/requirements/build_tz.py
```

Скрипт requirements құжаттары мен CSV бастапқы Not run матрицасын қайта жазады. Нақты толтырылған қабылдау нәтижелерін бөлек evidence каталогында сақтаңыз. Қайта құру қолданба кодын немесе орындалған тест нәтижесін өзгертпейді.
