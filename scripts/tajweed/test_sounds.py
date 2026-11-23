"""python3 -m unittest scripts/tajweed/test_sounds.py: how letters are said, and how a verse is flattened. No torch needed."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from serve import flatten  # noqa: E402
from sounds import said  # noqa: E402


def verse(*letters):
    return [{'text': t, 'rule': r, 'word': w} for t, r, w in letters]


class Said(unittest.TestCase):
    def test_short_vowels_and_stop(self):
        flat = verse(('قُ', None, 0), ('لۡ', None, 0))
        self.assertEqual(said(flat, 0), 'qu')
        self.assertEqual(said(flat, 1), 'l')

    def test_long_vowel_and_silent_letters_have_no_sound(self):
        flat = verse(('وَ', None, 0), ('ٱ', 'silent', 1), ('لَّ', None, 1), ('ا', 'madd2', 1), ('ه', None, 1))
        self.assertEqual(said(flat, 1), '')
        self.assertEqual(said(flat, 3), '')

    def test_flatten_shares_the_doubled_lam(self):
        flat = flatten([{'text': t, 'rule': r, 'word': 0} for t, r in [('ٱ', 'silent'), ('ل', None), ('لَّ', None), ('ا', 'madd2'), ('هُ', None)]])
        self.assertEqual([l['said'] for l in flat], ['', '', 'la', '', 'h'])


if __name__ == '__main__':
    unittest.main()
