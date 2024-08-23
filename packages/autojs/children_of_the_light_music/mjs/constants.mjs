import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

export const rootDir = path.dirname(path.join(__filename, "../"));
export const srcDir = path.resolve(rootDir, "src");
export const packagesDir = path.resolve(rootDir, "packages");
export const distDir = path.resolve(rootDir, "dist");
export const assetDir = path.resolve(rootDir, "asset");
