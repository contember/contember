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
		category = def.manyHasOne(Category)
	}

	export class Category {
		name = def.stringColumn().unique()
	}
}

test('triggers: many has one watch - field update', async () => {

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
			updateCategory(by: {name: "Tutorials"}, data: {name: "Guides"}) {
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
						id: articleId,
						entity: 'Article',
						events: [{
							id: categoryId,
							old: { name: 'Tutorials' },
							path: ['category'],
							entity: 'Category',
							values: { name: 'Guides' },
							operation: 'update',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							title: 'Hello world',
							category: { id: categoryId, name: 'Guides' },
						},
					},
				}],
			},
		})
})


test('triggers: many has one watch - field update - noop', async () => {
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
            updateCategory(by: {name: "Tutorials"}, data: {name: "Tutorials"}) {
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
				}],
			},
		})
})


test('triggers: many has one watch - connect', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
				node {id}
            }
            createCategory(data: {name: "Tutorials"}) {
                ok
				node {id}
            }
        }
	`)
		.expect(200)

	const articleId = res.body.data.createArticle.node.id
	const categoryId = res.body.data.createCategory.node.id

	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {category: {connect: {name: "Tutorials"}}}) {
                ok
            }
        }
	`)
		.expect(200)
		.expect({
			data: {
				updateArticle: {
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
								category: null,
							},
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							title: 'Hello world',
							category: null,
						},
					},
				}, {
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							old: { category: null },
							entity: 'Article',
							values: { category: categoryId },
							operation: 'update',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							title: 'Hello world',
							category: { id: categoryId, name: 'Tutorials' },
						},
					},
				}],
			},
		})
})


test('triggers: many has one watch - connect - noop', async () => {

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
            updateArticle(by: {title: "Hello world"}, data: {category: {connect: {name: "Tutorials"}}}) {
                ok
            }
        }
	`)
		.expect(200)
		.expect({
			data: {
				updateArticle: {
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
				}],
			},
		})
})


test('triggers: many has one watch - disconnect', async () => {


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
            updateArticle(by: {title: "Hello world"}, data: {category: {disconnect: true}}) {
                ok
            }
        }
	`)
		.expect(200)
		.expect({
			data: {
				updateArticle: {
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
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							old: { category: categoryId },
							entity: 'Article',
							values: { category: null },
							operation: 'update',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
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
	const tester = await createTester(schema)


	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
                node {id category {id}}
            }
        }
	`)
		.expect(200)

	const articleId = res.body.data.createArticle.node.id

	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {category: {disconnect: true}}) {
                ok
            }
        }
	`)
		.expect(200)
		.expect({
			data: {
				updateArticle: {
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
								category: null,
							},
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							title: 'Hello world',
							category: null,
						},
					},
				}],
			},
		})


})
