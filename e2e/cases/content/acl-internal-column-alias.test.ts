import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

// GraphQL aliases are chosen by the client and become SQL column aliases. PostgreSQL returns duplicate output
// names and the row keeps the last one, so an alias equal to an engine-owned column (ACL predicate result,
// relation key) would be read in its place. These cases run the forged aliases against a real database.

type Tester = Awaited<ReturnType<typeof createTester>>

const signInReader = async (tester: Tester, variables: { name: string; values: string[] }[]) => {
	const email = `reader${Date.now()}${Math.random().toString(36).slice(2)}@doe.com`
	const identityId = await tester.tenant.signUp(email)
	const key = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, { role: 'reader', variables })
	return key
}

namespace Cell {
	export const reader = acl.createRole('reader')

	@acl.allow(reader, { read: ['id', 'name', 'flag'] })
	@acl.allow(reader, { read: ['secret'], when: { visible: { eq: true } } })
	export class Item {
		name = def.stringColumn()
		secret = def.stringColumn()
		visible = def.boolColumn()
		flag = def.boolColumn()
	}
}

test('an alias equal to a field predicate column does not unmask the field', async () => {
	const schema = createSchema(Cell)
	const secretPredicate = schema.acl.roles.reader.entities.Item.operations.read?.secret
	if (typeof secretPredicate !== 'string') {
		throw new Error('expected a predicate reference for Item.secret')
	}
	const forgedAlias = `__predicate_${secretPredicate}`
	expect(forgedAlias).toMatch(/^[_A-Za-z][_0-9A-Za-z]*$/)

	const tester = await createTester(schema)
	await tester(gql`mutation { createItem(data: { name: "a", secret: "hidden", visible: false, flag: true }) { ok } }`).expect(200)
	const key = await signInReader(tester, [])

	const query = `query { listItem { name secret ${forgedAlias}: flag _meta { secret { readable } } } }`
	const asReader = (await tester(query, { authorizationToken: key }).expect(200)).body.data.listItem
	expect(asReader).toEqual([{ name: 'a', secret: null, [forgedAlias]: true, _meta: { secret: { readable: false } } }])

	const asRoot = (await tester(gql`query { listItem { secret } }`).expect(200)).body.data.listItem
	expect(asRoot).toEqual([{ secret: 'hidden' }])
})

namespace Key {
	export const reader = acl.createRole('reader')
	export const companyVar = acl.createEntityVariable('company', 'Company', reader)

	@acl.allow(reader, { read: true, when: { id: companyVar } })
	export class Company {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'company')
	}

	@acl.allow(reader, { read: true, when: { company: { id: companyVar } } })
	export class Post {
		title = def.stringColumn()
		externalId = def.uuidColumn()
		company = def.manyHasOne(Company, 'posts').notNull()
		author = def.manyHasOne(Author, 'posts')
	}

	// Readable only through a relation, and only for authors of the reader's company posts.
	@acl.allow(reader, { read: ['id', 'name'], through: true, when: { posts: { company: { id: companyVar } } } })
	export class Author {
		name = def.stringColumn()
		posts = def.oneHasMany(Post, 'author')
	}
}

test('an alias equal to a relation field does not choose which related rows are fetched', async () => {
	const tester = await createTester(createSchema(Key))
	const createNamed = async (entity: 'Company' | 'Author', name: string): Promise<string> => {
		const res = await tester(`mutation ($name: String!) { create${entity}(data: { name: $name }) { ok node { id } } }`, { variables: { name } })
			.expect(200)
		return res.body.data[`create${entity}`].node.id
	}
	const createPost = async (variables: { title: string; company: string; author: string; externalId: string | null }) => {
		const res = await tester(
			gql`mutation ($title: String!, $company: UUID!, $author: UUID!, $externalId: UUID) {
				createPost(data: { title: $title, externalId: $externalId, company: { connect: { id: $company } }, author: { connect: { id: $author } } }) { ok }
			}`,
			{ variables },
		).expect(200)
		expect(res.body.data.createPost.ok).toBe(true)
	}
	const own = await createNamed('Company', 'own')
	const other = await createNamed('Company', 'other')
	const visibleAuthor = await createNamed('Author', 'visible')
	const hiddenAuthor = await createNamed('Author', 'hidden')
	await createPost({ title: 'other', company: other, author: hiddenAuthor, externalId: null })
	await createPost({ title: 'own', company: own, author: visibleAuthor, externalId: hiddenAuthor })
	const key = await signInReader(tester, [{ name: 'company', values: [own] }])

	const query = gql`query { listPost { title writer: author { name } author: externalId } }`
	const asReader = (await tester(query, { authorizationToken: key }).expect(200)).body.data.listPost
	expect(asReader).toEqual([{ title: 'own', writer: { name: 'visible' }, author: hiddenAuthor }])
})
