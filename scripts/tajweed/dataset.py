"""Prints the `verses` of a tajweed dataset in TypeScript from what align.py wrote.

Usage: dataset.py <aligned.json>                 # paste or pipe the output into shared/src/tajweed/<surah>.ts
       dataset.py <aligned.json> --json <out>    # the whole dataset as JSON, for web/src/pages/tajweed/surah-data/<surah>.json
"""
import json
import sys

data = json.load(open(sys.argv[1]))


def span(letter):
    return max(1, letter['endMs'] - letter['startMs'])


if '--json' in sys.argv:
    verses = []
    for verse in data['verses']:
        first = verse['passes'][0]
        entry = {
            'ayah': verse['ayah'],
            'endMs': first['endMs'],
            'words': [{'startMs': w[0]['startMs'], 'endMs': w[-1]['endMs'], 'letters': [[l['text'], span(l)] + ([l['rule']] if l['rule'] else []) for l in w]} for w in first['words']]
        }
        if len(verse['passes']) > 1:
            again = verse['passes'][1]
            entry['repeat'] = {'endMs': again['endMs'], 'words': [{'startMs': w[0]['startMs'], 'endMs': w[-1]['endMs'], 'ms': [span(l) for l in w]} for w in again['words']]}
        verses.append(entry)
    out = {'surah': data['surah'], 'reciterId': 'qdc.168', 'audioUrl': data['audioUrl'], 'verses': verses}
    json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, separators=(',', ':'))
    sys.exit()

lines = []
for verse in data['verses']:
    first = verse['passes'][0]
    lines += ['    {', f"      ayah: {verse['ayah']},", f"      endMs: {first['endMs']},", '      words: [']
    for word in first['words']:
        cells = [f"['{l['text']}', {span(l)}, '{l['rule']}']" if l['rule'] else f"['{l['text']}', {span(l)}]" for l in word]
        lines.append(f"        {{ startMs: {word[0]['startMs']}, endMs: {word[-1]['endMs']}, letters: [{', '.join(cells)}] }},")
    lines.append('      ],' if len(verse['passes']) > 1 else '      ]')
    if len(verse['passes']) > 1:
        again = verse['passes'][1]
        lines += ['      repeat: {', f"        endMs: {again['endMs']},", '        words: [']
        for word in again['words']:
            lines.append(f"          {{ startMs: {word[0]['startMs']}, endMs: {word[-1]['endMs']}, ms: [{', '.join(str(span(l)) for l in word)}] }},")
        lines += ['        ]', '      }']
    lines.append('    },')
print('\n'.join(lines))

