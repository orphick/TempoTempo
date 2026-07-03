from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import re

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "docs" / "generated_report" / "TempoTempo_Persian_Project_Report_RTL_Justified.docx"


def audit_ooxml():
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    persian = re.compile(r"[\u0600-\u06ff]")
    with ZipFile(DOCX) as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    missing_bidi = []
    missing_run_rtl = []
    for idx, p in enumerate(root.findall(".//w:p", ns), start=1):
        text = "".join(t.text or "" for t in p.findall(".//w:t", ns))
        if not text.strip() or not persian.search(text):
            continue
        if p.find("./w:pPr/w:bidi", ns) is None:
            missing_bidi.append(text[:80])
        for r in p.findall("./w:r", ns):
            r_text = "".join(t.text or "" for t in r.findall(".//w:t", ns))
            if persian.search(r_text) and r.find("./w:rPr/w:rtl", ns) is None:
                missing_run_rtl.append(r_text[:80])
                break
    missing_tables = [
        i
        for i, tbl in enumerate(root.findall(".//w:tbl", ns), start=1)
        if tbl.find("./w:tblPr/w:bidiVisual", ns) is None
    ]
    return len(missing_bidi), len(missing_run_rtl), len(missing_tables)


def audit_text():
    doc = Document(DOCX)
    text = "\n".join(p.text for p in doc.paragraphs)
    checks = {
        "فاصله نادرست می": r"می\s+(شود|شوند|کند|کنند|تواند|توانند|توان|گردد)",
        "پیاده سازی": "پیاده سازی",
        "نرم افزار": "نرم افزار",
        "راه اندازی": "راه اندازی",
        "راست به چپ": "راست به چپ",
        "فول استک": "فول استک",
        "حروف عربی ك/ي": r"[كي]",
        "دو فاصله پشت سر هم": r" {2,}",
    }
    return {name: len(re.findall(pattern, text)) for name, pattern in checks.items()}


if __name__ == "__main__":
    missing_bidi, missing_run_rtl, missing_tables = audit_ooxml()
    print(f"missing_bidi={missing_bidi}")
    print(f"missing_run_rtl={missing_run_rtl}")
    print(f"tables_without_bidiVisual={missing_tables}")
    for name, count in audit_text().items():
        safe_name = name.encode("unicode_escape").decode("ascii")
        print(f"{safe_name}={count}")
