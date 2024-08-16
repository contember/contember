import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'vitest'
import { createTester, gql } from '../../src/tester'

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
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
                ok
                node {id tags {id}}
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	const tagId = res.body.data.createArticle.node.tags[0].id
	await tester(gql`
        mutation {
            updateTag(by: {name: "graphql"}, data: {name: "GraphQL"}) {
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
						}, {
							id: articleId,
							path: [],
							entity: 'Article',
							relation: 'tags',
							inverseId: tagId,
							operation: 'junction_connect',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							tags: [{ id: tagId, name: 'graphql' }],
							title: 'Hello world',
						},
					},
				}, {
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: tagId,
							old: { name: 'graphql' },
							path: ['tags'],
							entity: 'Tag',
							values: { name: 'GraphQL' },
							operation: 'update',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							tags: [{ id: tagId, name: 'GraphQL' }],
							title: 'Hello world',
						},
					},
				}],
			},
		})

})


test('triggers: many has many watch - field update - noop', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
                ok
                node {id tags {id}}
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	const tagId = res.body.data.createArticle.node.tags[0].id
	await tester(gql`
        mutation {
            updateTag(by: {name: "graphql"}, data: {name: "graphql"}) {
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
						}, {
							id: articleId,
							path: [],
							entity: 'Article',
							relation: 'tags',
							inverseId: tagId,
							operation: 'junction_connect',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							tags: [{ id: tagId, name: 'graphql' }],
							title: 'Hello world',
						},
					},
				}],
			},
		})

})


test('triggers: many has many watch - connect', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
				node {id}
            }
            createTag(data: {name: "graphql"}) {
                ok
				node {id}
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	const tagId = res.body.data.createTag.node.id

	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {tags: {connect: {name: "graphql"}}}) {
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
							values: { id: articleId, title: 'Hello world' },
							operation: 'create',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, tags: [], title: 'Hello world' },
					},
				}, {
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							path: [],
							entity: 'Article',
							relation: 'tags',
							inverseId: tagId,
							operation: 'junction_connect',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							tags: [{ id: tagId, name: 'graphql' }],
							title: 'Hello world',
						},
					},
				}],
			},
		})

})


test('triggers: many has many watch - connect - noop', async () => {

	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
                ok
                node {id tags {id}}
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	const tagId = res.body.data.createArticle.node.tags[0].id

	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {tags: {connect: {name: "graphql"}}}) {
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
							values: { id: articleId, title: 'Hello world' },
							operation: 'create',
						}, {
							id: articleId,
							path: [],
							entity: 'Article',
							relation: 'tags',
							inverseId: tagId,
							operation: 'junction_connect',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							tags: [{ id: tagId, name: 'graphql' }],
							title: 'Hello world',
						},
					},
				}],
			},
		})
})


test('triggers: many has many watch - disconnect', async () => {

	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}]}) {
                ok
                node {id tags {id}}
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	const tagId = res.body.data.createArticle.node.tags[0].id

	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {tags: {disconnect: {name: "graphql"}}}) {
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
							values: { id: articleId, title: 'Hello world' },
							operation: 'create',
						}, {
							id: articleId,
							path: [],
							entity: 'Article',
							relation: 'tags',
							inverseId: tagId,
							operation: 'junction_connect',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: {
							id: articleId,
							tags: [{ id: tagId, name: 'graphql' }],
							title: 'Hello world',
						},
					},
				}, {
					payload: {
						id: articleId,
						entity: 'Article',
						events: [{
							id: articleId,
							path: [],
							entity: 'Article',
							relation: 'tags',
							inverseId: tagId,
							operation: 'junction_disconnect',
						}],
						trigger: 'article_watch',
						operation: 'watch',
						selection: { id: articleId, tags: [], title: 'Hello world' },
					},
				}],
			},
		})


})

test('triggers: many has many watch - disconnect - noop', async () => {


	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {title: "Hello world"}) {
                ok
				node {id}
            }
            createTag(data: {name: "graphql"}) {
                ok
				node {id}
            }
        }
	`)
	const articleId = res.body.data.createArticle.node.id
	const tagId = res.body.data.createTag.node.id

	await tester(gql`
        mutation {
            updateArticle(by: {title: "Hello world"}, data: {tags: {disconnect: {name: "graphql"}}}) {
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
				eventsToProcess: [
					{
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
							selection: { id: articleId, tags: [], title: 'Hello world' },
						},
					},
				],
			},
		})

})
