#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { ContemberClientGenerator } from './ContemberClientGenerator';

(async () => {
	const schemaPath = process.argv[2]
	let outDir = process.argv[3]
	let includeDeprecated = false

	const deprecatedFlagIndex = process.argv.indexOf('--include-deprecated')
	if (deprecatedFlagIndex !== -1) {
		includeDeprecated = true
		if (deprecatedFlagIndex === 3) {
			process.argv.splice(deprecatedFlagIndex, 1)
			outDir = process.argv[3]
		}
	}

	if (!schemaPath || !outDir) {
		console.error(`Usage:

From file:
yarn contember-client-generator <schema.json> <out-dir> [--include-deprecated]

From stdin:
yarn run --silent contember project:print-schema --format=schema | yarn contember-client-generator - <out-dir> [--include-deprecated]
`)
		process.exit(1)
	}

	const sourceData = await (async () => {
		if (schemaPath === '-') {
			if (process.stdin.isTTY) {
				throw new Error('Cannot read from stdin in TTY mode')
			}
			const buffer = []
			for await (const chunk of process.stdin) {
				buffer.push(chunk)
			}
			return Buffer.concat(buffer).toString('utf8')
		}
		return await fs.readFile(resolve(process.cwd(), process.argv[2]), 'utf8')
	})()

	const source = JSON.parse(sourceData)

	const dir = resolve(process.cwd(), process.argv[3])
	const generator = new ContemberClientGenerator()
	const result = generator.generate(source.model, { includeDeprecated })
	await fs.mkdir(dir, { recursive: true })
	for (const [name, content] of Object.entries(result)) {
		await fs.writeFile(join(dir, name), content, 'utf8')
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})
