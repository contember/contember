import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

// A nested entity is masked with the through-inclusive `all` permission set. Merging roles renames predicates
// (`__merge__a__b`) and a `through` grant exists only in `all`, so the predicate a nested cell references
// must be resolved against `all` too, never against the root set.

const schema = new SchemaBuilder()
	.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale').ownedBy('post')))
	.entity('PostLocale', entity =>
		entity
			.column('title', column => column.type(Model.ColumnType.String))
			.column('locale', column => column.type(Model.ColumnType.String))
			.column('visible', column => column.type(Model.ColumnType.Bool)))
	.buildSchema()

const postPermissions: Acl.EntityPermissions = {
	predicates: {},
	operations: {
		read: { id: true, locales: true },
	},
}

const listPostQuery = {
	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_"`,
	parameters: [],
	response: {
		rows: [{ root_id: testUuid(1) }],
	},
}

test('nested cell predicate that exists only in the through set is resolved against it', async () => {
	const permissions: Acl.Permissions = {
		Post: postPermissions,
		PostLocale: {
			predicates: {},
			operations: {
				read: { id: true, post: true, title: false },
			},
		},
	}
	const allPermissions: Acl.Permissions = {
		Post: postPermissions,
		PostLocale: {
			predicates: { __merge__throughTitle: { visible: { eq: true } } },
			operations: {
				read: { id: true, post: true, title: '__merge__throughTitle' },
			},
		},
	}
	await execute({
		schema,
		permissions,
		allPermissions,
		query: GQL`
			query {
				listPost {
					locales {
						id
						title
					}
				}
			}`,
		executes: [
			listPostQuery,
			{
				sql: SQL`
					select "root_"."post_id" as "__grouping_key",
					       "root_"."id" as "root_id",
					       "root_"."visible" = ? as "root___predicate___merge__throughTitle",
					       "root_"."title" as "root_title"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?)`,
				parameters: [true, testUuid(1)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_title: 'foo', root___predicate___merge__throughTitle: true },
						{ __grouping_key: testUuid(1), root_id: testUuid(3), root_title: 'bar', root___predicate___merge__throughTitle: false },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						locales: [
							{ id: testUuid(2), title: 'foo' },
							{ id: testUuid(3), title: null },
						],
					},
				],
			},
		},
	})
})

test('nested cell predicate is not simplified against the root row predicate', async () => {
	// The same names denote different definitions in the two sets. The nested rows are filtered with the
	// through row predicate (`locale = 'cs'`), so the cell predicate must not be eliminated against the root
	// row predicate (`visible = true`), which the returned rows were never filtered by.
	const permissions: Acl.Permissions = {
		Post: postPermissions,
		PostLocale: {
			predicates: {
				row: { visible: { eq: true } },
				title: { visible: { eq: true } },
			},
			operations: {
				read: { id: 'row', post: 'row', title: 'title', locale: 'row', visible: 'row' },
			},
		},
	}
	const allPermissions: Acl.Permissions = {
		Post: postPermissions,
		PostLocale: {
			predicates: {
				row: { locale: { eq: 'cs' } },
				title: { visible: { eq: true } },
			},
			operations: {
				read: { id: 'row', post: 'row', title: 'title', locale: 'row', visible: 'row' },
			},
		},
	}
	await execute({
		schema,
		permissions,
		allPermissions,
		query: GQL`
			query {
				listPost {
					locales {
						id
						title
					}
				}
			}`,
		executes: [
			listPostQuery,
			{
				sql: SQL`
					select "root_"."post_id" as "__grouping_key",
					       "root_"."id" as "root_id",
					       "root_"."visible" = ? as "root___predicate_title",
					       "root_"."title" as "root_title"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?) and "root_"."locale" = ?`,
				parameters: [true, testUuid(1), 'cs'],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_title: 'foo', root___predicate_title: true },
						{ __grouping_key: testUuid(1), root_id: testUuid(3), root_title: 'bar', root___predicate_title: false },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						locales: [
							{ id: testUuid(2), title: 'foo' },
							{ id: testUuid(3), title: null },
						],
					},
				],
			},
		},
	})
})

test('nested _meta resolves readable against the through set and updatable against the root set', async () => {
	// `readable` must agree with value masking (through set); `updatable` follows write enforcement (root set).
	// Each name exists only in its own set, so resolving either against the other one throws.
	const permissions: Acl.Permissions = {
		Post: postPermissions,
		PostLocale: {
			predicates: { rootUpdatable: { visible: { eq: true } } },
			operations: {
				read: { id: true, post: true, title: false },
				update: { id: 'rootUpdatable', post: true, title: 'rootUpdatable' },
			},
		},
	}
	const allPermissions: Acl.Permissions = {
		Post: postPermissions,
		PostLocale: {
			predicates: {
				throughReadable: { locale: { eq: 'cs' } },
				throughUpdatable: { visible: { eq: false } },
			},
			operations: {
				read: { id: true, post: true, title: 'throughReadable' },
				update: { id: 'throughUpdatable', post: true, title: 'throughUpdatable' },
			},
		},
	}
	await execute({
		schema,
		permissions,
		allPermissions,
		query: GQL`
			query {
				listPost {
					locales {
						id
						_meta {
							title {
								readable
								updatable
							}
						}
					}
				}
			}`,
		executes: [
			listPostQuery,
			{
				sql: SQL`
					select "root_"."post_id" as "__grouping_key",
					       "root_"."id" as "root_id",
					       "root_"."locale" = ? as "root___predicate_throughReadable",
					       "root_"."visible" = ? as "root___predicateRoot_rootUpdatable"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?)`,
				parameters: ['cs', true, testUuid(1)],
				response: {
					rows: [
						{
							__grouping_key: testUuid(1),
							root_id: testUuid(2),
							root___predicate_throughReadable: true,
							root___predicateRoot_rootUpdatable: false,
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						locales: [
							{ id: testUuid(2), _meta: { title: { readable: true, updatable: false } } },
						],
					},
				],
			},
		},
	})
})

// The value mask and `readable` use the read predicate from the through set; `updatable` uses the update predicate
// from the root set. Each must get its own column whatever the names are and whichever field is selected first.
const rootOnlyColumnCases: { name: string; readPredicate: string; allPermissions: Acl.Permissions }[] = [
	{
		name: 'the same name with a different definition in each set',
		readPredicate: 'check',
		allPermissions: {
			Post: postPermissions,
			PostLocale: {
				predicates: { check: { locale: { eq: 'cs' } } },
				operations: {
					read: { id: true, post: true, title: 'check' },
					update: { id: true, post: true, title: 'check' },
				},
			},
		},
	},
	{
		name: 'a read predicate name that ends like a root-only key',
		readPredicate: 'check__rootPerms',
		allPermissions: {
			Post: postPermissions,
			PostLocale: {
				predicates: { check__rootPerms: { locale: { eq: 'cs' } } },
				operations: {
					read: { id: true, post: true, title: 'check__rootPerms' },
					update: { id: true, post: true, title: 'check__rootPerms' },
				},
			},
		},
	},
]

const rootOnlyColumnPermissions: Acl.Permissions = {
	Post: postPermissions,
	PostLocale: {
		predicates: { check: { visible: { eq: true } } },
		operations: {
			read: { id: true, post: true, title: false },
			update: { id: true, post: true, title: 'check' },
		},
	},
}

for (const { name, readPredicate, allPermissions } of rootOnlyColumnCases) {
	for (const metaFirst of [false, true]) {
		test(`nested root-only _meta.updatable gets its own column: ${name}, ${metaFirst ? '_meta' : 'value'} selected first`, async () => {
			const readAlias = `root___predicate_${readPredicate}`
			const updateAlias = 'root___predicateRoot_check'
			const readColumn = `"root_"."locale" = ? as "${readAlias}"`
			const updateColumn = `"root_"."visible" = ? as "${updateAlias}"`
			const columns = metaFirst
				? [readColumn, updateColumn, '"root_"."title" as "root_title"']
				: [readColumn, '"root_"."title" as "root_title"', updateColumn]
			const meta = '_meta { title { readable updatable } }'
			await execute({
				schema,
				permissions: rootOnlyColumnPermissions,
				allPermissions,
				query: `query { listPost { locales { id ${metaFirst ? `${meta} title` : `title ${meta}`} } } }`,
				executes: [
					listPostQuery,
					{
						sql: SQL`
							select "root_"."post_id" as "__grouping_key", "root_"."id" as "root_id", ${columns.join(', ')}
							from "public"."post_locale" as "root_" where "root_"."post_id" in (?)`,
						parameters: ['cs', true, testUuid(1)],
						response: {
							rows: [
								{ __grouping_key: testUuid(1), root_id: testUuid(2), root_title: 'foo', [readAlias]: true, [updateAlias]: false },
								{ __grouping_key: testUuid(1), root_id: testUuid(3), root_title: 'bar', [readAlias]: false, [updateAlias]: true },
							],
						},
					},
				],
				return: {
					data: {
						listPost: [
							{
								locales: [
									{ id: testUuid(2), title: 'foo', _meta: { title: { readable: true, updatable: false } } },
									{ id: testUuid(3), title: null, _meta: { title: { readable: false, updatable: true } } },
								],
							},
						],
					},
				},
			})
		})
	}
}
