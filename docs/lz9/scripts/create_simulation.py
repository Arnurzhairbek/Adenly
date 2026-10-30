#!/usr/bin/env python3
"""Create an explicitly synthetic, deterministic board ledger. Never changes GitHub issues."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
import csv, json

ROOT = Path(__file__).resolve().parents[1]
TZ = timezone(timedelta(hours=5))
PEOPLE = {
    'PM': 'Жайрбек Арнұр', 'BA': 'Байғұл Шыңғыс',
    'TL': 'Есеркенов Абдулазиз', 'QA': 'Әшімбай Қайсар',
}
# id, sprint, reference issue, title, owner, reviewer, start, review, review claimed, done
CARDS = [
 ('SIM-01','S1',3,'Қорғалған бетке кірудің acceptance сценарийі','TL','QA',0,1,3.5,4),
 ('SIM-02','S1',5,'Курс каталогының бос күйі мен қате хабарламасы','BA','PM',0,1.5,2.5,3),
 ('SIM-03','S1',6,'Курс пен сабақ маршрутының келісімшарты','QA','TL',0,2,3.5,4),
 ('SIM-04','S1',7,'Сабақ мазмұнының қауіпсіздік чек-листі','PM','BA',1,3,3.5,4),
 ('SIM-05','S1',3,'Қате сессия үшін пайдаланушы хабарламасы','TL','PM',2,4,4,4.5),
 ('SIM-06','S1',7,'Каталогтан сабаққа өту демосының хаттамасы','BA','QA',3,4.5,4.5,5),
 ('SIM-07','S2',9,'Өз прогресін сақтаудың acceptance мысалы','TL','QA',0,1.5,1.5,2),
 ('SIM-08','S2',9,'Бөтен пайдаланушы прогресіне рұқсатты тексеру','BA','TL',0,1.5,1.5,2),
 ('SIM-09','S2',8,'Жарамсыз жауаптың қате хабарламасы','QA','PM',0,2,2,2.5),
 ('SIM-10','S2',8,'Қайталанған submit теріс тестінің сипаттамасы','PM','BA',.5,2,2,2.5),
 ('SIM-11','S2',9,'Аяқталған сабақ белгісін қайта оқу мысалы','TL','QA',1,2.5,2.5,3),
 ('SIM-12','S2',10,'Бос хабарландыру тізімінің UI сценарийі','BA','PM',1.5,3,3,3.5),
 ('SIM-13','S2',9,'Прогресті сақтау демосының хаттамасы','QA','TL',2,3.5,3.5,4),
 ('SIM-14','S2',10,'Негізгі сценарийлердің runbook жаңартуы','PM','BA',2.5,4.5,4.5,5),
]

def at(sprint, t):
    start = datetime(2026,11,2 if sprint=='S1' else 9,9,tzinfo=TZ)
    if t == 5:
        return (start+timedelta(days=4,hours=8)).isoformat()
    days = int(t)
    return (start+timedelta(days=days,hours=(t-days)*8)).isoformat()

def main():
    data=ROOT/'data';data.mkdir(exist_ok=True)
    columns=['item_id','sprint','title','owner','reviewer','reference_issue','source',
             'estimated_person_hours','ready_at','started_at','review_at','review_started_at','done_at']
    events=[]
    with (data/'simulated_board_export.csv').open('w',newline='',encoding='utf-8-sig') as f:
        out=csv.DictWriter(f,fieldnames=columns);out.writeheader()
        for id,sp,issue,title,owner,reviewer,start,review,claimed,done in CARDS:
            row=dict(item_id=id,sprint=sp,title=title,owner=PEOPLE[owner],reviewer=PEOPLE[reviewer],
                     reference_issue=f'https://github.com/Arnurzhairbek/Adenly/issues/{issue}',
                     source='SIMULATION_NOT_GITHUB_EXPORT',estimated_person_hours=2,
                     ready_at=at(sp,0),started_at=at(sp,start),review_at=at(sp,review),
                     review_started_at=at(sp,claimed),done_at=at(sp,done))
            out.writerow(row)
            for when,event,old,new in [
                (datetime(2026,10,30,9,tzinfo=TZ).isoformat(),'transition','','Backlog'),
                (at(sp,0),'transition','Backlog','Ready'),
                (row['started_at'],'transition','Ready','In Progress'),
                (row['review_at'],'transition','In Progress','Review'),
                (row['review_started_at'],'review_started','Review','Review'),
                (row['done_at'],'transition','Review','Done')]:
                events.append(dict(item_id=id,sprint=sp,timestamp=when,event=event,
                                   from_status=old,to_status=new,actor=PEOPLE[reviewer] if event=='review_started' else PEOPLE[owner],source='SIMULATION'))
    events.sort(key=lambda e:(e['timestamp'],e['item_id'],0 if e['to_status']=='Backlog' else 1 if e['to_status']=='Ready' else 2 if e['to_status']=='In Progress' else 3 if e['event']=='transition' and e['to_status']=='Review' else 4 if e['event']=='review_started' else 5))
    with (data/'simulated_transition_log.csv').open('w',newline='',encoding='utf-8-sig') as f:
        out=csv.DictWriter(f,fieldnames=list(events[0]));out.writeheader();out.writerows(events)
    with (data/'real_transition_log_TEMPLATE.csv').open('w',newline='',encoding='utf-8-sig') as f:
        csv.writer(f).writerow(['item_id','sprint','timestamp','event','from_status','to_status','actor','source'])
    metadata=dict(source='SIMULATION',not_real_work=True,timezone='Asia/Qyzylorda',generated_on='2026-10-30',
                  sprint_windows={'S1':['2026-11-02','2026-11-06'],'S2':['2026-11-09','2026-11-13']},
                  business_day='Monday–Friday 09:00–17:00, no lunch deduction; 8 elapsed business hours = 1 flow day, NOT person effort',
                  task_size='2 person-hours per synthetic item, review/test/docs included; estimates, not measured effort',
                  real_issue_effect='Reference only: no issues closed or updated; no application functionality implemented.',
                  action='Review-first: an available eligible teammate claims the oldest unclaimed review before starting a new item.',
                  limitations=['Hand-constructed scenario, no causal proof or real team history','No blocked items or rework in fixture','No warm-up or carryover; Little identity holds by construction'])
    (data/'simulation_metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'SIMULATION: {len(CARDS)} cards, {len(events)} events written; no GitHub state changed.')

if __name__=='__main__':main()
