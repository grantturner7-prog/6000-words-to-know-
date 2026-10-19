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
TBASE = json.loads((ROOT / "content" / "translations" / "b001.json").read_text(encoding="utf-8"))


def run(mutate, tmutate=None):
    data = copy.deepcopy(BASE)
    mutate(data)
    trans = copy.deepcopy(TBASE)
    if tmutate:
        tmutate(trans)
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "b001.json"
        p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        rep, _ = cb.check_batch(p, translations=trans)
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
        self.assertCaught(run(m), "gaps, expected 20")

    def test_story_marks_out_of_order(self):
        def m(d): d["stories"]["advanced"]["parts"][0]["text"] = d["stories"]["advanced"]["parts"][0]["text"].replace("[[3]]", "[[9]]", 1)
        self.assertCaught(run(m), "gap marks must run")

    def test_story_word_missing_from_gaps(self):
        def m(d): d["stories"]["intermediate"]["parts"][0]["gaps"][0]["w"] = "w0589"
        self.assertCaught(run(m), "every word must be a gap exactly once")

    def test_story_uses_word_above_band(self):
        def m(d): d["stories"]["beginner"]["parts"][0]["text"] = d["stories"]["beginner"]["parts"][0]["text"].replace("Sunday is", "Sunday is extremely")
        self.assertCaught(run(m), "words above the band")

    def test_story_sentence_too_long(self):
        def m(d): d["stories"]["beginner"]["parts"][0]["text"] = d["stories"]["beginner"]["parts"][0]["text"].replace("Everyone eats [[19]].", "Everyone eats [[19]] and then they all go to the big room to play.")
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

    def test_example_chinese_must_use_the_words_meaning(self):
        def t(tr): tr["examples"][word(BASE, "tea")["id"]]["beginner"] = "我每天早上都喝咖啡。"
        self.assertCaught(run(lambda d: None, t), "does not use the word's meaning")

    def test_sample_sentence_goes_out_of_date_when_the_pattern_changes(self):
        def m(d): word(d, "tea")["frames"]["beginner"]["rows"][0]["tiles"][0] = "We"
        self.assertCaught(run(m), "sample is out of date")

    def test_story_chinese_must_cover_every_word(self):
        def t(tr): tr["stories"]["beginner"][0] = "山姆坐在家裡。"
        self.assertCaught(run(lambda d: None, t), "never uses the meaning of")

    def test_missing_chinese_story_part(self):
        def t(tr): tr["stories"]["advanced"].pop()
        self.assertCaught(run(lambda d: None, t), "Chinese parts for")

    def test_banned_word(self):
        def m(d): word(d, "chair")["examples"]["advanced"] = "When the bell rang, the stupid {chair} fell over and Tom ran to the door."
        self.assertCaught(run(m), "banned word")

    def test_published_needs_a_reviewer(self):
        def m(d): d["status"] = "published"
        self.assertCaught(run(m), "reviewedBy")

    def test_published_with_reviewer_is_accepted(self):
        def m(d): d["status"] = "published"; d["provenance"]["reviewedBy"] = "Teacher"; d["provenance"]["reviewedOn"] = "2026-10-19"
        self.assertEqual(run(m), [])


class CheckMedia(unittest.TestCase):
    def media(self, **links):
        entry = {lv: {"video": "", "talk": ""} for lv in ("beginner", "intermediate", "advanced")}
        for key, url in links.items():
            lv, kind = key.split("_")
            entry[lv][kind] = url
        return {"b001": entry}

    def test_empty_links_are_allowed(self):
        self.assertEqual(cb.check_media(self.media(), ["b001"]), [])

    def test_https_links_are_allowed(self):
        self.assertEqual(cb.check_media(self.media(beginner_video="https://videos.example.com/lesson-1/beginner.mp4"), ["b001"]), [])

    def test_other_schemes_are_rejected(self):
        for bad in ("http://example.com/a.mp4", "javascript:alert(1)", "example.com/a.mp4", "https://exa mple.com"):
            self.assertTrue(cb.check_media(self.media(advanced_talk=bad), ["b001"]), bad)

    def test_a_lesson_without_an_entry_is_reported(self):
        self.assertTrue(any("no entry for b002" in e for e in cb.check_media(self.media(), ["b001", "b002"])))

    def test_a_missing_level_is_reported(self):
        m = self.media(); del m["b001"]["intermediate"]
        self.assertTrue(any("no intermediate entry" in e for e in cb.check_media(m, ["b001"])))

    def test_unknown_keys_are_reported(self):
        m = self.media(); m["b001"]["beginner"]["clip"] = ""
        self.assertTrue(any("unknown key" in e for e in cb.check_media(m, ["b001"])))


if __name__ == "__main__":
    unittest.main(verbosity=1)
