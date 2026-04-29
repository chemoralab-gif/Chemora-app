/**
 * Debug Logger Module
 * Tracks chemistry engine operations for debugging and validation
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

class ChemistryLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabledCategories = new Set<string>();
  private enabledLevels = new Set<LogLevel>(["debug", "info", "warn", "error"]);
  private isDevelopment = import.meta.env.DEV ?? false;

  constructor() {
    // Enable all categories by default in development
    if (this.isDevelopment) {
      this.enableAll();
    }
  }

  /**
   * Log a message with optional data
   */
  log(level: LogLevel, category: string, message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep logs bounded
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      this.consoleOutput(entry);
    }
  }

  /**
   * Create category-specific logger
   */
  createCategoryLogger(category: string) {
    return {
      debug: (msg: string, data?: Record<string, unknown>) => this.log("debug", category, msg, data),
      info: (msg: string, data?: Record<string, unknown>) => this.log("info", category, msg, data),
      warn: (msg: string, data?: Record<string, unknown>) => this.log("warn", category, msg, data),
      error: (msg: string, data?: Record<string, unknown>) => this.log("error", category, msg, data),
    };
  }

  /**
   * Check if a log should be recorded based on level and category
   */
  private shouldLog(level: LogLevel, category: string): boolean {
    if (!this.enabledLevels.has(level)) return false;
    if (this.enabledCategories.size === 0) return false;
    return this.enabledCategories.has(category) || this.enabledCategories.has("*");
  }

  /**
   * Console output with color coding
   */
  private consoleOutput(entry: LogEntry) {
    const colors: Record<LogLevel, string> = {
      debug: "color: #999",
      info: "color: #0066cc",
      warn: "color: #ff9900",
      error: "color: #ff0000",
    };

    const time = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `%c[${time}] [${entry.category}]`;
    const style = colors[entry.level];

    if (entry.data) {
      console.log(prefix, style, entry.message, entry.data);
    } else {
      console.log(prefix, style, entry.message);
    }
  }

  /**
   * Enable logging for specific category
   */
  enableCategory(category: string) {
    this.enabledCategories.add(category);
  }

  /**
   * Enable logging for all categories
   */
  enableAll() {
    this.enabledCategories.add("*");
  }

  /**
   * Disable logging for specific category
   */
  disableCategory(category: string) {
    this.enabledCategories.delete(category);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for specific category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter((l) => l.category === category);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((l) => l.level === level);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV() {
    const headers = ["Timestamp", "Level", "Category", "Message", "Data"];
    const rows = this.logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.level.toUpperCase(),
      l.category,
      l.message,
      JSON.stringify(l.data || {}),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    return csv;
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byCategory: {} as Record<string, number>,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };

    for (const log of this.logs) {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
export const chemistryLogger = new ChemistryLogger();

/**
 * Global export for easy access to category loggers
 */
export const loggers = {
  engine: chemistryLogger.createCategoryLogger("ChemistryEngine"),
  matcher: chemistryLogger.createCategoryLogger("ReactionMatcher"),
  stoichiometry: chemistryLogger.createCategoryLogger("Stoichiometry"),
  validator: chemistryLogger.createCategoryLogger("Validator"),
  phase: chemistryLogger.createCategoryLogger("PhaseTransition"),
  solubility: chemistryLogger.createCategoryLogger("Solubility"),
  container: chemistryLogger.createCategoryLogger("ContainerState"),
  ui: chemistryLogger.createCategoryLogger("UIIntegration"),
};
