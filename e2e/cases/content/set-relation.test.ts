import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { c, createSchema } from '@contember/schema-definition'

namespace OneHasManyModel {
	export class Post {
		slug = c.stringColumn().unique()
		locales = c.oneHasMany(PostLocale, 'post')
	}

	export class PostLocale {
		post = c.manyHasOne(Post, 'locales')
		title = c.stringColumn()
	}
}

namespace ManyHasManyModel {
	export class Article {
		slug = c.stringColumn().unique()
		tags = c.manyHasMany(Tag, 'articles')
	}

	export class Tag {
		label = c.stringColumn().unique()
		articles = c.manyHasManyInverse(Article, 'tags')
	}
}

test('Content API: set on oneHasMany', async () => {
	const tester = await createTester(createSchema(OneHasManyModel))

	const created = await tester(gql`mutation {
		createPost(data: {slug: "post", locales: [{create: {title: "a"}}, {create: {title: "b"}}]}) {
			ok
			node { id locales(orderBy: [{title: asc}]) { id title } }
		}
	}`).expect(200)
	expect(created.body.data.createPost.ok).toBe(true)
	const post = created.body.data.createPost.node
	const [localeA, localeB] = post.locales

	// keep "a", add a new one, drop "b" - the default strategy only detaches it
	await tester(
		gql`mutation($post: UUID!, $keep: UUID!) {
			updatePost(by: {id: $post}, data: {locales: {set: [{connect: {id: $keep}}, {create: {title: "c"}}]}}) {
				ok
				errorMessage
			}
		}`,
		{ variables: { post: post.id, keep: localeA.id } },
	)
		.expect(response => {
			expect(response.body.data.updatePost).toStrictEqual({ ok: true, errorMessage: null })
		})
		.expect(200)

	await tester(gql`query {
		listPostLocale(orderBy: [{title: asc}]) { title post { slug } }
	}`)
		.expect(response => {
			// "b" survived as a row, just without a post
			expect(response.body.data.listPostLocale).toStrictEqual([
				{ title: 'a', post: { slug: 'post' } },
				{ title: 'b', post: null },
				{ title: 'c', post: { slug: 'post' } },
			])
		})
		.expect(200)

	// orphanStrategy: delete removes the row entirely
	await tester(
		gql`mutation($post: UUID!, $keep: UUID!) {
			updatePost(by: {id: $post}, data: {locales: {orphanStrategy: delete, set: [{connect: {id: $keep}}]}}) {
				ok
				errorMessage
			}
		}`,
		{ variables: { post: post.id, keep: localeA.id } },
	)
		.expect(response => {
			expect(response.body.data.updatePost).toStrictEqual({ ok: true, errorMessage: null })
		})
		.expect(200)

	await tester(gql`query {
		listPostLocale(orderBy: [{title: asc}]) { title }
	}`)
		.expect(response => {
			// "c" is gone, "b" was already detached before this call so it is untouched
			expect(response.body.data.listPostLocale).toStrictEqual([{ title: 'a' }, { title: 'b' }])
		})
		.expect(200)

	// an empty set clears the collection
	await tester(
		gql`mutation($post: UUID!) {
			updatePost(by: {id: $post}, data: {locales: {orphanStrategy: delete, set: []}}) {
				ok
			}
		}`,
		{ variables: { post: post.id } },
	)
		.expect(response => {
			expect(response.body.data.updatePost.ok).toBe(true)
		})
		.expect(200)

	await tester(gql`query {
		listPostLocale(orderBy: [{title: asc}]) { title }
	}`)
		.expect(response => {
			expect(response.body.data.listPostLocale).toStrictEqual([{ title: 'b' }])
		})
		.expect(200)

	// regression: an upsert whose `by` points outside the collection falls back to an insert -
	// the inserted record is the desired member and must not be orphaned right away
	const other = await tester(gql`mutation {
		createPost(data: {slug: "other", locales: [{create: {title: "foreign"}}]}) {
			ok
			node { locales { id } }
		}
	}`).expect(200)
	const foreignLocale = other.body.data.createPost.node.locales[0].id

	await tester(
		gql`mutation($post: UUID!, $foreign: UUID!) {
			updatePost(by: {id: $post}, data: {locales: {set: [{upsert: {by: {id: $foreign}, update: {title: "updated"}, create: {title: "inserted"}}}]}}) {
				ok
				errorMessage
			}
		}`,
		{ variables: { post: post.id, foreign: foreignLocale } },
	)
		.expect(response => {
			expect(response.body.data.updatePost).toStrictEqual({ ok: true, errorMessage: null })
		})
		.expect(200)

	await tester(
		gql`query($post: UUID!) {
			getPost(by: {id: $post}) { locales { title } }
		}`,
		{ variables: { post: post.id } },
	)
		.expect(response => {
			expect(response.body.data.getPost.locales).toStrictEqual([{ title: 'inserted' }])
		})
		.expect(200)
})

test('Content API: set on manyHasMany', async () => {
	const tester = await createTester(createSchema(ManyHasManyModel))

	const created = await tester(gql`mutation {
		createArticle(data: {slug: "article", tags: [{create: {label: "a"}}, {create: {label: "b"}}]}) {
			ok
			node { id tags(orderBy: [{label: asc}]) { id label } }
		}
	}`).expect(200)
	expect(created.body.data.createArticle.ok).toBe(true)
	const article = created.body.data.createArticle.node
	const [tagA] = article.tags

	// default strategy only removes the junction rows
	await tester(
		gql`mutation($article: UUID!, $keep: UUID!) {
			updateArticle(by: {id: $article}, data: {tags: {set: [{connect: {id: $keep}}, {create: {label: "c"}}]}}) {
				ok
				errorMessage
			}
		}`,
		{ variables: { article: article.id, keep: tagA.id } },
	)
		.expect(response => {
			expect(response.body.data.updateArticle).toStrictEqual({ ok: true, errorMessage: null })
		})
		.expect(200)

	await tester(gql`query {
		listTag(orderBy: [{label: asc}]) { label articles { slug } }
	}`)
		.expect(response => {
			expect(response.body.data.listTag).toStrictEqual([
				{ label: 'a', articles: [{ slug: 'article' }] },
				{ label: 'b', articles: [] },
				{ label: 'c', articles: [{ slug: 'article' }] },
			])
		})
		.expect(200)

	// regression: connectOrCreate that creates - the junction-only result cannot carry the new
	// primary, so the created tag must be kept out of the orphan set by the pre-operation snapshot
	await tester(
		gql`mutation($article: UUID!) {
			updateArticle(by: {id: $article}, data: {tags: {orphanStrategy: delete, set: [{connectOrCreate: {connect: {label: "fresh"}, create: {label: "fresh"}}}]}}) {
				ok
				errorMessage
			}
		}`,
		{ variables: { article: article.id } },
	)
		.expect(response => {
			expect(response.body.data.updateArticle).toStrictEqual({ ok: true, errorMessage: null })
		})
		.expect(200)

	await tester(gql`query {
		listTag(orderBy: [{label: asc}]) { label articles { slug } }
	}`)
		.expect(response => {
			// "a" and "c" were members and got deleted; "b" was already detached; "fresh" survived
			expect(response.body.data.listTag).toStrictEqual([
				{ label: 'b', articles: [] },
				{ label: 'fresh', articles: [{ slug: 'article' }] },
			])
		})
		.expect(200)
})
