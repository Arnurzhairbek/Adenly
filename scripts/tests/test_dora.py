import sys,unittest,urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from dora import compute,incidents_from,stamp,collect

class DoraTests(unittest.TestCase):
    def setUp(self):
        self.start=stamp('2026-10-01T00:00:00Z');self.end=stamp('2026-10-29T00:00:00Z')
        self.deps=[dict(id=1,sha='a',environment='staging',successful_at='2026-10-02T02:00:00Z',committed_at='2026-10-02T00:00:00Z'),
                   dict(id=2,sha='b',environment='staging',successful_at='2026-10-10T04:00:00Z',committed_at='2026-10-10T00:00:00Z')]
    def calc(self,deps=None,incidents=None,**kwargs):
        return compute(self.deps if deps is None else deps,incidents or [],self.start,self.end,'staging',**kwargs)
    def test_own_history_arithmetic(self):
        incidents=incidents_from([dict(incident_id='T1',environment='staging',deployment_id='1',started_at='2026-10-02T03:00:00Z',restored_at='2026-10-02T04:30:00Z',repair_person_hours='2.5',remediation='hotfix')])
        r=self.calc(incidents=incidents,ledger_complete=True)
        self.assertEqual(r['metrics']['deployment_frequency']['value'],.5)
        self.assertEqual(r['metrics']['lead_time']['value'],3)
        self.assertEqual(r['metrics']['change_failure_rate']['value'],50)
        self.assertEqual(r['metrics']['recovery_time']['value'],1.5)
        self.assertEqual(r['repair_person_hours'],2.5)
    def test_empty_is_not_fabricated_perfection(self):
        r=self.calc(deps=[])
        self.assertEqual(r['metrics']['deployment_frequency']['value'],0)
        for key in ['lead_time','change_failure_rate','recovery_time']:self.assertIsNone(r['metrics'][key]['value'])
        self.assertIsNone(r['repair_person_hours'])
    def test_forbidden_is_not_zero(self):
        r=self.calc(deps=[],deployments_complete=False)
        self.assertIsNone(r['metrics']['deployment_frequency']['value'])
    def test_unattested_ledger_is_not_zero_cfr(self):
        self.assertIsNone(self.calc()['metrics']['change_failure_rate']['value'])
        self.assertEqual(self.calc(ledger_complete=True)['metrics']['change_failure_rate']['value'],0)
    def test_recent_deployment_censored_for_cfr(self):
        d=dict(self.deps[0],successful_at='2026-10-28T23:00:00Z')
        r=self.calc([d],ledger_complete=True)
        self.assertEqual(r['mature_changes'],0);self.assertIsNone(r['metrics']['change_failure_rate']['value'])
    def test_rollback_not_counted_as_new_release(self):
        r=self.calc([dict(self.deps[0],operation='rollback')])
        self.assertEqual(r['successful_deployments'],0)
    def test_negative_time_and_duplicate_ids_rejected(self):
        with self.assertRaises(ValueError):self.calc([self.deps[0],self.deps[0]])
        with self.assertRaises(ValueError):self.calc([dict(self.deps[0],committed_at='2026-10-03T00:00:00Z')])
    def test_invalid_incident_rejected(self):
        with self.assertRaises(ValueError):incidents_from([dict(incident_id='T1',started_at='2026-10-02T00:00:00Z',restored_at='2026-10-01T00:00:00Z',repair_person_hours='1',remediation='hotfix')])
    def test_open_incident_not_in_recovery_median(self):
        rows=incidents_from([dict(incident_id='T1',environment='staging',deployment_id='1',started_at='2026-10-02T03:00:00Z',restored_at='',repair_person_hours='',remediation='rollback')])
        r=self.calc(incidents=rows);self.assertEqual(r['open_incidents'],1);self.assertIsNone(r['metrics']['recovery_time']['value'])
    def test_collector_deduplicates_success_status_retries(self):
        class Fake:
            def pages(self,path,key=None):
                if path.startswith('deployments?'):return [dict(id=1,sha='a',environment='staging',payload={},task='deploy')]
                if path.endswith('/statuses'):return [dict(state='success',created_at='2026-10-02T03:00:00Z'),dict(state='success',created_at='2026-10-02T02:00:00Z')]
                return []
            def get(self,path):return {'commit':{'committer':{'date':'2026-10-02T00:00:00Z'}}}
        deps,raw,runs,complete,errors=collect(Fake(),'staging')
        self.assertTrue(complete);self.assertEqual(len(deps),1);self.assertEqual(deps[0]['successful_at'],'2026-10-02T02:00:00Z')
    def test_api_denial_preserved_as_incomplete(self):
        class Denied:
            def pages(self,*args,**kwargs):raise urllib.error.HTTPError('https://api.github.com',403,'Forbidden',{},None)
        deps,raw,runs,complete,errors=collect(Denied(),'staging')
        self.assertFalse(complete);self.assertTrue(errors);self.assertEqual(deps,[])

if __name__=='__main__':unittest.main(verbosity=2)
