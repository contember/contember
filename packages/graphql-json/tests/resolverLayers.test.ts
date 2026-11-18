import { describe, expect, test } from 'bun:test'
import { parse } from 'graphql'
import { buildSchema, executeSync, type ResolverMap } from '../src/index.js'

const schema = buildSchema(`
	type Query { shared: String, overridden: String, own: String, fromSource: String, item: Item }
	type Item { name: String }
`)

const shared: ResolverMap = {
	Query: { shared: () => 'shared', overridden: () => 'shared', item: () => ({ name: 'source name' }) },
	Item: { name: () => 'shared name' },
}

describe('resolver maps', () => {
	test('several maps are looked up in order, field by field, before the default resolver', () => {
		const own: ResolverMap = { Query: { overridden: () => 'own', own: () => 'own' } }
		const result = executeSync({
			schema,
			document: parse('{ shared overridden own fromSource item { name } }'),
			resolvers: [own, shared],
			rootValue: { fromSource: 'root value' },
		})
		expect(result).toEqual({
			data: { shared: 'shared', overridden: 'own', own: 'own', fromSource: 'root value', item: { name: 'shared name' } },
		})
	})

	test('a single map works as before', () => {
		expect(executeSync({ schema, document: parse('{ overridden }'), resolvers: shared })).toEqual({ data: { overridden: 'shared' } })
	})
})
