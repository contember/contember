import { describe, expect, test } from 'bun:test'
import { GraphQLError, parse } from 'graphql'
import { buildSchema, CompletedResult, execute, type ResolveInfo, type ScalarImplementation } from '../src/index.js'

const schema = buildSchema(`
	scalar Stamp
	type Query {
		holder: Holder
		echo(at: Stamp): String
	}
	type Holder {
		report: Report
		requiredReport: Report!
		sibling: String
	}
	type Report {
		at: Stamp
		lines: [Line!]!
	}
	type Line {
		label: String
		strict: String!
	}
`)

const stamp: ScalarImplementation = {
	serialize: () => {
		throw new Error('a completed result must not be serialized again')
	},
	parseValue: value => new Date(String(value)),
	parseLiteral: () => undefined,
}

const run = async (query: string, result: () => CompletedResult) => {
	const response = await execute({
		schema,
		document: parse(query),
		scalars: { Stamp: stamp },
		resolvers: {
			Query: { holder: () => ({}) },
			Holder: { report: result, requiredReport: result, sibling: () => 'kept' },
		},
	})
	return {
		data: response.data,
		errors: response.errors?.map(it => ({ message: it.message, path: it.path, locations: it.locations, extensions: it.extensions })),
		originalErrors: response.errors?.map(it => it.originalError),
	}
}

/** An error as a delegated operation selecting only the field reports it: its path starts with the field's response name */
const delegatedError = (message: string, path: (string | number)[], originalError?: Error) =>
	new GraphQLError(message, { path, originalError, extensions: { code: message } })

describe('CompletedResult', () => {
	test('inserts the data as is, without completing or serializing it again', async () => {
		const data = { at: '2020-01-01T00:00:00.000Z', lines: [{ label: 'a', extra: 'not selected, but kept' }] }
		const result = await run('{ holder { report { at lines { label } } } }', () => new CompletedResult(data, []))
		expect(result).toEqual({ data: { holder: { report: data } }, errors: undefined, originalErrors: undefined })
	})

	test('moves the errors under the field path and keeps their extensions and original errors', async () => {
		const original = new Error('line failed')
		const result = await run(
			'{ holder { r: report { lines { strict } } } }',
			() => new CompletedResult({ lines: null }, [delegatedError('first', ['r', 'lines', 0, 'strict'], original), delegatedError('second', ['r'])]),
		)
		expect(result).toEqual({
			data: { holder: { r: { lines: null } } },
			errors: [
				{ message: 'first', path: ['holder', 'r', 'lines', 0, 'strict'], locations: undefined, extensions: { code: 'first' } },
				{ message: 'second', path: ['holder', 'r'], locations: undefined, extensions: { code: 'second' } },
			],
			originalErrors: [original, undefined],
		})
	})

	test('propagates the null of a non-null field with the last error and keeps the others', async () => {
		const result = await run(
			'{ holder { sibling requiredReport { lines { strict } } } }',
			() =>
				new CompletedResult(null, [
					delegatedError('earlier', ['requiredReport', 'lines', 1, 'strict']),
					delegatedError('cause', ['requiredReport', 'lines', 0, 'strict']),
				]),
		)
		expect(result.data).toEqual({ holder: null })
		expect(result.errors?.map(it => [it.message, it.path])).toEqual([
			['earlier', ['holder', 'requiredReport', 'lines', 1, 'strict']],
			['cause', ['holder', 'requiredReport', 'lines', 0, 'strict']],
		])
	})

	test('a null without errors for a non-null field fails it', async () => {
		const result = await run('{ holder { requiredReport { at } } }', () => new CompletedResult(undefined, []))
		expect(result.data).toEqual({ holder: null })
		expect(result.errors?.map(it => [it.message, it.path])).toEqual([
			['Cannot return null for non-nullable field Holder.requiredReport.', ['holder', 'requiredReport']],
		])
	})
})

describe('ResolveInfo.rawVariableValues', () => {
	test('holds the variables as given, next to the coerced ones', async () => {
		const seen: Pick<ResolveInfo, 'variableValues' | 'rawVariableValues'>[] = []
		await execute({
			schema,
			document: parse('query($at: Stamp) { echo(at: $at) }'),
			variableValues: { at: '2021-05-05T00:00:00.000Z', unused: 1 },
			scalars: { Stamp: stamp },
			resolvers: {
				Query: {
					echo: (_, __, ___, info) => {
						seen.push({ variableValues: info.variableValues, rawVariableValues: info.rawVariableValues })
						return null
					},
				},
			},
		})
		expect(seen).toEqual([{
			variableValues: { at: new Date('2021-05-05T00:00:00.000Z') },
			rawVariableValues: { at: '2021-05-05T00:00:00.000Z', unused: 1 },
		}])
	})
})
