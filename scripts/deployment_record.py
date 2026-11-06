#!/usr/bin/env python3
"""Record actual deployment lifecycle; called only around a real SSH deployment, never a CI build."""
import argparse,json,os,urllib.request

def call(path,data):
    token=os.environ['GH_TOKEN'];repo=os.environ['GITHUB_REPOSITORY']
    req=urllib.request.Request(f'https://api.github.com/repos/{repo}/{path}',data=json.dumps(data).encode(),headers={
        'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':'application/json','User-Agent':'Adenly-deploy'},method='POST')
    with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)

def main():
    p=argparse.ArgumentParser();p.add_argument('operation',choices=['create','status']);p.add_argument('--sha');p.add_argument('--kind',choices=['release','rollback'],default='release');p.add_argument('--id');p.add_argument('--state',choices=['in_progress','success','failure','error']);a=p.parse_args()
    if a.operation=='create':
        r=call('deployments',dict(ref=a.sha,auto_merge=False,required_contexts=[],environment='staging',production_environment=False,transient_environment=False,payload={'operation':a.kind}))
        print(r['id'])
    else:
        call(f'deployments/{int(a.id)}/statuses',dict(state=a.state,environment='staging',log_url=f'https://github.com/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'))

if __name__=='__main__':main()
