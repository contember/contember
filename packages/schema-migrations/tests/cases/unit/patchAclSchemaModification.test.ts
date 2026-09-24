import { describe, expect, test } from 'bun:test'
import { Acl, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
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
})
