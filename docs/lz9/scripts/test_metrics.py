#!/usr/bin/env python3
"""Checks business-clock semantics, golden fixture results, and detection of broken history."""
from datetime import datetime
from pathlib import Path
import csv, tempfile, unittest
from analyze import ROOT, analyze, business_days, percentile, read_csv, dump_csv

class FlowTests(unittest.TestCase):
    def test_weekend_excluded(self):
        self.assertEqual(business_days(datetime.fromisoformat('2026-11-06T16:00:00+05:00'),datetime.fromisoformat('2026-11-09T10:00:00+05:00')),.25)

    def test_percentile_inclusive(self):
        self.assertEqual(percentile([2,2,2,2,2,2,2.5,2.5],.85),2.475)

    def run_fixture(self,cards=None,events=None):
        with tempfile.TemporaryDirectory() as td:
            td=Path(td);cp=ROOT/'data/simulated_board_export.csv';ep=ROOT/'data/simulated_transition_log.csv'
            if cards is not None:cp=td/'items.csv';dump_csv(cp,cards)
            if events is not None:ep=td/'events.csv';dump_csv(ep,events)
            return analyze(cp,ep,td/'result',False)

    def test_golden_metrics_and_little(self):
        r=self.run_fixture()['sprints']
        for sp,count,mean,p85,wip in [('S1',6,37/12,4,3.7),('S2',8,17/8,2.475,3.4)]:
            self.assertEqual(r[sp]['throughput'],count)
            self.assertAlmostEqual(r[sp]['mean_cycle_days'],mean)
            self.assertAlmostEqual(r[sp]['p85_cycle_days'],p85)
            self.assertAlmostEqual(r[sp]['avg_wip'],wip)
            self.assertAlmostEqual(r[sp]['little_residual'],0)
        self.assertEqual(r['S2']['review_first_start_violations'],0)
        self.assertEqual(r['S1']['review_first_start_violations'],3)

    def test_missing_transition_is_rejected(self):
        rows=read_csv(ROOT/'data/simulated_transition_log.csv')
        rows=[r for r in rows if not(r['item_id']=='SIM-01' and r['to_status']=='In Progress')]
        with self.assertRaises(ValueError):self.run_fixture(events=rows)

    def test_export_disagreement_is_rejected(self):
        rows=read_csv(ROOT/'data/simulated_board_export.csv');rows[0]['done_at']='2026-11-06T17:00:00+05:00'
        with self.assertRaises(ValueError):self.run_fixture(cards=rows)

    def test_self_review_is_rejected(self):
        cards=read_csv(ROOT/'data/simulated_board_export.csv');events=read_csv(ROOT/'data/simulated_transition_log.csv')
        for e in events:
            if e['item_id']==cards[0]['item_id'] and e['event']=='review_started':e['actor']=cards[0]['owner']
        with self.assertRaises(ValueError):self.run_fixture(events=events)

    def test_duplicate_card_is_rejected(self):
        rows=read_csv(ROOT/'data/simulated_board_export.csv');rows.append(rows[0])
        with self.assertRaises(ValueError):self.run_fixture(cards=rows)

if __name__=='__main__':unittest.main(verbosity=2)
