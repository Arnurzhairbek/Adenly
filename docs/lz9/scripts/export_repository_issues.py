#!/usr/bin/env python3
"""Export real repository Issues; never label them as Project cards or infer transitions."""
from datetime import datetime,timezone
from pathlib import Path
import argparse,csv,hashlib,json,subprocess
from github_access import github_env

def fetch_issues():
    rows=[];page=1
    while True:
        result=subprocess.run(['gh','api',f'repos/Arnurzhairbek/Adenly/issues?state=all&per_page=100&page={page}'],check=True,capture_output=True,text=True,env=github_env(projects=False))
        batch=json.loads(result.stdout)
        if not isinstance(batch,list):raise ValueError('Issues API returned a non-list')
        for i in batch:
            if 'pull_request' in i:continue
            rows.append(dict(number=i['number'],title=i['title'],issue_state=i['state'],url=i['html_url'],
                             created_at=i['created_at'],updated_at=i['updated_at'],closed_at=i['closed_at'],
                             assignees=[a['login'] for a in i['assignees']],labels=[a['name'] for a in i['labels']],
                             source='GITHUB_REPOSITORY_ISSUES_SNAPSHOT'))
        if len(batch)<100:break
        page+=1
    if len({r['number'] for r in rows})!=len(rows):raise ValueError('Duplicate issue numbers across API pages')
    return sorted(rows,key=lambda r:r['number'])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data/live')
    args=parser.parse_args();rows=fetch_issues();out=args.output;out.mkdir(parents=True,exist_ok=True)
    fetched=datetime.now(timezone.utc).isoformat()
    (out/'repository_issues.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    fields=['number','title','issue_state','url','created_at','updated_at','closed_at','assignees','labels','source']
    with (out/'repository_issues.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
        for row in rows:writer.writerow({**row,'assignees':'; '.join(row['assignees']),'labels':'; '.join(row['labels'])})
    meta=dict(source='GITHUB_REPOSITORY_ISSUES_SNAPSHOT',fetched_at_utc=fetched,repository='Arnurzhairbek/Adenly',
              count=len(rows),open=sum(r['issue_state']=='open' for r in rows),closed=sum(r['issue_state']=='closed' for r in rows),
              excludes_pull_requests=True,complete_pagination=True,is_projects_export=False,transition_history_available=False,
              limitations=['Issue state is open/closed, NOT Projects Status','created_at is NOT In Progress entry','closed_at is NOT Projects Done','Do not compute sprint throughput/cycle time/WIP from this snapshot'],
              files_sha256={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [out/'repository_issues.csv',out/'repository_issues.json']})
    (out/'repository_snapshot_metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'issues':meta['count'],'open':meta['open'],'closed':meta['closed'],'is_projects_export':False}))

if __name__=='__main__':
    try:main()
    except subprocess.CalledProcessError as exc:raise SystemExit(exc.stderr)
