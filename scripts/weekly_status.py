import argparse
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://api.github.com'
REPO = os.getenv('GH_REPO', 'Arnurzhairbek/Adenly')
UTC = timezone.utc

def dt(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')) if s else None

def gh(path, params=None):
    headers = {'Accept': 'application/vnd.github+json'}
    if os.getenv('GH_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GH_TOKEN']
    url = BASE + '/repos/' + REPO + path
    params = dict(params or {}, per_page=100)
    result = []
    while url:
        r = requests.get(url, headers=headers, params=params, timeout=45)
        r.raise_for_status()
        data = r.json()
        if not isinstance(data, list):
            raise ValueError('Expected list: ' + path)
        result.extend(data)
        url = r.links.get('next', {}).get('url')
        params = None
    return result

def collect(start, end):
    issues = [i for i in gh('/issues', {'state':'all'}) if 'pull_request' not in i]
    labels = {l['name'].lower() for l in gh('/labels')}
    progress = labels & {'in progress','in-progress','status: in progress','wip','doing'}
    blocked = labels & {'blocked','status: blocked'}
    created, closed, opened, wip, blocks = [], [], [], [], []
    for i in issues:
        if dt(i['created_at']) >= end:
            continue
        n = i['number']
        events = sorted(gh(f'/issues/{n}/events'), key=lambda e:(e['created_at'], e.get('id',0)))
        state = i['state']
        ilabels = {l['name'].lower() for l in i['labels']}
        for e in reversed(events):
            if dt(e['created_at']) < end:
                break
            kind = e['event']
            if kind == 'closed': state = 'open'
            if kind == 'reopened': state = 'closed'
            if kind == 'labeled' and e.get('label'): ilabels.discard(e['label']['name'].lower())
            if kind == 'unlabeled' and e.get('label'): ilabels.add(e['label']['name'].lower())
        if start <= dt(i['created_at']) < end: created.append(n)
        if any(e['event']=='closed' and start <= dt(e['created_at']) < end for e in events) or (i.get('closed_at') and start <= dt(i['closed_at']) < end): closed.append(n)
        if state == 'open':
            opened.append(n)
            if ilabels & progress: wip.append(n)
            if ilabels & blocked: blocks.append(n)
    deployments = gh('/deployments')
    period_deployments = [d for d in deployments if start <= dt(d['created_at']) < end]
    successful = []
    for d in period_deployments:
        statuses = gh(f"/deployments/{d['id']}/statuses")
        if any(s['state']=='success' and dt(s['created_at']) < end for s in statuses): successful.append(d['id'])
    commits = gh('/commits', {'since':start.isoformat(),'until':end.isoformat()})
    commits = [c['sha'] for c in commits if start <= dt(c['commit']['committer']['date']) < end]
    metrics = {
        'created_issues':len(created), 'closed_issues':len(closed), 'open_at_end':len(opened),
        'in_progress_at_end':len(wip) if progress else None,
        'blocked_at_end':len(blocks) if blocked else None,
        'deployment_records':len(period_deployments), 'successful_deployments':len(successful),
        'default_branch_commits':len(commits),
    }
    evidence = {'created_issues':sorted(created),'closed_issues':sorted(closed),'open_at_end':sorted(opened),
                'in_progress_at_end':sorted(wip) if progress else None,'blocked_at_end':sorted(blocks) if blocked else None,
                'deployment_records':[d['id'] for d in period_deployments],'successful_deployments':successful,'default_branch_commits':commits}
    return {'repository':REPO,'start_utc':start.isoformat(),'end_exclusive_utc':end.isoformat(),
            'collected_at_utc':datetime.now(UTC).isoformat(),'metrics':metrics,'evidence':evidence,
            'label_mapping':{'in_progress':sorted(progress),'blocked':sorted(blocked)},
            'limitations':['Open state and labels reconstructed from current issue records and later issue events; deleted issues, renamed labels and external Projects statuses may be missing.', 'Closed issues are distinct issue IDs with a closure event during the period, even if reopened.', 'Deployments are GitHub deployment records created during the period; successful means a success status before the end; zero records does not exclude external deployment.', 'Commits are from current default branch history, by committer date; not a historical branch snapshot.', 'Dates are UTC; interval includes start and excludes end.']}

NAMES = {'created_issues':'Кезеңде ашылған тапсырмалар','closed_issues':'Кезеңде жабылған тапсырмалар (бірегей)','open_at_end':'Кезең соңында ашық тапсырмалар','in_progress_at_end':'Кезең соңында жұмыста (label бойынша)','blocked_at_end':'Кезең соңында блокталған (label бойынша)','deployment_records':'GitHub deployment жазбалары','successful_deployments':'Кезеңдегі сәтті deployment жазбалары','default_branch_commits':'Негізгі тармақ коммиттері'}

def generate(facts, version, provider):
    # Only a fixed allowlist of aggregate values is sent, never issue text or credentials.
    safe = {'period_start':facts['start_utc'],'period_end_exclusive':facts['end_exclusive_utc'], 'metrics':{NAMES[k]:facts['metrics'][k] for k in NAMES}, 'limitations':facts['limitations']}
    prompt = (ROOT / 'pm-assistant' / 'prompts' / f'{version}.txt').read_text(encoding='utf-8') + '\n' + json.dumps(safe,ensure_ascii=False,indent=2)
    if provider == 'ollama':
        model = os.getenv('OLLAMA_MODEL','qwen2.5:3b')
        r = requests.post('http://localhost:11434/api/generate',json={'model':model,'prompt':prompt,'stream':False,'options':{'temperature':0.2}},timeout=300)
        r.raise_for_status()
        return model,r.json()['response']
    model = os.environ.get('GEMINI_MODEL','').removeprefix('models/')
    if not model or not os.getenv('GEMINI_API_KEY'):
        raise ValueError('Set GEMINI_MODEL and GEMINI_API_KEY (see README).')
    r = requests.post(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',headers={'x-goog-api-key':os.environ['GEMINI_API_KEY']},json={'contents':[{'parts':[{'text':prompt}]}],'generationConfig':{'temperature':0.2}},timeout=120)
    r.raise_for_status()
    parts = r.json()['candidates'][0]['content']['parts']
    return model,'\n'.join(p['text'] for p in parts if 'text' in p and not p.get('thought'))

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--start'); p.add_argument('--end'); p.add_argument('--facts',type=Path)
    p.add_argument('--facts-only',action='store_true'); p.add_argument('--version',choices=['v1','v2'],default='v1')
    p.add_argument('--provider',choices=['gemini','ollama'],default=os.getenv('AI_PROVIDER','gemini'))
    args = p.parse_args(); t = time.perf_counter()
    if args.facts:
        facts = json.loads(args.facts.read_text(encoding='utf-8'))
    else:
        if bool(args.start) != bool(args.end): p.error('Provide both --start and --end')
        today = datetime.now(UTC).replace(hour=0,minute=0,second=0,microsecond=0)
        end = dt(args.end+'T00:00:00+00:00') if args.end else today-timedelta(days=(today.weekday()-4)%7)
        start = dt(args.start+'T00:00:00+00:00') if args.start else end-timedelta(days=7)
        if not start < end <= datetime.now(UTC): p.error('Invalid or future interval')
        facts = collect(start,end)
    out = ROOT/'pm-assistant'/'reports'/f"{facts['start_utc'][:10]}_{facts['end_exclusive_utc'][:10]}"
    out.mkdir(parents=True,exist_ok=True)
    (out/'facts.json').write_text(json.dumps(facts,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(facts['metrics'],ensure_ascii=False,indent=2)); print('FACTS:',out/'facts.json')
    if args.facts_only: return
    model, draft = generate(facts,args.version,args.provider)
    if not draft.strip(): raise ValueError('Empty model response')
    (out/f'raw_{args.version}.txt').write_text(draft,encoding='utf-8')
    rows = '\n'.join(f"| {NAMES[k]} | {v if v is not None else 'нет данных / деректер жоқ'} |" for k,v in facts['metrics'].items())
    report = f"# Adenly — апталық статус-есеп (ТЕКСЕРІЛМЕГЕН ЧЕРНОВИК)\n\nКезең UTC: {facts['start_utc']} – {facts['end_exclusive_utc']} (соңы кірмейді).\n\n## Python есептеген көрсеткіштер\n\n| Көрсеткіш | Мән |\n|---|---|\n{rows}\n\n## ИИ дайындаған мәтін\n\n{draft}\n\n## Шектеулер\n\n"+'\n'.join('- '+x for x in facts['limitations'])+f"\n\n## ИИ қолданылғанын ашық көрсету\n\nҚұрал: {args.provider} / {model}. ИИ тек мәтін дайындады, сандар Python арқылы есептелді. Фактілерді тексеруші: [аты-жөні, тексергеннен кейін]. Мәртебесі: тексерілмеген.\n"
    (out/f'report_{args.version}.md').write_text(report,encoding='utf-8')
    elapsed = round(time.perf_counter()-t,3)
    (out/f'timing_{args.version}.json').write_text(json.dumps({'elapsed_seconds':elapsed,'includes_collection':not bool(args.facts),'provider':args.provider,'model':model},indent=2),encoding='utf-8')
    print('REPORT:',out/f'report_{args.version}.md'); print('Elapsed seconds:',elapsed)

if __name__=='__main__':
    main()
