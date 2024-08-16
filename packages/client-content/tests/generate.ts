import { ContemberClientGenerator } from '@contember/client-content-generator'
import { schema } from './schema'
import fs from 'node:fs/promises'
import { join } from 'node:path'

const generator = new ContemberClientGenerator()
const result = await generator.generate(schema.model)
const dir = join(process.cwd(), process.argv[2])
await fs.mkdir(dir, { recursive: true })
for (const [name, content] of Object.entries(result)) {
	await fs.writeFile(join(dir, name), content, 'utf8')
}

