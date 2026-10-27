"""Check every file in an extracted submission against its SHA-256 manifest."""
import hashlib
from pathlib import Path, PurePosixPath
import sys


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
    manifest = root / 'MANIFEST.sha256'
    expected = set()
    for line in manifest.read_text(encoding='utf-8').splitlines():
        digest, name = line.split('  ', 1)
        relative = PurePosixPath(name)
        if relative.is_absolute() or '..' in relative.parts or '\\' in name or name in expected:
            raise ValueError('Unsafe or duplicate manifest path: ' + name)
        path = (root / name).resolve()
        if root not in path.parents or not path.is_file():
            raise ValueError('Missing or unsafe path: ' + name)
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise ValueError('Hash mismatch: ' + name)
        expected.add(name)
    if not expected:
        raise ValueError('Manifest is empty')
    actual = {path.relative_to(root).as_posix() for path in root.rglob('*')
              if path.is_file() and path != manifest}
    if actual != expected:
        raise ValueError('Unlisted files: ' + ', '.join(sorted(actual - expected)))
    print('Verified ' + str(len(expected)) + ' files.')


if __name__ == '__main__':
    main()
