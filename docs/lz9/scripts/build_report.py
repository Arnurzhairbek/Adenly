#!/usr/bin/env python3
"""Build the Kazakh report and spreadsheet from analyze.py outputs."""
from pathlib import Path
from datetime import datetime
import csv, hashlib, json, math, re, zipfile
import xlsxwriter
from analyze import ROOT, read_csv, business_days

def write_docs(metrics):
    r=metrics['sprints'];a,b=r['S1'],r['S2']
    (ROOT/'02_Sprint_plans.md').write_text('''# Екі спринттің жоспарлары — оқу симуляциясы

Күні: 30.10.2026. Шартты кезеңдер болашақта берілген; екі апта нақты жұмыс өтті деген есеп емес. Функциялар жасалды, deploy өтті немесе issue жабылды деп саналмайды. SIM-ID-лер GitHub issue-ларының ішкі қабылдау жұмыстарына арналған модельдік task-тер; түпнұсқа story acceptance толығымен жабылмайды.

## S1 — 02–06.11.2026

**Бір сөйлемдік мақсат:** «Студент жабық демода жүйеге кіріп, каталогтан өз курсының сабағын ашып, жарамсыз сессияда түсінікті хабарлама көреді».

**Демонстрация критерийі:** synthetic студентпен жаңа браузер сессиясында кіру → каталог → бір сабақ; дұрыс мазмұн, қате/бос күйі және рұқсатсыз кірудің теріс мысалы көрсетіледі. Бұл — жоспарланған қабылдау сценарийі, нақты осы тапсырмада орындалған браузер тесті емес.

Көлем: SIM-01–SIM-06, source issues #3, #5, #6, #7. Бөлінген жалпы бағасы 6×2=12 адам-сағат; оған орындау/review/test/docs кіреді. 4×6=24 сағат апталық команда қолжетімділігімен салыстырғанда 12 сағат талдау/демо/тәуекелге бос қалады. Бұл — нақты timesheet емес. PM — Арнұр; талаптар — Шыңғыс; техникалық бөлік — Абдулазиз; QA — Қайсар.

Жоспарлау checklist: DoR, scope, synthetic дерек, task owner және екінші reviewer, WIP бос орны, демо дәлелі. Әр task-тің аты, source issue-ы және timestamps [CSV-де](data/simulated_board_export.csv). Бір автор өзінің review-ін қабылдамайды.

## S2 — 09–13.11.2026

**Бір сөйлемдік мақсат:** «Студент аяқтаған сабағының прогресін сақтап, қайта ашқанда сол нәтижені көріп, басқа адамның деректеріне қол жеткізе алмайды».

**Демонстрация критерийі:** synthetic студенттің бір сабақ прогресін сақтау → қайта оқу → өз нәтижесін көру; басқа user ID, жарамсыз/қайталанған submit теріс мысалдары; бос notifications күйі. Нақты бағалау/submit тұтастығының барлық SEC-01 критерийлері осы модельмен орындалды деп саналмайды.

Көлем: SIM-07–SIM-14, source issues #8, #9, #10. Бағасы 8×2=16 адам-сағат; 24 сағат апталық қолжетімділіктен 8 сағат басқа рәсім/тәуекелге қалады. Айырмашылық — шағын карточка саны; effort орындалғаны дәлелденген жоқ.

**Жалғыз өзгеріс:** ретроспективадағы R1 Review-first. WIP, DoR/DoD, жұмыс күнінің сағаты және метриканың шекарасы өзгермейді. Осыдан басқа жаңа процесс әрекеті қабылданбайды.

## Өлшемнің шекарасы

Екі спринтте 5 жұмыс күні, өлшеу терезесі 09:00–17:00, Asia/Qyzylorda (+05:00). Бір flow day = 8 жұмыс-терезелік сағат. Түн/демалыс есептелмейді, түскі үзіліс бөлек шегерілмейді. Бұл 8 сағат әр студент күнде 8 сағат жұмыс істейді дегенді білдірмейді: elapsed flow time және 6 сағат/апта person effort бөлек ұғымдар.

Айлық SLO терезесі ЛЗ 8-де 12 сағат/күн еді; мұнда команда flow time-ы 8 сағат/күн. Олар басқа метрикалар, бір-біріне алмастырылмайды. Симуляцияда blocked/rework/carryover жоқ; олардың болмауы нақты жобада жоқ екенін дәлелдемейді.
''',encoding='utf-8')
    lines=['# Екі спринт метрикалары — SIMULATION','',
           '**Нақты GitHub тарихы емес.** Қолмен құрастырылған 14 карточка/84 оқиға сценарийі. Есеп нақты осы CSV файлдарынан қайта есептелді; орындалған өнім жұмысы немесе GitHub Projects export деп көрсетілмейді.','',
           'Бастапқы дерек: [карточка кестесі](data/simulated_board_export.csv), [timestamp журналы](data/simulated_transition_log.csv), [дерек сипаттамасы](data/simulation_metadata.json). Дайын нәтижелер: [task metrics](data/task_metrics.csv), [daily WIP](data/daily_wip.csv), [CFD snapshots](data/cfd_snapshots.csv), [JSON](data/metrics.json).','',
           '## 1. Бірдей әдіспен салыстыру','',
           '| Метрика | S1 | S2 | Өзгеріс |','|---|---:|---:|---:|']
    for key,label in [('throughput','Throughput, Done/спринт'),('throughput_per_day','Throughput / жұмыс күні'),('mean_cycle_days','Орташа cycle time, күн'),('p85_cycle_days','p85 cycle, күн'),('avg_wip','Орташа WIP, карточка'),('mean_in_progress_days','Бір task In Progress, орташа күн'),('mean_review_days','Бір task Review, орташа күн'),('mean_review_wait_days','Review кезегінде күту, орташа күн'),('mean_review_processing_elapsed_days','Нақты review басталғаннан Done-ға, орташа күн'),('mean_ready_days','Ready-де күту, орташа күн'),('peak_review','Review peak, карточка'),('review_first_start_violations','Иесіз review барда жаңа start саны')]:
        va,vb=a[key],b[key];change=f'{(vb-va)/va*100:+.2f}%' if va else 'N/A'
        lines.append(f'| {label} | {va:.4f} | {vb:.4f} | {change} |')
    lines+=['','## 2. Әр тапсырманың циклі және мәртебе уақыты','',
            '| ID | Спринт | Ready | In Progress | Review | Соның ішінде queue wait | Cycle |',
            '|---|---|---:|---:|---:|---:|---:|']
    for row in read_csv(ROOT/'data/task_metrics.csv'):
        lines.append('| '+row['item_id']+' | '+row['sprint']+' | '+' | '.join(f'{float(row[k]):.3f}' for k in ['ready_days','in_progress_days','review_days','review_wait_days','cycle_days'])+' |')
    lines+=['','Барлық мәндер жұмыс күнінде. Cycle In Progress-ке алғашқы кіруден Done-ға дейін, Review күтумен бірге. Ready cycle-ға кірмейді; Backlog спринт басталғанға дейін қалады, Done терминал күйінің duration-ы циклге кірмейді. Review waiting — Review ұзақтығының ішкі бөлігі, оны Review-ге қайта қосып есептемейміз.','',
            'p85 — PERCENTILE.INC/инклюзивті сызықтық интерполяция: сұрыпталған массивтегі индекс (n−1)×0,85. S2 нақты массиві **[2; 2; 2; 2; 2; 2; 2.5; 2.5]**; индекс 5,95, нәтиже 2,475. n=6 және n=8 шағын үлгі, процентиль тұрақты болжам емес.','',
            '## 3. Орташа WIP және Литтл заңы','',
            '| Жұмыс күні | S1 WIP (уақытпен өлшенген) | S2 WIP (уақытпен өлшенген) |','|---|---:|---:|']
    for d,(x,y) in enumerate(zip(a['daily_wip'],b['daily_wip']),1):lines.append(f'| {d} | {x:.2f} | {y:.2f} |')
    lines+=['',
            'WIP = In Progress + Review; blocked болса өзі тұрған күйде саналады. Әр күн үшін оқиғалар арасындағы occupancy×ұзақтық интегралданады; содан кейін 5 күннің орташа мәні алынады. Тек кешкі snapshot-тардың орташа санын алсақ күн ішінде тез аяқталған жұмыс жоғалып кетеді.','',
            f'S1: WIP={a["avg_wip"]:.4f}; λ=6/5=1,2; mean cycle=18,5/6=3,083333; λ×CT=3,7000. Айырма 0. S2: WIP={b["avg_wip"]:.4f}; λ=8/5=1,6; mean cycle=17/8=2,125; λ×CT=3,4000. Сандық floating айырма шамамен 4,44×10⁻¹⁶, практикалық 0.','',
            'Бұл жерде басталған және аяқталған cohort бірдей, ашылу/жабылу WIP=0, сондықтан sample-path теңдігі дәл шығады. Бұл «шынайы команда стационар ағынға жетті» деген дәлел емес. Нақты қысқа спринтте carryover, rework, толық емес тапсырмалар, өлшем терезесі және percentile/орташа cohort сәйкессіздігі Литтл жуықтауын өзгертеді. Сәйкеспеу тек жоғалған датаны білдірмейді; алдымен уақыт бірлігі, шекара және cohort тексеріледі.','',
            '## 4. CFD бойынша тар орын','',
            '![Екі спринт CFD — оқу симуляциясы](charts/cfd.png)','',
            'S1-де Review жолағы 0-ден 3 карточкаға дейін өсіп, шамамен 2–4 flow day аралығында қалың қалады. Иесіз review peak=3, орташа Review occupancy=1,7; бір task review queue wait=0,9167 күн. Тар орын — reviewer-дің міндетті түрде баяулығы емес, дайын жұмысты review-ге уақтылы алмау. S2-де Review peak=2, occupancy=0,8, иесіз review=0.','',
            '![Review wait және daily WIP салыстыруы](charts/comparison.png)','',
            'S1/S2 диаграммалары әр спринттің жергілікті 0–5 күн осімен жеке салынды: task саны 6 және 8, спринт reset-ін бір 10 күндік CFD-дегі «жұмыс жоғалуы» ретінде көрсетпейміз. Полосаның ұзындығы емес, тік қалыңдығы белгілі күйдегі карточка санын береді. График source-ы cfd_snapshots.csv, SVG нұсқасы charts/ ішінде.','',
            '## 5. Ненің өзгергені және дәлелдің шегі','',
            'Жалғыз R1 әрекеті Review кезегін pull тәртібімен өңдейді. Review processing elapsed екі спринтте де 0,5 күн; күту 0,9167 → 0. Сондықтан Review ұзақтығының қысқаруы кезектің жойылуынан. Cycle қысқаруының шамамен 95,65%-ы осы queue айырмасына, 4,35%-ы модельдегі In Progress айырмасына келеді. «Адамдар тезірек код жаза бастады» деген қорытынды жоқ.','',
            'Throughput 6→8 (+33,33%), cycle mean −31,08%, p85 −38,125%, WIP −8,11%. Ағын көлемі артқанда In Progress орташа occupancy 2,0→2,6 өсуі мүмкін; бұл өздігінен нашарлау емес, әр адамға 2 лимиті сақталған. Review peak 3→2, бір адамға In Progress peak 1→2: екі жағдайда да WIP саясаты бұзылмаған.','',
            '**Шектеу:** бұл деректер әдейі құрастырылған, мақұлданған оқу симуляциясы; тек бір процесс ережесі өзгертілгенімен task құрамы/күндері де модельдік. Сондықтан causal effect дәлелденбейді. Нақты командаға көшіру үшін екі апта timestamp журналын, review/CI/staging/DoD дәлелін жинап қайта салыстыру қажет.']
    (ROOT/'03_Metrics_report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    (ROOT/'06_Defense.md').write_text('''# Қорғау: 4–5 минуттық дайын құрылым

**Барлық баяндауда «оқу симуляциясы» деген мәртебе сақталады.**

1. **Арнұр, 45 с:** «Adenly үшін екі апталық ағын моделін жасадық. S1 пайдаланушы мақсаты — кіру және сабаққа жету; S2 — өз прогресін сақтап қайта көру. Нақты issue-ларды жапқан жоқпыз. Тақтаның әр бағанына entry/exit, DoR/DoD және WIP саясаты жазылды.»
2. **Шыңғыс, 45 с:** «DoR scope/критерий/owner/reviewer-ді талап етеді. DoD: тест, екінші адам review-і, жабық стенд демосы және құжат. In Progress әр адамға 2, Review командаға 3. Blocked WIP-тен жоғалмайды.»
3. **Қайсар, 90 с:** «CSV-де 14 карточка, event журналында 84 оқиға бар. S1 throughput 6, mean cycle 3,0833, p85 4; S2 8, 2,125 және 2,475. WIP уақытпен өлшенді: 3,7 және 3,4. Литтл: 1,2×3,0833=3,7; 1,6×2,125=3,4. Бұл жабық cohort болғандықтан дәл теңдік күтіледі.»
4. **Абдулазиз, 60 с:** «CFD-де S1 Review жолағы үш карточкаға жетеді. Ретроспективаның жалғыз R1 әрекеті — алдымен иесіз review алу. Review-дің өзін тексеру 0,5 күн болып қалды, кезек 0,9167 күннен нөлге түсті. Үдеме reviewer жылдамдығынан емес, күту азаюынан шыққан.»
5. **Арнұр, 30 с:** «Симуляцияның нәтижесін нақты команданың екі аптадағы жетістігі деп атамаймыз. API Forbidden болғандықтан live Projects бапталған жоқ; дайын саясат, орнату скрипті және нақты даталар журналы берілді.»

## Сұрақтарға қысқа жауап

| Сұрақ | Жауап |
|---|---|
| Неге p85 бар? | Орташа мән ұзақ tail-ды жасырады; p85 inclusive интерполяциямен бірдей есептелді. Үлгі аз болғандықтан болжам емес. |
| Неге WIP тек Doing емес? | Cycle Doing-нан Done-ға дейін; оның ішінде Review де бар, сондықтан шекара бірдей. |
| Неге Литтл дәл сәйкес? | Carryover=0 және барлық басталған task осы терезеде аяқталған; integral occupancy = цикл қосындысы. |
| Екі өзгеріс жасадыңыз ба? | Жоқ, тек Review-first. Басқа WIP/DoR/DoD сақталған; бақылау метрикалары жаңа әрекет емес. |
| CFD тар орны қайда? | S1 Review қалыңдығы/күтуі өседі; оның queue және processing уақыттары бөлек көрсетілген. |
| Нақты GitHub export қайда? | Бұл модельде жоқ: source=SIMULATION. API Forbidden. Симуляция CSV-сі нақты tracker export деп аталмайды. |
| Throughput бәрі жақсы деген сөз бе? | Жоқ; DoD сақталуы, task өлшемі/құрамы және пайдаланушы демосы бөлек тексеріледі. |

## Алты критерийлік тапсыру тізімі

- [x] Бағандар саясаты, WIP, DoR/DoD файлда дайын.
- [x] Екі пайдаланушылық спринт мақсаты және модельдік карточкалар бар.
- [x] CSV/event журналынан throughput, әр task cycle, mean, p85, daily WIP және status time есептелді.
- [x] CFD, шекарасы анық Литтл есебі және S1/S2 салыстыруы бар.
- [x] Симуляциялық ретроспективада иесі/мерзімі/метрикасы бар бір R1 әрекеті көрсетілген.
- [ ] Live GitHub Projects конфигурациясы және нақты екі апта tracker export/DoD дәлелі осы ортада орындалмады; симуляция сол фактілерді алмастырмайды.
''',encoding='utf-8')

def spreadsheet(metrics):
    rows=read_csv(ROOT/'data/task_metrics.csv');items=read_csv(ROOT/'data/simulated_board_export.csv');events=read_csv(ROOT/'data/simulated_transition_log.csv');daily=read_csv(ROOT/'data/daily_wip.csv')
    itemmap={r['item_id']:r for r in items};bysp=metrics['sprints']
    w=xlsxwriter.Workbook(ROOT/'Adenly_LZ9_Metrics.xlsx');w.set_calc_mode('auto')
    head=w.add_format({'bold':True,'bg_color':'#173650','font_color':'white','text_wrap':True,'border':1})
    number=w.add_format({'num_format':'0.0000','border':1});date=w.add_format({'num_format':'yyyy-mm-dd hh:mm','border':1});text=w.add_format({'text_wrap':True,'border':1});pct=w.add_format({'num_format':'0.00%','border':1})
    note=w.add_format({'bg_color':'#FFF2CC','text_wrap':True});title=w.add_format({'bold':True,'font_size':16,'font_color':'#173650'})
    for name,data in [('Items',items),('Events',events),('DailyWIP',daily)]:
        s=w.add_worksheet(name);s.freeze_panes(1,1);s.hide_gridlines(2);s.set_column(0,len(data[0])-1,23);s.set_row(0,36)
        for c,k in enumerate(data[0]):s.write(0,c,k,head)
        for r,row in enumerate(data,1):
            for c,(key,value) in enumerate(row.items()):
                if name=='DailyWIP' and key not in ['sprint','date','source']:s.write_number(r,c,float(value),number)
                else:s.write(r,c,value,text)
        s.autofilter(0,0,len(data),len(data[0])-1)
    win=w.add_worksheet('Windows');win.set_column('A:E',27)
    for c,h in enumerate(['sprint','start (+05:00)','end (+05:00)','working_days','source']):win.write(0,c,h,head)
    for r,sp in enumerate(['S1','S2'],1):
        a=bysp[sp];win.write(r,0,sp);win.write_datetime(r,1,datetime.fromisoformat(a['start']).replace(tzinfo=None),date);win.write_datetime(r,2,datetime.fromisoformat(a['end']).replace(tzinfo=None),date);win.write_number(r,3,5,number);win.write(r,4,'SIMULATION')
    s=w.add_worksheet('TaskMetrics');s.freeze_panes(1,1);s.hide_gridlines(2);s.set_column('A:A',15);s.set_column('B:E',23);s.set_column('F:J',19);s.set_column('K:K',12);s.set_column('L:M',26);s.set_column('N:N',23);s.set_column('O:Q',19);s.set_column('R:R',35)
    headers=['ID','Started +05:00','Review +05:00','Review claimed','Done +05:00','Cycle days','In Progress days','Review days','Queue wait days','Ready days','Sprint','Owner','Reviewer','Ready +05:00','Estimated person h','Status','Review process days','Source']
    for c,h in enumerate(headers):s.write(0,c,h,head)
    s.set_row(0,40)
    def elapsed(a,b):return f'NETWORKDAYS({a},{b})-1+(MOD({b},1)-MOD({a},1))*3'
    caches={}
    for rr,row in enumerate(rows,2):
        card=itemmap[row['item_id']];s.write(rr-1,0,row['item_id'],text)
        for col,key in [(1,'started_at'),(2,'review_at'),(3,'review_started_at'),(4,'done_at'),(13,'ready_at')]:s.write_datetime(rr-1,col,datetime.fromisoformat(card[key]).replace(tzinfo=None),date)
        for col,left,right,key in [('F','B','E','cycle_days'),('G','B','C','in_progress_days'),('H','C','E','review_days'),('I','C','D','review_wait_days'),('J','N','B','ready_days')]:
            value=float(row[key]);s.write_formula(f'{col}{rr}','='+elapsed(f'{left}{rr}',f'{right}{rr}'),number,value);caches[f'TaskMetrics!{col}{rr}']=value
        for col,value in [(10,row['sprint']),(11,row['owner']),(12,row['reviewer']),(15,'Done'),(17,'SIMULATION')]:s.write(rr-1,col,value,text)
        s.write_number(rr-1,14,float(card['estimated_person_hours']),number)
        proc=float(row['review_processing_elapsed_days']);s.write_formula(f'Q{rr}',f'=H{rr}-I{rr}',number,proc);caches[f'TaskMetrics!Q{rr}']=proc
    s.autofilter(0,0,len(rows),17)
    summ=w.add_worksheet('Summary');summ.set_column('A:A',48);summ.set_column('B:D',20);summ.set_column('E:E',67);summ.freeze_panes(3,1);summ.hide_gridlines(2)
    summ.merge_range('A1:E1','Adenly — ЛЗ 9 | SIMULATION',title);summ.merge_range('A2:E2','Нақты GitHub тарихы емес. 09–17 жұмыс уақыты; WIP integral Python арқылы CSV оқиғаларынан алынды.',note);summ.set_row(1,34)
    for c,h in enumerate(['Метрика','S1','S2','Өзгеріс','Түсіндіру']):summ.write(2,c,h,head)
    metricsrows={4:('Throughput','throughput'),5:('Mean cycle, күн','mean_cycle_days'),6:('p85 cycle, күн','p85_cycle_days'),7:('Mean WIP','avg_wip'),8:('Mean Review, күн','mean_review_days'),9:('Mean Review queue wait, күн','mean_review_wait_days'),10:('Mean In Progress, күн','mean_in_progress_days'),11:('Mean review processing, күн','mean_review_processing_elapsed_days'),12:('Throughput / күн','throughput_per_day'),13:('Little RHS','little_rhs'),14:('Little residual','little_residual'),15:('Mean Ready wait, күн','mean_ready_days')}
    end=len(rows)+1
    for rr,(label,key) in metricsrows.items():
        summ.write(rr-1,0,label,text)
        for col,sp,wrow in [('B','S1',2),('C','S2',3)]:
            if rr==4:expr=f'=COUNTIFS(TaskMetrics!$K$2:$K${end},"{sp}",TaskMetrics!$P$2:$P${end},"Done",TaskMetrics!$E$2:$E${end},">="&Windows!B{wrow},TaskMetrics!$E$2:$E${end},"<="&Windows!C{wrow})'
            elif rr==6:
                inds=[idx+2 for idx,x in enumerate(rows) if x['sprint']==sp];expr=f'=PERCENTILE(TaskMetrics!F{min(inds)}:F{max(inds)},0.85)'
            elif rr==7:expr=f'=AVERAGEIF(DailyWIP!A2:A11,"{sp}",DailyWIP!E2:E11)'
            elif rr==12:expr=f'={col}4/Windows!D{wrow}'
            elif rr==13:expr=f'={col}12*{col}5'
            elif rr==14:expr=f'={col}7-{col}13'
            else:
                valuecol={5:'F',8:'H',9:'I',10:'G',11:'Q',15:'J'}[rr];expr=f'=AVERAGEIF(TaskMetrics!$K$2:$K${end},"{sp}",TaskMetrics!${valuecol}$2:${valuecol}${end})'
            val=bysp[sp][key];summ.write_formula(f'{col}{rr}',expr,number,val);caches[f'Summary!{col}{rr}']=val
        change=(bysp['S2'][key]-bysp['S1'][key])/bysp['S1'][key] if abs(bysp['S1'][key])>1e-10 else 'N/A'
        summ.write_formula(f'D{rr}',f'=IF(ABS(B{rr})>0.0000000001,(C{rr}-B{rr})/B{rr},"N/A")',pct,change);caches[f'Summary!D{rr}']=change
    summ.merge_range('A17:E18','p85 = inclusive linear interpolation. WIP = In Progress + Review. Ready күтуі cycle-дан тыс. Екі жабық cohort: opening/closing WIP 0, сондықтан Little дәл сәйкес.',note)
    summ.set_landscape();summ.fit_to_pages(1,1);summ.print_area('A1:E18')
    info=w.add_worksheet('ReadMe');info.set_column('A:A',110)
    info.write('A1','SIMULATION — бастапқы CSV-лер GitHub-та қоса берілген',title)
    for rr,line in enumerate(['Inputs: Items және Events парақтары — модельдік ledger көшірмесі.','TaskMetrics NETWORKDAYS/MOD формулалары 09–17 weekday шекарасы үшін; мереке тізімі қолданылмаған.','Summary формулалары бірдей терезедегі Done санағын, mean және p85-ті береді.','DailyWIP — event occupancy интегралы; кешкі snapshot орташа мәні емес.','CSV жаңартылса analyze.py және build_report.py қайта іске қосылады; бұрынғы кэштелген мәнмен тоқтамаңыз.','Calc-та Ctrl+Shift+F9. Нақты tracker history және live Projects конфигурациясы жоқ.','Runtime: Python 3.12; matplotlib 3.x; xlsxwriter 3.x; reportlab 4.x; python-docx 1.x.'],3):info.write(rr,0,line,note);info.set_row(rr,32)
    w.close()
    from openpyxl import load_workbook
    cached=load_workbook(ROOT/'Adenly_LZ9_Metrics.xlsx',data_only=True);formulas=load_workbook(ROOT/'Adenly_LZ9_Metrics.xlsx',data_only=False)
    for address,expected in caches.items():
        sn,cell=address.split('!');value=cached[sn][cell].value
        if isinstance(expected,(int,float)):assert abs(value-expected)<1e-9,address
        else:assert value==expected,address
        assert formulas[sn][cell].data_type=='f',address
    # Independently validate each spreadsheet business-time formula with datetime arithmetic.
    for r in range(2,len(rows)+2):
        for output,left,right in [('F','B','E'),('G','B','C'),('H','C','E'),('I','C','D'),('J','N','B')]:
            a=cached['TaskMetrics'][left+str(r)].value;b=cached['TaskMetrics'][right+str(r)].value
            formula_result=sum((a.date()+__import__('datetime').timedelta(days=i)).weekday()<5 for i in range((b.date()-a.date()).days+1))-1+((b.hour*60+b.minute)-(a.hour*60+a.minute))/480
            assert abs(formula_result-cached['TaskMetrics'][output+str(r)].value)<1e-9
    return len(caches)

def report_documents():
    from docx import Document
    from docx.shared import Cm,Pt
    from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,Image
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from xml.sax.saxutils import escape
    font='/usr/share/fonts/truetype/dejavu/'
    pdfmetrics.registerFont(TTFont('KK',font+'DejaVuSans.ttf'));pdfmetrics.registerFont(TTFont('KK-B',font+'DejaVuSans-Bold.ttf'))
    styles={
     'p':ParagraphStyle('p',fontName='KK',fontSize=9,leading=12.5,spaceAfter=7,wordWrap='CJK'),
     'h':ParagraphStyle('h',fontName='KK-B',fontSize=16,leading=20,spaceAfter=12,keepWithNext=True,textColor=colors.HexColor('#173650')),
     'h2':ParagraphStyle('h2',fontName='KK-B',fontSize=11.5,leading=15,spaceBefore=9,spaceAfter=7,keepWithNext=True),
     'cell':ParagraphStyle('cell',fontName='KK',fontSize=7.2,leading=9.5,wordWrap='CJK')}
    doc=Document();section=doc.sections[0];section.page_width=Cm(21);section.page_height=Cm(29.7)
    for side in ['left_margin','right_margin','top_margin','bottom_margin']:setattr(section,side,Cm(1.7))
    doc.styles['Normal'].font.name='DejaVu Sans';doc.styles['Normal'].font.size=Pt(9)
    doc.add_heading('Adenly — ЛЗ 9',0);doc.add_heading('Екі спринт симуляциясы',1)
    names=['Жайрбек Арнұр — Project Manager','Байғұл Шыңғыс — Business / System Analyst','Есеркенов Абдулазиз — Technical Lead / Developer','Әшімбай Қайсар — Data / QA Analyst']
    for line in ['30.10.2026 · Қазақша · Оқу симуляциясы',*names,'Оқытушы: Некесова А.А.','Нақты екі апталық жұмыс/жиналыс есебі немесе live GitHub Projects export емес.']:doc.add_paragraph(line)
    flow=[Spacer(1,70),Paragraph('Adenly — ЛЗ 9',styles['h']),Paragraph('Екі спринт симуляциясы',styles['h']),Spacer(1,20)]
    for line in ['30.10.2026 · Қазақша · SIMULATION',*names,'Оқытушы: Некесова А.А.','Деректер — модельдік; live Projects API қолжетімсіз.']:flow.append(Paragraph(escape(line),styles['p']))
    def clean(s):return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1 (\2)',s).replace('**','').replace('`','')
    for filename in ['01_Board_policies.md','02_Sprint_plans.md','03_Metrics_report.md','04_Retrospective.md','05_GitHub_Projects.md','06_Defense.md']:
        flow.append(PageBreak());doc.add_page_break();lines=(ROOT/filename).read_text().splitlines();i=0;code=False
        while i<len(lines):
            line=lines[i].strip();i+=1
            if not line:continue
            if line.startswith('```'):code=not code;continue
            if line.startswith('!['):
                path=ROOT/re.search(r'\(([^)]+)\)',line)[1]
                doc.add_picture(str(path),width=Cm(17.2))
                from PIL import Image as PILImage
                with PILImage.open(path) as im:width,height=im.size
                flow.append(Image(str(path),width=499,height=499*height/width));continue
            if line.startswith('|'):
                tablelines=[line]
                while i<len(lines) and lines[i].strip().startswith('|'):tablelines.append(lines[i].strip());i+=1
                rows=[]
                for ll in tablelines:
                    cells=[c.strip() for c in ll.strip('|').split('|')]
                    if not all(re.fullmatch(r'[-: ]+',c) for c in cells):rows.append(cells)
                n=max(map(len,rows));t=doc.add_table(rows=0,cols=n);t.style='Light Shading Accent 1'
                for row in rows:
                    cells=t.add_row().cells
                    for c,value in enumerate(row):
                        cells[c].text=clean(value)
                        for para in cells[c].paragraphs:
                            for run in para.runs:run.font.size=Pt(7)
                weights=[max(6,min(22,math.sqrt(max(len(row[c]) for row in rows))*1.6)) for c in range(n)]
                tt=Table([[Paragraph(escape(clean(c)),styles['cell']) for c in row] for row in rows],colWidths=[499*x/sum(weights) for x in weights],repeatRows=1)
                tt.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#D9E8F3')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F2F6F8')]),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#C9D6DF')),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
                flow+=[tt,Spacer(1,8)];continue
            if line.startswith('#'):
                level=len(line)-len(line.lstrip('#'));doc.add_heading(clean(line[level:].strip()),min(3,level));flow.append(Paragraph(escape(clean(line[level:].strip())),styles['h' if level==1 else 'h2']))
            else:doc.add_paragraph(clean(line));flow.append(Paragraph(escape(clean(line)),styles['p']))
    doc.save(ROOT/'Adenly_LZ9_Esep.docx')
    def page(c,d):
        c.setFont('KK',7);c.drawString(48,817,'ADENLY | ЛЗ 9 | ОҚУ СИМУЛЯЦИЯСЫ | 30.10.2026');c.drawRightString(547,26,str(d.page))
    SimpleDocTemplate(str(ROOT/'Adenly_LZ9_Esep.pdf'),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=46,bottomMargin=42,title='Adenly ЛЗ 9 — оқу симуляциясы').build(flow,onFirstPage=page,onLaterPages=page)

def main():
    metrics=json.loads((ROOT/'data/metrics.json').read_text());write_docs(metrics);count=spreadsheet(metrics);report_documents()
    validation={'source':'SIMULATION','date':'2026-10-30','formula_count':count,'formula_caches':'verified','per_card_business_time_formula':'independently checked','real_project_configured':False,'reason':'GitHub GraphQL/REST Forbidden'}
    (ROOT/'data/validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    manifest={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.rglob('*')) if p.is_file() and '__pycache__' not in p.parts and p.name not in ['manifest.json','Adenly_LZ9_Paket.zip']}
    (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    with zipfile.ZipFile(ROOT/'Adenly_LZ9_Paket.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(ROOT.rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts and p.name!='Adenly_LZ9_Paket.zip':z.write(p,'Adenly-LZ9/'+str(p.relative_to(ROOT)))
    print(json.dumps(validation,ensure_ascii=False))

if __name__=='__main__':main()
