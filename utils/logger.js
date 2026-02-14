import fs from "fs";
import path from "path";

const logFile = path.resolve("server-debug.log");

export const logError = (message, error) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${message}\n${error?.stack || error}\n\n`;
    fs.appendFileSync(logFile, log);
};
