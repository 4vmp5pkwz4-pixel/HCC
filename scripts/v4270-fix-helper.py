from pathlib import Path

p = Path('scripts/v4270-one-shot.py')
s = p.read_text()

# Make the README live-census rewrite insensitive to the line wrapping in main.
start = s.index("sub_once('README.md',\n    r'The live laboratory registry is authoritative:")
end = s.index("\n\nreplace_once('llms.txt'", start)
replacement = """sub_once('README.md',
    r'The live laboratory registry is authoritative: \\*\\*\\d+ laboratories across \\d+ worlds\\*\\* at the\\s+v\\d+\\.\\d+\\.\\d+ release boundary\\.',
    'The live census is `api/manifest.json` (`counts.laboratories`, `counts.instruments`, `counts.worlds`) at the release declared by `version.json`.')"""
s = s[:start] + replacement + s[end:]

# The repository release contract has three visible copies in addition to the
# HCC_VERSION/HCC_BUILD constants. Keep all five synchronized in the same patch.
old = """if nv != 1 or nb != 1: raise SystemExit(f'index identity replacement failed: version={nv} build={nb}')
write('index.html',idx)"""
new = """nd=idx.count(f'data-hcc-build=\"{OLD_BUILD}\"')
idx=idx.replace(f'data-hcc-build=\"{OLD_BUILD}\"',f'data-hcc-build=\"{NEW_BUILD}\"',1)
nm=idx.count(f'<meta name=\"hcc-build\" content=\"{OLD_BUILD}\">')
idx=idx.replace(f'<meta name=\"hcc-build\" content=\"{OLD_BUILD}\">',f'<meta name=\"hcc-build\" content=\"{NEW_BUILD}\">',1)
nmark=idx.count(f'<span class=\"buildMark\">· v{OLD_VERSION}</span>')
idx=idx.replace(f'<span class=\"buildMark\">· v{OLD_VERSION}</span>',f'<span class=\"buildMark\">· v{NEW_VERSION}</span>',1)
if nv != 1 or nb != 1 or nd != 1 or nm != 1 or nmark != 1:
    raise SystemExit(f'index identity replacement failed: version={nv} build={nb} data={nd} meta={nm} mark={nmark}')
write('index.html',idx)"""
if old not in s:
    raise SystemExit('release identity insertion point not found')
s = s.replace(old, new, 1)
p.write_text(s)
