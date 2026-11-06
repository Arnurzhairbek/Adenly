from datetime import timedelta
import unittest
from dora import compute, stamp
from dora_dashboard import markdown, weekly_counts


class DashboardEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.start = stamp('2026-10-01T00:00:00Z')
        self.end = self.start + timedelta(days=28)

    def report(self, rows, complete=True):
        report = compute(rows, [], self.start, self.end, 'staging', deployments_complete=complete)
        report.update(collected_at=self.end.isoformat(), errors=[])
        return report

    def test_chart_uses_half_open_window_and_excludes_rollbacks(self):
        def row(ident, date, **kw):
            return dict(id=ident, environment='staging', successful_at=date, committed_at='2026-10-01T00:00:00Z', **kw)
        rows = [row(1, '2026-10-01T00:00:00Z'), row(2, '2026-10-08T00:00:00Z'),
                row(3, '2026-10-29T00:00:00Z'), row(4, '2026-10-10T00:00:00Z', operation='rollback')]
        self.assertEqual([count for _, count in weekly_counts(self.report(rows), rows)], [1, 1, 0, 0])

    def test_api_denial_is_not_rendered_as_zero_release_chart(self):
        report = self.report([], complete=False)
        self.assertIsNone(weekly_counts(report, []))
        self.assertIn('толық емес — жиілік те N/A', markdown(report, [], image=False))

    def test_missing_incident_evidence_remains_unavailable_in_summary(self):
        text = markdown(self.report([]), [], image=False)
        self.assertIn('| **0.00** | release / апта', text)
        self.assertEqual(text.count('| **N/A** |'), 3)
        self.assertIn('бекітілмеген', text)
        self.assertNotIn('![', text)
        self.assertNotIn('](metrics.json)', text)

    def test_in_progress_ci_is_not_displayed_as_failed_or_a_deployment(self):
        runs = [dict(id=1, name='CI', status='in_progress', conclusion=None,
                     created_at=self.start.isoformat(), html_url='https://github.com/example/run/1')]
        report = self.report([])
        text = markdown(report, runs, image=False)
        self.assertIn('| in_progress | N/A |', text)
        self.assertEqual(report['successful_deployments'], 0)
