#!/usr/bin/env python3
"""Export a current snapshot; explicitly does not invent Project status-transition history."""
import argparse, csv, json, subprocess
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--project',required=True,type=int);p.add_argument('--output',required=True,type=Path);a=p.parse_args()
    try:
        raw=subprocess.run(['gh','project','item-list',str(a.project),'--owner','Arnurzhairbek','--limit','10000','--format','json'],check=True,capture_output=True,text=True).stdout
    except subprocess.CalledProcessError as exc:
        raise SystemExit(exc.stderr)
    obj=json.loads(raw);items=obj['items']
    if 'totalCount' not in obj or obj['totalCount']!=len(items):raise SystemExit('Incomplete export: totalCount mismatch; do not use truncated data')
    a.output.parent.mkdir(parents=True,exist_ok=True)
    with a.output.open('w',newline='',encoding='utf-8-sig') as f:
        fields=['item_id','title','status','sprint','url','started_at','done_at','source']
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
        for item in items:
            content=item.get('content') or {}
            normalized={str(k).replace(' ','').casefold():v for k,v in item.items()}
            w.writerow(dict(item_id=item['id'],title=item.get('title') or content.get('title',''),status=normalized.get('status',''),sprint=normalized.get('sprint',''),
                            url=content.get('url',''),started_at=normalized.get('startedat',''),done_at=normalized.get('doneat',''),source='GITHUB_CURRENT_SNAPSHOT_NOT_TRANSITION_HISTORY'))
    a.output.with_suffix('.json').write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Exported {len(items)} current items. Add separately recorded transition timestamps before calculating cycle/status durations.')

if __name__=='__main__':main()
