#!/usr/bin/env python3
"""Split the local test bundle into parts small enough to send (each under 28 MB, the chat's limit is 30 MB).
Every part unpacks into the same SparkleValley-<build>-local folder, so unzipping all of them gives the whole bundle.
Files are packed whole, biggest first; a single file too big for one part (SparkleStudio.exe) goes into its own .7z
(LZMA; Windows 11 and 7-Zip open it).   python3 tools/bundle-parts.py <bundle.zip> [out folder]   (needs: pip install py7zr)"""
import os, sys, zipfile
LIMIT = 28 * 1000 * 1000
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(src) or '.'
base = os.path.basename(src)[:-4]
for f in os.listdir(out):
    if f.startswith(base + '-part'): os.remove(os.path.join(out, f))
z = zipfile.ZipFile(src)
items = sorted([i for i in z.infolist() if not i.is_dir()], key=lambda i: -i.compress_size)
parts, big = [], []
for i in items:
    if i.compress_size > LIMIT: big.append(i); continue
    for p in parts:
        if p['size'] + i.compress_size + 200 <= LIMIT: p['files'].append(i); p['size'] += i.compress_size + 200; break
    else: parts.append({'files': [i], 'size': i.compress_size + 200})
n = 0
for p in parts:
    n += 1; name = os.path.join(out, f'{base}-part{n}.zip')
    with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED) as w:
        for i in sorted(p['files'], key=lambda i: i.filename):
            w.writestr(i, z.read(i.filename), compress_type=i.compress_type)
for i in big:
    import py7zr, tempfile
    n += 1; name = os.path.join(out, f'{base}-part{n}.7z')
    with tempfile.TemporaryDirectory() as t:
        z.extract(i, t)
        with py7zr.SevenZipFile(name, 'w', filters=[{'id': py7zr.FILTER_LZMA2, 'preset': 9}]) as w: w.write(os.path.join(t, i.filename), i.filename)
    if os.path.getsize(name) > 30 * 1024 * 1024: print('warning: still too big:', name)
total = n
for f in sorted(os.listdir(out)):
    if f.startswith(base + '-part'): print(f'  {os.path.getsize(os.path.join(out, f)) / 1e6:6.1f} MB  {f}')
print(f'{total} parts. Unzip (or open) every part into the same folder.')
