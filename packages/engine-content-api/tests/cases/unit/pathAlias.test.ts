import { describe, expect, it } from 'bun:test'
import { PathFactory } from '../../../src/mapper/index.js'

describe('select path aliases', () => {
	it('keep engine-owned columns apart from field aliases after truncation', () => {
		const factory = new PathFactory()
		const name = 'p'.repeat(80)
		const internal = factory.create([]).forInternal('predicate').for(name).alias
		const field = factory.create([]).for(name).for(name).alias
		expect(internal.length).toBe(63)
		expect(field.length).toBe(63)
		expect(field).not.toBe(internal)
	})

	it('stay unique within the PostgreSQL byte limit for multi-byte names', () => {
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
