# Chemora Requirements and Installation Guide

This file lists the software and libraries required to install, develop, test, and build Chemora.

## 1. Required software

- **Node.js 18 or newer** - required to run the web-development tools. An active LTS release is recommended.
- **npm** - required package manager for the recommended installation. It is included with Node.js.
- **Modern web browser** - current Chrome, Edge, Firefox, or Safari.
- **Internet connection** - required when downloading software and libraries for the first time.

## 2. Optional software

- **Python 3.10 or newer** - needed only for the PDF data-processing scripts. It is not needed to run the Chemora website.
- **pip and venv** - included with a normal Python installation and used for the optional Python environment.
- **Git** - recommended for cloning and managing the source code.
- **Visual Studio Code** - optional; any code editor can be used.
- **Bun** - optional alternative to npm. Do not mix npm and Bun installations in the same working copy.

Chemora does **not** currently require a database, backend server, Java, .NET, Docker, external API key, or physical laboratory equipment.

## 3. Install the required software on Windows

### Step 1: Install Node.js and npm

1. Open <https://nodejs.org/>.
2. Download an LTS version of Node.js.
3. Run the installer.
4. Keep the **npm package manager** and **Add to PATH** options enabled.
5. Close and reopen PowerShell after installation.
6. Verify the installation:

```powershell
node --version
npm --version
```

Both commands should print version numbers.

### Step 2: Install Git (recommended)

1. Open <https://git-scm.com/download/win>.
2. Download and run the Windows installer.
3. Keep the default options unless the team requires different settings.
4. Verify the installation:

```powershell
git --version
```

### Step 3: Install Python (optional)

Python is necessary only when running the scripts under `chemora-main/scripts`.

1. Open <https://www.python.org/downloads/windows/>.
2. Download Python 3.10 or newer.
3. Enable **Add python.exe to PATH** in the installer.
4. Complete the installation and reopen PowerShell.
5. Verify it:

```powershell
python --version
python -m pip --version
```

## 4. Install and run Chemora

Open PowerShell in the repository root, then run:

```powershell
cd chemora-main
npm ci
npm run dev
```

`npm ci` installs all runtime and development libraries from `package-lock.json`. It is preferred over installing packages individually because it creates a repeatable installation.

Open the address printed by Vite in a web browser. The configured development address is normally <http://localhost:8080>.

Keep the PowerShell window running while using the development server. Press `Ctrl+C` to stop it.

## 5. Test, check, and build the project

Run these commands from `chemora-main`:

```powershell
npm run lint       # Check the code with ESLint
npm run test       # Run all tests once
npm run test:watch # Run tests continuously while editing
npm run build      # Create the production build in dist
npm run preview    # Preview the production build
```

## 6. Runtime JavaScript libraries

These packages are listed under `dependencies` in `chemora-main/package.json`. They are installed automatically by `npm ci`.

### Forms and validation

- `@hookform/resolvers` `^3.10.0` - connects React Hook Form to validators such as Zod.
- `react-hook-form` `^7.61.1` - manages form state and validation.
- `zod` `^3.25.76` - provides runtime schemas and data validation.
- `input-otp` `^1.4.2` - accessible one-time-password input component.

### React application and routing

- `react` `^18.3.1` - main user-interface framework.
- `react-dom` `^18.3.1` - renders React in the browser.
- `react-router-dom` `^6.30.1` - client-side page routing.
- `@tanstack/react-query` `^5.83.0` - asynchronous data fetching, caching, and server-state management.
- `next-themes` `^0.3.0` - theme and dark-mode management.

### Radix UI component primitives

- `@radix-ui/react-accordion` `^1.2.11`
- `@radix-ui/react-alert-dialog` `^1.1.14`
- `@radix-ui/react-aspect-ratio` `^1.1.7`
- `@radix-ui/react-avatar` `^1.1.10`
- `@radix-ui/react-checkbox` `^1.3.2`
- `@radix-ui/react-collapsible` `^1.1.11`
- `@radix-ui/react-context-menu` `^2.2.15`
- `@radix-ui/react-dialog` `^1.1.14`
- `@radix-ui/react-dropdown-menu` `^2.1.15`
- `@radix-ui/react-hover-card` `^1.1.14`
- `@radix-ui/react-label` `^2.1.7`
- `@radix-ui/react-menubar` `^1.1.15`
- `@radix-ui/react-navigation-menu` `^1.2.13`
- `@radix-ui/react-popover` `^1.1.14`
- `@radix-ui/react-progress` `^1.1.7`
- `@radix-ui/react-radio-group` `^1.3.7`
- `@radix-ui/react-scroll-area` `^1.2.9`
- `@radix-ui/react-select` `^2.2.5`
- `@radix-ui/react-separator` `^1.1.7`
- `@radix-ui/react-slider` `^1.3.5`
- `@radix-ui/react-slot` `^1.2.3`
- `@radix-ui/react-switch` `^1.2.5`
- `@radix-ui/react-tabs` `^1.1.12`
- `@radix-ui/react-toast` `^1.2.14`
- `@radix-ui/react-toggle` `^1.1.9`
- `@radix-ui/react-toggle-group` `^1.1.10`
- `@radix-ui/react-tooltip` `^1.2.7`

These are accessible building blocks used by the project's shadcn/ui components.

### Interface, styling, and layout

- `class-variance-authority` `^0.7.1` - type-safe component style variants.
- `clsx` `^2.1.1` - conditional CSS class composition.
- `tailwind-merge` `^2.6.0` - safely combines Tailwind CSS class strings.
- `tailwindcss-animate` `^1.0.7` - Tailwind animation utilities.
- `lucide-react` `^0.462.0` - icon library.
- `cmdk` `^1.1.1` - command-menu component.
- `embla-carousel-react` `^8.6.0` - carousel behavior.
- `react-resizable-panels` `^2.1.9` - resizable panel layouts.
- `vaul` `^0.9.9` - drawer component primitives.
- `sonner` `^1.7.4` - toast notifications.
- `react-day-picker` `^8.10.1` - calendar and date picker.
- `date-fns` `^3.6.0` - date formatting and utilities.

### Charts, PDFs, screenshots, and spreadsheets

- `recharts` `^2.15.4` - thermal and analysis charts.
- `html2canvas` `^1.4.1` - captures interface sections as canvas images.
- `jspdf` `^4.2.1` - creates PDFs in the browser.
- `exceljs` `^4.4.0` - creates formatted Excel workbook exports.
- `xlsx` `^0.18.5` - reads and writes spreadsheet data.

## 7. Development and build libraries

These packages are listed under `devDependencies` in `chemora-main/package.json`. `npm ci` installs them automatically.

### TypeScript and type definitions

- `typescript` `^5.8.3` - TypeScript compiler and language tools.
- `@types/node` `^22.16.5` - Node.js type definitions.
- `@types/react` `^18.3.23` - React type definitions.
- `@types/react-dom` `^18.3.7` - React DOM type definitions.

### Vite and production build tools

- `vite` `^5.4.19` - development server and production bundler.
- `@vitejs/plugin-react-swc` `^3.11.0` - compiles React through SWC.
- `terser` `^5.46.2` - minifies the production JavaScript.
- `lovable-tagger` `^1.1.13` - optional component tagging in development mode.

### Tailwind CSS and PostCSS

- `tailwindcss` `^3.4.17` - utility-first CSS framework.
- `@tailwindcss/typography` `^0.5.16` - Tailwind typography styles.
- `postcss` `^8.5.6` - CSS processing pipeline.
- `autoprefixer` `^10.4.21` - adds browser vendor prefixes to CSS.

### Testing

- `vitest` `^3.2.4` - unit-test runner.
- `jsdom` `^20.0.3` - browser-like DOM environment for tests.
- `@testing-library/react` `^16.0.0` - React component testing utilities.
- `@testing-library/jest-dom` `^6.6.0` - DOM assertions for tests.

### Linting

- `eslint` `^9.32.0` - JavaScript and TypeScript static analysis.
- `@eslint/js` `^9.32.0` - base JavaScript lint rules.
- `typescript-eslint` `^8.38.0` - TypeScript parser and lint rules.
- `eslint-plugin-react-hooks` `^5.2.0` - checks the rules of React Hooks.
- `eslint-plugin-react-refresh` `^0.4.20` - checks compatibility with React Fast Refresh.
- `globals` `^15.15.0` - global-variable definitions used by ESLint.

## 8. Optional Python setup and libraries

Run these commands from the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install pdfminer.six
```

### External Python library

- `pdfminer.six` - supplies `pdfminer.high_level.extract_text`, which is imported by `chemora-main/scripts/extract_pdfs.py`.

### Python standard-library modules used

These modules come with Python and must **not** be installed separately:

- `datetime`
- `json`
- `os`
- `pathlib`
- `re`

### Run the PDF data-processing scripts

```powershell
python chemora-main\scripts\extract_pdfs.py
python chemora-main\scripts\parse_extracted_texts.py
python chemora-main\scripts\convert_parsed_reactions.py
python chemora-main\scripts\merge_reactions.py
```

The separate reference PDF generator uses only the Python standard library:

```powershell
cd chemora-main
python generate_chemistry_pdf.py
```

If PowerShell blocks `.\venv\Scripts\Activate.ps1`, use Command Prompt with `.venv\Scripts\activate.bat`, or call `.venv\Scripts\python.exe` directly.

## 9. Optional Bun workflow

Install Bun using the instructions at <https://bun.sh/>, then run:

```powershell
bun --version
cd chemora-main
bun install
bun run dev
bun run test
bun run build
```

The npm workflow remains recommended because the project includes `package-lock.json` and supports reproducible `npm ci` installations.

## 10. Configuration and network details

- The Vite development server uses TCP port `8080`.
- No mandatory `.env` file is currently required.
- Setting `VITE_COMPONENT_TAGGER=true` optionally enables `lovable-tagger` in development mode.
- The current application does not require a database connection, external API endpoint, authentication secret, or backend service.
- If port 8080 is busy, stop the conflicting program or temporarily run `npm run dev -- --port 8081`.

## 11. Clean-install checklist

```powershell
cd chemora-main
npm ci
npm run lint
npm run test
npm run build
npm run dev
```

The installation is complete when the checks succeed and Chemora loads at the URL printed by Vite, normally <http://localhost:8080>.
