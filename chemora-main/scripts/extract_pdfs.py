from pathlib import Path
from pdfminer.high_level import extract_text

# point to repository root Data folder (script is in chemora-main/scripts)
DATA_DIR = Path(__file__).resolve().parents[2] / 'Data'
OUT_DIR = DATA_DIR / 'extracted_texts'
OUT_DIR.mkdir(parents=True, exist_ok=True)

pdfs = [p for p in DATA_DIR.glob('*.pdf')]
if not pdfs:
    print('No PDFs found in', DATA_DIR)
    raise SystemExit(1)

for pdf in pdfs:
    print('Extracting', pdf.name)
    try:
        text = extract_text(str(pdf))
    except Exception as e:
        print('Failed to extract', pdf.name, e)
        continue
    out_file = OUT_DIR / (pdf.stem + '.txt')
    out_file.write_text(text, encoding='utf-8')
    print('Wrote', out_file)

print('Done')
