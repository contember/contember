import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('patch acl', {
	originalSchema: new SchemaBuilder()
		.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedAcl: {
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
})
