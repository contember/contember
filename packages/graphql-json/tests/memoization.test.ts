import { describe, expect, it } from 'bun:test'
import { parse } from 'graphql'
import { execute, executeSync, KnownTypeNamesRule, TypeKind, TypePattern, validate } from '../src/index.js'
import type { ResolveInfo, ResolverMap, Schema } from '../src/index.js'

const createSchema = (): Schema => ({
	q: 'Query',
	m: null,
	s: null,
	t: {
		Query: [TypeKind.OBJECT, { hello: [[TypePattern.T, 'String'], null] }, []],
		String: [TypeKind.SCALAR],
	},
})

const recordingResolvers = (infos: ResolveInfo[]): ResolverMap => ({
	Query: {
		hello: (_, __, ___, info) => {
			infos.push(info)
			return 'world'
		},
	},
})

const captureInfo = (schema: Schema, resolvers: ResolverMap, infos: ResolveInfo[]) => {
	executeSync({ schema, resolvers, document: parse('{ hello }') })
	return infos[infos.length - 1]
}

describe('per-schema memoization', () => {
	it('reuses the schema merged with introspection types across executions', () => {
		const schema = createSchema()
		const infos: ResolveInfo[] = []
		const resolvers = recordingResolvers(infos)

		const first = captureInfo(schema, resolvers, infos)
		const second = captureInfo(schema, resolvers, infos)

		expect(first.schema).not.toBe(schema)
		expect(first.schema.t.__Schema).toBeDefined()
		expect(second.schema).toBe(first.schema)
	})

	it('merges a different schema object separately', () => {
		const infos: ResolveInfo[] = []
		const resolvers = recordingResolvers(infos)

		const first = captureInfo(createSchema(), resolvers, infos)
		const second = captureInfo(createSchema(), resolvers, infos)

		expect(second.schema).not.toBe(first.schema)
	})

	it('keeps user resolvers and introspection working when the same resolvers object is reused', async () => {
		const schema = createSchema()
		const resolvers: ResolverMap = { Query: { hello: () => 'world' } }
		const document = parse('{ hello __type(name: "Query") { name } }')

		const first = await execute({ schema, resolvers, document })
		const second = await execute({ schema, resolvers, document })

		expect(first).toEqual({ data: { hello: 'world', __type: { name: 'Query' } } })
		expect(second).toEqual(first)
	})

	it('executes without resolvers', () => {
		const result = executeSync({ schema: createSchema(), document: parse('{ hello }'), rootValue: { hello: 'root' } })

		expect(result).toEqual({ data: { hello: 'root' } })
	})

	it('suggests known type names only for unknown types', () => {
		const schema = createSchema()

		expect(validate(schema, parse('query ($a: String) { hello }'), { rules: [KnownTypeNamesRule] })).toEqual([])
		expect(validate(schema, parse('query ($a: Strin) { hello }'), { rules: [KnownTypeNamesRule] }).map(it => it.message)).toEqual([
			'Unknown type "Strin". Did you mean "String"?',
		])
	})
})
