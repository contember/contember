import { expect, test } from 'bun:test'
import { ProjectRole, Schema } from '@contember/schema'
import { emptySchema, normalizeSchema } from '../../../src/index.js'

test('merges the content and system sections of a defined admin role with the built-in ones', () => {
	const schema: Schema = {
		...emptySchema,
		acl: {
			roles: {
				[ProjectRole.ADMIN]: {
					entities: {},
					variables: {},
					stages: '*',
					content: { assumeMembership: { editor: true } },
					system: { history: true },
				},
			},
		},
	}
	const admin = normalizeSchema(schema).acl.roles[ProjectRole.ADMIN]
	expect(admin.content).toEqual({ export: true, import: true, refreshMaterializedView: true, assumeMembership: { editor: true } })
	expect(admin.system).toEqual({ export: true, import: true, history: true })
	expect(admin.entities).toEqual({})
})

test('merges the content and system sections of a defined content admin role with the built-in ones', () => {
	const schema: Schema = {
		...emptySchema,
		acl: {
			roles: {
				[ProjectRole.CONTENT_ADMIN]: {
					entities: {},
					variables: {},
					stages: '*',
					content: { refreshMaterializedView: false },
				},
			},
		},
	}
	const contentAdmin = normalizeSchema(schema).acl.roles[ProjectRole.CONTENT_ADMIN]
	expect(contentAdmin.content).toEqual({ export: true, import: true, refreshMaterializedView: false })
	expect(contentAdmin.system).toEqual({ history: true, export: true, import: true })
})
