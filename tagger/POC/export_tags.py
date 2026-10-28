#!/usr/bin/env python3
"""
Export one or more tagger SQLite DBs (from tag_images.py) in a human-readable form,
and compare models side by side. Standard library only, so it runs on the host.

Examples:
    # browse one model's output, with image previews
    python export_tags.py scores_wd-eva02-large-tagger-v3.sqlite --local-root /home/me/pictures

    # compare two models on 50 random images (same images for both, picked from those both processed)
    python export_tags.py scores_a.sqlite scores_b.sqlite --sample 50 --local-root /home/me/pictures

    # plain text or JSON instead of HTML
    python export_tags.py scores_a.sqlite scores_b.sqlite --format txt
    python export_tags.py scores_a.sqlite --format json -o tags.json

Tip: to get identical image sets, run each tagger with the same --limit (images are processed
in sorted path order), or use --sample/--contains here, which only use images present in ALL DBs.
"""
import argparse
import html
import json
import random
import sqlite3
import statistics
from pathlib import Path

COLORS = ["#2b8a3e", "#c92a2a", "#1971c2", "#e67700", "#7048e8", "#0c8599"]


def label_from(path):
    n = Path(path).stem
    return n[len("scores_"):] if n.startswith("scores_") else n


def norm(tag):
    return tag.replace("_", " ").lower()


def per_db(value, n, ap, name):
    """'0.35' -> same value for every DB; '0.35,0.4' -> one value per DB."""
    vals = [float(v) for v in str(value).split(",")]
    if len(vals) == 1:
        vals = vals * n
    if len(vals) != n:
        ap.error(f"{name} needs one value, or one comma-separated value per DB")
    return vals


def db_paths(db):
    return {r[0] for r in db.execute("SELECT path FROM images WHERE ok=1")}


def load(db, paths, gth, cth):
    """-> {path: {"rating": (name, score) | None, "tags": {tag: score}, "chars": {tag: score}}}"""
    out = {}
    paths = list(paths)
    for i in range(0, len(paths), 500):
        chunk = paths[i:i + 500]
        for p in chunk:
            out[p] = {"rating": None, "tags": {}, "chars": {}}
        q = ",".join("?" * len(chunk))
        rows = db.execute(
            f"""SELECT i.path, t.name, t.category, s.score
                FROM images i JOIN scores s ON s.image_id = i.id
                JOIN tags t ON t.tag_id = s.tag_id
                WHERE i.path IN ({q})""",
            chunk,
        )
        for p, name, cat, score in rows:
            d = out[p]
            if cat == 9:  # rating: keep only the top one
                if d["rating"] is None or score > d["rating"][1]:
                    d["rating"] = (norm(name), score)
            elif cat == 4:
                if score >= cth:
                    d["chars"][norm(name)] = score
            elif score >= gth:
                d["tags"][norm(name)] = score
    return out


def tagset(d):
    return set(d["tags"]) | set(d["chars"])


def sorted_items(d):
    items = [(t, s, True) for t, s in d["chars"].items()] + [(t, s, False) for t, s in d["tags"].items()]
    return sorted(items, key=lambda x: (not x[2], -x[1]))  # characters first, then by score


def rel(path, db_root):
    return path[len(db_root):].lstrip("/") if path.startswith(db_root) else path


def local_path(path, db_root, local_root):
    if local_root and path.startswith(db_root):
        return str(Path(local_root) / path[len(db_root):].lstrip("/"))
    return path


def agreement(sets):
    """sets: {label: set}. -> shared (in all), only {label: set} (in exactly that one)."""
    labels = list(sets)
    shared = set.intersection(*sets.values()) if sets else set()
    only = {}
    for lab in labels:
        others = set().union(*[sets[o] for o in labels if o != lab]) if len(labels) > 1 else set()
        only[lab] = sets[lab] - others
    return shared, only


def summary(labels, data, paths):
    lines = []
    for lab in labels:
        n = [len(tagset(data[lab][p])) for p in paths]
        lines.append(f"{lab}: {statistics.mean(n):.1f} tags/image on average ({len(paths)} images)")
    for i in range(len(labels)):
        for j in range(i + 1, len(labels)):
            js = []
            for p in paths:
                a, b = tagset(data[labels[i]][p]), tagset(data[labels[j]][p])
                js.append(len(a & b) / len(a | b) if a | b else 1.0)
            lines.append(f"agreement {labels[i]} vs {labels[j]}: mean Jaccard {statistics.mean(js):.2f}")
    return lines


def render_html(labels, data, paths, args, stats):
    e = html.escape
    css = [
        ":root{color-scheme:light dark}",
        "body{font-family:system-ui,sans-serif;margin:16px;max-width:1500px}",
        ".card{display:flex;flex-wrap:wrap;gap:16px;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:12px;margin:14px 0}",
        ".img{width:340px}.img img{max-width:340px;max-height:340px;display:block;object-fit:contain}",
        ".path{font-size:11px;opacity:.7;word-break:break-all;margin-top:4px}",
        ".m{flex:1;min-width:260px}.m h4{margin:0 0 6px}",
        ".chip{display:inline-block;margin:2px;padding:1px 7px;border-radius:10px;font-size:12px;background:rgba(128,128,128,.2)}",
        ".chr{font-weight:600}.some{outline:1px dashed rgba(128,128,128,.8)}",
        ".legend span{margin-right:10px}",
    ]
    for i, c in enumerate(COLORS):
        css.append(f".u{i}{{background:{c}66}}")
    parts = [
        "<!doctype html><meta charset=utf-8><title>Tag comparison</title>",
        f"<style>{''.join(css)}</style>",
        "<h1>Tag comparison</h1><pre>" + e("\n".join(stats)) + "</pre>",
        "<p>Thresholds (general / character): "
        + "; ".join(f"{e(l)} {g} / {c}" for l, g, c in zip(labels, args.gths, args.cths))
        + ".</p>",
    ]
    if len(labels) > 1:
        leg = ["<span class=chip>in all models</span>"] + [
            f"<span class='chip u{i % len(COLORS)}'>only {e(lab)}</span>" for i, lab in enumerate(labels)
        ]
        parts.append("<div class=legend>" + "".join(leg) + "</div>")
    for p in paths:
        uri = Path(local_path(p, args.db_root, args.local_root)).as_uri()
        sets = {lab: tagset(data[lab][p]) for lab in labels}
        shared, only = agreement(sets)
        parts.append(
            f"<div class=card><div class=img><a href='{e(uri)}'><img loading=lazy src='{e(uri)}'></a>"
            f"<div class=path>{e(rel(p, args.db_root))}</div></div>"
        )
        for i, lab in enumerate(labels):
            d = data[lab][p]
            r = f" · rating: {e(d['rating'][0])} ({d['rating'][1]:.2f})" if d["rating"] else ""
            parts.append(f"<div class=m><h4>{e(lab)} <small>({len(sets[lab])}){r}</small></h4>")
            for t, s, is_char in sorted_items(d):
                cls = ["chip"]
                if is_char:
                    cls.append("chr")
                if len(labels) > 1 and t not in shared:
                    cls.append(f"u{i % len(COLORS)}" if t in only[lab] else "some")
                parts.append(f"<span class='{' '.join(cls)}' title='{s:.3f}'>{e(t)}</span>")
            parts.append("</div>")
        parts.append("</div>")
    return "\n".join(parts)


def render_txt(labels, data, paths, args, stats):
    out = ["\n".join(stats), f"(* = tag not found by every model)", ""]
    for p in paths:
        out.append("=" * 80)
        out.append(rel(p, args.db_root))
        sets = {lab: tagset(data[lab][p]) for lab in labels}
        shared, _ = agreement(sets)
        for lab in labels:
            d = data[lab][p]
            r = f"  rating: {d['rating'][0]} ({d['rating'][1]:.2f})" if d["rating"] else ""
            out.append(f"\n[{lab}] {len(sets[lab])} tags{r}")
            for t, s, is_char in sorted_items(d):
                mark = "*" if len(labels) > 1 and t not in shared else " "
                out.append(f"  {mark} {t:<40} {s:.2f}{'  (character)' if is_char else ''}")
        out.append("")
    return "\n".join(out)


def render_json(labels, data, paths, args, stats):
    res = {"summary": stats, "images": []}
    for p in paths:
        sets = {lab: tagset(data[lab][p]) for lab in labels}
        entry = {"path": rel(p, args.db_root), "models": {}}
        for lab in labels:
            d = data[lab][p]
            entry["models"][lab] = {
                "rating": {"name": d["rating"][0], "score": round(d["rating"][1], 4)} if d["rating"] else None,
                "tags": {t: round(s, 4) for t, s, c in sorted_items(d) if not c},
                "characters": {t: round(s, 4) for t, s, c in sorted_items(d) if c},
            }
        if len(labels) > 1:
            shared, only = agreement(sets)
            entry["agreement"] = {"shared": sorted(shared), "only": {k: sorted(v) for k, v in only.items()}}
        res["images"].append(entry)
    return json.dumps(res, indent=2, ensure_ascii=False)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dbs", nargs="+", help="one or more SQLite DBs from tag_images.py")
    ap.add_argument("--labels", help="comma-separated display names (default: from filenames)")
    ap.add_argument("--format", choices=["html", "txt", "json"], default="html")
    ap.add_argument("-o", "--output")
    ap.add_argument("--general-threshold", default="0.35",
                    help="one value, or comma-separated one per DB (e.g. 0.35,0.4)")
    ap.add_argument("--character-threshold", default="0.85",
                    help="one value, or comma-separated one per DB")
    ap.add_argument("--contains", help="only images whose path contains this text")
    ap.add_argument("--sample", type=int, default=0, help="random sample of N images")
    ap.add_argument("--limit", type=int, default=0, help="first N images (sorted by path)")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--db-root", default="/images", help="library path as stored in the DB")
    ap.add_argument("--local-root", help="where that library lives on this machine (for previews)")
    args = ap.parse_args()

    labels = args.labels.split(",") if args.labels else [label_from(d) for d in args.dbs]
    if len(labels) != len(args.dbs):
        ap.error("--labels must have one name per DB")
    dbs = [sqlite3.connect(d) for d in args.dbs]

    common = set.intersection(*[db_paths(d) for d in dbs])
    if args.contains:
        common = {p for p in common if args.contains in p}
    paths = sorted(common)
    if args.sample:
        paths = sorted(random.Random(args.seed).sample(paths, min(args.sample, len(paths))))
    elif args.limit:
        paths = paths[: args.limit]
    if not paths:
        raise SystemExit("No images present in all DBs with these filters.")

    args.gths = per_db(args.general_threshold, len(dbs), ap, "--general-threshold")
    args.cths = per_db(args.character_threshold, len(dbs), ap, "--character-threshold")
    data = {lab: load(db, paths, g, c) for lab, db, g, c in zip(labels, dbs, args.gths, args.cths)}
    stats = summary(labels, data, paths)
    render = {"html": render_html, "txt": render_txt, "json": render_json}[args.format]
    text = render(labels, data, paths, args, stats)
    out = args.output or f"compare.{args.format}"
    Path(out).write_text(text, encoding="utf-8")
    print("\n".join(stats))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
