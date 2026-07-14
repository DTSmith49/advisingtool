#!/usr/bin/env python3
import json, os, sys
from supabase import create_client

SUPABASE_URL      = "https://ftjmflybfyhkkdirsaxx.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or sys.exit("ERROR: Set SUPABASE_SERVICE_KEY")
ADVISING_INDEX_ID = "0cefd326-971c-4cd5-ad4e-2ffe0e39aee0"

DOMAIN_MAP = {
    "HCI, Design & Games":         "HCI & Design",
    "Data, AI & Technology":       "Data & Technology",
    "Library, Archives & Culture": "Library, Archives & Culture",
    "Policy, Ethics & Society":    "Policy, Ethics & Society",
    "Archives & Museum":           "Accessibility & Inclusive Design",
    "Research & Capstone":         "Research & Capstone",
    "Custom / Other":              "Other",
}

FIT_TAGS = {
    "INST728X": ["design thinking", "UX", "product development", "innovation"],
    "INST728E": ["user experience", "evaluation", "usability testing"],
    "INST728F": ["information architecture", "wireframing", "content design"],
    "INST728A": ["advanced HCI", "research methods", "interaction design"],
    "INST728N": ["natural user interfaces", "multimodal interaction"],
    "INST710":  ["human-computer interaction", "design research"],
    "INST711":  ["UX research", "usability", "user-centered design"],
    "INST713":  ["design methods", "prototyping", "visual communication"],
    "INST725":  ["game design", "interactive media", "engagement"],
    "INST726":  ["social computing", "collaborative technology"],
    "INST627":  ["data analytics", "Python", "programming"],
    "INST630":  ["database design", "SQL", "information systems"],
    "INST631":  ["web development", "front-end", "HTML CSS JS"],
    "INST737":  ["machine learning", "AI applications", "data science"],
    "INST735":  ["data visualization", "storytelling with data", "dashboards"],
    "INST742":  ["natural language processing", "text analysis"],
    "INST750":  ["cybersecurity", "privacy", "digital safety"],
    "INST752":  ["network analysis", "social networks", "graph data"],
    "INST754":  ["geospatial data", "GIS", "mapping"],
    "INST612":  ["information policy", "law", "governance"],
    "INST613":  ["ethics", "privacy", "responsible AI"],
    "INST614":  ["health informatics", "medical records", "policy"],
    "INST615":  ["digital equity", "inclusion", "access"],
    "INST616":  ["knowledge management", "organizational learning"],
    "INST782":  ["accessibility", "disability studies", "inclusive design"],
    "INST784":  ["universal design", "assistive technology", "WCAG"],
    "INST785":  ["diverse populations", "equity", "cultural humility"],
    "INST786":  ["disability and information", "ableism", "advocacy"],
    "INST702":  ["research methods", "qualitative", "literature review"],
    "INST703":  ["survey research", "quantitative methods", "statistics"],
    "INST704":  ["ethnography", "qualitative research", "fieldwork"],
    "INST705":  ["research design", "mixed methods"],
}

SKIP_IDS = {"INST799","INST800","INST801","INST802","INST808",
            "INST878","INST878F","INST878V","INST878Z",
            "INST820","INST821","INST828","INST832"}

def build_content(c):
    return "\n".join(p for p in [
        c["id"], c["title"], c.get("desc",""),
        " ".join(c.get("tags",[])),
        " ".join(c.get("domains",[])),
        " ".join(FIT_TAGS.get(c["id"],[])),
    ] if p)

def map_domain(domains):
    return DOMAIN_MAP.get(domains[0], domains[0]) if domains else None

def infer_program(c):
    if c["id"].startswith("INFM"): return "MIM"
    if "HCI, Design & Games" in c.get("domains",[]): return "HCIM"
    return "MIM"

def main():
    catalog_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "course_catalog.json"))
    if not os.path.exists(catalog_path):
        sys.exit(f"ERROR: course_catalog.json not found at {catalog_path}")

    catalog = json.load(open(catalog_path))
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    sources = sb.table("knowledge_sources").select("id,metadata").eq("index_id", ADVISING_INDEX_ID).execute()
    source_map = {(s.get("metadata") or {}).get("program"): s["id"] for s in (sources.data or [])}
    fallback = (sources.data or [{}])[0].get("id")
    if not fallback:
        sys.exit("ERROR: No knowledge_sources found for this index.")
    print(f"Sources found: {source_map} | fallback: {fallback}\n")

    inserted = skipped = errors = 0
    for c in catalog:
        cid = c.get("id","")
        if cid in SKIP_IDS or not c.get("desc") or not c.get("title"):
            skipped += 1; continue

        program = infer_program(c)
        domain  = map_domain(c.get("domains",[]))
        fit     = FIT_TAGS.get(cid, c.get("tags",[]))

        try:
            r = sb.table("knowledge_sections").insert({
                "index_id":  ADVISING_INDEX_ID,
                "source_id": source_map.get(program, fallback),
                "heading":   f"{cid}: {c['title']}",
                "content":   build_content(c),
                "metadata":  {
                    "program":       program,
                    "category":      "course",
                    "source_type":   "Course Description",
                    "course_number": cid,
                    "course_title":  c["title"],
                    "credits":       c.get("credits", 3),
                    "term_offered":  c.get("term","Both"),
                    "domain":        domain,
                    "domains_raw":   c.get("domains",[]),
                    "good_fit_for":  fit,
                },
            }).execute()
            if r.data:
                inserted += 1
                print(f"  ✓ {cid}: {c['title'][:60]}")
            else:
                errors += 1
                print(f"  ✗ {cid}: no data returned")
        except Exception as e:
            errors += 1
            print(f"  ✗ {cid}: {e}")

    print(f"\n{'='*50}")
    print(f"Done. Inserted: {inserted} | Skipped: {skipped} | Errors: {errors}")

if __name__ == "__main__":
    main()
