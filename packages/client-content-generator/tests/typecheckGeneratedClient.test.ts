import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ContemberClientGenerator, GenerateOptions } from '../src/index.js'
import { schemas } from './schemas.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('generated client', () => {
	test('typechecks for every test schema, with and without deprecated items', async () => {
		const dir = await fs.mkdtemp(join(tmpdir(), 'contember-client-typecheck-'))
		try {
			const generator = new ContemberClientGenerator()
			const variants: [string, GenerateOptions][] = [['default', {}], ['exclude-deprecated', { excludeDeprecated: true }]]
			for (const [schemaName, schema] of Object.entries(schemas)) {
				for (const [variant, options] of variants) {
					const outDir = join(dir, schemaName, variant)
					await fs.mkdir(outDir, { recursive: true })
					for (const [file, content] of Object.entries(generator.generate(schema.model, options))) {
						await fs.writeFile(join(outDir, file), content, 'utf8')
					}
				}
			}
			await fs.writeFile(
				join(dir, 'tsconfig.json'),
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						skipLibCheck: true,
						module: 'esnext',
						moduleResolution: 'bundler',
						target: 'ES2020',
						lib: ['esnext', 'dom'],
						types: [],
						customConditions: ['typescript'],
						paths: { '@contember/client-content': [join(repoRoot, 'packages/client-content/src/index.ts')] },
					},
					include: ['**/*.ts'],
				}),
			)

			const result = Bun.spawnSync([join(repoRoot, 'node_modules/.bin/tsc'), '-p', join(dir, 'tsconfig.json')], { cwd: repoRoot })
			const output = result.stdout.toString() + result.stderr.toString()
			expect(output).toBe('')
			expect(result.exitCode).toBe(0)
		} finally {
			await fs.rm(dir, { recursive: true, force: true })
		}
	}, 120_000)
})
