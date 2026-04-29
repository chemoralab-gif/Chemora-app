/**
 * Equation Balancer - Matrix Method
 * Automatically balances chemical equations using Gaussian elimination
 * Converts molecules into element counts and solves for coefficients
 */

export interface BalancedEquation {
  reactantCoefficients: number[];
  productCoefficients: number[];
  reactants: string[];
  products: string[];
  balanced: string;
  balanced_equation: string;
  isBalanced: boolean;
}

/**
 * Parse a chemical formula and extract element counts
 * Example: "H2SO4" → { H: 2, S: 1, O: 4 }
 */
export function parseFormula(formula: string): Record<string, number> {
  const elements: Record<string, number> = {};

  // Remove parentheses for simplicity (doesn't handle complex parentheses)
  const cleaned = formula.replace(/\s+/g, "");

  // Match element symbols (capital letter optionally followed by lowercase)
  // followed by optional digits
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    const symbol = match[1];
    const count = parseInt(match[2]) || 1;

    elements[symbol] = (elements[symbol] || 0) + count;
  }

  return elements;
}

/**
 * Build a matrix for equation balancing
 * Each row = element, each column = molecule
 * Values = count of element in molecule
 */
function buildMatrix(
  reactants: string[],
  products: string[]
): { matrix: number[][]; elements: string[] } {
  const allFormulas = [...reactants, ...products];

  // Get all unique elements
  const elementSet = new Set<string>();
  for (const formula of allFormulas) {
    const parsed = parseFormula(formula);
    for (const element of Object.keys(parsed)) {
      elementSet.add(element);
    }
  }

  const elements = Array.from(elementSet).sort();

  // Build matrix
  const matrix: number[][] = [];

  for (const element of elements) {
    const row: number[] = [];

    // Reactants (positive)
    for (const reactant of reactants) {
      const parsed = parseFormula(reactant);
      row.push(parsed[element] || 0);
    }

    // Products (negative)
    for (const product of products) {
      const parsed = parseFormula(product);
      row.push(-(parsed[element] || 0));
    }

    matrix.push(row);
  }

  return { matrix, elements };
}

/**
 * Solve homogeneous system using Gaussian elimination
 * Finds integer coefficients that balance the equation
 */
function solveMatrix(matrix: number[][]): number[] | null {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // Augment with identity for rank calculation
  const augmented = matrix.map((row) => [...row]);

  // Gaussian elimination
  for (let i = 0; i < Math.min(rows, cols - 1); i++) {
    // Find pivot
    let maxRow = i;
    for (let j = i + 1; j < rows; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Skip zero pivot
    if (Math.abs(augmented[i][i]) < 1e-10) continue;

    // Eliminate column
    for (let j = i + 1; j < rows; j++) {
      const factor = augmented[j][i] / augmented[i][i];
      for (let k = i; k < cols; k++) {
        augmented[j][k] -= factor * augmented[i][k];
      }
    }
  }

  // Back substitution - find free variable solution
  const solution = new Array(cols).fill(0);
  solution[cols - 1] = 1; // Set last variable to 1

  // Solve for dependent variables
  for (let i = Math.min(rows, cols - 1) - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < cols; j++) {
      sum += augmented[i][j] * solution[j];
    }

    if (Math.abs(augmented[i][i]) > 1e-10) {
      solution[i] = -sum / augmented[i][i];
    }
  }

  // Convert to positive integers
  const minVal = Math.min(...solution.filter((x) => x < 0));
  const maxVal = Math.max(...solution.filter((x) => x > 0));

  // Scale to make all positive
  if (minVal < 0) {
    for (let i = 0; i < solution.length; i++) {
      solution[i] -= minVal;
    }
  }

  // Scale to integers
  const gcd = findGCD(solution.map((x) => Math.round(x * 1000)));
  for (let i = 0; i < solution.length; i++) {
    solution[i] = Math.round(solution[i] * 1000) / gcd;
  }

  return solution;
}

/**
 * Find GCD of array of numbers
 */
function findGCD(numbers: number[]): number {
  const gcdTwo = (a: number, b: number): number => (b === 0 ? a : gcdTwo(b, a % b));

  return numbers.reduce((a, b) => gcdTwo(Math.abs(a), Math.abs(b)));
}

/**
 * Verify if equation is balanced
 */
export function isEquationBalanced(
  reactants: string[],
  products: string[],
  reactantCoeff: number[],
  productCoeff: number[]
): boolean {
  // Get all unique elements
  const elementSet = new Set<string>();
  for (const formula of [...reactants, ...products]) {
    const parsed = parseFormula(formula);
    for (const element of Object.keys(parsed)) {
      elementSet.add(element);
    }
  }

  // Check each element is balanced
  for (const element of elementSet) {
    let reactantCount = 0;
    let productCount = 0;

    for (let i = 0; i < reactants.length; i++) {
      const parsed = parseFormula(reactants[i]);
      reactantCount += reactantCoeff[i] * (parsed[element] || 0);
    }

    for (let i = 0; i < products.length; i++) {
      const parsed = parseFormula(products[i]);
      productCount += productCoeff[i] * (parsed[element] || 0);
    }

    if (Math.abs(reactantCount - productCount) > 1e-6) {
      return false;
    }
  }

  return true;
}

/**
 * Balance a chemical equation
 * @param reactants Array of reactant formulas
 * @param products Array of product formulas
 * @returns Balanced equation with coefficients
 */
export function balanceEquation(reactants: string[], products: string[]): BalancedEquation {
  if (reactants.length === 0 || products.length === 0) {
    return {
      reactantCoefficients: [],
      productCoefficients: [],
      reactants,
      products,
      balanced: "",
      balanced_equation: "",
      isBalanced: false,
    };
  }

  const { matrix } = buildMatrix(reactants, products);

  const solution = solveMatrix(matrix);

  if (!solution) {
    return {
      reactantCoefficients: Array(reactants.length).fill(1),
      productCoefficients: Array(products.length).fill(1),
      reactants,
      products,
      balanced: "",
      balanced_equation: "",
      isBalanced: false,
    };
  }

  const reactantCoefficients = solution.slice(0, reactants.length).map((x) => Math.round(x));
  const productCoefficients = solution.slice(reactants.length).map((x) => Math.round(x));

  const isBalanced = isEquationBalanced(reactants, products, reactantCoefficients, productCoefficients);

  // Format equation
  const reactantStr = reactants
    .map((r, i) => {
      const coef = reactantCoefficients[i];
      return coef > 1 ? `${coef}${r}` : r;
    })
    .join(" + ");

  const productStr = products
    .map((p, i) => {
      const coef = productCoefficients[i];
      return coef > 1 ? `${coef}${p}` : p;
    })
    .join(" + ");

  const balanced = `${reactantStr} -> ${productStr}`;

  return {
    reactantCoefficients,
    productCoefficients,
    reactants,
    products,
    balanced,
    balanced_equation: balanced,
    isBalanced,
  };
}
