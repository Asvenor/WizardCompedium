"""Reproducible, fictional conflicting scalar readings; no player PDF input."""
from pathlib import Path
from reportlab.pdfgen import canvas

output = Path(__file__).resolve().parents[1] / "tests/fixtures/character-import/conflicting-readings.pdf"
c = canvas.Canvas(str(output), pagesize=(612, 792), invariant=1)
c.setTitle("Fictional Character Import Conflict Fixture")
c.setAuthor("Wizard Compendium Test Suite")
c.setFont("Helvetica-Bold", 16)
c.drawString(36, 742, "FICTIONAL CHARACTER IMPORT FIXTURE")
c.setFont("Helvetica", 12)
c.drawString(36, 708, "Character name: Conflict Fixture")
for y, label, value in [(635, "First recorded defense value", 15), (535, "Second recorded defense value", 18)]:
    c.setStrokeColorRGB(0.5, 0.5, 0.5)
    c.rect(36, y - 48, 540, 78)
    c.setFont("Helvetica", 10)
    c.drawString(50, y + 10, label)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(50, y - 20, f"Armor Class: {value}")
c.setFont("Helvetica", 10)
c.drawString(36, 435, "Both readings are intentionally present. Neither is selected automatically.")
c.drawString(36, 414, "This fixture contains fictional data only and no interactive form fields.")
c.save()
print(f"Created {output.name}")
