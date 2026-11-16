import { beforeAll, describe, expect, test } from 'bun:test'
import { apiUrl, createTester, gql, rootToken } from '../../src/tester.js'

import { c, createSchema } from '@contember/schema-definition'
import * as Typesafe from '@contember/typesafe'

namespace Model {
	export class Article {
		title = c.stringColumn().notNull()
		publishedOn = c.dateColumn().notNull()
		publishedAt = c.dateTimeColumn().notNull()
		holidays = c.dateColumn().list().notNull()
	}
}

const schema = createSchema(Model)

type ExportedCommand = readonly Typesafe.Json[]

const exportedCommand = Typesafe.array(Typesafe.anyJson)
const insertBeginOptions = Typesafe.object({ table: Typesafe.string, columns: Typesafe.array(Typesafe.string) })

const exportProject = async (projectSlug: string): Promise<ExportedCommand[]> => {
	const response = await fetch(`${apiUrl}/export`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${rootToken}`,
			'Accept-Encoding': 'identity',
		},
		body: JSON.stringify({ projects: [{ slug: projectSlug, system: false }] }),
	})
	expect(response.status).toBe(200)
	return (await response.text()).trim().split('\n').map(line => exportedCommand(JSON.parse(line)))
}

const importCommands = async (commands: ExportedCommand[]) => {
	const response = await fetch(`${apiUrl}/import`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Authorization': `Bearer ${rootToken}`,
		},
		body: commands.map(command => JSON.stringify(command)).join('\n') + '\n',
	})
	return { status: response.status, body: await response.json() }
}

// Two articles with a leap day are exported from one project, re-targeted at a second one, and imported there.
const setup = async () => {
	const source = await createTester(schema)
	const target = await createTester(schema)

	for (const title of ['first', 'second']) {
		await source(
			gql`mutation($title: String!) {
			createArticle(data: {title: $title, publishedOn: "2024-02-29", publishedAt: "2024-02-29T10:00:00Z", holidays: ["2024-02-29", "2024-12-24"]}) { ok }
		}`,
			{ variables: { title } },
		)
			.expect(200)
			.expect(response => {
				expect(response.body.data.createArticle.ok).toBe(true)
			})
	}

	const exported = (await exportProject(source.projectSlug))
		.map((command): ExportedCommand =>
			command[0] === 'importContentSchemaBegin' ? [command[0], { ...Typesafe.anyJsonObject(command[1]), project: target.projectSlug }] : command
		)

	const insertBeginIndex = exported.findIndex(it => it[0] === 'insertBegin' && insertBeginOptions(it[1]).table === 'article')
	expect(insertBeginIndex).toBeGreaterThanOrEqual(0)
	const { columns } = insertBeginOptions(exported[insertBeginIndex][1])
	const secondRowIndex = exported.findIndex((it, index) => index > insertBeginIndex && it[0] === 'insertRow' && exported[index - 1][0] === 'insertRow')
	expect(secondRowIndex).toBeGreaterThan(insertBeginIndex)

	const withSecondArticleCell = (column: string, value: Typesafe.Json): ExportedCommand[] => {
		const row = [...exportedCommand(exported[secondRowIndex][1])]
		row[columns.indexOf(column)] = value
		return exported.map((command, index) => index === secondRowIndex ? ['insertRow', row] : command)
	}

	return { target, exported, withSecondArticleCell }
}

describe('import of an impossible date', () => {
	let fixture: Awaited<ReturnType<typeof setup>>
	beforeAll(async () => {
		fixture = await setup()
	})

	test('valid dates, including a leap day, are imported', async () => {
		expect(await importCommands(fixture.exported)).toEqual({ status: 200, body: { ok: true } })

		await fixture.target(gql`{ listArticle(orderBy: [{title: asc}]) { title publishedOn publishedAt } }`)
			.expect(200)
			.expect(response => {
				expect(response.body.data.listArticle).toEqual([
					{ title: 'first', publishedOn: '2024-02-29T00:00:00.000Z', publishedAt: '2024-02-29T10:00:00.000Z' },
					{ title: 'second', publishedOn: '2024-02-29T00:00:00.000Z', publishedAt: '2024-02-29T10:00:00.000Z' },
				])
			})
	})

	test.each([
		['published_on', '2026-02-30'],
		['published_on', '0000-02-02'],
		['published_at', '2026-02-30 10:00:00+00'],
		['published_at', '0000-02-02 10:00:00+00'],
	])('%s = %s is rejected with a user error naming the column and row', async (column, value) => {
		const result = await importCommands(fixture.withSecondArticleCell(column, value))

		expect(result.status).toBe(400)
		expect(result.body.ok).toBe(false)
		expect(result.body.error).toStartWith('Invalid row #2 ')
		expect(result.body.error).toEndWith(`for table article, column ${column}: ${JSON.stringify(value)} is not a valid date`)
	})

	test('an impossible date in a date list is rejected with a user error naming the column, row and element', async () => {
		const result = await importCommands(fixture.withSecondArticleCell('holidays', ['2024-01-01', '2026-02-30']))

		expect(result.status).toBe(400)
		expect(result.body.ok).toBe(false)
		expect(result.body.error).toStartWith('Invalid row #2 ')
		expect(result.body.error).toEndWith('for table article, column holidays, element /1: "2026-02-30" is not a valid date')
	})
})
