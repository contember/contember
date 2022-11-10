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
			category {
				name
			}
		`,
		webhook: 'http://foobar',
		selection: `
			title
			category {
				name
			}
		`,
	})
	export class Article {
		title = def.stringColumn().unique()
		category = def.manyHasOne(Category)
	}

	export class Category {
		name = def.stringColumn().unique()
	}
}

test('triggers: many has one watch - field update', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", category: {create: {name: "Tutorials"}}}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateCategory(by: {name: "Tutorials"}, data: {name: "Guides"}) {
					ok
				}
			}
		`,
		return: {
			updateCategory: {
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
						values: {
							id: '123e4567-e89b-12d3-1111-000000000003',
							title: 'Hello world',
							category: '123e4567-e89b-12d3-1111-000000000004',
						},
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Tutorials' },
					},
				},
			}, {
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000004',
						old: { name: 'Tutorials' },
						path: ['category'],
						entity: 'Category',
						values: { name: 'Guides' },
						operation: 'update',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Guides' },
					},
				},
			}],
		},
	})
})


test('triggers: many has one watch - field update - noop', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", category: {create: {name: "Tutorials"}}}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateCategory(by: {name: "Tutorials"}, data: {name: "Tutorials"}) {
					ok
				}
			}
		`,
		return: {
			updateCategory: {
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
						values: {
							id: '123e4567-e89b-12d3-1111-000000000003',
							title: 'Hello world',
							category: '123e4567-e89b-12d3-1111-000000000004',
						},
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Tutorials' },
					},
				},
			}],
		},
	})
})


test('triggers: many has one watch - connect - noop', async () => {
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
						createCategory(data: {name: "Tutorials"}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {category: {connect: {name: "Tutorials"}}}) {
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
						values: {
							id: '123e4567-e89b-12d3-1111-000000000003',
							title: 'Hello world',
							category: null,
						},
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: null,
					},
				},
			}, {
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						old: { category: null },
						entity: 'Article',
						values: { category: '123e4567-e89b-12d3-1111-000000000006' },
						operation: 'update',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: { id: '123e4567-e89b-12d3-1111-000000000006', name: 'Tutorials' },
					},
				},
			}],
		},
	})
})


test('triggers: many has one watch - connect - noop', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", category: {create: {name: "Tutorials"}}}) {
							ok
						}
						createCategory(data: {name: "Tutorials"}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {category: {connect: {name: "Tutorials"}}}) {
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
						values: {
							id: '123e4567-e89b-12d3-1111-000000000003',
							title: 'Hello world',
							category: '123e4567-e89b-12d3-1111-000000000004',
						},
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Tutorials' },
					},
				},
			}],
		},
	})
})


test('triggers: many has one watch - disconnect', async () => {
	const schema = createSchema(ActionsModel)
	await executeDbTest({
		executionContainerFactoryFactory,
		migrationGroups: { 'contember/actions': migrationsGroup },
		schema: schema,
		seed: [
			{
				query: gql`
					mutation {
						createArticle(data: {title: "Hello world", category: {create: {name: "Tutorials"}}}) {
							ok
						}
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {category: {disconnect: true}}) {
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
						values: {
							id: '123e4567-e89b-12d3-1111-000000000003',
							title: 'Hello world',
							category: '123e4567-e89b-12d3-1111-000000000004',
						},
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Tutorials' },
					},
				},
			}, {
				payload: {
					id: '123e4567-e89b-12d3-1111-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-1111-000000000003',
						old: { category: '123e4567-e89b-12d3-1111-000000000004' },
						entity: 'Article',
						values: { category: null },
						operation: 'update',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: null,
					},
				},
			}],
		},
	})
})



test('triggers: many has one watch - disconnect - noop', async () => {
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
					}
				`,
			},
		],
		query: gql`
			mutation {
				updateArticle(by: {title: "Hello world"}, data: {category: {disconnect: true}}) {
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
						values: {
							id: '123e4567-e89b-12d3-1111-000000000003',
							title: 'Hello world',
							category: null,
						},
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: {
						id: '123e4567-e89b-12d3-1111-000000000003',
						title: 'Hello world',
						category: null,
					},
				},
			}],
		},
	})
})
