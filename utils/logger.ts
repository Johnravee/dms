/**
 * Simple logger utility for debugging
 * Usage: logger.info("message"), logger.error("error"), logger.success("done")
 */

type LogLevel = "info" | "success" | "error" | "warn" | "debug";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = (level: LogLevel, message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();

  let prefix = "";
  let color = "";

  switch (level) {
    case "info":
      prefix = "ℹ️  [INFO]";
      color = colors.blue;
      break;
    case "success":
      prefix = "✅ [SUCCESS]";
      color = colors.green;
      break;
    case "error":
      prefix = "❌ [ERROR]";
      color = colors.red;
      break;
    case "warn":
      prefix = "⚠️  [WARN]";
      color = colors.yellow;
      break;
    case "debug":
      prefix = "🐛 [DEBUG]";
      color = colors.cyan;
      break;
  }

  const fullMessage = `${prefix} [${timestamp}] ${message}`;
  console.log(color + fullMessage + colors.reset, data || "");
};

export const logger = {
  info: (msg: string, data?: any) => log("info", msg, data),
  success: (msg: string, data?: any) => log("success", msg, data),
  error: (msg: string, data?: any) => log("error", msg, data),
  warn: (msg: string, data?: any) => log("warn", msg, data),
  debug: (msg: string, data?: any) => log("debug", msg, data),
};
