"""Extract an actual ChatGPT export privately; never follow archive paths or symlinks."""
import argparse, hashlib, json, os, stat, zipfile
from pathlib import Path, PurePosixPath
parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
root = args.destination.resolve()
repo = Path(__file__).resolve().parent.parent
if root == repo or repo in root.parents:
    raise SystemExit('Choose a private directory outside the source repository')
if root.exists() and any(root.iterdir()):
    raise SystemExit("Use a new empty destination for this export")
root.mkdir(parents=True, exist_ok=True, mode=0o700)
os.chmod(root, 0o700)
manifest = []
with zipfile.ZipFile(args.archive) as archive:
    members = archive.infolist()
    if len(members) > 50000 or sum(i.file_size for i in members) > 10 * 1024**3:
        raise SystemExit('Export exceeds 50,000 files or 10 GiB; review limits before extracting')
    # Validate the complete archive before writing any member.
    for info in members:
        name = PurePosixPath(info.filename)
        if name.is_absolute() or '..' in name.parts or '\\' in info.filename or ':' in info.filename or stat.S_ISLNK(info.external_attr >> 16):
            raise SystemExit('Unsafe export member path')
        if info.file_size > 2 * 1024**3:
            raise SystemExit('Individual member exceeds 2 GiB')
    if not any(PurePosixPath(i.filename).name == 'conversations.json' for i in members):
        raise SystemExit('No conversations.json found; HTML-only exports require separate review')
    for info in members:
        target = root.joinpath(*PurePosixPath(info.filename).parts)
        if info.is_dir():
            target.mkdir(parents=True, exist_ok=True, mode=0o700)
            continue
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        # Exclusive creation avoids clobbering an earlier import or following existing links.
        digest = hashlib.sha256()
        with target.open('xb') as output, archive.open(info) as source:
            os.chmod(target, 0o600)
            while chunk := source.read(1024 * 1024):
                digest.update(chunk)
                output.write(chunk)
        manifest.append({'path': info.filename, 'bytes': info.file_size, 'sha256': digest.hexdigest(), 'privacy_reviewed': False})
manifest_path = root / 'export-files.json'
with manifest_path.open('x') as output:
    os.chmod(manifest_path, 0o600)
    json.dump(manifest, output, indent=2)
print(f'Prepared {len(manifest)} private files; no uploads or database writes')
