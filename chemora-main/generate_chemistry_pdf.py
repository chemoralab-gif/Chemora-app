import json
import os
from datetime import datetime

# SimplePDF class for creating PDFs without external dependencies
class SimplePDF:
    def __init__(self):
        self.objects = []
        self.pages = []
        self.current_page_content = []
        self.y_position = 750
        self.page_num = 0
        self.font_size = 10
        self.line_height = 14
        self.margin_left = 50
        self.margin_right = 545
        self.page_width = 595
        self.page_height = 842

    def _escape(self, text):
        """Escape special PDF characters"""
        if not isinstance(text, str):
            text = str(text)
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def add_title(self, text):
        """Add a main title"""
        if self.y_position < 100:
            self.new_page()
        self.current_page_content.append(f"BT /F1 18 Tf {self.margin_left} {self.y_position} Td ({self._escape(text)}) Tj ET")
        self.y_position -= 28

    def add_subtitle(self, text):
        """Add a subtitle"""
        if self.y_position < 100:
            self.new_page()
        self.current_page_content.append(f"BT /F1 13 Tf {self.margin_left} {self.y_position} Td ({self._escape(text)}) Tj ET")
        self.y_position -= 20

    def add_section(self, text):
        """Add a section header"""
        if self.y_position < 100:
            self.new_page()
        self.y_position -= 8
        self.current_page_content.append(f"BT /F1 11 Tf {self.margin_left} {self.y_position} Td ({self._escape(text)}) Tj ET")
        self.y_position -= 18

    def add_line(self, text, indent=0):
        """Add a regular line of text"""
        if self.y_position < 60:
            self.new_page()
        x = self.margin_left + indent
        # Truncate very long lines
        if len(text) > 95:
            text = text[:92] + "..."
        self.current_page_content.append(f"BT /F2 8 Tf {x} {self.y_position} Td ({self._escape(text)}) Tj ET")
        self.y_position -= 11

    def add_reaction_line(self, text, indent=0):
        """Add a reaction line (smaller font)"""
        if self.y_position < 60:
            self.new_page()
        x = self.margin_left + indent
        if len(text) > 100:
            text = text[:97] + "..."
        self.current_page_content.append(f"BT /F2 7.5 Tf {x} {self.y_position} Td ({self._escape(text)}) Tj ET")
        self.y_position -= 10

    def add_spacer(self, height=10):
        """Add vertical spacing"""
        self.y_position -= height

    def new_page(self):
        """Create a new page"""
        if self.current_page_content:
            self.pages.append(self.current_page_content)
        self.current_page_content = []
        self.y_position = 780
        self.page_num += 1

    def save(self, filename):
        """Save the PDF to a file"""
        if self.current_page_content:
            self.pages.append(self.current_page_content)

        pdf_content = []
        pdf_content.append("%PDF-1.4")
        
        # Create objects for each page
        object_offsets = []
        current_offset = len('\n'.join(pdf_content)) + 1
        
        object_offsets.append(current_offset)
        pdf_content.append("1 0 obj")
        pdf_content.append("<< /Type /Catalog /Pages 2 0 R >>")
        pdf_content.append("endobj")
        
        current_offset = sum(len(line) + 1 for line in pdf_content)
        object_offsets.append(current_offset)
        pdf_content.append(f"2 0 obj")
        pdf_content.append(f"<< /Type /Pages /Kids [")
        for i in range(len(self.pages)):
            pdf_content.append(f"{3 + i} 0 R ")
        pdf_content.append(f"] /Count {len(self.pages)} >>")
        pdf_content.append("endobj")
        
        # Pages and content streams
        page_num = 3
        for page_idx, page in enumerate(self.pages):
            current_offset = sum(len(line) + 1 for line in pdf_content)
            object_offsets.append(current_offset)
            
            # Content stream
            content_stream = "\n".join(page)
            content_obj = page_num + len(self.pages)
            
            pdf_content.append(f"{page_num} 0 obj")
            pdf_content.append("<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> /MediaBox [0 0 595 842] /Contents {0} 0 R >>".format(content_obj))
            pdf_content.append("endobj")
            
            current_offset = sum(len(line) + 1 for line in pdf_content)
            object_offsets.append(current_offset)
            
            pdf_content.append(f"{content_obj} 0 obj")
            pdf_content.append(f"<< /Length {len(content_stream)} >>")
            pdf_content.append("stream")
            pdf_content.append(content_stream)
            pdf_content.append("endstream")
            pdf_content.append("endobj")
            
            page_num += 1
        
        # Xref table
        xref_offset = sum(len(line) + 1 for line in pdf_content)
        pdf_content.append("xref")
        pdf_content.append(f"0 {len(object_offsets) + 1}")
        pdf_content.append("0000000000 65535 f")
        for offset in object_offsets:
            pdf_content.append(f"{offset:010d} 00000 n")
        
        pdf_content.append("trailer")
        pdf_content.append(f"<< /Size {len(object_offsets) + 1} /Root 1 0 R >>")
        pdf_content.append("startxref")
        pdf_content.append(str(xref_offset))
        pdf_content.append("%%EOF")
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(pdf_content))
        
        print(f"PDF saved to {filename}")


# Chemistry Data - Elements and Compounds
ELEMENTS = [
    {"symbol": "H", "name": "Hydrogen", "atomic_num": 1, "mass": 1.008, "category": "nonmetal"},
    {"symbol": "C", "name": "Carbon", "atomic_num": 6, "mass": 12.01, "category": "nonmetal"},
    {"symbol": "N", "name": "Nitrogen", "atomic_num": 7, "mass": 14.01, "category": "nonmetal"},
    {"symbol": "O", "name": "Oxygen", "atomic_num": 8, "mass": 16.00, "category": "nonmetal"},
    {"symbol": "S", "name": "Sulfur", "atomic_num": 16, "mass": 32.07, "category": "nonmetal"},
    {"symbol": "P", "name": "Phosphorus", "atomic_num": 15, "mass": 30.97, "category": "nonmetal"},
    {"symbol": "Fe", "name": "Iron", "atomic_num": 26, "mass": 55.85, "category": "metal"},
    {"symbol": "Cu", "name": "Copper", "atomic_num": 29, "mass": 63.55, "category": "metal"},
    {"symbol": "Zn", "name": "Zinc", "atomic_num": 30, "mass": 65.39, "category": "metal"},
    {"symbol": "Al", "name": "Aluminum", "atomic_num": 13, "mass": 26.98, "category": "metal"},
    {"symbol": "Na", "name": "Sodium", "atomic_num": 11, "mass": 22.99, "category": "metal"},
    {"symbol": "K", "name": "Potassium", "atomic_num": 19, "mass": 39.10, "category": "metal"},
    {"symbol": "Ca", "name": "Calcium", "atomic_num": 20, "mass": 40.08, "category": "metal"},
    {"symbol": "Mg", "name": "Magnesium", "atomic_num": 12, "mass": 24.31, "category": "metal"},
    {"symbol": "Cl", "name": "Chlorine", "atomic_num": 17, "mass": 35.45, "category": "nonmetal"},
    {"symbol": "Br", "name": "Bromine", "atomic_num": 35, "mass": 79.90, "category": "nonmetal"},
    {"symbol": "I", "name": "Iodine", "atomic_num": 53, "mass": 126.90, "category": "nonmetal"},
    {"symbol": "Au", "name": "Gold", "atomic_num": 79, "mass": 196.97, "category": "metal"},
    {"symbol": "Ag", "name": "Silver", "atomic_num": 47, "mass": 107.87, "category": "metal"},
    {"symbol": "Pt", "name": "Platinum", "atomic_num": 78, "mass": 195.08, "category": "metal"},
]

COMPOUNDS = [
    {"formula": "H2O", "name": "Water", "type": "oxide"},
    {"formula": "CO2", "name": "Carbon Dioxide", "type": "oxide"},
    {"formula": "NaCl", "name": "Sodium Chloride", "type": "salt"},
    {"formula": "HCl", "name": "Hydrochloric Acid", "type": "acid"},
    {"formula": "H2SO4", "name": "Sulfuric Acid", "type": "acid"},
    {"formula": "HNO3", "name": "Nitric Acid", "type": "acid"},
    {"formula": "NaOH", "name": "Sodium Hydroxide", "type": "base"},
    {"formula": "KOH", "name": "Potassium Hydroxide", "type": "base"},
    {"formula": "NH3", "name": "Ammonia", "type": "base"},
    {"formula": "CuSO4", "name": "Copper Sulfate", "type": "salt"},
    {"formula": "FeCl3", "name": "Iron(III) Chloride", "type": "salt"},
    {"formula": "AgNO3", "name": "Silver Nitrate", "type": "salt"},
]

REACTIONS_THERMAL = [
    {"reactants": ["K", "H2O"], "equation": "2K + 2H2O -> 2KOH + H2", "enthalpy": "-393 kJ/mol", "temp_change": "~150C", "type": "explosion"},
    {"reactants": ["Na", "H2O"], "equation": "2Na + 2H2O -> 2NaOH + H2", "enthalpy": "-368 kJ/mol", "temp_change": "~130C", "type": "fire"},
    {"reactants": ["Mg", "HCl"], "equation": "Mg + 2HCl -> MgCl2 + H2", "enthalpy": "-99 kJ/mol", "temp_change": "~35C", "type": "bubbles"},
    {"reactants": ["Zn", "HCl"], "equation": "Zn + 2HCl -> ZnCl2 + H2", "enthalpy": "-102 kJ/mol", "temp_change": "~38C", "type": "fizz"},
    {"reactants": ["Fe", "O2"], "equation": "4Fe + 3O2 -> 2Fe2O3", "enthalpy": "-1648 kJ/mol", "temp_change": "~85C", "type": "rust"},
    {"reactants": ["Mg", "O2"], "equation": "2Mg + O2 -> 2MgO", "enthalpy": "-1204 kJ/mol", "temp_change": "~200C", "type": "fire"},
    {"reactants": ["H2", "O2"], "equation": "2H2 + O2 -> 2H2O", "enthalpy": "-285 kJ/mol", "temp_change": "~280C", "type": "explosion"},
    {"reactants": ["C", "O2"], "equation": "C + O2 -> CO2", "enthalpy": "-393 kJ/mol", "temp_change": "~85C", "type": "fire"},
    {"reactants": ["NaOH", "HCl"], "equation": "NaOH + HCl -> NaCl + H2O", "enthalpy": "-57 kJ/mol", "temp_change": "~8C", "type": "neutralization"},
    {"reactants": ["NaHCO3", "CH3COOH"], "equation": "NaHCO3 + CH3COOH -> NaCH3COO + H2O + CO2", "enthalpy": "-56 kJ/mol", "temp_change": "~12C", "type": "fizz"},
]

def generate_chemistry_pdf():
    """Generate comprehensive chemistry simulator PDF"""
    pdf = SimplePDF()
    
    # Title Page
    pdf.add_title("Chemistry Simulator")
    pdf.add_subtitle("Complete Reference Guide")
    pdf.add_spacer(10)
    pdf.add_line(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    pdf.add_line("Features: Elements | Compounds | Reactions | Thermal Analysis")
    
    pdf.add_spacer(20)
    pdf.add_section("Document Overview")
    pdf.add_line("This PDF contains a comprehensive reference for the Chemistry Simulator including:")
    pdf.add_line("• All chemical elements with atomic properties", 15)
    pdf.add_line("• Common compounds and their formulas", 15)
    pdf.add_line("• Reaction data with thermal properties", 15)
    pdf.add_line("• Enthalpy changes (H) and temperature changes (T)", 15)
    pdf.add_line("• Classification of exothermic and endothermic reactions", 15)
    
    pdf.add_spacer(15)
    pdf.add_line(f"Total Elements: {len(ELEMENTS)}")
    pdf.add_line(f"Total Compounds: {len(COMPOUNDS)}")
    pdf.add_line(f"Total Reactions: {len(REACTIONS_THERMAL)}")
    
    # Elements Section
    pdf.new_page()
    pdf.add_title("Chemical Elements")
    pdf.add_spacer(10)
    
    # Group elements by category
    metals = [e for e in ELEMENTS if e['category'] == 'metal']
    nonmetals = [e for e in ELEMENTS if e['category'] == 'nonmetal']
    
    pdf.add_section("Metals")
    for elem in metals:
        info = f"{elem['symbol']} - {elem['name']} | Atomic #: {elem['atomic_num']} | Mass: {elem['mass']}"
        pdf.add_line(info, 15)
    
    pdf.add_spacer(5)
    pdf.add_section("Non-Metals")
    for elem in nonmetals:
        info = f"{elem['symbol']} - {elem['name']} | Atomic #: {elem['atomic_num']} | Mass: {elem['mass']}"
        pdf.add_line(info, 15)
    
    # Compounds Section
    pdf.new_page()
    pdf.add_title("Chemical Compounds")
    pdf.add_spacer(10)
    
    # Group by type
    for compound in COMPOUNDS:
        info = f"{compound['formula']} ({compound['name']}) [{compound['type'].upper()}]"
        pdf.add_line(info, 15)
    
    # Reactions Section
    pdf.new_page()
    pdf.add_title("Chemical Reactions - Thermal Data")
    pdf.add_spacer(10)
    
    # High energy reactions
    high_energy = [r for r in REACTIONS_THERMAL if r['type'] in ['explosion', 'fire']]
    pdf.add_section("High Energy Reactions (Exothermic)")
    for rxn in high_energy:
        reactants = " + ".join(rxn['reactants'])
        pdf.add_reaction_line(f"Reaction: {reactants}", 15)
        pdf.add_reaction_line(f"Equation: {rxn['equation']}", 20)
        pdf.add_reaction_line(f"H = {rxn['enthalpy']} | T = {rxn['temp_change']}", 20)
        pdf.add_spacer(2)
    
    # Medium energy reactions
    pdf.add_section("Medium Energy Reactions")
    medium_energy = [r for r in REACTIONS_THERMAL if r['type'] in ['bubbles', 'fizz']]
    for rxn in medium_energy:
        reactants = " + ".join(rxn['reactants'])
        pdf.add_reaction_line(f"Reaction: {reactants}", 15)
        pdf.add_reaction_line(f"Equation: {rxn['equation']}", 20)
        pdf.add_reaction_line(f"H = {rxn['enthalpy']} | T = {rxn['temp_change']}", 20)
        pdf.add_spacer(2)
    
    # Other reactions
    pdf.new_page()
    pdf.add_section("Other Reactions")
    other_rxn = [r for r in REACTIONS_THERMAL if r['type'] not in ['explosion', 'fire', 'bubbles', 'fizz']]
    for rxn in other_rxn:
        reactants = " + ".join(rxn['reactants'])
        pdf.add_reaction_line(f"Reaction: {reactants}", 15)
        pdf.add_reaction_line(f"Equation: {rxn['equation']}", 20)
        pdf.add_reaction_line(f"H = {rxn['enthalpy']} | T = {rxn['temp_change']}", 20)
        pdf.add_spacer(2)
    
    # Reference Page
    pdf.new_page()
    pdf.add_title("Thermal Reference")
    pdf.add_spacer(10)
    
    pdf.add_section("Key Thermal Concepts")
    pdf.add_line("Exothermic Reaction: Releases heat to surroundings (H < 0)", 15)
    pdf.add_line("Endothermic Reaction: Absorbs heat from surroundings (H > 0)", 15)
    pdf.add_line("Enthalpy Change (H): Heat energy change per mole", 15)
    pdf.add_line("Temperature Change (T): Predicted temperature increase/decrease", 15)
    
    pdf.add_spacer(10)
    pdf.add_section("Energy Classifications")
    pdf.add_line("High Energy: T > 100C | Violent reactions (explosions, intense fires)", 15)
    pdf.add_line("Medium Energy: 40C < T <= 100C | Vigorous reactions with significant heat", 15)
    pdf.add_line("Low Energy: 0C < T <= 40C | Mild reactions with gentle heat release", 15)
    pdf.add_line("No Energy: T = 0C | No reaction or color-change only", 15)
    
    pdf.add_spacer(10)
    pdf.add_section("Chemistry Simulator Features")
    pdf.add_line("Real-time thermal simulation with accurate calculations", 15)
    pdf.add_line("Interactive reaction visualization", 15)
    pdf.add_line("Laboratory apparatus simulation", 15)
    pdf.add_line("Educational calorimetry experiments", 15)
    
    pdf.add_spacer(15)
    pdf.add_section("Statistics")
    total_elements = len(ELEMENTS)
    total_compounds = len(COMPOUNDS)
    total_reactions = len(REACTIONS_THERMAL)
    exothermic = sum(1 for r in REACTIONS_THERMAL if r['type'] in ['explosion', 'fire', 'bubbles', 'fizz'])
    
    pdf.add_line(f"Total Chemical Substances: {total_elements + total_compounds}", 15)
    pdf.add_line(f"Combinatorial space: >10^20", 15)
    pdf.add_line(f"Exothermic Reactions Documented: {exothermic}/{total_reactions}", 15)
    
    # Save PDF
    output_path = "Chemistry_Simulator_Reference.pdf"
    pdf.save(output_path)
    print(f"\nPDF Generation Complete!")
    print(f"File: {output_path}")
    print(f"Pages: {len(pdf.pages)}")

if __name__ == "__main__":
    generate_chemistry_pdf()
