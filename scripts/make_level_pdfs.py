#!/usr/bin/env python3
"""Make one PDF per level for a batch: the words, the Chinese, the sentence patterns and the story.

  python3 scripts/make_level_pdfs.py content/batches/b001.json            writes docs/pdf/batch-001-beginner.pdf, -intermediate, -advanced
  python3 scripts/make_level_pdfs.py --all

Everything comes from content/batches/bNNN.json and content/translations/bNNN.json, so the PDFs match the app.
Needs Node with the playwright package (NODE_PATH=$(npm root -g)).
"""
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEVELS = ("beginner", "intermediate", "advanced")
LABEL = {"beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced"}
ACCENT = {"beginner": "#0b8f72", "intermediate": "#b36b00", "advanced": "#5a45c8"}
GLANCE = {
    "beginner": [("Sentences", "up to 8 words"), ("Other words", "Level 1 words of the word list"), ("Grammar", "present simple, is and are, can, will")],
    "intermediate": [("Sentences", "up to 12 words"), ("Other words", "Level 1 and 2 words"), ("Grammar", "past simple, going to, and, but, because")],
    "advanced": [("Sentences", "up to 18 words"), ("Other words", "Level 1 to 3 words"), ("Grammar", "when, if, so, although, who, that")],
}
POS = {"n": "noun", "v": "verb", "adj": "adjective", "adv": "adverb", "prep": "preposition", "conj": "conjunction"}
ROWNAME = {"who": "Who", "doWhat": "Action", "when": "When", "where": "Where", "why": "Reason", "what": "What", "how": "How", "extra": "More"}

CSS = """
*{box-sizing:border-box}
body{font-family:Inter,"WenQuanYi Zen Hei","Noto Sans CJK TC",sans-serif;font-size:10pt;line-height:1.5;color:#1b2430;margin:0}
.zh{font-family:"WenQuanYi Zen Hei","Noto Sans CJK TC","Noto Sans TC",Inter,sans-serif}
.kicker{font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);font-weight:700}
h1{font-size:25pt;line-height:1.1;margin:4px 0 4px;letter-spacing:-.02em}
h2{font-size:14pt;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid var(--acc);color:#111a26;break-after:avoid}
h3{font-size:10.5pt;margin:0 0 4px}
p{margin:0 0 6px}.sub{color:#5b6675}
.glance{display:flex;gap:10px;margin:12px 0}.glance div{flex:1;border:1px solid #dfe4ec;border-radius:9px;padding:8px 10px;background:#f7f9fc}
.glance b{display:block;font-size:7.5pt;letter-spacing:.1em;text-transform:uppercase;color:#5b6675}
table{border-collapse:collapse;width:100%;margin:4px 0 10px}th,td{text-align:left;vertical-align:top;padding:4px 8px;border-bottom:1px solid #e6eaf0}
th{font-size:7.5pt;letter-spacing:.09em;text-transform:uppercase;color:#5b6675}
tr{break-inside:avoid}td.n{width:24px;color:#8a94a3}td.w{font-weight:700;width:110px}
.setname{font-weight:700;margin:12px 0 2px;color:var(--acc)}
.block{break-inside:avoid;border:1px solid #dfe4ec;border-radius:11px;padding:9px 13px 10px;margin:0 0 10px}
.block .head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:5px}
.block .head .w{font-size:13pt;font-weight:800}.block .head .m{color:#394557}
.line{display:flex;gap:8px;margin:2px 0}.line .t{width:62px;flex:none;font-size:7.5pt;letter-spacing:.08em;text-transform:uppercase;color:#7a8494;padding-top:2px}
.pattern{display:flex;gap:5px;align-items:stretch;margin:5px 0 4px 70px}
.pattern .plus{align-self:center;color:#9aa4b2;font-weight:700}
.col{border:1px solid #dfe4ec;border-radius:8px;padding:4px 7px;background:#fafbfd;min-width:0}
.col.target{border-color:var(--acc);background:#fff;box-shadow:inset 0 0 0 1px var(--acc)}
.col b{display:block;font-size:6.8pt;letter-spacing:.09em;text-transform:uppercase;color:#7a8494;font-weight:600}
.col span{display:block;font-size:9pt}
.story{break-inside:avoid;margin-bottom:12px}.story p.en{font-size:10.5pt}.story p.zh{font-size:10.5pt;color:#26323f;border-left:3px solid var(--acc);padding-left:10px;margin-top:6px}
mark{background:none;font-weight:800;color:var(--acc)}
.terms{font-size:9pt;color:#394557}
"""


def esc(t):
    return html.escape(t, quote=False)


def en_marked(sentence):
    return re.sub(r"\{([^{}]+)\}", lambda m: f"<mark>{esc(m.group(1))}</mark>", esc(sentence).replace("{", "{").replace("}", "}")) if "{" in sentence else esc(sentence)


def page_html(batch, trans, plan_sets, lvl):
    n = int(batch["id"][1:])
    words = {w["id"]: w for w in batch["words"]}
    extra = trans.get("extraGloss", {})
    h = [f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Batch {n} {LABEL[lvl]}: words, sentence patterns and story</title><style>:root{{--acc:{ACCENT[lvl]}}}{CSS}</style></head><body>"]
    h.append(f"<div class='kicker'>Genesis 6,000 English Words to Know</div><h1>Batch {n} · {LABEL[lvl]}</h1>")
    h.append("<p class='sub'>The 20 words, the sentence patterns, the Chinese and the story for this level, exactly as the students see them in the app. Use these pages to make the video and the conversations, so what you say matches the app.</p>")
    h.append("<div class='glance'>" + "".join(f"<div><b>{esc(a)}</b>{esc(b)}</div>" for a, b in GLANCE[lvl]) + "</div>")
    terms = trans.get("terms", {})
    if terms:
        h.append("<p class='terms'><b>Chinese names and family words used in these pages:</b> " + "; ".join(f"{esc(k)} = <span class='zh'>{esc(v)}</span>" for k, v in terms.items()) + "</p>")

    h.append("<h2>1. The 20 words</h2><p class='sub'>Students meet them in four sets of five. The Chinese meaning is what the app shows when a student taps the word.</p>")
    n_ = 0
    for si, s in enumerate(plan_sets, 1):
        h.append(f"<div class='setname'>Set {si}</div><table><tr><th></th><th>Word</th><th>Type</th><th>中文</th><th>English meaning</th></tr>")
        for wid in s:
            w = words[wid]; n_ += 1
            h.append(f"<tr><td class='n'>{n_}</td><td class='w'>{esc(w['headword'])}</td><td>{POS.get(w['pos'], w['pos'])}</td><td class='zh'>{esc(w['zhTW'])}</td><td>{esc(w['defEN'])}</td></tr>")
        h.append("</table>")

    h.append("<h2>2. Each word in sentences</h2><p class='sub'>For each word: the example sentence, the sentence pattern students build in the Sentence Maker (one tile from each column; the highlighted column holds the word), and two sentences made from the pattern.</p>")
    n_ = 0
    for s in plan_sets:
        for wid in s:
            w = words[wid]; n_ += 1
            frame = w["frames"][lvl]["rows"]
            ex_en = w["examples"][lvl]; ex_zh = trans["examples"][wid][lvl]
            cols = []
            for r in frame:
                tiles = "".join(f"<span>{esc(t)}</span>" for t in r["tiles"])
                cols.append(f"<div class='col{' target' if r.get('target') else ''}'><b>{ROWNAME.get(r['label'], r['label'])}</b>{tiles}</div>")
            pattern = "<div class='plus'>+</div>".join(cols)
            smp = "".join(f"<div class='line'><div class='t'>Sample</div><div>{esc(sm['en'])}<br><span class='zh'>{esc(sm['zh'])}</span></div></div>" for sm in trans["samples"][wid][lvl])
            more = f" <span class='sub'>(also used in sentences: <span class='zh'>{esc('、'.join(extra[wid]))}</span>)</span>" if wid in extra else ""
            h.append(f"<div class='block'><div class='head'><div><span class='w'>{n_}. {esc(w['headword'])}</span> <span class='sub'>{POS.get(w['pos'], w['pos'])}</span></div><div class='m zh'>{esc(w['zhTW'])}{more}</div></div>"
                     f"<div class='line'><div class='t'>Example</div><div>{en_marked(ex_en)}<br><span class='zh'>{esc(ex_zh)}</span></div></div>"
                     f"<div class='pattern'>{pattern}</div>{smp}</div>")

    h.append("<div style='break-before:page'></div><h2 style='margin-top:0'>3. The story</h2><p class='sub'>The story comes in two parts of ten gaps each. Students drag the words into the gaps. Here the words are filled in and shown in colour.</p>")
    for pi, part in enumerate(batch["stories"][lvl]["parts"], 1):
        gaps = {i: g["form"] for i, g in enumerate(part["gaps"], 1)}
        en = re.sub(r"\[\[(\d+)\]\]", lambda m: f"<mark>{esc(gaps[int(m.group(1))])}</mark>", esc(part["text"]).replace("[[", "[[").replace("]]", "]]"))
        rows = "".join(f"<tr><td class='n'>{i}</td><td class='w'>{esc(g['form'])}</td><td class='zh'>{esc(words[g['w']]['zhTW'])}</td></tr>" for i, g in enumerate(part["gaps"], 1))
        h.append(f"<div class='story'><h3>Part {pi} · {esc(part['title'])}</h3><p class='en'>{en}</p><p class='zh'>{esc(trans['stories'][lvl][pi - 1])}</p>"
                 f"<table><tr><th>Gap</th><th>Word in the story</th><th>中文</th></tr>{rows}</table></div>")
    h.append("</body></html>")
    return "".join(h)


def make(batch_path, out_dir):
    batch = json.loads(Path(batch_path).read_text(encoding="utf-8"))
    tpath = ROOT / "content" / "translations" / f"{batch['id']}.json"
    if not tpath.exists():
        raise SystemExit(f"no Chinese translations yet: {tpath}")
    trans = json.loads(tpath.read_text(encoding="utf-8"))
    plan = json.loads((ROOT / "content" / "batches.json").read_text(encoding="utf-8"))
    sets = next(b for b in plan["batches"] if b["id"] == batch["id"])["sets"]
    n = int(batch["id"][1:])
    out_dir.mkdir(parents=True, exist_ok=True)
    jobs = [{"html": page_html(batch, trans, sets, lvl), "pdf": str(out_dir / f"batch-{n:03d}-{lvl}.pdf"),
             "footer": f"Genesis 6,000 English Words to Know · Batch {n} · {LABEL[lvl]}"} for lvl in LEVELS]
    env = dict(os.environ)
    if "NODE_PATH" not in env:
        env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    subprocess.run(["node", str(ROOT / "scripts" / "html_to_pdf.cjs")], input=json.dumps(jobs), text=True, env=env, check=True)


def main(argv):
    out = ROOT / "docs" / "pdf"
    if "--all" in argv:
        for f in sorted((ROOT / "content" / "batches").glob("b*.json")):
            if (ROOT / "content" / "translations" / f.name).exists():
                make(f, out)
        return 0
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    make(args[0], out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
