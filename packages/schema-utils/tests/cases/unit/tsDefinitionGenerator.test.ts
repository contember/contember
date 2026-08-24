import { c, createSchema } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import * as basic from './schemas/basic.js'
import * as complex from './schemas/complex.js'
import * as relations from './schemas/relations.js'
import * as unique from './schemas/unique.js'
import * as enum_ from './schemas/enum.js'
import * as acl from './schemas/acl.js'
import * as view from './schemas/view.js'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { DefinitionCodeGenerator } from '../../../src/definition-generator/DefinitionCodeGenerator.js'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Acl } from '@contember/schema'

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

namespace LegacyAclModel {
	export class Attachment {
		fileName = c.stringColumn()
		size = c.intColumn()
	}
}

// `noRoot` cannot be expressed through `@c.Allow` - it only appears in schemas stored before `through` existed, so the acl is hand-written here
const legacyNoRootAcl: Acl.Schema = {
	roles: {
		editor: {
			stages: '*',
			variables: {},
			entities: {
				Attachment: {
					predicates: {},
					operations: {
						read: { fileName: true, size: true },
						update: { fileName: true },
						noRoot: ['read'],
					},
				},
			},
		},
	},
}

test('definition generator keeps a legacy noRoot grant out of the root scope', () => {
	const generator = new DefinitionCodeGenerator()
	const generated = generator.generate({ ...createSchema(LegacyAclModel), acl: legacyNoRootAcl })
	// regression: `noRoot` used to be ignored, so a through-only grant was regenerated as a full root grant - an escalation, not just a loss
	expect(generated).not.toContain(`@c.Allow(editorRole, {\n\tread: true,\n\tupdate: ['fileName'],\n})`)
	expect(generated).toContain(`@c.Allow(editorRole, {\n\tupdate: ['fileName'],\n})\n@c.Allow(editorRole, {\n\tthrough: true,\n\tread: true,\n})\n`)
})

const legacyMixedAcl: Acl.Schema = {
	roles: {
		editor: {
			stages: '*',
			variables: {},
			entities: {
				Attachment: {
					predicates: { small: { size: { lt: 100 } } },
					operations: {
						read: { fileName: 'small', size: 'small' },
						update: { fileName: true },
						delete: 'small',
						noRoot: ['read', 'delete'],
						through: { update: { size: true } },
					},
				},
			},
		},
	},
}

test('definition generator combines a legacy noRoot grant with a declared through bucket', () => {
	const generator = new DefinitionCodeGenerator()
	const generated = generator.generate({ ...createSchema(LegacyAclModel), acl: legacyMixedAcl })
	// regression: the predicate-gated noRoot grant was emitted as a root grant and the declared `through` bucket was dropped entirely
	expect(generated).not.toContain(`@c.Allow(editorRole, {\n\twhen: { size: { lt: 100 } },\n\tread: true,\n\tdelete: true,\n})`)
	expect(generated).toContain(`@c.Allow(editorRole, {\n\twhen: { size: { lt: 100 } },\n\tthrough: true,\n\tread: true,\n\tdelete: true,\n})`)
	expect(generated).toContain(`@c.Allow(editorRole, {\n\tupdate: ['fileName'],\n})`)
	expect(generated).toContain(`@c.Allow(editorRole, {\n\tthrough: true,\n\tupdate: ['size'],\n})`)
})
