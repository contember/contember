import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'vitest'
import { createTester, gql } from '../../src/tester'
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
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
				node {id }
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {title: "Hi!"}) {
                ok
            }
        }
	`)
	await tester(gql`
	query {
		eventsToProcess {
			payload
		}
	}
	
	`, {
		path: '/actions/' + tester.projectSlug,
	})
		.expect(200)
		.expect({
			data: {
				eventsToProcess: [{
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							entity: 'Article',
							values: { id: articleId, title: 'Hello world' },
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, title: 'Hello world' },
					},
				}, {
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							old: { title: 'Hello world' },
							entity: 'Article',
							values: { title: 'Hi!' },
							operation: 'update',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, title: 'Hi!' },
					},
				}],
			},
		})

})


test('triggers: root watch - noop', async () => {

	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
                node {id }
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {title: "Hello world"}) {
                ok
            }
        }
	`)
	await tester(gql`
        query {
            eventsToProcess {
                payload
            }
        }

	`, {
		path: '/actions/' + tester.projectSlug,
	})
		.expect(200)
		.expect({
			data: {
				eventsToProcess: [{
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							entity: 'Article',
							values: { id: articleId, title: 'Hello world' },
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, title: 'Hello world' },
					},
				}],
			},
		})

})


test('triggers: root delete', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
                node {id }
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	await tester(gql`
        mutation {
            deleteArticle(by: {title: "Hello world"}) {
                ok
            }
        }
	`)


	await tester(gql`
        query {
            eventsToProcess {
                payload
            }
        }

	`, {
		path: '/actions/' + tester.projectSlug,
	})
		.expect(200)
		.expect({
			data: {
				eventsToProcess: [{
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							entity: 'Article',
							values: { id: articleId, title: 'Hello world' },
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, title: 'Hello world' },
					},
				},
				{
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							entity: 'Article',
							operation: 'delete',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, title: 'Hello world' },
					},
				}],
			},
		})
})

