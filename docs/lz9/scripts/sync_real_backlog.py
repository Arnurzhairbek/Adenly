#!/usr/bin/env python3
"""Add existing OPEN Adenly issues to a real project, without closing/relabeling issues or moving existing items."""
import argparse,json,subprocess

PRIORITY=[12,13,14,4,6,3,8,9,5,7,10]
def gh(*args):
    result=subprocess.run(['gh',*args],check=True,capture_output=True,text=True)
    return json.loads(result.stdout)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--project',type=int);p.add_argument('--apply',action='store_true');a=p.parse_args()
    if not a.apply:
        print(json.dumps({'mode':'PLAN_ONLY','issue_priority':PRIORITY,'simulation_items':False,'new_items_status':'Backlog','existing_items':'unchanged'},indent=2));return
    if not a.project:p.error('--apply requires --project NUMBER')
    owner='Arnurzhairbek';repo=owner+'/Adenly'
    snapshot=gh('project','item-list',str(a.project),'--owner',owner,'--limit','10000','--format','json')
    if snapshot.get('totalCount')!=len(snapshot['items']):raise SystemExit('Incomplete project listing; refusing mutation')
    existing={i.get('content',{}).get('url') for i in snapshot['items']}
    pages=gh('api',f'repos/{repo}/issues?state=all&per_page=100','--paginate','--slurp')
    issues={i['number']:i for page in pages for i in page if 'pull_request' not in i}
    project=gh('project','view',str(a.project),'--owner',owner,'--format','json')
    fields=gh('project','field-list',str(a.project),'--owner',owner,'--limit','100','--format','json')
    if fields.get('totalCount')!=len(fields['fields']):raise SystemExit('Incomplete field list')
    status=next((f for f in fields['fields'] if f['name']=='Status'),None)
    option=next((o for o in (status or {}).get('options',[]) if o['name']=='Backlog'),None)
    if not option:raise SystemExit('Configure Status Backlog before syncing; no issues added')
    for number in PRIORITY:
        issue=issues.get(number)
        if not issue or issue['state']!='open':print(f'SKIP #{number}: missing or not open');continue
        if issue['html_url'] in existing:print(f'KEEP #{number}: existing card untouched');continue
        item=gh('project','item-add',str(a.project),'--owner',owner,'--url',issue['html_url'],'--format','json')
        gh('project','item-edit','--id',item['id'],'--project-id',project['id'],'--field-id',status['id'],'--single-select-option-id',option['id'],'--format','json')
        print(f'ADDED #{number} Backlog: {issue["title"]}')
    print('Project:',project['url'])

if __name__=='__main__':
    try:main()
    except subprocess.CalledProcessError as exc:raise SystemExit(exc.stderr)
