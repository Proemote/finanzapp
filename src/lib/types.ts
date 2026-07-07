export interface Transaction {
  id: string;
  /** Fecha en formato ISO yyyy-mm-dd */
  date: string;
  description: string;
  /** Positivo = ingreso, negativo = gasto */
  amount: number;
  category: string;
  /** Cuenta bancaria a la que pertenece (BBVA, Revolut…) */
  account: string;
  /** Nombre del archivo del que proviene */
  source: string;
}

export interface ParseResult {
  transactions: Omit<Transaction, "category" | "account">[];
  /** Filas que no se pudieron interpretar */
  skippedRows: number;
  totalRows: number;
}

export interface MonthlySummary {
  month: string; // "2026-01"
  income: number;
  expense: number; // valor positivo
  balance: number;
}

export interface CategorySummary {
  category: string;
  total: number; // valor absoluto
  count: number;
  percentage: number;
}

export interface AccountSummary {
  account: string;
  income: number;
  expense: number; // valor positivo
  balance: number;
  count: number;
}
