import re
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / 'Data'
EX_DIR = DATA_DIR / 'extracted_texts'
OUT = EX_DIR / 'parsed_reactions.json'

if not EX_DIR.exists():
    print('extracted_texts not found:', EX_DIR)
    raise SystemExit(1)

# Pattern: "N. ...text"
numbered = re.compile(r'^\s*(\d+)\.\s*(.+)$', re.MULTILINE)
# Split on "to form" or similar patterns to find products
to_form = re.compile(r'\s+(?:to form|and|forming)\s+', re.IGNORECASE)
# Keywords that separate reactants and define the reaction type
react_kws = re.compile(r'\s+(?:reacts? with|combines? with|displaces? .+ from|decomposes?|burns?|neutralizes?|oxidizes?|dissolves? in|decomposes to form)\s+', re.IGNORECASE)

results = []
for txt_file in EX_DIR.glob('*.txt'):
    if txt_file.name == 'parsed_reactions.json':
        continue
    print('Parsing', txt_file.name)
    text = txt_file.read_text(encoding='utf-8', errors='replace')
    
    for m in numbered.finditer(text):
        num = m.group(1)
        desc = m.group(2).strip()
        
        # Remove trailing punctuation and line breaks
        desc = desc.rstrip('.;').replace('\n', ' ').strip()
        if not desc or len(desc) > 500:
            continue
        
        # Try to split on "to form" or "and" to find products
        parts = to_form.split(desc)
        if len(parts) < 2:
            continue
        
        left = parts[0].strip()
        right = ' and '.join(parts[1:]).strip()
        
        if not left or not right:
            continue
        
        # Split reactants on "with" or similar
        reactants_raw = re.split(r'\s+(?:with|from|in)\s+', left)
        reactants = [r.strip() for r in reactants_raw if r.strip()]
        
        # Products: split on "and"
        products_raw = re.split(r'\s+and\s+', right)
        products = [p.strip().rstrip('.') for p in products_raw if p.strip()]
        
        if reactants and products:
            results.append({
                'source': txt_file.name,
                'number': int(num),
                'raw_equation': desc,
                'reactants': reactants,
                'products': products
            })

# Dedupe by raw_equation
seen = set()
unique = []
for r in results:
    key = r['raw_equation']
    if key in seen:
        continue
    seen.add(key)
    unique.append(r)

# Sort by source then number
unique.sort(key=lambda x: (x['source'], x['number']))

OUT.write_text(json.dumps(unique, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'Wrote {OUT}')
print(f'Parsed {len(unique)} unique reactions')
