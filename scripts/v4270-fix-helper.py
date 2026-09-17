from pathlib import Path

p = Path('scripts/v4270-one-shot.py')
s = p.read_text()
start = s.index("sub_once('README.md',\n    r'The live laboratory registry is authoritative:")
end = s.index("\n\nreplace_once('llms.txt'", start)
replacement = """sub_once('README.md',
    r'The live laboratory registry is authoritative: \\*\\*\\d+ laboratories across \\d+ worlds\\*\\* at the\\s+v\\d+\\.\\d+\\.\\d+ release boundary\\.',
    'The live census is `api/manifest.json` (`counts.laboratories`, `counts.instruments`, `counts.worlds`) at the release declared by `version.json`.')"""
p.write_text(s[:start] + replacement + s[end:])
