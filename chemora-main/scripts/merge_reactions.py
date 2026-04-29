import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / 'Data'
EX_DIR = DATA_DIR / 'extracted_texts'
PARSED = EX_DIR / 'parsed_reactions.json'
REACTIONS_DIR = Path(__file__).resolve().parents[1] / 'src' / 'lib' / 'data' / 'reactions'
OUT = REACTIONS_DIR / 'imported.ts'

if not PARSED.exists():
    print('parsed_reactions.json not found')
    raise SystemExit(1)

with open(PARSED, encoding='utf-8') as f:
    parsed = json.load(f)

print(f'Loaded {len(parsed)} parsed reactions')

# STRICT filtering to only real chemical reactions
# Must have:
# - Simple reactant names (1-3 words each, no "with", no long descriptions)
# - Simple product names (1-3 words each)
# - Contains common chemistry keywords
good_reactions = []
for p in parsed:
    reactants = p['reactants']
    products = p['products']
    raw = p['raw_equation']
    
    # Skip if any component is too long or too complex
    if any(len(r) > 40 for r in reactants) or any(len(pr) > 40 for pr in products):
        continue
    
    # Skip if components have too many words (looking for chemical names, not sentences)
    if any(len(r.split()) > 4 for r in reactants) or any(len(pr.split()) > 4 for pr in products):
        continue
    
    # Skip sentences/processes that aren't chemical reactions
    skip_kws = ['thermal', 'decomposition', 'electrolysis', 'heat', 'steam', 'reforming',
                'absorb', 'evapor', 'melt', 'dissolv', 'exothermic', 'endothermic',
                'requires', 'energy', 'needs', 'input', 'formation', 'process']
    if any(kw in raw.lower() for kw in skip_kws):
        continue
    
    # Must have a chemical action verb
    must_have = ['reacts', 'burns', 'combines', 'forms', 'produces', 'displaces', 'oxidizes',
                 'neutralizes', 'precipitate', 'dissolves']
    if not any(verb in raw.lower() for verb in must_have):
        continue
    
    good_reactions.append({
        'reactants': reactants,
        'products': products,
        'equation': raw,
        'description': raw,
    })

print(f'After filtering: {len(good_reactions)} valid reactions')

# Group by reactant pair to deduplicate - keep first occurrence
seen = {}
unique_reactions = []
for r in good_reactions:
    key = tuple(sorted(r['reactants']))
    if key not in seen:
        seen[key] = True
        unique_reactions.append(r)

print(f'After deduplication: {len(unique_reactions)} unique reactant pairs')

# Limit to top 50 to avoid memory issues
unique_reactions = unique_reactions[:50]

# Generate TypeScript with compact formatting
ts_lines = [
    '// Auto-generated reactions from PDF import (filtered & deduplicated)',
    '// Data source: Virtual Lab Reaction Corpus and Endothermic Substances datasets',
    '',
    'import { Reaction } from "@/lib/schemas/reaction";',
    '',
    'export const IMPORTED_REACTIONS: Reaction[] = [',
]

for r in unique_reactions:
    r_json = json.dumps(r['reactants'], ensure_ascii=False)
    p_json = json.dumps(r['products'], ensure_ascii=False)
    e_json = json.dumps(r['equation'], ensure_ascii=False)
    
    ts_lines.append(f'  {{ reactants: {r_json}, products: {p_json}, equation: {e_json}, effect: "color-change", description: {e_json}, intensity: 3, enthalpyChange: -50, isExothermic: true, temperatureChange: 15, heatReleased: 50 }},')

ts_lines.append('];')

ts_code = '\n'.join(ts_lines)
OUT.write_text(ts_code, encoding='utf-8')
print(f'Wrote {OUT}')
print(f'Generated {len(unique_reactions)} TypeScript Reaction objects')
