import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { hasStateMarkers, parseStatePredicate, resolveOldStateProjection, resolveSingleStatePredicate } from '../../../src/index.js'

const draft = { state: { eq: 'draft' } }
const review = { state: { eq: 'review' } }
const published = { state: { eq: 'published' } }
const owned = { owner: 'person' }

describe('hasStateMarkers', () => {
	test('finds markers inside and/or/not', () => {
		expect(hasStateMarkers({ or: [draft, { not: { _new: review } }] })).toBe(true)
	})

	test('ignores marker-free predicates', () => {
		expect(hasStateMarkers({ or: [draft, { not: review }] })).toBe(false)
	})
})

describe('parseStatePredicate', () => {
	test('a marker-free predicate constrains both rows as a whole', () => {
		const predicate: Acl.PredicateDefinition = { or: [draft, review] }
		expect(parseStatePredicate(predicate)).toEqual({ type: 'both', predicate })
	})

	test('a marker-free or next to a marker stays one both-node, not one per branch', () => {
		expect(parseStatePredicate({ or: [draft, review], _new: published })).toEqual({
			type: 'and',
			operands: [
				{ type: 'both', predicate: { or: [draft, review] } },
				{ type: 'new', predicate: published },
			],
		})
	})

	test('each or branch keeps its own old and new part', () => {
		expect(parseStatePredicate({ or: [{ _old: draft, _new: review }, owned] })).toEqual({
			type: 'or',
			operands: [
				{ type: 'and', operands: [{ type: 'old', predicate: draft }, { type: 'new', predicate: review }] },
				{ type: 'both', predicate: owned },
			],
		})
	})

	test('not keeps its operand states', () => {
		expect(parseStatePredicate({ not: { _old: published } })).toEqual({ type: 'not', operand: { type: 'old', predicate: published } })
	})

	test('throws on a nested marker', () => {
		expect(() => parseStatePredicate({ _old: { _new: draft } })).toThrow('cannot be nested')
	})

	test('throws on a marker that does not hold a predicate object', () => {
		for (const json of ['{ "_new": null }', '{ "and": [{ "_new": null }] }', '{ "or": [{ "_new": null }] }', '{ "not": { "_new": null } }']) {
			const stored: Acl.PredicateDefinition = JSON.parse(json)
			expect(() => parseStatePredicate(stored)).toThrow('"_new" marker must contain a predicate object')
		}
	})
})

describe('resolveSingleStatePredicate', () => {
	test('returns a marker-free predicate unchanged', () => {
		const predicate: Acl.PredicateDefinition = { or: [draft, owned] }
		expect(resolveSingleStatePredicate(predicate)).toBe(predicate)
	})

	test('evaluates both markers against the one row', () => {
		expect(resolveSingleStatePredicate({ or: [{ _old: draft, _new: review }, owned] })).toEqual({
			or: [{ and: [draft, review] }, owned],
		})
	})
})

describe('resolveOldStateProjection', () => {
	test('keeps the old part of each transition and every marker-free part', () => {
		expect(resolveOldStateProjection({ or: [{ _old: draft, _new: review }, { _old: review, _new: published }, owned] })).toEqual({
			or: [draft, review, owned],
		})
	})

	test('a predicate constraining only the new row admits every stored row', () => {
		expect(resolveOldStateProjection({ _new: published })).toEqual({})
	})

	test('negated old part stays, negated new or marker-free part is satisfiable', () => {
		expect(resolveOldStateProjection({ not: { _old: published } })).toEqual({ not: published })
		expect(resolveOldStateProjection({ not: { _new: published } })).toEqual({})
		expect(resolveOldStateProjection({ not: { and: [owned, { _old: published }] } })).toEqual({})
	})
})
