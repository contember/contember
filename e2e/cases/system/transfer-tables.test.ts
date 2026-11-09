import { expect, test } from 'bun:test'
import { apiUrl, createTester, gql, rootToken } from '../../src/tester.js'
import { c, createSchema } from '@contember/schema-definition'

namespace Model {
	export class Article {
		title = c.stringColumn().notNull()
		tags = c.manyHasMany(Tag, 'articles')
		category = c.manyHasOne(Category)
	}

	export class Tag {
		name = c.stringColumn().notNull().unique()
		articles = c.manyHasManyInverse(Article, 'tags')
	}

	export class Category {
		name = c.stringColumn().notNull()
	}
}

const schema = createSchema(Model)

const exportProject = async (slug: string, options: { system: boolean; excludeTables?: string[] }): Promise<string> => {
	const response = await fetch(`${apiUrl}/export`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${rootToken}`, 'Accept-Encoding': 'identity' },
		body: JSON.stringify({ projects: [{ slug, ...options }] }),
	})
	expect(response.status).toBe(200)
	return await response.text()
}

const importNdjson = async (ndjson: string): Promise<{ status: number; body: unknown }> => {
	const response = await fetch(`${apiUrl}/import`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-ndjson', 'Authorization': `Bearer ${rootToken}` },
		body: ndjson,
	})
	return { status: response.status, body: await response.json() }
}

const listArticles = gql`{
	listArticle(orderBy: [{ title: asc }]) {
		title
		category { name }
		tags(orderBy: [{ name: asc }]) { name }
	}
}`

const expectedArticles = [
	{ title: 'first', category: { name: 'news' }, tags: [{ name: 'a' }, { name: 'b' }] },
	{ title: 'second', category: null, tags: [{ name: 'b' }] },
]

const createSourceProject = async () => {
	const tester = await createTester(schema)
	await tester(gql`mutation {
		first: createArticle(data: { title: "first", category: { create: { name: "news" } }, tags: [{ create: { name: "a" } }, { create: { name: "b" } }] }) { ok }
	}`).expect(200).expect(response => expect(response.body.data.first.ok).toBe(true))
	await tester(gql`mutation {
		second: createArticle(data: { title: "second", tags: [{ connect: { name: "b" } }] }) { ok }
	}`).expect(200).expect(response => expect(response.body.data.second.ok).toBe(true))
	return tester
}

test('an export with junction and system tables imports into another project', async () => {
	const source = await createSourceProject()
	const ndjson = await exportProject(source.projectSlug, { system: true })
	const commands = ndjson.trim().split('\n').map(line => JSON.parse(line))
	const contentBegin = commands.find(it => it[0] === 'importContentSchemaBegin')
	expect(contentBegin[1].tables).toContain('article_tags')

	const target = await createTester(schema)
	expect(await importNdjson(ndjson.replaceAll(source.projectSlug, target.projectSlug))).toEqual({ status: 200, body: { ok: true } })
	await target(listArticles).expect(200).expect(response => expect(response.body.data.listArticle).toEqual(expectedArticles))
})

test('an export that excludes tables imports into another project', async () => {
	const source = await createSourceProject()
	const ndjson = await exportProject(source.projectSlug, { system: true, excludeTables: ['event_data'] })

	const target = await createTester(schema)
	expect(await importNdjson(ndjson.replaceAll(source.projectSlug, target.projectSlug))).toEqual({ status: 200, body: { ok: true } })
	await target(listArticles).expect(200).expect(response => expect(response.body.data.listArticle).toEqual(expectedArticles))
})

test('an import naming a table outside the transfer mapping is rejected before anything is truncated', async () => {
	const tester = await createSourceProject()

	const content = await importNdjson(
		JSON.stringify(['importContentSchemaBegin', {
			project: tester.projectSlug,
			stage: 'live',
			schemaVersion: '2024-07-01-120000',
			tables: ['article', 'missing_table'],
		}])
			+ '\n',
	)
	expect(content).toEqual({
		status: 400,
		body: { ok: false, error: `Table missing_table is not part of the content schema of project ${tester.projectSlug}` },
	})

	const system = await importNdjson(JSON.stringify(['importSystemSchemaBegin', { project: tester.projectSlug, tables: ['schema_migration'] }]) + '\n')
	expect(system).toEqual({
		status: 400,
		body: { ok: false, error: `Table schema_migration is not part of the system schema of project ${tester.projectSlug}` },
	})

	await tester(listArticles).expect(200).expect(response => expect(response.body.data.listArticle).toEqual(expectedArticles))
	// The project still answers on its migrated schema, so its migration history was left intact.
	await tester(gql`query { executedMigrations { version } }`, { path: `/system/${tester.projectSlug}` })
		.expect(200)
		.expect(response => expect(response.body.data.executedMigrations).toEqual([{ version: '2024-07-01-120000' }]))
})
