import { c, createSchema } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import * as basic from './schemas/basic.js'
import * as complex from './schemas/complex.js'
import * as relations from './schemas/relations.js'
import * as unique from './schemas/unique.js'
import * as enum_ from './schemas/enum.js'
import * as acl from './schemas/acl.js'
import * as description from './schemas/description.js'
import * as deprecated from './schemas/deprecated.js'
import * as view from './schemas/view.js'
import * as list from './schemas/list.js'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { DefinitionCodeGenerator } from '../../../src/definition-generator/DefinitionCodeGenerator.js'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const tests = [
	['basic', basic],
	['complex', complex],
	['relations', relations],
	['unique', unique],
	['enum', enum_],
	['acl', acl],
	['description', description],
	['deprecated', deprecated],
	['list', list],
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

namespace IndexOptionsSchema {
	@c.Index({ fields: ['title'], opClass: 'text_pattern_ops' })
	@c.Index({ fields: ['title'], method: 'gin', opClass: 'gin_trgm_ops' })
	@c.Index({ fields: ['title'], include: ['content'], where: 'content IS NOT NULL' })
	export class Article {
		title = c.stringColumn()
		content = c.stringColumn()
	}
}

test('definition generator preserves index opClass, include and where options', () => {
	const generator = new DefinitionCodeGenerator()
	const generated = generator.generate(createSchema(IndexOptionsSchema))
	// regression (ARCH-1): opClass used to be dropped on regeneration, silently degrading e.g. trigram search
	expect(generated).toContain(`@c.Index({ fields: ['title'], opClass: 'text_pattern_ops' })`)
	expect(generated).toContain(`@c.Index({ fields: ['title'], method: 'gin', opClass: 'gin_trgm_ops' })`)
	expect(generated).toContain(`@c.Index({ fields: ['title'], include: ['content'], where: 'content IS NOT NULL' })`)
	// opClass alone must force the options form, never the positional short form that would drop it
	expect(generated).not.toContain(`@c.Index('title')`)
})

namespace IndexColumnOptionsGenSchema {
	@c.Index({ fields: ['title', { field: 'rank', order: 'desc', nulls: 'last' }] })
	@c.Index({ fields: [{ field: 'title', opClass: 'text_pattern_ops' }] })
	export class Article {
		title = c.stringColumn()
		rank = c.intColumn()
	}
}

test('definition generator round-trips per-column index options', () => {
	const generator = new DefinitionCodeGenerator()
	const generated = generator.generate(createSchema(IndexColumnOptionsGenSchema))
	expect(generated).toContain(`@c.Index({ fields: ['title', { field: 'rank', order: 'desc', nulls: 'last' }] })`)
	expect(generated).toContain(`@c.Index({ fields: [{ field: 'title', opClass: 'text_pattern_ops' }] })`)
})
