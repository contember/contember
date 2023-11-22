import * as fs from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { ContemberClientGenerator } from './ContemberClientGenerator';

(async () => {
	const schemaPath = process.argv[2]
	const outDir = process.argv[3]

	if (!schemaPath || !outDir) {
		console.error(`Usage: yarn contember-client-generator <schema.json> <out-dir>`)
		process.exit(1)
	}

	const source = JSON.parse(await fs.readFile(resolve(process.cwd(), process.argv[2]), 'utf8'))
	const dir = resolve(process.cwd(), process.argv[3])
	const generator = new ContemberClientGenerator()
	const result = generator.generate(source.model)
	await fs.mkdir(dir, { recursive: true })
	for (const [name, content] of Object.entries(result)) {
		await fs.writeFile(join(dir, name), content, 'utf8')
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})

