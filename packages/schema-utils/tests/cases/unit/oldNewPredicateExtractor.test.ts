import { expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { OldNewPredicateExtractor } from '../../../src/index.js'

const extractor = new OldNewPredicateExtractor()

test('predicate without markers is returned as-is for both states', () => {
	const def: Acl.PredicateDefinition = { name: 'name_variable' }
	expect(extractor.extract(def, 'old')).toEqual({ name: 'name_variable' })
	expect(extractor.extract(def, 'new')).toEqual({ name: 'name_variable' })
	expect(extractor.extractMerged(def)).toEqual({ name: 'name_variable' })
	expect(extractor.hasStateMarkers(def)).toBe(false)
})

test('extracts old/new transition predicate', () => {
	const def = {
		_old: { state: { eq: 'A' } },
		_new: { state: { eq: 'B' } },
	} as unknown as Acl.PredicateDefinition

	expect(extractor.hasStateMarkers(def)).toBe(true)
	expect(extractor.extract(def, 'old')).toEqual({ state: { eq: 'A' } })
	expect(extractor.extract(def, 'new')).toEqual({ state: { eq: 'B' } })
	expect(extractor.extractMerged(def)).toEqual({ and: [{ state: { eq: 'A' } }, { state: { eq: 'B' } }] })
})

test('combines shared part with marker part via and', () => {
	const def = {
		tenant: 'tenant_variable',
		_new: { state: { eq: 'B' } },
	} as unknown as Acl.PredicateDefinition

	expect(extractor.extract(def, 'old')).toEqual({ tenant: 'tenant_variable' })
	expect(extractor.extract(def, 'new')).toEqual({
		and: [{ tenant: 'tenant_variable' }, { state: { eq: 'B' } }],
	})
})

test('recurses into and chains', () => {
	const def = {
		and: [
			{ tenant: 'tenant_variable' },
			{ _old: { state: { eq: 'A' } }, _new: { state: { eq: 'B' } } },
		],
	} as unknown as Acl.PredicateDefinition

	expect(extractor.extract(def, 'old')).toEqual({
		and: [{ tenant: 'tenant_variable' }, { state: { eq: 'A' } }],
	})
	expect(extractor.extract(def, 'new')).toEqual({
		and: [{ tenant: 'tenant_variable' }, { state: { eq: 'B' } }],
	})
})

test('dropping a marker leaves an empty predicate', () => {
	const def = { _old: { state: { eq: 'A' } } } as unknown as Acl.PredicateDefinition
	expect(extractor.extract(def, 'old')).toEqual({ state: { eq: 'A' } })
	expect(extractor.extract(def, 'new')).toEqual({})
})
