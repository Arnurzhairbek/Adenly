"""15 academic weeks: evidence-backed past work and a prospective remaining delivery plan."""
from pathlib import Path
from datetime import date,timedelta,datetime
import csv

ROOT=Path(__file__).resolve().parent
CURRENT_WEEK=10
TARGET_WEEK={
 'FR-01':12,'FR-02':12,'FR-03':12,'FR-04':12,'FR-05':12,'FR-06':12,
 'FR-07':12,'FR-08':11,'FR-09':11,'FR-10':11,'FR-11':11,'FR-12':12,'FR-13':12,'FR-14':12,
 'NFR-01':13,'NFR-02':13,'NFR-03':13,'NFR-04':12,'NFR-05':13,'NFR-06':13,'NFR-07':14,
}
CURRENT_EVIDENCE={
 'FR-01':'Login/JWT API smoke бар; толық browser acceptance жоқ.',
 'FR-02':'Token/ownership теріс API сынақтары бар; толық рөлдік матрица әлі қажет.',
 'FR-03':'GET /auth/me API бар және тексерілген; browser критерийі ашық.',
 'FR-04':'Курс тізімі API тексерілген; empty/error/mobile UI толық тексерілмеген.',
 'FR-05':'30.10 canonical/legacy URL, invalid/missing/empty course API тексерілді; peer/browser review қажет.',
 'FR-06':'Сабақ мазмұны API қайтады; HTML қауіпсіздігі және толық browser acceptance ашық.',
 'FR-07':'Progress сақтау/ownership API тексерілді; parent consistency/idempotency толық gate ашық.',
 'FR-08':'Start коды бар; server start/attempt протоколы қабылданбаған.',
 'FR-09':'Submit коды бар; SEC-01 #12 теріс тест/түзетуі ашық.',
 'FR-10':'Бағалау коды бар; transaction/parallel submit/rollback acceptance жоқ.',
 'FR-11':'Attempt маршруттары бар; толық жеке нәтиже browser/ownership acceptance жоқ.',
 'FR-12':'PDF маршруттары бар; issuance/idempotency/ownership қабылданбаған.',
 'FR-13':'Seed бар; бір нақты курс/тіл жұбының демо шекарасы бекітіледі.',
 'FR-14':'D-де upload/сыртқы ЖИ ажыратылғанының теріс дәлелі жоқ.',
 'FR-15':'Register/verify/login API smoke бар; нақты SMTP/reset lifecycle және күшейтілген пароль саясаты қабылданбаған.',
 'FR-16':'30.10 атауды DB-ға сақтау API және frontend build өтті; peer/browser review ашық. M scope бөлек.',
 'FR-17':'CRUD коды бар; schema/history/admin acceptance толық емес.',
 'FR-18':'Notifications API ішінара тексерілген; XP және оқиғалық дубликат қорғанысы ашық.',
 'FR-19':'Feedback коды бар; толық валидация/admin/rate-limit acceptance жоқ.',
 'FR-20':'ЖИ коды бар; O scope, құқықтық/security gate ашық.',
 'NFR-01':'Тарихи setup/build/health дәлелі бар; release ортасын таза қайта іске қосу керек.',
 'NFR-02':'Қазақша UI бар; толық state/keyboard/label матрицасы тексерілмеген.',
 'NFR-03':'Production build өтті; көрсетілген browser/viewport қабылдауы жоқ.',
 'NFR-04':'bcrypt/JWT/ownership API дәлелі ішінара; қалған security gate ашық.',
 'NFR-05':'FK/unique схема бар; толық migration/parallel rollback дәлелі жоқ.',
 'NFR-06':'Оқшау restore қабылдау хаттамасы жоқ.',
 'NFR-07':'30.10 39 smoke/syntax/build тарихи нәтижесі бар; release peer/browser/gate дәлелі қажет.',
 'NFR-08':'Пилот load/SLI жүктеме сынағы орындалмаған; көлем бағасы жорамал.',
 'NFR-09':'SLO/SLA/error budget құжаты бар; оператор/айлық нақты өлшем бекітілмеген.',
 'NFR-10':'Compliance checklist бар; құқықтық негіз/сақтау елі/оператор бекітілмеген.',
 'NFR-11':'RPO/RTO жоба мақсаты; daily backup/retention/restore дәлелі жоқ.',
 'NFR-12':'Health/Morgan базасы бар; толық journey/audit/monthly SLO acceptance жоқ.',
}
# Calendar is inferred, not a user-confirmed academic calendar.
START=date(2026,8,31)
PLAN=[
(1,'Жоба тақырыбы және мәселе','Осы аптаға даталанған бастапқы паспорт табылмады.','Тақырып, проблема, мақсат, пайдаланушы және табыс критерийі жазылған бастапқы паспортты растау; жоқ болса 10-аптада ағымдағы күнмен толықтыру.','Арнұр, Шыңғыс','Жоба паспорты, мәселе/мақсат/шекара','ТЗ §1–3','docs/lz8/gaps/01_Project_passport.md — толтырылмаған үлгі, өткен жұмыс дәлелі емес.','Расталмаған'),
(2,'Мүдделі тараптар және талаптар','Сұхбат/талаптардың осы аптадағы жеке нұсқасы табылмады.','Тапсырыс беруші/қабылдаушы, student/admin/operator рөлдері, FR/NFR және қабылдау критерийлерінің бастапқы нұсқасын растау.','Шыңғыс, Арнұр','Stakeholder тізімі, талаптар baseline-ы','FR-01–FR-20; ТЗ §2','docs/lz8/gaps/02_Requirements.md — толтырылмаған үлгі, өткен жұмыс дәлелі емес.','Расталмаған'),
(3,'Жүйе модельдері және архитектура','Модель файлдары бар, бірақ 3-аптада жасалғанын растайтын жазба жоқ; Git-та 15.10 күні қосылған.','DFD/IDEF/ER модельдерін талаптармен сәйкестендіру; бастапқы тапсыру дәлелін бар болса қосу; күнін артқа қоймау.','Шыңғыс, Абдулазиз','Контекст/ағын/дерек моделі','NFR-01; ТЗ §6,8','docs/diagrams/kk/Adenly-diagrams-kk.md; commit bed4ac0 (15.10.2026)','Расталмаған'),
(4,'UI сценарийлері және деректер моделі','UI/БД коды 09.10 импортында бар; осы аптадағы прототип/нұсқа дәлелі жоқ.','Кіру→курс→сабақ→прогресс→тест экрандарын және кесте байланысын растау; прототиптің нұсқасын тіркеу.','Шыңғыс, Абдулазиз, Қайсар','Экран ағыны, ER/FK және UI критерийлері','FR-01,FR-03–FR-13','lang-frontend/src; lang-backend/db/init.sql; код импорты 9385458 (09.10.2026)','Расталмаған'),
(5,'Басқару моделі және бастапқы жоспар','ADR/WBS файлдары бар, бірақ 5-аптаға жатқызу дәлелі жоқ; ADR 09.10, WBS 16.10.','Команда рөлдері, backlog, DoR/DoD, WBS/тәуелділік және көлем шекарасын келісу; бар құжаттарды нақты күндерімен пайдалану.','Арнұр, Шыңғыс','ADR, WBS, RACI, басым backlog','ТЗ §1,10–12','docs/adr/ADR-001.md; docs/plan/README-lz5.md','Расталмаған'),
(6,'Код импорты, backlog және CI','09.10: қолданба main-ға енгізілді, Docker/DB порттары мен auth/build блокерлері түзетілді; 10 user story backlog, Planning Poker/Monte Carlo құжаттары қосылды.','Сол кездегі 28 smoke/CI нәтижесін тарихи дәлел ретінде сақтау; ашық story acceptance-ін жабылды деп санамау; нақты throughput тарихын жинау.','Абдулазиз, Қайсар; Арнұр/Шыңғыс','Іске қосылатын baseline, backlog және CI есебі','FR-01–FR-07; NFR-01,NFR-04,NFR-07','0482bca; 791a92b; docs/plan/import-validation.md; docs/plan/backlog-lz6.md','Ішінара'),
(7,'Модельдер, тәуекел және қауіпсіздік','15–16.10: қазақша модельдер, WBS/релиз/RACI/capacity, 22 тәуекел RAID, STRIDE, compliance checklist, scan және SEC #12–#14 тапсырмалары дайындалды.','Қауіпсіздік шараларын кодта орындау; заң/дерек саясатын бекіту; табылымдар triage-ін нақты түзетумен жабу; жоспардың болуы тәуекелдің жойылғаны емес.','Арнұр, Шыңғыс, Абдулазиз, Қайсар','Тәуекел тізілімі, қауіпсіздік backlog және резерв','FR-09,FR-10,FR-14; NFR-04,NFR-10','13343f4; 068ad16; d8c0565; docs/security/README.md','Ішінара'),
(8,'SoW, SLO/SLA және қаржы','23.10: SoW, үш SLO/SLA сценарийі, error budget, 12 айлық бюджет, юнит-экономика, үш TCO және қорғау пакеті GitHub-қа қосылды.','Тарифтерді ресми quote/калькулятормен растау; тапсырыс беруші/оператор мен келісімдерді бекіту; демо көлемін қорғау.','Арнұр, Шыңғыс; Қайсар есепті тексереді','ЛЗ 8 пакеті; 899 800 ₸ резервпен модель, нақты шот емес','NFR-08–NFR-12; ТЗ §3,9,12','13217f1; docs/lz8/README.md','Ішінара'),
(9,'Екі спринт симуляциясы және нақты екі түзету','30.10: 14 SIM task/84 оқиға, CFD/метрика/бір R1 әрекеті бар ЛЗ 9; профиль атауын DB-ға сақтау және course lessons URL коды; 39 API smoke және frontend build өтті; 13 нақты Issues snapshot алынды.','Peer review және браузер acceptance; шынайы Projects қолжетімділігі мен transition журналын ұйымдастыру. SIM нәтижесін нақты екі апта жұмысына айналдырмау.','Қайсар, Абдулазиз; Арнұр','ЛЗ 9 симуляциясы; #4/#6 code review; Issues CSV','FR-05,FR-16; NFR-07','62f011e; e68ef10; 979bc91; docs/plan/real-backlog.md','Ішінара'),
(10,'ҚАЗІР: ТЗ және қалған көлемді бекіту','05.11: ТЗ 1.0 GitHub-қа енгізілді; 32 талап/31 acceptance сценарийі жасалды. 1.1-де осы 15 апталық actual/plan кестесі енгізілді; барлық acceptance Not run, толық қабылдау жоқ.','ТЗ/D көлемін және бір курс/тіл жұбын бекіту; 1–5 апта дәлелдерін жинау; #4/#6 peer/browser review; қалған effort пен рөлдік availability-ді қайта бағалау; Projects рұқсатын тексеру.','Арнұр, Шыңғыс; Қайсар/Абдулазиз','ТЗ 1.1, расталған scope және нақты қалған backlog','Барлық D талап; FR-05,FR-16; AT-05,AT-16','4cfd47e; docs/requirements; осы 1.1 жоспар','Ағымдағы'),
(11,'Тест тұтастығы — негізгі қауіпсіздік gate','Әлі орындалды деп расталған жоқ.','SEC-01 #12: server start/attempt протоколы, question/answer тиесілігі, толықтық, max attempts/time, транзакция, parallel/double submit және rollback; #4/#6 қабылдауын аяқтау.','Абдулазиз — код; Қайсар — теріс/параллель тест; Шыңғыс — критерий','FR-08–FR-11/AT-08–AT-11 өтетін дәлел; #12 мерзімі 13.11','FR-08–FR-11; NFR-04,NFR-05','docs/security/backlog.md; issue #12','Жоспар'),
(12,'Прогресс, нәтиже, сертификат және D қорғанысы','Әлі толық acceptance дәлелі жоқ.','Course/lesson consistency және duplicate progress; жеке нәтиже/PDF/дубликат қорғанысы; #13/#14 бойынша D-де қолданылмайтын upload/ЖИ-ді серверде ажырату және теріс тест; негізгі браузерлік UC.','Абдулазиз, Қайсар; Шыңғыс дерек шекарасы','UC-01→05 толық негізгі тізбек; D security gate; #13/#14 мерзімі 20.11','FR-02,FR-06,FR-07,FR-12–FR-14; AT-02,AT-06,AT-07,AT-12–AT-14','docs/security/backlog.md; issue #13/#14; docs/plan/releases-lz5.md','Жоспар'),
(13,'Интеграция және оқшау қалпына келтіру','Алдағы апта; орындалған акт жоқ.','Synthetic миграция/FK/row count салыстыру; backup-ты бөлек БД-ға restore; жаңа ортадан startup; қазақша loading/empty/error және рөлдік регрессия; runbook/нұсқаулық.','Қайсар — QA/restore; Абдулазиз — орта; Шыңғыс — нұсқаулық','AT-21–AT-26 дәлелі; restore хаттамасы, негізгі UC қайта өтуі','NFR-01–NFR-07; FR-13; AT-13,AT-21–AT-26','ТЗ §7,11,12; release I3','Жоспар'),
(14,'Release candidate және алдын ала қорғау','Алдағы апта; release қабылданған жоқ.','Барлық D матрицасын толтыру; P1/P2 ақауларын жабу; басқа адамның review-і; fresh-session демонстрация; код/README/CSV/Word/PDF/нұсқаулықты бір нұсқаға жинау; RC-ні freeze ету.','Арнұр — үйлестіру; Қайсар — gate; бүкіл команда','D талаптары passed, evidence бар, ашық P1/P2=0; алдын ала қорғау; RC нұсқасы','Барлық D; NFR-07; AT-26','ТЗ §11; талап/сынақ матрицасы','Жоспар'),
(15,'Финалдық қабылдау, оқыту және қорғау','Алдағы апта; өнімді қабылдау актісі жоқ.','07.12 RC ұсыну; 08–10.12 үш жұмыс күнінде қарау; тек release-blocking түзету/қайта тест; қысқа оқыту/кері байланыс; архив/құқық/runbook беру; 10.12 финалдық демо және акт.','Арнұр — тапсыру; Шыңғыс — оқыту; Абдулазиз — релиз; Қайсар — дәлел','Қабылдау шешімі, release tag/commit, D evidence, оқыту/restore/runbook; M/O ашық тізімі','ТЗ §10–12; барлық D қабылдауы','docs/lz8/01_SoW.md; 10.12.2026 baseline','Жоспар'),
]

def rows():
    result=[]
    for week,topic,done,todo,owner,deliverable,requirements,evidence,status in PLAN:
        start=START+timedelta(weeks=week-1);end=start+timedelta(days=6)
        result.append(dict(week=week,start_date=start.isoformat(),end_date=end.isoformat(),topic=topic,
                           done_and_evidence_status=done,remaining_or_planned_work=todo,owner=owner,
                           acceptance_deliverable=deliverable,requirements=requirements,evidence=evidence,status=status))
    assert [r['week'] for r in result]==list(range(1,16))
    assert result[9]['start_date']=='2026-11-02' and result[14]['start_date']=='2026-12-07'
    return result

INTRO='''Пайдаланушы нақтылағаны: **қазір 10-апта, жоба 14–15-аптада қорғалады**. Ұсынылған бөлу: 14-апта — release candidate/алдын ала қорғау; 15-апта — финалдық қабылдау/қорғау. 10.12.2026 тапсыру baseline-ы сақталады.

Күндер — академиялық күнтізбенің расталған көшірмесі емес: 05.11.2026-ны 10-аптаға қойып, аптаның басын дүйсенбі деп есептеген сәйкестендіру. Сонда 1-апта 31.08–06.09, 10-апта 02–08.11, 14-апта 30.11–06.12, 15-апта 07–13.12 болады; финалдық жұмыс 10.12-ге дейін. Оқу күнтізбесі басқаша болса күндер қайта сәйкестендіріледі, апта нөмірлері негізгі жоспар ретінде қалады.

ЛЗ нөмірі, академиялық апта және бұрынғы сегіз апталық релиз жоспары бір нәрсе емес. Бұрынғы ЛЗ 5-тегі 19.10–10.12 W1–W8 релиз слоттары осы күнтізбеде академиялық **8–15 апталарға** сәйкес келеді. Жаңа кесте бұрынғы өткен нәтижелерді қайта даталамайды.

Күй белгілері: **Расталмаған** — сол аптаға нақты даталанған дәлел жоқ, «істелмеді» деген үкім емес; **Ішінара** — құжат/код/тест бар, бірақ толық acceptance/gate жабылмаған; **Ағымдағы** — 10-апта; **Жоспар** — болашақ нәтиже, орындалған факт емес. Git-та файл қосылған күн оның бүкіл бастапқы әзірлеу күні болып саналмайды.
'''

def section_markdown():
    text='## 10. Академиялық 1–15 апталық жоба жоспары\n\n'+INTRO+'\n'
    for r in rows():
        start=date.fromisoformat(r['start_date']).strftime('%d.%m');end=date.fromisoformat(r['end_date']).strftime('%d.%m')
        text+=f"\n### {r['week']}-апта ({start}–{end}) — {r['topic']}\n\n"
        text+=f"**Күйі:** {r['status']}. **Жауапты:** {r['owner']}.\n\n"
        text+='**Не жасалды / не расталды:** '+r['done_and_evidence_status']+'\n\n'
        text+='**Не істелуі керек:** '+r['remaining_or_planned_work']+'\n\n'
        text+='**Апта нәтижесі / қабылдау:** '+r['acceptance_deliverable']+'\n\n'
        text+='**ТЗ байланысы:** '+r['requirements']+'. **Дәлел/негіз:** '+r['evidence']+'\n'
    text+='''
### 10.1 Қазір, 10-аптадағы нақты жағдай

Бар: код baseline-ы/БД/CI; тіркелу мен login API тексерулері; курс/сабақ және progress API; профиль атауын сақтау мен жаңа lessons URL; 30.10 тарихи 39 smoke тесті; басқару/тәуекел/SoW/бюджет құжаттары; 32 талап/31 сынақпен ТЗ. Барлық талап түгел accepted деген белгі жоқ.

Жетпейтіні: SEC-01 толық қауіпсіз submit; жеке result/certificate және restore қабылдауы; browser/peer review; қолданыстағы Projects құқықтары; бастапқы апталардың расталмаған құжаттары; қабылдаушы/оператор және нақты дерек саясаты. 13 Issues snapshot — Projects transition тарихы емес. ЛЗ 9 екі спринті — модель; шынайы екі аптаның атқарылған есебі емес.

10-аптаның соңына дейін басым нәтиже: бір курс/тіл жұбы мен D scope-ты бекіту, 1–5 апта дәлелдерін жинау, #4/#6-ны браузер/peer review-ге өткізу және 11-аптаға #12 қауіпсіздік жұмысының орындалатын шағын пакеттерін дайындау. M/O мүмкіндіктері D қабылдауы есебінен қосылмайды.

### 10.2 Көлем, тәуелділік және бақылау

Реті: scope/критерий → қауіпсіз test submit → нәтиже/сертификат және D қорғанысы → integrated regression/restore → RC → финалдық қабылдау. #12 орындалмай тұрып тест/сертификатты толық дайын деп көрсетпейміз. 14-аптада RC дайындау керек, бірақ 07.12 ұсыну алдындағы ақау тізімі мен нұсқасы тағы расталады. Дәлелді ұсыныс 07.12 берілсе қарау терезесі 08–10.12.

Қалған еңбек сағаты нақты timesheet-пен қайта есептеледі. Бұрынғы 192 gross/32 unavailable/102 risk/58 work/54 demo сандары 19.10–10.12 толық релиз интервалына қатысты; оларды 10-аптадан кейінгі бос уақыт деп қайта қолдануға болмайды. Әр адамға 6 сағат/апта — бұрын расталған бағдар, бірақ нақты сессия/мереке және өткен еңбек шегеріледі. Қазіргі орындалу пайызы task саны немесе академиялық апта санынан ойдан шығарылмайды.

Апта сайын PM жоспар/нақтыны салыстырады; QA acceptance/evidence-ті тіркейді; Tech Lead қалдық бағасын жаңартады. In Progress ≤2/адам, Review ≤3/команда. Мерзім бекітілсе жаңа жұмыс тек салыстырмалы көлемдегі міндетті емес жұмыстың орнына кіреді; қауіпсіздік/тұтастық/restore/тапсыру алынбайды. Өзгеріс CR арқылы келісіліп, backlog/ТЗ нұсқасы жаңартылады.
'''
    return text

def write_plan():
    data=rows()
    (ROOT/'semester_plan.md').write_text('# Adenly — 15 апталық жоба жоспары: қазір 10-апта\n\n05.11.2026 · ТЗ 1.1 қосымшасы\n\n'+section_markdown(),encoding='utf-8')
    with (ROOT/'semester_plan.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(data[0]),lineterminator='\n');writer.writeheader();writer.writerows(data)
    write_xlsx(data)
    return data

def write_xlsx(data):
    import xlsxwriter
    workbook=xlsxwriter.Workbook(ROOT/'Adenly_15_aptalyk_zhospar.xlsx')
    workbook.set_properties({'title':'Adenly — 15 апталық жоспар, ағымдағы 10-апта','author':'Adenly командасы'})
    head=workbook.add_format({'bold':True,'bg_color':'#163D51','font_color':'white','text_wrap':True,'border':1})
    wrap=workbook.add_format({'text_wrap':True,'valign':'top','border':1,'font_size':10})
    now=workbook.add_format({'text_wrap':True,'valign':'top','border':1,'bg_color':'#FFF0BB','font_size':10})
    datefmt=workbook.add_format({'num_format':'dd.mm.yyyy','border':1,'valign':'top'})
    sheet=workbook.add_worksheet('15 апта');sheet.hide_gridlines(2);sheet.freeze_panes(4,4)
    sheet.merge_range('A1:K1','ADENLY — 1–15 апталық жоспар | ҚАЗІР 10-АПТА | 05.11.2026',head)
    sheet.merge_range('A2:K2','Күндер — есептік сәйкестендіру; 14-апта RC, 15-апта финал, тапсыру 10.12.2026. Жоспар мен дәлел бөлек.',wrap)
    sheet.set_row(1,32)
    headers=['Апта','Басталу (жорамал)','Аяқталу (жорамал)','Тақырып','Не жасалды / дәлел күйі','Не істелуі керек','Жауапты','Нәтиже / gate','ТЗ талаптары','Дәлел / файл / commit','Күй']
    for c,h in enumerate(headers):sheet.write(3,c,h,head)
    sheet.set_row(3,42);sheet.set_column('A:A',8);sheet.set_column('B:C',15);sheet.set_column('D:D',30);sheet.set_column('E:F',65);sheet.set_column('G:G',35);sheet.set_column('H:H',50);sheet.set_column('I:J',40);sheet.set_column('K:K',20)
    for r,item in enumerate(data,4):
        fmt=now if item['week']==CURRENT_WEEK else wrap
        for c,(key,value) in enumerate(item.items()):
            if key in ['start_date','end_date']:sheet.write_datetime(r,c,datetime.combine(date.fromisoformat(value),datetime.min.time()),datefmt)
            else:sheet.write(r,c,value,fmt)
        sheet.set_row(r,116)
    sheet.autofilter('A4:K19');sheet.set_landscape();sheet.set_paper(8);sheet.fit_to_pages(1,0);sheet.repeat_rows(0,3)
    overview=workbook.add_worksheet('10-апта күйі');overview.set_column('A:A',40);overview.set_column('B:B',110)
    overview.write_row('A1',['Көрсеткіш','Түсініктеме'],head)
    facts=[('Ағымдағы апта','10 — пайдаланушы нақтылады'),('14-апта','Release candidate, алдын ала қорғау, D матрицасы'),('15-апта','Финалдық қабылдау/оқыту/қорғау; 10.12.2026'),('Нақты код дәлелі','30.10: profile persistence және lessons API; 39 API smoke тарихи нәтиже'),('Негізгі блокер','SEC-01 қауіпсіз submit, browser/peer review, restore және сертификат acceptance'),('1–5 апта','Сол аптаға даталанған дәлел жоқ; бұрынғы еңбекті жоққа шығармайды'),('Қаржы/еңбек','Бұрынғы 54 сағатты автомат қалған еңбек деп алуға болмайды; нақты timesheet керек'),('Күй белгісі','Ішінара/расталмаған/ағымдағы/жоспар; жоба дайындық пайызы емес')]
    for r,(key,value) in enumerate(facts,1):overview.write(r,0,key,wrap);overview.write(r,1,value,wrap);overview.set_row(r,42)
    workbook.close()
