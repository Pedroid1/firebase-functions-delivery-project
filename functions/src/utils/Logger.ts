type LogLevel = "INFO" | "WARN" | "ERROR";

export class Logger {
  private logs: string[] = [];

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  log(message: string) {
    this.logs.push(this.format("INFO", message));
  }

  warn(message: string) {
    this.logs.push(this.format("WARN", message));
  }

  error(message: string) {
    this.logs.push(this.format("ERROR", message));
  }

  printAll() {
    if (this.logs.length > 0) {
      console.log(this.logs.join("\n")); // ✅ imprime tudo em uma chamada só
    }
  }

  toJSON() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}
