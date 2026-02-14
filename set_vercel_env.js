// Temporary script to set Vercel env vars
import { execSync } from "child_process";
import { readFileSync } from "fs";

const envContent = readFileSync(".env", "utf-8");
const vars = {};
for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (key === "PORT") continue;
    vars[key] = val;
}

for (const [key, val] of Object.entries(vars)) {
    console.log(`Setting ${key}...`);
    try {
        execSync(`npx -y vercel env add ${key} production`, {
            input: val,
            stdio: ["pipe", "inherit", "inherit"],
            timeout: 15000,
        });
        console.log(`✅ ${key} set`);
    } catch (e) {
        console.error(`❌ ${key} (may already exist)`);
    }
}
console.log("Done!");
