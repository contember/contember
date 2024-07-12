import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rootDirectory } from './rootDirectory.js'

const tsconfig = JSON.parse(readFileSync(join(rootDirectory, './tsconfig.json'), 'utf8'))
// in format ./packages/admin => convert to map with "admin" as a key and packages/admin as a value
const references = tsconfig.references.map(reference => reference.path)
export const entries = references.map(reference => [reference.split('/').pop(), reference.substring(2)])
