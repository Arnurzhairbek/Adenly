import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('staging_init', Path(__file__).parents[1] / 'staging_init.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StagingInitTests(unittest.TestCase):
    def test_repeated_setup_preserves_credentials_and_backups(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'stage'
            self.assertTrue(module.prepare(root))
            env = root / 'shared/staging.env'
            before = env.read_bytes()
            backup = root / 'backups/retained.sql'
            backup.write_text('retained database backup')
            self.assertFalse(module.prepare(root))
            self.assertEqual(env.read_bytes(), before)
            self.assertEqual(env.stat().st_mode & 0o777, 0o600)
            self.assertEqual(backup.read_text(), 'retained database backup')

    def test_independent_hosts_receive_distinct_credentials(self):
        with tempfile.TemporaryDirectory() as temp:
            one, two = Path(temp) / 'one', Path(temp) / 'two'
            module.prepare(one)
            module.prepare(two)
            self.assertNotEqual((one / 'shared/staging.env').read_bytes(), (two / 'shared/staging.env').read_bytes())

    def test_unsafe_existing_credentials_are_rejected_without_overwrite(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'stage'
            module.prepare(root)
            env = root / 'shared/staging.env'
            before = env.read_bytes()
            env.chmod(0o644)
            with self.assertRaises(ValueError):
                module.prepare(root)
            self.assertEqual(env.read_bytes(), before)

    def test_symlink_cannot_redirect_credential_writes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'stage'
            root.mkdir()
            target = Path(temp) / 'outside'
            target.mkdir()
            (root / 'shared').symlink_to(target, target_is_directory=True)
            with self.assertRaises(ValueError):
                module.prepare(root)
            self.assertEqual(list(target.iterdir()), [])

    def test_invalid_root_or_privileged_port_rejected(self):
        for root, port in [('/', 8080), ('relative', 8080), ('/tmp/example', 80)]:
            with self.assertRaises(ValueError):
                module.prepare(root, port)
