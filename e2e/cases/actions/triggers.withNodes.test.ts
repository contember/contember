import { c, createSchema } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'

namespace ActionsModel {

	@c.Watch({
		name: 'article_watch',
		withNodes: true,
		watch: `
			revisions {
				locales {
					tags {
						name
						kind {
							id
						}
					}
				}
			}
		`,
		webhook: 'http://foobar',
	})
	export class Article {
		revisions = c.oneHasMany(ArticleRevision, 'article')
	}

	export class ArticleRevision {
		article = c.manyHasOne(Article, 'revisions')
		locales = c.oneHasMany(ArticleRevisionLocale, 'revision')
	}

	export class ArticleRevisionLocale {
		revision = c.manyHasOne(ArticleRevision, 'locales')
		title = c.stringColumn()
		tags = c.oneHasMany(ArticleRevisionLocaleTag, 'locale')
	}

	export class ArticleRevisionLocaleTag {
		locale = c.manyHasOne(ArticleRevisionLocale, 'tags')
		name = c.stringColumn().notNull()
		kind = c.manyHasOne(TagKind)
	}

	export class TagKind {
		name = c.stringColumn().notNull()
	}

}

test('triggers: watch withNodes - delete entity', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {revisions: {create: {locales: {create: {title: "Hello world", tags: {create: {name: "tag1"}}}}}}}) {
                ok
				node {
					id
					revisions {
						id
						locales {
							id
							tags {
								id
								name
							}
						}
					}
				}
            }
        }
	`)
	expect(res.body.errors).toBeUndefined()
	const articleId = res.body.data.createArticle.node.id
	const revisionId = res.body.data.createArticle.node.revisions[0].id
	const localeId = res.body.data.createArticle.node.revisions[0].locales[0].id
	const tagId = res.body.data.createArticle.node.revisions[0].locales[0].tags[0].id
	const result = await tester(gql`
        mutation($tagId: UUID!) {
            deleteArticleRevisionLocaleTag(by: {id: $tagId}) {
				ok
				errorMessage
			}
        }
	`, { variables: { tagId } })
	expect(result.body.errors).toBeUndefined()
	expect(result.body.data.deleteArticleRevisionLocaleTag).toEqual({
		ok: true,
		errorMessage: null,
	})
	const resultEvents = await tester(gql`
	query {
		eventsToProcess {
			payload
		}
	}

	`, {
		path: '/actions/' + tester.projectSlug,
	})
		.expect(200)



	expect(resultEvents.body.data.eventsToProcess).toMatchObject([
		{
			'payload': {
				'entity': 'Article',
				'events': [
					{
						'entity': 'Article',
						'id': articleId,
						'operation': 'create',
						'values': {
							'id': articleId,
						},
					},
					{
						'entity': 'ArticleRevision',
						'id': revisionId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
						],
						'values': {
							'article': articleId,
							'id': revisionId,
						},
					},
					{
						'entity': 'ArticleRevisionLocale',
						'id': localeId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
							'locales',
						],
						'values': {
							'id': localeId,
							'revision': revisionId,
							'title': 'Hello world',
						},
					},
					{
						'entity': 'ArticleRevisionLocaleTag',
						'id': tagId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
							{
								'id': tagId,
								'relation': 'tags',
								'entity': 'ArticleRevisionLocaleTag',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
							'locales',
							'tags',
						],
						'values': {
							'id': tagId,
							'locale': localeId,
							'name': 'tag1',
						},
					},
				],
				'id': articleId,
				'operation': 'watch',
				'trigger': 'article_watch',
			},
		},
		{
			'payload': {
				'entity': 'Article',
				'events': [
					{
						'entity': 'ArticleRevisionLocaleTag',
						'id': tagId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
							{
								'id': tagId,
								'relation': 'tags',
								'entity': 'ArticleRevisionLocaleTag',
							},
						],
						'operation': 'delete',
						'path': [
							'revisions',
							'locales',
							'tags',
						],
					},
				],
				'id': articleId,
				'operation': 'watch',
				'trigger': 'article_watch',
			},
		},
	])
})




test('triggers: watch withNodes - update scalar', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {revisions: {create: {locales: {create: {title: "Hello world", tags: {create: {name: "tag1"}}}}}}}) {
                ok
				node {
					id
					revisions {
						id
						locales {
							id
							tags {
								id
								name
							}
						}
					}
				}
            }
        }
	`)
	expect(res.body.errors).toBeUndefined()
	const articleId = res.body.data.createArticle.node.id
	const revisionId = res.body.data.createArticle.node.revisions[0].id
	const localeId = res.body.data.createArticle.node.revisions[0].locales[0].id
	const tagId = res.body.data.createArticle.node.revisions[0].locales[0].tags[0].id
	const result = await tester(gql`
        mutation($tagId: UUID!) {
            updateArticleRevisionLocaleTag(by: {id: $tagId}, data: {name: "tag2"}) {
				ok
				errorMessage
			}
        }
	`, { variables: { tagId } })
	expect(result.body.errors).toBeUndefined()
	expect(result.body.data.updateArticleRevisionLocaleTag).toEqual({
		ok: true,
		errorMessage: null,
	})
	const resultEvents = await tester(gql`
	query {
		eventsToProcess {
			payload
		}
	}

	`, {
		path: '/actions/' + tester.projectSlug,
	})
		.expect(200)



	expect(resultEvents.body.data.eventsToProcess).toMatchObject([
		{
			'payload': {
				'entity': 'Article',
				'events': [
					{
						'entity': 'Article',
						'id': articleId,
						'operation': 'create',
						'values': {
							'id': articleId,
						},
					},
					{
						'entity': 'ArticleRevision',
						'id': revisionId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
						],
						'values': {
							'article': articleId,
							'id': revisionId,
						},
					},
					{
						'entity': 'ArticleRevisionLocale',
						'id': localeId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
							'locales',
						],
						'values': {
							'id': localeId,
							'revision': revisionId,
							'title': 'Hello world',
						},
					},
					{
						'entity': 'ArticleRevisionLocaleTag',
						'id': tagId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
							{
								'id': tagId,
								'relation': 'tags',
								'entity': 'ArticleRevisionLocaleTag',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
							'locales',
							'tags',
						],
						'values': {
							'id': tagId,
							'locale': localeId,
							'name': 'tag1',
						},
					},
				],
				'id': articleId,
				'operation': 'watch',
				'trigger': 'article_watch',
			},
		},
		{
			'payload': {
				'entity': 'Article',
				'events': [
					{
						'entity': 'ArticleRevisionLocaleTag',
						'id': tagId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
							{
								'id': tagId,
								'relation': 'tags',
								'entity': 'ArticleRevisionLocaleTag',
							},
						],
						'operation': 'update',
						'values': {
							'name': 'tag2',
						},
						'old': {
							'name': 'tag1',
						},
						'path': [
							'revisions',
							'locales',
							'tags',
						],
					},
				],
				'id': articleId,
				'operation': 'watch',
				'trigger': 'article_watch',
			},
		},
	])
})



test('triggers: watch withNodes - update relation', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
        mutation {
            createArticle(data: {revisions: {create: {locales: {create: {title: "Hello world", tags: {create: {name: "tag1", kind: {create: {name: "kind1"}}}}}}}}}) {
                ok
				node {
					id
					revisions {
						id
						locales {
							id
							tags {
								id
								name
							}
						}
					}
				}
            }
        }
	`)
	expect(res.body.errors).toBeUndefined()
	const articleId = res.body.data.createArticle.node.id
	const revisionId = res.body.data.createArticle.node.revisions[0].id
	const localeId = res.body.data.createArticle.node.revisions[0].locales[0].id
	const tagId = res.body.data.createArticle.node.revisions[0].locales[0].tags[0].id
	const result = await tester(gql`
        mutation($tagId: UUID!) {
            updateArticleRevisionLocaleTag(by: {id: $tagId}, data: {kind: {create: {name: "kind2"}}}) {
				ok
				errorMessage
			}
        }
	`, { variables: { tagId } })
	expect(result.body.errors).toBeUndefined()
	expect(result.body.data.updateArticleRevisionLocaleTag).toEqual({
		ok: true,
		errorMessage: null,
	})
	const resultEvents = await tester(gql`
	query {
		eventsToProcess {
			payload
		}
	}

	`, {
		path: '/actions/' + tester.projectSlug,
	})
		.expect(200)



	expect(resultEvents.body.data.eventsToProcess).toMatchObject([
		{
			'payload': {
				'entity': 'Article',
				'events': [
					{
						'entity': 'Article',
						'id': articleId,
						'operation': 'create',
						'values': {
							'id': articleId,
						},
					},
					{
						'entity': 'ArticleRevision',
						'id': revisionId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
						],
						'values': {
							'article': articleId,
							'id': revisionId,
						},
					},
					{
						'entity': 'ArticleRevisionLocale',
						'id': localeId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
							'locales',
						],
						'values': {
							'id': localeId,
							'revision': revisionId,
							'title': 'Hello world',
						},
					},
					{
						'entity': 'ArticleRevisionLocaleTag',
						'id': tagId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
							{
								'id': tagId,
								'relation': 'tags',
								'entity': 'ArticleRevisionLocaleTag',
							},
						],
						'operation': 'create',
						'path': [
							'revisions',
							'locales',
							'tags',
						],
						'values': {
							'id': tagId,
							'locale': localeId,
							'kind': expect.any(String),
							'name': 'tag1',
						},
					},
				],
				'id': articleId,
				'operation': 'watch',
				'trigger': 'article_watch',
			},
		},
		{
			'payload': {
				'entity': 'Article',
				'events': [
					{
						'entity': 'ArticleRevisionLocaleTag',
						'id': tagId,
						'nodes': [
							{
								'id': revisionId,
								'relation': 'revisions',
								'entity': 'ArticleRevision',
							},
							{
								'id': localeId,
								'relation': 'locales',
								'entity': 'ArticleRevisionLocale',
							},
							{
								'id': tagId,
								'relation': 'tags',
								'entity': 'ArticleRevisionLocaleTag',
							},
						],
						'operation': 'update',
						'values': {
							'kind': expect.any(String),
						},
						'old': {
							'kind': expect.any(String),
						},
						'path': [
							'revisions',
							'locales',
							'tags',
						],
					},
				],
				'id': articleId,
				'operation': 'watch',
				'trigger': 'article_watch',
			},
		},
	])
})
