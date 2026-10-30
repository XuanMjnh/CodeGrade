"""Release checks use an isolated fixture, never the workspace's private .env."""
import contextlib
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

SCRIPTS = Path(__file__).resolve().parents[1]


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


package = load_script('package_release')
verify = load_script('verify_release')


class ReleaseTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='codegrade-release-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'source'
        for name in ['README.md', 'Dockerfile', 'compose.yaml', 'compose.test.yaml', '.env.example',
                     'backend/pom.xml', 'frontend/package-lock.json', 'worker/sandbox.py',
                     'scripts/init_env.py', 'scripts/verify_release.py', 'report/report.docx',
                     'report/CodeSurvival-v6.md', 'report/UI-Redesign.md']:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('Fixture: ' + name, encoding='utf-8')
        self.archive = Path(self.temp.name) / 'release.zip'

    def build(self):
        with patch.object(package, 'ROOT', self.root), patch.object(sys, 'argv',
                ['package_release.py', '--group', '19', '--output', str(self.archive)]), contextlib.redirect_stdout(io.StringIO()):
            package.main()

    def check(self, root):
        with patch.object(sys, 'argv', ['verify_release.py', str(root)]), contextlib.redirect_stdout(io.StringIO()):
            verify.main()

    def test_archive_contains_reports_and_verifiable_manifest_without_secrets_or_cache(self):
        for name in ['.env', '.env.local', 'frontend/node_modules/cache.txt', 'backend/target/app.jar',
                     'scripts/__pycache__/cache.pyc', '.git/config']:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('must not be packaged', encoding='utf-8')
        self.build()
        with ZipFile(self.archive) as archive:
            names = archive.namelist()
            self.assertIn('Nhom19_CodeGradeNetwork/report/UI-Redesign.md', names)
            self.assertIn('Nhom19_CodeGradeNetwork/report/CodeSurvival-v6.md', names)
            self.assertIn('Nhom19_CodeGradeNetwork/.env.example', names)
            self.assertFalse(any('.env.local' in name or name.endswith('/.env') or
                                 '/node_modules/' in name or '/__pycache__/' in name or
                                 '/target/' in name or '/.git/' in name for name in names))
            extracted = Path(self.temp.name) / 'extracted'
            archive.extractall(extracted)
        self.check(extracted / 'Nhom19_CodeGradeNetwork')

    def test_verifier_rejects_tampered_and_unlisted_files(self):
        self.build()
        with ZipFile(self.archive) as archive:
            archive.extractall(Path(self.temp.name) / 'extracted')
        root = Path(self.temp.name) / 'extracted/Nhom19_CodeGradeNetwork'
        extra = root / 'unlisted.txt'
        extra.write_text('unlisted', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Unlisted files'):
            self.check(root)
        extra.unlink()
        (root / 'README.md').write_text('tampered', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Hash mismatch'):
            self.check(root)

    def test_existing_archive_is_preserved(self):
        self.archive.write_bytes(b'existing archive')
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.build()
        self.assertEqual(self.archive.read_bytes(), b'existing archive')


if __name__ == '__main__':
    unittest.main()
