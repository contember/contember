import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'vitest'
import { executeDbTest } from '@contember/engine-api-tester'
import { gql } from '../../src/gql'
import { migrationsGroup } from '../../../src/migrations'
import { executionContainerFactoryFactory } from './utils'

namespace ActionsModel {

	@actions.watch({
		name: 'article_watch',
		watch: `
			title
			tags {
				name
			}
		`,
		webhook: 'http://foobar',
		selection: `
			title
			tags {
				name
			}
		`,
	})
	export class Article {
		title = def.stringColumn().unique()
		tags = def.manyHasMany(Tag)
	}

	export class Tag {
		name = def.stringColumn().unique()
	}
}

test('triggers: many has many watch - field update', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateTag(by: {name: "graphql"}, data: {name: "GraphQL"}) {
					ok
				}
			}
		`,
		return: {
			updateTag: {
				ok: true,
			},
		},
		expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-1111-000000000003', title: 'Hello world' },
						operation: 'create',
					}, {
						id: '123e4567-e89b-12d3-1111-000000000003',
						path: [],
						entity: 'Article',
						relation: 'tags',
						inverseId: '123e4567-e89b-12d3-1111-000000000004',
						operation: 'junction_connect',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						tags: [{ id: '123e4567-e89b-12d3-1111-000000000004', name: 'graphql' }],
						title: 'Hello world',
					},
				},
			}, {
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000004',
						old: { name: 'graphql' },
						path: ['tags'],
						entity: 'Tag',
						values: { name: 'GraphQL' },
						operation: 'update',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						tags: [{ id: '123e4567-e89b-12d3-1111-000000000004', name: 'GraphQL' }],
						title: 'Hello world',
					},
				},
			}],
		},
	})
})


test('triggers: many has many watch - field update - noop', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateTag(by: {name: "graphql"}, data: {name: "graphql"}) {
					ok
				}
			}
		`,
		return: {
			updateTag: {
				ok: true,
			},
		},
		expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-1111-000000000003', title: 'Hello world' },
						operation: 'create',
					}, {
						id: '123e4567-e89b-12d3-1111-000000000003',
						path: [],
						entity: 'Article',
						relation: 'tags',
						inverseId: '123e4567-e89b-12d3-1111-000000000004',
						operation: 'junction_connect',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						tags: [{ id: '123e4567-e89b-12d3-1111-000000000004', name: 'graphql' }],
						title: 'Hello world',
					},
				},
			}],
		},
	})
})


test('triggers: many has many watch - connect', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world"}) {
							ok
						}
						createTag(data: {name: "graphql"}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {tags: {connect: {name: "graphql"}}}) {
					ok
				}
			}
		`,
		return: {
			updateArticle: {
				ok: true,
			},
		},
		expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-1111-000000000003', title: 'Hello world' },
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-1111-000000000003', tags: [], title: 'Hello world' },
				},
			}, {
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						path: [],
						entity: 'Article',
						relation: 'tags',
						inverseId: '123e4567-e89b-12d3-1111-000000000006',
						operation: 'junction_connect',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						tags: [{ id: '123e4567-e89b-12d3-1111-000000000006', name: 'graphql' }],
						title: 'Hello world',
					},
				},
			}],
		},
	})
})


test('triggers: many has many watch - connect - noop', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {tags: {connect: {name: "graphql"}}}) {
					ok
				}
			}
		`,
		return: {
			updateArticle: {
				ok: true,
			},
		}, expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-1111-000000000003', title: 'Hello world' },
						operation: 'create',
					}, {
						id: '123e4567-e89b-12d3-1111-000000000003',
						path: [],
						entity: 'Article',
						relation: 'tags',
						inverseId: '123e4567-e89b-12d3-1111-000000000004',
						operation: 'junction_connect',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						tags: [{ id: '123e4567-e89b-12d3-1111-000000000004', name: 'graphql' }],
						title: 'Hello world',
					},
				},
			}],
		},
	})
})


test('triggers: many has many watch - disconnect', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {tags: {disconnect: {name: "graphql"}}}) {
					ok
				}
			}
		`,
		return: {
			updateArticle: {
				ok: true,
			},
		},
		expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-1111-000000000003', title: 'Hello world' },
						operation: 'create',
					}, {
						id: '123e4567-e89b-12d3-1111-000000000003',
						path: [],
						entity: 'Article',
						relation: 'tags',
						inverseId: '123e4567-e89b-12d3-1111-000000000004',
						operation: 'junction_connect',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						tags: [{ id: '123e4567-e89b-12d3-1111-000000000004', name: 'graphql' }],
						title: 'Hello world',
					},
				},
			}, {
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						path: [],
						entity: 'Article',
						relation: 'tags',
						inverseId: '123e4567-e89b-12d3-1111-000000000004',
						operation: 'junction_disconnect',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-1111-000000000003', tags: [], title: 'Hello world' },
				},
			}],
		},
	})
})

test('triggers: many has many watch - disconnect - noop', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world"}) {
							ok
						}
						createTag(data: {name: "graphql"}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {tags: {disconnect: {name: "graphql"}}}) {
					ok
				}
			}
		`,
		return: {
			updateArticle: {
				ok: true,
			},
		},
		expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-1111-000000000003', title: 'Hello world' },
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-1111-000000000003', tags: [], title: 'Hello world' },
				},
			}],
		},
	})
})
