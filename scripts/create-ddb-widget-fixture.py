"""Fictional orphan-widget regression PDF; never reads a player's character PDF."""
from io import BytesIO
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, NameObject, NumberObject, FloatObject, TextStringObject

root = Path(__file__).resolve().parents[1] / "tests/fixtures/character-import"
pages = json.loads((root / "ddb-widgets.json").read_text())
buffer = BytesIO()
c = canvas.Canvas(buffer, pagesize=(612, 792), invariant=1)
for page in pages:
    c.setFont("Helvetica", 9)
    c.drawString(30, 765, "FICTIONAL DDB WIDGET REGRESSION - NO PLAYER DATA")
    for line in page["lines"]:
        c.drawString(line.get("x", 30), line.get("y", 30), line["text"])
    c.showPage()
c.save()
writer = PdfWriter()
reader = PdfReader(buffer)
for i, source in enumerate(reader.pages):
    page = writer.add_page(source)
    annots = ArrayObject()
    for j, widget in enumerate(pages[i]["widgets"]):
        rect = widget.get("rect", [30, 720-j*18, 260, 734-j*18])
        annotation = DictionaryObject({
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): NameObject("/Widget"),
            NameObject("/FT"): NameObject("/Tx"),
            NameObject("/T"): TextStringObject(widget["name"]),
            NameObject("/V"): TextStringObject(widget["value"]),
            NameObject("/Rect"): ArrayObject([FloatObject(n) for n in rect]),
            NameObject("/F"): NumberObject(4),
        })
        annots.append(writer._add_object(annotation))
    page[NameObject("/Annots")] = annots
# Intentionally no /AcroForm in the root: all facts live in page widgets.
with (root / "ddb-widgets.pdf").open("wb") as output:
    writer.write(output)
print("Created one fictional four-page orphan-widget PDF.")
