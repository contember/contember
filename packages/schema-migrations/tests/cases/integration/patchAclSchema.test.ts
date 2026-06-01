import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

describe('patch acl', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			acl: {
				roles: {
					admin: {
						variables: {},
						stages: '*',
						entities: {
							Site: {
								predicates: {},
								operations: {
									read: {
										id: true,
									},
								},
							},
						},
					},
				},
			},
		},
		diff: [
			{
				modification: 'patchAclSchema',
				patch: [
					{
						op: 'add',
						path: '/roles/admin',
						value: {
							variables: {},
							entities: {
								Site: {
									operations: {
										read: {
											id: true,
										},
									},
									predicates: {},
								},
							},
							stages: '*',
						},
					},
				],
			},
		],
		sql: SQL``,
	}))
