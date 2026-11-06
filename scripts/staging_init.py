#!/usr/bin/env python3
"""Prepare directories and private credentials on an operator-owned synthetic host."""
import argparse
import os
from pathlib import Path
import secrets
import stat


def prepare(root, port=8080):
    root = Path(root)
    if not root.is_absolute() or root == Path('/') or not 1024 <= port <= 65535:
        raise ValueError('Use an absolute dedicated directory and an unprivileged port')
    if any(path.is_symlink() for path in [root, *root.parents]):
        raise ValueError('Staging root must not traverse symlinks')
    for name in ['releases', 'shared', 'backups']:
        directory = root / name
        if directory.is_symlink():
            raise ValueError('Staging directories must not be symlinks')
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        if directory.stat().st_uid != os.getuid():
            raise ValueError('Run as the deploy user who owns the staging directories')
        directory.chmod(0o700)
    env = root / 'shared/staging.env'
    # Exclusive creation preserves credentials and data on repeated initialization.
    try:
        fd = os.open(env, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        if env.is_symlink() or not env.is_file():
            raise ValueError('Existing credential file is not a regular file') from None
        if env.stat().st_uid != os.getuid() or stat.S_IMODE(env.stat().st_mode) != 0o600:
            raise ValueError('Existing credential file must belong to deploy user with mode 600')
        return False
    with os.fdopen(fd, 'w') as output:
        output.write(f'DB_USER=adenly\nDB_NAME=adenly_staging\nDB_PASS={secrets.token_hex(24)}\n'
                     f'JWT_SECRET={secrets.token_hex(48)}\nSTAGING_HTTP_PORT={port}\n')
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='/srv/adenly-staging', type=Path)
    parser.add_argument('--port', default=8080, type=int)
    args = parser.parse_args()
    created = prepare(args.root, args.port)
    print('Staging directories ready; credential file ' + ('created privately.' if created else 'preserved.'))
