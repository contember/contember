import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester'

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
		category = def.manyHasOne(Category).cascadeOnDelete()
	}

	export class Category {
		name = def.stringColumn().unique()
	}
}

test('triggers: cascade delete - delete referenced entity', async () => {


	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)


	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world", category: {create: {name: "Tutorials"}}}) {
                ok
                node {id category {id}}
            }
        }
	`)
		.expect(200)

	const articleId = res.body.data.createArticle.node.id
	const categoryId = res.body.data.createArticle.node.category.id

	await tester(gql`
        mutation {
            deleteCategory(by: {name: "Tutorials"}) {
                ok
            }
        }
	`)
		.expect(200)
		.expect({
			data: {
				deleteCategory: {
					ok: true,
				},
			},
		})

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
							values: {
								id: articleId,
								title: 'Hello world',
								category: categoryId,
							},
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							title: 'Hello world',
							category: { id: categoryId, name: 'Tutorials' },
						},
					},
				}, {
					payload: {
						'id': articleId,
						'entity': 'Article',
						'events': [{
							'id': categoryId,
							'path': ['category'],
							'entity': 'Category',
							'operation': 'delete',
						}, { 'id': articleId, 'entity': 'Article', 'operation': 'delete' }],
						'trigger': 'article_watch',
						'operation': 'watch',
						'selection': {
							'id': articleId,
							'title': 'Hello world',
							'category': { 'id': categoryId, 'name': 'Tutorials' },
						},
					},
				}],
			},
		})
})


