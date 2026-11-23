"""How each letter of a verse is said, in the Latin letters Meta's MMS aligner knows.

Shared by align.py (the recitations the app plays) and serve.py (a child's recording, for voice feedback).
"""

CONSONANT = {
    'ب': 'b', 'ت': 't', 'ث': 't', 'ج': 'j', 'ح': 'h', 'خ': 'k', 'د': 'd', 'ذ': 'd', 'ر': 'r', 'ز': 'z', 'س': 's',
    'ش': 's', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'g', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 't',
}
TATWEEL, DAGGER = '\u0640', '\u0670'
VOWEL = {'\u064E': 'a', '\u0650': 'i', '\u064F': 'u'}
TANWEEN = {'\u064B': 'a', '\u08F0': 'a', '\u064C': 'u', '\u08F1': 'u', '\u064D': 'i', '\u08F2': 'i'}
SMALL_MEEM = ('\u06E2', '\u06ED')
HAMZA_MARKS = ('\u0654', '\u0655')
MADD = ('madd2', 'madd4', 'madd5', 'madd6')
MERGED = ('idgham', 'idghamg')
SILENT = ('silent', 'shamsi')


def said(flat, i):
    """The sounds of one letter of a recitation, or '' when it has none of its own."""
    text, rule = flat[i]['text'], flat[i]['rule']
    if rule in SILENT:
        return ''
    base, marks = text[0], text[1:]
    if rule in MADD and base in (TATWEEL, DAGGER, 'ا', 'ي', 'و', 'ى'):
        return ''  # a long vowel: it continues the vowel of the letter before it
    if base == 'ٱ':
        # Said only when a recitation begins with it: "al-", or before a verb "u" when its third letter has a damma, else "i".
        if i != 0:
            return ''
        if flat[1]['text'][0] == 'ل':
            return 'a'
        return 'u' if len(flat) > 2 and '\u064F' in flat[2]['text'] else 'i'
    seat = any(m in marks for m in HAMZA_MARKS)  # a hamza written on this letter: only its vowel is heard
    if base in ('ا', 'ى') and not seat:
        return ''
    sound = '' if seat else CONSONANT.get(base, '')
    vowel = next((VOWEL[m] for m in marks if m in VOWEL), '')
    tanween = next((TANWEEN[m] for m in marks if m in TANWEEN), '')
    if i == len(flat) - 1:
        return 'h' if base == 'ة' else sound  # we stop on the last letter: no vowel, and the round ta is a ha
    if tanween:
        ends_on_alef = i == len(flat) - 2 and flat[-1]['rule'] == 'madd2' and flat[-1]['text'][0] in ('ا', 'ى')
        if ends_on_alef or rule in MERGED:
            return sound + tanween
        return sound + tanween + ('m' if rule == 'iqlab' else 'n')
    if vowel and any(m in marks for m in SMALL_MEEM):
        return sound + vowel + 'm'  # a tanween turned into a meem
    if not vowel:
        if rule in MERGED:
            return ''  # merged into the next letter
        if base == 'ن' and rule == 'iqlab':
            return 'm'
    return sound + vowel
