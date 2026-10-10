#!/usr/bin/env python3
"""Import complete, version-pinned public metadata; no theorem verification is implied.
Usage: python scripts/import-math-catalog.py --source-dir DIR --output api/math-catalog.json
DIR contains CONTENTS.md, overview.tex, formalization.yaml from the declared source commit.
"""
import argparse, hashlib, html, json, re
from pathlib import Path

SOURCE_COMMIT = 'fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb'
BASE = f'https://github.com/openai/math/blob/{SOURCE_COMMIT}/'

def clean(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).replace('$`', '').replace('`$', '').strip()

def build(source_dir):
    contents = (source_dir / 'CONTENTS.md').read_text()
    overview = (source_dir / 'overview.tex').read_text()
    formalizations = (source_dir / 'formalization.yaml').read_text()
    subjects, discipline = {}, ''
    for line in overview.splitlines():
        section = re.match(r'\\cataloguesection\{([^}]+)\}', line)
        if section:
            discipline = section[1]
        result = re.match(r'\\resultentry\{(\d+)\}', line)
        if result:
            subjects[result[1]] = discipline
    # A YAML source ID only establishes that the paper is referenced by the registry.
    # Exact declaration coverage is a separate, manually audited field in math-bridges.json.
    source_block = formalizations.split('\nsources:', 1)[1].split('\nrelated_formalizations:', 1)[0]
    source_ids = set(re.findall(r'^\s+id:\s+\.\./([^\n]+)', source_block, re.M))
    entries = re.split(r'\*\*(\d{3})\. ', contents)[1:]
    families = []
    for i in range(0, len(entries), 2):
        number, body = entries[i:i+2]
        title, _, rest = body.partition('**')
        family = {'id': number, 'title': clean(title.rstrip('.')),
                  'description': clean(rest.split('</td>', 1)[0]),
                  'discipline': subjects[number], 'papers': [],
                  'lean_family_document': BASE + 'lean/docs/' + number + '.md' if '(lean/docs/' in rest.split('</td>', 1)[0] else None}
        for cell in body.split('<td>')[1:]:
            match = re.search(r'&emsp;\[([^\n]+?)\]\((preprints/[^\n]+?\.pdf)\)', cell)
            if not match:
                continue
            name, path = match.groups()
            family['papers'].append({'title': clean(name), 'path': path, 'url': BASE + path,
                'directory_url': BASE + str(Path(path).parent),
                'abstract': clean(cell[match.end():].split('</td>', 1)[0]),
                'catalog_source_in_formalization_registry': path in source_ids,
                'lean_verified_here': False, 'independently_verified_here': False,
                'review_level': 'CATALOG_METADATA_ONLY'})
        families.append(family)
    count = sum(len(f['papers']) for f in families)
    declared = re.search(r'\*\*(\d+) manuscripts covering (\d+) result families', contents)
    if not declared or (count, len(families)) != (int(declared[1]), int(declared[2])):
        raise ValueError('Import is incomplete: counts do not match the source declaration')
    if len({p['path'] for f in families for p in f['papers']}) != count:
        raise ValueError('Duplicate manuscript path')
    return {'schema': 'hcc.math-catalog/1', 'snapshot_date': '2026-10-10',
        'source_commit': SOURCE_COMMIT, 'source_url': BASE + 'CONTENTS.md', 'license': 'Apache-2.0',
        'source_sha256': {f: hashlib.sha256((source_dir/f).read_bytes()).hexdigest()
                          for f in ['CONTENTS.md', 'overview.tex', 'formalization.yaml']},
        'counts': {'families': len(families), 'manuscripts': count},
        'scope': 'All active family descriptions and manuscript abstracts indexed; only selected bridges receive primary-statement review. No local Lean build.',
        'withdrawals': ['Algebraicity of Weil classes on split abelian eightfolds',
            'Algebraicity of Kuga–Satake Correspondences for K3 Surfaces',
            'The rational Hodge conjecture for products of K3 surfaces'],
        'history_url': BASE + 'history.md', 'families': families}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.write_text(json.dumps(build(args.source_dir), ensure_ascii=False, indent=2) + '\n')
