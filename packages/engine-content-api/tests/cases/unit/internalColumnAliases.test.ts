import { describe, expect, it } from 'bun:test'
import { PathFactory } from '../../../src/mapper'

describe('internal column aliases', () => {
	const internalAlias = (factory: PathFactory) => factory.create([]).for('rel').forInternal('predicate').for('x').alias

	it('cannot be produced by a single client alias', () => {
		const factory = new PathFactory()
		expect(factory.create([]).for('rel___predicate_x').alias).not.toBe(internalAlias(factory))
	})

	it('cannot be produced by concatenated client aliases', () => {
		const factory = new PathFactory()
		const internal = internalAlias(factory)
		for (const segments of [['rel', '__predicate', 'x'], ['rel_', '_predicate_x'], ['rel', '__predicate_x'], ['rel___predicate', 'x']]) {
			expect(segments.reduce((path, segment) => path.for(segment), factory.create([])).alias).not.toBe(internal)
		}
	})

	it('stays apart from a client alias after truncation', () => {
		const factory = new PathFactory()
		const name = 'p'.repeat(80)
		const internal = factory.create([]).forInternal('predicate').for(name).alias
		const client = factory.create([]).for(`__predicate_${name}`).alias
		expect(internal.length).toBe(63)
		expect(client.length).toBe(63)
		expect(client).not.toBe(internal)
	})

	it('stays unique within the PostgreSQL byte limit for multi-byte names', () => {
		const factory = new PathFactory()
		const name = 'x' + 'é'.repeat(23)
		// 63 and 64 bytes untruncated: PostgreSQL would cut the second to the first
		const first = factory.create([]).forInternal('predicate').for(name).alias
		const second = factory.create([]).forInternal('predicate').for(name + 'x').alias
		const encoder = new TextEncoder()
		expect(encoder.encode(first).length).toBe(63)
		expect(encoder.encode(second).length).toBe(63)
		expect(second).not.toBe(first)
	})
})
