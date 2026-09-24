import { describe, expect, test } from 'bun:test'
import { Acl, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { createPatch } from 'rfc6902'
import { ModificationHandlerFactory, SchemaMigrator } from '../../../src/index.js'

const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))

const role = (entityNames: string[]): Acl.RolePermissions => ({
	variables: {},
	stages: '*',
	entities: Object.fromEntries(entityNames.map(name => [name, { predicates: {}, operations: { read: { id: true } } }])),
})

const schemaWithAcl = (): Schema => ({
	...emptySchema,
	acl: {
		roles: {
			editor: role(['Article', 'Tag']),
			reader: role(['Article']),
		},
	},
})

describe('patchAclSchema', () => {
	test('leaves the input schema untouched and shares the branches the patch does not write to', () => {
		const schema = schemaWithAcl()
		const snapshot = structuredClone(schema)

		const result = schemaMigrator.applyModifications(schema, [{
			modification: 'patchAclSchema',
			patch: [
				{ op: 'replace', path: '/roles/editor/entities/Article/operations/read/id', value: false },
				{ op: 'remove', path: '/roles/editor/entities/Tag' },
				{ op: 'add', path: '/roles/writer', value: role([]) },
				{ op: 'add', path: '/roles/writer/entities/Article', value: { predicates: {}, operations: {} } },
			],
		}], 6)

		expect(schema).toStrictEqual(snapshot)
		expect(result.acl.roles.editor.entities).toStrictEqual({
			Article: { predicates: {}, operations: { read: { id: false } } },
		})
		expect(result.acl.roles.writer.entities).toStrictEqual({ Article: { predicates: {}, operations: {} } })
		expect(result.acl.roles.reader).toBe(schema.acl.roles.reader)
	})

	test('move copies both the source and the target parent', () => {
		const schema = schemaWithAcl()
		const snapshot = structuredClone(schema)

		const result = schemaMigrator.applyModifications(schema, [{
			modification: 'patchAclSchema',
			patch: [{ op: 'move', from: '/roles/editor/entities/Tag', path: '/roles/reader/entities/Tag' }],
		}], 6)

		expect(schema).toStrictEqual(snapshot)
		expect(Object.keys(result.acl.roles.editor.entities)).toStrictEqual(['Article'])
		expect(Object.keys(result.acl.roles.reader.entities)).toStrictEqual(['Article', 'Tag'])
	})

	test('does not keep a reference to the patch values', () => {
		const value = role(['Article'])
		const modification = { modification: 'patchAclSchema', patch: [{ op: 'add', path: '/roles/writer', value }] }

		const first = schemaMigrator.applyModifications(schemaWithAcl(), [modification], 6)
		schemaMigrator.applyModifications(first, [{
			modification: 'patchAclSchema',
			patch: [{ op: 'remove', path: '/roles/writer/entities/Article' }],
		}], 6)

		expect(value).toStrictEqual(role(['Article']))
		expect(first.acl.roles.writer.entities).toStrictEqual(role(['Article']).entities)
	})

	test('follows array indices that earlier operations of the patch shifted', () => {
		const withPredicate = (predicate: Acl.PredicateDefinition): Schema => ({
			...emptySchema,
			acl: { roles: { editor: { ...role(['Article']), entities: { Article: { predicates: { p: predicate }, operations: {} } } } } },
		})
		const schema = withPredicate({ or: [{ a: { eq: 1 } }, { b: { eq: 2 } }, { c: { eq: 3, isNull: false } }] })
		const target = withPredicate({ or: [{ b: { eq: 2 } }, { c: { eq: 3 } }] })
		const snapshot = structuredClone(schema)

		const result = schemaMigrator.applyModifications(schema, [{
			modification: 'patchAclSchema',
			patch: createPatch(schema.acl, target.acl),
		}], 6)

		expect(schema).toStrictEqual(snapshot)
		expect(result.acl).toStrictEqual(target.acl)
	})

	test('copies a moved subtree before writing into it', () => {
		const schema = schemaWithAcl()
		const snapshot = structuredClone(schema)

		const result = schemaMigrator.applyModifications(schema, [{
			modification: 'patchAclSchema',
			patch: [
				{ op: 'move', from: '/roles/editor', path: '/roles/writer' },
				{ op: 'remove', path: '/roles/writer/entities/Tag' },
			],
		}], 6)

		expect(schema).toStrictEqual(snapshot)
		expect(Object.keys(result.acl.roles.writer.entities)).toStrictEqual(['Article'])
	})

	test('replaying the same migrations twice gives the same schema', () => {
		const modifications = [
			{ modification: 'updateAclSchema', schema: { roles: { editor: role(['Article', 'Tag']) } } },
			{
				modification: 'patchAclSchema',
				patch: [
					{ op: 'move', from: '/roles/editor', path: '/roles/writer' },
					{ op: 'remove', path: '/roles/writer/entities/Tag' },
				],
			},
		]

		const first = schemaMigrator.applyModifications(emptySchema, modifications, 6)
		const second = schemaMigrator.applyModifications(emptySchema, modifications, 6)

		expect(second).toStrictEqual(first)
	})

	test('skips the tokens rfc6902 skips when copying', () => {
		const schema = schemaWithAcl()
		const snapshot = structuredClone(schema)

		schemaMigrator.applyModifications(schema, [{
			modification: 'patchAclSchema',
			patch: [
				{ op: 'replace', path: '/roles/editor/__proto__/entities/Article/operations/read/id', value: false },
				{ op: 'add', path: '/roles/constructor/reader/entities/Tag', value: {} },
				{ op: 'add', path: '/roles/reader/__proto__', value: { injected: true } },
			],
		}], 6)

		expect(schema).toStrictEqual(snapshot)
		expect(Object.getPrototypeOf(schema.acl.roles.reader)).toBe(Object.prototype)
	})
})
