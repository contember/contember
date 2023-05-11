import { createSchema } from '@contember/schema-definition'
import { test, expect } from 'vitest'
import * as basic from './schemas/basic'
import * as relations from './schemas/relations'
import * as unique from './schemas/unique'
import * as enum_ from './schemas/enum'
import * as acl from './schemas/acl'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { TsDefinitionGenerator } from '../../../src'


const tests = [
	['basic', basic],
	['relations', relations],
	['unique', unique],
	['enum', enum_],
	['acl', acl],
] as const
for (const [name, def] of tests) {
	test(`generate schema: ${name}`, async () => {
		const schema = createSchema(def)
		const generator = new TsDefinitionGenerator(schema)
		const content = await readFile(join(__dirname, `schemas/${name}.ts`), 'utf-8')
		const generated = generator.generate()
		try {
			expect(generated).toBe(content)
		} catch (e) {
			await writeFile(join(__dirname, `schemas/${name}.actual.ts`), generated, 'utf8')
			throw e
		}
	})
}
