import { Model, Schema } from '@contember/schema'
import { describe, expect, test } from 'bun:test'
import { normalizeSchema } from '../../../src/schemaNormalizer'

describe('normalizeSchema', () => {
	test('should process field aliases correctly', () => {
		const schema: Schema = {
			model: {
				entities: {
					Author: {
						name: 'Author',
						primary: 'id',
						primaryColumn: 'id',
						tableName: 'author',
						unique: [] as readonly Model.Unique[],
						indexes: [] as readonly Model.Index[],
						eventLog: {
							enabled: true,
						},
						fields: {
							id: {
								name: 'id',
								type: Model.ColumnType.Uuid,
								columnType: 'uuid',
								columnName: 'id',
								nullable: false,
							},
							name: {
								name: 'name',
								type: Model.ColumnType.String,
								columnType: 'text',
								columnName: 'name',
								nullable: false,
								aliases: ['fullName', 'authorName'],
							},
							email: {
								name: 'email',
								type: Model.ColumnType.String,
								columnType: 'text',
								columnName: 'email',
								nullable: false,
								aliases: ['contactEmail'],
							},
						},
					},
				},
				enums: {},
			},
			acl: {
				roles: {
					admin: {
						stages: '*',
						variables: {},
						entities: {
							Author: {
								predicates: {},
								operations: {
									read: {
										name: true,
										email: true,
									},
									create: {
										name: true,
										email: true,
									},
									update: {
										name: true,
										email: true,
									},
								},
							},
						},
					},
				},
			},
			validation: {},
			actions: {
				triggers: {},
				targets: {},
			},
			settings: {},
		} as const

		const normalized = normalizeSchema(schema)

		expect(normalized.model.entities.Author.fields).toHaveProperty('fullName')
		expect(normalized.model.entities.Author.fields).toHaveProperty('authorName')
		expect(normalized.model.entities.Author.fields).toHaveProperty('contactEmail')

		expect(normalized.model.entities.Author.fields.fullName).toEqual({
			name: 'fullName',
			type: Model.ColumnType.String,
			columnType: 'text',
			columnName: 'name',
			nullable: false,
			deprecationReason: 'Use the name field instead.',
		})

		expect(normalized.acl.roles.admin.entities.Author.operations.read).toHaveProperty('fullName')
		expect(normalized.acl.roles.admin.entities.Author.operations.read).toHaveProperty('authorName')
		expect(normalized.acl.roles.admin.entities.Author.operations.read).toHaveProperty('contactEmail')

		expect(normalized.acl.roles.admin.entities.Author.operations.create).toHaveProperty('fullName')
		expect(normalized.acl.roles.admin.entities.Author.operations.create).toHaveProperty('authorName')
		expect(normalized.acl.roles.admin.entities.Author.operations.create).toHaveProperty('contactEmail')

		expect(normalized.acl.roles.admin.entities.Author.operations.update).toHaveProperty('fullName')
		expect(normalized.acl.roles.admin.entities.Author.operations.update).toHaveProperty('authorName')
		expect(normalized.acl.roles.admin.entities.Author.operations.update).toHaveProperty('contactEmail')
	})

	test('should handle relations with aliases', () => {
		const schema: Schema = {
			model: {
				entities: {
					Author: {
						name: 'Author',
						primary: 'id',
						primaryColumn: 'id',
						tableName: 'author',
						unique: [] as readonly Model.Unique[],
						indexes: [] as readonly Model.Index[],
						eventLog: {
							enabled: true,
						},
						fields: {
							id: {
								name: 'id',
								type: Model.ColumnType.Uuid,
								columnType: 'uuid',
								columnName: 'id',
								nullable: false,
							},
							posts: {
								name: 'posts',
								type: Model.RelationType.OneHasMany,
								target: 'Post',
								ownedBy: 'author',
								aliases: ['articles', 'writings'],
							},
						},
					},
					Post: {
						name: 'Post',
						primary: 'id',
						primaryColumn: 'id',
						tableName: 'post',
						unique: [] as readonly Model.Unique[],
						indexes: [] as readonly Model.Index[],
						eventLog: {
							enabled: true,
						},
						fields: {
							id: {
								name: 'id',
								type: Model.ColumnType.Uuid,
								columnType: 'uuid',
								columnName: 'id',
								nullable: false,
							},
							author: {
								name: 'author',
								type: Model.RelationType.ManyHasOne,
								target: 'Author',
								inversedBy: 'posts',
								joiningColumn: {
									columnName: 'author_id',
									onDelete: Model.OnDelete.cascade,
								},
								nullable: false,
							},
						},
					},
				},
				enums: {},
			},
			acl: {
				roles: {
					admin: {
						stages: '*',
						variables: {},
						entities: {
							Author: {
								predicates: {},
								operations: {
									read: {
										posts: true,
									},
									create: {
										posts: true,
									},
									update: {
										posts: true,
									},
								},
							},
						},
					},
				},
			},
			validation: {},
			actions: {
				triggers: {},
				targets: {},
			},
			settings: {},
		} as const

		const normalized = normalizeSchema(schema)

		expect(normalized.model.entities.Author.fields).toHaveProperty('articles')
		expect(normalized.model.entities.Author.fields).toHaveProperty('writings')

		expect(normalized.model.entities.Author.fields.articles).toEqual({
			name: 'articles',
			type: Model.RelationType.OneHasMany,
			target: 'Post',
			ownedBy: 'author',
			deprecationReason: 'Use the posts field instead.',
		})

		expect(normalized.acl.roles.admin.entities.Author.operations.read).toHaveProperty('articles')
		expect(normalized.acl.roles.admin.entities.Author.operations.read).toHaveProperty('writings')

		expect(normalized.acl.roles.admin.entities.Author.operations.create).toHaveProperty('articles')
		expect(normalized.acl.roles.admin.entities.Author.operations.create).toHaveProperty('writings')

		expect(normalized.acl.roles.admin.entities.Author.operations.update).toHaveProperty('articles')
		expect(normalized.acl.roles.admin.entities.Author.operations.update).toHaveProperty('writings')
	})

	test('should handle deprecated fields', () => {
		const schema: Schema = {
			model: {
				entities: {
					Author: {
						name: 'Author',
						primary: 'id',
						primaryColumn: 'id',
						tableName: 'author',
						unique: [] as readonly Model.Unique[],
						indexes: [] as readonly Model.Index[],
						eventLog: {
							enabled: true,
						},
						fields: {
							id: {
								name: 'id',
								type: Model.ColumnType.Uuid,
								columnType: 'uuid',
								columnName: 'id',
								nullable: false,
							},
							oldName: {
								name: 'oldName',
								type: Model.ColumnType.String,
								columnType: 'text',
								columnName: 'old_name',
								nullable: false,
								deprecationReason: 'Use the name field instead.',
							},
							name: {
								name: 'name',
								type: Model.ColumnType.String,
								columnType: 'text',
								columnName: 'name',
								nullable: false,
							},
						},
					},
				},
				enums: {},
			},
			acl: {
				roles: {
					admin: {
						stages: '*',
						variables: {},
						entities: {
							Author: {
								predicates: {},
								operations: {
									read: {
										oldName: true,
										name: true,
									},
									create: {
										oldName: true,
										name: true,
									},
									update: {
										oldName: true,
										name: true,
									},
								},
							},
						},
					},
				},
			},
			validation: {},
			actions: {
				triggers: {},
				targets: {},
			},
			settings: {},
		} as const

		const normalized = normalizeSchema(schema)

		expect(normalized.model.entities.Author.fields).toHaveProperty('oldName')
		expect(normalized.model.entities.Author.fields.oldName).toEqual({
			name: 'oldName',
			type: Model.ColumnType.String,
			columnType: 'text',
			columnName: 'old_name',
			nullable: false,
			deprecationReason: 'Use the name field instead.',
		})

		expect(normalized.acl.roles.admin.entities.Author.operations.read).toHaveProperty('oldName')
		expect(normalized.acl.roles.admin.entities.Author.operations.create).toHaveProperty('oldName')
		expect(normalized.acl.roles.admin.entities.Author.operations.update).toHaveProperty('oldName')
	})
})
