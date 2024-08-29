import { createSchema } from '@contember/schema-definition'
import { expect, test } from 'vitest'
import * as basic from './schemas/basic'
import * as complex from './schemas/complex'
import * as relations from './schemas/relations'
import * as unique from './schemas/unique'
import * as enum_ from './schemas/enum'
import * as acl from './schemas/acl'
import * as view from './schemas/view'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { DefinitionCodeGenerator } from '../../../src/definition-generator/DefinitionCodeGenerator'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const tests = [
	['basic', basic],
	['complex', complex],
	['relations', relations],
	['unique', unique],
	['enum', enum_],
	['acl', acl],
	['view', view],
] as const
for (const [name, def] of tests) {
	test(`generate schema: ${name}`, async () => {
		const schema = createSchema(def)
		const generator = new DefinitionCodeGenerator()
		const content = await readFile(join(dirname(fileURLToPath(import.meta.url)), `schemas/${name}.ts`), 'utf-8')
		const generated = generator.generate(schema)
		try {
			expect(generated).toBe(content)
		} catch (e) {
			await writeFile(join(dirname(fileURLToPath(import.meta.url)), `schemas/${name}.actual.ts`), generated, 'utf8')
			throw e
		}
	})
}
