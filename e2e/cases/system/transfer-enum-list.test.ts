import { expect, test } from 'bun:test'
import { apiUrl, createTester, gql, rootToken } from '../../src/tester'

import { c, createSchema } from '@contember/schema-definition'

namespace Model {
	export const ArticleTag = c.createEnum('foo', 'bar', 'baz')
	export class Article {
		tags = c.enumColumn(ArticleTag).list().notNull()
		title = c.stringColumn().notNull()
	}
}

const schema = createSchema(Model)

test('export and import enum list column', async () => {
	const tester = await createTester(schema)

	// Insert test data with enum list values
	await tester(gql`mutation {
		createArticle(data: {title: "first", tags: [foo, bar]}) { ok }
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.createArticle.ok).toBe(true)
		})

	await tester(gql`mutation {
		createArticle(data: {title: "second", tags: [baz]}) { ok }
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.createArticle.ok).toBe(true)
		})

	await tester(gql`mutation {
		createArticle(data: {title: "third", tags: []}) { ok }
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.createArticle.ok).toBe(true)
		})

	// Export data
	const exportResponse = await fetch(`${apiUrl}/export`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${rootToken}`,
			'Accept-Encoding': 'identity',
		},
		body: JSON.stringify({
			projects: [{ slug: tester.projectSlug, system: false }],
		}),
	})

	expect(exportResponse.status).toBe(200)
	const ndjson = await exportResponse.text()
	const commands = ndjson.trim().split('\n').map(line => JSON.parse(line))

	// Verify export contains enum list arrays
	const insertRowCommands = commands.filter(c => c[0] === 'insertRow')
	expect(insertRowCommands.length).toBeGreaterThanOrEqual(3)

	// Find the article rows - check that tags are exported as arrays
	const insertBeginCmd = commands.find(c => c[0] === 'insertBegin' && c[1].table === 'article')
	expect(insertBeginCmd).toBeDefined()
	const columns = insertBeginCmd[1].columns
	const tagsIndex = columns.indexOf('tags')
	expect(tagsIndex).toBeGreaterThanOrEqual(0)

	// Find rows for the article table (between insertBegin with table=article and insertEnd)
	const articleInsertBeginIndex = commands.indexOf(insertBeginCmd)
	const articleInsertEndIndex = commands.findIndex((c, i) => i > articleInsertBeginIndex && c[0] === 'insertEnd')
	const articleRows = commands.slice(articleInsertBeginIndex + 1, articleInsertEndIndex).filter(c => c[0] === 'insertRow')

	const tagValues = articleRows.map(row => row[1][tagsIndex])
	// Each tag value should be an array
	for (const tags of tagValues) {
		expect(Array.isArray(tags)).toBe(true)
	}
	expect(tagValues).toContainEqual(['foo', 'bar'])
	expect(tagValues).toContainEqual(['baz'])
	expect(tagValues).toContainEqual([])

	// Import into a new project — replace project slug in the NDJSON stream
	const tester2 = await createTester(schema)
	const importNdjson = ndjson.replaceAll(tester.projectSlug, tester2.projectSlug)

	const importResponse = await fetch(`${apiUrl}/import`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Authorization': `Bearer ${rootToken}`,
		},
		body: importNdjson,
	})

	expect(importResponse.status).toBe(200)
	const importResult = await importResponse.json()
	expect(importResult).toEqual({ ok: true })

	// Verify imported data
	await tester2(gql`{
		listArticle(orderBy: [{title: asc}]) {
			title
			tags
		}
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.listArticle).toEqual([
				{ title: 'first', tags: ['foo', 'bar'] },
				{ title: 'second', tags: ['baz'] },
				{ title: 'third', tags: [] },
			])
		})
})
