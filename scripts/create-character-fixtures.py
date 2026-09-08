"""Synthetic D&D Beyond-style layouts. No real player, licensed art, or private PDF."""
from pathlib import Path
from io import BytesIO
import json
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.pdfencrypt import StandardEncryption
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'tests/fixtures/character-import'
OUT.mkdir(parents=True, exist_ok=True)
identity = [
 'Character name: Mira Testweaver', 'Class & Level: Wizard 5', 'Character level: 5',
 'Subclass: Diviner', 'Species: Human', 'Background: Sage', 'Alignment: Neutral Good',
 'Strength: 8', 'Strength modifier: -1', 'Dexterity: 14', 'Constitution: 16',
 'Intelligence: 18', 'Intelligence modifier: +4', 'Wisdom: 12', 'Charisma: 10',
 'Armor Class: 15', 'Current Hit Points: 26', 'Maximum Hit Points: 32',
 'Proficiency bonus: +3', 'Initiative: +2', 'Hit Dice: 5d6', 'Speed: 30 ft.',
 'Arcana: +7 proficient', 'Passive Perception: 11', 'Feats: Alert',
 'Equipment: Spellbook; component pouch', 'Tools: Calligrapher supplies',
 'Languages: Common; Elvish', 'Spellcasting ability: Intelligence',
 'Spell save DC: 15', 'Spell attack bonus: +7', 'Level 1 spell slots: 4 total / 2 remaining',
 'Ruleset: 2024',
]
spells = ['SPELLCASTING', 'Spell: Web | level=2 | class=Wizard | book=yes | prepared=yes',
 'Spell: Shield | level=1 | class=Wizard | book=yes | prepared=yes',
 'Spell: Detect Magic | level=1 | class=Wizard | book=yes | ritual=yes',
 'Cantrip: Mage Hand | class=Wizard | other=yes', 'Spell: Misty Step',
 'Spell: Fireball | level=3 | class=Wizard | scroll=yes']

def text_pdf(name, pages, encryption=None):
 c=canvas.Canvas(str(OUT/name),pagesize=(612,792),encrypt=encryption,invariant=1)
 for i,lines in enumerate(pages):
  c.setFont('Helvetica-Bold',16); c.drawString(36,753,'CHARACTER SHEET - SANITIZED TEST FIXTURE')
  c.setFont('Helvetica',10)
  for row,line in enumerate(lines): c.drawString(36,725-row*19,line)
  c.setFont('Helvetica',8);c.drawString(36,25,f'Fictional test data. D&D Beyond-style export coverage. Page {i+1}')
  c.showPage()
 c.save()

text_pdf('wizard-text.pdf',[identity,spells])
text_pdf('wizard-updated.pdf',[[s.replace('Wizard 5','Wizard 6').replace('level: 5','level: 6').replace('Points: 32','Points: 38') for s in identity],spells+['Spell: Counterspell | level=3 | class=Wizard | book=yes | prepared=yes']])
text_pdf('multiclass.pdf',[[s.replace('Wizard 5','Artificer 1 / Wizard 4').replace('Ruleset: 2024','Ruleset: mixed') for s in identity],spells+['Spell: Cure Wounds | level=1 | class=Artificer | other=yes']])
text_pdf('missing-spells.pdf',[identity])
text_pdf('homebrew-2014.pdf',[[s.replace('Ruleset: 2024','Ruleset: 2014') for s in identity]+['Notes: Homebrew familiar approved by DM'],spells+['Spell: Copper Comet | level=2 | class=Homebrew']])
text_pdf('password.pdf',[identity],StandardEncryption('test-only-password',canPrint=0))
# An actual image-only PDF: the browser must render then run Tesseract, not read text.
image=Image.new('RGB',(1530,1980),'white');draw=ImageDraw.Draw(image)
font_path='/System/Library/Fonts/Supplemental/Arial.ttf'
font=ImageFont.truetype(font_path,30) if Path(font_path).exists() else ImageFont.load_default(size=30)
for i,line in enumerate(identity[:23]): draw.text((80,100+i*65),line,font=font,fill='black')
buffer=BytesIO();image.save(buffer,format='PNG');buffer.seek(0)
c=canvas.Canvas(str(OUT/'wizard-scanned.pdf'),pagesize=(612,792),invariant=1);c.drawImage(ImageReader(buffer),0,0,612,792);c.save()
# Value-above-label and real AcroForm widgets, as in different DDB export generations.
c=canvas.Canvas(str(OUT/'wizard-layout.pdf'),pagesize=(612,792),invariant=1)
c.setFont('Helvetica',12)
for x,y,label,val in [(40,710,'CHARACTER NAME','Mira Testweaver'),(260,710,'CLASS & LEVEL','Wizard 5'),(40,640,'STRENGTH','8'),(200,640,'DEXTERITY','14'),(350,640,'INTELLIGENCE','18'),(40,560,'ARMOR CLASS','15')]:
 c.drawString(x,y+19,val);c.setFont('Helvetica',8);c.drawString(x,y,label);c.setFont('Helvetica',12)
c.acroForm.textfield(name='HPMax',value='32',x=260,y=550,width=70,height=22)
c.drawString(260,535,'HIT POINT MAXIMUM');c.showPage();c.save()
(OUT/'pages.json').write_text(json.dumps({'identity':identity,'spells':spells},indent=2)+'\n')
(OUT/'invalid.pdf').write_bytes(b'Not a PDF despite its extension.')
(OUT/'corrupt.pdf').write_bytes(b'%PDF-1.7\nbroken xref')
print('Created 8 sanitized PDFs plus invalid/corrupt inputs and parser text fixtures.')
