import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// A relation `isNull` next to sibling conditions in the same relation object: the relation reads empty and
// the siblings hold on the null-extended row, in SQL three-valued logic. For a role without predicates this
// is exactly the LEFT JOIN result; for a role that cannot read the target an unreadable row is absent, and
// the null-extended row exposes none of its values.
namespace M {
	export const reader = acl.createRole('reader')

	@acl.allow(reader, { read: true })
	export class Post {
		title = def.stringColumn()
		author = def.manyHasOne(Author, 'posts')
	}

	@acl.allow(reader, { read: true, when: { isPublic: { eq: true } } })
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		posts = def.oneHasMany(Post, 'author')
	}
}

const filters = {
	absentWithNullSibling: { author: { id: { isNull: true }, name: { isNull: true } } },
	absentWithNegatedSibling: { author: { id: { isNull: true }, not: { name: { eq: 'x' } } } },
	notAbsentWithSibling: { author: { not: { id: { isNull: true }, name: { eq: 'x' } } } },
}

test('relation isNull with sibling conditions evaluates the siblings on the null-extended row', async () => {
	const tester = await createTester(createSchema(M))
	const createAuthor = async (name: string, isPublic: boolean, posts: string[]) => {
		await tester(
			gql`mutation ($data: AuthorCreateInput!) { createAuthor(data: $data) { ok } }`,
			{ variables: { data: { name, isPublic, posts: posts.map(title => ({ create: { title } })) } } },
		).expect(200)
	}
	await tester(gql`mutation { createPost(data: { title: "p1" }) { ok } }`).expect(200)
	await createAuthor('x', true, ['p2'])
	await createAuthor('y', false, ['p3'])
	await createAuthor('x', false, ['p4'])
	await tester(
		gql`mutation { createAuthor(data: { isPublic: true, posts: [{ create: { title: "p5" } }] }) { ok } }`,
	).expect(200)
	await createAuthor('a6', true, [])
	await createAuthor('a7', false, [])

	const email = `reader${Date.now()}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const readerKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'reader', variables: [] })

	const listPost = async (filter: object, authorizationToken?: string) =>
		(await tester(gql`query ($filter: PostWhere) { listPost(filter: $filter) { title } }`, { variables: { filter }, authorizationToken }).expect(200))
			.body.data.listPost.map((it: { title: string }) => it.title).sort()
	const listAuthorWithoutPosts = async (authorizationToken?: string) =>
		(await tester(
			gql`query ($filter: AuthorWhere) { listAuthor(filter: $filter) { name } }`,
			{ variables: { filter: { posts: { id: { isNull: true }, title: { isNull: true } } } }, authorizationToken },
		).expect(200)).body.data.listAuthor.map((it: { name: string }) => it.name).sort()

	expect(await listPost(filters.absentWithNullSibling)).toEqual(['p1'])
	expect(await listPost(filters.absentWithNegatedSibling)).toEqual([])
	expect(await listPost(filters.notAbsentWithSibling)).toEqual(['p2', 'p3', 'p4', 'p5'])
	expect(await listAuthorWithoutPosts()).toEqual(['a6', 'a7'])

	// p3 and p4 point at private authors: they match exactly like p1, which has no author.
	expect(await listPost(filters.absentWithNullSibling, readerKey)).toEqual(['p1', 'p3', 'p4'])
	expect(await listPost(filters.absentWithNegatedSibling, readerKey)).toEqual([])
	expect(await listPost(filters.notAbsentWithSibling, readerKey)).toEqual(['p2', 'p5'])
	expect(await listAuthorWithoutPosts(readerKey)).toEqual(['a6'])
})
