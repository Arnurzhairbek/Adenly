#!/usr/bin/env python3
"""Collect real GitHub deployments, head-commit lead time and a manually maintained incident ledger."""
from __future__ import annotations
import argparse,csv,json,os,statistics,urllib.request,urllib.error,urllib.parse
from datetime import datetime,timedelta,timezone
from pathlib import Path

UTC=timezone.utc
def stamp(value):
    result=datetime.fromisoformat(value.replace('Z','+00:00'))
    if result.utcoffset() is None:raise ValueError('Timestamp needs timezone: '+value)
    return result.astimezone(UTC)

class GitHub:
    def __init__(self,repo):
        if len(repo.split('/'))!=2 or any(not p or '..' in p for p in repo.split('/')):raise ValueError('Use owner/repository')
        self.repo=repo;self.errors=[]
        self.token=os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    def get(self,path):
        headers={'Accept':'application/vnd.github+json','User-Agent':'Adenly-DORA','X-GitHub-Api-Version':'2022-11-28'}
        if self.token:headers['Authorization']='Bearer '+self.token
        request=urllib.request.Request('https://api.github.com/repos/'+self.repo+'/'+path,headers=headers)
        with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)
    def pages(self,path,key=None):
        records=[];page=1
        while True:
            obj=self.get(path+('&' if '?' in path else '?')+f'per_page=100&page={page}')
            batch=obj[key] if key else obj
            if not isinstance(batch,list):raise ValueError('Unexpected paginated response')
            records.extend(batch)
            if len(batch)<100:return records
            page+=1

def read_csv(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))

def incidents_from(rows):
    ids=set();result=[]
    for row in rows:
        if not row['incident_id'] or row['incident_id'] in ids:raise ValueError('Missing/duplicate incident ID')
        ids.add(row['incident_id'])
        start=stamp(row['started_at']);end=stamp(row['restored_at']) if row['restored_at'] else None
        if end and end<start:raise ValueError('Recovery precedes incident')
        hours=float(row['repair_person_hours']) if row['repair_person_hours'] else None
        if hours is not None and hours<0:raise ValueError('Negative repair effort')
        if row['remediation'] not in ['hotfix','rollback']:raise ValueError('Use hotfix or rollback')
        result.append({**row,'start':start,'end':end,'hours':hours})
    return result

def metric(value,unit,n,reason=None):
    return dict(value=value,unit=unit,samples=n,reason=reason)

def compute(deployments,incidents,start,end,environment,deployments_complete=True,ledger_complete=False):
    if end<=start:raise ValueError('Empty/reversed observation window')
    days=(end-start).total_seconds()/86400
    # Each input row represents the FIRST success of one deployment ID; retries never multiply it.
    ids=[str(d['id']) for d in deployments]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate deployment IDs')
    selected=[d for d in deployments if d['environment']==environment and d.get('operation','release')!='rollback' and start<=stamp(d['successful_at'])<end]
    relevant=[i for i in incidents if i['environment']==environment and start<=i['start']<end]
    mature=[d for d in selected if stamp(d['successful_at'])+timedelta(hours=24)<=end]
    byid={str(d['id']):d for d in mature};failed=set()
    for i in incidents:
        d=byid.get(str(i['deployment_id']))
        if not d or i['environment']!=environment or i['start']>=end:continue
        deployed=stamp(d['successful_at'])
        if i['start']<deployed:raise ValueError('Incident starts before linked deployment')
        if i['remediation']=='rollback' or i['start']<=deployed+timedelta(hours=24):failed.add(str(d['id']))
    leads=[];missing=[]
    for d in selected:
        if not d.get('committed_at'):missing.append(d['id']);continue
        hours=(stamp(d['successful_at'])-stamp(d['committed_at'])).total_seconds()/3600
        if hours<0:raise ValueError('Commit timestamp is after deployment success')
        leads.append(hours)
    resolved=[i for i in relevant if i['end'] and i['end']<=end]
    recoveries=[(i['end']-i['start']).total_seconds()/3600 for i in resolved]
    complete_effort=ledger_complete and all(i['hours'] is not None for i in relevant)
    metrics={
      'deployment_frequency':metric(len(selected)/(days/7) if deployments_complete else None,'deployments/week',len(selected),None if deployments_complete else 'Deployments API incomplete/unavailable'),
      'lead_time':metric(statistics.median(leads) if leads and not missing and deployments_complete else None,'hours (median)',len(leads),'Head commit → first deployment success; unavailable when no deployment or missing commit evidence'),
      'change_failure_rate':metric(len(failed)/len(mature)*100 if mature and ledger_complete and deployments_complete else None,'percent',len(mature),'Only changes with a full 24h observation window; requires attested incident ledger'),
      'recovery_time':metric(statistics.median(recoveries) if recoveries else None,'hours (median)',len(resolved),'Only real resolved incidents; no incidents means N/A, not zero'),
    }
    # Local learning thresholds, NOT an assertion of official universal DORA maturity bands.
    for name,m in metrics.items():
        v=m['value']
        if v is None:m['level']='Бағаланбайды'
        elif name=='deployment_frequency':m['level']='Жоғары' if v>=5 else 'Орта' if v>=1 else 'Төмен'
        else:
            good,medium={'lead_time':(24,168),'change_failure_rate':(15,30),'recovery_time':(1,24)}[name]
            m['level']='Жоғары' if v<=good else 'Орта' if v<=medium else 'Төмен'
    return dict(environment=environment,window_start=start.isoformat(),window_end=end.isoformat(),window_days=days,
                metrics=metrics,successful_deployments=len(selected),mature_changes=len(mature),failed_changes=len(failed),
                resolved_incidents=len(resolved),open_incidents=sum(not i['end'] or i['end']>end for i in relevant),
                deployments_complete=deployments_complete,incident_ledger_attested=ledger_complete,
                repair_person_hours=sum(i['hours'] for i in relevant) if complete_effort else None,
                recorded_repair_person_hours=sum(i['hours'] or 0 for i in relevant),
                missing_commit_evidence=missing,lead_time_scope='deployed head commit; not every commit in a release',
                levels='Local educational thresholds; see docs/delivery/definitions.md')

def collect(api,environment):
    errors=[];deployments=[];raw=[];complete=True
    try:
        objects=api.pages('deployments?environment='+urllib.parse.quote(environment,safe=''))
        for d in objects:
            statuses=api.pages(f'deployments/{d["id"]}/statuses')
            successes=[s for s in statuses if s['state']=='success']
            raw.append({'deployment':{k:d.get(k) for k in ['id','sha','ref','environment','task','created_at']},'statuses':[{k:s.get(k) for k in ['state','created_at','updated_at','log_url']} for s in statuses]})
            if not successes:continue
            first=min(successes,key=lambda s:stamp(s['created_at']))
            row=dict(id=d['id'],sha=d['sha'],environment=d['environment'],successful_at=first['created_at'],
                     operation=(d.get('payload') or {}).get('operation','release') if isinstance(d.get('payload'),dict) else 'release',committed_at=None)
            try:row['committed_at']=api.get('commits/'+d['sha'])['commit']['committer']['date']
            except (urllib.error.HTTPError,urllib.error.URLError) as exc:errors.append({'operation':'commit lookup','deployment_id':d['id'],'error':str(exc)})
            deployments.append(row)
    except (urllib.error.HTTPError,urllib.error.URLError) as exc:
        complete=False;errors.append({'operation':'deployments/statuses read','error':str(exc)})
    runs=[]
    try:
        for r in api.pages('actions/runs',key='workflow_runs'):
            if r.get('head_branch')!='main':continue
            runs.append({k:r.get(k) for k in ['id','name','path','run_attempt','head_sha','head_branch','event','status','conclusion','created_at','run_started_at','updated_at','html_url']})
    except (urllib.error.HTTPError,urllib.error.URLError) as exc:errors.append({'operation':'Actions read','error':str(exc)})
    return deployments,raw,runs,complete,errors

def render(report,runs,output):
    os.environ.setdefault('MPLCONFIGDIR','/tmp/adenly-dora-mpl')
    os.environ.setdefault('XDG_CACHE_HOME','/tmp/adenly-dora-cache')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams['font.family']='DejaVu Sans'
    names=['deployment_frequency','lead_time','change_failure_rate','recovery_time']
    labels=['Орналастыру жиілігі','Коммиттен стендке дейін','Сәтсіз өзгерістер үлесі','Қалпына келтіру уақыты']
    fig,axes=plt.subplots(2,2,figsize=(12,6))
    for ax,key,label in zip(axes.flat,names,labels):
        m=report['metrics'][key];ax.axis('off')
        ax.text(.04,.83,label,fontsize=15,weight='bold',transform=ax.transAxes)
        ax.text(.04,.43,'N/A' if m['value'] is None else f'{m["value"]:.2f}',fontsize=30,color='#176B87',transform=ax.transAxes)
        ax.text(.04,.22,m['unit']+' | '+m['level'],fontsize=10,transform=ax.transAxes)
        ax.text(.04,.06,f'Бақылау саны: {m["samples"]}',fontsize=10,transform=ax.transAxes)
    fig.suptitle('Adenly — нақты GitHub деректері | '+report['environment'],fontsize=17,weight='bold')
    fig.text(.03,.01,'N/A = дерек жеткіліксіз. Жасыл CI deployment ретінде саналмайды. Шкала — жергілікті оқу шектері.',fontsize=9)
    fig.tight_layout(rect=(0,.035,1,.94));fig.savefig(output/'dora_dashboard.png',dpi=160);plt.close(fig)
    md='# Adenly — DORA дашборды\n\n'+f'Жиналған уақыт: {report["collected_at"]}. Орта: **{report["environment"]}**.\n\n'
    md+=f'Терезе: {report["window_start"]} → {report["window_end"]}.\n\n'
    md+='![DORA](dora_dashboard.png)\n\n| Метрика | Мән | Бірлік | Оқу шкаласындағы деңгей | Бақылау саны |\n|---|---:|---|---|---:|\n'
    for key,label in zip(names,labels):
        m=report['metrics'][key];val='N/A' if m['value'] is None else f'{m["value"]:.3f}'
        md+=f'| {label} | {val} | {m["unit"]} | {m["level"]} | {m["samples"]} |\n'
    md+=f'\nDeployments API толық: **{report["deployments_complete"]}**. Инцидент журналы бекітілген: **{report["incident_ledger_attested"]}**.\n\n'
    md+='Lead time — әр deployment-тің head commit-інен алғашқы success-ке дейін. CFR тек ≥24 сағат бақылауы толық өзгерістер үшін; журнал белгісіз болса N/A. Recovery — нақты инциденттерден ғана; оқу жаттығуы қосылмайды.\n\n'
    md+='Журналдағы белгілі түзету еңбегі: '+str(report['recorded_repair_person_hours'])+' адам-сағат. Толық шығын: '+('N/A — журнал толықтығы расталмаған' if report['repair_person_hours'] is None else str(report['repair_person_hours']))+'.\n\n'
    md+='## CI тарихы (DORA deployment емес)\n\n| Прогон | Нәтиже | Толық elapsed, секунд |\n|---|---|---:|\n'
    for run in sorted(runs,key=lambda r:r['created_at'],reverse=True)[:10]:
        elapsed=(stamp(run['updated_at'])-stamp(run['run_started_at'])).total_seconds() if run.get('run_started_at') and run.get('status')=='completed' else None
        md+=f'| [{run["id"]}]({run["html_url"]}) | {run["conclusion"]} | {elapsed if elapsed is not None else "N/A"} |\n'
    if report['errors']:md+='\n## Дерек шектеулері\n\n'+'\n'.join('- '+e['operation']+': '+e['error'] for e in report['errors'])+'\n'
    (output/'README.md').write_text(md,encoding='utf-8')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',default=os.environ.get('GITHUB_REPOSITORY','Arnurzhairbek/Adenly'))
    parser.add_argument('--environment',default='staging')
    parser.add_argument('--end',default=datetime.now(UTC).isoformat());parser.add_argument('--start')
    parser.add_argument('--output',type=Path,default=Path('docs/delivery/report'))
    parser.add_argument('--incidents',type=Path,default=Path('docs/delivery/incidents.csv'))
    parser.add_argument('--coverage',type=Path,default=Path('docs/delivery/incident_observation.csv'))
    args=parser.parse_args();end=stamp(args.end);start=stamp(args.start) if args.start else end-timedelta(days=28)
    incidents=incidents_from(read_csv(args.incidents))
    attested=any(r['environment']==args.environment and r['reviewer'] and stamp(r['from'])<=start and stamp(r['to'])>=end for r in read_csv(args.coverage))
    deps,raw,runs,complete,errors=collect(GitHub(args.repo),args.environment)
    report=compute(deps,incidents,start,end,args.environment,complete,attested)
    report.update(collected_at=datetime.now(UTC).isoformat(),repository=args.repo,errors=errors)
    args.output.mkdir(parents=True,exist_ok=True)
    for name,obj in [('metrics.json',report),('deployments.raw.json',raw),('deployments.normalized.json',deps),('ci_runs.json',runs)]:
        (args.output/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    render(report,runs,args.output)
    print(json.dumps({'deployments_complete':complete,'successful_deployments':report['successful_deployments'],'errors':errors},ensure_ascii=False))

if __name__=='__main__':main()
