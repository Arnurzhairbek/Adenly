#!/usr/bin/env python3
"""Offline checks for complete Issues pagination and separate credential routing."""
import json,subprocess,unittest
from unittest.mock import patch
from github_access import github_env
from export_repository_issues import fetch_issues

def issue(n,pr=False):
    obj={'number':n,'title':f'Issue {n}','state':'open','html_url':f'https://github.com/Arnurzhairbek/Adenly/issues/{n}',
         'created_at':'2026-10-30T00:00:00Z','updated_at':'2026-10-30T00:00:00Z','closed_at':None,'assignees':[],'labels':[]}
    if pr:obj['pull_request']={}
    return obj

def response(page):return subprocess.CompletedProcess([],0,stdout=json.dumps(page),stderr='')

class ExportTests(unittest.TestCase):
    def test_projects_credential_does_not_replace_repository_credential(self):
        with patch.dict('os.environ',{'GH_TOKEN':'test-repository-binding','GH_PROJECTS_TOKEN':'test-projects-binding'},clear=True):
            self.assertEqual(github_env()['GH_TOKEN'],'test-projects-binding')
            self.assertEqual(github_env(projects=False)['GH_TOKEN'],'test-repository-binding')

    def test_pagination_complete_and_pull_request_excluded(self):
        first=[issue(n,pr=n==42) for n in range(1,101)];second=[issue(101),issue(102)]
        with patch('export_repository_issues.subprocess.run',side_effect=[response(first),response(second)]) as run:
            rows=fetch_issues()
        self.assertEqual(len(rows),101)
        self.assertEqual(rows[-1]['number'],102)
        self.assertNotIn(42,[r['number'] for r in rows])
        self.assertEqual(run.call_count,2)
        self.assertIn('page=2',run.call_args_list[1].args[0][2])

    def test_duplicate_pages_are_rejected(self):
        with patch('export_repository_issues.subprocess.run',side_effect=[response([issue(n) for n in range(1,101)]),response([issue(100)])]):
            with self.assertRaises(ValueError):fetch_issues()

if __name__=='__main__':unittest.main(verbosity=2)
