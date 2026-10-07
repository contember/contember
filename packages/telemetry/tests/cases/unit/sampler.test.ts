import { expect, test } from 'bun:test'
import { alwaysSampler, neverSampler, parentRatioSampler, ratioSampler, SpanContext } from '../../../src/index.js'

const traceIdWithPrefix = (prefix: string): string => prefix + '0'.repeat(24)

const parent = (traceFlags: number): SpanContext => ({ traceId: traceIdWithPrefix('7fffffff'), spanId: '00f067aa0ba902b7', traceFlags })

test('always and never samplers ignore the trace id', () => {
	const traceId = traceIdWithPrefix('deadbeef')
	expect(alwaysSampler().shouldSample({ traceId, name: 'a' })).toBe(true)
	expect(neverSampler().shouldSample({ traceId, name: 'a' })).toBe(false)
})

test('ratio sampler decides from all four trace id words', () => {
	const sampler = ratioSampler(0.5)
	expect(sampler.shouldSample({ traceId: traceIdWithPrefix('00000000'), name: 'a' })).toBe(true)
	expect(sampler.shouldSample({ traceId: traceIdWithPrefix('7fffffff'), name: 'a' })).toBe(true)
	expect(sampler.shouldSample({ traceId: traceIdWithPrefix('80000000'), name: 'a' })).toBe(false)
	expect(sampler.shouldSample({ traceId: traceIdWithPrefix('ffffffff'), name: 'a' })).toBe(false)
})

test('ratio sampler mixes the random suffix of timestamp-prefixed trace ids', () => {
	const sampler = ratioSampler(0.5)
	const words = ['68b81c00', '00000000', '00000000', '00000000']
	expect(sampler.shouldSample({ traceId: words.join(''), name: 'base' })).toBe(true)
	for (let index = 1; index < words.length; index++) {
		const changed = [...words]
		changed[index] = '80000000'
		expect(sampler.shouldSample({ traceId: changed.join(''), name: `word-${index}` })).toBe(false)
	}
})

test('ratio sampler is deterministic per trace id', () => {
	const sampler = ratioSampler(0.3)
	for (let i = 0; i < 50; i++) {
		const traceId = traceIdWithPrefix(i.toString(16).padStart(8, '0'))
		const first = sampler.shouldSample({ traceId, name: 'first' })
		expect(sampler.shouldSample({ traceId, name: 'second' })).toBe(first)
		expect(ratioSampler(0.3).shouldSample({ traceId, name: 'third' })).toBe(first)
	}
})

test('ratio sampler clamps the ratio', () => {
	const traceId = traceIdWithPrefix('ffffffff')
	expect(ratioSampler(1).shouldSample({ traceId, name: 'a' })).toBe(true)
	expect(ratioSampler(2).shouldSample({ traceId, name: 'a' })).toBe(true)
	expect(ratioSampler(0).shouldSample({ traceId: traceIdWithPrefix('00000000'), name: 'a' })).toBe(false)
	expect(ratioSampler(-1).shouldSample({ traceId: traceIdWithPrefix('00000000'), name: 'a' })).toBe(false)
})

test('parent ratio sampler follows the parent flag', () => {
	const traceId = traceIdWithPrefix('ffffffff')
	expect(parentRatioSampler(0).shouldSample({ traceId, name: 'a', parent: parent(1) })).toBe(true)
	expect(parentRatioSampler(1).shouldSample({ traceId, name: 'a', parent: parent(0) })).toBe(false)
})

test('parent ratio sampler falls back to the ratio for a root span', () => {
	expect(parentRatioSampler(1).shouldSample({ traceId: traceIdWithPrefix('ffffffff'), name: 'a' })).toBe(true)
	expect(parentRatioSampler(0).shouldSample({ traceId: traceIdWithPrefix('00000000'), name: 'a' })).toBe(false)
})
