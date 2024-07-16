import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export const rootDirectory = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

const tsconfig = JSON.parse(readFileSync(join(rootDirectory, './tsconfig.json'), 'utf8'))
const references = tsconfig.references.map(reference => reference.path)
export const packages = new Map(references.map(reference => [reference.split('/').pop(), reference.substring(2)]))
