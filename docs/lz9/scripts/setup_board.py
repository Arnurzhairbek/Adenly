#!/usr/bin/env python3
"""Prepare a GitHub Project; defaults to a read-only local plan. Needs live Projects permissions."""
from pathlib import Path
import argparse, json, subprocess
from github_access import github_env

ROOT=Path(__file__).resolve().parents[1]
OWNER='Arnurzhairbek'
OPTIONS=[
 {'name':'Backlog','color':'GRAY','description':'User value/source recorded. Exit: DoR checked and priority agreed.'},
 {'name':'Ready','color':'BLUE','description':'DoR complete, owner/reviewer/sprint known. Exit: WIP slot and review-first checked.'},
 {'name':'In Progress','color':'YELLOW','description':'Actually started; record timestamp. WIP <=2/person, <=8 team. Exit: artifact and self-test ready.'},
 {'name':'Review','color':'PURPLE','description':'Other reviewer; record queue/claim timestamps. WIP <=3 team. Exit: DoD fully verified.'},
 {'name':'Done','color':'GREEN','description':'Tests, second-person review, demo/staging, docs and QA evidence complete. Follow-up defects get new IDs.'},
]
FIELDS={'Sprint':('SINGLE_SELECT','S1,S2'),'StartedAt':('DATE',None),'DoneAt':('DATE',None),'BlockedReason':('TEXT',None),'Source':('TEXT',None)}

def gh(*args):
    return subprocess.run(['gh',*args],check=True,capture_output=True,text=True,env=github_env()).stdout

def gql(query,**variables):
    args=['api','graphql','-f','query='+query]
    for key,value in variables.items():args+=['-F',key+'='+str(value)]
    obj=json.loads(gh(*args))
    if obj.get('errors'):raise RuntimeError(json.dumps(obj['errors'],ensure_ascii=False))
    return obj['data']

def main():
    ap=argparse.ArgumentParser(description=__doc__);group=ap.add_mutually_exclusive_group()
    group.add_argument('--project',type=int);group.add_argument('--create',action='store_true');args=ap.parse_args()
    if not args.project and not args.create:
        print(json.dumps({'mode':'PLAN_ONLY','owner':OWNER,'status':OPTIONS,'fields':FIELDS,
                          'wip':{'In Progress per person':2,'Review team':3},'note':'No network request or board mutation executed'},ensure_ascii=False,indent=2));return
    try:
        number=args.project
        if args.create:
            created=json.loads(gh('project','create','--owner',OWNER,'--title','Adenly — ЛЗ 9: екі спринт','--format','json'));number=created['number']
            print('Created project:',created.get('url',number))
        query='''query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id url readme items(first:1){totalCount} fields(first:100){pageInfo{hasNextPage}nodes{... on ProjectV2Field{id name} ... on ProjectV2SingleSelectField{id name options{id name color description}} ... on ProjectV2IterationField{id name}}}}}}'''
        project=gql(query,owner=OWNER,number=number)['user']['projectV2']
        if not project:raise RuntimeError('Project inaccessible; nothing else changed')
        if project['fields']['pageInfo']['hasNextPage']:raise RuntimeError('Field list incomplete; no replacement performed')
        fields={f['name']:f for f in project['fields']['nodes']};status=fields.get('Status')
        if not status or 'options' not in status:raise RuntimeError('Status single-select not found; inspect existing project manually')
        # Preserve existing options and item assignments; status migration is an explicit UI step.
        names={o['name'] for o in status['options']};wanted={o['name'] for o in OPTIONS}
        if names!=wanted:
            if project['items']['totalCount']==0:
                payload={'query':'mutation($input:UpdateProjectV2FieldInput!){updateProjectV2Field(input:$input){projectV2Field{... on ProjectV2SingleSelectField{id name}}}}',
                         'variables':{'input':{'fieldId':status['id'],'singleSelectOptions':OPTIONS}}}
                result=subprocess.run(['gh','api','graphql','--input','-'],input=json.dumps(payload),check=True,capture_output=True,text=True,env=github_env())
                if json.loads(result.stdout).get('errors'):raise RuntimeError(result.stdout)
            else:
                raise RuntimeError('Nonempty project: Status migration requires UI mapping to preserve existing assignments; no statuses replaced.')
        for name,(kind,opts) in FIELDS.items():
            if name in fields:
                if name=='Sprint' and not {'S1','S2'}.issubset({x['name'] for x in fields[name].get('options',[])}):
                    print('UI action required: existing Sprint field needs S1/S2 mapping; existing field preserved.')
                continue
            command=['project','field-create',str(number),'--owner',OWNER,'--name',name,'--data-type',kind]
            if opts:command+=['--single-select-options',opts]
            gh(*command)
        policy=(ROOT/'01_Board_policies.md').read_text()
        begin='<!-- ADENLY_LZ9_POLICY_START -->';end='<!-- ADENLY_LZ9_POLICY_END -->'
        readme=project.get('readme') or ''
        if (begin in readme)!=(end in readme):raise RuntimeError('Incomplete existing policy markers; inspect project readme before editing')
        block=begin+'\n'+policy+'\n'+end
        if begin in readme:
            lo=readme.index(begin);hi=readme.index(end,lo)+len(end);readme=readme[:lo]+block+readme[hi:]
        else:readme=readme.rstrip()+'\n\n'+block
        gh('project','edit',str(number),'--owner',OWNER,'--readme',readme)
        gh('project','link',str(number),'--owner',OWNER,'--repo',OWNER+'/Adenly')
        print('Configured fields/readme/repository link:',project['url'])
        print('In GitHub UI: Board view → Group by Status; add policies to column descriptions and Sprint filter. WIP is monitored, not hard-enforced.')
    except (subprocess.CalledProcessError,RuntimeError) as exc:
        print(getattr(exc,'stderr',None) or str(exc));raise SystemExit(1)

if __name__=='__main__':main()
