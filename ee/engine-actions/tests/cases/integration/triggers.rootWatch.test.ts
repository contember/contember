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
		`,
		webhook: 'http://foobar',
		selection: `
			title
		`,
	})
	export class Article {
		title = def.stringColumn().unique()
	}

}

test('triggers: root watch', async () => {
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
				updateArticle(by: {title: "Hello world"}, data: {title: "Hi!"}) {
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
					id: '123e4567-e89b-12d3-a456-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-a456-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
				},
				log: [],
			}, {
				payload: {
					id: '123e4567-e89b-12d3-a456-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-a456-000000000003',
						old: { title: 'Hello world' },
						entity: 'Article',
						values: { title: 'Hi!' },
						operation: 'update',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hi!' },
				},
				log: [],
			}],
		},
	})
})


test('triggers: root watch - noop', async () => {
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
				updateArticle(by: {title: "Hello world"}, data: {title: "Hello world"}) {
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
				id: '123e4567-e89b-12d3-a456-000000000004',
				transaction_id: '123e4567-e89b-12d3-a456-000000000002',
				num_retries: 0,
				state: 'created',
				stage_id: '123e4567-e89b-12d3-a456-000000000001',
				schema_id: 1,
				target: 'article_watch_target',
				trigger: 'article_watch',
				priority: 0,
				payload: {
					id: '123e4567-e89b-12d3-a456-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-a456-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
				},
				log: [],
			}],
		},
	})
})


test('triggers: root delete', async () => {
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
                deleteArticle(by: {title: "Hello world"}) {
                    ok
                }
            }
		`,
		return: {
			deleteArticle: {
				ok: true,
			},
		},
		expectSystemDatabase: {
			actions_event: [{
				payload: {
					id: '123e4567-e89b-12d3-a456-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-a456-000000000003',
						entity: 'Article',
						values: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
						operation: 'create',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
				},
				log: [],
			}, {
				payload: {
					id: '123e4567-e89b-12d3-a456-000000000003',
					entity: 'Article',
					events: [{
						id: '123e4567-e89b-12d3-a456-000000000003',
						entity: 'Article',
						operation: 'delete',
					}],
					trigger: 'article_watch',
					operation: 'watch',
					selection: { id: '123e4567-e89b-12d3-a456-000000000003', title: 'Hello world' },
				},
				log: [],
			}],
		},
	})
})

