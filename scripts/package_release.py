"""Package Docker source, evidence and the supplied report without local secrets/cache."""
import argparse
import hashlib
import os
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {'.git', '.venv', '.tools', 'node_modules', 'target', 'dist', '__pycache__', 'artifacts', 'release', 'report'}
EXCLUDED_NAMES = {'.env', '.DS_Store', 'Thumbs.db', 'MANIFEST.sha256'}


def source_files(root):
    """Prune generated directories before descending into the source tree."""
    for directory, directories, files in os.walk(root, followlinks=False):
        directories[:] = sorted(name for name in directories if name not in EXCLUDED_DIRS)
        for name in directories:
            if (Path(directory) / name).is_symlink():
                raise ValueError('Symlinks are not packaged: ' + str(Path(directory, name).relative_to(root)))
        for name in sorted(files):
            if name in EXCLUDED_NAMES or (name.startswith('.env.') and name != '.env.example'):
                continue
            path = Path(directory) / name
            if path.suffix.lower() in {'.zip', '.log', '.pyc', '.partial', '.class', '.jar'}:
                continue
            if path.is_symlink():
                raise ValueError('Symlinks are not packaged: ' + str(path.relative_to(root)))
            yield path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group', required=True, help='Actual group number: one or two digits')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--require-pdf', action='store_true', help='Require the final report PDF')
    args = parser.parse_args()
    if not args.group.isdigit() or not 1 <= len(args.group) <= 2:
        parser.error('--group must contain one or two digits')
    prefix = 'Nhom' + args.group.zfill(2) + '_CodeGradeNetwork'
    destination = (args.output or ROOT.parent / (prefix + '.zip')).resolve()
    if destination.exists():
        parser.error('Output already exists; choose a new --output path: ' + str(destination))
    report_dir = ROOT / 'report'
    reports = sorted(report_dir.glob('*.docx'))
    pdfs = sorted(report_dir.glob('*.pdf'))
    if len(reports) != 1 or len(pdfs) > 1:
        parser.error('report/ must contain one DOCX and at most one final PDF')
    if args.require_pdf and not pdfs:
        parser.error('Export the final report to PDF in report/ first')
    entries = {}
    for path in source_files(ROOT):
        relative = path.relative_to(ROOT)
        entries[relative.as_posix()] = path.read_bytes()
    for path in reports + pdfs + sorted(report_dir.glob('*.md')):
        if path.is_symlink():
            raise ValueError('Report must be a regular file')
        entries['report/' + path.name] = path.read_bytes()
    required = ['README.md', 'Dockerfile', 'compose.yaml', 'compose.test.yaml', '.env.example',
                'backend/pom.xml', 'frontend/package-lock.json', 'worker/sandbox.py',
                'scripts/init_env.py', 'scripts/verify_release.py',
                'report/CodeSurvival-v6.md', 'report/UI-Redesign.md']
    for name in required:
        if name not in entries:
            raise ValueError('Missing required file: ' + name)
    entries['README.txt'] = (
        'CodeGrade Network 6.0.0\n'
        'Start with README.md. Docker builds the application from source.\n'
        'Generate your own .env before starting. No private .env is included.\n'
        'report/ contains the supplied report. Fill all [CAN DIEN] fields before submission.\n'
        'Verify: python scripts/verify_release.py .\n'
    ).encode('utf-8')
    manifest = ''.join(hashlib.sha256(data).hexdigest() + '  ' + name + '\n'
                       for name, data in sorted(entries.items()))
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, 'x', compression=ZIP_DEFLATED) as archive:
        for name, data in sorted(entries.items()):
            archive.writestr(prefix + '/' + name, data)
        archive.writestr(prefix + '/MANIFEST.sha256', manifest)
    print(str(destination))
    print(str(len(entries)) + ' files; SHA256 ' + hashlib.sha256(destination.read_bytes()).hexdigest())
    if not pdfs:
        print('DRAFT PACKAGE: report PDF has not been supplied.')


if __name__ == '__main__':
    main()
