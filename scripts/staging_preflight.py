#!/usr/bin/env python3
"""Read-only host checks; never print private environment values."""
import argparse
import os
from pathlib import Path
import shutil
import stat
import subprocess


def check(root):
    root = Path(root)
    if not root.is_absolute() or root == Path('/'):
        raise ValueError('Use a dedicated absolute staging root')
    for directory in [root, root / 'releases', root / 'shared', root / 'backups']:
        if directory.is_symlink() or not directory.is_dir() or not os.access(directory, os.W_OK):
            raise ValueError('Staging directories must exist and be writable by deploy user')
    env = root / 'shared/staging.env'
    if env.is_symlink() or not env.is_file():
        raise ValueError('Private staging.env is missing or is a symlink')
    if env.stat().st_uid != os.getuid() or stat.S_IMODE(env.stat().st_mode) != 0o600:
        raise ValueError('Private staging.env must belong to deploy user and have mode 600')
    values = dict(line.split('=', 1) for line in env.read_text().splitlines()
                  if line.strip() and not line.lstrip().startswith('#'))
    for key, minimum in [('DB_PASS', 32), ('JWT_SECRET', 48)]:
        value = values.get(key, '')
        if len(value) < minimum or not all(c.isascii() and c.isalnum() for c in value):
            raise ValueError('Missing or weak credentials; use staging_init.py')
    if not values.get('DB_USER') or not values.get('DB_NAME'):
        raise ValueError('Missing database identity')
    if not 1024 <= int(values.get('STAGING_HTTP_PORT', '8080')) <= 65535:
        raise ValueError('Invalid staging HTTP port')
    for tool in ['docker', 'curl']:
        if not shutil.which(tool):
            raise ValueError('Required host tool missing: ' + tool)
    for command in [['docker', 'compose', 'version'], ['docker', 'info']]:
        result = subprocess.run(command, capture_output=True, timeout=30)
        if result.returncode:
            raise ValueError('Docker Engine/Compose is unavailable to deploy user')
    print('STAGING_PREFLIGHT_OK: tools, Docker access, directories and private credentials verified')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', nargs='?', default='/srv/adenly-staging')
    args = parser.parse_args()
    try:
        check(args.root)
    except (ValueError, OSError, subprocess.TimeoutExpired):
        # Do not echo parser errors or subprocess stderr that might contain secrets.
        parser.exit(1, 'STAGING_PREFLIGHT_FAILED: verify tools, Docker access, directories and private staging.env\n')
