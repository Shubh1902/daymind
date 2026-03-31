import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

// Workaround: if ANTHROPIC_API_KEY is empty in the shell environment,
// dotenv won't override it from .env.local. Parse it ourselves.
function loadEnvOverrides() {
  try {
    const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match && !process.env.ANTHROPIC_API_KEY) {
      return { ANTHROPIC_API_KEY: match[1].replace(/^["']|["']$/g, "").trim() };
    }
  } catch { /* .env.local not found, skip */ }
  return {};
}

const envOverrides = loadEnvOverrides();

const nextConfig: NextConfig = {
  env: {
    ...envOverrides,
  },
};

export default nextConfig;
