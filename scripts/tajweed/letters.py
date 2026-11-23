"""Letters and tajweed rules of a surah, worked out automatically. Writes the letters file align.py reads.

The letters are the Hafs text the site stores, cut into pieces of one letter with its marks. The rules come from two
places:

  * the Quran.com tajweed text (api.quran.com .../quran/verses/uthmani_tajweed), for the rules that need knowledge of
    recitation: the madd before a stop, the long madds, the hidden, merged and turned noon and meem, the humming, the
    bounce, the sun lam and the letters that are not said;
  * simple rules read off the stored text itself, the way Al-Fatihah was marked by hand: the natural madd (a bare
    alef, waw or yeh after its vowel), the moon lam, the clear noon and meem (the ones that carry a sukun), the heavy
    letters, and the alef that ends a verse after a double fatha.

The two texts spell the Quran with different characters, so they are matched letter by letter on their bare letters;
a verse whose letters do not match is reported and gets only the simple rules.

Usage: letters.py <source.json> <letters.json>    # source.json is written by fetch.py
"""
import json
import re
import sys

TATWEEL, DAGGER, HAIR, JOINER = 'ـ', 'ٰ', ' ', '⁠'
SUKUN, SHADDA = 'ۡ', 'ّ'
HAMZA_MARKS = ('ٔ', 'ٕ')
FATHATAN = ('ً', 'ࣰ')
TANWEEN = ('ً', 'ٌ', 'ٍ', 'ࣰ', 'ࣱ', 'ࣲ')
SMALL_MEEM = ('ۢ', 'ۭ')
FATHA, KASRA, DAMMA = 'َ', 'ِ', 'ُ'
BASMALA_WORDS = 4


def is_letter(ch):
    return ('ء' <= ch <= 'ي' and ch != TATWEEL) or ch in ('ٱ', 'ی')


def bare(ch):
    """A letter without what the two texts write differently: hamza seats, the yeh forms, the joining alef."""
    return {'ی': 'ي', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا'}.get(ch, ch)


def pieces(word):
    """One piece per letter, with its marks. A small alef on a line or a thin space is a piece of its own."""
    out, after_hair = [], False
    for raw in word:
        ch = 'ي' if raw == 'ی' else raw
        if ch == HAIR:
            after_hair = True
            continue
        if ch == JOINER:
            continue
        if ch == TATWEEL or (ch == DAGGER and after_hair) or is_letter(ch) or not out:
            out.append(ch)
        else:
            out[-1] += ch
        after_hair = False
    return out


def stored_verses(source):
    """Each verse as words of pieces, without the basmala the stored text puts before a surah's first verse."""
    verses = []
    for v, text in enumerate(source['stored']):
        words = [w for w in text.split(' ') if any(is_letter(c) for c in w)]
        if v == 0 and source['surah'] != 1:
            words = words[BASMALA_WORDS:]
        verses.append([pieces(w) for w in words])
    return verses


def marked(text):
    """The Quran.com verse as (character, class or None), one tajweed span after another."""
    text = re.sub(r'<span class=end>.*?</span>', '', text)
    out, span = [], 0
    for part in re.split(r'(<tajweed class=\w+>[^<]*</tajweed>)', text):
        m = re.match(r'<tajweed class=(\w+)>([^<]*)</tajweed>', part)
        if m:
            span += 1
            out += [(ch, m.group(1), span) for ch in m.group(2)]
        else:
            out += [(ch, None, 0) for ch in part]
    return out


RULE = {
    'ham_wasl': 'silent', 'slnt': 'silent', 'laam_shamsiyah': 'shamsi', 'qalaqah': 'qalqalah', 'ghunnah': 'ghunnah',
    'madda_normal': 'madd2', 'madda_permissible': 'madd4', 'madda_obligatory': 'madd5', 'madda_necessary': 'madd6',
    'ikhafa': 'ikhfa', 'ikhafa_shafawi': 'ikhfa', 'iqlab': 'iqlab',
    'idgham_ghunnah': 'idghamg', 'idgham_shafawi': 'idghamg',
    'idgham_wo_ghunnah': 'idgham', 'idgham_mutajanisayn': 'idgham', 'idgham_mutaqaribayn': 'idgham',
}
MADD = ('madd2', 'madd4', 'madd5', 'madd6')
# Where two rules meet on one letter, the one that changes how it is said wins.
ORDER = ['silent', 'shamsi', 'madd6', 'madd5', 'madd4', 'idghamg', 'idgham', 'iqlab', 'ikhfa', 'ghunnah', 'qalqalah', 'madd2', 'qamari', 'izhar', 'heavy']
HEAVY = 'خصضغطقظ'


def quran_com_rules(flat, text):
    """Rules from the Quran.com text, as {position in flat: rule}. None when the two texts' letters do not match."""
    # Their letters take seats among our pieces, in order. Two of our spellings have a letter theirs lacks: a yeh
    # that only carries a small alef ("ata-ka"), and a hamza written on a line before an alef ("al-akhirah").
    stream = marked(text)
    theirs = [bare(ch) for ch, _, _ in stream if is_letter(ch)]
    seats = []
    at = 0
    for i, piece in enumerate(flat):
        on_line = piece[0] == TATWEEL and any(m in piece for m in HAMZA_MARKS)
        if not is_letter(piece[0]) and not on_line:
            continue
        ours = bare(piece[0]) if is_letter(piece[0]) else 'ء'
        if at < len(theirs) and theirs[at] == ours:
            seats.append(i)
            at += 1
        elif not (on_line or (piece[0] == 'ى' and DAGGER in piece)):
            return None
    if at != len(theirs):
        return None
    seated = set(seats)

    rules = {}
    k = -1  # the last letter passed
    i = 0
    while i < len(stream):
        ch, cls, span = stream[i]
        if cls is None:
            if is_letter(ch):
                k += 1
            i += 1
            continue
        j = i
        while j < len(stream) and stream[j][2] == span:
            j += 1
        chars = [c for c, _, _ in stream[i:j]]
        inside = []
        lead = []  # the marks the span begins with: they belong to the letter before it
        for c in chars:
            if is_letter(c):
                k += 1
                inside.append(k)
            elif not inside and c not in (' ', TATWEEL):
                lead.append(c)
        before = inside[0] - 1 if inside else k
        rule = RULE.get(cls)
        target = None
        if rule in MADD:
            # The long vowel: the madd letter itself, or the small alef drawn after the letter, or the letter carrying it.
            if inside:
                target = seats[inside[-1]]
            elif before >= 0:
                at = seats[before]
                target = at + 1 if at + 1 < len(flat) and at + 1 not in seated and DAGGER in flat[at + 1] else at
        elif rule in ('ikhfa', 'iqlab', 'idghamg', 'idgham') and len(inside) != 1:
            # A noon, a meem or a tanween meeting the next letter: the rule is the first one's.
            if any(m in TANWEEN or m in SMALL_MEEM for m in lead) and before >= 0:
                target = seats[before]
            elif inside:
                target = seats[inside[0]]
        elif inside:
            target = seats[inside[0]]
        if rule and target is not None:
            rules.setdefault(target, []).append(rule)
        i = j
    return {at: sorted(found, key=ORDER.index)[0] for at, found in rules.items()}


def vowel_of(piece):
    return next((m for m in piece[1:] if m in (FATHA, KASRA, DAMMA)), None)


def simple_rules(words, flat, rules):
    """The rules read off the stored text: they fill the letters Quran.com left plain."""
    position = 0
    for w, word in enumerate(words):
        next_word = words[w + 1] if w + 1 < len(words) else None
        for n, piece in enumerate(word):
            at = position + n
            if at in rules:
                continue
            base, marks = piece[0], piece[1:]
            before = word[n - 1] if n else None
            last_in_word = n == len(word) - 1
            meets_joining_alef = last_in_word and next_word and next_word[0][0] == 'ٱ'
            long_after = {'ا': FATHA, 'ى': FATHA, 'و': DAMMA, 'ي': KASRA}.get(base)
            if long_after and before and (not marks or marks == DAGGER) and not any(m in before for m in TANWEEN):
                carries = vowel_of(before) == long_after or (base in 'اى' and DAGGER in piece)
                if carries:
                    # A long vowel is dropped when the next word begins with a joining alef: "fi l-", "ihdina s-".
                    rules[at] = 'silent' if meets_joining_alef and marks != DAGGER else 'madd2'
                    continue
            after = word[n + 1] if not last_in_word else None
            if piece == 'ل' + SHADDA + FATHA and before and before[0] == 'ل' and after and after[0] == 'ه' and SUKUN not in after \
                    and (n + 2 == len(word) or word[n + 2][0] == 'م'):
                rules[at] = 'madd2'  # the name of Allah: its lam carries a long vowel that is not written
            elif base == 'ل' and SUKUN in marks and before and before[0] == 'ٱ' and n == 1:
                rules[at] = 'qamari'
            elif base in 'نم' and SUKUN in marks:
                rules[at] = 'izhar'
            elif base in HEAVY:
                rules[at] = 'heavy'
            elif base == 'ر':
                own = vowel_of(piece)
                tanween = next((m for m in marks if m in TANWEEN), None)
                if own in (FATHA, DAMMA) or tanween in ('ً', 'ٌ', 'ࣰ', 'ࣱ'):
                    rules[at] = 'heavy'
                elif SUKUN in marks and before and vowel_of(before) in (FATHA, DAMMA):
                    rules[at] = 'heavy'
        position += len(word)
    # We stop at the verse's end: an alef after a double fatha is then held for two counts.
    if len(flat) > 1 and flat[-1] in ('ا', 'ى') and any(m in flat[-2] for m in FATHATAN):
        rules[len(flat) - 1] = 'madd2'
    # A joining alef that begins the verse is said.
    if flat and flat[0][0] == 'ٱ':
        rules.pop(0, None)


def main():
    source = json.load(open(sys.argv[1]))
    verses, unmatched = [], []
    for v, words in enumerate(stored_verses(source)):
        flat = [p for word in words for p in word]
        rules = quran_com_rules(flat, source['tajweed'][v])
        if rules is None:
            unmatched.append(v + 1)
            rules = {}
        simple_rules(words, flat, rules)
        out, at = [], 0
        for word in words:
            out.append({'letters': [{'text': p, 'rule': rules.get(at + n)} for n, p in enumerate(word)]})
            at += len(word)
        verses.append({'ayah': v + 1, 'words': out})
    audio = source['audio']
    json.dump({'surah': source['surah'], 'audioUrl': audio['audio_url'], 'passes': 2, 'verses': verses, 'unmatched': unmatched},
              open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
    letters = sum(len(w['letters']) for v in verses for w in v['words'])
    print(f"surah {source['surah']}: {len(verses)} verses, {letters} letters" + (f", NOT MATCHED: verses {unmatched}" if unmatched else ''))


main()
