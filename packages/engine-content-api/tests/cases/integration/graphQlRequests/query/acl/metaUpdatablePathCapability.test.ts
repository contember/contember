import { Acl, Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('_meta.updatable is isolated for shared targets reached through different to-one paths', async () => {
	const schema = new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('editable', column => column.type(Model.ColumnType.Bool))
				.manyHasOne('author', relation => relation.target('Author')))
		.entity('Author', entity => entity.manyHasOne('company', relation => relation.target('Company')))
		.entity('Company', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
		.buildSchema()
	const permissions: Acl.Permissions = {
		Post: {
			predicates: {
				postEditable: { editable: { eq: true } },
			},
			operations: {
				read: { id: true, editable: true, author: true },
				update: { id: true, author: 'postEditable' },
			},
		},
		Author: {
			predicates: {},
			operations: {
				read: { id: true, company: true },
				update: { id: true, company: true },
			},
		},
		Company: {
			predicates: {},
			operations: {
				read: { id: true, name: true },
				update: { id: true, name: true },
			},
		},
	}

	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listPost {
					id
					writer: author {
						id
						employer: company {
							id
							name
							metadata: _meta {
								displayName: name {
									canRead: readable
									canUpdate: updatable
								}
							}
						}
					}
				}
			}
		`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."editable" = ? as "root___mutation_predicate_0",
					       "root_"."author_id" as "root_author"
					from "public"."post" as "root_"
				`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root___mutation_predicate_0: true, root_author: testUuid(3) },
						{ root_id: testUuid(2), root___mutation_predicate_0: false, root_author: testUuid(3) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."id" as "root_id",
					       "root_"."company_id" as "root_company"
					from "public"."author" as "root_"
					where "root_"."id" in (?)
				`,
				parameters: [testUuid(3)],
				response: {
					rows: [{ root_id: testUuid(3), root_company: testUuid(4) }],
				},
			},
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."id" as "root_id",
					       "root_"."name" as "root_name"
					from "public"."company" as "root_"
					where "root_"."id" in (?)
				`,
				parameters: [testUuid(4)],
				response: {
					rows: [{ root_id: testUuid(4), root_name: 'Acme' }],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						writer: {
							id: testUuid(3),
							employer: {
								id: testUuid(4),
								name: 'Acme',
								metadata: { displayName: { canRead: true, canUpdate: true } },
							},
						},
					},
					{
						id: testUuid(2),
						writer: {
							id: testUuid(3),
							employer: {
								id: testUuid(4),
								name: 'Acme',
								metadata: { displayName: { canRead: true, canUpdate: false } },
							},
						},
					},
				],
			},
		},
	})
})

test('_meta.updatable requires both endpoints of a many-to-many path', async () => {
	const schema = new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('title', column => column.type(Model.ColumnType.String))
				.column('targetEditable', column => column.type(Model.ColumnType.Bool))
				.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts')))
		.entity('Category', entity => entity.column('sourceEditable', column => column.type(Model.ColumnType.Bool)))
		.buildSchema()
	const permissions: Acl.Permissions = {
		Post: {
			predicates: {
				targetEditable: { targetEditable: { eq: true } },
			},
			operations: {
				read: { id: true, title: true, targetEditable: true, categories: true },
				update: { id: true, title: true, categories: 'targetEditable' },
			},
		},
		Category: {
			predicates: {
				sourceEditable: { sourceEditable: { eq: true } },
			},
			operations: {
				read: { id: true, sourceEditable: true, posts: true },
				update: { id: true, posts: 'sourceEditable' },
			},
		},
	}

	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listCategory {
					id
					posts {
						id
						title
						_meta {
							title {
								readable
								updatable
							}
						}
					}
				}
			}
		`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."source_editable" = ? as "root___mutation_predicate_0",
					       "root_"."id" as "root_id"
					from "public"."category" as "root_"
				`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root___mutation_predicate_0: true },
						{ root_id: testUuid(2), root___mutation_predicate_0: false },
					],
				},
			},
			{
				sql:
					SQL`select "junction_"."category_id", "junction_"."post_id"  from "public"."post_categories" as "junction_"  where "junction_"."category_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ category_id: testUuid(1), post_id: testUuid(3) },
						{ category_id: testUuid(1), post_id: testUuid(4) },
						{ category_id: testUuid(2), post_id: testUuid(3) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."target_editable" = ? as "root___mutation_predicate_0",
					       "root_"."title" as "root_title",
					       "root_"."id" as "root_id"
					from "public"."post" as "root_"
					where "root_"."id" in (?, ?)
				`,
				parameters: [true, testUuid(3), testUuid(4)],
				response: {
					rows: [
						{ root___mutation_predicate_0: true, root_id: testUuid(3), root_title: 'Allowed' },
						{ root___mutation_predicate_0: false, root_id: testUuid(4), root_title: 'Target blocked' },
					],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						id: testUuid(1),
						posts: [
							{ id: testUuid(3), title: 'Allowed', _meta: { title: { readable: true, updatable: true } } },
							{ id: testUuid(4), title: 'Target blocked', _meta: { title: { readable: true, updatable: false } } },
						],
					},
					{
						id: testUuid(2),
						posts: [
							{ id: testUuid(3), title: 'Allowed', _meta: { title: { readable: true, updatable: false } } },
						],
					},
				],
			},
		},
	})
})

test('_meta.updatable carries the source relation capability through paginated many-to-many fields', async () => {
	const schema = new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('title', column => column.type(Model.ColumnType.String))
				.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts')))
		.entity('Category', entity => entity.column('sourceEditable', column => column.type(Model.ColumnType.Bool)))
		.buildSchema()
	const permissions: Acl.Permissions = {
		Post: {
			predicates: {},
			operations: {
				read: { id: true, title: true, categories: true },
				update: { id: true, title: true, categories: true },
			},
		},
		Category: {
			predicates: {
				sourceEditable: { sourceEditable: { eq: true } },
			},
			operations: {
				read: { id: true, sourceEditable: true, posts: true },
				update: { id: true, posts: 'sourceEditable' },
			},
		},
	}

	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listCategory {
					id
					feed: paginatePosts {
						edges {
							item: node {
								title
								metadata: _meta {
									titleInfo: title {
										canUpdate: updatable
									}
								}
							}
						}
					}
				}
			}
		`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."source_editable" = ? as "root___mutation_predicate_0",
					       "root_"."id" as "root_id"
					from "public"."category" as "root_"
				`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root___mutation_predicate_0: true },
						{ root_id: testUuid(2), root___mutation_predicate_0: false },
					],
				},
			},
			{
				sql:
					SQL`select "junction_"."category_id", "junction_"."post_id"  from "public"."post_categories" as "junction_"  where "junction_"."category_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ category_id: testUuid(1), post_id: testUuid(3) },
						{ category_id: testUuid(2), post_id: testUuid(3) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."title" as "root_title",
					       "root_"."id" as "root_id"
					from "public"."post" as "root_"
					where "root_"."id" in (?)
				`,
				parameters: [testUuid(3)],
				response: {
					rows: [{ root_title: 'Shared', root_id: testUuid(3) }],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						id: testUuid(1),
						feed: {
							edges: [{ item: { title: 'Shared', metadata: { titleInfo: { canUpdate: true } } } }],
						},
					},
					{
						id: testUuid(2),
						feed: {
							edges: [{ item: { title: 'Shared', metadata: { titleInfo: { canUpdate: false } } } }],
						},
					},
				],
			},
		},
	})
})

const inverseOneHasManySchema = new SchemaBuilder()
	.entity('Post', entity =>
		entity
			.column('editable', column => column.type(Model.ColumnType.Bool))
			.oneHasMany('locales', relation =>
				relation.ownedBy('post').target('PostLocale', target =>
					target
						.unique(['locale', 'post'])
						.column('locale', column => column.type(Model.ColumnType.String))
						.column('title', column => column.type(Model.ColumnType.String)))))
	.buildSchema()

test('inverse one-to-many metadata and mutation both require the source relation predicate', async () => {
	const permissions: Acl.Permissions = {
		Post: {
			predicates: { editable: { editable: { eq: true } } },
			operations: {
				read: { id: true, editable: true, locales: true },
				update: { id: true, locales: 'editable' },
			},
		},
		PostLocale: {
			predicates: {},
			operations: {
				read: { id: true, locale: true, title: true, post: true },
				update: { id: true, title: true, post: true },
			},
		},
	}

	await execute({
		schema: inverseOneHasManySchema,
		permissions,
		query: GQL`query {
			getPost(by: {id: "${testUuid(1)}"}) {
				locales {
					locale
					title
					_meta { title { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."editable" = ? as "root___mutation_predicate_0", "root_"."id" as "root_id", "root_"."id" as "root_id"
					from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [true, testUuid(1)],
				response: { rows: [{ root___mutation_predicate_0: false, root_id: testUuid(1) }] },
			},
			{
				sql:
					SQL`select "root_"."post_id" as "__grouping_key", "root_"."locale" as "root_locale", "root_"."title" as "root_title", "root_"."id" as "root_id"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?)`,
				parameters: [testUuid(1)],
				response: { rows: [{ __grouping_key: testUuid(1), root_locale: 'cs', root_title: 'Old', root_id: testUuid(2) }] },
			},
		],
		return: {
			data: {
				getPost: {
					locales: [{ locale: 'cs', title: 'Old', _meta: { title: { updatable: false } } }],
				},
			},
		},
	})

	await execute({
		schema: inverseOneHasManySchema,
		permissions,
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {locales: [{update: {by: {locale: "cs"}, data: {title: "New"}}}]}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select true as "authorized" from "public"."post" as "root_"
					where "root_"."id" = ? and "root_"."editable" = ? for update of "root_"`,
				parameters: [testUuid(1), true],
				response: { rows: [] },
			},
		]),
		return: { data: { updatePost: { ok: false } } },
	})
})

test('inverse one-to-many scalar update ignores the target owning-relation update predicate', async () => {
	const permissions: Acl.Permissions = {
		Post: {
			predicates: {},
			operations: {
				read: { id: true, editable: true, locales: true },
				update: { id: true, locales: true },
			},
		},
		PostLocale: {
			predicates: { deniedOwner: { id: { never: true } } },
			operations: {
				read: { id: true, locale: true, title: true, post: true },
				update: { id: true, title: true, post: 'deniedOwner' },
			},
		},
	}

	await execute({
		schema: inverseOneHasManySchema,
		permissions,
		query: GQL`query {
			getPost(by: {id: "${testUuid(1)}"}) {
				locales {
					locale
					title
					_meta { title { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
			{
				sql:
					SQL`select "root_"."post_id" as "__grouping_key", "root_"."locale" as "root_locale", "root_"."title" as "root_title", "root_"."id" as "root_id"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?)`,
				parameters: [testUuid(1)],
				response: { rows: [{ __grouping_key: testUuid(1), root_locale: 'cs', root_title: 'Old', root_id: testUuid(2) }] },
			},
		],
		return: {
			data: {
				getPost: {
					locales: [{ locale: 'cs', title: 'Old', _meta: { title: { updatable: true } } }],
				},
			},
		},
	})

	await execute({
		schema: inverseOneHasManySchema,
		permissions,
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {locales: [{update: {by: {locale: "cs"}, data: {title: "New"}}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select true as "authorized" from "public"."post" as "root_"
					where "root_"."id" = ? for update of "root_"`,
				parameters: [testUuid(1)],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."post_locale" as "root_"
					where "root_"."locale" = ? and "root_"."post_id" = ?`,
				parameters: ['cs', testUuid(1)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`with "newData_" as
					(select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."locale", "root_"."post_id"
						from "public"."post_locale" as "root_" where "root_"."id" = ?)
					update "public"."post_locale" set "title" = "newData_"."title" from "newData_"
					where "post_locale"."id" = "newData_"."id" returning "title_old__"`,
				parameters: ['New', testUuid(2)],
				response: { rows: [{ title_old__: 'Old' }] },
			},
		]),
		return: { data: { updatePost: { ok: true } } },
	})
})

test('inverse one-to-many source capability is preserved by reducer and pagination traversal', async () => {
	const permissions: Acl.Permissions = {
		Post: {
			predicates: { editable: { editable: { eq: true } } },
			operations: {
				read: { id: true, editable: true, locales: true },
				update: { id: true, locales: 'editable' },
			},
		},
		PostLocale: {
			predicates: {},
			operations: {
				read: { id: true, locale: true, title: true, post: true },
				update: { id: true, title: true, post: true },
			},
		},
	}

	await execute({
		schema: inverseOneHasManySchema,
		permissions,
		query: GQL`query {
			listPost {
				id
				locale: localesByLocale(by: {locale: "cs"}) {
					title
					_meta { title { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."editable" = ? as "root___mutation_predicate_0", "root_"."id" as "root_id"
					from "public"."post" as "root_"`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root___mutation_predicate_0: true },
						{ root_id: testUuid(2), root___mutation_predicate_0: false },
					],
				},
			},
			{
				sql: SQL`select "root_"."post_id" as "root_post", "root_"."title" as "root_title", "root_"."id" as "root_id"
					from "public"."post_locale" as "root_"
					where "root_"."locale" = ? and "root_"."post_id" in (?, ?)`,
				parameters: ['cs', testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ root_post: testUuid(1), root_title: 'First', root_id: testUuid(3) },
						{ root_post: testUuid(2), root_title: 'Second', root_id: testUuid(4) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{ id: testUuid(1), locale: { title: 'First', _meta: { title: { updatable: true } } } },
					{ id: testUuid(2), locale: { title: 'Second', _meta: { title: { updatable: false } } } },
				],
			},
		},
	})

	await execute({
		schema: inverseOneHasManySchema,
		permissions,
		query: GQL`query {
			listPost {
				id
				feed: paginateLocales {
					edges {
						item: node {
							title
							_meta { title { updatable } }
						}
					}
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."editable" = ? as "root___mutation_predicate_0", "root_"."id" as "root_id"
					from "public"."post" as "root_"`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root___mutation_predicate_0: true },
						{ root_id: testUuid(2), root___mutation_predicate_0: false },
					],
				},
			},
			{
				sql: SQL`select "root_"."post_id" as "__grouping_key", "root_"."title" as "root_title", "root_"."id" as "root_id"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_title: 'First', root_id: testUuid(3) },
						{ __grouping_key: testUuid(2), root_title: 'Second', root_id: testUuid(4) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{ id: testUuid(1), feed: { edges: [{ item: { title: 'First', _meta: { title: { updatable: true } } } }] } },
					{ id: testUuid(2), feed: { edges: [{ item: { title: 'Second', _meta: { title: { updatable: false } } } }] } },
				],
			},
		},
	})
})

const oneHasOneSchema = new SchemaBuilder()
	.entity('Site', entity =>
		entity
			.column('name', column => column.type(Model.ColumnType.String))
			.column('editable', column => column.type(Model.ColumnType.Bool))
			.oneHasOne('setting', relation => relation.target('Setting').inversedBy('site')))
	.entity('Setting', entity => entity.column('label', column => column.type(Model.ColumnType.String)))
	.buildSchema()

test('owning one-to-one metadata requires its source relation predicate', async () => {
	const permissions: Acl.Permissions = {
		Site: {
			predicates: { editable: { editable: { eq: true } } },
			operations: {
				read: { id: true, name: true, editable: true, setting: true },
				update: { id: true, setting: 'editable' },
			},
		},
		Setting: {
			predicates: {},
			operations: {
				read: { id: true, label: true, site: true },
				update: { id: true, label: true, site: true },
			},
		},
	}

	await execute({
		schema: oneHasOneSchema,
		permissions,
		query: GQL`query {
			getSite(by: {id: "${testUuid(1)}"}) {
				setting {
					label
					_meta { label { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."editable" = ? as "root___mutation_predicate_0", "root_"."setting_id" as "root_setting", "root_"."id" as "root_id"
					from "public"."site" as "root_" where "root_"."id" = ?`,
				parameters: [true, testUuid(1)],
				response: { rows: [{ root___mutation_predicate_0: false, root_setting: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."label" as "root_label", "root_"."id" as "root_id"
					from "public"."setting" as "root_" where "root_"."id" in (?)`,
				parameters: [testUuid(2)],
				response: { rows: [{ root_label: 'Old', root_id: testUuid(2) }] },
			},
		],
		return: {
			data: { getSite: { setting: { label: 'Old', _meta: { label: { updatable: false } } } } },
		},
	})
})

test('inverse one-to-one metadata and mutation both require the source relation predicate', async () => {
	const permissions: Acl.Permissions = {
		Site: {
			predicates: {},
			operations: {
				read: { id: true, name: true, editable: true, setting: true },
				update: { id: true, name: true, setting: true },
			},
		},
		Setting: {
			predicates: { editable: { label: { eq: 'Editable' } } },
			operations: {
				read: { id: true, label: true, site: true },
				update: { id: true, site: 'editable' },
			},
		},
	}

	await execute({
		schema: oneHasOneSchema,
		permissions,
		query: GQL`query {
			getSetting(by: {id: "${testUuid(2)}"}) {
				site {
					name
					_meta { name { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."label" = ? as "root___mutation_predicate_0", "root_"."id" as "root_id", "root_"."id" as "root_id"
					from "public"."setting" as "root_" where "root_"."id" = ?`,
				parameters: ['Editable', testUuid(2)],
				response: { rows: [{ root___mutation_predicate_0: false, root_id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."name" as "root_name", "root_"."id" as "root_id"
					from "public"."site" as "root_" where "root_"."setting_id" in (?)`,
				parameters: [testUuid(2)],
				response: { rows: [{ root_setting: testUuid(2), root_name: 'Old', root_id: testUuid(1) }] },
			},
		],
		return: {
			data: { getSetting: { site: { name: 'Old', _meta: { name: { updatable: false } } } } },
		},
	})

	await execute({
		schema: oneHasOneSchema,
		permissions,
		query: GQL`mutation {
			updateSetting(by: {id: "${testUuid(2)}"}, data: {site: {update: {name: "New"}}}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."setting" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select true as "authorized" from "public"."setting" as "root_"
					where "root_"."id" = ? and "root_"."label" = ? for update of "root_"`,
				parameters: [testUuid(2), 'Editable'],
				response: { rows: [] },
			},
		]),
		return: { data: { updateSetting: { ok: false } } },
	})
})

test('inverse one-to-one scalar metadata ignores the target owning-relation update predicate', async () => {
	const permissions: Acl.Permissions = {
		Site: {
			predicates: { deniedSetting: { id: { never: true } } },
			operations: {
				read: { id: true, name: true, editable: true, setting: true },
				update: { id: true, name: true, setting: 'deniedSetting' },
			},
		},
		Setting: {
			predicates: {},
			operations: {
				read: { id: true, label: true, site: true },
				update: { id: true, site: true },
			},
		},
	}

	await execute({
		schema: oneHasOneSchema,
		permissions,
		query: GQL`query {
			getSetting(by: {id: "${testUuid(2)}"}) {
				site {
					name
					_meta { name { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."setting" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ root_id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."name" as "root_name", "root_"."id" as "root_id"
					from "public"."site" as "root_" where "root_"."setting_id" in (?)`,
				parameters: [testUuid(2)],
				response: { rows: [{ root_setting: testUuid(2), root_name: 'Old', root_id: testUuid(1) }] },
			},
		],
		return: {
			data: { getSetting: { site: { name: 'Old', _meta: { name: { updatable: true } } } } },
		},
	})

	await execute({
		schema: oneHasOneSchema,
		permissions,
		query: GQL`mutation {
			updateSetting(by: {id: "${testUuid(2)}"}, data: {site: {update: {name: "New"}}}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."setting" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select true as "authorized" from "public"."setting" as "root_"
					where "root_"."id" = ? for update of "root_"`,
				parameters: [testUuid(2)],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."setting_id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`with "newData_" as
					(select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id", "root_"."editable", "root_"."setting_id"
						from "public"."site" as "root_" where "root_"."id" = ?)
					update "public"."site" set "name" = "newData_"."name" from "newData_"
					where "site"."id" = "newData_"."id" returning "name_old__"`,
				parameters: ['New', testUuid(1)],
				response: { rows: [{ name_old__: 'Old' }] },
			},
		]),
		return: { data: { updateSetting: { ok: true } } },
	})
})

test('unidirectional many-to-many source capability masks metadata selected through a fragment', async () => {
	const schema = new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('editable', column => column.type(Model.ColumnType.Bool))
				.manyHasMany('categories', relation =>
					relation.target('Category', target => target.column('name', column => column.type(Model.ColumnType.String)))))
		.buildSchema()
	const permissions: Acl.Permissions = {
		Post: {
			predicates: { editable: { editable: { eq: true } } },
			operations: {
				read: { id: true, editable: true, categories: true },
				update: { id: true, categories: 'editable' },
			},
		},
		Category: {
			predicates: {},
			operations: {
				read: { id: true, name: true },
				update: { id: true, name: true },
			},
		},
	}

	await execute({
		schema,
		permissions,
		query: GQL`query {
			getPost(by: {id: "${testUuid(1)}"}) {
				items: categories {
					...CategoryCapability
				}
			}
		}
		fragment CategoryCapability on Category {
			name
			metadata: _meta { field: name { canUpdate: updatable } }
		}`,
		executes: [
			{
				sql: SQL`select "root_"."editable" = ? as "root___mutation_predicate_0", "root_"."id" as "root_id", "root_"."id" as "root_id"
					from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [true, testUuid(1)],
				response: { rows: [{ root___mutation_predicate_0: false, root_id: testUuid(1) }] },
			},
			{
				sql: SQL`select "junction_"."category_id", "junction_"."post_id" from "public"."post_categories" as "junction_"
					where "junction_"."post_id" in (?)`,
				parameters: [testUuid(1)],
				response: { rows: [{ post_id: testUuid(1), category_id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id"
					from "public"."category" as "root_" where "root_"."id" in (?)`,
				parameters: [testUuid(2)],
				response: { rows: [{ root_name: 'Category', root_id: testUuid(2) }] },
			},
		],
		return: {
			data: {
				getPost: {
					items: [{ name: 'Category', metadata: { field: { canUpdate: false } } }],
				},
			},
		},
	})
})

test('self many-to-many metadata combines source and inverse endpoint capabilities', async () => {
	const schema = new SchemaBuilder()
		.entity('Person', entity =>
			entity
				.column('name', column => column.type(Model.ColumnType.String))
				.manyHasMany('friends', relation => relation.target('Person').inversedBy('followers')))
		.buildSchema()
	const permissions: Acl.Permissions = {
		Person: {
			predicates: {
				sourceAllowed: { name: { eq: 'Source' } },
				targetAllowed: { name: { eq: 'Target' } },
			},
			operations: {
				read: { id: true, name: true, friends: true, followers: true },
				update: { id: true, name: true, friends: 'sourceAllowed', followers: 'targetAllowed' },
			},
		},
	}

	await execute({
		schema,
		permissions,
		query: GQL`query {
			getPerson(by: {id: "${testUuid(1)}"}) {
				friends {
					name
					_meta { name { updatable } }
				}
			}
		}`,
		executes: [
			{
				sql: SQL`select "root_"."name" = ? as "root___mutation_predicate_0", "root_"."id" as "root_id", "root_"."id" as "root_id"
					from "public"."person" as "root_" where "root_"."id" = ?`,
				parameters: ['Source', testUuid(1)],
				response: { rows: [{ root___mutation_predicate_0: true, root_id: testUuid(1) }] },
			},
			{
				sql: SQL`select "junction_"."friends_id", "junction_"."person_id" from "public"."person_friends" as "junction_"
					where "junction_"."person_id" in (?)`,
				parameters: [testUuid(1)],
				response: { rows: [{ person_id: testUuid(1), friends_id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."name" = ? as "root___mutation_predicate_0", "root_"."name" as "root_name", "root_"."id" as "root_id"
					from "public"."person" as "root_" where "root_"."id" in (?)`,
				parameters: ['Target', testUuid(2)],
				response: { rows: [{ root___mutation_predicate_0: false, root_name: 'Blocked', root_id: testUuid(2) }] },
			},
		],
		return: {
			data: {
				getPerson: {
					friends: [{ name: 'Blocked', _meta: { name: { updatable: false } } }],
				},
			},
		},
	})
})
