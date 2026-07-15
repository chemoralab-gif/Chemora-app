# Chemora - Interactive Chemistry Simulator

Welcome to **Chemora**, the interactive chemistry simulator where "Every Atom is Yours"! This is a modern, web-based application for exploring, visualizing, and simulating chemical reactions with realistic effects and detailed data.

## 🧪 About the App

Chemora is an educational chemistry simulator built with modern web technologies that allows users to:

- **Explore 100+ Chemical Reactions**: Browse and simulate handcrafted reactions with realistic visual effects
- **Visualize Reactions**: Watch color changes, precipitates, bubbles, fire, explosions, and thermal effects
- **Learn Chemistry**: Understand reaction equations, heat changes, temperatures, and chemical properties
- **Experiment Safely**: Perform virtual chemistry experiments without safety concerns
- **Analyze Thermal Data**: Track temperature changes and heat released during reactions
- **Interactive Interface**: Drag-and-drop chemicals and apparatus with real-time feedback
- **Mobile Friendly**: Fully responsive design for desktop and mobile devices

### Key Features

✨ **100+ Handcrafted Reactions** including:
- Metal + Water reactions (K, Na, Li, etc.)
- Metal + Acid reactions (Mg, Fe, Zn, etc.)
- Combustion reactions
- Neutralization and indicator reactions
- Precipitation reactions
- Displacement reactions
- **Iodine reactions** - including the vibrant purple Iodine + Glucose complex
- Starch reactions and more

🎨 **Visual Effects**:
- Color changes with accurate color codes
- Bubble/fizz animations
- Fire and explosion effects
- Rust and corrosion processes
- Precipitate formation
- Thermal analysis with real-time graphs

🌡️ **Thermal Simulator**:
- Track temperature changes
- Calculate heat released/absorbed
- Analyze exothermic/endothermic reactions
- Real-time calorimetry data

📊 **Data Analysis**:
- Experiment reports and data export
- PDF generation of reactions
- Detailed reaction statistics
- Thermal analysis panels

## 🏗️ Project Structure

```
chemora-main/
├── src/
│   ├── components/          # React components
│   │   ├── ChemicalPalette.tsx    # Chemical selection
│   │   ├── EquipmentArea.tsx      # Reaction container
│   │   ├── ReactionEffect.tsx     # Visual effects
│   │   ├── ThermalAnalysisPanel.tsx # Temperature tracking
│   │   ├── CalorimetryLab.tsx     # Advanced thermal analysis
│   │   ├── LoadingScreen.tsx      # 1-second completion animation
│   │   ├── ExperimentReport.tsx   # Results and export
│   │   └── ui/                    # Shadcn/ui components
│   ├── lib/
│   │   ├── chemistryEngine.ts     # Core reaction logic
│   │   ├── thermalSimulator.ts    # Temperature calculations
│   │   ├── calorimetryEngine.ts   # Advanced thermal analysis
│   │   ├── data/
│   │   │   ├── reactions/
│   │   │   │   ├── handcrafted.ts # 100+ custom reactions
│   │   │   │   └── ...
│   │   │   └── chemicals/         # Chemical data
│   │   ├── elementData.ts         # Element properties
│   │   ├── reactionMatcher.ts     # Reaction matching logic
│   │   ├── equationBalancer.ts    # Chemistry equation balancing
│   │   └── utils.ts               # Utility functions
│   ├── pages/
│   │   ├── Index.tsx              # Main simulator interface
│   │   └── NotFound.tsx           # 404 page
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   ├── use-ui-mode.tsx        # UI mode management
│   │   └── use-toast.ts           # Toast notifications
│   ├── App.tsx                    # Main app component
│   └── main.tsx                   # Entry point
├── public/                  # Static assets
├── package.json            # Dependencies
├── vite.config.ts          # Build configuration
├── tailwind.config.ts      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
└── index.html             # HTML entry point
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+) and **npm** or **bun**
- **Python** (optional, for data processing scripts)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd chemora-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Open in browser**:
   - The app will typically open at `http://localhost:8080`
   - If not, check the terminal output for the correct URL

### Build for Production

```bash
npm run build
# or
bun run build
```

The optimized build will be created in the `dist/` folder.

## 🎮 How to Use

### 1. **Select a Chemical**
   - Click on chemicals in the palette on the left
   - Drag them into the reaction container

### 2. **Add Apparatus** (Optional)
   - Use equipment like Bunsen burners or containers
   - Apparatus can modify reaction behavior

### 3. **Watch the Reaction**
   - Visual effects display immediately
   - Temperature changes and data stream in real-time
   - See color changes, precipitates, and thermal effects

### 4. **Analyze Results**
   - View detailed reaction data
   - Check temperature changes
   - Export experiment reports as PDF

### 5. **Learn More**
   - Hover over reactions for detailed descriptions
   - View balanced chemical equations
   - Understand heat released/absorbed (enthalpyChange)

## 🛠️ Technologies Used

- **React 18**: UI framework
- **TypeScript**: Type-safe code
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Beautiful, accessible components
- **TanStack Query**: Data fetching and state management
- **Lucide React**: Icon library
- **html2canvas**: Screenshot capability for reports
- **React Router**: Client-side routing

## 🧬 Code Overview

### Core Engine (`chemistryEngine.ts`)
- Matches input chemicals against 100+ reaction database
- Returns matched reaction with full details
- Handles equation balancing and validation

### Thermal Simulator (`thermalSimulator.ts`)
- Calculates temperature changes based on reaction heat
- Tracks calorimetry data
- Supports both exothermic and endothermic reactions

### Calorimetry Engine (`calorimetryEngine.ts`)
- Advanced thermal analysis
- Heat capacity calculations
- Multi-substance thermal interactions

### Reaction Database (`handcrafted.ts`)
- 100+ handcrafted chemical reactions
- Includes famous reactions:
  - 🔥 K + H₂O → Explosion
  - 🟣 I₂ + Glucose → Purple Complex
  - 💨 Na + H₂O → Fire with hydrogen gas
  - 🌈 Various indicator color changes

## 🎨 Customization

### Adding a New Reaction

Edit `src/lib/data/reactions/handcrafted.ts`:

```typescript
{
  reactants: ["Substance1", "Substance2"],
  products: "Product",
  equation: "Substance1 + Substance2 → Product",
  effect: "color-change", // or "bubbles", "fire", "explosion", etc.
  description: "Detailed explanation of the reaction",
  intensity: 5, // 1-10 scale
  enthalpyChange: -100, // kJ/mol (negative = exothermic)
  isExothermic: true,
  temperatureChange: 35, // °C
  heatReleased: 100, // kJ
  indicatorColor: "hsl(270, 70%, 50%)" // Optional color for indicators
}
```

### Changing Colors

Update the color values in chemical definitions:

```typescript
{ id: "iodine-solution", name: "Iodine Solution", color: "rgb(255, 140, 0)", ... }
```

## 📊 Reaction Effects

- `color-change` - Change to specified color
- `bubbles` - Gas release animation
- `fizz` - Vigorous bubbling
- `fire` - Flame effect
- `explosion` - Explosive burst
- `precipitate` - Particle formation
- `gas-release` - Continuous gas emission
- `indicator-change` - pH indicator color change
- `rust` - Oxidation/corrosion effect

## 🔧 Development Tips

### Running Tests
```bash
npm run test
# Watch mode
npm run test:watch
```

### Linting
```bash
npm run lint
```

### Debugging
- Use browser DevTools (F12)
- Check console for error messages
- Thermal data is logged for debugging

## 📁 Important Files

- `src/lib/data/reactions/handcrafted.ts` - All 100+ reactions
- `src/components/ReactionEffect.tsx` - Visual effect renderer
- `src/lib/chemistryEngine.ts` - Core reaction matching logic
- `src/lib/thermalSimulator.ts` - Temperature calculations
- `src/App.tsx` - Main app routing
- `index.html` - HTML with 1-second loader

## 🧪 Chemistry Engine Guide

The Chemora Chemistry Engine is a comprehensive, deterministic reaction simulation system that ensures reproducible reactions while enforcing proper chemistry principles.

### Architecture Overview

```
ChemistryEngine (Main Executor)
    ├── Stoichiometry (Molar calculations)
    ├── ReactionMatcher (Smart reaction selection)
    ├── Validator (Substance & condition validation)
    ├── Logger (Debug logging)
    └── Integration (UI-friendly utilities)
```

### Key Features

✅ **Deterministic Reactions**: Same chemicals + temperature = Same reaction (always)
✅ **Stoichiometry Enforcement**: Proper molar calculations and limiting reactants
✅ **Priority-Based Selection**: Intelligent reaction choice based on multiple factors
✅ **Phase Awareness**: Tracks solid/liquid/gas states and transitions
✅ **Substance Validation**: Prevents reactions with unknown substances
✅ **Comprehensive Logging**: Full debug trace for every calculation

### Core Modules

| Module | Purpose | File |
|--------|---------|------|
| **ChemistryEngine** | Main reaction executor | `lib/chemistryEngine.ts` |
| **Stoichiometry** | Molar calculations, limiting reactants | `lib/stoichiometry.ts` |
| **ReactionMatcher** | Smart reaction selection | `lib/reactionMatcher.ts` |
| **Validator** | Substance & condition validation | `lib/validator.ts` |
| **Logger** | Debug logging & statistics | `lib/logger.ts` |
| **Integration** | UI-friendly utilities | `lib/engineIntegration.ts` |

### Quick Start

```typescript
import { createChemistryEngine } from "@/lib/chemistryEngine";
import { REACTIONS, CHEMICALS } from "@/lib/reactions";

const engine = createChemistryEngine(REACTIONS, CHEMICALS);
const result = engine.executeReaction([chemical1, chemical2], temperature = 25);
console.log(result);
// { success: true, reaction, products, limitingReactant, ... }
```

## 🧊 Calorimetry Lab Guide

Interactive component demonstrating heat exchange principles using the physics formula:

$$T_f = \frac{m_1 c_1 T_{i,metal} + m_2 c_2 T_{i,water}}{m_1 c_1 + m_2 c_2}$$

**Available Metals**:
- Iron (0.449 J/g°C)
- Copper (0.385 J/g°C)
- Aluminum (0.897 J/g°C)
- Zinc (0.387 J/g°C)
- Lead (0.129 J/g°C)
- Steel (0.490 J/g°C)

**Features**:
✅ Dynamic specific heat updates
✅ Real-time calculations
✅ Animated thermometer (3-second transition)
✅ Heat verification display
✅ Physical validation
✅ Responsive design

### Using the Calorimetry Lab

1. Click "Calorimetry" button in header
2. Select metal from dropdown
3. Adjust mass (10-500g) and temperature
4. Click "Start Experiment"
5. Watch thermometer animate to equilibrium

## 🏗️ Library Architecture

Clean, scalable code organization:

```
src/lib/
├── schemas/          # Type definitions
├── data/
│   ├── reactions/    # Handcrafted, exothermic, endothermic
│   ├── chemicals/    # Elements, compounds, substances
│   └── index.ts      # Main exports
└── index.ts          # App-level exports
```

**Benefits**: Single source of truth, clear separation, easy extension, 100% backward compatible

## 🤖 Rule-Based Chemistry Engine

Physics-first reaction prediction using fundamental chemistry principles.

### Core Modules

- **elementData.ts**: Comprehensive periodic table
- **ionicBonding.ts**: Electron transfer rules
- **covalentBonding.ts**: Electron sharing rules
- **equationBalancer.ts**: Matrix method balancing
- **constraintValidator.ts**: Chemical constraints
- **conditionSystem.ts**: Temperature/pressure effects
- **solubilityRules.ts**: Phase detection

### Unified Response Format

All predictions return one of three outcomes:

```typescript
// "reaction" - Chemical reaction occurs
{ outcome: "reaction", balanced_equation: "2Na + Cl2 → 2NaCl", feasible: true }

// "no_reaction" - No transformation
{ outcome: "no_reaction", feasible: false, reason: "Noble gas inertness" }

// "dissolution" - Ionic dissolution
{ outcome: "dissolution", balanced_equation: "NaCl(s) → Na+(aq) + Cl-(aq)" }
```

### Usage Examples

```typescript
import { predictReaction } from "@/lib/ruleBasedEngine";

// Simple prediction
const result = predictReaction(["Na", "Cl2"], ["NaCl"]);

// Batch processing
const results = predictMultipleReactions(reactions);

// With custom conditions
const molten = createConditions(850, 1, "molten");
const result = predictReaction(["NaCl"], ["Na", "Cl2"], molten);

// Parse from string
const result = predictReactionFromString("2H2 + O2 → 2H2O");
```

## 📊 Implementation Summary

**What's Implemented**:
✅ 7 core chemistry modules (2,500+ lines)
✅ Deterministic reactions
✅ Stoichiometry & limiting reactants
✅ 5-factor weighted scoring
✅ Phase awareness
✅ 60+ compound solubility database
✅ Decomposition support
✅ 8 category-specific loggers
✅ Comprehensive validation
✅ Equation balancing
✅ Unified response format

**Performance**:
- Parse equation: ~1ms
- Find best reaction: ~10ms
- Execute reaction: ~5ms
- Balance equation: 2-5ms
- Export logs: ~2ms

## 🚨 Troubleshooting

### App Won't Load
- Clear browser cache
- Check console for errors (F12)
- Ensure modern browser (Chrome, Firefox, Safari, Edge)

### Reactions Not Working
- Verify chemicals are in database
- Check spelling in reaction database
- Confirm reaction is enabled

### Performance Issues
- Disable animations
- Close other tabs
- Update browser

## 📄 License

Open-source, available for educational use.

## 👨‍💻 Development

For questions or contributions, explore the codebase and extend the reaction database with your own experiments!

---

**Enjoy exploring the fascinating world of chemistry with Chemora!** 🧪✨

"Every Atom is Yours" - Unlock the potential of interactive chemistry learning.

