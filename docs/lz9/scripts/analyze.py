#!/usr/bin/env python3
"""Recompute flow metrics and CFD from a timestamped ledger, not from narrative claims."""
from pathlib import Path
from datetime import datetime, timedelta, time
from collections import defaultdict, Counter
import argparse, csv, hashlib, json, math

ROOT=Path(__file__).resolve().parents[1]
STATES=['Backlog','Ready','In Progress','Review','Done']
ACTIVE={'In Progress','Review'}

def read_csv(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))

def business_days(a,b):
    """Elapsed business time, clipped to weekday 09–17; explicit UTC offset required."""
    if b<a:raise ValueError('Timestamp order reversed')
    if a.utcoffset()!=b.utcoffset():raise ValueError('Mixed offsets unsupported; normalize to Asia/Qyzylorda first')
    total=0.;day=a.date()
    while day<=b.date():
        if day.weekday()<5:
            lo=datetime.combine(day,time(9),a.tzinfo);hi=datetime.combine(day,time(17),a.tzinfo)
            total+=max(0.,(min(b,hi)-max(a,lo)).total_seconds())/28800
        day+=timedelta(days=1)
    return total

def percentile(values,p):
    if not values:return None
    a=sorted(values);rank=(len(a)-1)*p;lo=math.floor(rank);hi=math.ceil(rank)
    return a[lo]+(a[hi]-a[lo])*(rank-lo)

def dump_csv(path,rows,fields=None):
    with Path(path).open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields or list(rows[0]));w.writeheader();w.writerows(rows)

def analyze(export_path,events_path,outdir,charts=True):
    outdir=Path(outdir);outdir.mkdir(parents=True,exist_ok=True)
    cards=read_csv(export_path);events=read_csv(events_path)
    if not cards or not events:raise ValueError('No cards/events; zero-data run is not validation')
    byid={c['item_id']:c for c in cards}
    if len(byid)!=len(cards):raise ValueError('Duplicate card IDs')
    grouped=defaultdict(list)
    for e in events:
        if e['item_id'] not in byid:raise ValueError('Unknown event item')
        if e['sprint']!=byid[e['item_id']]['sprint']:raise ValueError('Sprint mismatch')
        e=dict(e);e['dt']=datetime.fromisoformat(e['timestamp'])
        if e['dt'].utcoffset() is None:raise ValueError('Timezone required')
        grouped[e['item_id']].append(e)
    transitions={};claims={}
    for id,c in byid.items():
        history=grouped[id]
        if not history:raise ValueError('Missing item history')
        previous=None;state='';tr=[];claim=None
        for e in history:
            if previous is not None and e['dt']<previous:raise ValueError('Unsorted history')
            previous=e['dt']
            if e['event']=='review_started':
                if state!='Review' or e['actor']==c['owner'] or claim is not None:raise ValueError('Invalid second-person review')
                claim=e['dt'];continue
            if e['event']!='transition' or e['from_status']!=state or e['to_status'] not in STATES:raise ValueError('Missing/invalid transition')
            if state=='Done':raise ValueError('Reopened Done item: create follow-up ID or explicitly model reopening')
            state=e['to_status'];tr.append((e['dt'],state))
        if state!='Done':raise ValueError('This fixture adapter expects closed cohorts; real carryover requires explicit sprint windows')
        if claim is None:raise ValueError('Review claim timestamp missing')
        ts={st:t for t,st in tr}
        for col,st in [('ready_at','Ready'),('started_at','In Progress'),('review_at','Review'),('done_at','Done')]:
            if datetime.fromisoformat(c[col])!=ts[st]:raise ValueError('Export and event log disagree')
        if datetime.fromisoformat(c['review_started_at'])!=claim:raise ValueError('Review claim mismatch')
        transitions[id]=tr;claims[id]=claim
    def state_at(id,t):
        st=''
        for moment,s in transitions[id]:
            if moment<=t:st=s
        return st
    results={};taskrows=[];dailyrows=[];snaprows=[]
    windows={'S1':('2026-11-02T09:00:00+05:00','2026-11-06T17:00:00+05:00'),
             'S2':('2026-11-09T09:00:00+05:00','2026-11-13T17:00:00+05:00')}
    for sp,(startstr,endstr) in windows.items():
        begin,end=map(datetime.fromisoformat,[startstr,endstr]);duration=business_days(begin,end)
        ids=[id for id,c in byid.items() if c['sprint']==sp]
        cycles=[];review_durations=[];waits=[];status_total=Counter()
        done=[]
        for id in ids:
            c=byid[id];ts={s:t for t,s in transitions[id]};started=ts['In Progress'];finished=ts['Done']
            dwell=Counter()
            for j,(left,status) in enumerate(transitions[id]):
                right=transitions[id][j+1][0] if j+1<len(transitions[id]) else end
                a=max(left,begin);b=min(right,end)
                if a<b:dwell[status]+=business_days(a,b)
            status_total.update(dwell)
            if begin<=finished<=end:
                cycle=business_days(started,finished);cycles.append(cycle);done.append(id)
                review_durations.append(business_days(ts['Review'],finished));waits.append(business_days(ts['Review'],claims[id]))
                taskrows.append(dict(item_id=id,sprint=sp,title=c['title'],owner=c['owner'],reviewer=c['reviewer'],
                    cycle_days=cycle,ready_days=dwell['Ready'],in_progress_days=dwell['In Progress'],
                    review_days=dwell['Review'],review_wait_days=waits[-1],
                    review_processing_elapsed_days=business_days(claims[id],finished),source=c['source']))
        def integrate(lo,hi):
            cut=sorted({lo,hi}|{t for id in ids for t,_ in transitions[id] if lo<t<hi})
            area=Counter()
            for left,right in zip(cut,cut[1:]):
                counts=Counter(state_at(id,left) for id in ids);width=business_days(left,right)
                for status in STATES:area[status]+=counts[status]*width
            return area
        area=integrate(begin,end)
        for status in STATES:
            if abs(area[status]-status_total[status])>1e-8:raise AssertionError('Occupancy/dwell disagreement')
        daily=[]
        for day in range(5):
            lo=begin+timedelta(days=day);hi=lo+timedelta(hours=8);a=integrate(lo,hi)
            wip=a['In Progress']+a['Review'];daily.append(wip)
            dailyrows.append(dict(sprint=sp,date=lo.date().isoformat(),in_progress_mean=a['In Progress'],review_mean=a['Review'],
                                  wip_time_weighted=wip,ready_mean=a['Ready'],done_mean=a['Done'],source='SIMULATION'))
        peak_review=0;peak_person=0;rule_violations=0;peak_wait=0
        for t in sorted({begin,end}|{t for id in ids for t,_ in transitions[id] if begin<=t<=end}):
            counts=Counter(state_at(id,t) for id in ids)
            unclaimed=[id for id in ids if state_at(id,t)=='Review' and claims[id]>t]
            owners=Counter(byid[id]['owner'] for id in ids if state_at(id,t)=='In Progress')
            peak_review=max(peak_review,counts['Review']);peak_person=max(peak_person,max(owners.values(),default=0));peak_wait=max(peak_wait,len(unclaimed))
            snaprows.append(dict(sprint=sp,timestamp=t.isoformat(),business_day=business_days(begin,t),
                                  **{s.replace(' ','_'):counts[s] for s in STATES},unclaimed_review=len(unclaimed),source='SIMULATION'))
            for id in ids:
                ts={s:dt for dt,s in transitions[id]}
                if ts['In Progress']==t and any(byid[q]['owner']!=byid[id]['owner'] for q in unclaimed):rule_violations+=1
        completed=len(done);mean=sum(cycles)/completed if completed else None
        avgwip=(area['In Progress']+area['Review'])/duration
        throughput_day=completed/duration;rhs=throughput_day*mean if mean is not None else None
        # In this closed cohort: boundary work is zero, so the sample-path identity is exact.
        opening=sum(state_at(id,begin-timedelta(microseconds=1)) in ACTIVE for id in ids)
        closing=sum(state_at(id,end) in ACTIVE for id in ids)
        assert opening==closing==0
        assert abs(avgwip-rhs)<1e-8
        assert peak_review<=3 and peak_person<=2
        results[sp]=dict(source='SIMULATION',start=startstr,end=endstr,working_days=duration,throughput=completed,
                         throughput_per_day=throughput_day,mean_cycle_days=mean,p85_cycle_days=percentile(cycles,.85),
                         avg_wip=avgwip,avg_in_progress=area['In Progress']/duration,avg_review=area['Review']/duration,
                         mean_review_days=sum(review_durations)/completed,p85_review_days=percentile(review_durations,.85),
                         mean_review_wait_days=sum(waits)/completed,p85_review_wait_days=percentile(waits,.85),
                         mean_ready_days=status_total['Ready']/completed,mean_in_progress_days=status_total['In Progress']/completed,
                         mean_review_processing_elapsed_days=sum(review_durations)/completed-sum(waits)/completed,
                         little_rhs=rhs,little_residual=avgwip-rhs,opening_wip=opening,closing_wip=closing,
                         daily_wip=daily,peak_review=peak_review,peak_per_person_in_progress=peak_person,
                         peak_unclaimed_review=peak_wait,review_first_start_violations=rule_violations,
                         estimated_person_hours=sum(float(byid[id]['estimated_person_hours']) for id in ids))
    dump_csv(outdir/'task_metrics.csv',taskrows);dump_csv(outdir/'daily_wip.csv',dailyrows);dump_csv(outdir/'cfd_snapshots.csv',snaprows)
    comparison=[]
    for key in ['throughput','mean_cycle_days','p85_cycle_days','avg_wip','mean_review_days','mean_review_wait_days','peak_review','review_first_start_violations']:
        a,b=results['S1'][key],results['S2'][key]
        comparison.append(dict(metric=key,S1=a,S2=b,change_percent=(b-a)/a*100 if a else None))
    dump_csv(outdir/'sprint_comparison.csv',comparison)
    report=dict(source='SIMULATION_NOT_REAL_TRACKER_HISTORY',percentile_method='PERCENTILE.INC, linear interpolation at (n-1)*0.85',
                measurement='business days, Mon–Fri 09–17, +05:00; time-weighted occupancy, includes Review waiting; excludes Ready',
                input_sha256={str(Path(p).name):hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in [export_path,events_path]},
                sprints=results,comparison=comparison,
                limitations=['No live Projects board configured: API Forbidden','Closed synthetic cohorts only; no carryover/rework/blocked time',
                             'Sample-path Little identity is expected here; it does not prove realism or causal improvement',
                             'Real ledger with missing events must be corrected, not guessed; real windows must be explicitly configured'])
    (outdir/'metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if charts:make_charts(snaprows,taskrows,results,outdir.parent/'charts')
    return report

def make_charts(snapshots,tasks,results,directory):
    import os
    os.environ.setdefault('MPLCONFIGDIR','/tmp/adenly-matplotlib')
    os.environ.setdefault('XDG_CACHE_HOME','/tmp/adenly-cache')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams.update({'font.family':'DejaVu Sans','svg.fonttype':'none','font.size':10})
    directory.mkdir(exist_ok=True)
    fig,axes=plt.subplots(1,2,figsize=(13,4.8),sharey=True)
    for sp,ax in zip(['S1','S2'],axes):
        rows=[r for r in snapshots if r['sprint']==sp];x=[r['business_day'] for r in rows]
        order=['Done','Review','In_Progress','Ready','Backlog'];labels=['Done','Review','In Progress','Ready','Backlog']
        ax.stackplot(x,*[[r[st] for r in rows] for st in order],labels=labels,colors=['#2A9D8F','#E9A23B','#4285B4','#CAD7E5','#E5E7EB'],step='post')
        ax.set(title=f'{sp} — SIMULATION',xlabel='Жұмыс күні (09–17)',xlim=(0,5),ylim=(0,8));ax.grid(alpha=.18)
    axes[0].set_ylabel('Карточка саны');axes[1].legend(loc='upper left',bbox_to_anchor=(1.02,1))
    fig.suptitle('Adenly — кумулятивті ағын диаграммасы (CFD)\nОқу симуляциясы; GitHub тарихы емес',fontweight='bold');fig.tight_layout()
    for ext in ['svg','png']:fig.savefig(directory/f'cfd.{ext}',dpi=160,bbox_inches='tight')
    plt.close(fig)
    fig,axes=plt.subplots(1,2,figsize=(12,4.6))
    for sp,color in [('S1','#4285B4'),('S2','#2A9D8F')]:
        rows=[r for r in tasks if r['sprint']==sp];offset=-.18 if sp=='S1' else .18
        axes[0].bar([v+offset for v in range(3)],[results[sp]['mean_cycle_days'],results[sp]['mean_review_days'],results[sp]['mean_review_wait_days']],width=.34,label=sp,color=color)
    axes[0].set_xticks([0,1,2],['Cycle mean','Review mean','Review wait mean']);axes[0].set_ylabel('Жұмыс күні');axes[0].legend();axes[0].grid(axis='y',alpha=.2)
    for sp,marker in [('S1','o'),('S2','s')]:axes[1].plot(range(1,6),results[sp]['daily_wip'],marker=marker,label=sp)
    axes[1].set(xlabel='Спринттің жұмыс күні',ylabel='Уақытпен өлшенген орташа WIP',xticks=range(1,6));axes[1].legend();axes[1].grid(alpha=.2)
    fig.suptitle('Бір өзгерістің модельдік нәтижесі — нақты эксперимент емес',fontweight='bold');fig.tight_layout()
    for ext in ['svg','png']:fig.savefig(directory/f'comparison.{ext}',dpi=160,bbox_inches='tight')
    plt.close(fig)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--export',type=Path,default=ROOT/'data/simulated_board_export.csv')
    ap.add_argument('--events',type=Path,default=ROOT/'data/simulated_transition_log.csv')
    ap.add_argument('--output',type=Path,default=ROOT/'data')
    ap.add_argument('--no-charts',action='store_true')
    args=ap.parse_args();r=analyze(args.export,args.events,args.output,not args.no_charts)
    for sp,v in r['sprints'].items():print(sp,json.dumps(v,ensure_ascii=False))

if __name__=='__main__':main()
