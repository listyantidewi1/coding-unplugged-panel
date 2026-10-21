#!/usr/bin/env python3
"""Ambil pengantar, kategori, dan label Pengayaan dari lembar kerja ke js/activities/meta.js.

Pemakaian: python3 tools/sinkron-lembar-kerja.py <folder kurikulum>
Pengantar diambil dari blok <!-- pengantar --> ... <!-- /pengantar --> di
lembar-kerja/<id>.md; kategori dari baris "| **Kategori** | ... |" di
lembar kerja, atau dari tabel di kategori.md bila baris itu belum ada.
Label Pengayaan (topik yang hanya ada di CS Unplugged, tidak di kurikulum
Indonesia) dikenali dari kata "Pengayaan" di baris tabel kategori.md atau
di baris Kategori/Label lembar kerja.
"""
import html, json, pathlib, re, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/kurikulum')
out = pathlib.Path(__file__).resolve().parent.parent / 'js' / 'activities' / 'meta.js'
KAT = {'coding': 'coding', 'computational thinking': 'ct', 'literasi digital & ka': 'literasi'}


def inline(text):
    t = html.escape(text, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<i>\1</i>', t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    return t


def kategori(cell):
    name = re.sub(r'[◐★`*]', '', cell).split('·')[0].strip().lower()
    return KAT.get(name)


intro, kat, extra = {}, {}, set()
for line in (root / 'kategori.md').read_text(encoding='utf-8').splitlines():
    m = re.match(r'\|\s*`([a-z]+-\d+-[a-z0-9-]+)`[^|]*\|[^|]*\|([^|]*)\|', line)
    if m and kategori(m.group(2)):
        kat[m.group(1)] = kategori(m.group(2))
    if m and re.search(r'pengayaan', line, re.I):
        extra.add(m.group(1))
for f in sorted((root / 'lembar-kerja').glob('*.md')):
    text = f.read_text(encoding='utf-8')
    m = re.search(r'<!-- pengantar -->\s*\n(.*?)\n\s*<!-- /pengantar -->', text, re.S)
    if m:
        paras = [p.strip() for p in re.split(r'\n\s*\n', m.group(1)) if p.strip()]
        intro[f.stem] = [inline(' '.join(l.strip().lstrip('> ').strip() for l in p.splitlines())) for p in paras]
    m = re.search(r'^\|\s*\*\*Kategori\*\*\s*\|([^|]*)\|', text, re.M)
    if m and kategori(re.sub(r'(?i)[·,;+]?\s*pengayaan', '', m.group(1))):
        kat[f.stem] = kategori(re.sub(r'(?i)[·,;+]?\s*pengayaan', '', m.group(1)))
    if re.search(r'^\|\s*\*\*(Kategori|Label)\*\*\s*\|[^|]*pengayaan', text, re.M | re.I):
        extra.add(f.stem)

body = ('// Dibuat oleh tools/sinkron-lembar-kerja.py dari lembar kerja; jangan disunting langsung.\n'
        f'export const PENGANTAR = {json.dumps(intro, ensure_ascii=False, indent=1)};\n'
        f'export const KATEGORI = {json.dumps(kat, ensure_ascii=False, indent=1)};\n'
        f'export const PENGAYAAN = {json.dumps(sorted(extra), ensure_ascii=False)};\n')
out.write_text(body, encoding='utf-8')
print(f'{len(intro)} pengantar, {len(kat)} kategori, {len(extra)} pengayaan -> {out}')
