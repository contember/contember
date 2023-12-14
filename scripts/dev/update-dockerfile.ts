
import * as fs from 'fs'
import * as path from 'path'

const root = process.cwd()
const tsconfig = path.join(root, 'tsconfig.json')
const dockerfile = path.join(root, 'ee/admin-server/Dockerfile')

const tsconfigJson = JSON.parse(fs.readFileSync(tsconfig, 'utf-8'))
const references = tsconfigJson.references
const packages = references.map((r: { path: string }) => r.path)

// read dockerfile
const dockerfileContent = fs.readFileSync(dockerfile, 'utf-8')

// build COPY directives
const copyDirectives = packages.map((p: string) => `COPY ${p}/package.json ./${p}/package.json`).join('\n')

// replace COPY directives

const startMarker = '# package.json copy start'
const endMarker = '# package.json copy end'

const start = dockerfileContent.indexOf(startMarker)
const end = dockerfileContent.indexOf(endMarker) + endMarker.length

const newDockerfileContent = dockerfileContent.substring(0, start) + startMarker + '\n\n' + copyDirectives + '\n\n' + endMarker + dockerfileContent.substring(end)

// write dockerfile
fs.writeFileSync(dockerfile, newDockerfileContent)
