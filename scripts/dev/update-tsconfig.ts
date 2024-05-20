// this file reads directories in packages dir, verifies, that package.json exists and updates reference map in tsconfig.json
import { join } from 'node:path'
import * as fs from 'node:fs'

const root = process.cwd()
const tsconfig = join(root, 'tsconfig.json')

const tsconfigJson = JSON.parse(fs.readFileSync(tsconfig, 'utf-8'))

const packages = fs.readdirSync(join(root, 'packages')).map(it => `packages/${it}`)


const references = packages.filter(p => fs.existsSync(join(root, p, 'package.json'))).map(p => ({ path: './' + p }))
tsconfigJson.references = references

fs.writeFileSync(tsconfig, JSON.stringify(tsconfigJson, null, '\t') + '\n')
