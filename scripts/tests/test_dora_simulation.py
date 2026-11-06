import unittest
from dora_dashboard import markdown, weekly_counts
from dora_simulation import build_report


class SimulationTests(unittest.TestCase):
    def test_all_four_metrics_are_reproducible_from_fixtures(self):
        report, deployments = build_report()
        metrics = report['metrics']
        self.assertEqual(metrics['deployment_frequency']['value'], 3)
        self.assertEqual(metrics['lead_time']['value'], 4)
        self.assertAlmostEqual(metrics['change_failure_rate']['value'], 100 * 2 / 12)
        self.assertEqual(metrics['recovery_time']['value'], .5)
        self.assertEqual(report['repair_person_hours'], 3.5)
        self.assertEqual(report['successful_deployments'], 12)
        self.assertEqual(report['mature_changes'], 12)
        self.assertEqual(report['failed_changes'], 2)
        self.assertEqual(len(deployments), 13)  # The extra row is a rollback, not a feature release.
        self.assertEqual([count for _, count in weekly_counts(report, deployments)], [2, 3, 3, 4])

    def test_simulation_never_claims_actual_api_or_measurement_provenance(self):
        report, _ = build_report()
        self.assertEqual(report['data_mode'], 'simulation')
        self.assertFalse(report['is_real_project_measurement'])
        self.assertNotIn('source_run_url', report)
        text = markdown(report, [])
        self.assertIn('ОЙДАН ҚҰРАСТЫРЫЛҒАН ОҚУ ДЕРЕКТЕРІ', text)
        self.assertIn('нақты GitHub көрсеткіштері емес', text)
        self.assertNotIn('Дерек:** нақты GitHub API', text)
        self.assertNotIn('Deployments API snapshot', text)
