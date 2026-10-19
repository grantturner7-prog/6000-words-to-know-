#!/usr/bin/env python3
"""Tests for scripts/check_batch.py: each test breaks a copy of Batch 1 in one way and
checks that the gate reports it. Run: python3 scripts/test_check_batch.py"""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("check_batch", ROOT / "scripts" / "check_batch.py")
cb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cb)
BASE = json.loads((ROOT / "content" / "batches" / "b001.json").read_text(encoding="utf-8"))


def run(mutate):
    data = copy.deepcopy(BASE)
    mutate(data)
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "b001.json"
        p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        rep, _ = cb.check_batch(p)
    return rep.errors


def word(data, head):
    return next(w for w in data["words"] if w["headword"] == head)


class CheckBatch(unittest.TestCase):
    def assertCaught(self, errors, fragment):
        self.assertTrue(any(fragment in e for e in errors), f"expected an error containing {fragment!r}, got {errors}")

    def test_clean_batch_passes(self):
        self.assertEqual(run(lambda d: None), [])

    def test_word_above_the_level_band(self):
        def m(d): word(d, "chair")["examples"]["beginner"] = "Sit on the {chair} in the museum garden pavilion."
        self.assertCaught(run(m), "above the band")

    def test_beginner_sentence_too_long(self):
        def m(d): word(d, "tea")["examples"]["beginner"] = "I drink {tea} every morning with my family at home."
        self.assertCaught(run(m), "cap 8")

    def test_example_without_target_mark(self):
        def m(d): word(d, "go")["examples"]["beginner"] = "I go to school by bus."
        self.assertCaught(run(m), "exactly one {target} mark")

    def test_marked_word_is_not_a_form(self):
        def m(d): word(d, "go")["examples"]["beginner"] = "I {walk} to school by bus."
        self.assertCaught(run(m), "is not in forms")

    def test_story_gap_count(self):
        def m(d): d["stories"]["beginner"]["parts"][0]["gaps"].pop()
        self.assertCaught(run(m), "gaps, expected 10")

    def test_story_marks_out_of_order(self):
        def m(d): d["stories"]["advanced"]["parts"][1]["text"] = d["stories"]["advanced"]["parts"][1]["text"].replace("[[3]]", "[[9]]", 1)
        self.assertCaught(run(m), "gap marks must run")

    def test_story_word_missing_from_gaps(self):
        def m(d): d["stories"]["intermediate"]["parts"][0]["gaps"][0]["w"] = "w0589"
        self.assertCaught(run(m), "every word must be a gap exactly once")

    def test_story_uses_word_above_band(self):
        def m(d): d["stories"]["beginner"]["parts"][0]["text"] = d["stories"]["beginner"]["parts"][0]["text"].replace("Sunday is", "Sunday is extremely")
        self.assertCaught(run(m), "words above the band")

    def test_story_sentence_too_long(self):
        def m(d): d["stories"]["beginner"]["parts"][1]["text"] = d["stories"]["beginner"]["parts"][1]["text"].replace("Everyone eats [[9]].", "Everyone eats [[9]] and then they all go to the big room to play.")
        self.assertCaught(run(m), "cap 8")

    def test_gap_form_not_a_form_of_the_word(self):
        def m(d): d["stories"]["intermediate"]["parts"][0]["gaps"][9]["form"] = "carried"
        self.assertCaught(run(m), "is not a form of")

    def test_distractor_equals_answer(self):
        def m(d): word(d, "chair")["pick"]["beginner"][0] = "chair"
        self.assertCaught(run(m), "distractor equals the answer")

    def test_distractor_not_in_batch(self):
        def m(d): word(d, "chair")["pick"]["beginner"][1] = "elephant"
        self.assertCaught(run(m), "is not a word of this batch")

    def test_frame_target_row_missing(self):
        def m(d):
            for r in word(d, "tea")["frames"]["beginner"]["rows"]:
                r.pop("target", None)
        self.assertCaught(run(m), "exactly one target row")

    def test_frame_target_tile_without_the_word(self):
        def m(d): word(d, "tea")["frames"]["beginner"]["rows"][1]["tiles"][0] = "drink milk"
        self.assertCaught(run(m), "does not contain the word")

    def test_frame_sentence_too_long(self):
        def m(d): word(d, "tea")["frames"]["beginner"]["rows"][2]["tiles"][0] = "every single day of the whole year"
        self.assertCaught(run(m), "cap 8")

    def test_frame_with_single_tile_row(self):
        def m(d): word(d, "tea")["frames"]["beginner"]["rows"][0]["tiles"] = ["I"]
        self.assertCaught(run(m), "tiles (2 to 5 allowed)")

    def test_wrong_number_of_words(self):
        def m(d): d["words"].pop()
        self.assertCaught(run(m), "words, expected 20")

    def test_missing_chinese(self):
        def m(d): word(d, "tea")["zhTW"] = "tea"
        self.assertCaught(run(m), "zhTW")

    def test_lookalike_spelling_is_actually_correct(self):
        def m(d): word(d, "tea")["confusable"][0] = "tea"
        self.assertCaught(run(m), "is a correct form")

    def test_set_differs_from_plan(self):
        def m(d): word(d, "tea")["set"] = 4
        self.assertCaught(run(m), "differs from the plan")

    def test_story_title_shows_a_gap_word(self):
        def m(d): d["stories"]["beginner"]["parts"][0]["title"] = "The Chair by the Fire"
        self.assertCaught(run(m), "title shows a word")

    def test_banned_word(self):
        def m(d): word(d, "chair")["examples"]["advanced"] = "When the bell rang, the stupid {chair} fell over and Tom ran to the door."
        self.assertCaught(run(m), "banned word")

    def test_published_needs_a_reviewer(self):
        def m(d): d["status"] = "published"
        self.assertCaught(run(m), "reviewedBy")

    def test_published_with_reviewer_is_accepted(self):
        def m(d): d["status"] = "published"; d["provenance"]["reviewedBy"] = "Teacher"; d["provenance"]["reviewedOn"] = "2026-10-19"
        self.assertEqual(run(m), [])


if __name__ == "__main__":
    unittest.main(verbosity=1)
